"use client";

import { useFrontendTool, useRenderToolCall } from "@copilotkit/react-core";
import { CheckCircle, Mail } from "lucide-react";

interface ProfileAgentToolsOptions {
  setSummary: (s: string) => void;
  setThemeColor: (c: string) => void;
  setHighlightedSection: (s: string | null) => void;
}

export function useProfileAgentTools({
  setSummary,
  setThemeColor,
  setHighlightedSection,
}: ProfileAgentToolsOptions) {
  // Frontend tool: Update professional summary
  useFrontendTool({
    name: "updateProfessionalSummary",
    description: "Update the professional summary section with new text.",
    parameters: [
      {
        name: "newSummary",
        description: "The new summary text to display.",
        required: true,
      },
    ],
    handler: ({ newSummary }: { newSummary: string }) => {
      setSummary(newSummary);
    },
  } as any);

  // Frontend tool: Set theme color
  useFrontendTool({
    name: "setThemeColor",
    description: "Change the theme color of the profile page",
    parameters: [
      {
        name: "themeColor",
        description: "The theme color to set (hex color code).",
        required: true,
      },
    ],
    handler({ themeColor }: { themeColor: string }) {
      setThemeColor(themeColor);
    },
  } as any);

  // Frontend tool: Highlight section
  useFrontendTool({
    name: "highlightSection",
    description: "Highlight a specific section of the profile and scroll to it",
    parameters: [
      {
        name: "section",
        description:
          "Section to highlight: contact, summary, education, experience, skills, certifications",
        required: true,
      },
    ],
    handler({ section }: { section: string }) {
      setHighlightedSection(section);
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        // Add a temporary flash effect class
        element.classList.add("bg-yellow-50");
        setTimeout(() => {
          setHighlightedSection(null);
          element.classList.remove("bg-yellow-50");
        }, 3000);
      }
    },
  } as any);

  // Frontend tool: Filter skills
  useFrontendTool({
    name: "filterSkills",
    description: "Highlight a specific skill category",
    parameters: [
      {
        name: "category",
        description: "Category to highlight",
        required: true,
      },
    ],
    handler({ category }: { category: string }) {
      const element = document.getElementById("skills");
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
  } as any);

  // Frontend tool: Expand experience details
  useFrontendTool({
    name: "showExperienceDetails",
    description: "Scroll to a specific job position",
    parameters: [
      {
        name: "experienceId",
        description: "Experience ID to scroll to (exp-1 through exp-7)",
        required: true,
      },
    ],
    handler({ experienceId }: { experienceId: string }) {
      const element = document.getElementById(experienceId);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
  } as any);

  // Generative UI: Render conversation notes
  useRenderToolCall({
    name: "add_conversation_note",
    description: "Add a note about the current conversation",
    parameters: [],
    render: ({ args, status }: any) => {
      if (status === "complete") {
        return (
          <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <CheckCircle
                size={18}
                className="text-green-600 mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-base font-semibold text-green-800">
                  Note Added
                </p>
                <p className="text-base text-gray-700 mt-1">{args.note}</p>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="p-3 bg-gray-50 rounded-lg mb-4">
          <p className="text-base text-gray-500">Adding note...</p>
        </div>
      );
    },
  });

  // Generative UI: Render profile shared confirmation
  useRenderToolCall({
    name: "share_profile",
    description: "Share Bharath's profile via email",
    parameters: [],
    render: ({ args, status }: any) => {
      if (status === "in-progress") {
        return (
          <div className="p-3 bg-blue-50 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <Mail size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-base font-semibold text-blue-800">
                  Sharing Profile
                </p>
                <p className="text-base text-gray-500 mt-1">
                  Sending to {args.email || "your email"}...
                </p>
              </div>
            </div>
          </div>
        );
      }
      if (status === "complete") {
        return (
          <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <Mail size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-base font-semibold text-blue-800">
                  Profile Shared
                </p>
                <p className="text-base text-gray-700 mt-1">
                  Sent to <span className="font-medium">{args.email}</span>
                  {args.notes && (
                    <span className="block text-sm text-gray-500 mt-0.5">
                      Note: {args.notes}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="p-3 bg-gray-50 rounded-lg mb-4">
          <p className="text-base text-gray-500">Sending profile...</p>
        </div>
      );
    },
  });
}
