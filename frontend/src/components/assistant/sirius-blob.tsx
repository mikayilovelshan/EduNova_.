import { cn } from "@/lib/utils";

/**
 * SiriUs, the assistant's face: a soft orange blob with two eyes. `alive` adds the slow morph and a
 * blink; both are dropped for people who prefer reduced motion (see globals.css).
 */
export function SiriusBlob({ className, alive = false }: { className?: string; alive?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-block shrink-0 rounded-full bg-[radial-gradient(circle_at_32%_26%,oklch(0.82_0.13_62),var(--primary)_56%,oklch(0.55_0.19_32))]",
        alive && "animate-blob",
        className,
      )}
    >
      <svg viewBox="0 0 40 40" className="absolute inset-0 size-full">
        <g className={cn("origin-center [transform-box:fill-box]", alive && "animate-blink")} fill="white">
          <rect x="13.2" y="15" width="4.2" height="8" rx="2.1" />
          <rect x="22.6" y="15" width="4.2" height="8" rx="2.1" />
        </g>
      </svg>
    </span>
  );
}
