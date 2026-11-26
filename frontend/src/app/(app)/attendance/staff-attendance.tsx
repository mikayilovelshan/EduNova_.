"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCheck, ClipboardCheck, Pencil, Save, UserCheck, UserX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/shared/data-table";
import { DatePicker } from "@/components/shared/date-picker";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { apiMessage, errorMessage } from "@/lib/api";
import { DAY_NAMES, formatDate, formatTime, initials, percent, toIsoDate } from "@/lib/format";
import { keys, useAttendance, useOfferings, useOfferingStudents, useSchedules } from "@/lib/queries";
import type { AttendanceSession } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Selection {
  offeringId?: string;
  scheduleId?: string;
  date?: Date;
}

interface Mark {
  studentId: string;
  attendanceId?: string;
  fullName: string;
  studentNumber?: string;
  isPresent: boolean;
  note: string;
}

const parseDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function StaffAttendance() {
  const params = useSearchParams();
  const qc = useQueryClient();
  const offerings = useOfferings();
  const schedules = useSchedules();
  const sessions = useAttendance();

  const [tab, setTab] = useState("record");

  // `picked` is null until the user changes the selection; until then a deep link
  // (/attendance?schedule=<id>&date=yyyy-MM-dd, used by the dashboard) decides what is shown.
  const [picked, setPicked] = useState<Selection | null>(null);
  const deepSlot = schedules.data?.find((s) => s.id === params.get("schedule"));
  const deepDate = params.get("date");
  const selection: Selection =
    picked ?? (deepSlot ? { offeringId: deepSlot.courseOfferingId, scheduleId: deepSlot.id, date: deepDate ? parseDate(deepDate) : undefined } : {});
  const { offeringId, scheduleId, date } = selection;
  const choose = (patch: Selection) => setPicked({ ...selection, ...patch });

  const slots = (schedules.data ?? []).filter((s) => s.courseOfferingId === offeringId);
  const slot = slots.find((s) => s.id === scheduleId);
  const isoDate = date ? toIsoDate(date) : undefined;
  const existing = (sessions.data ?? []).find((s) => s.courseScheduleId === scheduleId && s.date.slice(0, 10) === isoDate);
  const students = useOfferingStudents(offeringId);

  // Roster derived from the server (existing record or the group list); local edits are layered on top
  // and discarded automatically when another session is selected or the data is refetched after saving.
  const baseMarks: Mark[] = (() => {
    if (!slot || !isoDate) return [];
    if (existing) {
      const numbers = new Map((students.data ?? []).map((s) => [s.id, s.studentNumber]));
      return existing.students.map((s) => ({
        studentId: s.studentId,
        attendanceId: s.attendanceId,
        fullName: s.studentFullName,
        studentNumber: numbers.get(s.studentId),
        isPresent: s.isPresent,
        note: s.note ?? "",
      }));
    }
    return (students.data ?? []).map((s) => ({ studentId: s.id, fullName: s.fullName, studentNumber: s.studentNumber, isPresent: true, note: "" }));
  })();

  const sessionKey = `${scheduleId}|${isoDate}|${sessions.dataUpdatedAt}`;
  const [edits, setEdits] = useState<{ key: string; marks: Mark[] } | null>(null);
  const marks = edits?.key === sessionKey ? edits.marks : baseMarks;
  const setMarks = (fn: (m: Mark[]) => Mark[]) => setEdits({ key: sessionKey, marks: fn(marks) });

  const save = useMutation({
    mutationFn: () =>
      existing
        ? apiMessage("Attendance", {
            method: "PUT",
            body: {
              courseScheduleId: scheduleId,
              date: isoDate,
              students: marks.map((m) => ({ attendanceId: m.attendanceId, isPresent: m.isPresent, note: m.note || null })),
            },
          })
        : apiMessage("Attendance/create", {
            method: "POST",
            body: {
              courseScheduleId: scheduleId,
              date: isoDate,
              students: marks.map((m) => ({ studentId: m.studentId, isPresent: m.isPresent, note: m.note || null })),
            },
          }),
    onSuccess: (msg) => {
      toast.success(msg);
      qc.invalidateQueries({ queryKey: keys.attendance });
      qc.invalidateQueries({ queryKey: ["exam-results"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const presentCount = marks.filter((m) => m.isPresent).length;
  const update = (id: string, patch: Partial<Mark>) => setMarks((ms) => ms.map((m) => (m.studentId === id ? { ...m, ...patch } : m)));

  const openSession = (s: AttendanceSession) => {
    setPicked({ offeringId: s.courseOfferingId, scheduleId: s.courseScheduleId, date: parseDate(s.date) });
    setTab("record");
  };

  const journalColumns = useMemo<ColumnDef<AttendanceSession>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Tarix",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{formatDate(row.original.date, "d MMM yyyy")}</p>
            <p className="text-xs text-muted-foreground">{DAY_NAMES[parseDate(row.original.date).getDay() as 0]}</p>
          </div>
        ),
      },
      { accessorKey: "courseName", header: "Fənn", cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
      { accessorKey: "groupName", header: "Qrup", cell: ({ getValue }) => <Badge variant="secondary">{getValue<string>()}</Badge> },
      {
        id: "time",
        header: "Saat",
        accessorFn: (r) => `${formatTime(r.startTime)}–${formatTime(r.endTime)}`,
        cell: ({ getValue }) => <span className="font-mono text-xs tabular">{getValue<string>()}</span>,
      },
      {
        id: "rate",
        header: "İştirak",
        accessorFn: (r) => percent(r.students.filter((s) => s.isPresent).length, r.students.length),
        cell: ({ row, getValue }) => {
          const present = row.original.students.filter((s) => s.isPresent).length;
          const rate = getValue<number>();
          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", rate < 75 ? "bg-butter-mark" : "bg-mint-mark")} style={{ width: `${rate}%` }} />
              </div>
              <span className="text-xs tabular">
                {present}/{row.original.students.length}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" variant="ghost" onClick={() => openSession(row.original)}>
            <Pencil data-icon="inline-start" /> Redaktə
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Davamiyyət jurnalı" description="Dərs sessiyası üçün iştirakı qeyd edin və ya əvvəlki qeydləri redaktə edin." />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="record"><ClipboardCheck /> Davamiyyət qeydi</TabsTrigger>
          <TabsTrigger value="journal">Jurnal ({sessions.data?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="mt-4 space-y-4">
          <Card>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel>Fənn və qrup</FieldLabel>
                <Select
                  value={offeringId ?? ""}
                  onValueChange={(v) => choose({ offeringId: v, scheduleId: undefined, date: undefined })}
                >
                  <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    {(offerings.data ?? []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.courseName} · {o.groupCode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Dərs slotu</FieldLabel>
                <Select value={scheduleId ?? ""} onValueChange={(v) => choose({ scheduleId: v, date: undefined })} disabled={!offeringId}>
                  <SelectTrigger className="h-9 w-full"><SelectValue placeholder={offeringId && !slots.length ? "Slot yoxdur" : "Seçin"} /></SelectTrigger>
                  <SelectContent>
                    {slots.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {DAY_NAMES[s.dayOfWeek]} · {formatTime(s.startTime)}–{formatTime(s.endTime)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Tarix</FieldLabel>
                <DatePicker
                  value={date}
                  onChange={(d) => choose({ date: d })}
                  // Only past/today dates that fall on the lesson's weekday are valid (the API checks this too).
                  disabled={(d) => !slot || d.getDay() !== slot.dayOfWeek || d > new Date()}
                  placeholder={slot ? `${DAY_NAMES[slot.dayOfWeek]} günü seçin` : "Əvvəlcə slot seçin"}
                />
              </Field>
            </CardContent>
          </Card>

          {!slot || !date ? (
            <EmptyState icon={ClipboardCheck} title="Dərs sessiyası seçin" description="Fənni, dərs slotunu və tarixi seçdikdən sonra tələbə siyahısı görünəcək." />
          ) : students.isLoading ? (
            <Skeleton className="h-80 rounded-xl" />
          ) : (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {slot.courseName}
                    {existing ? <Badge variant="secondary">Qeyd mövcuddur — redaktə</Badge> : <Badge>Yeni qeyd</Badge>}
                  </CardTitle>
                  <CardDescription>
                    {formatDate(date, "EEEE, d MMMM yyyy")} · {formatTime(slot.startTime)}–{formatTime(slot.endTime)} · Otaq {slot.roomCode}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mr-2 text-sm tabular">
                    <span className="font-semibold text-mint-ink">{presentCount}</span>
                    <span className="text-muted-foreground"> / {marks.length} iştirak</span>
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setMarks((ms) => ms.map((m) => ({ ...m, isPresent: true })))}>
                    <CheckCheck data-icon="inline-start" /> Hamısı iştirak
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {marks.length === 0 ? (
                  <EmptyState title="Qrupda tələbə yoxdur" />
                ) : (
                  marks.map((m, i) => (
                    <div
                      key={m.studentId}
                      className={cn(
                        "flex flex-col gap-3 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center",
                        !m.isPresent && "border-rose-mark/30 bg-rose",
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="w-6 text-right font-mono text-xs text-muted-foreground tabular">{i + 1}</span>
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {initials(...(m.fullName.split(" ") as [string, string]))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{m.fullName}</p>
                          {m.studentNumber && <p className="font-mono text-xs text-muted-foreground">{m.studentNumber}</p>}
                        </div>
                      </div>
                      <Input
                        value={m.note}
                        onChange={(e) => update(m.studentId, { note: e.target.value })}
                        placeholder="Qeyd (məs. üzrlü səbəb)"
                        className="h-8 sm:w-56"
                      />
                      <label className="flex w-36 cursor-pointer items-center justify-end gap-2 text-sm font-medium">
                        {m.isPresent ? (
                          <span className="inline-flex items-center gap-1 text-mint-ink"><UserCheck className="size-4" /> İştirak</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-ink"><UserX className="size-4" /> Qayıb</span>
                        )}
                        <Switch checked={m.isPresent} onCheckedChange={(v) => update(m.studentId, { isPresent: v })} />
                      </label>
                    </div>
                  ))
                )}
                {marks.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <Button onClick={() => save.mutate()} disabled={save.isPending}>
                      {save.isPending ? <Spinner /> : <Save data-icon="inline-start" />}
                      {existing ? "Dəyişiklikləri yadda saxla" : "Davamiyyəti qeyd et"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="journal" className="mt-4">
          <DataTable
            columns={journalColumns}
            data={sessions.data ?? []}
            loading={sessions.isLoading}
            searchPlaceholder="Fənn və ya qrup üzrə axtar..."
            initialSorting={[{ id: "date", desc: true }]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
