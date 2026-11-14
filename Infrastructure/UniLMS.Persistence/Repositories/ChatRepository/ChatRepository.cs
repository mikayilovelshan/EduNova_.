using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using UniLMS.Application.DTOs.CourseMaterials;
using UniLMS.Application.DTOs.Courses;
using UniLMS.Application.Repositories.ChatRepository;
using UniLMS.Persistence.Contexts;

namespace UniLMS.Persistence.Repositories.ChatRepository
{
    public class ChatRepository(AppDbContext _context) : IChatRepository
    {
        public async Task<List<CourseDTO>> GetAllCourseAsync()
        {
            return await _context.Courses
                .Select(c => new CourseDTO
                {
                    Name = c.Name
                }).ToListAsync();
        }

        public async Task<List<CourseMaterialDTO>> GetAllCourseMaterialsAsync()
        {
            return await _context.CourseMaterials
                .Select(cm => new CourseMaterialDTO
                {
                    Title = cm.Title
                }).ToListAsync();
        }

        public async Task<List<string>> GetUserCoursesAsync(string userId)
        {
            var studentGuid = Guid.Parse(userId);

            return await _context.Students
                .Where(s => s.AppUserId == studentGuid)
                .Join(_context.CourseOfferings,
                      student => student.GroupId,
                      offering => offering.GroupId,
                      (student, offering) => offering)
                .Include(co => co.Course)
                .Select(co => co.Course.Name)
                .Distinct()
                .ToListAsync();
        }

        public async Task<List<GradeDTO>> GetUserGradesAsync(string userId)
        {
            var studentGuid = Guid.Parse(userId);

            return await _context.ExamResults
                .Include(e => e.Student)
                .Include(e => e.CourseOffering)
                    .ThenInclude(co => co.Course)
                .Where(e => e.Student.AppUserId == studentGuid)
                .Select(e => new GradeDTO
                {
                    CourseName = e.CourseOffering.Course.Name,
                    Grade = (double)e.Score
                })
                .ToListAsync();
        }
    }
}
