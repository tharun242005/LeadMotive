import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import ChatClient from "./chat-client";

export const metadata: Metadata = {
  title: "Property Conversation",
  description:
    "Private AI-powered property conversation. Ask questions in six languages.",
  robots: "noindex, nofollow",
};

// Allow this route to be a blocking dynamic route (not prerendered)
export const instant = false;

// Loading skeleton
function ChatSkeleton() {
  return (
    <div className="flex flex-col h-dvh">
      <div className="h-16 border-b border-[var(--border-color)] bg-[var(--surface)]">
        <div className="flex items-center gap-3 h-full px-6">
          <div className="w-10 h-10 rounded-lg skeleton" />
          <div className="space-y-2">
            <div className="h-4 w-32 skeleton rounded" />
            <div className="h-3 w-48 skeleton rounded" />
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full skeleton mx-auto mb-4" />
          <p className="text-sm text-[var(--foreground-muted)]">
            Verifying your link…
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();

  const { token } = await params;

  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatClient token={token} />
    </Suspense>
  );
}
