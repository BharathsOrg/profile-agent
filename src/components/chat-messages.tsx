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
      <div>
        {reasoningContent && <ThinkingBlock content={reasoningContent} />}
        <CopilotChatAssistantMessage
          {...props}
          className="rounded-xl bg-white border border-slate-700 px-4 py-3 text-black"
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
      messageRenderer={{ className: "bg-teal-600 text-white rounded-[18px] px-4 py-1.5" }}
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
