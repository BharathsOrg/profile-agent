'use client';

import { CopilotChatInput, CopilotSidebar } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { ConversationProvider } from "@elevenlabs/react";
import { CustomAssistantMessage, CustomUserMessage } from "./chat-messages";
import { VoiceMicButton } from "./VoiceAgent";

function VoiceInputButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <div className="flex items-center gap-1">
      <VoiceMicButton />
      <CopilotChatInput.SendButton {...props} />
    </div>
  );
}

export default function CustomCopilotSidebar({ agentId }: { agentId: string }) {
  return (
    <ConversationProvider>
      <CopilotSidebar
        messageView={{
          assistantMessage: CustomAssistantMessage,
          userMessage: CustomUserMessage,
        }}
        agentId={agentId}
        defaultOpen={false}
        width="400px"
        labels={{
          modalHeaderTitle: "Assistant",
          chatInputPlaceholder: "Ask me anything about Bharath's experience...",
        }}
        inputProps={{ sendButton: VoiceInputButton }}
      />
    </ConversationProvider>
  );
}
