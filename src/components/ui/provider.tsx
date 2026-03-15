"use client";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";

const system = createSystem(defaultConfig, {
  preflight: false,
});

export function Provider({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
