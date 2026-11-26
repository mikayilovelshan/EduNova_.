"use client";

import { useMutation } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useRole } from "@/lib/queries";
import type { ChatMessage } from "@/lib/types";

interface AssistantState {
  messages: ChatMessage[];
  pending: boolean;
  /** Send a question; the conversation so far travels with it as history. */
  ask: (text: string) => void;
  reset: () => void;
  /** Whether the floating chat panel is open. */
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AssistantContext = createContext<AssistantState | null>(null);

const storageKey = (userId?: string) => `ulms-chat-${userId ?? "anon"}`;

function loadHistory(userId?: string): ChatMessage[] {
  try {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(storageKey(userId)) : null;
    return saved ? (JSON.parse(saved) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

/**
 * One conversation per signed-in user and browser tab, shared by the floating launcher and the full
 * /assistant page, so a chat started in the corner continues when expanded.
 */
export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useRole();
  // AuthGate renders children only once the user is known, so the id is stable here.
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory(user?.id));
  const [open, setOpen] = useState(false);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    try {
      sessionStorage.setItem(storageKey(user?.id), JSON.stringify(messages));
    } catch {
      /* storage unavailable */
    }
  }, [messages, user?.id]);

  const send = useMutation({
    mutationFn: (payload: { message: string; history: ChatMessage[] }) =>
      api<{ reply: string; timestamp: string }>("api/Chat/send", {
        method: "POST",
        body: { message: payload.message, history: payload.history.map(({ role, content }) => ({ role, content })) },
      }),
    onSuccess: (res) => setMessages((m) => [...m, { role: "assistant", content: res.reply, timestamp: res.timestamp }]),
    onError: (e) =>
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${errorMessage(e)}`, timestamp: new Date().toISOString() }]),
  });
  const { mutate, isPending } = send;

  const ask = useCallback(
    (text: string) => {
      const message = text.trim();
      if (!message || isPending) return;
      const history = messagesRef.current;
      setMessages((m) => [...m, { role: "user", content: message, timestamp: new Date().toISOString() }]);
      mutate({ message, history });
    },
    [isPending, mutate],
  );

  const reset = useCallback(() => setMessages([]), []);

  const value = useMemo(
    () => ({ messages, pending: isPending, ask, reset, open, setOpen }),
    [messages, isPending, ask, reset, open],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used inside AssistantProvider");
  return ctx;
}
