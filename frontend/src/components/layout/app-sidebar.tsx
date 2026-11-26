"use client";

import { GraduationCap, LogOut, Presentation, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { HexIcon } from "@/components/shared/hex-icon";
import { ROLE_LABELS } from "@/lib/format";
import { useRole } from "@/lib/queries";
import { NAV } from "./nav";
import { Logo } from "./logo";
import { useLogout } from "./use-logout";

export function AppSidebar() {
  const pathname = usePathname();
  const { user, primaryRole } = useRole();
  const { setOpenMobile, isMobile } = useSidebar();
  const logout = useLogout();
  const roles = user?.roles ?? [];

  const sections = NAV.filter((s) => !s.roles || s.roles.some((r) => roles.includes(r)));
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const close = () => isMobile && setOpenMobile(false);

  const chip =
    primaryRole === "Student"
      ? { icon: GraduationCap, tint: "lavender" as const, sub: user?.groupCode ? `Qrup ${user.groupCode}` : ROLE_LABELS.Student }
      : primaryRole === "Teacher"
        ? { icon: Presentation, tint: "mint" as const, sub: user?.cafedraName ?? ROLE_LABELS.Teacher }
        : { icon: ShieldCheck, tint: "butter" as const, sub: ROLE_LABELS.Admin };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="gap-5 px-3 pt-5 pb-1">
        <Link href="/" onClick={close} className="rounded-lg px-1.5 group-data-[collapsible=icon]:px-0" aria-label="EduNova — ana səhifə">
          <Logo />
        </Link>
        <Link
          href="/profile"
          onClick={close}
          className="flex items-center gap-3 rounded-2xl bg-sidebar-accent p-2.5 shadow-soft ring-1 ring-sidebar-border transition hover:shadow-lift group-data-[collapsible=icon]:hidden"
        >
          <HexIcon icon={chip.icon} tint={chip.tint} size="sm" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[0.84rem] font-semibold text-foreground">
              {user ? `${user.firstName} ${user.lastName}` : "…"}
            </span>
            <span className="block truncate text-[0.72rem] text-muted-foreground">{chip.sub}</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1.5 pb-6 [mask-image:linear-gradient(to_bottom,black_calc(100%-2rem),transparent)]">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="py-1.5">
            <SidebarGroupLabel className="title-dot h-7 text-[0.8rem] font-semibold text-foreground">{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {section.items.map((item) => {
                  const title = item.titleFor?.[primaryRole] ?? item.title;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={title}
                        className="h-9 rounded-xl px-3 text-[0.84rem] font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground data-[active=true]:bg-primary-soft data-[active=true]:font-semibold data-[active=true]:text-primary-ink [&>svg]:size-[1.1rem]"
                      >
                        <Link href={item.href} onClick={close}>
                          <item.icon strokeWidth={1.9} />
                          <span>{title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-3 pb-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Çıxış"
              className="h-10 rounded-xl px-3 text-[0.84rem] font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive [&>svg]:size-[1.1rem]"
            >
              <LogOut strokeWidth={1.9} />
              <span>Çıxış</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
