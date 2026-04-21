import type { Metadata } from "next";

import { CopilotProvider } from "@/components/copilot-provider";
import { Provider } from "@/components/ui/provider";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";

export const metadata: Metadata = {
  title: "Bharath Krishna - AI Profile",
  description:
    "Interactive AI Agent Profile for Bharath Krishna powered by CopilotKit and Google ADK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={"antialiased"}>
        <Provider>
          <CopilotProvider>
            {children}
          </CopilotProvider>
        </Provider>
      </body>
    </html>
  );
}
