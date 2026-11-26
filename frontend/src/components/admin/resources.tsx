"use client";

import { Badge } from "@/components/ui/badge";
import { courseAccent, DAY_NAMES, DEGREE_LABELS, formatDate, formatNumber, formatTime, initials } from "@/lib/format";
import { keys } from "@/lib/queries";
import type {
  Cafedra,
  Course,
  CourseOffering,
  CourseSchedule,
  Faculty,
  Group,
  Semester,
  Speciality,
  Student,
  Teacher,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { toTimeInput, toTimeSpan } from "./lookups";
import type { ResourceConfig } from "./resource-manager";

const Code = ({ value }: { value: string }) => (
  <Badge variant="outline" className="font-mono text-[0.7rem] tracking-tight">{value || "—"}</Badge>
);

const Muted = ({ value }: { value?: string | null }) => <span className="text-muted-foreground">{value || "—"}</span>;

const Person = ({ first, last, sub }: { first: string; last: string; sub?: string }) => (
  <div className="flex items-center gap-2.5">
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[0.7rem] font-semibold text-primary">{initials(first, last)}</span>
    <div className="min-w-0">
      <p className="truncate font-medium">{first} {last}</p>
      {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
    </div>
  </div>
);

const faculties: ResourceConfig<Faculty> = {
  title: "Fakültələr",
  description: "Universitetin fakültələri. Hər fakültənin kafedraları və ixtisasları olur.",
  singular: "fakültə",
  queryKey: keys.faculties,
  listPath: "Faculties",
  rowLabel: (r) => r.name,
  columns: [
    { accessorKey: "code", header: "Kod", cell: ({ getValue }) => <Code value={getValue<string>()} /> },
    { accessorKey: "name", header: "Ad", cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
    { accessorKey: "description", header: "Təsvir", cell: ({ getValue }) => <Muted value={getValue<string>()} /> },
  ],
  fields: [
    { name: "name", label: "Ad", type: "text", required: true, wide: true },
    { name: "code", label: "Kod", type: "text", required: true, placeholder: "FITM" },
    { name: "description", label: "Təsvir", type: "textarea", wide: true },
  ],
  create: { path: "Faculties" },
  update: { path: "Faculties" },
  remove: { path: "Faculties/soft" },
};

const cafedras: ResourceConfig<Cafedra> = {
  title: "Kafedralar",
  description: "Fakültələrə bağlı kafedralar. Fənlər və müəllimlər kafedralara aiddir.",
  singular: "kafedra",
  queryKey: keys.cafedras,
  listPath: "Cafedra",
  rowLabel: (r) => r.name,
  columns: [
    { accessorKey: "code", header: "Kod", cell: ({ getValue }) => <Code value={getValue<string>()} /> },
    { accessorKey: "name", header: "Ad", cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
    { accessorKey: "facultyName", header: "Fakültə" },
    { accessorKey: "description", header: "Təsvir", cell: ({ getValue }) => <Muted value={getValue<string>()} /> },
  ],
  fields: [
    { name: "name", label: "Ad", type: "text", required: true, wide: true },
    { name: "code", label: "Kod", type: "text", required: true },
    { name: "facultyId", label: "Fakültə", type: "select", lookup: "faculties", required: true },
    { name: "description", label: "Təsvir", type: "textarea", wide: true },
  ],
  create: { path: "Cafedra/create" },
  update: { path: "Cafedra" },
  remove: { path: "Cafedra/soft" },
};

const specialities: ResourceConfig<Speciality> = {
  title: "İxtisaslar",
  description: "Bakalavr və magistr ixtisasları və onların tədris planına daxil olan fənlər.",
  singular: "ixtisas",
  queryKey: keys.specialities,
  listPath: "Speciality",
  rowLabel: (r) => r.name,
  columns: [
    { accessorKey: "code", header: "Kod", cell: ({ getValue }) => <Code value={getValue<string>()} /> },
    { accessorKey: "name", header: "Ad", cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
    {
      accessorKey: "degree",
      header: "Pillə",
      cell: ({ row }) => <Badge variant={row.original.degree === 2 ? "default" : "secondary"}>{DEGREE_LABELS[row.original.degree]}</Badge>,
    },
    { accessorKey: "facultyName", header: "Fakültə", cell: ({ getValue }) => <Muted value={getValue<string>()} /> },
    { id: "courses", header: "Fənlər", accessorFn: (r) => r.courses?.length ?? 0, cell: ({ getValue }) => <span className="tabular">{getValue<number>()}</span> },
  ],
  fields: [
    { name: "name", label: "Ad", type: "text", required: true, wide: true },
    { name: "code", label: "Kod", type: "text", required: true, placeholder: "050509" },
    { name: "degree", label: "Pillə", type: "select", lookup: "degrees", required: true },
    { name: "facultyId", label: "Fakültə", type: "select", lookup: "faculties" },
    { name: "cafedraId", label: "Kafedra", type: "select", lookup: "cafedras" },
    { name: "courseIds", label: "Tədris planındakı fənlər", type: "multiselect", lookup: "courses", wide: true },
    { name: "description", label: "Təsvir", type: "textarea", wide: true },
  ],
  defaults: { degree: "1", courseIds: [] },
  toForm: (r) => ({ ...r, degree: String(r.degree), courseIds: r.courses?.map((c) => c.id) ?? [] }),
  toPayload: (v) => ({
    name: v.name,
    code: v.code,
    description: v.description || null,
    degree: Number(v.degree),
    facultyId: v.facultyId || null,
    cafedraId: v.cafedraId || null,
    courseIds: v.courseIds ?? [],
  }),
  create: { path: "Speciality/create" },
  update: { path: "Speciality/update" },
  remove: { path: "Speciality/soft" },
};

const courses: ResourceConfig<Course> = {
  title: "Fənlər",
  description: "Kafedralar tərəfindən tədris olunan fənlərin kataloqu.",
  singular: "fənn",
  queryKey: keys.courses,
  listPath: "Course",
  rowLabel: (r) => `${r.name} (${r.code})`,
  columns: [
    { accessorKey: "code", header: "Kod", cell: ({ getValue }) => <Code value={getValue<string>()} /> },
    {
      accessorKey: "name",
      header: "Ad",
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <span className={cn("size-2 rounded-full", courseAccent(getValue<string>()))} /> {getValue<string>()}
        </span>
      ),
    },
    { accessorKey: "cafedraName", header: "Kafedra" },
    { accessorKey: "description", header: "Təsvir", cell: ({ getValue }) => <p className="max-w-sm truncate text-muted-foreground">{getValue<string>() || "—"}</p> },
  ],
  fields: [
    { name: "name", label: "Ad", type: "text", required: true, wide: true },
    { name: "code", label: "Kod", type: "text", required: true, placeholder: "CS201" },
    { name: "cafedraId", label: "Kafedra", type: "select", lookup: "cafedras", required: true },
    { name: "description", label: "Təsvir", type: "textarea", wide: true },
  ],
  create: { path: "Course/create" },
  update: { path: "Course/update" },
  remove: { path: "Course/soft" },
};

const semesters: ResourceConfig<Semester> = {
  title: "Semestrlər",
  description: "Tədris dövrləri. Eyni anda yalnız bir semestr aktiv ola bilər — yeni dərs təyinatları aktiv semestrə edilir.",
  singular: "semestr",
  queryKey: keys.semesters,
  listPath: "Semester",
  rowLabel: (r) => r.name,
  columns: [
    { accessorKey: "name", header: "Ad", cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
    { accessorKey: "startDate", header: "Başlanğıc", cell: ({ getValue }) => formatDate(getValue<string>()) },
    { accessorKey: "endDate", header: "Bitmə", cell: ({ getValue }) => formatDate(getValue<string>()) },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge className="bg-mint text-mint-ink">Aktiv</Badge>
        ) : (
          <Badge variant="secondary">Passiv</Badge>
        ),
    },
  ],
  fields: [
    { name: "name", label: "Ad", type: "text", required: true, wide: true, placeholder: "2026/2027 Payız semestri" },
    { name: "startDate", label: "Başlanğıc tarixi", type: "date", required: true },
    { name: "endDate", label: "Bitmə tarixi", type: "date", required: true },
    { name: "isActive", label: "Aktiv semestr", type: "switch", description: "Aktivləşdirildikdə digər semestr avtomatik passiv olur." },
  ],
  defaults: { isActive: false },
  toPayload: (v) => ({ name: v.name, startDate: v.startDate, endDate: v.endDate, isActive: !!v.isActive }),
  create: { path: "Semester/create" },
  update: { path: "Semester/update" },
  remove: { path: "Semester/soft" },
};

const groups: ResourceConfig<Group> = {
  title: "Qruplar",
  description: "Tələbə qrupları. Dərslər qruplara təyin edilir.",
  singular: "qrup",
  queryKey: keys.groups,
  listPath: "Group",
  rowLabel: (r) => r.code,
  columns: [
    { accessorKey: "code", header: "Qrup", cell: ({ getValue }) => <span className="font-mono font-semibold">{getValue<string>()}</span> },
    { accessorKey: "specialityName", header: "İxtisas" },
    {
      id: "students",
      header: "Tələbələr",
      accessorFn: (r) => r.students?.length ?? 0,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {row.original.students.slice(0, 4).map((s) => (
              <span key={s.id} title={s.fullName} className="grid size-7 place-items-center rounded-full border-2 border-card bg-primary/15 text-[0.6rem] font-semibold text-primary">
                {initials(...(s.fullName.split(" ") as [string, string]))}
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground tabular">{row.original.students.length} tələbə</span>
        </div>
      ),
    },
  ],
  fields: [
    { name: "code", label: "Qrup kodu", type: "text", required: true, placeholder: "KE-24A" },
    { name: "specialityId", label: "İxtisas", type: "select", lookup: "specialities", required: true },
    { name: "studentIds", label: "Tələbələr", type: "multiselect", lookup: "students", wide: true, description: "Seçilmiş tələbələr bu qrupa köçürüləcək." },
  ],
  defaults: { studentIds: [] },
  toForm: (r) => ({ code: r.code, specialityId: r.specialityId, studentIds: r.students.map((s) => s.id) }),
  // The update endpoint replaces the member list, so always send the full selection.
  toPayload: (v) => ({ code: v.code, specialityId: v.specialityId, studentIds: v.studentIds ?? [] }),
  create: { path: "Group/create" },
  update: { path: "Group/update" },
  remove: { path: "Group/soft" },
};

const students: ResourceConfig<Student> = {
  title: "Tələbələr",
  description: "Tələbə hesabları və akademik profilləri. Hesab yaradılarkən sistemə giriş üçün şifrə təyin edilir.",
  singular: "tələbə",
  queryKey: keys.students,
  listPath: "Student",
  searchPlaceholder: "Ad, nömrə və ya email üzrə axtar...",
  rowLabel: (r) => `${r.firstName} ${r.lastName} (${r.studentNumber})`,
  columns: [
    {
      id: "name",
      header: "Tələbə",
      accessorFn: (r) => `${r.firstName} ${r.lastName} ${r.email}`,
      cell: ({ row }) => <Person first={row.original.firstName} last={row.original.lastName} sub={row.original.email} />,
    },
    { accessorKey: "studentNumber", header: "Nömrə", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span> },
    { accessorKey: "groupCode", header: "Qrup", cell: ({ getValue }) => (getValue<string>() ? <Badge variant="secondary">{getValue<string>()}</Badge> : <Muted />) },
    { accessorKey: "gpa", header: "ÜOMG", cell: ({ getValue }) => <span className="font-semibold tabular">{formatNumber(getValue<number>())}</span> },
  ],
  fields: [
    { name: "firstName", label: "Ad", type: "text", required: true },
    { name: "lastName", label: "Soyad", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true, placeholder: "ad.soyad@unilms.az" },
    { name: "password", label: "Şifrə", type: "password", required: true, only: "create", description: "Ən azı 6 simvol." },
    { name: "studentNumber", label: "Tələbə nömrəsi", type: "text", required: true, placeholder: "24KE009" },
    { name: "groupId", label: "Qrup", type: "select", lookup: "groups", required: true },
    { name: "gpa", label: "ÜOMG (GPA)", type: "number", only: "create", min: 0, max: 100, step: 0.1 },
  ],
  defaults: { gpa: 0 },
  toPayload: (v, row) =>
    row
      ? { firstName: v.firstName, lastName: v.lastName, email: v.email, studentNumber: v.studentNumber, groupId: v.groupId }
      : { firstName: v.firstName, lastName: v.lastName, email: v.email, password: v.password, studentNumber: v.studentNumber, groupId: v.groupId || null, gpa: Number(v.gpa ?? 0) },
  create: { path: "Student/create" },
  update: { path: "Student/update" },
  remove: { path: "Student/soft", confirm: "deaktiv ediləcək və sistemə daxil ola bilməyəcək." },
};

const teachers: ResourceConfig<Teacher> = {
  title: "Müəllimlər",
  description: "Professor-müəllim heyəti və onların kafedraları.",
  singular: "müəllim",
  queryKey: keys.teachers,
  listPath: "Teacher",
  rowLabel: (r) => `${r.firstName} ${r.lastName}`,
  columns: [
    {
      id: "name",
      header: "Müəllim",
      accessorFn: (r) => `${r.firstName} ${r.lastName} ${r.email}`,
      cell: ({ row }) => <Person first={row.original.firstName} last={row.original.lastName} sub={row.original.email} />,
    },
    { accessorKey: "scientificDegree", header: "Elmi dərəcə" },
    { accessorKey: "cafedraName", header: "Kafedra" },
  ],
  fields: [
    { name: "firstName", label: "Ad", type: "text", required: true },
    { name: "lastName", label: "Soyad", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "password", label: "Şifrə", type: "password", required: true, only: "create" },
    { name: "scientificDegree", label: "Elmi dərəcə / vəzifə", type: "text", required: true, placeholder: "Dosent, t.ü.f.d." },
    { name: "cafedraId", label: "Kafedra", type: "select", lookup: "cafedras", required: true },
  ],
  toPayload: (v, row) => ({
    firstName: v.firstName,
    lastName: v.lastName,
    email: v.email,
    scientificDegree: v.scientificDegree,
    cafedraId: v.cafedraId,
    ...(row ? {} : { password: v.password }),
  }),
  create: { path: "Teacher/create" },
  update: { path: "Teacher/update" },
  remove: { path: "Teacher/soft", confirm: "deaktiv ediləcək və sistemə daxil ola bilməyəcək." },
};

const offerings: ResourceConfig<CourseOffering> = {
  title: "Dərs təyinatları",
  description: "Hansı fənnin hansı qrupa, hansı müəllim tərəfindən və hansı otaqda tədris olunacağı. Yalnız aktiv semestrə təyinat edilir.",
  singular: "təyinat",
  queryKey: keys.offerings,
  listPath: "CourseOffering",
  rowLabel: (r) => `${r.courseName} — ${r.groupCode}`,
  columns: [
    {
      accessorKey: "courseName",
      header: "Fənn",
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <span className={cn("size-2 rounded-full", courseAccent(getValue<string>()))} /> {getValue<string>()}
        </span>
      ),
    },
    { accessorKey: "groupCode", header: "Qrup", cell: ({ getValue }) => <Badge variant="secondary">{getValue<string>()}</Badge> },
    { accessorKey: "teacherName", header: "Müəllim" },
    { accessorKey: "roomCode", header: "Otaq", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span> },
    { accessorKey: "semesterName", header: "Semestr", cell: ({ getValue }) => <Muted value={getValue<string>()} /> },
  ],
  fields: [
    { name: "courseId", label: "Fənn", type: "select", lookup: "courses", required: true, wide: true },
    { name: "groupId", label: "Qrup", type: "select", lookup: "groups", required: true },
    { name: "teacherId", label: "Müəllim", type: "select", lookup: "teachers", required: true },
    { name: "semesterId", label: "Semestr", type: "select", lookup: "semesters", required: true },
    { name: "roomCode", label: "Otaq", type: "text", required: true, placeholder: "301" },
  ],
  toPayload: (v) => ({ courseId: v.courseId, groupId: v.groupId, teacherId: v.teacherId, semesterId: v.semesterId, roomCode: v.roomCode }),
  create: { path: "CourseOffering/create" },
  update: { path: "CourseOffering/update" },
  remove: { path: "CourseOffering/soft" },
};

const schedules: ResourceConfig<CourseSchedule> = {
  title: "Cədvəl slotları",
  description: "Dərs təyinatlarının həftəlik vaxtları. Sistem qrup, müəllim və otaq üzrə üst-üstə düşmələri avtomatik yoxlayır.",
  singular: "slot",
  queryKey: keys.schedules,
  listPath: "CourseSchedule",
  rowLabel: (r) => `${r.courseName} — ${DAY_NAMES[r.dayOfWeek]} ${formatTime(r.startTime)}`,
  columns: [
    { accessorKey: "dayOfWeek", header: "Gün", cell: ({ row }) => <span className="font-medium">{DAY_NAMES[row.original.dayOfWeek]}</span> },
    {
      id: "time",
      header: "Saat",
      accessorFn: (r) => r.startTime,
      cell: ({ row }) => <span className="font-mono text-xs tabular">{formatTime(row.original.startTime)}–{formatTime(row.original.endTime)}</span>,
    },
    { accessorKey: "courseName", header: "Fənn" },
    { accessorKey: "groupName", header: "Qrup", cell: ({ getValue }) => <Badge variant="secondary">{getValue<string>()}</Badge> },
    { accessorKey: "teacherName", header: "Müəllim", cell: ({ getValue }) => <Muted value={getValue<string>()} /> },
    { accessorKey: "roomCode", header: "Otaq", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span> },
  ],
  fields: [
    { name: "courseOfferingId", label: "Dərs təyinatı", type: "select", lookup: "offerings", required: true, wide: true },
    { name: "dayOfWeek", label: "Həftənin günü", type: "select", lookup: "days", required: true },
    { name: "startTime", label: "Başlama saatı", type: "time", required: true },
    { name: "endTime", label: "Bitmə saatı", type: "time", required: true },
  ],
  defaults: { dayOfWeek: "1", startTime: "09:00", endTime: "10:20" },
  toForm: (r) => ({ courseOfferingId: r.courseOfferingId, dayOfWeek: String(r.dayOfWeek), startTime: toTimeInput(r.startTime), endTime: toTimeInput(r.endTime) }),
  toPayload: (v) => ({ courseOfferingId: v.courseOfferingId, dayOfWeek: Number(v.dayOfWeek), startTime: toTimeSpan(v.startTime), endTime: toTimeSpan(v.endTime) }),
  create: { path: "CourseSchedule/create" },
  update: { path: "CourseSchedule/update" },
  remove: { path: "CourseSchedule/soft" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RESOURCES: Record<string, ResourceConfig<any>> = {
  faculties,
  cafedras,
  specialities,
  courses,
  semesters,
  groups,
  students,
  teachers,
  offerings,
  schedules,
};
