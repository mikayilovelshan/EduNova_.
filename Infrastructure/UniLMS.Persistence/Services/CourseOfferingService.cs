using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using UniLMS.Domain.Entities;
using UniLMS.Application.DTOs.CourseOfferings;
using UniLMS.Application.DTOs.Groups;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Application.Repositories.CourseOfferingRepository;
using UniLMS.Application.Repositories.CourseRepository;
using UniLMS.Application.Repositories.GroupRepository;
using UniLMS.Application.Repositories.SemesterRepository;
using UniLMS.Application.Repositories.TeacherRepository;
using UniLMS.Application.Utilities.Results;



namespace UniLMS.Persistence.Services
{
    public class CourseOfferingService(ICourseOfferingReadRepository _courseOfferingRead,
        ICourseOfferingWriteRepository _courseOfferingWrite,
        ISemesterReadRepository _semesterRead,
        IGroupReadRepository _groupRead,
        ICourseReadRepository _courseRead,
        ITeacherReadRepository _teacherRead,
        IMapper _mapper) : ICourseOfferingService
    {
        public async Task<IResult> CreateAsync(CreateCourseOfferingDTO model)                   
        {
            var semester = await _semesterRead.GetByIdAsync(model.SemesterId);

            if (semester == null)
                return new ErrorResult("Daxil edilən semestr mövcud deyil.");

            if (!semester.IsActive)
                return new ErrorResult($"Seçilmiş semestr ('{semester.Name}') aktiv deyil.");

           
            var groupExists = await _groupRead.GetWhere(d => d.Id == model.GroupId).AnyAsync();
            if (!groupExists)
                return new ErrorResult("Daxil edilən qrup mövcud deyil.");

            var courseExists = await _courseRead.GetWhere(c => c.Id == model.CourseId).AnyAsync();
            if (!courseExists)
                return new ErrorResult("Daxil edilən fənn mövcud deyil.");

            var teacherExists = await _teacherRead.GetWhere(t => t.Id == model.TeacherId).AnyAsync();
            if (!teacherExists)
                return new ErrorResult("Daxil edilən müəllim mövcud deyil.");

            var isDuplicate = await _courseOfferingRead.GetWhere(co => co.SemesterId == model.SemesterId &&
                                                                       co.GroupId == model.GroupId &&
                                                                        co.CourseId == model.CourseId).AnyAsync();
            if (isDuplicate)
                return new ErrorResult("Bu semestrdə həmin qrup üçün göstərilən fənn artıq təyin edilib.");

            var courseOffering = _mapper.Map<CourseOffering>(model);
            await _courseOfferingWrite.AddAsync(courseOffering);
            await _courseOfferingWrite.SaveAsync();

            return new SuccessResult("Dərs təyinatı uğurla yaradıldı.");
        }
        

        public async Task<IDataResult<List<GroupStudentDTO>>> GetStudentsAsync(Guid courseOfferingId)
        {
            var students = await _courseOfferingRead.GetWhere(x => x.Id == courseOfferingId, tracking: false)
                .SelectMany(x => x.Group.Students)
                .Where(x => !x.IsDeleted)
                .OrderBy(x => x.AppUser.LastName).ThenBy(x => x.AppUser.FirstName)
                .Select(x => new GroupStudentDTO
                {
                    Id = x.Id,
                    StudentNumber = x.StudentNumber,
                    FullName = x.AppUser.FirstName + " " + x.AppUser.LastName
                })
                .ToListAsync();

            return new SuccessDataResult<List<GroupStudentDTO>>(students);
        }

        private IQueryable<CourseOffering> ScopeToUser(IQueryable<CourseOffering> query, Guid? studentAppUserId, Guid? teacherAppUserId)
        {
            if (studentAppUserId.HasValue)
                return query.Where(x => x.Group.Students.Any(s => s.AppUserId == studentAppUserId.Value));
            if (teacherAppUserId.HasValue)
                return query.Where(x => x.Teacher.AppUserId == teacherAppUserId.Value);
            return query;
        }

        public async Task<IDataResult<List<GetCourseOfferingDTO>>> GetAllAsync(Guid? studentAppUserId = null, Guid? teacherAppUserId = null)
        {
            var courseOfferings = await ScopeToUser(_courseOfferingRead.GetAll(tracking : false), studentAppUserId, teacherAppUserId)
                .Include(s => s.Semester)
                .Include(c => c.Course)
                     .Include(t => t.Teacher)
                         .ThenInclude(t => t.AppUser)
                .Include(g => g.Group)
                .ToListAsync();

            var dtos = _mapper.Map<List<GetCourseOfferingDTO>>(courseOfferings);

            return new SuccessDataResult<List<GetCourseOfferingDTO>>(dtos);


        }

        public async Task<IDataResult<GetCourseOfferingDTO>> GetByIdAsync(Guid id, Guid? studentAppUserId = null, Guid? teacherAppUserId = null)
        {
             var courseOffering = await ScopeToUser(_courseOfferingRead.GetWhere(s => s.Id == id, tracking: false), studentAppUserId, teacherAppUserId)
                   .Include(s => s.Semester)
                    .Include(c => c.Course)
                     .Include(t => t.Teacher)
                         .ThenInclude(t => t.AppUser)
                    .Include(g => g.Group)
                    .FirstOrDefaultAsync();

            if (courseOffering == null)
                return new ErrorDataResult<GetCourseOfferingDTO>("Məlumat tapılmadı");

            var dto = _mapper.Map<GetCourseOfferingDTO>(courseOffering);

            return new SuccessDataResult<GetCourseOfferingDTO>(dto);
        }

        public async Task<IResult> HardDeleteAsync(Guid id)
        {
            var isRemoved = await _courseOfferingWrite.HardDeleteAsync(id);

            if (!isRemoved)
                return new ErrorResult("Məlumat tapılmadı");

            await _courseOfferingWrite.SaveAsync();

            return new SuccessResult("Uğurla silindi");

        }

        public async Task<IResult> HardDeleteRangeAsync(List<Guid> ids)
        {
            if (ids == null || !ids.Any())
                return new ErrorResult("İD siyahısı boş ola bilməz");

            var courseOfferings = await _courseOfferingRead.GetWhere(x => ids.Contains(x.Id), tracking: true).ToListAsync();

            if (!courseOfferings.Any())
                return new ErrorResult("Məlumat tapılmadı");

            _courseOfferingWrite.HardDeleteRange(courseOfferings);

            await _courseOfferingWrite.SaveAsync();

            return new SuccessResult("Seçilmiş məlumatlar tamamilə silindi");


        }

        public async Task<IResult> SoftDeleteAsync(Guid id)
        {
            var courseoffering = await _courseOfferingRead.GetByIdAsync(id, tracking : true);

            if (courseoffering == null)
                return new ErrorResult("Məlumat tapılmadı");

            _courseOfferingWrite.SoftDelete(courseoffering);

            await _courseOfferingWrite.SaveAsync();

            return new SuccessResult("Məlumat uğurla arxivləndi");

            
        }

        public async Task<IResult> SoftDeleteRangeAsync(List<Guid> ids)
        {
            if (ids == null || !ids.Any())
                return new ErrorResult("Silinəcək İD siyahısı boşdur");

            var courseOfferings = await _courseOfferingRead.GetWhere(x => ids.Contains(x.Id), tracking : true).ToListAsync();

            if (!courseOfferings.Any())
                return new ErrorResult("Məlumat tapılmadı");

            _courseOfferingWrite.SoftDeleteRange(courseOfferings);

            await _courseOfferingWrite.SaveAsync();

            return new SuccessResult("Seçilmiş məlumatlar arxivləndi");

        }

        public async Task<IResult> RestoreAsync(Guid id)
        {
            bool isRestored = await _courseOfferingWrite.RestoreAsync(id);
            if (isRestored == false)
                return new ErrorResult("Silinmiş məlumat tapılmadı və ya aktivdir");
            await _courseOfferingWrite.SaveAsync();
            return new SuccessResult("Məlumat bərpa edildi");
        }

        public async Task<IResult> UpdateAsync(UpdateCourseOfferingDTO model)
        {
            var courseOffering = await _courseOfferingRead.GetWhere(co => co.Id == model.Id, tracking : true).FirstOrDefaultAsync();

            if (courseOffering == null)
                return new ErrorResult("Məlumat tapılmadı");

            var semester = await _semesterRead.GetByIdAsync(model.SemesterId);

            if (semester == null)
                return new ErrorResult("Daxil edilən semestr mövcud deyil.");

            if (!semester.IsActive)
                return new ErrorResult($"Seçilmiş semestr ('{semester.Name}') aktiv deyil.");

            var group = await _groupRead.GetWhere(d => d.Id == model.GroupId).AnyAsync();
            var course = await _courseRead.GetWhere(c => c.Id == model.CourseId).AnyAsync();
            var teacher = await _teacherRead.GetWhere(t => t.Id == model.TeacherId).AnyAsync();
            var isDuplicate = await _courseOfferingRead.GetWhere(co => co.Id != model.Id && co.SemesterId == model.SemesterId &&
                                                           co.GroupId == model.GroupId && co.CourseId == model.CourseId &&
                                                           co.CourseId == model.CourseId).AnyAsync();

            if (!group) return new ErrorResult("Daxil edilən qrup mövcud deyil.");
            if (!course) return new ErrorResult("Daxil edilən fənn mövcud deyil.");
            if (!teacher) return new ErrorResult("Daxil edilən müəllim mövcud deyil.");
            if (isDuplicate) return new ErrorResult("Bu semestrdə həmin qrup üçün göstərilən fənn artıq təyin edilib.");

            _mapper.Map(model, courseOffering);

            await _courseOfferingWrite.SaveAsync();

            return new SuccessResult("Uğurla yeniləndi");
        }
    }
}
