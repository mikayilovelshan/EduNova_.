using UniLMS.Application.DTOs.Chat;
using UniLMS.Application.DTOs.CourseMaterials;
using UniLMS.Application.DTOs.Courses;

namespace UniLMS.Application.Repositories.ChatRepository
{
    public interface IChatRepository
    {
        Task<List<CourseDTO>> GetAllCourseAsync();
        Task<List<CourseMaterialDTO>> GetAllCourseMaterialsAsync();
        Task<List<string>> GetUserCoursesAsync(string userId);
        Task<List<GradeDTO>> GetUserGradesAsync(string userId);

        /// <summary>Builds the personal, role-scoped context (courses, schedule, attendance, results) of a user.</summary>
        Task<ChatUserContextDTO> GetUserContextAsync(Guid appUserId);
    }
}
