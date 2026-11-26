namespace UniLMS.Application.DTOs.ExamResults
{
    public class StudentCourseDetailedReportDTO : StudentExamResultSummaryDTO
    {
        public List<GetExamResultDTO> DetailedScores { get; set; } = new();
    }
}
