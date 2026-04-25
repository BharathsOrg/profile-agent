"use client";

import {
  CopilotChatAssistantMessage,
  CopilotChatUserMessage,
} from "@copilotkit/react-core/v2";
import type {
  CopilotChatAssistantMessageProps,
  CopilotChatUserMessageProps,
} from "@copilotkit/react-core/v2";
import { useThinking } from "@/contexts/thinking-context";

function ThinkingBlock({ content }: { content: string }) {
  return (
    <details className="mb-2 text-xs text-slate-500">
      <summary className="cursor-pointer select-none font-medium text-slate-400 hover:text-slate-600">
        Thinking...
      </summary>
      <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-slate-50 p-2 font-mono text-slate-500">
        {content}
      </pre>
    </details>
  );
}

// Object.assign attaches the static sub-components (.MarkdownRenderer, .Toolbar, etc.)
// so TypeScript accepts this as `typeof CopilotChatAssistantMessage`.
// The runtime only checks `typeof === "function"` — plain wrapper functions are ignored.
export const CustomAssistantMessage = Object.assign(
  (props: CopilotChatAssistantMessageProps) => {
    const { thinking } = useThinking();
    const reasoningContent = thinking.get(props.message.id);
    return (
      <div className="m-0 p-0">
        {reasoningContent && <ThinkingBlock content={reasoningContent} />}
        <CopilotChatAssistantMessage
          {...props}
          className="rounded-lg rounded-tl-none bg-[#f1f5f9] px-3 py-1 text-[#1b1c1c] text-sm"
        />
      </div>
    );
  },
  {
    MarkdownRenderer: CopilotChatAssistantMessage.MarkdownRenderer,
    Toolbar: CopilotChatAssistantMessage.Toolbar,
    ToolbarButton: CopilotChatAssistantMessage.ToolbarButton,
    CopyButton: CopilotChatAssistantMessage.CopyButton,
    ThumbsUpButton: CopilotChatAssistantMessage.ThumbsUpButton,
    ThumbsDownButton: CopilotChatAssistantMessage.ThumbsDownButton,
    ReadAloudButton: CopilotChatAssistantMessage.ReadAloudButton,
    RegenerateButton: CopilotChatAssistantMessage.RegenerateButton,
  }
) as typeof CopilotChatAssistantMessage;

// The user bubble background is set inside messageRenderer, not on the outer className.
// Override messageRenderer to change the bubble color.
export const CustomUserMessage = Object.assign(
  (props: CopilotChatUserMessageProps) => (
    <CopilotChatUserMessage
      {...props}
      messageRenderer={{ className: "bg-white border border-[#e5e7eb] rounded-lg rounded-tr-none px-3 py-2.5 text-[#1b1c1c] text-sm" }}
    />
  ),
  {
    Container: CopilotChatUserMessage.Container,
    MessageRenderer: CopilotChatUserMessage.MessageRenderer,
    Toolbar: CopilotChatUserMessage.Toolbar,
    ToolbarButton: CopilotChatUserMessage.ToolbarButton,
    CopyButton: CopilotChatUserMessage.CopyButton,
    EditButton: CopilotChatUserMessage.EditButton,
    BranchNavigation: CopilotChatUserMessage.BranchNavigation,
  }
) as typeof CopilotChatUserMessage;
