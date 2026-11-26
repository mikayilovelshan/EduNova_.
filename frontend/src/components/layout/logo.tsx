export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="10" className="fill-primary" />
        <path d="M6.5 13.2 16 8.5l9.5 4.7L16 18l-9.5-4.8Z" fill="white" />
        <path d="M10.5 15.6v4.2c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.2L16 18.4l-5.5-2.8Z" fill="white" fillOpacity=".75" />
      </svg>
      {!compact && <span className="title-dot font-display text-[1.3rem] font-semibold tracking-[-0.02em] text-foreground">EduNova</span>}
    </span>
  );
}
