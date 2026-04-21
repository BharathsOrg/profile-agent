import { CopilotSidebar } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";


export default function NewCopilotSidebar({ agentId }: { agentId: string }) {
  return (
    <CopilotSidebar
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
