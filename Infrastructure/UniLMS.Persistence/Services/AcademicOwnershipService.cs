using Microsoft.EntityFrameworkCore;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Persistence.Contexts;

namespace UniLMS.Persistence.Services
{
    public class AcademicOwnershipService(AppDbContext _context) : IAcademicOwnershipService
    {
        public Task<bool> AttendanceExistsAsync(Guid attendanceId)
            => _context.Attendances.IgnoreQueryFilters().AnyAsync(x => x.Id == attendanceId);

        public Task<bool> CanAccessAttendanceAsync(Guid attendanceId, Guid appUserId)
            => _context.Attendances.AnyAsync(x => x.Id == attendanceId &&
                (x.Student.AppUserId == appUserId || x.CourseSchedule.CourseOffering.Teacher.AppUserId == appUserId));

        public async Task<bool> CanAccessAttendanceRangeAsync(IEnumerable<Guid> attendanceIds, Guid appUserId)
        {
            var ids = attendanceIds.Distinct().ToList();
            return ids.Count > 0 && await _context.Attendances.CountAsync(x => ids.Contains(x.Id) &&
                x.CourseSchedule.CourseOffering.Teacher.AppUserId == appUserId) == ids.Count;
        }

        public Task<bool> CourseScheduleExistsAsync(Guid courseScheduleId)
            => _context.CourseSchedules.IgnoreQueryFilters().AnyAsync(x => x.Id == courseScheduleId);

        public Task<bool> CanManageCourseScheduleAsync(Guid courseScheduleId, Guid appUserId)
            => _context.CourseSchedules.AnyAsync(x => x.Id == courseScheduleId &&
                x.CourseOffering.Teacher.AppUserId == appUserId);

        public Task<bool> ExamResultExistsAsync(Guid examResultId)
            => _context.ExamResults.IgnoreQueryFilters().AnyAsync(x => x.Id == examResultId);

        public Task<bool> CanAccessExamResultAsync(Guid examResultId, Guid appUserId)
            => _context.ExamResults.AnyAsync(x => x.Id == examResultId &&
                (x.Student.AppUserId == appUserId || x.CourseOffering.Teacher.AppUserId == appUserId));

        public Task<bool> StudentExistsAsync(Guid studentId)
            => _context.Students.IgnoreQueryFilters().AnyAsync(x => x.Id == studentId);

        public Task<bool> CourseOfferingExistsAsync(Guid courseOfferingId)
            => _context.CourseOfferings.IgnoreQueryFilters().AnyAsync(x => x.Id == courseOfferingId);

        public async Task<bool> CanAccessStudentCourseAsync(Guid studentId, Guid courseOfferingId, Guid appUserId, bool teacher)
        {
            if (teacher)
                return await _context.CourseOfferings.AnyAsync(x => x.Id == courseOfferingId &&
                    x.Teacher.AppUserId == appUserId);

            var isStudent = await _context.Students.AnyAsync(x => x.Id == studentId && x.AppUserId == appUserId);
            return isStudent && await _context.CourseOfferings.AnyAsync(x =>
                x.Id == courseOfferingId && x.Group.Students.Any(s => s.Id == studentId));
        }

        public Task<bool> CanManageCourseOfferingAsync(Guid courseOfferingId, Guid appUserId)
            => _context.CourseOfferings.AnyAsync(x => x.Id == courseOfferingId &&
                x.Teacher.AppUserId == appUserId);

        public Task<bool> CanManageExamResultAsync(Guid examResultId, Guid appUserId)
            => _context.ExamResults.AnyAsync(x => x.Id == examResultId &&
                x.CourseOffering.Teacher.AppUserId == appUserId);
    }
}
