namespace UniLMS.Application.DTOs.Attendance
{
    /// <summary>
    /// One lesson session (a course schedule slot on a concrete date) with the attendance of every student recorded for it.
    /// </summary>
    public class GetAttendanceDTO
    {
        public Guid CourseScheduleId { get; set; }

        public Guid CourseOfferingId { get; set; }

        public string CourseName { get; set; }

        public string GroupName { get; set; }

        public DateTime Date { get; set; }

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        public List<GetStudentAttendanceDTO> Students { get; set; } = new();
    }
}
