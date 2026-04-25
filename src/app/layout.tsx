import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";

import { CopilotProvider } from "@/components/copilot-provider";
import { Provider } from "@/components/ui/provider";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
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
