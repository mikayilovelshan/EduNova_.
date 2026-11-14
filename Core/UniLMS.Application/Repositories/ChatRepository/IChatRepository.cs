using System;
using System.Collections.Generic;
using System.Text;
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
    }
}
