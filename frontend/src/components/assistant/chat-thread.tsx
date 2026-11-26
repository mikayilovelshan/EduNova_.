"use client";

import { ArrowUp, CalendarDays, ClipboardCheck, NotebookPen, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { formatDate, initials } from "@/lib/format";
import { useRole } from "@/lib/queries";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAssistant } from "./assistant-context";
import { SiriusBlob } from "./sirius-blob";

const SUGGESTIONS = {
  Student: [
    { icon: NotebookPen, text: "Bütün fənlər üzrə cari ballarımı cədvəl şəklində göstər" },
    { icon: ClipboardCheck, text: "Hansı fəndən ən çox qayıbım var?" },
    { icon: CalendarDays, text: "Sabah hansı dərslərim var?" },
    { icon: Sparkles, text: "Fənni keçmək üçün imtahandan ən azı neçə bal lazımdır?" },
  ],
  Teacher: [
    { icon: CalendarDays, text: "Bu həftəki dərslərimi gün üzrə sırala" },
    { icon: NotebookPen, text: "Hansı fənləri və qrupları tədris edirəm?" },
    { icon: ClipboardCheck, text: "Qiymətləndirmə sistemini qısaca izah et" },
    { icon: Sparkles, text: "Hansı fənlərə material yüklənib?" },
  ],
  Admin: [
    { icon: CalendarDays, text: "Aktiv semestrdə neçə dərs təyinatı var?" },
    { icon: NotebookPen, text: "Qiymətləndirmə qaydalarını izah et" },
    { icon: ClipboardCheck, text: "Ən çox dərsi olan gün hansıdır?" },
    { icon: Sparkles, text: "Hansı müəllimlər hansı fənləri tədris edir?" },
  ],
};

/** The conversation and its composer; fills its container. Used by the floating panel and the full page. */
export function ChatThread({ compact = false }: { compact?: boolean }) {
  const { user, primaryRole } = useRole();
  const { messages, pending, ask } = useAssistant();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  const submit = (text: string) => {
    if (!text.trim() || pending) return;
    ask(text);
    setInput("");
  };

  const suggestions = SUGGESTIONS[primaryRole].slice(0, compact ? 3 : 4);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", compact ? "px-4 py-4" : "px-4 py-6 sm:px-8")}>
        {messages.length === 0 ? (
          <div className={cn("flex min-h-full flex-col gap-5", compact ? "justify-start pt-1" : "items-center justify-center text-center")}>
            <div className="space-y-1.5">
              <p className={cn("font-display font-semibold", compact ? "text-lg" : "text-[1.5rem]")}>Salam, {user?.firstName}!</p>
              <p className={cn("text-[0.84rem] leading-relaxed text-muted-foreground", !compact && "mx-auto max-w-md")}>
                Qiymətləriniz, davamiyyətiniz, dərs cədvəliniz və materiallar haqqında soruşun. Cavablar yalnız sizin məlumatlarınıza əsaslanır.
              </p>
            </div>
            <div className={cn("grid w-full gap-2", !compact && "max-w-2xl sm:grid-cols-2")}>
              {suggestions.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => submit(s.text)}
                  className="group flex items-center gap-3 rounded-xl border bg-background px-3 py-2.5 text-left text-[0.82rem] leading-snug transition hover:border-primary/40 hover:bg-primary-soft"
                >
                  <s.icon className="size-4 shrink-0 text-primary" />
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((m, i) => (
              <Message key={i} message={m} userInitials={initials(user?.firstName, user?.lastName)} compact={compact} />
            ))}
            {pending && (
              <div className="flex gap-2.5" role="status" aria-label="SiriUs cavab yazır">
                <SiriusBlob className="size-7" />
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-muted px-4 py-3">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="size-1.5 animate-pulse rounded-full bg-primary" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className={cn("border-t", compact ? "p-3" : "p-3 sm:p-4")}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <InputGroup className="rounded-2xl bg-background">
            <InputGroupTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              placeholder="Sualınızı yazın…"
              aria-label="Sual"
              rows={1}
              className="max-h-32 min-h-10 text-[0.86rem]"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="submit"
                size="icon-sm"
                variant="default"
                className="rounded-full"
                disabled={!input.trim() || pending}
                aria-label="Göndər"
              >
                <ArrowUp />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
        <p className="mt-2 text-center text-[0.66rem] text-muted-foreground">
          SiriUs səhv edə bilər. Rəsmi nəticələr üçün qiymət jurnalını yoxlayın.
        </p>
      </div>
    </div>
  );
}

function Message({ message, userInitials, compact }: { message: ChatMessage; userInitials: string; compact: boolean }) {
  const mine = message.role === "user";
  return (
    <div className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
      {mine ? (
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="bg-butter text-[0.66rem] font-semibold text-butter-ink">{userInitials}</AvatarFallback>
        </Avatar>
      ) : (
        <SiriusBlob className="size-7" />
      )}
      <div className={cn("min-w-0 space-y-1", compact ? "max-w-[82%]" : "max-w-[85%]", mine && "text-right")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-[0.86rem] leading-relaxed",
            mine ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md bg-muted text-foreground",
          )}
        >
          {mine ? (
            <p className="text-left whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat text-left">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <p className="px-1 text-[0.64rem] text-muted-foreground">{formatDate(message.timestamp, "HH:mm")}</p>
      </div>
    </div>
  );
}
