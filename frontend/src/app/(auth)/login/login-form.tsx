"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Logo } from "@/components/layout/logo";
import { Spinner } from "@/components/ui/spinner";

const schema = z.object({
  email: z.email("Düzgün email ünvanı daxil edin."),
  password: z.string().min(6, "Şifrə ən azı 6 simvol olmalıdır."),
});

type Values = z.infer<typeof schema>;

const DEMO = [
  { role: "Tələbə", email: "student@unilms.az", password: "Student123!" },
  { role: "Müəllim", email: "teacher@unilms.az", password: "Teacher123!" },
  { role: "Admin", email: "admin@unilms.az", password: "Admin123!" },
];

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.message ?? "Daxil olmaq mümkün olmadı.");
      return;
    }
    const next = params.get("next");
    router.replace(next && next.startsWith("/") ? next : "/");
    router.refresh();
  });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <h1 className="title-dot font-display text-[2rem] leading-tight font-semibold">Xoş gəlmisiniz</h1>
        <p className="text-sm text-muted-foreground">Universitet hesabınızla sistemə daxil olun.</p>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="gap-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <InputGroup className="h-11 rounded-xl">
              <InputGroupAddon>
                <Mail />
              </InputGroupAddon>
              <InputGroupInput id="email" type="email" autoComplete="email" placeholder="ad.soyad@unilms.az" aria-invalid={!!errors.email} {...form.register("email")} />
            </InputGroup>
            <FieldError errors={[errors.email]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Şifrə</FieldLabel>
            <InputGroup className="h-11 rounded-xl">
              <InputGroupAddon>
                <Lock />
              </InputGroupAddon>
              <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                {...form.register("password")}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <FieldError errors={[errors.password]} />
          </Field>

          <Button type="submit" size="lg" className="h-11 text-[0.9rem]" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            Daxil ol
            {!isSubmitting && <ArrowRight data-icon="inline-end" />}
          </Button>
        </FieldGroup>
      </form>

      {process.env.NODE_ENV !== "production" && (
        <div className="rounded-2xl bg-muted/70 p-4">
          <p className="mb-2.5 text-[0.75rem] font-medium text-muted-foreground">Demo hesablar</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO.map((d) => (
              <Button
                key={d.email}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("email", d.email);
                  form.setValue("password", d.password);
                }}
              >
                {d.role}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Hesabınız yoxdur? Hesablar dekanlıq tərəfindən yaradılır.
      </p>
    </div>
  );
}
