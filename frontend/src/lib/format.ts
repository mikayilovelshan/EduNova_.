import { format, parseISO } from "date-fns";
import { az } from "date-fns/locale";
import { ExamType, SpecialityDegree, type DayOfWeek, type Role } from "./types";

export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: "Bazar",
  1: "Bazar ertəsi",
  2: "Çərşənbə axşamı",
  3: "Çərşənbə",
  4: "Cümə axşamı",
  5: "Cümə",
  6: "Şənbə",
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  0: "B.",
  1: "B.e.",
  2: "Ç.a.",
  3: "Ç.",
  4: "C.a.",
  5: "C.",
  6: "Ş.",
};

/** Teaching week in display order (Monday first). */
export const WEEK_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6];

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  [ExamType.DailyGrade]: "Gündəlik qiymət",
  [ExamType.Colloquium1]: "Kollokvium 1",
  [ExamType.Colloquium2]: "Kollokvium 2",
  [ExamType.Colloquium3]: "Kollokvium 3",
  [ExamType.IndependentWork]: "Sərbəst iş",
  [ExamType.FinalExam]: "Yekun imtahan",
};

export const EXAM_TYPE_SHORT: Record<ExamType, string> = {
  [ExamType.DailyGrade]: "Gündəlik",
  [ExamType.Colloquium1]: "Koll. 1",
  [ExamType.Colloquium2]: "Koll. 2",
  [ExamType.Colloquium3]: "Koll. 3",
  [ExamType.IndependentWork]: "Sərbəst iş",
  [ExamType.FinalExam]: "İmtahan",
};

export const EXAM_TYPES = Object.keys(EXAM_TYPE_LABELS).map(Number) as ExamType[];

/** Must match GradingPolicy.MaxScoreFor on the backend. */
export const maxScoreFor = (type: ExamType) => (type === ExamType.FinalExam ? 50 : 10);

export const DEGREE_LABELS: Record<SpecialityDegree, string> = {
  [SpecialityDegree.Bachelor]: "Bakalavr",
  [SpecialityDegree.Master]: "Magistr",
};

export const ROLE_LABELS: Record<Role, string> = {
  Admin: "Administrator",
  Teacher: "Müəllim",
  Student: "Tələbə",
};

const toDate = (value: string | Date) => (typeof value === "string" ? parseISO(value) : value);

export const formatDate = (value: string | Date, pattern = "d MMMM yyyy") => format(toDate(value), pattern, { locale: az });

export const formatShortDate = (value: string | Date) => format(toDate(value), "d MMM", { locale: az });

/** "09:00:00" → "09:00" */
export const formatTime = (value: string) => value.slice(0, 5);

export const minutesOf = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

/** Local calendar date as yyyy-MM-dd (what the API expects for DateTime values). */
export const toIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

export const formatNumber = (value: number, digits = 1) =>
  new Intl.NumberFormat("az-Latn-AZ", { maximumFractionDigits: digits }).format(value);

export const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export const initials = (first?: string | null, last?: string | null) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toLocaleUpperCase("az") || "?";

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 6) return "Gecəniz xeyrə qalsın";
  if (h < 12) return "Sabahınız xeyir";
  if (h < 18) return "Günortanız xeyir";
  return "Axşamınız xeyir";
}

/**
 * Stable pastel tint per course so the same subject looks identical in the timetable, cards and badges.
 * Each tint has a pale field, a saturated mark (icons, dots) and an ink that reads on the field.
 */
export type Tint = "mint" | "butter" | "lavender" | "peach" | "sky" | "rose";
export const TINTS: Tint[] = ["mint", "butter", "lavender", "sky", "peach", "rose"];

export const TINT_FIELD: Record<Tint, string> = {
  mint: "bg-mint text-mint-ink",
  butter: "bg-butter text-butter-ink",
  lavender: "bg-lavender text-lavender-ink",
  peach: "bg-peach text-peach-ink",
  sky: "bg-sky text-sky-ink",
  rose: "bg-rose text-rose-ink",
};

export const TINT_MARK: Record<Tint, string> = {
  mint: "bg-mint-mark",
  butter: "bg-butter-mark",
  lavender: "bg-lavender-mark",
  peach: "bg-peach-mark",
  sky: "bg-sky-mark",
  rose: "bg-rose-mark",
};

export const TINT_TEXT: Record<Tint, string> = {
  mint: "text-mint-mark",
  butter: "text-butter-mark",
  lavender: "text-lavender-mark",
  peach: "text-peach-mark",
  sky: "text-sky-mark",
  rose: "text-rose-mark",
};

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

/** Course tints exclude peach so no course competes with the orange accent. */
export const COURSE_TINTS: Tint[] = ["mint", "butter", "lavender", "rose", "sky"];

/**
 * The signed-in user's courses, sorted by name and dealt the tints in order, so neighbouring courses never
 * share a colour (set by CourseTintProvider). Unknown names fall back to a stable hash.
 */
const assigned = new Map<string, Tint>();

export function assignCourseTints(names: string[]) {
  assigned.clear();
  [...new Set(names)].sort((a, b) => a.localeCompare(b, "az")).forEach((n, i) => assigned.set(n, COURSE_TINTS[i % COURSE_TINTS.length]));
  return new Map(assigned);
}

export const courseTint = (key: string): Tint => assigned.get(key) ?? COURSE_TINTS[hash(key) % COURSE_TINTS.length];
/** Pale field + ink for a course block. */
export const courseTone = (key: string) => TINT_FIELD[courseTint(key)];
/** Saturated mark (dot, icon background) for a course. */
export const courseAccent = (key: string) => TINT_MARK[courseTint(key)];

export const LETTER_TONES: Record<string, string> = {
  A: "bg-mint text-mint-ink ring-mint-mark/30",
  B: "bg-sky text-sky-ink ring-sky-mark/30",
  C: "bg-lavender text-lavender-ink ring-lavender-mark/30",
  D: "bg-butter text-butter-ink ring-butter-mark/40",
  E: "bg-peach text-peach-ink ring-peach-mark/30",
  F: "bg-rose text-rose-ink ring-rose-mark/30",
};
