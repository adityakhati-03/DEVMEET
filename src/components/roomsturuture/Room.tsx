"use client";

import { ReactNode } from "react";
import { RoomProvider } from "@liveblocks/react/suspense";
import { ClientSideSuspense } from "@liveblocks/react";
import { Loading } from "@/components/Loading";

export function Room({
  children,
  roomId,
}: {
  children: ReactNode;
  roomId: string;
}) {
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
      }}
      initialStorage={{
        language: "javascript",
        input: "",
        output: "",
        isExecuting: false,
        messages: [],
      }}
    >
      <ClientSideSuspense fallback={<Loading />}>
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
