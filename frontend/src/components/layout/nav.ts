import {
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FolderOpen,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Library,
  NotebookPen,
  Presentation,
  ShieldCheck,
  Users,
  UsersRound,
  Network,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
  /** Label override per role (e.g. "Qiymətlərim" for students, "Qiymət jurnalı" for staff). */
  titleFor?: Partial<Record<Role, string>>;
}

export interface NavSection {
  label: string;
  items: NavItem[];
  roles?: Role[];
}

export const NAV: NavSection[] = [
  {
    label: "Əsas",
    items: [
      { title: "İdarə paneli", href: "/", icon: LayoutDashboard },
      { title: "Dərs cədvəli", href: "/schedule", icon: CalendarDays },
      {
        title: "Davamiyyət",
        href: "/attendance",
        icon: ClipboardCheck,
        titleFor: { Student: "Davamiyyətim", Teacher: "Davamiyyət jurnalı", Admin: "Davamiyyət jurnalı" },
      },
      {
        title: "Qiymətlər",
        href: "/grades",
        icon: NotebookPen,
        titleFor: { Student: "Qiymətlərim", Teacher: "Qiymət jurnalı", Admin: "Qiymət jurnalı" },
      },
      { title: "Materiallar", href: "/materials", icon: FolderOpen },
    ],
  },
  {
    label: "Akademik struktur",
    roles: ["Admin"],
    items: [
      { title: "Fakültələr", href: "/admin/faculties", icon: Landmark },
      { title: "Kafedralar", href: "/admin/cafedras", icon: Building2 },
      { title: "İxtisaslar", href: "/admin/specialities", icon: GraduationCap },
      { title: "Fənlər", href: "/admin/courses", icon: Library },
      { title: "Semestrlər", href: "/admin/semesters", icon: CalendarClock },
    ],
  },
  {
    label: "İnsanlar və tədris",
    roles: ["Admin"],
    items: [
      { title: "Qruplar", href: "/admin/groups", icon: UsersRound },
      { title: "Tələbələr", href: "/admin/students", icon: Users },
      { title: "Müəllimlər", href: "/admin/teachers", icon: Presentation },
      { title: "Dərs təyinatları", href: "/admin/offerings", icon: Network },
      { title: "Cədvəl slotları", href: "/admin/schedules", icon: CalendarClock },
      { title: "Administratorlar", href: "/admin/administrators", icon: ShieldCheck },
    ],
  },
];

export function findNavTitle(pathname: string, role: Role) {
  for (const section of NAV)
    for (const item of section.items)
      if (item.href === pathname || (item.href !== "/" && pathname.startsWith(item.href)))
        return { section: section.label, title: item.titleFor?.[role] ?? item.title };
  if (pathname.startsWith("/profile")) return { section: "Hesab", title: "Profil" };
  if (pathname.startsWith("/assistant")) return { section: "Əsas", title: "SiriUs — AI köməkçi" };
  return { section: "Əsas", title: "İdarə paneli" };
}
