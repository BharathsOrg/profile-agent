"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { toolRenderers } from "@/hooks/useProfileAgentTools";

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="BharathAssistant"
      renderToolCalls={toolRenderers}
    >
      {children}
    </CopilotKit>
  );
}
