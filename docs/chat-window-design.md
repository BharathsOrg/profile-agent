# Chat Window / Sidebar — Design Reference

Use this as a map before making visual changes. Every section names the exact file and prop/class to touch.

---

## 1. Overall Structure

```
ConversationProvider                         ← copilot-sidebar.tsx (ElevenLabs context)
└── CopilotSidebar [data-copilot-sidebar]    ← floating panel anchored right
    ├── CopilotModalHeader                   ← title + close button
    ├── CopilotChatView [data-sidebar-chat]
    │   ├── CopilotChatScrollView            ← scrollable message list
    │   │   ├── feather (gradient fade)      ← decorative top/bottom fades
    │   │   ├── AssistantMessage (×n)        ← CustomAssistantMessage
    │   │   └── UserMessage (×n)             ← CustomUserMessage
    │   ├── CopilotChatSuggestionView        ← suggestion chips
    │   └── InputContainer [data-sidebar-chat]
    │       └── CopilotChatInput
    │           ├── textarea
    │           └── VoiceInputButton         ← our slot override
    │               ├── VoiceMicButton
    │               └── CopilotChatInput.SendButton
    └── CopilotChatToggleButton              ← fixed FAB, bottom-right
```

**Key files:**
- Layout / slots: `src/components/copilot-sidebar.tsx`
- Message bubbles: `src/components/chat-messages.tsx`
- Voice mic: `src/components/VoiceAgent.tsx`

---

## 2. Sidebar Panel

| Property | Current value | How to change |
|---|---|---|
| Width (desktop) | `400px` | `width` prop on `<CopilotSidebar>` |
| Width (mobile <768px) | `100vw` (hardcoded by CopilotKit) | Not overridable via prop; use CSS on `[data-copilot-sidebar]` |
| Height | `100dvh` | CSS on `[data-copilot-sidebar]` |
| Default open | `false` | `defaultOpen` prop |
| Background | `--sidebar` token → white (light) / `#1a1a1a` (dark) | Override `--sidebar` CSS var |
| Side (left/right) | Right (CopilotKit default) | No prop; override via CSS transform |
| Shadow (desktop) | `shadow-xl` + `ring-border/40` | CSS on `[data-copilot-sidebar]` or `md:shadow-xl` class |

---

## 3. Header

**Configured in:** `labels.modalHeaderTitle` prop → `"Assistant"`

| Element | Default style | Slot to override |
|---|---|---|
| Title text | `text-sm font-medium` | `header` prop → `CopilotModalHeader` with custom `titleContent` slot |
| Close button | Icon button, top-right | `header` prop → custom `closeButton` slot |
| Header background | inherits `--background` / `--sidebar` | Wrap `header` slot with custom bg class |

```tsx
// Example: custom header
header={
  <CopilotModalHeader title="Ask about Bharath">
    <CopilotModalHeader.CloseButton className="my-custom-close" />
  </CopilotModalHeader>
}
```

---

## 4. Message List (Scroll Area)

**Slot:** `scrollView` on `CopilotChatViewProps`  
**Padding:** `px-8` (32px) when inside `[data-sidebar-chat]`, `px-6` in popup mode.

| Property | Current value | How to change |
|---|---|---|
| Horizontal padding | 32px (`px-8`) | `inputContainer` slot or CSS on `[data-sidebar-chat]` |
| Scroll behavior | `overflow-y: auto`, `-webkit-overflow-scrolling: touch` on mobile | `scrollView` slot override |
| Gap between messages | CopilotKit default (~`gap-4`) | `scrollView` slot or global CSS |
| Bottom fade ("feather") | Gradient overlay | `feather` slot override (pass `() => null` to remove) |
| Disclaimer text | Small muted text at bottom | `disclaimer` slot (pass `() => null` to remove) |

---

## 5. Assistant Message Bubble

**File:** `src/components/chat-messages.tsx` → `CustomAssistantMessage`

```tsx
<CopilotChatAssistantMessage
  className="rounded-xl bg-white border border-slate-700 px-4 py-3 text-black"
/>
```

| Property | Current value | Notes |
|---|---|---|
| Background | `bg-white` | Change to any bg class or CSS var |
| Border | `border border-slate-700` (1px, #334155) | Remove or change color/width |
| Border radius | `rounded-xl` (12px) | Common alternatives: `rounded-2xl` (16px), `rounded-lg` (8px) |
| Padding | `px-4 py-3` (16px / 12px) | Add more vertical space with `py-4` or `py-5` |
| Text color | `text-black` | |
| Font size | Inherits CopilotKit default `text-sm` (14px) | Override via `className` |
| Max width | Controlled by CopilotKit container (~full width of panel minus padding) | Constrain with `max-w-[85%]` in className |
| Alignment | Left-aligned (CopilotKit default) | |

**Sub-component slots available:**
- `MarkdownRenderer` — swap the markdown renderer entirely
- `Toolbar` — the action bar below the message (copy, thumbs, read-aloud, regenerate)
- Individual toolbar buttons: `CopyButton`, `ThumbsUpButton`, `ThumbsDownButton`, `ReadAloudButton`, `RegenerateButton`

**Thinking block** (collapsible reasoning display):
```tsx
// In ThinkingBlock component (chat-messages.tsx)
<details className="mb-2 text-xs text-slate-500">
  <summary className="... text-slate-400 hover:text-slate-600">Thinking...</summary>
  <pre className="... bg-slate-50 font-mono text-slate-500">...</pre>
</details>
```
Change `text-slate-400` / `bg-slate-50` to restyle the thinking block.

---

## 6. User Message Bubble

**File:** `src/components/chat-messages.tsx` → `CustomUserMessage`

```tsx
<CopilotChatUserMessage
  messageRenderer={{ className: "bg-teal-600 text-white rounded-[18px] px-4 py-1.5" }}
/>
```

| Property | Current value | Notes |
|---|---|---|
| Background | `bg-teal-600` (#0d9488) | The bubble fill color |
| Text color | `text-white` | |
| Border radius | `rounded-[18px]` | Pill shape; use `rounded-2xl` for subtler curve |
| Padding | `px-4 py-1.5` (16px / 6px) | Compact; increase `py` for breathing room |
| Alignment | Right-aligned (CopilotKit default) | |
| Max width | CopilotKit default (~75% of container) | |

**Note:** User bubble color is set on `messageRenderer`, NOT on the outer `className` — the outer className wraps the whole row (including timestamp/toolbar). If you set `className` instead, you'll get a wide background behind the entire row.

**Sub-component slots available:**
- `Container` — the full row wrapper
- `MessageRenderer` — the bubble itself
- `Toolbar` — action bar (copy, edit, branch navigation)
- Individual: `CopyButton`, `EditButton`, `BranchNavigation`

---

## 7. Text Input Area

**Slot override in:** `copilot-sidebar.tsx` via `inputProps={{ sendButton: VoiceInputButton }}`

### Textarea

Default CopilotKit `CopilotChatInput.TextArea`. Override via `inputProps={{ textArea: CustomTextArea }}`.

| Property | Current value | Notes |
|---|---|---|
| Background | `bg-background` (white / dark: `#1f1f1f`) | |
| Border | `border border-border/60` → `oklch(92.2%...)` (light gray) | Focused: `focus-visible:ring-ring` |
| Border radius | `rounded-2xl` approx | |
| Padding | `px-4` (16px) when single line; `py-3` when multiline (`data-multiline`) | Sidebar adds extra `px-8` on the container |
| Placeholder | `"Ask me anything about Bharath's experience..."` | `labels.chatInputPlaceholder` prop |
| Font size | `text-sm` (14px) | |
| Min/max height | Grows with content (auto-resize) | |

### Send Button + Voice Mic (VoiceInputButton)

```tsx
function VoiceInputButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <div className="flex items-center gap-1">
      <VoiceMicButton />                          ← 32×32px, rounded-full
      <CopilotChatInput.SendButton {...props} />  ← CopilotKit default send icon
    </div>
  );
}
```

**VoiceMicButton states:**
| State | Button color | Icon |
|---|---|---|
| Idle | Transparent, gray icon | `<Mic>` |
| Idle hover | `bg-gray-100` | `<Mic>` |
| Connecting | `bg-gray-400` | `<Loader2>` spinning |
| Connected | `bg-red-500` + pulsing ring | `<MicOff>` |

**Other input slots available** (pass via `inputProps`):
- `textArea` — replace the textarea
- `addMenuButton` — the attachment/tools (+) button
- `startTranscribeButton`, `cancelTranscribeButton`, `finishTranscribeButton` — voice transcription flow
- `audioRecorder` — audio waveform during transcription

---

## 8. Suggestion Chips

**Slot:** `suggestionView` on `CopilotChatViewProps`  
**Configured in:** `src/components/chat-suggestions.tsx`

Rendered above the input. Default CopilotKit style: pill-shaped chips with muted background. Override the `suggestionView` slot to fully restyle.

---

## 9. Toggle Button (FAB)

The button that opens/closes the sidebar. Rendered as a fixed FAB by CopilotKit, bottom-right.

| Property | How to change |
|---|---|
| Color | Driven by `--copilot-kit-primary-color` CSS var (set to `#e7330a` in `page.tsx`) |
| Icon | `CopilotChatToggleButton` with `openIcon` / `closeIcon` slots |
| Position | CopilotKit positions it; override with CSS `[data-copilot-toggle]` |

The theme color is set in `page.tsx`:
```tsx
style={{ "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties}
```
`themeColor` defaults to `"#e7330a"` and can be changed by the agent via `setThemeColor` tool.

---

## 10. Design Token Reference

CopilotKit uses these CSS custom properties. Override them on `:root` or a parent element to retheme without touching component code.

### Light mode defaults
```css
--background:        oklch(100% 0 0)      /* pure white — panel/message bg */
--foreground:        oklch(14.5% 0 0)     /* near-black — body text */
--primary:           oklch(20.5% 0 0)     /* almost black — send button */
--primary-foreground:oklch(98.5% 0 0)     /* near-white — send button icon */
--muted:             oklch(97% 0 0)       /* very light gray — secondary bg */
--muted-foreground:  oklch(55.6% 0 0)     /* medium gray — placeholder, timestamps */
--border:            oklch(92.2% 0 0)     /* light gray — input border */
--input:             oklch(92.2% 0 0)     /* same — input bg */
--sidebar:           oklch(98.5% 0 0)     /* near-white — sidebar panel bg */
--accent:            oklch(97% 0 0)       /* hover bg for items */
--accent-foreground: oklch(20.5% 0 0)     /* hover text */
```

### Dark mode defaults (`.dark` class)
```css
--background:        oklch(14.5% 0 0)     /* near-black */
--foreground:        oklch(98.5% 0 0)     /* near-white */
--sidebar:           oklch(20.5% 0 0)     /* dark gray panel */
--muted:             oklch(26.9% 0 0)     /* dark muted bg */
--border:            oklch(26.9% 0 0)     /* dark border */
--input:             oklch(26.9% 0 0)     /* dark input */
```

Hardcoded dark mode backgrounds also used internally:
- Message area: `#1f1f1f`
- Input: `#2f2f2f`
- Input hover: `#303030`
- Send button disabled: `#454545`

---

## 11. Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `< 768px` (mobile) | Sidebar: `width: 100% !important`, full-screen overlay |
| `≥ 768px` (tablet+) | Sidebar: `width: 400px` (our config, default 480px) |
| `≥ 640px` (sm) | Some internal elements switch from `h-8` to `h-4`, `gap-2` to `gap-1.5` |

The `width` prop on `CopilotSidebar` only affects desktop. Mobile is always full-width.

---

## 12. Quick Customization Cheatsheet

| Goal | Where to change |
|---|---|
| Change sidebar width | `width` prop in `copilot-sidebar.tsx` |
| Change assistant bubble color/shape | `className` on `CopilotChatAssistantMessage` in `chat-messages.tsx` |
| Change user bubble color | `messageRenderer.className` on `CopilotChatUserMessage` in `chat-messages.tsx` |
| Change input placeholder | `labels.chatInputPlaceholder` in `copilot-sidebar.tsx` |
| Change header title | `labels.modalHeaderTitle` in `copilot-sidebar.tsx` |
| Change sidebar background | Override `--sidebar` CSS var |
| Restyle input textarea | `inputProps={{ textArea: CustomTextArea }}` in `copilot-sidebar.tsx` |
| Remove feather gradient | `feather={() => null}` prop on `CopilotSidebar` |
| Remove disclaimer | `disclaimer={() => null}` prop on `CopilotSidebar` |
| Change toggle button color | `--copilot-kit-primary-color` in `page.tsx` (or profile theme color) |
| Custom message gap/padding | `inputContainer` slot or CSS on `[data-sidebar-chat]` |
| Full dark mode restyle | Override `.dark` CSS vars on a parent element |
