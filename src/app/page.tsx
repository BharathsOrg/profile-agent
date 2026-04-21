"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useAgent, useCopilotKit, CopilotSidebar, useSuggestions } from "@copilotkit/react-core/v2";
import { SmartSuggestions, WelcomeSuggestions } from "@/components/chat-suggestions";
import { CopilotKitCSSProperties } from "@copilotkit/react-ui";
import { useState, useEffect } from "react";
import { AgentState } from "@/lib/types";
import { useProfileAgentTools } from "@/hooks/useProfileAgentTools";
import NewCopilotSidebar from "@/components/copilot-sidebar";
import { ProfilePageContent } from "@/components/profile-page-content";

const INITIAL_SUMMARY =
  "Full stack engineer with 15+ years of experience building AgenticAI solutions and HPC clusters for LLM/ML training. Expert in LLMOps pipelines, high-availability model serving, and RESTful API development. Proven track record in Kubernetes (CKA), Infrastructure-as-Code (Terraform/Ansible), and managing software development from inception to production.";

export default function ProfilePage() {
  const { suggestions, isLoading } = useSuggestions();
  const [themeColor, setThemeColor] = useState("#2c3e50"); // Darker default from reference
  const [highlightedSection, setHighlightedSection] = useState<string | null>(
    null,
  );
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [llmStatus, setLlmStatus] = useState<"checking" | "ok" | "error">(
    "checking",
  );
  const [llmError, setLlmError] = useState<string | null>(null);
  const [showUsage, setShowUsage] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareStatus, setShareStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const { agent } = useAgent({ agentId: "BharathAssistant" });
  const { copilotkit } = useCopilotKit();

  // Build health check URL based on current host
  // const getHealthUrl = () => {
  //   if (typeof window === "undefined") return "https://agent.krishb.in/health";
  //   const host = window.location.hostname;
  //   return `https://agent.krishb.in/health`;
  // };

  // Health check on mount and periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(getHealthUrl(), {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        const data = await response.json();
        if (data.llm === "ok" || data.llm === "native_gemini") {
          setLlmStatus("ok");
          setLlmError(null);
        } else {
          setLlmStatus("error");
          setLlmError(data.llm || "LLM service unavailable");
        }
      } catch (err) {
        setLlmStatus("error");
        setLlmError("Cannot connect to agent service");
      }
    };

    checkHealth();
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const retryConnection = async () => {
    setLlmStatus("checking");
    try {
      const response = await fetch(getHealthUrl(), {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      if (data.llm === "ok" || data.llm === "native_gemini") {
        setLlmStatus("ok");
        setLlmError(null);
      } else {
        setLlmStatus("error");
        setLlmError(data.llm || "LLM service unavailable");
      }
    } catch (err) {
      setLlmStatus("error");
      setLlmError("Cannot connect to agent service");
    }
  };

  const handleShareProfile = async () => {
    if (!shareEmail) return;
    setShareStatus("sending");
    try {
      const res = await fetch("/api/share-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail }),
      });
      if (!res.ok) throw new Error("failed");
      setShareStatus("sent");
      setShareEmail("");
      setTimeout(() => setShowShareMenu(false), 1500);
    } catch {
      setShareStatus("error");
    }
  };

  useCopilotReadable({
    description:
      "The professional summary displayed on the profile page. Use this to understand Bharath's background.",
    value: summary,
  });

  // Register all frontend tools
  useProfileAgentTools({ setSummary, setThemeColor, setHighlightedSection });

  const handleAsk = (question: string) => {
    agent.addMessage({
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: question,
    });
    copilotkit.runAgent({ agent });
  };

  return (
    <main
      style={
        { "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties
      }
    >
      <ProfilePageContent
        agentState={agent.state as AgentState}
        summary={summary}
        showUsage={showUsage}
        setShowUsage={setShowUsage}
        showShareMenu={showShareMenu}
        setShowShareMenu={setShowShareMenu}
        shareEmail={shareEmail}
        setShareEmail={setShareEmail}
        shareStatus={shareStatus}
        handleShareProfile={handleShareProfile}
        handleAsk={handleAsk}
      />
      {/* <CopilotSidebar
        agentId="BharathAssistant"
        defaultOpen={false}
        labels={{ modalHeaderTitle: "Assistant" }}
      /> */}
      <SmartSuggestions />
      <WelcomeSuggestions />
      <NewCopilotSidebar agentId="BharathAssistant" />
    </main>
  );
}
