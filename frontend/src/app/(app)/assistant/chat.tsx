"use client";

import { RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAssistant } from "@/components/assistant/assistant-context";
import { ChatThread } from "@/components/assistant/chat-thread";
import { SiriusBlob } from "@/components/assistant/sirius-blob";
import { Button } from "@/components/ui/button";

/** Full-page view of the same conversation the floating launcher holds. */
export function Chat() {
  const params = useSearchParams();
  const router = useRouter();
  const { messages, reset, ask } = useAssistant();
  const sentInitial = useRef(false);

  // A prompt passed in the URL (/assistant?q=...) is sent once; the URL is cleaned so a reload does not resend it.
  useEffect(() => {
    const q = params.get("q")?.trim();
    if (!q || sentInitial.current) return;
    sentInitial.current = true;
    ask(q);
    router.replace("/assistant");
  }, [params, ask, router]);

  return (
    <div className="mx-auto flex h-[calc(100svh-9rem)] max-w-4xl flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SiriusBlob alive className="size-12" />
          <div>
            <h1 className="title-dot font-display text-[1.6rem] leading-tight font-semibold">SiriUs</h1>
            <p className="text-xs text-muted-foreground">Şəxsi akademik köməkçiniz · yalnız sizin məlumatlarınızla işləyir</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw data-icon="inline-start" /> Yeni söhbət
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl bg-card shadow-soft ring-1 ring-border">
        <ChatThread />
      </div>
    </div>
  );
}
