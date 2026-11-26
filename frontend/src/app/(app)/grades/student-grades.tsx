"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Award, BookOpen, ChevronRight, Info, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable } from "@/components/shared/data-table";
import { LetterBadge } from "@/components/shared/letter-badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CardsSkeleton, EmptyState, ErrorState } from "@/components/shared/states";
import { api } from "@/lib/api";
import { EXAM_TYPE_LABELS, formatDate, formatNumber, maxScoreFor } from "@/lib/format";
import { useExamResults, useMe, useMySummaries } from "@/lib/queries";
import type { ExamResult, GradeReport, GradeSummary } from "@/lib/types";

const resultColumns: ColumnDef<ExamResult>[] = [
  { accessorKey: "courseName", header: "Fənn", cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
  {
    accessorKey: "examType",
    header: "Qiymətləndirmə",
    cell: ({ row }) => <Badge variant="secondary">{EXAM_TYPE_LABELS[row.original.examType]}</Badge>,
    sortingFn: "basic",
  },
  {
    accessorKey: "score",
    header: "Bal",
    cell: ({ row }) => (
      <span className="font-display text-base font-semibold tabular">
        {formatNumber(row.original.score)}
        <span className="text-xs font-normal text-muted-foreground"> / {maxScoreFor(row.original.examType)}</span>
      </span>
    ),
  },
  { accessorKey: "evaluationDate", header: "Tarix", cell: ({ getValue }) => formatDate(getValue<string>(), "d MMM yyyy") },
];

/** Stacked bar: attendance + activity make up the entry score (50), the final exam the other 50. */
function ScoreBar({ s }: { s: GradeSummary }) {
  const activity = Math.max(0, s.entryScore - s.attendanceScore);
  const seg = (v: number) => `${Math.min(100, v)}%`;
  return (
    <div className="space-y-1.5">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="bg-mint-mark" style={{ width: seg(s.attendanceScore) }} />
        <div className="bg-primary" style={{ width: seg(activity) }} />
        <div className="bg-lavender-mark" style={{ width: seg(s.finalScore) }} />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-mint-mark" /> Davamiyyət {formatNumber(s.attendanceScore)}</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-primary" /> Fəaliyyət {formatNumber(activity)}</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-lavender-mark" /> İmtahan {formatNumber(s.finalScore)}</span>
      </div>
    </div>
  );
}

export function StudentGrades() {
  const { data: me } = useMe();
  const summaries = useMySummaries();
  const results = useExamResults();
  const [selected, setSelected] = useState<GradeSummary>();

  const list = summaries.data ?? [];
  const avgEntry = list.length ? list.reduce((a, s) => a + s.entryScore, 0) / list.length : 0;
  const best = [...list].sort((a, b) => b.totalScore - a.totalScore)[0];

  if (summaries.error) return <ErrorState error={summaries.error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qiymətlərim"
        description={
          <>
            100 ballıq sistem: imtahanaqədər bal (davamiyyət, gündəlik qiymət, kollokviumlar, sərbəst iş) maksimum 50, yekun imtahan 50 bal.
            Keçid üçün cəmi ən azı 51 və imtahandan ən azı 17 bal tələb olunur.
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Fənlər" value={list.length} icon={BookOpen} loading={summaries.isLoading} />
        <StatCard label="Orta imtahanaqədər bal" value={formatNumber(avgEntry)} icon={TrendingUp} tint="lavender" loading={summaries.isLoading} hint="50 bal üzərindən" />
        <StatCard
          label="Ən yüksək nəticə"
          value={best ? formatNumber(best.totalScore) : "—"}
          icon={Award}
          tint="butter"
          loading={summaries.isLoading}
          hint={best?.courseName}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaries.isLoading ? (
          <CardsSkeleton count={3} className="h-52" />
        ) : list.length ? (
          list.map((s) => (
            <Card key={s.courseOfferingId} className="group gap-4 p-5 transition hover:shadow-md hover:ring-primary/30">
              <div className="flex items-start gap-3">
                <LetterBadge letter={s.letterGrade} pending={!s.hasFinalExam} />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.95rem] leading-snug font-semibold">{s.courseName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.hasFinalExam ? (s.isPassed ? "Fənn keçilib" : "Fənn keçilməyib") : "Yekun imtahan gözlənilir"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[1.75rem] leading-none font-semibold tabular">{formatNumber(s.totalScore)}</p>
                  <p className="text-[0.7rem] text-muted-foreground">/ 100</p>
                </div>
              </div>
              <ScoreBar s={s} />
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2.5 text-center">
                <div>
                  <p className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">İmt.qədər</p>
                  <p className="text-sm font-semibold tabular">{formatNumber(s.entryScore)}<span className="text-xs text-muted-foreground">/50</span></p>
                </div>
                <div>
                  <p className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">İmtahan</p>
                  <p className="text-sm font-semibold tabular">{s.hasFinalExam ? formatNumber(s.finalScore) : "—"}<span className="text-xs text-muted-foreground">/50</span></p>
                </div>
                <div>
                  <p className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">Dərslər</p>
                  <p className="text-sm font-semibold tabular">{s.attendedClasses}/{s.totalClasses}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="-mb-1 mt-auto self-end" onClick={() => setSelected(s)}>
                Ətraflı <ChevronRight data-icon="inline-end" />
              </Button>
            </Card>
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState title="Fənn tapılmadı" description="Qrupunuza hələ fənn təyin edilməyib." />
          </div>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="title-dot font-display text-[1.2rem] font-semibold">Bütün qiymətləndirmələr</h2>
        <DataTable columns={resultColumns} data={results.data ?? []} loading={results.isLoading} initialSorting={[{ id: "evaluationDate", desc: true }]} searchPlaceholder="Fənn üzrə axtar..." />
      </section>

      <ReportDialog summary={selected} studentId={me?.studentId ?? undefined} onClose={() => setSelected(undefined)} />
    </div>
  );
}

export function ReportDialog({ summary, studentId, onClose }: { summary?: GradeSummary; studentId?: string; onClose: () => void }) {
  const offeringId = summary?.courseOfferingId;
  const report = useQuery({
    queryKey: ["exam-results", "report", studentId, offeringId],
    queryFn: () => api<GradeReport>("ExamResult/course-detailed-report", { query: { studentId, courseOfferingId: offeringId } }),
    enabled: !!offeringId && !!studentId,
  });
  const r = report.data;

  return (
    <Dialog open={!!summary} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{summary?.courseName}</DialogTitle>
          <DialogDescription>{summary?.studentFullName} — ətraflı qiymət hesabatı</DialogDescription>
        </DialogHeader>
        {report.isLoading || !r ? (
          <Skeleton className="h-56" />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl border bg-muted/40 p-4">
              <LetterBadge letter={r.letterGrade} pending={!r.hasFinalExam} size="lg" />
              <div className="flex-1">
                <p className="font-display text-3xl font-semibold tabular">{formatNumber(r.totalScore)} <span className="text-base font-normal text-muted-foreground">/ 100</span></p>
                <p className="text-xs text-muted-foreground">
                  İmtahanaqədər {formatNumber(r.entryScore)}/50 · İmtahan {r.hasFinalExam ? formatNumber(r.finalScore) : "—"}/50
                </p>
              </div>
            </div>
            <ul className="divide-y rounded-xl border">
              <li className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  Davamiyyət
                  <Tooltip>
                    <TooltipTrigger asChild><Info className="size-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>İştirak faizi × 10 bal</TooltipContent>
                  </Tooltip>
                </span>
                <span className="font-semibold tabular">{formatNumber(r.attendanceScore, 2)} / 10 <span className="text-xs font-normal text-muted-foreground">({r.attendedClasses}/{r.totalClasses})</span></span>
              </li>
              {r.detailedScores.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span>
                    {EXAM_TYPE_LABELS[d.examType]}
                    <span className="ml-2 text-xs text-muted-foreground">{formatDate(d.evaluationDate, "d MMM")}</span>
                  </span>
                  <span className="font-semibold tabular">{formatNumber(d.score)} / {maxScoreFor(d.examType)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
