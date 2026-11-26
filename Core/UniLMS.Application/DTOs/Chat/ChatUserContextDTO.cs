using UniLMS.Domain.Enums;

namespace UniLMS.Application.DTOs.Chat
{
    /// <summary>Everything the AI assistant is allowed to know about the signed-in user. Only the user's own data.</summary>
    public class ChatUserContextDTO
    {
        public string FullName { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new();

        public string? StudentNumber { get; set; }
        public decimal? GPA { get; set; }
        public string? GroupCode { get; set; }
        public string? SpecialityName { get; set; }

        public string? ScientificDegree { get; set; }
        public string? CafedraName { get; set; }

        public string? ActiveSemester { get; set; }

        public List<ChatCourseContextDTO> Courses { get; set; } = new();
        public List<ChatScheduleItemDTO> Schedule { get; set; } = new();

        /// <summary>Uploaded materials of the user's own courses; the assistant may search their text (RAG).</summary>
        public List<ChatMaterialSourceDTO> MaterialSources { get; set; } = new();
    }

    public class ChatMaterialSourceDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
    }

    public class ChatCourseContextDTO
    {
        public string CourseName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public string GroupCode { get; set; } = string.Empty;
        public string RoomCode { get; set; } = string.Empty;
        public string SemesterName { get; set; } = string.Empty;
        public int TotalClasses { get; set; }
        public int AttendedClasses { get; set; }
        public int StudentCount { get; set; }
        public List<(ExamType Type, decimal Score, DateTime Date)> Results { get; set; } = new();
        public List<string> Materials { get; set; } = new();
    }

    public class ChatScheduleItemDTO
    {
        public DayOfWeek Day { get; set; }
        public TimeSpan Start { get; set; }
        public TimeSpan End { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string GroupCode { get; set; } = string.Empty;
        public string RoomCode { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
    }
}
