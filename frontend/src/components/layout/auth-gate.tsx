"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/shared/states";
import { useMe, useRole } from "@/lib/queries";
import type { Role } from "@/lib/types";

/** Waits for the current user before rendering the app shell (the API call also validates the session). */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useMe();

  if (isLoading || (!data && !isError))
    return (
      <div className="grid min-h-svh place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Spinner className="size-6 text-primary" />
          Yüklənir...
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="grid min-h-svh place-items-center p-6">
        <EmptyState title="Sessiya təsdiqlənmədi" description="Zəhmət olmasa yenidən daxil olun.">
          <Button asChild>
            <Link href="/login">Daxil ol</Link>
          </Button>
        </EmptyState>
      </div>
    );

  return <>{children}</>;
}

/** Renders children only for the given roles; the API enforces the same rule server-side. */
export function RoleGate({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user } = useRole();
  if (!user?.roles.some((r) => roles.includes(r)))
    return (
      <EmptyState icon={ShieldAlert} title="Giriş icazəniz yoxdur" description="Bu bölmə yalnız səlahiyyətli istifadəçilər üçündür.">
        <Button asChild variant="outline">
          <Link href="/">İdarə panelinə qayıt</Link>
        </Button>
      </EmptyState>
    );
  return <>{children}</>;
}
