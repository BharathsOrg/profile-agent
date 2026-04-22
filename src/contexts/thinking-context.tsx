"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ThinkingContextType {
  thinking: Map<string, string>;
  bindThinking: (textMessageId: string, content: string) => void;
}

const ThinkingContext = createContext<ThinkingContextType | null>(null);

export function ThinkingProvider({ children }: { children: React.ReactNode }) {
  const [thinking, setThinking] = useState<Map<string, string>>(new Map());

  const bindThinking = useCallback((textMessageId: string, content: string) => {
    setThinking((prev) => new Map(prev).set(textMessageId, content));
  }, []);

  return (
    <ThinkingContext.Provider value={{ thinking, bindThinking }}>
      {children}
    </ThinkingContext.Provider>
  );
}

export function useThinking() {
  const ctx = useContext(ThinkingContext);
  if (!ctx) throw new Error("useThinking must be used inside ThinkingProvider");
  return ctx;
}
