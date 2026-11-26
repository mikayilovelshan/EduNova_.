"use client";

import { CalendarDays, DoorOpen, LayoutGrid, List, UserRound, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { sortByTime } from "@/components/dashboard/lesson-timeline";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { useCourseTint } from "@/components/shared/course-tints";
import { DAY_NAMES, formatTime, minutesOf, TINT_FIELD, TINT_MARK, WEEK_DAYS } from "@/lib/format";
import { useRole, useSchedules } from "@/lib/queries";
import type { CourseSchedule, DayOfWeek } from "@/lib/types";
import { cn } from "@/lib/utils";

const HOUR_PX = 64;

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function SchedulePage() {
  const { data, isLoading, error } = useSchedules();
  const { isStudent, isAdmin } = useRole();
  const [view, setView] = useState<"grid" | "list">("grid");
  const now = useNow();
  const today = now.getDay() as DayOfWeek;

  const schedules = useMemo(() => data ?? [], [data]);
  const days = useMemo(
    () => WEEK_DAYS.filter((d) => d !== 6 || schedules.some((s) => s.dayOfWeek === 6)),
    [schedules],
  );

  // Visible hour window adapts to the earliest/latest lesson.
  const [startHour, endHour] = useMemo(() => {
    if (!schedules.length) return [8, 18];
    const min = Math.min(...schedules.map((s) => minutesOf(s.startTime)));
    const max = Math.max(...schedules.map((s) => minutesOf(s.endTime)));
    return [Math.max(7, Math.floor(min / 60)), Math.min(22, Math.ceil(max / 60) + 1)];
  }, [schedules]);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const totalMinutes = schedules.reduce((m, s) => m + minutesOf(s.endTime) - minutesOf(s.startTime), 0);
  const courseCount = new Set(schedules.map((s) => s.courseOfferingId)).size;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMinutes - startHour * 60) / 60) * HOUR_PX;
  const showNow = days.includes(today) && nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dərs cədvəli"
        description={
          isStudent
            ? "Qrupunuzun həftəlik dərs cədvəli."
            : isAdmin
              ? "Bütün qrupların həftəlik cədvəli. Slotları “Cədvəl slotları” bölməsində idarə edin."
              : "Tədris etdiyiniz dərslərin həftəlik cədvəli."
        }
        actions={
          <ToggleGroup type="single" variant="outline" value={view} onValueChange={(v) => v && setView(v as "grid" | "list")}>
            <ToggleGroupItem value="grid" aria-label="Həftə görünüşü" className="gap-1.5 px-3">
              <LayoutGrid /> Həftə
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Siyahı görünüşü" className="gap-1.5 px-3">
              <List /> Siyahı
            </ToggleGroupItem>
          </ToggleGroup>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="h-7 gap-1.5 px-3 text-xs"><CalendarDays className="size-3.5" /> {schedules.length} dərs / həftə</Badge>
        <Badge variant="secondary" className="h-7 px-3 text-xs">{courseCount} fənn</Badge>
        <Badge variant="secondary" className="h-7 px-3 text-xs">{Math.round(totalMinutes / 60)} saat auditoriya yükü</Badge>
      </div>

      {error ? (
        <ErrorState error={error} />
      ) : isLoading ? (
        <Skeleton className="h-[34rem] rounded-xl" />
      ) : !schedules.length ? (
        <EmptyState icon={CalendarDays} title="Cədvəl boşdur" description="Hələ heç bir dərs cədvəli təyin edilməyib." />
      ) : view === "list" ? (
        <ListView schedules={schedules} days={days} today={today} showGroup={!isStudent} />
      ) : (
        <>
          {/* Mobile falls back to the list, the grid needs width. */}
          <div className="md:hidden">
            <ListView schedules={schedules} days={days} today={today} showGroup={!isStudent} />
          </div>
          <Card className="hidden overflow-hidden p-0 md:block">
            <div className="grid" style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}>
              <div className="border-b bg-muted/40" />
              {days.map((d) => (
                <div
                  key={d}
                  className={cn(
                    "border-b border-l bg-muted/40 px-3 py-3 text-center",
                    d === today && "bg-primary/8 text-primary",
                  )}
                >
                  <p className="text-[0.8rem] font-semibold">{DAY_NAMES[d]}</p>
                  <p className="text-[0.7rem] text-muted-foreground">{schedules.filter((s) => s.dayOfWeek === d).length} dərs</p>
                </div>
              ))}

              {/* Time gutter */}
              <div className="relative" style={{ height: hours.length * HOUR_PX }}>
                {hours.map((h, i) => (
                  <span key={h} className={cn("absolute right-2 text-[0.7rem] font-medium text-muted-foreground tabular", i === 0 ? "translate-y-1" : "-translate-y-1/2")} style={{ top: i * HOUR_PX }}>
                    {`${String(h).padStart(2, "0")}:00`}
                  </span>
                ))}
              </div>

              {days.map((d) => (
                <div key={d} className={cn("relative border-l", d === today && "bg-primary/[0.025]")} style={{ height: hours.length * HOUR_PX }}>
                  {hours.map((h, i) => (
                    <div key={h} className="absolute inset-x-0 border-t border-dashed border-border/70" style={{ top: i * HOUR_PX }} />
                  ))}
                  {d === today && showNow && (
                    <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: nowTop }}>
                      <span className="-ml-1 size-2 rounded-full bg-primary" />
                      <span className="h-px flex-1 bg-primary" />
                    </div>
                  )}
                  {schedules
                    .filter((s) => s.dayOfWeek === d)
                    .map((s) => (
                      <LessonBlock key={s.id} lesson={s} startHour={startHour} showGroup={!isStudent} />
                    ))}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function LessonBlock({ lesson, startHour, showGroup }: { lesson: CourseSchedule; startHour: number; showGroup: boolean }) {
  const tintOf = useCourseTint();
  const top = ((minutesOf(lesson.startTime) - startHour * 60) / 60) * HOUR_PX;
  const height = ((minutesOf(lesson.endTime) - minutesOf(lesson.startTime)) / 60) * HOUR_PX;
  return (
    <div
      className={cn("absolute inset-x-1.5 overflow-hidden rounded-xl p-2 transition hover:z-20 hover:shadow-lift", TINT_FIELD[tintOf(lesson.courseName)])}
      style={{ top: top + 2, height: height - 4 }}
      title={`${lesson.courseName} · ${formatTime(lesson.startTime)}–${formatTime(lesson.endTime)}`}
    >
      <div>
        <p className="flex items-center gap-1.5 text-[0.68rem] font-medium opacity-85 tabular">
          <span className={cn("size-1.5 shrink-0 rounded-full", TINT_MARK[tintOf(lesson.courseName)])} />
          {formatTime(lesson.startTime)}–{formatTime(lesson.endTime)}
        </p>
        <p className="line-clamp-2 text-[0.78rem] leading-snug font-semibold">{lesson.courseName}</p>
        <p className="mt-0.5 truncate text-[0.68rem] opacity-80">
          {lesson.roomCode} · {showGroup ? lesson.groupName : lesson.teacherName}
        </p>
      </div>
    </div>
  );
}

function ListView({ schedules, days, today, showGroup }: { schedules: CourseSchedule[]; days: DayOfWeek[]; today: DayOfWeek; showGroup: boolean }) {
  const tintOf = useCourseTint();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {days.map((d) => {
        const lessons = sortByTime(schedules.filter((s) => s.dayOfWeek === d));
        return (
          <Card key={d} className={cn("gap-3", d === today && "ring-2 ring-primary/30")}>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-semibold">{DAY_NAMES[d]}</p>
                {d === today ? <Badge>Bu gün</Badge> : <span className="text-xs text-muted-foreground">{lessons.length} dərs</span>}
              </div>
              {lessons.length ? (
                <ul className="space-y-2">
                  {lessons.map((s) => (
                    <li key={s.id} className="flex gap-3 rounded-xl border bg-background p-3">
                      <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", TINT_MARK[tintOf(s.courseName)])} />
                      <div className="w-12 shrink-0 text-xs leading-5 tabular">
                        <p className="font-semibold">{formatTime(s.startTime)}</p>
                        <p className="text-muted-foreground">{formatTime(s.endTime)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{s.courseName}</p>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><DoorOpen className="size-3" /> {s.roomCode}</span>
                          {showGroup && <span className="inline-flex items-center gap-1"><UsersRound className="size-3" /> {s.groupName}</span>}
                          <span className="inline-flex items-center gap-1"><UserRound className="size-3" /> {s.teacherName}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">Dərs yoxdur</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
