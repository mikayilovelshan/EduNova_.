import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TINT_FIELD, type Tint } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HexIcon } from "./hex-icon";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tint?: Tint;
  loading?: boolean;
  className?: string;
}

/** A pastel figure tile: hexagon mark, the number, and what it counts. */
export function StatCard({ label, value, hint, icon, tint = "peach", loading, className }: StatCardProps) {
  return (
    <div className={cn("flex items-center gap-4 rounded-2xl p-4", TINT_FIELD[tint], className)}>
      <HexIcon icon={icon} tint={tint} />
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-7 w-14 bg-current/10" />
        ) : (
          <p className="font-display text-[1.6rem] leading-none font-semibold tabular text-foreground">{value}</p>
        )}
        <p className="mt-1 truncate text-[0.8rem] font-medium">{label}</p>
        {hint && <p className="truncate text-[0.72rem] opacity-80">{hint}</p>}
      </div>
    </div>
  );
}
