"use client";

import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { AdminDashboard, TeacherDashboard } from "@/components/dashboard/staff-dashboard";
import { useRole } from "@/lib/queries";

export default function DashboardPage() {
  const { isAdmin, isTeacher } = useRole();
  if (isAdmin) return <AdminDashboard />;
  if (isTeacher) return <TeacherDashboard />;
  return <StudentDashboard />;
}
