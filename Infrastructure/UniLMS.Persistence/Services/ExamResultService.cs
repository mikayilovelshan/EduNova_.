using AutoMapper;
using Microsoft.EntityFrameworkCore;
using UniLMS.Application.DTOs.ExamResults;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Application.Repositories.AttendanceRepository;
using UniLMS.Application.Repositories.CourseOfferingRepository;
using UniLMS.Application.Repositories.ExamResultRepository;
using UniLMS.Application.Repositories.StudentRepository;
using UniLMS.Application.Utilities.Grading;
using UniLMS.Application.Utilities.Results;
using UniLMS.Domain.Entities;
using UniLMS.Domain.Enums;

namespace UniLMS.Persistence.Services
{
    public class ExamResultService(IExamResultReadRepository _readExamResult,
        IExamResultWriteRepository _writeExamResult,
        ICourseOfferingReadRepository _courseOfferingRead,
        IStudentReadRepository _studentRead,
        IAttendanceReadRepository _attendanceRead,
        IMapper _mapper) : IExamResultService
    {
        public async Task<IResult> CreateRangeAsync(CreateExamResultRangeDTO model)
        {
            var courseOffering = await _courseOfferingRead.GetByIdAsync(model.CourseOfferingId, tracking: false);

            if (courseOffering == null)
                return new ErrorResult("Uyğun dərs qeydi tapılmadı");

            var maxScore = GradingPolicy.MaxScoreFor(model.ExamType);
            if (model.StudentScores.Any(x => x.Score < 0 || x.Score > maxScore))
                return new ErrorResult($"{model.ExamType} üçün bal 0 ilə {maxScore} arasında olmalıdır.");

            var studentsId = model.StudentScores.Select(x => x.StudentId).ToList();

            if (studentsId.Count != studentsId.Distinct().Count())
                return new ErrorResult("Eyni tələbə üçün birdən çox bal göndərilib.");

            // A student can only have one result per exam type in a course offering (enforced by a unique index),
            // so check against that rule instead of the evaluation date to avoid a database exception.
            var alreadyGraded = await _readExamResult.GetWhere(x => x.CourseOfferingId == model.CourseOfferingId &&
                                                        x.ExamType == model.ExamType &&
                                                        studentsId.Contains(x.StudentId), tracking: false).AnyAsync();

            if (alreadyGraded)
                return new ErrorResult("Bu imtahan növü üzrə tələbələrdən bəzilərinin qiyməti artıq daxil edilib. Mövcud qiyməti yeniləyin.");

            var validStudents = await _courseOfferingRead.GetWhere(x => x.Id == model.CourseOfferingId, tracking : false)
                .SelectMany(x => x.Group.Students)
                .Where(x => !x.IsDeleted)
                .Select(x => x.Id)
                .ToListAsync();

            var invalidStudentsId = studentsId.Except(validStudents).ToList();

            if (invalidStudentsId.Any())
                return new ErrorResult("Göndərilən tələbələrdən bir və ya bir neçəsi bu qrupa aid deyil.");

            var examResults = model.StudentScores.Select(s => new ExamResult
            {
                Id = Guid.NewGuid(),
                CourseOfferingId = model.CourseOfferingId,
                ExamType = model.ExamType,
                EvaluationDate = model.EvaluationDate,
                StudentId = s.StudentId,
                Score = s.Score
            }).ToList();

            await _writeExamResult.AddRangeAsync(examResults);
            await _writeExamResult.SaveAsync();

            return new SuccessResult("İmtahan qiymətləri uğurla əlavə edildi");
        }

        public async Task<IDataResult<List<GetExamResultDTO>>> GetAllAsync(Guid? studentAppUserId = null, Guid? teacherAppUserId = null)
        {
            var query = _readExamResult.GetAll(tracking: false);

            if (studentAppUserId.HasValue)
                query = query.Where(x => x.Student.AppUserId == studentAppUserId.Value);
            else if (teacherAppUserId.HasValue)
                query = query.Where(x => x.CourseOffering.Teacher.AppUserId == teacherAppUserId.Value);

            var examResults = await query
                .Include(x => x.Student)
                    .ThenInclude(s => s.AppUser)
                .Include(x => x.CourseOffering)
                    .ThenInclude(x => x.Course)
                .OrderByDescending(x => x.EvaluationDate)
                .ToListAsync();

            var dtos = _mapper.Map<List<GetExamResultDTO>>(examResults);

            return new SuccessDataResult<List<GetExamResultDTO>>(dtos);
        }

        public async Task<IDataResult<GetExamResultDTO>> GetByIdAsync(Guid id, Guid? studentAppUserId = null, Guid? teacherAppUserId = null)
        {
            var query = _readExamResult.GetWhere(x => x.Id == id, tracking: false);

            if (studentAppUserId.HasValue)
                query = query.Where(x => x.Student.AppUserId == studentAppUserId.Value);
            else if (teacherAppUserId.HasValue)
                query = query.Where(x => x.CourseOffering.Teacher.AppUserId == teacherAppUserId.Value);

            var examResult = await query
                .Include(x => x.Student)
                    .ThenInclude(s => s.AppUser)
                .Include(x => x.CourseOffering)
                    .ThenInclude(x => x.Course)
                .FirstOrDefaultAsync();

            if (examResult == null)
                return new ErrorDataResult<GetExamResultDTO>("Məlumat tapıla bilmədi");

            var dto = _mapper.Map<GetExamResultDTO>(examResult);

            return new SuccessDataResult<GetExamResultDTO>(dto);
        }

        public async Task<IResult> HardDeleteAsync(Guid id)
        {
            bool isRemoved = await _writeExamResult.HardDeleteAsync(id);

            if (!isRemoved)
                return new ErrorResult("Silinmə əməliyyatı uğursuz oldu");

            await _writeExamResult.SaveAsync();

            return new SuccessResult("Məlumat tamamilə silindi");
        }

        public async Task<IResult> HardDeleteRangeAsync(List<Guid> ids)
        {
            var examResults = await _readExamResult.GetWhere(x => ids.Contains(x.Id), tracking: true).ToListAsync();

            if (!examResults.Any())
                return new ErrorResult("Silinəcək məlumat tapılmadı");

            if (examResults.Count != ids.Distinct().Count())
                return new ErrorResult("Göndərilən məlumatların bir və ya bir neçəsi sistemdə tapılmadı.");

            _writeExamResult.HardDeleteRange(examResults);
            await _writeExamResult.SaveAsync();

            return new SuccessResult("Məlumatlar bazadan birdəfəlik silindi.");
        }

        public async Task<IResult> SoftDeleteAsync(Guid id)
        {
            bool isRemoved = await _writeExamResult.SoftDeleteAsync(id);

            if (!isRemoved)
                return new ErrorResult("Silinmə əməliyyatı uğursuz oldu");

            await _writeExamResult.SaveAsync();

            return new SuccessResult("Məlumatlar bazadan müvəqqəti silindi.");
        }

        public async Task<IResult> SoftDeleteRangeAsync(List<Guid> ids)
        {
            var examResults = await _readExamResult.GetWhere(x => ids.Contains(x.Id), tracking: true).ToListAsync();

            if (!examResults.Any())
                return new ErrorResult("Silinəcək məlumat tapılmadı");

            if (examResults.Count != ids.Distinct().Count())
                return new ErrorResult("Göndərilən məlumatların bir və ya bir neçəsi sistemdə tapılmadı.");

            _writeExamResult.SoftDeleteRange(examResults);
            await _writeExamResult.SaveAsync();

            return new SuccessResult("Məlumatlar bazadan müvəqqəti silindi.");
        }

        public async Task<IResult> RestoreAsync(Guid id)
        {
            bool isRestored = await _writeExamResult.RestoreAsync(id);

            if (isRestored == false)
                return new ErrorResult("Silinmiş məlumat tapılmadı və ya aktivdir");

            await _writeExamResult.SaveAsync();

            return new SuccessResult("Məlumat bərpa edildi");
        }

        public async Task<IResult> UpdateAsync(UpdateExamResultDTO model)
        {
            var examResult = await _readExamResult.GetByIdAsync(model.Id, tracking : true);

            if (examResult == null)
                return new ErrorResult("Uyğun məlumat mövcud deyil");

            var maxScore = GradingPolicy.MaxScoreFor(examResult.ExamType);
            if (model.Score < 0 || model.Score > maxScore)
                return new ErrorResult($"{examResult.ExamType} üçün bal 0 ilə {maxScore} arasında olmalıdır.");

            _mapper.Map(model, examResult);
            await _writeExamResult.SaveAsync();

            return new SuccessResult("Dəyişiklik tətbiq edildi");
        }

        public async Task<IDataResult<StudentExamResultSummaryDTO>> GetStudentExamResultSummary(Guid studentId, Guid courseOfferingId)
        {
            var report = await GetStudentCourseDetailedReport(studentId, courseOfferingId);
            if (!report.Success || report.Data == null)
                return new ErrorDataResult<StudentExamResultSummaryDTO>(report.Message);

            return new SuccessDataResult<StudentExamResultSummaryDTO>(ToSummary(report.Data));
        }

        public async Task<IDataResult<StudentCourseDetailedReportDTO>> GetStudentCourseDetailedReport(Guid studentId, Guid courseOfferingId)
        {
            var student = await _studentRead.GetWhere(x => x.Id == studentId, tracking: false)
                .Include(x => x.AppUser)
                .FirstOrDefaultAsync();

            if (student == null)
                return new ErrorDataResult<StudentCourseDetailedReportDTO>("Tələbə tapılmadı.");

            var courseOffering = await _courseOfferingRead.GetWhere(x => x.Id == courseOfferingId, tracking: false)
                .Include(x => x.Course)
                .FirstOrDefaultAsync();

            if (courseOffering == null)
                return new ErrorDataResult<StudentCourseDetailedReportDTO>("Tədris olunan dərs tapılmadı.");

            var reports = await BuildReportsAsync(new[] { student }, new[] { courseOffering });

            return new SuccessDataResult<StudentCourseDetailedReportDTO>(reports.Single());
        }

        public async Task<IDataResult<List<StudentExamResultSummaryDTO>>> GetMySummariesAsync(Guid studentAppUserId)
        {
            var student = await _studentRead.GetWhere(x => x.AppUserId == studentAppUserId, tracking: false)
                .Include(x => x.AppUser)
                .FirstOrDefaultAsync();

            if (student == null)
                return new ErrorDataResult<List<StudentExamResultSummaryDTO>>("Tələbə profili tapılmadı.");

            if (student.GroupId == null)
                return new SuccessDataResult<List<StudentExamResultSummaryDTO>>(new List<StudentExamResultSummaryDTO>());

            var offerings = await _courseOfferingRead.GetWhere(x => x.GroupId == student.GroupId, tracking: false)
                .Include(x => x.Course)
                .ToListAsync();

            var reports = await BuildReportsAsync(new[] { student }, offerings);

            return new SuccessDataResult<List<StudentExamResultSummaryDTO>>(reports.Select(ToSummary).ToList());
        }

        public async Task<IDataResult<List<StudentExamResultSummaryDTO>>> GetCourseOfferingSummariesAsync(Guid courseOfferingId)
        {
            var courseOffering = await _courseOfferingRead.GetWhere(x => x.Id == courseOfferingId, tracking: false)
                .Include(x => x.Course)
                .FirstOrDefaultAsync();

            if (courseOffering == null)
                return new ErrorDataResult<List<StudentExamResultSummaryDTO>>("Tədris olunan dərs tapılmadı.");

            var students = await _studentRead.GetWhere(x => x.GroupId == courseOffering.GroupId, tracking: false)
                .Include(x => x.AppUser)
                .OrderBy(x => x.AppUser.LastName).ThenBy(x => x.AppUser.FirstName)
                .ToListAsync();

            var reports = await BuildReportsAsync(students, new[] { courseOffering });

            return new SuccessDataResult<List<StudentExamResultSummaryDTO>>(reports.Select(ToSummary).ToList());
        }

        /// <summary>
        /// Builds one report per (student, offering) pair with 3 queries in total instead of N+1 round-trips.
        /// </summary>
        private async Task<List<StudentCourseDetailedReportDTO>> BuildReportsAsync(
            IReadOnlyCollection<Student> students, IReadOnlyCollection<CourseOffering> offerings)
        {
            var studentIds = students.Select(x => x.Id).ToList();
            var offeringIds = offerings.Select(x => x.Id).ToList();

            var attendances = await _attendanceRead
                .GetWhere(x => studentIds.Contains(x.StudentId) && offeringIds.Contains(x.CourseSchedule.CourseOfferingId), tracking: false)
                .Select(x => new { x.StudentId, x.CourseSchedule.CourseOfferingId, x.IsPresent })
                .ToListAsync();

            var results = await _readExamResult
                .GetWhere(x => studentIds.Contains(x.StudentId) && offeringIds.Contains(x.CourseOfferingId), tracking: false)
                .OrderBy(x => x.EvaluationDate)
                .ToListAsync();

            var reports = new List<StudentCourseDetailedReportDTO>();

            foreach (var offering in offerings)
            {
                foreach (var student in students)
                {
                    var studentAttendances = attendances.Where(x => x.StudentId == student.Id && x.CourseOfferingId == offering.Id).ToList();
                    var studentResults = results.Where(x => x.StudentId == student.Id && x.CourseOfferingId == offering.Id).ToList();
                    var scored = studentResults.Select(x => (x.ExamType, x.Score)).ToList();

                    var attendanceScore = GradingPolicy.AttendanceScore(studentAttendances.Count, studentAttendances.Count(x => x.IsPresent));
                    var entryScore = GradingPolicy.EntryScore(attendanceScore, scored);
                    var finalScore = GradingPolicy.FinalScore(scored);
                    var fullName = $"{student.AppUser?.FirstName} {student.AppUser?.LastName}".Trim();

                    reports.Add(new StudentCourseDetailedReportDTO
                    {
                        StudentId = student.Id,
                        StudentFullName = fullName,
                        CourseOfferingId = offering.Id,
                        CourseName = offering.Course?.Name ?? string.Empty,
                        AttendanceScore = attendanceScore,
                        TotalClasses = studentAttendances.Count,
                        AttendedClasses = studentAttendances.Count(x => x.IsPresent),
                        EntryScore = entryScore,
                        FinalScore = finalScore,
                        HasFinalExam = studentResults.Any(x => x.ExamType == ExamType.FinalExam),
                        LetterGrade = GradingPolicy.LetterGrade(entryScore, finalScore),
                        IsPassed = GradingPolicy.IsPassed(entryScore, finalScore),
                        DetailedScores = studentResults.Select(x => new GetExamResultDTO
                        {
                            Id = x.Id,
                            StudentId = student.Id,
                            StudentFullName = fullName,
                            CourseOfferingId = offering.Id,
                            CourseName = offering.Course?.Name ?? string.Empty,
                            ExamType = x.ExamType,
                            ExamTypeName = x.ExamType.ToString(),
                            Score = x.Score,
                            EvaluationDate = x.EvaluationDate
                        }).ToList()
                    });
                }
            }

            return reports;
        }

        private static StudentExamResultSummaryDTO ToSummary(StudentCourseDetailedReportDTO report) => new()
        {
            StudentId = report.StudentId,
            StudentFullName = report.StudentFullName,
            CourseOfferingId = report.CourseOfferingId,
            CourseName = report.CourseName,
            AttendanceScore = report.AttendanceScore,
            TotalClasses = report.TotalClasses,
            AttendedClasses = report.AttendedClasses,
            EntryScore = report.EntryScore,
            FinalScore = report.FinalScore,
            HasFinalExam = report.HasFinalExam,
            LetterGrade = report.LetterGrade,
            IsPassed = report.IsPassed
        };
    }
}
