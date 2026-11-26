using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using UniLMS.Application.DTOs.Chat;
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
    
        public async Task<ChatUserContextDTO> GetUserContextAsync(Guid appUserId)
        {
            var user = await _context.Users.AsNoTracking().FirstAsync(x => x.Id == appUserId);
            var roles = await (from ur in _context.UserRoles
                               join r in _context.Roles on ur.RoleId equals r.Id
                               where ur.UserId == appUserId
                               select r.Name!).ToListAsync();

            var context = new ChatUserContextDTO
            {
                FullName = $"{user.FirstName} {user.LastName}",
                Roles = roles,
                ActiveSemester = await _context.Semesters.Where(x => x.IsActive).Select(x => x.Name).FirstOrDefaultAsync()
            };

            IQueryable<Domain.Entities.CourseOffering> offerings;
            Guid? studentId = null;

            var student = await _context.Students.AsNoTracking()
                .Where(x => x.AppUserId == appUserId)
                .Select(x => new { x.Id, x.StudentNumber, x.GPA, x.GroupId, GroupCode = x.Group != null ? x.Group.Code : null, Speciality = x.Group != null ? x.Group.Speciality.Name : null })
                .FirstOrDefaultAsync();

            var teacher = await _context.Teachers.AsNoTracking()
                .Where(x => x.AppUserId == appUserId)
                .Select(x => new { x.Id, x.ScientificDegree, Cafedra = x.Cafedra.Name })
                .FirstOrDefaultAsync();

            if (student != null)
            {
                studentId = student.Id;
                context.StudentNumber = student.StudentNumber;
                context.GPA = student.GPA;
                context.GroupCode = student.GroupCode;
                context.SpecialityName = student.Speciality;
                offerings = _context.CourseOfferings.Where(x => student.GroupId != null && x.GroupId == student.GroupId);
            }
            else if (teacher != null)
            {
                context.ScientificDegree = teacher.ScientificDegree;
                context.CafedraName = teacher.Cafedra;
                offerings = _context.CourseOfferings.Where(x => x.TeacherId == teacher.Id);
            }
            else
            {
                // Administrators get an overview of the active semester only, no personal grades exist for them.
                offerings = _context.CourseOfferings.Where(x => x.Semester.IsActive);
            }

            var courseRows = await offerings.AsNoTracking()
                .Select(x => new
                {
                    x.Id,
                    x.CourseId,
                    CourseName = x.Course.Name,
                    CourseCode = x.Course.Code,
                    TeacherName = x.Teacher.AppUser.FirstName + " " + x.Teacher.AppUser.LastName,
                    GroupCode = x.Group.Code,
                    x.RoomCode,
                    SemesterName = x.Semester.Name,
                    StudentCount = x.Group.Students.Count(),
                    Schedules = x.CourseSchedules.Where(s => !s.IsDeleted).Select(s => new { s.DayOfWeek, s.StartTime, s.EndTime }).ToList()
                })
                .ToListAsync();

            var offeringIds = courseRows.Select(x => x.Id).ToList();
            var courseIds = courseRows.Select(x => x.CourseId).Distinct().ToList();

            var materials = await _context.CourseMaterials.AsNoTracking()
                .Where(x => courseIds.Contains(x.CourseId))
                .Select(x => new { x.Id, x.CourseId, x.Title, x.Description, x.FilePath, x.FileName, CourseName = x.Course.Name })
                .ToListAsync();

            context.MaterialSources = materials.Select(m => new ChatMaterialSourceDTO
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                CourseName = m.CourseName,
                FilePath = m.FilePath,
                FileName = m.FileName
            }).ToList();

            var attendances = studentId.HasValue
                ? await _context.Attendances.AsNoTracking()
                    .Where(x => x.StudentId == studentId && offeringIds.Contains(x.CourseSchedule!.CourseOfferingId))
                    .Select(x => new { x.CourseSchedule!.CourseOfferingId, x.IsPresent })
                    .ToListAsync()
                : new();

            var results = studentId.HasValue
                ? await _context.ExamResults.AsNoTracking()
                    .Where(x => x.StudentId == studentId && offeringIds.Contains(x.CourseOfferingId))
                    .Select(x => new { x.CourseOfferingId, x.ExamType, x.Score, x.EvaluationDate })
                    .ToListAsync()
                : new();

            foreach (var row in courseRows)
            {
                var rowAttendance = attendances.Where(a => a.CourseOfferingId == row.Id).ToList();
                context.Courses.Add(new ChatCourseContextDTO
                {
                    CourseName = row.CourseName,
                    CourseCode = row.CourseCode,
                    TeacherName = row.TeacherName,
                    GroupCode = row.GroupCode,
                    RoomCode = row.RoomCode,
                    SemesterName = row.SemesterName,
                    StudentCount = row.StudentCount,
                    TotalClasses = rowAttendance.Count,
                    AttendedClasses = rowAttendance.Count(a => a.IsPresent),
                    Results = results.Where(r => r.CourseOfferingId == row.Id)
                        .OrderBy(r => r.EvaluationDate)
                        .Select(r => (r.ExamType, r.Score, r.EvaluationDate)).ToList(),
                    Materials = materials.Where(m => m.CourseId == row.CourseId).Select(m => m.Title).ToList()
                });

                context.Schedule.AddRange(row.Schedules.Select(s => new ChatScheduleItemDTO
                {
                    Day = s.DayOfWeek,
                    Start = s.StartTime,
                    End = s.EndTime,
                    CourseName = row.CourseName,
                    GroupCode = row.GroupCode,
                    RoomCode = row.RoomCode,
                    TeacherName = row.TeacherName
                }));
            }

            context.Schedule = context.Schedule.OrderBy(x => ((int)x.Day + 6) % 7).ThenBy(x => x.Start).ToList();
            return context;
        }
    }
}
