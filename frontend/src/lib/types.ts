// Mirrors the .NET DTOs (System.Text.Json camelCase). Enums are serialized as numbers.

export type Role = "Admin" | "Teacher" | "Student";

export interface ApiResult<T = unknown> {
  success: boolean;
  message?: string | null;
  data?: T;
}

export interface CurrentUser {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  roles: Role[];
  studentId: string | null;
  studentNumber: string | null;
  gpa: number | null;
  groupId: string | null;
  groupCode: string | null;
  specialityName: string | null;
  teacherId: string | null;
  scientificDegree: string | null;
  cafedraName: string | null;
}

/** 0 = Sunday … 6 = Saturday (System.DayOfWeek). */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export enum ExamType {
  DailyGrade = 0,
  Colloquium1 = 1,
  Colloquium2 = 2,
  Colloquium3 = 3,
  IndependentWork = 4,
  FinalExam = 5,
}

export enum SpecialityDegree {
  Bachelor = 1,
  Master = 2,
}

export interface Faculty {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

export interface Cafedra {
  id: string;
  name: string;
  code: string;
  description: string | null;
  facultyId: string;
  facultyName: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  cafedraId: string;
  cafedraName: string;
}

export interface Speciality {
  id: string;
  name: string;
  code: string;
  description: string | null;
  degree: SpecialityDegree;
  facultyId: string | null;
  facultyName: string | null;
  cafedraId: string | null;
  cafedraName: string | null;
  courses: Course[];
}

export interface GroupStudent {
  id: string;
  studentNumber: string;
  fullName: string;
}

export interface Group {
  id: string;
  code: string;
  specialityId: string;
  specialityName: string;
  students: GroupStudent[];
}

export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentNumber: string;
  gpa: number;
  groupId: string | null;
  groupCode: string | null;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  scientificDegree: string;
  cafedraId: string;
  cafedraName: string;
}

export interface CourseOffering {
  id: string;
  semesterId: string;
  groupId: string;
  courseId: string;
  teacherId: string;
  semesterName: string;
  groupCode: string;
  courseName: string;
  teacherName: string;
  roomCode: string;
}

export interface CourseSchedule {
  id: string;
  dayOfWeek: DayOfWeek;
  courseOfferingId: string;
  /** "HH:mm:ss" */
  startTime: string;
  endTime: string;
  courseName: string;
  teacherName: string;
  groupName: string;
  roomCode: string;
}

export interface StudentAttendance {
  attendanceId: string;
  studentId: string;
  studentFullName: string;
  isPresent: boolean;
  note: string | null;
}

/** One lesson session: a schedule slot on a date, with its students. */
export interface AttendanceSession {
  courseScheduleId: string;
  courseOfferingId: string;
  courseName: string;
  groupName: string;
  date: string;
  startTime: string;
  endTime: string;
  students: StudentAttendance[];
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentFullName: string;
  courseOfferingId: string;
  courseName: string;
  examType: ExamType;
  examTypeName: string;
  score: number;
  evaluationDate: string;
}

export interface GradeSummary {
  studentId: string;
  studentFullName: string;
  courseOfferingId: string;
  courseName: string;
  attendanceScore: number;
  totalClasses: number;
  attendedClasses: number;
  entryScore: number;
  finalScore: number;
  hasFinalExam: boolean;
  totalScore: number;
  letterGrade: string;
  isPassed: boolean;
}

export interface GradeReport extends GradeSummary {
  detailedScores: ExamResult[];
}

export interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  fileName: string;
  filePath: string;
  createdDate: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
