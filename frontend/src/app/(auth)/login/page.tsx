import { CalendarDays, Code2, NotebookPen, Sigma, Brain } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SiriusBlob } from "@/components/assistant/sirius-blob";
import { Logo } from "@/components/layout/logo";
import { HexIcon } from "@/components/shared/hex-icon";
import { TINT_FIELD, type Tint } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Daxil ol" };

const FEATURES = [
  { icon: CalendarDays, tint: "sky" as Tint, title: "Dərs cədvəli", text: "Həftəlik dərslər, otaq və müəllim bir baxışda." },
  { icon: NotebookPen, tint: "mint" as Tint, title: "Davamiyyət və qiymətlər", text: "Hər fənn üzrə iştirak, kollokvium və imtahan balları." },
];

// Illustrative tiles showing what a student's home looks like; not real data.
const SAMPLE: { name: string; meta: string; icon: typeof Sigma; tint: Tint }[] = [
  { name: "Riyaziyyat", meta: "12/14 dərs", icon: Sigma, tint: "mint" },
  { name: "Proqramlaşdırma", meta: "A · 92 bal", icon: Code2, tint: "butter" },
  { name: "Psixologiya", meta: "Sabah 09:00", icon: Brain, tint: "lavender" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-svh bg-ground lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden flex-col justify-between p-12 lg:flex">
        <Logo />

        <div className="max-w-xl space-y-10">
          <div className="space-y-4">
            <h2 className="title-dot font-display text-[2.6rem] leading-[1.1] font-semibold tracking-[-0.03em]">Empowering the Future of Education</h2>
            <p className="max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
              Tələbələr, müəllimlər və administrasiya üçün dərs cədvəli, davamiyyət, qiymətlər və materiallar — hamısı bir yerdə.
            </p>
          </div>

          <figure className="space-y-3" aria-label="Nümunə görünüş">
            <div className="grid grid-cols-3 gap-3">
              {SAMPLE.map((c, i) => (
                <div
                  key={c.name}
                  className={cn(
                    "flex flex-col items-center gap-2.5 rounded-2xl px-3 pt-4 pb-3.5 text-center shadow-soft",
                    TINT_FIELD[c.tint],
                    i === 1 && "-translate-y-3",
                  )}
                >
                  <HexIcon icon={c.icon} tint={c.tint} />
                  <div>
                    <p className="text-[0.84rem] font-semibold text-foreground">{c.name}</p>
                    <p className="text-[0.7rem]">{c.meta}</p>
                  </div>
                  <span className="rounded-full bg-background px-3 py-1 text-[0.68rem] font-medium text-foreground shadow-soft">Ətraflı</span>
                </div>
              ))}
            </div>
            <figcaption className="text-[0.7rem] text-muted-foreground">Nümunə görünüş</figcaption>
          </figure>

          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-center gap-3.5">
                <HexIcon icon={f.icon} tint={f.tint} size="sm" />
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-[0.8rem] text-muted-foreground">{f.text}</p>
                </div>
              </li>
            ))}
            <li className="flex items-center gap-3.5">
              <SiriusBlob alive className="size-9" />
              <div>
                <p className="text-sm font-semibold">SiriUs — AI köməkçi</p>
                <p className="text-[0.8rem] text-muted-foreground">Qiymətləriniz və cədvəliniz barədə təbii dildə soruşun.</p>
              </div>
            </li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} EduNova · A Unified Academic Management Platform</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-6 lg:py-6 lg:pr-6">
        <div className="flex w-full items-center justify-center rounded-3xl bg-background px-6 py-12 shadow-soft sm:px-10 lg:h-full">
          <div className="w-full max-w-sm">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
