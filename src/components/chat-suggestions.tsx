import { useConfigureSuggestions } from "@copilotkit/react-core/v2";

export function SmartSuggestions() {
  useConfigureSuggestions({
    instructions:
      "Suggest follow-up questions based on the conversation so far. " +
      "Focus on actionable next steps the user might want to take.",
    maxSuggestions: 3,
    minSuggestions: 1,
    available: "after-first-message",
    providerAgentId: "BharathAssistant",
  });

  return null;
}

export function WelcomeSuggestions() {
  useConfigureSuggestions({
    suggestions: [
      {
        title: "Share Profile",
        message:
          "Can you share Bharath's profile with me via email to bharathkrishna87@gmail.com?",
      },
      {
        title: "Experience",
        message: "How many years of experience does Bharath have?",
      },
      {
        title: "Current Role",
        message: "What is Bharath's current position?",
      },
      {
        title: "AgenticAI",
        message: "Tell me about Bharath's AgenticAI work",
      },
      {
        title: "LLM/ML",
        message:
          "What experience does Bharath have with LLMs and ML platforms?",
      },
      {
        title: "Kubernetes",
        message: "Tell me about Bharath's Kubernetes experience",
      },
      {
        title: "Leadership",
        message: "Has Bharath led teams or managed people?",
      },
      {
        title: "Infrastructure",
        message: "What's Bharath's experience with Terraform and Ansible?",
      },
      {
        title: "Education",
        message: "What is Bharath's educational background?",
      },
      {
        title: "Tokyo",
        message: "Tell me about Bharath's experience working in Tokyo",
      },
      {
        title: "Bioinformatics",
        message:
          "How did Bharath transition from bioinformatics to software engineering?",
      },
    ],
    available: "before-first-message",
  });

  return null;
}
