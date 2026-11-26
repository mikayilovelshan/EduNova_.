"use client";

import { Building2, GraduationCap, Hash, LogOut, Mail, Monitor, Moon, ShieldCheck, Sun, UsersRound } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLogout } from "@/components/layout/use-logout";
import { PageHeader } from "@/components/shared/page-header";
import { formatNumber, initials, ROLE_LABELS } from "@/lib/format";
import { useRole } from "@/lib/queries";

export default function ProfilePage() {
  const { user } = useRole();
  const { theme, setTheme } = useTheme();
  const logout = useLogout();
  if (!user) return null;

  const rows = [
    { icon: Mail, label: "Email", value: user.email },
    user.studentNumber && { icon: Hash, label: "Tələbə nömrəsi", value: user.studentNumber, mono: true },
    user.groupCode && { icon: UsersRound, label: "Qrup", value: user.groupCode },
    user.specialityName && { icon: GraduationCap, label: "İxtisas", value: user.specialityName },
    user.gpa != null && { icon: GraduationCap, label: "ÜOMG", value: formatNumber(user.gpa) },
    user.scientificDegree && { icon: GraduationCap, label: "Elmi dərəcə", value: user.scientificDegree },
    user.cafedraName && { icon: Building2, label: "Kafedra", value: user.cafedraName },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; mono?: boolean }[];

  return (
    <div className="space-y-6">
      <PageHeader title="Profil" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="items-center p-6 text-center lg:row-span-2">
          <Avatar className="size-24">
            <AvatarFallback className="bg-butter font-display text-3xl font-semibold text-butter-ink">
              {initials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-display text-2xl font-semibold">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {user.roles.map((r) => (
              <Badge key={r} className="gap-1"><ShieldCheck className="size-3" /> {ROLE_LABELS[r]}</Badge>
            ))}
          </div>
          <Button variant="outline" className="mt-2 w-full" onClick={logout}>
            <LogOut data-icon="inline-start" /> Çıxış
          </Button>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Şəxsi və akademik məlumatlar</CardTitle>
            <CardDescription>Məlumatlarda səhv varsa, dekanlıq ilə əlaqə saxlayın.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-3 py-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><r.icon className="size-4" /></span>
                  <dt className="w-36 text-sm text-muted-foreground">{r.label}</dt>
                  <dd className={r.mono ? "font-mono text-sm font-medium" : "text-sm font-medium"}>{r.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Görünüş</CardTitle>
            <CardDescription>İnterfeys mövzusunu seçin.</CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup type="single" variant="outline" value={theme} onValueChange={(v) => v && setTheme(v)}>
              <ToggleGroupItem value="light" className="gap-1.5 px-4"><Sun /> İşıqlı</ToggleGroupItem>
              <ToggleGroupItem value="dark" className="gap-1.5 px-4"><Moon /> Qaranlıq</ToggleGroupItem>
              <ToggleGroupItem value="system" className="gap-1.5 px-4"><Monitor /> Sistem</ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
