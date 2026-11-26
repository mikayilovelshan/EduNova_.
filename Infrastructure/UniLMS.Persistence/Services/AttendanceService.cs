using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using System;
using System.Collections.Generic;
using System.Text;
using UniLMS.Application.DTOs.Attendance;
using UniLMS.Application.DTOs.Cafedras;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Application.Repositories.AttendanceRepository;
using UniLMS.Application.Repositories.CourseScheduleRepository;
using UniLMS.Application.Utilities.Results;
using UniLMS.Domain.Entities;

namespace UniLMS.Persistence.Services
{
    public class AttendanceService(IAttendanceReadRepository _attendanceRead,
        IAttendanceWriteRepository _attendanceWrite,
        ICourseScheduleReadRepository _courseScheduleRead,
        IMapper _mapper) : IAttendanceService
    {
        public async Task<IResult> CreateRangeAsync(CreateAttendanceRangeDTO model)
        {
            var courseSchedule = await _courseScheduleRead.GetByIdAsync(model.CourseScheduleId, tracking: false);

            if (courseSchedule == null)
                return new ErrorResult("Dərs cədvəli tapılmadı.");

            var date = model.Date.Date;

            if (date.DayOfWeek != courseSchedule.DayOfWeek)
                return new ErrorResult("Seçilmiş tarix bu dərsin cədvəldəki gününə uyğun gəlmir.");

            var attendance = await _attendanceRead.GetWhere(x => x.CourseScheduleId == model.CourseScheduleId && x.Date.Date == date, tracking: false).AnyAsync();

            if (attendance)
                return new ErrorResult("Bu dərs və tarix üçün davamiyyət artıq qeydə alınıb.");

            var studentsId = model.Students.Select(x => x.StudentId).ToList();

            if (studentsId.Count != studentsId.Distinct().Count())
                return new ErrorResult("Eyni tələbə siyahıda birdən çox göndərilib.");

            var validStudentsId = await _courseScheduleRead.GetWhere(x => x.Id == model.CourseScheduleId, tracking : false)
                .SelectMany(x => x.CourseOffering.Group.Students)
                .Where(x => !x.IsDeleted)
                .Select(x => x.Id)
                .ToListAsync();

            var invalidStudentsId = studentsId.Except(validStudentsId).ToList();

            if (invalidStudentsId.Any())
                return new ErrorResult("Göndərilən tələbələrdən bir və ya bir neçəsi bu qrupa aid deyil.");

            var attendances = model.Students.Select(s => new Attendance
            {
                Id = Guid.NewGuid(),
                CourseScheduleId = model.CourseScheduleId,
                Date = date,
                StudentId = s.StudentId,
                IsPresent = s.IsPresent,
                Note = s.Note
            }).ToList();

            await _attendanceWrite.AddRangeAsync(attendances);  
            await _attendanceWrite.SaveAsync();

            return new SuccessResult("Davamiyyət uğurla qeydə alındı.");
        }

        public async Task<IDataResult<List<GetAttendanceDTO>>> GetAllAsync(Guid? studentAppUserId = null, Guid? teacherAppUserId = null)
        {
            var query = _attendanceRead.GetAll(tracking: false);

            if (studentAppUserId.HasValue)
                query = query.Where(x => x.Student.AppUserId == studentAppUserId.Value);
            else if (teacherAppUserId.HasValue)
                query = query.Where(x => x.CourseSchedule.CourseOffering.Teacher.AppUserId == teacherAppUserId.Value);

            var attendances = await IncludeDetails(query).ToListAsync();

            return new SuccessDataResult<List<GetAttendanceDTO>>(GroupIntoSessions(attendances));
        }

        public async Task<IDataResult<GetAttendanceDTO>> GetByIdAsync(Guid id, Guid? studentAppUserId = null, Guid? teacherAppUserId = null)
        {
            var query = _attendanceRead.GetWhere(x => x.Id == id, tracking: false);

            if (studentAppUserId.HasValue)
                query = query.Where(x => x.Student.AppUserId == studentAppUserId.Value);
            else if (teacherAppUserId.HasValue)
                query = query.Where(x => x.CourseSchedule.CourseOffering.Teacher.AppUserId == teacherAppUserId.Value);

            var attendance = await IncludeDetails(query).FirstOrDefaultAsync();

            if (attendance == null)
                return new ErrorDataResult<GetAttendanceDTO>("Davamiyyət qeydi tapılmadı");

            return new SuccessDataResult<GetAttendanceDTO>(GroupIntoSessions(new List<Attendance> { attendance }).Single());
        }

        private static IQueryable<Attendance> IncludeDetails(IQueryable<Attendance> query)
            => query
                .Include(x => x.Student!)
                    .ThenInclude(s => s.AppUser)
                .Include(x => x.CourseSchedule!)
                    .ThenInclude(cs => cs.CourseOffering)
                    .ThenInclude(co => co.Group)
                .Include(x => x.CourseSchedule!)
                    .ThenInclude(cs => cs.CourseOffering)
                    .ThenInclude(co => co.Course);

        /// <summary>
        /// Attendance rows are stored per student; the API contract returns one entry per lesson session
        /// (schedule + date) with the students nested inside it.
        /// </summary>
        private List<GetAttendanceDTO> GroupIntoSessions(List<Attendance> attendances)
            => attendances
                .GroupBy(x => new { x.CourseScheduleId, Date = x.Date.Date })
                .Select(g =>
                {
                    var schedule = g.First().CourseSchedule;
                    return new GetAttendanceDTO
                    {
                        CourseScheduleId = g.Key.CourseScheduleId,
                        CourseOfferingId = schedule?.CourseOfferingId ?? Guid.Empty,
                        CourseName = schedule?.CourseOffering?.Course?.Name ?? string.Empty,
                        GroupName = schedule?.CourseOffering?.Group?.Code ?? string.Empty,
                        Date = g.Key.Date,
                        StartTime = schedule?.StartTime ?? TimeSpan.Zero,
                        EndTime = schedule?.EndTime ?? TimeSpan.Zero,
                        Students = _mapper.Map<List<GetStudentAttendanceDTO>>(g.OrderBy(x => x.Student?.AppUser?.LastName).ToList())
                    };
                })
                .OrderByDescending(x => x.Date)
                .ThenBy(x => x.StartTime)
                .ToList();

        public async Task<IResult> HardDeleteAsync(Guid id)
        {
            bool isRemoved = await _attendanceWrite.HardDeleteAsync(id);

            if (!isRemoved)
                return new ErrorResult("Silinəcək davamiyyət qeydi tapılmadı");

            await _attendanceWrite.SaveAsync();

            return new SuccessResult("Davamiyyət qeydi bazadan birdəfəlik silindi.");
        }

        public async Task<IResult> HardDeleteRangeAsync(List<Guid> ids)
        {
            var attendances = await _attendanceRead.GetWhere(x => ids.Contains(x.Id), tracking : true).ToListAsync();

            if (!attendances.Any())
                return new ErrorResult("Silinəcək davamiyyət qeydi tapılmadı");

            if (attendances.Count != ids.Count)
                return new ErrorResult("Göndərilən davamiyyət qeydlərindən bir və ya bir neçəsi sistemdə tapılmadı.");

            _attendanceWrite.HardDeleteRange(attendances);

            await _attendanceWrite.SaveAsync();

            return new SuccessResult("Davamiyyət qeydləri bazadan birdəfəlik silindi.");
        }


        public async Task<IResult> SoftDeleteAsync(Guid id)
        {
            var isRemoved = await _attendanceWrite.SoftDeleteAsync(id);

            if (!isRemoved)
                return new ErrorResult("Silinəcək davamiyyət qeydi tapılmadı");

            await _attendanceWrite.SaveAsync();

            return new SuccessResult("Davamiyyət qeydi bazadan müvəqqəti silindi.");
        }

        public async Task<IResult> SoftDeleteRangeAsync(List<Guid> ids)
        {
            var attendances = await _attendanceRead.GetWhere(x => ids.Contains(x.Id), tracking: true).ToListAsync();

            if (!attendances.Any())
                return new ErrorResult("Silinəcək davamiyyət qeydi tapılmadı");

            if (attendances.Count != ids.Count)
                return new ErrorResult("Göndərilən davamiyyət qeydlərindən bir və ya bir neçəsi sistemdə tapılmadı");

            _attendanceWrite.SoftDeleteRange(attendances);
            await _attendanceWrite.SaveAsync();

            return new SuccessResult("Davamiyyət qeydləri bazadan müvəqqəti silindi.");
        }

        public async Task<IResult> RestoreAsync(Guid id)
        {
            bool isRestored = await _attendanceWrite.RestoreAsync(id);
            if (isRestored == false)
                return new ErrorResult("Silinmiş məlumat tapılmadı və ya aktivdir");
            await _attendanceWrite.SaveAsync();
            return new SuccessResult("Məlumat bərpa edildi");
        }

        public async Task<IResult> UpdateRangeAsync(UpdateAttendanceRangeDTO model)
        {
            var attendanceIds = model.Students.Select(s => s.AttendanceId).ToList();

            var existingAttendances = await _attendanceRead.GetWhere(x => attendanceIds.Contains(x.Id), tracking: true).ToListAsync();

            if (!existingAttendances.Any())
                return new ErrorResult("Yenilənəcək davamiyyət qeydi tapılmadı.");

            if (existingAttendances.Count != attendanceIds.Count)
                return new ErrorResult("Göndərilən davamiyyət qeydlərindən bir və ya bir neçəsi tapılmadı.");

            foreach(var attendance in existingAttendances)
            {
                var studentDTO = model.Students.First(x => x.AttendanceId == attendance.Id);

                attendance.IsPresent = studentDTO.IsPresent;
                attendance.Note = studentDTO.Note;
            }

            await _attendanceWrite.SaveAsync();

            return new SuccessResult("Davamiyyət məlumatları uğurla yeniləndi.");
        }
    }
}
