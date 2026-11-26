"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarCheck2, CalendarX2, Percent } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CardsSkeleton, ErrorState } from "@/components/shared/states";
import { courseAccent, DAY_NAMES, formatDate, formatTime, percent } from "@/lib/format";
import { useAttendance } from "@/lib/queries";
import type { DayOfWeek } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  date: string;
  courseName: string;
  time: string;
  isPresent: boolean;
  note: string | null;
}

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "date",
    header: "Tarix",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{formatDate(row.original.date, "d MMM yyyy")}</p>
        <p className="text-xs text-muted-foreground">{DAY_NAMES[new Date(row.original.date).getDay() as DayOfWeek]}</p>
      </div>
    ),
  },
  {
    accessorKey: "courseName",
    header: "Fənn",
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-2 font-medium">
        <span className={cn("size-2 rounded-full", courseAccent(getValue<string>()))} />
        {getValue<string>()}
      </span>
    ),
  },
  { accessorKey: "time", header: "Saat", cell: ({ getValue }) => <span className="font-mono text-xs tabular">{getValue<string>()}</span> },
  {
    accessorKey: "isPresent",
    header: "Status",
    cell: ({ getValue }) =>
      getValue<boolean>() ? (
        <Badge className="bg-mint text-mint-ink">İştirak edib</Badge>
      ) : (
        <Badge className="bg-rose text-rose-ink">Qayıb</Badge>
      ),
  },
  { accessorKey: "note", header: "Qeyd", enableSorting: false, cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>() ?? "—"}</span> },
];

export function StudentAttendance() {
  const { data, isLoading, error } = useAttendance();
  const [course, setCourse] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = useMemo<Row[]>(
    () =>
      (data ?? []).flatMap((s) =>
        s.students.map((st) => ({
          id: st.attendanceId,
          date: s.date,
          courseName: s.courseName,
          time: `${formatTime(s.startTime)}–${formatTime(s.endTime)}`,
          isPresent: st.isPresent,
          note: st.note,
        })),
      ),
    [data],
  );

  const perCourse = useMemo(() => {
    const map = new Map<string, { total: number; present: number }>();
    for (const r of rows) {
      const e = map.get(r.courseName) ?? { total: 0, present: 0 };
      e.total++;
      if (r.isPresent) e.present++;
      map.set(r.courseName, e);
    }
    return [...map.entries()].map(([name, v]) => ({ name, ...v, rate: percent(v.present, v.total) })).sort((a, b) => a.rate - b.rate);
  }, [rows]);

  const filtered = rows.filter(
    (r) => (course === "all" || r.courseName === course) && (status === "all" || (status === "present") === r.isPresent),
  );
  const present = rows.filter((r) => r.isPresent).length;

  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Davamiyyətim" description="Hər fənn üzrə dərslərdə iştirakınız. Davamiyyət imtahanaqədər balın 10 balını təşkil edir." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Ümumi davamiyyət" value={`${percent(present, rows.length)}%`} icon={Percent} loading={isLoading} />
        <StatCard label="İştirak edilən dərslər" value={present} icon={CalendarCheck2} tint="mint" loading={isLoading} hint={`${rows.length} dərsdən`} />
        <StatCard label="Qayıblar" value={rows.length - present} icon={CalendarX2} tint="rose" loading={isLoading} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <CardsSkeleton count={3} className="h-28" />
        ) : (
          perCourse.map((c) => (
            <Card key={c.name} className="gap-3 p-4">
              <CardContent className="space-y-3 p-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-snug font-semibold">{c.name}</p>
                  <span className={cn("font-display text-2xl font-semibold tabular", c.rate < 75 ? "text-butter-ink" : "text-primary")}>{c.rate}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", c.rate < 75 ? "bg-butter-mark" : "bg-primary")} style={{ width: `${c.rate}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.present}/{c.total} dərs · {c.total - c.present} qayıb
                  {c.rate < 75 && <span className="ml-1 font-medium text-butter-ink">· diqqət tələb edir</span>}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        searchPlaceholder="Fənn və ya qeyd üzrə axtar..."
        initialSorting={[{ id: "date", desc: true }]}
        toolbar={
          <>
            <Select value={course} onValueChange={setCourse}>
              <SelectTrigger className="h-9 w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bütün fənlər</SelectItem>
                {perCourse.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bütün statuslar</SelectItem>
                <SelectItem value="present">İştirak edib</SelectItem>
                <SelectItem value="absent">Qayıb</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />
    </div>
  );
}
