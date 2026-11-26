"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { NotebookPen, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/shared/data-table";
import { DatePicker } from "@/components/shared/date-picker";
import { LetterBadge } from "@/components/shared/letter-badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { apiMessage, errorMessage } from "@/lib/api";
import { EXAM_TYPE_LABELS, EXAM_TYPE_SHORT, EXAM_TYPES, formatDate, formatNumber, maxScoreFor, toIsoDate } from "@/lib/format";
import { keys, useExamResults, useOfferings, useOfferingStudents, useOfferingSummaries } from "@/lib/queries";
import { ExamType, type ExamResult, type GradeSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ReportDialog } from "./student-grades";

type Row = GradeSummary & { scores: Partial<Record<ExamType, ExamResult>> };

function useInvalidateGrades() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: keys.examResults });
}

/** A gradebook cell: click to add or change a single score. */
function ScoreCell({ row, type, offeringId }: { row: Row; type: ExamType; offeringId: string }) {
  const result = row.scores[type];
  const max = maxScoreFor(type);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const invalidate = useInvalidateGrades();

  const save = useMutation({
    mutationFn: (score: number) =>
      result
        ? apiMessage("ExamResult", { method: "PUT", body: { id: result.id, score, evaluationDate: result.evaluationDate } })
        : apiMessage("ExamResult/create-range", {
            method: "POST",
            body: { courseOfferingId: offeringId, examType: type, evaluationDate: toIsoDate(new Date()), studentScores: [{ studentId: row.studentId, score }] },
          }),
    onSuccess: (msg) => {
      toast.success(msg);
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const submit = () => {
    const n = Number(value.replace(",", "."));
    if (Number.isNaN(n) || n < 0 || n > max) return toast.error(`Bal 0 ilə ${max} arasında olmalıdır.`);
    save.mutate(n);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setValue(result ? String(result.score) : "");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "min-w-11 rounded-md px-2 py-1 text-center font-mono text-[0.82rem] tabular transition hover:bg-primary/10 hover:text-primary",
            !result && "text-muted-foreground/50",
          )}
          title={result ? `${formatDate(result.evaluationDate, "d MMM yyyy")} — dəyişmək üçün klikləyin` : "Bal əlavə et"}
        >
          {result ? formatNumber(result.score) : "+"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 space-y-3" align="center">
        <div>
          <p className="text-sm font-semibold">{EXAM_TYPE_LABELS[type]}</p>
          <p className="text-xs text-muted-foreground">{row.studentFullName} · maks. {max} bal</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Input autoFocus inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="h-8" placeholder={`0–${max}`} />
          <Button size="sm" type="submit" disabled={save.isPending}>
            {save.isPending ? <Spinner /> : "Saxla"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export function Gradebook() {
  const params = useSearchParams();
  const router = useRouter();
  const offerings = useOfferings();
  const offeringId = params.get("offering") ?? offerings.data?.[0]?.id;
  const offering = offerings.data?.find((o) => o.id === offeringId);

  const summaries = useOfferingSummaries(offeringId);
  const results = useExamResults();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [report, setReport] = useState<GradeSummary>();

  const rows = useMemo<Row[]>(() => {
    const byStudent = new Map<string, Partial<Record<ExamType, ExamResult>>>();
    for (const r of results.data ?? []) {
      if (r.courseOfferingId !== offeringId) continue;
      const entry = byStudent.get(r.studentId) ?? {};
      entry[r.examType] = r;
      byStudent.set(r.studentId, entry);
    }
    return (summaries.data ?? []).map((s) => ({ ...s, scores: byStudent.get(s.studentId) ?? {} }));
  }, [summaries.data, results.data, offeringId]);

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "studentFullName",
        header: "Tələbə",
        cell: ({ row }) => (
          <button type="button" className="text-left font-medium hover:text-primary hover:underline" onClick={() => setReport(row.original)}>
            {row.original.studentFullName}
          </button>
        ),
      },
      {
        accessorKey: "attendanceScore",
        header: "Dav.",
        cell: ({ row }) => (
          <span className="font-mono text-[0.82rem] tabular" title={`${row.original.attendedClasses}/${row.original.totalClasses} dərs`}>
            {formatNumber(row.original.attendanceScore)}
          </span>
        ),
      },
      ...EXAM_TYPES.filter((t) => t !== ExamType.FinalExam).map<ColumnDef<Row>>((t) => ({
        id: `t${t}`,
        header: EXAM_TYPE_SHORT[t],
        enableSorting: false,
        cell: ({ row }) => <ScoreCell row={row.original} type={t} offeringId={offeringId!} />,
      })),
      {
        accessorKey: "entryScore",
        header: "İmt.qədər",
        cell: ({ getValue }) => <span className="font-semibold tabular">{formatNumber(getValue<number>())}</span>,
      },
      {
        id: "final",
        header: "İmtahan",
        enableSorting: false,
        cell: ({ row }) => <ScoreCell row={row.original} type={ExamType.FinalExam} offeringId={offeringId!} />,
      },
      {
        accessorKey: "totalScore",
        header: "Cəmi",
        cell: ({ getValue }) => <span className="font-display text-base font-semibold tabular">{formatNumber(getValue<number>())}</span>,
      },
      {
        accessorKey: "letterGrade",
        header: "Qiymət",
        cell: ({ row }) => <LetterBadge letter={row.original.letterGrade} pending={!row.original.hasFinalExam} size="sm" />,
      },
    ],
    [offeringId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qiymət jurnalı"
        description="Xanaya klikləyərək balı daxil edin və ya dəyişin. Davamiyyət balı avtomatik hesablanır."
        actions={
          <Button onClick={() => setBulkOpen(true)} disabled={!offeringId}>
            <Plus data-icon="inline-start" /> Qiymətləndirmə əlavə et
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field className="sm:max-w-md">
            <FieldLabel>Fənn və qrup</FieldLabel>
            <Select value={offeringId ?? ""} onValueChange={(v) => router.replace(`/grades?offering=${v}`)}>
              <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Seçin" /></SelectTrigger>
              <SelectContent>
                {(offerings.data ?? []).map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.courseName} · {o.groupCode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {offering && (
            <p className="text-xs text-muted-foreground sm:ml-auto">
              {offering.teacherName} · {offering.semesterName} · Otaq {offering.roomCode}
            </p>
          )}
        </CardContent>
      </Card>

      {!offeringId && !offerings.isLoading ? (
        <EmptyState icon={NotebookPen} title="Dərs təyinatı yoxdur" description="Sizə hələ fənn təyin edilməyib." />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={summaries.isLoading || results.isLoading}
          pageSize={30}
          searchPlaceholder="Tələbə axtar..."
          emptyText="Bu qrupda tələbə yoxdur."
        />
      )}

      {offeringId && (
        <BulkGradeDialog open={bulkOpen} onOpenChange={setBulkOpen} offeringId={offeringId} rows={rows} />
      )}
      <ReportDialog summary={report} studentId={report?.studentId} onClose={() => setReport(undefined)} />
    </div>
  );
}

function BulkGradeDialog({ open, onOpenChange, offeringId, rows }: { open: boolean; onOpenChange: (o: boolean) => void; offeringId: string; rows: Row[] }) {
  const [type, setType] = useState<ExamType>(ExamType.DailyGrade);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [scores, setScores] = useState<Record<string, string>>({});
  const students = useOfferingStudents(offeringId);
  const invalidate = useInvalidateGrades();
  const max = maxScoreFor(type);

  // Students who already have this exam type must be edited in the table instead (one result per type).
  const graded = new Set(rows.filter((r) => r.scores[type]).map((r) => r.studentId));
  const pending = (students.data ?? []).filter((s) => !graded.has(s.id));

  const save = useMutation({
    mutationFn: () => {
      const studentScores = pending
        .filter((s) => scores[s.id]?.trim())
        .map((s) => ({ studentId: s.id, score: Number(scores[s.id].replace(",", ".")) }));
      if (!studentScores.length) throw new Error("Ən azı bir tələbə üçün bal daxil edin.");
      if (studentScores.some((s) => Number.isNaN(s.score) || s.score < 0 || s.score > max)) throw new Error(`Bal 0 ilə ${max} arasında olmalıdır.`);
      return apiMessage("ExamResult/create-range", {
        method: "POST",
        body: { courseOfferingId: offeringId, examType: type, evaluationDate: date ? toIsoDate(date) : undefined, studentScores },
      });
    },
    onSuccess: (msg) => {
      toast.success(msg);
      setScores({});
      onOpenChange(false);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Qiymətləndirmə əlavə et</DialogTitle>
          <DialogDescription>Bütün qrup üçün eyni növ qiymətləndirmənin ballarını daxil edin.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>Növ</FieldLabel>
            <Select value={String(type)} onValueChange={(v) => setType(Number(v) as ExamType)}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map((t) => (
                  <SelectItem key={t} value={String(t)}>{EXAM_TYPE_LABELS[t]} (maks. {maxScoreFor(t)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Tarix</FieldLabel>
            <DatePicker value={date} onChange={setDate} disabled={(d) => d > new Date()} />
          </Field>
        </div>
        <div className="max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
          {pending.length === 0 ? (
            <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              Bütün tələbələr bu növ üzrə qiymətləndirilib. Dəyişiklik üçün cədvəldəki xanaya klikləyin.
            </p>
          ) : (
            pending.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.fullName}</p>
                  <p className="font-mono text-[0.7rem] text-muted-foreground">{s.studentNumber}</p>
                </div>
                <Input
                  inputMode="decimal"
                  className="h-8 w-20 text-right font-mono"
                  placeholder={`0–${max}`}
                  value={scores[s.id] ?? ""}
                  onChange={(e) => setScores((m) => ({ ...m, [s.id]: e.target.value }))}
                />
              </div>
            ))
          )}
        </div>
        {graded.size > 0 && pending.length > 0 && (
          <p className="text-xs text-muted-foreground">{graded.size} tələbə artıq bu növ üzrə qiymətləndirilib və siyahıda göstərilmir.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Ləğv et</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || pending.length === 0}>
            {save.isPending && <Spinner />} Yadda saxla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
