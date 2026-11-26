"use client";

import { DAY_NAMES, DEGREE_LABELS, formatTime, WEEK_DAYS } from "@/lib/format";
import {
  useCafedras,
  useCourses,
  useFaculties,
  useGroups,
  useOfferings,
  useSemesters,
  useSpecialities,
  useStudents,
  useTeachers,
} from "@/lib/queries";
import { SpecialityDegree } from "@/lib/types";
import type { Option } from "./multi-select";

export type LookupName =
  | "faculties"
  | "cafedras"
  | "specialities"
  | "courses"
  | "groups"
  | "semesters"
  | "teachers"
  | "students"
  | "offerings"
  | "days"
  | "degrees";

/**
 * Options for select fields. Every hook is called unconditionally (rules of hooks) but only the
 * requested list is enabled; TanStack Query dedupes with the lists already cached elsewhere.
 */
export function useLookup(name?: LookupName): Option[] {
  const faculties = useFaculties();
  const cafedras = useCafedras();
  const specialities = useSpecialities();
  const courses = useCourses();
  const groups = useGroups(name === "groups");
  const semesters = useSemesters();
  const teachers = useTeachers(name === "teachers");
  const students = useStudents(name === "students");
  const offerings = useOfferings();

  switch (name) {
    case "faculties":
      return (faculties.data ?? []).map((x) => ({ value: x.id, label: x.name, hint: x.code }));
    case "cafedras":
      return (cafedras.data ?? []).map((x) => ({ value: x.id, label: x.name, hint: x.code }));
    case "specialities":
      return (specialities.data ?? []).map((x) => ({ value: x.id, label: x.name, hint: x.code }));
    case "courses":
      return (courses.data ?? []).map((x) => ({ value: x.id, label: x.name, hint: x.code }));
    case "groups":
      return (groups.data ?? []).map((x) => ({ value: x.id, label: x.code, hint: x.specialityName }));
    case "semesters":
      return (semesters.data ?? []).map((x) => ({ value: x.id, label: x.name, hint: x.isActive ? "aktiv" : undefined }));
    case "teachers":
      return (teachers.data ?? []).map((x) => ({ value: x.id, label: `${x.firstName} ${x.lastName}`, hint: x.cafedraName }));
    case "students":
      return (students.data ?? []).map((x) => ({ value: x.id, label: `${x.firstName} ${x.lastName}`, hint: x.studentNumber }));
    case "offerings":
      return (offerings.data ?? []).map((x) => ({ value: x.id, label: `${x.courseName} · ${x.groupCode}`, hint: x.teacherName }));
    case "days":
      return WEEK_DAYS.map((d) => ({ value: String(d), label: DAY_NAMES[d] }));
    case "degrees":
      return [SpecialityDegree.Bachelor, SpecialityDegree.Master].map((d) => ({ value: String(d), label: DEGREE_LABELS[d] }));
    default:
      return [];
  }
}

export const toTimeInput = (t?: string) => (t ? formatTime(t) : "");
export const toTimeSpan = (t: unknown) => (typeof t === "string" && t.length === 5 ? `${t}:00` : t);
