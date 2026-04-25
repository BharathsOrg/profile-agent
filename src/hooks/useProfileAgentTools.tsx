"use client";

import { useFrontendTool, defineToolCallRenderer } from "@copilotkit/react-core/v2";
import { z } from "zod";
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
  useFrontendTool({
    name: "updateProfessionalSummary",
    description: "Update the professional summary section with new text.",
    parameters: z.object({
      newSummary: z.string().describe("The new summary text to display."),
    }),
    handler: async ({ newSummary }) => {
      setSummary(newSummary);
    },
  });

  useFrontendTool({
    name: "setThemeColor",
    description: "Change the theme color of the profile page",
    parameters: z.object({
      themeColor: z.string().describe("The theme color to set (hex color code)."),
    }),
    handler: async ({ themeColor }) => {
      console.log("Setting theme color to:", themeColor);
      setThemeColor(themeColor);
    },
  });

  useFrontendTool({
    name: "highlightSection",
    description: "Highlight a specific section of the profile and scroll to it",
    parameters: z.object({
      section: z
        .string()
        .describe(
          "Section to highlight: contact, summary, education, experience, skills, certifications",
        ),
    }),
    handler: async ({ section }) => {
      setHighlightedSection(section);
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        element.classList.add("bg-yellow-50");
        setTimeout(() => {
          setHighlightedSection(null);
          element.classList.remove("bg-yellow-50");
        }, 3000);
      }
    },
  });

  useFrontendTool({
    name: "filterSkills",
    description: "Highlight a specific skill category",
    parameters: z.object({
      category: z.string().describe("Category to highlight"),
    }),
    handler: async ({ category: _category }) => {
      const element = document.getElementById("skills");
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
  });

  useFrontendTool({
    name: "showExperienceDetails",
    description: "Scroll to a specific job position",
    parameters: z.object({
      experienceId: z
        .string()
        .describe("Experience ID to scroll to (exp-1 through exp-7)"),
    }),
    handler: async ({ experienceId }) => {
      const element = document.getElementById(experienceId);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
  });
}

export const toolRenderers = [
  defineToolCallRenderer({
    name: "add_conversation_note",
    args: z.object({ note: z.string() }),
    render: ({ args, status }) => {
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
  }),
  defineToolCallRenderer({
    name: "share_profile",
    args: z.object({ email: z.string(), notes: z.string().optional() }),
    render: ({ args, status }) => {
      if (status === "complete") {
        return (
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm">
            <Mail size={14} className="shrink-0 text-green-500" />
            <span className="text-[#1b1c1c]">
              Sent to{" "}
              <span className="font-medium">{args.email}</span>
              {args.notes && (
                <span className="block text-xs text-[#616365] mt-0.5">{args.notes}</span>
              )}
            </span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f1f5f9] rounded-lg text-sm text-[#616365]">
          {/* TODO: wire --chat-primary to shared theme token */}
          <Mail size={14} className="shrink-0" style={{ color: "var(--chat-primary, #60a5fa)" }} />
          <span>
            Sending to{" "}
            <span className="font-medium text-[#1b1c1c]">{args.email || "your email"}</span>
            …
          </span>
        </div>
      );
    },
  }),
];
