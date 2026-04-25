'use client';

import { CopilotChatInput, CopilotSidebar, CopilotPopup } from "@copilotkit/react-core/v2";
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
      <CopilotPopup className="m-0 px-0 py-0"
        messageView={{
          assistantMessage: CustomAssistantMessage,
          userMessage: CustomUserMessage,
        }}
        // agentId={agentId}
        defaultOpen={false}
        width="1000px"
        labels={{
          modalHeaderTitle: "Assistant",
          chatInputPlaceholder: "Ask me about Bharath's experience",
        }}
        clickOutsideToClose={true}
        inputProps={{ sendButton: VoiceInputButton }}
      />
    </ConversationProvider>
  );
}
