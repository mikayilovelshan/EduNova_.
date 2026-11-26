"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  Landmark,
  Library,
  NotebookPen,
  Presentation,
  Upload,
  Users,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HexIcon } from "@/components/shared/hex-icon";
import { PageHeader, SectionTitle } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/states";
import { DAY_NAMES, formatDate, greeting, percent, type Tint } from "@/lib/format";
import {
  useActiveSemester,
  useAttendance,
  useCourses,
  useGroups,
  useMaterials,
  useOfferings,
  useRole,
  useSchedules,
  useStudents,
  useTeachers,
} from "@/lib/queries";
import { CourseCard, pillOnTint } from "./course-card";
import { LessonTimeline, lessonsPerWeekday, upcomingDay } from "./lesson-timeline";
import { DashboardRail, MonthCalendar, UpcomingTimeline } from "./rail";

const loadConfig = { lessons: { label: "Dərs sayı", color: "var(--chart-1)" } } satisfies ChartConfig;
const attendanceConfig = {
  present: { label: "İştirak", color: "var(--chart-2)" },
  absent: { label: "Qayıb", color: "var(--chart-1)" },
} satisfies ChartConfig;

function useAttendanceTotals() {
  const { data, isLoading } = useAttendance();
  return useMemo(() => {
    const records = (data ?? []).flatMap((s) => s.students);
    const present = records.filter((r) => r.isPresent).length;
    return { isLoading, sessions: data ?? [], present, absent: records.length - present, rate: percent(present, records.length) };
  }, [data, isLoading]);
}

/** Attendance at a glance: one figure and a two-part bar. Lives in the rail. */
function AttendanceSummary() {
  const t = useAttendanceTotals();
  const total = t.present + t.absent;
  return (
    <section>
      <SectionTitle className="mb-4">Davamiyyət</SectionTitle>
      {t.isLoading ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : (
        <div className="space-y-3 rounded-2xl bg-mint p-4 text-mint-ink">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-[2rem] leading-none font-semibold tabular text-foreground">{t.rate}%</p>
            <p className="text-[0.74rem]">{t.sessions.length} dərs sessiyası</p>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-background/70" role="img" aria-label={`İştirak ${t.present}, qayıb ${t.absent}`}>
            <div className="bg-mint-mark" style={{ width: `${total ? (t.present / total) * 100 : 0}%` }} />
            <div className="bg-primary" style={{ width: `${total ? (t.absent / total) * 100 : 0}%` }} />
          </div>
          <div className="flex justify-between text-[0.74rem]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-mint-mark" /> İştirak {t.present}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> Qayıb {t.absent}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export function TeacherDashboard() {
  const { user } = useRole();
  const offerings = useOfferings();
  const schedules = useSchedules();
  const materials = useMaterials();
  const next = upcomingDay(schedules.data ?? []);

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0 space-y-9">
        <PageHeader
          title={`${greeting()}, ${user?.firstName ?? ""}`}
          description={[user?.scientificDegree, user?.cafedraName && `${user.cafedraName} kafedrası`].filter(Boolean).join(" · ") || undefined}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/materials">
                  <Upload data-icon="inline-start" /> Material yüklə
                </Link>
              </Button>
              <Button asChild>
                <Link href="/grades">
                  <NotebookPen data-icon="inline-start" /> Qiymət daxil et
                </Link>
              </Button>
            </>
          }
        />

        <section>
          <SectionTitle className="mb-4">Fənlərim</SectionTitle>
          {offerings.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))}
            </div>
          ) : (offerings.data ?? []).length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
              {(offerings.data ?? []).map((o) => (
                <CourseCard key={o.id} name={o.courseName} meta={<>Qrup {o.groupCode} · Otaq {o.roomCode}</>}>
                  <Button asChild size="sm" variant="outline" className={pillOnTint}>
                    <Link href={`/grades?offering=${o.id}`}>Jurnal</Link>
                  </Button>
                </CourseCard>
              ))}
            </div>
          ) : (
            <EmptyState title="Fənn yoxdur" description="Sizə bu semestr üçün dərs təyin edilməyib." />
          )}
        </section>

        <section>
          <SectionTitle className="mb-3">{next.isToday ? "Bu günün dərsləri" : `Növbəti dərs günü — ${DAY_NAMES[next.day]}`}</SectionTitle>
          <Tabs defaultValue="lessons">
            <TabsList variant="line" className="mb-3 h-9 gap-5 p-0">
              <TabsTrigger value="lessons" className="px-0 text-[0.84rem]">
                Dərslər
              </TabsTrigger>
              <TabsTrigger value="materials" className="px-0 text-[0.84rem]">
                Son materiallar
              </TabsTrigger>
            </TabsList>
            <TabsContent value="lessons">
              {schedules.isLoading ? (
                <Skeleton className="h-48 rounded-2xl" />
              ) : next.lessons.length ? (
                <LessonTimeline lessons={next.lessons} isToday={next.isToday} showGroup attendanceAction />
              ) : (
                <EmptyState title="Dərs yoxdur" description="Sizə təyin edilmiş dərs cədvəli tapılmadı." />
              )}
            </TabsContent>
            <TabsContent value="materials">
              {(materials.data ?? []).length ? (
                <ul className="divide-y">
                  {(materials.data ?? []).slice(0, 6).map((m) => (
                    <li key={m.id} className="flex items-center gap-3.5 py-3.5 first:pt-1">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sky text-sky-ink">
                        <FileText className="size-[1.1rem]" strokeWidth={1.9} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.88rem] font-semibold">{m.title}</p>
                        <p className="truncate text-[0.75rem] text-muted-foreground">
                          {m.courseName}
                          <span className="mx-1.5 text-primary">•</span>
                          {formatDate(m.createdDate, "d MMM")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Material yoxdur" />
              )}
            </TabsContent>
          </Tabs>
        </section>

        <div className="max-w-md">
          <AttendanceSummary />
        </div>
      </div>

      <DashboardRail>
        <MonthCalendar schedules={schedules.data ?? []} />
        <UpcomingTimeline schedules={schedules.data ?? []} loading={schedules.isLoading} showGroup />
      </DashboardRail>
    </div>
  );
}

function WeeklyLoad() {
  const { data, isLoading } = useSchedules();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Həftəlik dərs yükü</CardTitle>
        <CardDescription>Gün üzrə dərs sayı</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-52" />
        ) : (
          <ChartContainer config={loadConfig} className="aspect-auto h-56 w-full">
            <BarChart data={lessonsPerWeekday(data ?? [])}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={0} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} tick={{ fontSize: 11 }} />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", radius: 8 }}
                content={<ChartTooltipContent labelFormatter={(_, payload) => String(payload?.[0]?.payload?.full ?? "")} />}
              />
              <Bar dataKey="lessons" fill="var(--color-lessons)" radius={[8, 8, 8, 8]} barSize={22} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function AttendanceDonut() {
  const totals = useAttendanceTotals();
  const pie = [
    { key: "present", value: totals.present, fill: "var(--color-present)" },
    { key: "absent", value: totals.absent, fill: "var(--color-absent)" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Davamiyyət göstəricisi</CardTitle>
        <CardDescription>{totals.sessions.length} dərs sessiyası üzrə</CardDescription>
      </CardHeader>
      <CardContent>
        {totals.isLoading ? (
          <Skeleton className="mx-auto size-48 rounded-full" />
        ) : (
          <ChartContainer config={attendanceConfig} className="mx-auto aspect-square h-52">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
              <Pie data={pie} dataKey="value" nameKey="key" innerRadius={64} outerRadius={86} strokeWidth={4} paddingAngle={3} cornerRadius={6}>
                <Label
                  content={({ viewBox }) =>
                    viewBox && "cx" in viewBox ? (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground font-display text-3xl font-semibold">
                          {totals.rate}%
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground text-xs">
                          iştirak
                        </tspan>
                      </text>
                    ) : null
                  }
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
        <div className="mt-2 flex justify-center gap-5 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-chart-2" /> İştirak {totals.present}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-chart-1" /> Qayıb {totals.absent}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

const QUICK: { href: string; label: string; hint: string; icon: typeof Users; tint: Tint }[] = [
  { href: "/admin/students", label: "Tələbələr", hint: "Tələbə əlavə et və qrupa yaz", icon: Users, tint: "lavender" },
  { href: "/admin/teachers", label: "Müəllimlər", hint: "Müəllim hesabları", icon: Presentation, tint: "mint" },
  { href: "/admin/offerings", label: "Dərs təyinatları", hint: "Fənn, qrup və müəllimi bağla", icon: BookOpen, tint: "butter" },
  { href: "/admin/schedules", label: "Cədvəl slotları", hint: "Həftəlik dərs vaxtları", icon: CalendarDays, tint: "sky" },
  { href: "/admin/courses", label: "Fənlər", hint: "Fənn kataloqu", icon: Library, tint: "peach" },
  { href: "/admin/faculties", label: "Fakültələr", hint: "Akademik struktur", icon: Landmark, tint: "rose" },
];

export function AdminDashboard() {
  const { user } = useRole();
  const students = useStudents();
  const teachers = useTeachers();
  const courses = useCourses();
  const groups = useGroups();
  const offerings = useOfferings();
  const schedules = useSchedules();
  const { data: semester } = useActiveSemester();

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0 space-y-9">
        <PageHeader
          title={`${greeting()}, ${user?.firstName ?? ""}`}
          description={
            semester
              ? `Aktiv semestr: ${semester.name} (${formatDate(semester.startDate, "d MMM yyyy")} – ${formatDate(semester.endDate, "d MMM yyyy")})`
              : "Aktiv semestr təyin edilməyib — dərs təyinatları üçün semestr aktivləşdirin."
          }
          actions={
            <Button asChild>
              <Link href="/admin/semesters">
                <CalendarDays data-icon="inline-start" /> Semestrlər
              </Link>
            </Button>
          }
        />

        <section>
          <SectionTitle className="mb-4">Universitet</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Tələbə" value={students.data?.length ?? 0} icon={Users} tint="lavender" loading={students.isLoading} />
            <StatCard label="Müəllim" value={teachers.data?.length ?? 0} icon={Presentation} tint="mint" loading={teachers.isLoading} />
            <StatCard label="Fənn" value={courses.data?.length ?? 0} icon={Library} tint="butter" loading={courses.isLoading} />
            <StatCard
              label="Qrup"
              value={groups.data?.length ?? 0}
              icon={UsersRound}
              tint="sky"
              loading={groups.isLoading}
              hint={`${offerings.data?.length ?? 0} dərs təyinatı`}
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <WeeklyLoad />
          </div>
          <div className="lg:col-span-2">
            <AttendanceDonut />
          </div>
        </div>

        <section>
          <SectionTitle className="mb-4">Sürətli keçidlər</SectionTitle>
          <div className="grid gap-x-6 sm:grid-cols-2">
            {QUICK.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="group flex items-center gap-3.5 border-b py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <HexIcon icon={q.icon} tint={q.tint} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.86rem] font-semibold">{q.label}</span>
                  <span className="block truncate text-[0.74rem] text-muted-foreground">{q.hint}</span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <DashboardRail>
        <MonthCalendar schedules={schedules.data ?? []} />
        <UpcomingTimeline schedules={schedules.data ?? []} loading={schedules.isLoading} showGroup />
      </DashboardRail>
    </div>
  );
}
