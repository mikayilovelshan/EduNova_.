"use client";

import { ChevronDown, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, initials, ROLE_LABELS } from "@/lib/format";
import { useActiveSemester, useRole } from "@/lib/queries";
import { HeaderSearch } from "./header-search";
import { findNavTitle } from "./nav";
import { useLogout } from "./use-logout";

export function AppHeader() {
  const pathname = usePathname();
  const { user, primaryRole } = useRole();
  const { data: semester } = useActiveSemester();
  const { resolvedTheme, setTheme } = useTheme();
  const logout = useLogout();
  const crumb = findNavTitle(pathname, primaryRole);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 rounded-t-2xl bg-background/85 px-4 backdrop-blur-md md:px-8">
      <SidebarTrigger className="-ml-1.5 rounded-full text-muted-foreground" />
      <p className="truncate text-[0.82rem] text-muted-foreground">
        <span className="hidden md:inline">{crumb.section} / </span>
        <span className="font-semibold text-foreground">{crumb.title}</span>
      </p>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
        <HeaderSearch />
        {semester && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="hidden items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-ink sm:inline-flex">
                <span className="size-1.5 rounded-full bg-primary" />
                {semester.name}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Aktiv semestr: {formatDate(semester.startDate)} – {formatDate(semester.endDate)}
            </TooltipContent>
          </Tooltip>
        )}
        <span className="hidden text-xs text-muted-foreground lg:inline">{formatDate(new Date(), "EEEE, d MMMM")}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label={resolvedTheme === "dark" ? "İşıqlı mövzuya keç" : "Qaranlıq mövzuya keç"}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Sun className="hidden dark:block" />
          <Moon className="dark:hidden" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="Hesab menyusu"
            >
              <Avatar className="size-9">
                <AvatarFallback className="bg-butter text-[0.78rem] font-semibold text-butter-ink">
                  {initials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="size-4 text-primary" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-xl">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-semibold">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              <p className="mt-1 text-[0.7rem] font-medium text-primary-ink">{ROLE_LABELS[primaryRole]}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserRound /> Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={logout}>
              <LogOut /> Çıxış
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="mt-auto px-4 py-5 text-[0.72rem] text-muted-foreground md:px-8">
      © {new Date().getFullYear()} <span className="font-semibold text-foreground/80">EduNova</span> · A Unified Academic Management Platform
    </footer>
  );
}
