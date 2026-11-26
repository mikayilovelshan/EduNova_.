"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { RoleGate } from "@/components/layout/auth-gate";
import { PageHeader } from "@/components/shared/page-header";
import { apiMessage, errorMessage } from "@/lib/api";

const schema = z
  .object({
    name: z.string().trim().min(1, "Ad mütləqdir."),
    surname: z.string().trim().min(1, "Soyad mütləqdir."),
    email: z.email("Düzgün email daxil edin."),
    password: z.string().min(6, "Şifrə ən azı 6 simvol olmalıdır."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Şifrələr eyni deyil.", path: ["confirmPassword"] });

type Values = z.infer<typeof schema>;

export default function AdministratorsPage() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", surname: "", email: "", password: "", confirmPassword: "" } });
  const { errors } = form.formState;

  const create = useMutation({
    mutationFn: (v: Values) => apiMessage("api/Auth/register", { method: "POST", body: v }),
    onSuccess: (msg) => {
      toast.success(msg);
      form.reset();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const fields: { name: keyof Values; label: string; type?: string }[] = [
    { name: "name", label: "Ad" },
    { name: "surname", label: "Soyad" },
    { name: "email", label: "Email", type: "email" },
    { name: "password", label: "Şifrə", type: "password" },
    { name: "confirmPassword", label: "Şifrənin təkrarı", type: "password" },
  ];

  return (
    <RoleGate roles={["Admin"]}>
      <div className="space-y-6">
        <PageHeader title="Administratorlar" description="Sistemi idarə edəcək yeni administrator hesabı yaradın." />
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserPlus className="size-4 text-primary" /> Yeni administrator</CardTitle>
              <CardDescription>Hesab dərhal aktiv olur və tam idarəetmə hüququ verir.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit((v) => create.mutate(v))} noValidate>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  {fields.map((f) => (
                    <Field key={f.name} data-invalid={!!errors[f.name]} className={f.name === "email" ? "sm:col-span-2" : undefined}>
                      <FieldLabel htmlFor={f.name}>{f.label}</FieldLabel>
                      <Input id={f.name} type={f.type ?? "text"} autoComplete={f.type === "password" ? "new-password" : "off"} aria-invalid={!!errors[f.name]} {...form.register(f.name)} />
                      <FieldError errors={[errors[f.name]]} />
                    </Field>
                  ))}
                </FieldGroup>
                <div className="mt-6 flex justify-end">
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? <Spinner /> : <UserPlus data-icon="inline-start" />} Hesab yarat
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <div className="lg:col-span-2">
            <Alert>
              <ShieldCheck />
              <AlertTitle>Tələbə və müəllim hesabları</AlertTitle>
              <AlertDescription>
                Tələbə və müəllim hesabları akademik profil ilə birlikdə “Tələbələr” və “Müəllimlər” bölmələrindən yaradılır. Bu səhifə yalnız
                administratorlar üçündür.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
