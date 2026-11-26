using UniLMS.Domain.Enums;

namespace UniLMS.Application.DTOs.ExamResults
{
    public class GetExamResultDTO
    {
        public Guid Id { get; set; }

        public Guid StudentId { get; set; }

        public string StudentFullName { get; set; }

        public Guid CourseOfferingId { get; set; }

        public string CourseName { get; set; }

        public ExamType ExamType { get; set; }

        public string ExamTypeName { get; set; }

        public decimal Score { get; set; }

        public DateTime EvaluationDate { get; set; }
    }
}
