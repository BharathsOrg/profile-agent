import { CopilotSidebar } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { CustomAssistantMessage, CustomUserMessage } from "./chat-messages";

export default function CustomCopilotSidebar({ agentId }: { agentId: string }) {
  return (
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
    />
  );
}
