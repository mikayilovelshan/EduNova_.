"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type {
  AttendanceSession,
  Cafedra,
  Course,
  CourseMaterial,
  CourseOffering,
  CourseSchedule,
  CurrentUser,
  ExamResult,
  Faculty,
  GradeSummary,
  Group,
  GroupStudent,
  Role,
  Semester,
  Speciality,
  Student,
  Teacher,
} from "./types";

export const keys = {
  me: ["me"] as const,
  faculties: ["faculties"] as const,
  cafedras: ["cafedras"] as const,
  specialities: ["specialities"] as const,
  courses: ["courses"] as const,
  groups: ["groups"] as const,
  semesters: ["semesters"] as const,
  students: ["students"] as const,
  teachers: ["teachers"] as const,
  offerings: ["offerings"] as const,
  schedules: ["schedules"] as const,
  attendance: ["attendance"] as const,
  examResults: ["exam-results"] as const,
  mySummaries: ["exam-results", "my-summaries"] as const,
  offeringSummaries: (id: string) => ["exam-results", "offering-summaries", id] as const,
  offeringStudents: (id: string) => ["offerings", id, "students"] as const,
  materials: ["materials"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api<CurrentUser>("api/Auth/me"),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** Convenience role flags for the signed-in user. */
export function useRole() {
  const { data } = useMe();
  const roles = data?.roles ?? [];
  const has = (r: Role) => roles.includes(r);
  return {
    user: data,
    isAdmin: has("Admin"),
    isTeacher: has("Teacher"),
    isStudent: has("Student"),
    /** Can grade, take attendance and upload materials. */
    isStaff: has("Admin") || has("Teacher"),
    primaryRole: (has("Admin") ? "Admin" : has("Teacher") ? "Teacher" : "Student") as Role,
  };
}

const list =
  <T,>(path: string) =>
  () =>
    api<T[]>(path);

export const useFaculties = () => useQuery({ queryKey: keys.faculties, queryFn: list<Faculty>("Faculties") });
export const useCafedras = () => useQuery({ queryKey: keys.cafedras, queryFn: list<Cafedra>("Cafedra") });
export const useSpecialities = () => useQuery({ queryKey: keys.specialities, queryFn: list<Speciality>("Speciality") });
export const useCourses = () => useQuery({ queryKey: keys.courses, queryFn: list<Course>("Course") });
export const useSemesters = () => useQuery({ queryKey: keys.semesters, queryFn: list<Semester>("Semester") });
export const useOfferings = () => useQuery({ queryKey: keys.offerings, queryFn: list<CourseOffering>("CourseOffering") });
export const useSchedules = () => useQuery({ queryKey: keys.schedules, queryFn: list<CourseSchedule>("CourseSchedule") });
export const useAttendance = () => useQuery({ queryKey: keys.attendance, queryFn: list<AttendanceSession>("Attendance") });
export const useExamResults = () => useQuery({ queryKey: keys.examResults, queryFn: list<ExamResult>("ExamResult") });
export const useMaterials = () => useQuery({ queryKey: keys.materials, queryFn: list<CourseMaterial>("api/CourseMaterial") });

export const useGroups = (enabled = true) => useQuery({ queryKey: keys.groups, queryFn: list<Group>("Group"), enabled });
export const useStudents = (enabled = true) => useQuery({ queryKey: keys.students, queryFn: list<Student>("Student"), enabled });
export const useTeachers = (enabled = true) => useQuery({ queryKey: keys.teachers, queryFn: list<Teacher>("Teacher"), enabled });

export const useMySummaries = (enabled = true) =>
  useQuery({ queryKey: keys.mySummaries, queryFn: list<GradeSummary>("ExamResult/my-summaries"), enabled });

export const useOfferingSummaries = (offeringId?: string) =>
  useQuery({
    queryKey: keys.offeringSummaries(offeringId ?? ""),
    queryFn: () => api<GradeSummary[]>("ExamResult/offering-summaries", { query: { courseOfferingId: offeringId } }),
    enabled: !!offeringId,
  });

export const useOfferingStudents = (offeringId?: string) =>
  useQuery({
    queryKey: keys.offeringStudents(offeringId ?? ""),
    queryFn: () => api<GroupStudent[]>(`CourseOffering/${offeringId}/students`),
    enabled: !!offeringId,
  });

export const useActiveSemester = () => {
  const q = useSemesters();
  return { ...q, data: q.data?.find((s) => s.isActive) };
};
