"use client";

import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { az } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionTitle } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { formatTime, minutesOf } from "@/lib/format";
import type { CourseSchedule, DayOfWeek } from "@/lib/types";
import { cn } from "@/lib/utils";
import { upcomingLessons } from "./lesson-timeline";

const WEEKDAY_HEAD = ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən", "Baz"];

/**
 * Month view in the reference's manner: today is the orange disc, the rest of this teaching week sits
 * on a pale orange band, and days that carry lessons get a small dot.
 */
export function MonthCalendar({ schedules }: { schedules: CourseSchedule[] }) {
  const today = new Date();
  const [month, setMonth] = useState(() => startOfMonth(today));
  const lessonDays = new Set(schedules.map((s) => s.dayOfWeek));
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const days = eachDayOfInterval({
    start: startOfWeek(month, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const title = format(month, "LLLL yyyy", { locale: az });

  return (
    <section aria-label="Təqvim">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-[1.15rem] font-semibold capitalize">{title}</p>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Əvvəlki ay">
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-primary" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Növbəti ay">
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[0.68rem] font-medium text-muted-foreground">
        {WEEKDAY_HEAD.map((d) => (
          <span key={d} className="pb-2">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[0.8rem]">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);
          const inWeek = day >= weekStart && day <= weekEnd && day.getDay() !== 0;
          const dow = day.getDay() as DayOfWeek;
          const weekIdx = (dow + 6) % 7; // Monday = 0 … Sunday = 6
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "relative flex h-9 items-center justify-center",
                inWeek && inMonth && "bg-primary-soft",
                inWeek && inMonth && weekIdx === 0 && "rounded-l-full",
                inWeek && inMonth && weekIdx === 5 && "rounded-r-full",
              )}
            >
              <span
                className={cn(
                  "relative grid size-8 place-items-center rounded-full font-medium tabular",
                  !inMonth && "text-muted-foreground/45",
                  isToday && "bg-primary font-semibold text-primary-foreground shadow-[0_6px_14px_-6px_var(--primary)]",
                )}
                aria-current={isToday ? "date" : undefined}
              >
                {format(day, "d")}
                {inMonth && !isToday && lessonDays.has(dow) && (
                  <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary/70" />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function dayLabel(offset: number, date: Date) {
  if (offset === 0) return "Bu gün";
  if (offset === 1) return "Sabah";
  return format(date, "d MMM", { locale: az });
}

/** Vertical timeline of the next lessons, like the reference's "Upcoming" list. */
export function UpcomingTimeline({ schedules, loading, showGroup }: { schedules: CourseSchedule[]; loading?: boolean; showGroup?: boolean }) {
  const items = upcomingLessons(schedules, 4);
  return (
    <section>
      <SectionTitle className="mb-4">Yaxınlaşan</SectionTitle>
      {loading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState title="Yaxın dərs yoxdur" />
      ) : (
        <ol className="relative">
          {items.map(({ lesson, date, offset }, i) => (
            <li key={`${lesson.id}-${offset}`} className="relative flex gap-3.5 pb-5 last:pb-0">
              {i < items.length - 1 && <span className="absolute top-3 bottom-0 left-[5px] w-px bg-border" aria-hidden />}
              <span
                className={cn(
                  "relative mt-1.5 size-[11px] shrink-0 rounded-full border-2",
                  i === 0 ? "border-primary bg-primary" : "border-muted-foreground/40 bg-background",
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-[0.86rem] font-semibold">{lesson.courseName}</p>
                  <p className="shrink-0 text-[0.74rem] font-semibold text-primary-ink">{dayLabel(offset, date)}</p>
                </div>
                <p className="truncate text-[0.74rem] text-muted-foreground">
                  {showGroup ? `Qrup ${lesson.groupName}` : lesson.teacherName} · Otaq {lesson.roomCode}
                </p>
                <p className="text-[0.74rem] font-medium text-foreground/75 tabular">
                  {formatTime(lesson.startTime)}–{formatTime(lesson.endTime)} · {minutesOf(lesson.endTime) - minutesOf(lesson.startTime)} dəq
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Right-hand column on wide screens; stacks under the main column below xl. */
export function DashboardRail({ children }: { children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-8 xl:self-start xl:border-l xl:pl-8">{children}</aside>
  );
}
