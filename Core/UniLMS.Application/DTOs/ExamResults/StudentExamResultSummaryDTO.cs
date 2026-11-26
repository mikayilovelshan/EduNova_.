namespace UniLMS.Application.DTOs.ExamResults
{
    public class StudentExamResultSummaryDTO
    {
        public Guid StudentId { get; set; }

        public string StudentFullName { get; set; }

        public Guid CourseOfferingId { get; set; }

        public string CourseName { get; set; }

        public decimal AttendanceScore { get; set; }

        public int TotalClasses { get; set; }

        public int AttendedClasses { get; set; }

        public decimal EntryScore { get; set; }

        public decimal FinalScore { get; set; }

        public bool HasFinalExam { get; set; }

        public decimal TotalScore  => EntryScore + FinalScore; 

        public string LetterGrade {  get; set; }

        public bool IsPassed { get; set; }
    }
}
