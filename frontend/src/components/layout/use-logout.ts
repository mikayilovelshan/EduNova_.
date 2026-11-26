"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useLogout() {
  const router = useRouter();
  const client = useQueryClient();

  return useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    client.clear();
    router.replace("/login");
    router.refresh();
  }, [client, router]);
}
