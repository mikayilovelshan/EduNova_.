"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Chat } from "./chat";

export default function AssistantPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[70vh] rounded-2xl" />}>
      <Chat />
    </Suspense>
  );
}
