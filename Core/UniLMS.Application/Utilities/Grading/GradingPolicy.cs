using UniLMS.Domain.Enums;

namespace UniLMS.Application.Utilities.Grading
{
    /// <summary>
    /// Central place for the 100-point grading rules so every endpoint (and the AI assistant) computes grades the same way.
    /// Entry (pre-exam) score: attendance (max 10) + daily/colloquium/independent work, capped at 50.
    /// Final exam: max 50. A course is passed with total >= 51 and final >= 17.
    /// </summary>
    public static class GradingPolicy
    {
        public const decimal MaxAttendanceScore = 10m;
        public const decimal MaxEntryScore = 50m;
        public const decimal MaxFinalScore = 50m;
        public const decimal MinFinalToPass = 17m;
        public const decimal MinTotalToPass = 51m;

        public static decimal MaxScoreFor(ExamType type) => type switch
        {
            ExamType.FinalExam => MaxFinalScore,
            _ => 10m
        };

        public static decimal AttendanceScore(int totalClasses, int attendedClasses)
            => totalClasses > 0 ? Math.Round((decimal)attendedClasses / totalClasses * MaxAttendanceScore, 2) : 0m;

        public static decimal EntryScore(decimal attendanceScore, IEnumerable<(ExamType Type, decimal Score)> results)
        {
            var activity = results.Where(x => x.Type != ExamType.FinalExam).Sum(x => x.Score);
            return Math.Min(MaxEntryScore, attendanceScore + activity);
        }

        public static decimal FinalScore(IEnumerable<(ExamType Type, decimal Score)> results)
            => results.Where(x => x.Type == ExamType.FinalExam).Select(x => x.Score).FirstOrDefault();

        public static bool IsPassed(decimal entryScore, decimal finalScore)
            => entryScore + finalScore >= MinTotalToPass && finalScore >= MinFinalToPass;

        public static string LetterGrade(decimal entryScore, decimal finalScore)
        {
            var total = entryScore + finalScore;
            if (!IsPassed(entryScore, finalScore))
                return "F";

            return total switch
            {
                >= 91 => "A",
                >= 81 => "B",
                >= 71 => "C",
                >= 61 => "D",
                _ => "E"
            };
        }
    }
}
