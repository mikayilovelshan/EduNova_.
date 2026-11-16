using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace UniLMS.Application.Interfaces.Services
{
    public interface IAcademicOwnershipService
    {
        Task<bool> AttendanceExistsAsync(Guid attendanceId);
        Task<bool> CanAccessAttendanceAsync(Guid attendanceId, Guid appUserId);
        Task<bool> CanAccessAttendanceRangeAsync(IEnumerable<Guid> attendanceIds, Guid appUserId);
        Task<bool> CourseScheduleExistsAsync(Guid courseScheduleId);
        Task<bool> CanManageCourseScheduleAsync(Guid courseScheduleId, Guid appUserId);
        Task<bool> ExamResultExistsAsync(Guid examResultId);
        Task<bool> CanAccessExamResultAsync(Guid examResultId, Guid appUserId);
        Task<bool> StudentExistsAsync(Guid studentId);
        Task<bool> CourseOfferingExistsAsync(Guid courseOfferingId);
        Task<bool> CanAccessStudentCourseAsync(Guid studentId, Guid courseOfferingId, Guid appUserId, bool teacher);
        Task<bool> CanManageCourseOfferingAsync(Guid courseOfferingId, Guid appUserId);
        Task<bool> CanManageExamResultAsync(Guid examResultId, Guid appUserId);
    }
}
