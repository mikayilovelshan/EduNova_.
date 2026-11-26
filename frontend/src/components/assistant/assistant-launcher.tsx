"use client";

import { Maximize2, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAssistant } from "./assistant-context";
import { ChatThread } from "./chat-thread";
import { SiriusBlob } from "./sirius-blob";

/** How long the page has to sit still before SiriUs offers help. */
const IDLE_MS = 7000;

/** Shows the greeting bubble after a stretch of inactivity; any real interaction hides it again. */
function useIdleBubble(enabled: boolean) {
  const [idle, setIdle] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!enabled || dismissed) return;
    let timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    const restart = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    };
    // Pointer movement only postpones the bubble so it never vanishes while the cursor travels to it;
    // typing, scrolling and clicking elsewhere mean the person is busy, so it steps aside.
    const busy = () => {
      setIdle(false);
      restart();
    };
    const opts = { passive: true } as const;
    window.addEventListener("pointermove", restart, opts);
    window.addEventListener("keydown", busy, opts);
    window.addEventListener("wheel", busy, opts);
    window.addEventListener("touchstart", busy, opts);
    window.addEventListener("pointerdown", busy, opts);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", restart);
      window.removeEventListener("keydown", busy);
      window.removeEventListener("wheel", busy);
      window.removeEventListener("touchstart", busy);
      window.removeEventListener("pointerdown", busy);
    };
  }, [enabled, dismissed]);

  return { show: enabled && !dismissed && idle, dismiss: () => setDismissed(true) };
}

export function AssistantLauncher() {
  const pathname = usePathname();
  const { open, setOpen, messages, reset } = useAssistant();
  const onAssistantPage = pathname.startsWith("/assistant");
  const bubble = useIdleBubble(!open && !onAssistantPage);

  if (onAssistantPage) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="fixed right-4 bottom-4 z-40 flex items-end gap-3 sm:right-6 sm:bottom-6">
        {bubble.show && (
          <div className="animate-bubble-in relative mb-2 flex items-center gap-1 rounded-2xl rounded-br-md bg-popover py-2 pr-1.5 pl-4 text-[0.84rem] font-medium text-popover-foreground shadow-lift ring-1 ring-border">
            <button type="button" className="text-left outline-none focus-visible:underline" onClick={() => setOpen(true)}>
              Sizə necə kömək edə bilərəm?
            </button>
            <button
              type="button"
              onClick={bubble.dismiss}
              className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Bağla"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <PopoverAnchor asChild>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={open ? "SiriUs köməkçini bağla" : "SiriUs AI köməkçini aç"}
            className={cn(
              "group relative grid size-15 place-items-center rounded-full outline-none",
              "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.06] active:scale-95",
              "focus-visible:ring-4 focus-visible:ring-ring/40",
            )}
          >
            <span className="absolute inset-1 rounded-full bg-primary/30 blur-md transition-opacity group-hover:opacity-100 sm:opacity-80" />
            <SiriusBlob alive className="size-15 shadow-[0_10px_24px_-8px_var(--primary)]" />
          </button>
        </PopoverAnchor>
      </div>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={14}
        collisionPadding={16}
        aria-label="SiriUs AI köməkçi"
        onInteractOutside={(e) => e.preventDefault()}
        className="flex h-[min(36rem,calc(100svh-7.5rem))] w-[min(25rem,calc(100vw-2rem))] flex-col gap-0 overflow-hidden rounded-3xl p-0 shadow-lift"
      >
        <div className="flex items-center gap-3 border-b bg-primary-soft/60 px-4 py-3">
          <SiriusBlob className="size-9" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="font-display text-[0.95rem] font-semibold">SiriUs</p>
            <p className="truncate text-[0.7rem] text-muted-foreground">AI köməkçi · yalnız sizin məlumatlarınızla</p>
          </div>
          {messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={reset} aria-label="Yeni söhbət">
                  <RotateCcw />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Yeni söhbət</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon-sm">
                <Link href="/assistant" onClick={() => setOpen(false)} aria-label="Tam ekranda aç">
                  <Maximize2 />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tam ekranda aç</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Bağla">
            <X />
          </Button>
        </div>
        <ChatThread compact />
      </PopoverContent>
    </Popover>
  );
}
