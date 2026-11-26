import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="title-dot font-display text-[1.6rem] leading-tight font-semibold text-foreground sm:text-[1.85rem]">{title}</h1>
        {description && <p className="max-w-2xl text-[0.86rem] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Section title inside a page, with the signature orange full stop. */
export function SectionTitle({ children, className, as: Tag = "h2" }: { children: React.ReactNode; className?: string; as?: "h2" | "h3" }) {
  return <Tag className={cn("title-dot font-display text-[1.2rem] leading-tight font-semibold", className)}>{children}</Tag>;
}
