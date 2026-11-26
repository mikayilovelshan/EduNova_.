"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DAY_NAMES, DAY_SHORT, formatTime, minutesOf, TINT_FIELD, toIsoDate, WEEK_DAYS } from "@/lib/format";
import type { CourseSchedule, DayOfWeek } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCourseTint } from "@/components/shared/course-tints";
import { courseIcon } from "./course-card";

/** Lessons of today, or of the next teaching day when today has none. */
export function upcomingDay(schedules: CourseSchedule[], now = new Date()) {
  const today = now.getDay() as DayOfWeek;
  const todays = schedules.filter((s) => s.dayOfWeek === today);
  if (todays.length) return { day: today, isToday: true, lessons: sortByTime(todays), offset: 0 };

  for (let offset = 1; offset <= 7; offset++) {
    const day = ((today + offset) % 7) as DayOfWeek;
    const lessons = schedules.filter((s) => s.dayOfWeek === day);
    if (lessons.length) return { day, isToday: false, lessons: sortByTime(lessons), offset };
  }
  return { day: today, isToday: true, lessons: [] as CourseSchedule[], offset: 0 };
}

export const sortByTime = (items: CourseSchedule[]) => [...items].sort((a, b) => minutesOf(a.startTime) - minutesOf(b.startTime));

export const lessonsPerWeekday = (schedules: CourseSchedule[]) =>
  WEEK_DAYS.map((d) => ({ day: DAY_SHORT[d], full: DAY_NAMES[d], lessons: schedules.filter((s) => s.dayOfWeek === d).length }));

/** The next `count` lesson occurrences from now, across the coming week. */
export function upcomingLessons(schedules: CourseSchedule[], count: number, now = new Date()) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const out: { lesson: CourseSchedule; date: Date; offset: number }[] = [];
  for (let offset = 0; offset < 7 && out.length < count; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const day = date.getDay() as DayOfWeek;
    for (const lesson of sortByTime(schedules.filter((s) => s.dayOfWeek === day))) {
      if (offset === 0 && minutesOf(lesson.startTime) <= nowMinutes) continue;
      out.push({ lesson, date, offset });
      if (out.length === count) break;
    }
  }
  return out;
}

function status(lesson: CourseSchedule, isToday: boolean, now: Date) {
  if (!isToday) return "upcoming" as const;
  const m = now.getHours() * 60 + now.getMinutes();
  if (m >= minutesOf(lesson.endTime)) return "done" as const;
  if (m >= minutesOf(lesson.startTime)) return "live" as const;
  return "upcoming" as const;
}

/** A day's lessons as list rows: tinted course mark, title, meta, and the time or a state pill. */
export function LessonTimeline({
  lessons,
  isToday,
  showGroup,
  attendanceAction,
}: {
  lessons: CourseSchedule[];
  isToday: boolean;
  showGroup?: boolean;
  /** Staff: a quick link to take attendance for lessons that have started today. */
  attendanceAction?: boolean;
}) {
  const now = new Date();
  const tintOf = useCourseTint();
  return (
    <ul className="divide-y">
      {lessons.map((lesson) => {
        const st = status(lesson, isToday, now);
        const Icon = courseIcon(lesson.courseName);
        return (
          <li key={lesson.id} className="flex items-center gap-3.5 py-3.5 first:pt-1 last:pb-1">
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", TINT_FIELD[tintOf(lesson.courseName)])}>
              <Icon className="size-[1.1rem]" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-[0.88rem] font-semibold", st === "done" && "text-muted-foreground")}>{lesson.courseName}</p>
              <p className="truncate text-[0.75rem] text-muted-foreground">
                <span className="font-medium text-foreground/80">{showGroup ? `Qrup ${lesson.groupName}` : lesson.teacherName}</span>
                <span className="mx-1.5 text-primary">•</span>
                Otaq {lesson.roomCode}
                <span className="mx-1.5 text-primary sm:hidden">•</span>
                <span className="tabular sm:hidden">{formatTime(lesson.startTime)}</span>
                {!attendanceAction && (
                  <>
                    <span className="mx-1.5 text-primary sm:hidden">•</span>
                    <span className={cn("font-medium sm:hidden", st === "live" ? "text-primary-ink" : "text-muted-foreground")}>
                      {st === "live" ? "İndi gedir" : st === "done" ? "Bitib" : "Gözlənilir"}
                    </span>
                  </>
                )}
              </p>
            </div>
            <p className="hidden shrink-0 text-[0.78rem] font-medium text-muted-foreground tabular sm:block">
              {formatTime(lesson.startTime)}–{formatTime(lesson.endTime)}
            </p>
            {attendanceAction ? (
              isToday && st !== "upcoming" ? (
                <Button asChild size="sm" variant={st === "live" ? "default" : "soft"} className="shrink-0 sm:w-28">
                  <Link href={`/attendance?schedule=${lesson.id}&date=${toIsoDate(now)}`}>Davamiyyət</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="soft" className="shrink-0 sm:w-28">
                  <Link href={`/grades?offering=${lesson.courseOfferingId}`}>Jurnal</Link>
                </Button>
              )
            ) : (
              <span
                className={cn(
                  "hidden w-24 shrink-0 justify-center rounded-full px-2.5 py-1 text-[0.72rem] font-semibold sm:inline-flex",
                  st === "live" && "bg-primary text-primary-foreground",
                  st === "done" && "bg-muted text-muted-foreground",
                  st === "upcoming" && "bg-primary-soft text-primary-ink",
                )}
              >
                {st === "live" ? "İndi gedir" : st === "done" ? "Bitib" : "Gözlənilir"}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
