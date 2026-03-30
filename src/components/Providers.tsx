"use client";

import { LiveblocksProvider } from "@liveblocks/react";
import { PropsWithChildren } from "react";

export function Providers({ children }: PropsWithChildren) {
  return (
    <LiveblocksProvider authEndpoint={authFetcher}>
      {children}
    </LiveblocksProvider>
  );
}

// ✅ Define the expected result shape
type CustomAuthenticationResult = {
  token: string;
  actor: number;
};

async function authFetcher(room?: string): Promise<CustomAuthenticationResult> {
  const res = await fetch("/api/liveblocks-auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Optional, useful if cookies are needed
    body: JSON.stringify({ room }), // Optional: send room ID
  });

  if (!res.ok) {
    throw new Error("Liveblocks auth failed");
  }

  return await res.json();
}
