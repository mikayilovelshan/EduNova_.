"use client";

import { useParams } from "next/navigation";
import { RoleGate } from "@/components/layout/auth-gate";
import { ResourceManager } from "@/components/admin/resource-manager";
import { RESOURCES } from "@/components/admin/resources";
import { EmptyState } from "@/components/shared/states";

export default function AdminResourcePage() {
  const { resource } = useParams<{ resource: string }>();
  const config = RESOURCES[resource];

  return (
    <RoleGate roles={["Admin"]}>
      {config ? <ResourceManager key={resource} config={config} /> : <EmptyState title="Bölmə tapılmadı" />}
    </RoleGate>
  );
}
