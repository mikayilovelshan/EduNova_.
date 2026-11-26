"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LetterBadge } from "@/components/shared/letter-badge";
import { PageHeader, SectionTitle } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { DAY_NAMES, EXAM_TYPE_LABELS, formatNumber, formatShortDate, greeting, maxScoreFor, percent } from "@/lib/format";
import { useAttendance, useExamResults, useMe, useMySummaries, useSchedules } from "@/lib/queries";
import { CourseCard, pillOnTint } from "./course-card";
import { LessonTimeline, upcomingDay } from "./lesson-timeline";
import { DashboardRail, MonthCalendar, UpcomingTimeline } from "./rail";

function Figure({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="min-w-24 rounded-2xl bg-muted/70 px-4 py-2.5">
      <p className="text-[0.7rem] font-medium text-muted-foreground">{label}</p>
      <p className={`font-display text-[1.35rem] leading-tight font-semibold tabular ${warn ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}

export function StudentDashboard() {
  const { data: me } = useMe();
  const schedules = useSchedules();
  const attendance = useAttendance();
  const summaries = useMySummaries();
  const results = useExamResults();

  const stats = useMemo(() => {
    const records = (attendance.data ?? []).flatMap((s) => s.students);
    const attended = records.filter((r) => r.isPresent).length;
    return { rate: percent(attended, records.length), absences: records.length - attended };
  }, [attendance.data]);

  const next = upcomingDay(schedules.data ?? []);
  const courses = summaries.data ?? [];
  const recent = (results.data ?? []).slice(0, 6);

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0 space-y-9">
        <PageHeader
          title={`${greeting()}, ${me?.firstName ?? ""}`}
          description={[me?.specialityName ?? "İxtisas təyin edilməyib", me?.groupCode && `Qrup ${me.groupCode}`, me?.studentNumber]
            .filter(Boolean)
            .join(" · ")}
          actions={
            <>
              <Figure label="ÜOMG" value={me?.gpa != null ? formatNumber(me.gpa) : "—"} />
              <Figure label="Davamiyyət" value={`${stats.rate}%`} warn={stats.rate > 0 && stats.rate < 75} />
              <Figure label="Qayıblar" value={String(stats.absences)} />
            </>
          }
        />

        <section>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Fənlərim</SectionTitle>
            <Button asChild variant="link" size="sm" className="text-primary-ink">
              <Link href="/grades">Bütün qiymətlər</Link>
            </Button>
          </div>
          {summaries.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))}
            </div>
          ) : courses.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
              {courses.map((s) => (
                <CourseCard
                  key={s.courseOfferingId}
                  name={s.courseName}
                  meta={
                    <>
                      {s.attendedClasses}/{s.totalClasses} dərs · {formatNumber(s.totalScore)} bal
                    </>
                  }
                >
                  <Button asChild size="sm" variant="outline" className={pillOnTint}>
                    <Link href="/grades">Qiymətlər</Link>
                  </Button>
                  {s.hasFinalExam && <LetterBadge letter={s.letterGrade} size="sm" />}
                </CourseCard>
              ))}
            </div>
          ) : (
            <EmptyState title="Fənn tapılmadı" description="Qrupunuza hələ fənn təyin edilməyib." />
          )}
        </section>

        <section>
          <SectionTitle className="mb-3">{next.isToday ? "Bu günün dərsləri" : `Növbəti dərs günü — ${DAY_NAMES[next.day]}`}</SectionTitle>
          <Tabs defaultValue="lessons">
            <TabsList variant="line" className="mb-3 h-9 gap-5 border-b-0 p-0">
              <TabsTrigger value="lessons" className="px-0 text-[0.84rem]">
                Dərslər
              </TabsTrigger>
              <TabsTrigger value="grades" className="px-0 text-[0.84rem]">
                Son qiymətlər
              </TabsTrigger>
            </TabsList>
            <TabsContent value="lessons">
              {schedules.isLoading ? (
                <Skeleton className="h-48 rounded-2xl" />
              ) : next.lessons.length ? (
                <LessonTimeline lessons={next.lessons} isToday={next.isToday} />
              ) : (
                <EmptyState title="Dərs yoxdur" description="Cədvəlinizdə dərs tapılmadı." />
              )}
            </TabsContent>
            <TabsContent value="grades">
              {results.isLoading ? (
                <Skeleton className="h-48 rounded-2xl" />
              ) : recent.length ? (
                <ul className="divide-y">
                  {recent.map((r) => (
                    <li key={r.id} className="flex items-center gap-3.5 py-3.5 first:pt-1">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.88rem] font-semibold">{r.courseName}</p>
                        <p className="text-[0.75rem] text-muted-foreground">
                          {EXAM_TYPE_LABELS[r.examType]}
                          <span className="mx-1.5 text-primary">•</span>
                          {formatShortDate(r.evaluationDate)}
                        </p>
                      </div>
                      <p className="font-display text-lg font-semibold tabular">
                        {formatNumber(r.score)}
                        <span className="text-xs font-normal text-muted-foreground"> / {maxScoreFor(r.examType)}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Hələ qiymət yoxdur" />
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <DashboardRail>
        <MonthCalendar schedules={schedules.data ?? []} />
        <UpcomingTimeline schedules={schedules.data ?? []} loading={schedules.isLoading} />
      </DashboardRail>
    </div>
  );
}
