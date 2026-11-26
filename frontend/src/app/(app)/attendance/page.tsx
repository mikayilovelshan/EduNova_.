"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole } from "@/lib/queries";
import { StaffAttendance } from "./staff-attendance";
import { StudentAttendance } from "./student-attendance";

export default function AttendancePage() {
  const { isStaff } = useRole();
  return <Suspense fallback={<Skeleton className="h-96" />}>{isStaff ? <StaffAttendance /> : <StudentAttendance />}</Suspense>;
}
