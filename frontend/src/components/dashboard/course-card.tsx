"use client";

import {
  BookOpen,
  Brain,
  Calculator,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  GitBranch,
  Globe,
  Globe2,
  Landmark,
  Languages,
  Network,
  Sigma,
  type LucideIcon,
} from "lucide-react";
import { HexIcon } from "@/components/shared/hex-icon";
import { useCourseTint } from "@/components/shared/course-tints";
import { TINT_FIELD } from "@/lib/format";
import { cn } from "@/lib/utils";

/** A subject icon picked from the course name (first match wins); falls back to a book. */
const SUBJECT_ICONS: [RegExp, LucideIcon][] = [
  [/verilənlər bazası|database|sql/, Database],
  [/alqoritm|məlumat strukt|verilənlər strukt/, GitBranch],
  [/veb|web|internet/, Globe],
  [/əməliyyat sistem|arxitektura|aparat/, Cpu],
  [/şəbəkə|network/, Network],
  [/proqram|kompüter|informatika/, Code2],
  [/riyaziyyat|analiz|cəbr|həndəsə|statistika|ehtimal/, Sigma],
  [/fizika|kimya|biologiya|laborator/, FlaskConical],
  [/dil|ingilis|rus|alman|ədəbiyyat/, Languages],
  [/tarix|fəlsəfə|hüquq|siyasət/, Landmark],
  [/iqtisad|mühasib|maliyyə/, Calculator],
  [/psixologiya|pedaqogika|süni intellekt/, Brain],
  [/coğrafiya|ekologiya/, Globe2],
];

export function courseIcon(name: string): LucideIcon {
  const n = name.toLocaleLowerCase("az");
  return SUBJECT_ICONS.find(([re]) => re.test(n))?.[1] ?? BookOpen;
}

/** White pill button sitting on a pastel tile. */
export const pillOnTint = "border-transparent bg-background text-foreground shadow-soft hover:bg-background/85";

/** Pastel course tile in the reference's manner: hexagon mark, name, one status line, one action. */
export function CourseCard({
  name,
  meta,
  children,
  className,
}: {
  name: string;
  meta: React.ReactNode;
  /** The card's action row (pill buttons). */
  children?: React.ReactNode;
  className?: string;
}) {
  const tint = useCourseTint()(name);
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-2xl px-4 pt-5 pb-4 text-center", TINT_FIELD[tint], className)}>
      <HexIcon icon={courseIcon(name)} tint={tint} />
      <div className="min-w-0 space-y-0.5">
        <p className="line-clamp-2 text-[0.92rem] leading-snug font-semibold text-foreground">{name}</p>
        <div className="text-[0.74rem] opacity-85">{meta}</div>
      </div>
      {children && <div className="mt-auto flex w-full flex-wrap justify-center gap-2 pt-1">{children}</div>}
    </div>
  );
}
