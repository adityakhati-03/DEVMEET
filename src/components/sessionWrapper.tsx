// app/session-wrapper.tsx or components/session-wrapper.tsx

"use client"; // Required for client-side SessionProvider

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

type SessionWrapperProps = {
  children: ReactNode;
};

const SessionWrapper = ({ children }: SessionWrapperProps) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default SessionWrapper;
