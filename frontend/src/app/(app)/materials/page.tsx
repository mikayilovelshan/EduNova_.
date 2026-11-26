"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, FileArchive, FileCode2, FileImage, FileSpreadsheet, FileText, FileType2, Presentation, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/states";
import { apiMessage, backendUrl, errorMessage } from "@/lib/api";
import { courseAccent, formatDate } from "@/lib/format";
import { keys, useCourses, useMaterials, useOfferings, useRole } from "@/lib/queries";
import type { CourseMaterial } from "@/lib/types";
import { cn } from "@/lib/utils";

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf", "doc", "docx", "txt", "md", "rtf"].includes(ext)) return { Icon: FileText, tone: "bg-sky text-sky-ink" };
  if (["ppt", "pptx", "key"].includes(ext)) return { Icon: Presentation, tone: "bg-butter text-butter-ink" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { Icon: FileSpreadsheet, tone: "bg-mint text-mint-ink" };
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return { Icon: FileImage, tone: "bg-lavender text-lavender-ink" };
  if (["zip", "rar", "7z"].includes(ext)) return { Icon: FileArchive, tone: "bg-muted text-muted-foreground" };
  if (["js", "ts", "py", "cs", "java", "sql", "html", "css"].includes(ext)) return { Icon: FileCode2, tone: "bg-peach text-peach-ink" };
  return { Icon: FileType2, tone: "bg-muted text-muted-foreground" };
}

export default function MaterialsPage() {
  const { isStaff, isAdmin } = useRole();
  const qc = useQueryClient();
  const materials = useMaterials();
  const [course, setCourse] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CourseMaterial>();

  const remove = useMutation({
    mutationFn: (m: CourseMaterial) => apiMessage("api/CourseMaterial/delete", { method: "DELETE", query: { filePath: m.filePath } }),
    onSuccess: (msg) => {
      toast.success(msg);
      setToDelete(undefined);
      qc.invalidateQueries({ queryKey: keys.materials });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const courses = useMemo(() => [...new Map((materials.data ?? []).map((m) => [m.courseId, m.courseName])).entries()], [materials.data]);
  const data = (materials.data ?? []).filter((m) => course === "all" || m.courseId === course);

  const columns = useMemo<ColumnDef<CourseMaterial>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Material",
        cell: ({ row }) => {
          const { Icon, tone } = fileIcon(row.original.fileName);
          return (
            <div className="flex items-center gap-3">
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", tone)}>
                <Icon className="size-[1.1rem]" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{row.original.title}</p>
                <p className="truncate text-xs text-muted-foreground">{row.original.description || row.original.fileName}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "courseName",
        header: "Fənn",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-2">
            <span className={cn("size-2 rounded-full", courseAccent(row.original.courseName))} />
            <span className="text-[0.85rem]">{row.original.courseName}</span>
            <Badge variant="outline" className="font-mono text-[0.65rem]">{row.original.courseCode}</Badge>
          </span>
        ),
      },
      { accessorKey: "fileName", header: "Fayl", cell: ({ getValue }) => <span className="font-mono text-xs text-muted-foreground">{getValue<string>()}</span> },
      { accessorKey: "createdDate", header: "Yüklənib", cell: ({ getValue }) => formatDate(getValue<string>(), "d MMM yyyy") },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button asChild size="sm" variant="outline">
              <a href={backendUrl("api/CourseMaterial/download", { filePath: row.original.filePath })} download={row.original.fileName}>
                <Download data-icon="inline-start" /> Yüklə
              </a>
            </Button>
            {isStaff && (
              <Button size="icon-sm" variant="ghost" aria-label="Sil" onClick={() => setToDelete(row.original)}>
                <Trash2 className="text-destructive" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [isStaff],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tədris materialları"
        description={isStaff ? "Fənləriniz üzrə mühazirə, tapşırıq və digər faylları paylaşın." : "Fənləriniz üzrə müəllimlərin paylaşdığı materiallar."}
        actions={
          isStaff && (
            <Button onClick={() => setUploadOpen(true)}>
              <Upload data-icon="inline-start" /> Material yüklə
            </Button>
          )
        }
      />

      {materials.error ? (
        <ErrorState error={materials.error} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={materials.isLoading}
          searchPlaceholder="Başlıq və ya fənn üzrə axtar..."
          emptyText="Hələ material yüklənməyib."
          toolbar={
            <Select value={course} onValueChange={setCourse}>
              <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bütün fənlər</SelectItem>
                {courses.map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      )}

      {isStaff && <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} isAdmin={isAdmin} />}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Material silinsin?</AlertDialogTitle>
            <AlertDialogDescription>
              “{toDelete?.title}” və ona aid fayl birdəfəlik silinəcək. Bu əməliyyatı geri qaytarmaq mümkün deyil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={(e) => { e.preventDefault(); if (toDelete) remove.mutate(toDelete); }} disabled={remove.isPending}>
              {remove.isPending && <Spinner />} Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UploadDialog({ open, onOpenChange, isAdmin }: { open: boolean; onOpenChange: (o: boolean) => void; isAdmin: boolean }) {
  const qc = useQueryClient();
  const offerings = useOfferings();
  const allCourses = useCourses();
  const fileRef = useRef<HTMLInputElement>(null);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Teachers may only upload to courses they teach; admins to any course.
  const options = isAdmin
    ? (allCourses.data ?? []).map((c) => ({ id: c.id, name: `${c.name} (${c.code})` }))
    : [...new Map((offerings.data ?? []).map((o) => [o.courseId, o.courseName])).entries()].map(([id, name]) => ({ id, name }));

  const reset = () => {
    setCourseId("");
    setTitle("");
    setDescription("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const upload = useMutation({
    mutationFn: () => {
      if (!courseId || !title.trim() || !file) throw new Error("Fənn, başlıq və fayl mütləqdir.");
      const form = new FormData();
      form.append("Title", title.trim());
      form.append("Description", description.trim());
      form.append("CourseId", courseId);
      form.append("File", file);
      return apiMessage("api/CourseMaterial/upload", { method: "POST", body: form });
    },
    onSuccess: (msg) => {
      toast.success(msg);
      qc.invalidateQueries({ queryKey: keys.materials });
      reset();
      onOpenChange(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Material yüklə</DialogTitle>
          <DialogDescription>Fayl seçilmiş fənnin bütün tələbələrinə görünəcək.</DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel>Fənn</FieldLabel>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Fənn seçin" /></SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="m-title">Başlıq</FieldLabel>
            <Input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Məs. Mühazirə 3 — Qraf alqoritmləri" />
          </Field>
          <Field>
            <FieldLabel htmlFor="m-desc">Təsvir</FieldLabel>
            <Textarea id="m-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qısa izah (istəyə bağlı)" rows={3} />
          </Field>
          <Field>
            <FieldLabel htmlFor="m-file">Fayl</FieldLabel>
            <label
              htmlFor="m-file"
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed bg-muted/30 px-4 py-6 text-center transition hover:border-primary/50 hover:bg-primary/[0.03]"
            >
              <Upload className="size-5 text-primary" />
              <span className="text-sm font-medium">{file ? file.name : "Faylı seçmək üçün klikləyin"}</span>
              <span className="text-xs text-muted-foreground">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF, DOCX, PPTX, ZIP və s."}</span>
            </label>
            <input ref={fileRef} id="m-file" type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <FieldDescription>Fayllar serverdə təhlükəsiz saxlanılır və yalnız fənnin iştirakçılarına açıqdır.</FieldDescription>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Ləğv et</Button>
          <Button onClick={() => upload.mutate()} disabled={upload.isPending}>
            {upload.isPending ? <Spinner /> : <Upload data-icon="inline-start" />} Yüklə
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
