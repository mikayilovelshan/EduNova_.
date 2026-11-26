"use client";

import { BookOpen, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useOfferings, useRole } from "@/lib/queries";
import { NAV } from "./nav";

/** Search field in the header: jump to any page or course. Opens with Ctrl/⌘ + K. */
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, primaryRole, isStudent } = useRole();
  const { data: offerings } = useOfferings();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const roles = user?.roles ?? [];
  const pages = NAV.filter((s) => !s.roles || s.roles.some((r) => roles.includes(r))).flatMap((s) =>
    s.items.map((i) => ({ ...i, title: i.titleFor?.[primaryRole] ?? i.title, section: s.label })),
  );

  const courses = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; meta: string }>();
    for (const o of offerings ?? [])
      if (!seen.has(`${o.courseName}-${o.groupCode}`))
        seen.set(`${o.courseName}-${o.groupCode}`, { id: o.id, name: o.courseName, meta: isStudent ? o.teacherName : `Qrup ${o.groupCode}` });
    return [...seen.values()];
  }, [offerings, isStudent]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-56 items-center gap-2 rounded-full bg-muted/70 px-3.5 text-[0.8rem] text-muted-foreground transition hover:bg-muted md:flex xl:w-64"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Axtar…</span>
        <Kbd className="hidden lg:inline-flex">Ctrl K</Kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted md:hidden"
        aria-label="Axtar"
      >
        <Search className="size-4" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Axtarış" description="Səhifə və ya fənn axtarın">
        <CommandInput placeholder="Səhifə və ya fənn adı…" />
        <CommandList>
          <CommandEmpty>Heç nə tapılmadı.</CommandEmpty>
          <CommandGroup heading="Səhifələr">
            {pages.map((p) => (
              <CommandItem key={p.href} value={`${p.title} ${p.section}`} onSelect={() => go(p.href)}>
                <p.icon />
                {p.title}
              </CommandItem>
            ))}
          </CommandGroup>
          {courses.length > 0 && (
            <CommandGroup heading="Fənlər">
              {courses.map((c) => (
                <CommandItem key={c.id} value={`${c.name} ${c.meta}`} onSelect={() => go(isStudent ? "/grades" : `/grades?offering=${c.id}`)}>
                  <BookOpen />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.meta}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
