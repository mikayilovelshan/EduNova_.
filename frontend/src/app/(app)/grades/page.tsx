"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole } from "@/lib/queries";
import { Gradebook } from "./gradebook";
import { StudentGrades } from "./student-grades";

export default function GradesPage() {
  const { isStaff } = useRole();
  return <Suspense fallback={<Skeleton className="h-96" />}>{isStaff ? <Gradebook /> : <StudentGrades />}</Suspense>;
}
