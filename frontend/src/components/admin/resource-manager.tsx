"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/shared/data-table";
import { DatePicker } from "@/components/shared/date-picker";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/states";
import { api, apiMessage, errorMessage } from "@/lib/api";
import { toIsoDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MultiSelect } from "./multi-select";
import { useLookup, type LookupName } from "./lookups";

export type FormValues = Record<string, unknown>;

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "textarea" | "number" | "date" | "time" | "switch" | "select" | "multiselect";
  lookup?: LookupName;
  required?: boolean;
  placeholder?: string;
  description?: string;
  /** Only shown when creating / editing. */
  only?: "create" | "edit";
  /** Span both columns of the form grid. */
  wide?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface ResourceConfig<T extends { id: string }> {
  title: string;
  description: string;
  singular: string;
  queryKey: readonly unknown[];
  listPath: string;
  columns: ColumnDef<T, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  fields: FieldDef[];
  create: { path: string };
  update: { path: string };
  remove: { path: string; confirm?: string };
  defaults?: FormValues;
  toForm?: (row: T) => FormValues;
  toPayload?: (values: FormValues, row?: T) => Record<string, unknown>;
  searchPlaceholder?: string;
  rowLabel: (row: T) => string;
}

function FormField({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const options = useLookup(field.lookup);
  const id = `f-${field.name}`;

  const control = (() => {
    switch (field.type) {
      case "textarea":
        return <Textarea id={id} rows={3} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
      case "switch":
        return (
          <div className="flex h-9 items-center gap-3">
            <Switch id={id} checked={!!value} onCheckedChange={onChange} />
            <span className="text-sm text-muted-foreground">{value ? "Bəli" : "Xeyr"}</span>
          </div>
        );
      case "select":
        return (
          <Select value={value == null ? "" : String(value)} onValueChange={onChange}>
            <SelectTrigger id={id} className="h-9 w-full"><SelectValue placeholder={field.placeholder ?? "Seçin"} /></SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                  {o.hint && <span className="ml-1 text-xs text-muted-foreground">· {o.hint}</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "multiselect":
        return <MultiSelect options={options} value={(value as string[]) ?? []} onChange={onChange} placeholder={field.placeholder} />;
      case "date":
        return (
          <DatePicker
            id={id}
            value={value ? new Date(`${String(value).slice(0, 10)}T00:00:00`) : undefined}
            onChange={(d) => onChange(d ? toIsoDate(d) : undefined)}
          />
        );
      default:
        return (
          <Input
            id={id}
            type={field.type}
            value={(value as string | number) ?? ""}
            min={field.min}
            max={field.max}
            step={field.step}
            autoComplete={field.type === "password" ? "new-password" : "off"}
            onChange={(e) => onChange(field.type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value)}
            placeholder={field.placeholder}
            className={cn(field.type === "time" && "font-mono")}
          />
        );
    }
  })();

  return (
    <Field className={cn(field.wide && "sm:col-span-2")}>
      <FieldLabel htmlFor={id}>
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
      </FieldLabel>
      {control}
      {field.description && <FieldDescription>{field.description}</FieldDescription>}
    </Field>
  );
}

/** Generic admin CRUD screen: list + search/sort/paginate, create/edit dialog and soft delete. */
export function ResourceManager<T extends { id: string }>({ config }: { config: ResourceConfig<T> }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: config.queryKey, queryFn: () => api<T[]>(config.listPath) });
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>({});
  const [toDelete, setToDelete] = useState<T>();

  const mode = editing ? "edit" : "create";
  const fields = config.fields.filter((f) => !f.only || f.only === mode);

  const openCreate = () => {
    setEditing(null);
    setValues({ ...(config.defaults ?? {}) });
    setOpen(true);
  };
  const openEdit = (row: T) => {
    setEditing(row);
    setValues(config.toForm ? config.toForm(row) : { ...row });
    setOpen(true);
  };

  // Admin changes ripple into many views (lists, dropdowns, dashboards) so refresh everything.
  const refresh = () => qc.invalidateQueries();

  const save = useMutation({
    mutationFn: () => {
      const missing = fields.find((f) => f.required && (values[f.name] === undefined || values[f.name] === "" || values[f.name] === null));
      if (missing) throw new Error(`“${missing.label}” sahəsi mütləqdir.`);
      const payload = config.toPayload ? config.toPayload(values, editing ?? undefined) : values;
      const body = editing ? { ...payload, id: editing.id } : payload;
      return apiMessage(editing ? config.update.path : config.create.path, { method: editing ? "PUT" : "POST", body });
    },
    onSuccess: (msg) => {
      toast.success(msg);
      setOpen(false);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (row: T) => apiMessage(config.remove.path, { method: "DELETE", body: [row.id] }),
    onSuccess: (msg) => {
      toast.success(msg);
      setToDelete(undefined);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const columns = useMemo<ColumnDef<T, any>[]>( // eslint-disable-line @typescript-eslint/no-explicit-any
    () => [
      ...config.columns,
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Əməliyyatlar">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => openEdit(row.original)}>
                  <Pencil /> Redaktə et
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(row.original)}>
                  <Trash2 /> Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" /> Yeni {config.singular}
          </Button>
        }
      />

      {list.error ? (
        <ErrorState error={list.error} />
      ) : (
        <DataTable columns={columns} data={list.data ?? []} loading={list.isLoading} searchPlaceholder={config.searchPlaceholder} pageSize={12} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editing ? `${config.singular[0].toLocaleUpperCase("az")}${config.singular.slice(1)} — redaktə` : `Yeni ${config.singular}`}</DialogTitle>
            <DialogDescription>{editing ? config.rowLabel(editing) : "Məlumatları daxil edin. * ilə işarələnmiş sahələr mütləqdir."}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <FieldGroup className="grid max-h-[60vh] gap-4 overflow-y-auto px-0.5 pb-1 sm:grid-cols-2">
              {fields.map((f) => (
                <FormField key={f.name} field={f} value={values[f.name]} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
              ))}
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Ləğv et</Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Spinner />} {editing ? "Yadda saxla" : "Yarat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silmək istədiyinizə əminsiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && <strong className="text-foreground">{config.rowLabel(toDelete)}</strong>}{" "}
              {config.remove.confirm ?? "arxivlənəcək (yumşaq silmə). Lazım olduqda bərpa edilə bilər."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) remove.mutate(toDelete);
              }}
            >
              {remove.isPending && <Spinner />} Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
