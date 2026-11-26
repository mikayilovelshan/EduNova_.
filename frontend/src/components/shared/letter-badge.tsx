import { Hourglass } from "lucide-react";
import { LETTER_TONES } from "@/lib/format";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-7 text-sm rounded-lg [&>svg]:size-3.5",
  md: "size-10 text-lg rounded-xl [&>svg]:size-4",
  lg: "size-14 text-2xl rounded-2xl [&>svg]:size-6",
};

export function LetterBadge({ letter, pending, size = "md" }: { letter: string; pending?: boolean; size?: keyof typeof SIZES }) {
  if (pending)
    return (
      <span
        role="img"
        aria-label="Yekun imtahan gözlənilir"
        title="Yekun imtahan hələ keçirilməyib"
        className={cn("grid place-items-center bg-muted text-muted-foreground", SIZES[size])}
      >
        <Hourglass strokeWidth={1.9} />
      </span>
    );
  return (
    <span className={cn("grid place-items-center font-display font-semibold ring-1", LETTER_TONES[letter] ?? LETTER_TONES.F, SIZES[size])}>
      {letter}
    </span>
  );
}
