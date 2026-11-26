import type { LucideIcon } from "lucide-react";
import { TINT_TEXT, type Tint } from "@/lib/format";
import { cn } from "@/lib/utils";

const HEX = "M20.02 3.3Q24 1 27.98 3.3L39.93 10.2Q43.92 12.5 43.92 17.1L43.92 30.9Q43.92 35.5 39.93 37.8L27.98 44.7Q24 47 20.02 44.7L8.07 37.8Q4.08 35.5 4.08 30.9L4.08 17.1Q4.08 12.5 8.07 10.2Z";

const SIZES = {
  sm: { box: "size-9", icon: "size-4" },
  md: { box: "size-12", icon: "size-5" },
  lg: { box: "size-16", icon: "size-7" },
} as const;

/** A course or category mark: a soft hexagon in the tint's saturated colour with a white line icon. */
export function HexIcon({
  icon: Icon,
  tint,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tint: Tint;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center", SIZES[size].box, TINT_TEXT[tint], className)} aria-hidden>
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full drop-shadow-[0_6px_8px_color-mix(in_oklch,currentColor_35%,transparent)]">
        <path d={HEX} fill="currentColor" />
      </svg>
      <Icon className={cn("relative text-white", SIZES[size].icon)} strokeWidth={2} />
    </span>
  );
}
