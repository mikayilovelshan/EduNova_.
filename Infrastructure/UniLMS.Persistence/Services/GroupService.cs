using AutoMapper;
using Microsoft.EntityFrameworkCore;
using UniLMS.Application.DTOs.Groups;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Application.Repositories.GroupRepository;
using UniLMS.Application.Repositories.SpecialityRepository;
using UniLMS.Application.Repositories.StudentRepository;
using UniLMS.Application.Utilities.Results;
using UniLMS.Domain.Entities;

namespace UniLMS.Persistence.Services
{
    public class GroupService(
        IGroupReadRepository _groupRead,
        IGroupWriteRepository _groupWrite,
        IStudentReadRepository _studentRead,
        IStudentWriteRepository _studentWrite,
        ISpecialityReadRepository _specialityRead,
        IMapper _mapper) : IGroupService
    {
        public async Task<IResult> CreateAsync(CreateGroupDTO model)
        {
            if (!await _specialityRead.GetWhere(x => x.Id == model.SpecialityId, tracking: false).AnyAsync())
                return new ErrorResult("Daxil edilən ixtisas mövcud deyil.");

            bool codeExists = await _groupRead.GetWhere(x => x.Code == model.Code, tracking: false).AnyAsync();
            if (codeExists)
                return new ErrorResult($"{model.Code} kodlu qrup mövcuddur");

            var group = new Group
            {
                Code = model.Code,
                SpecialityId = model.SpecialityId
            };

            await _groupWrite.AddAsync(group);
            await _groupWrite.SaveAsync();

            if (model.StudentIds is { Count: > 0 })
            {
                var students = await _studentRead
                    .GetWhere(s => model.StudentIds.Contains(s.Id), tracking: true)
                    .ToListAsync();

                foreach (var student in students)
                {
                    student.GroupId = group.Id;
                    _studentWrite.Update(student);
                }

                await _studentWrite.SaveAsync();
            }

            return new SuccessResult("Qrup uğurla əlavə edildi.");
        }

        public async Task<IDataResult<List<GetGroupDTO>>> GetAllAsync()
        {
            var groups = await _groupRead
                .GetAll(tracking: false)
                .Include(x => x.Speciality)
                .Include(x => x.Students)
                    .ThenInclude(x => x.AppUser)
                .ToListAsync();

            return new SuccessDataResult<List<GetGroupDTO>>(_mapper.Map<List<GetGroupDTO>>(groups));
        }

        public async Task<IDataResult<GetGroupDTO>> GetByIdAsync(Guid id)
        {
            var group = await _groupRead
                .GetWhere(x => x.Id == id, tracking: false)
                .Include(x => x.Speciality)
                .Include(x => x.Students)
                    .ThenInclude(x => x.AppUser)
                .FirstOrDefaultAsync();

            if (group == null)
                return new ErrorDataResult<GetGroupDTO>("Qrup tapılmadı.");

            return new SuccessDataResult<GetGroupDTO>(_mapper.Map<GetGroupDTO>(group));
        }

        public async Task<IResult> HardDeleteAsync(Guid id)
        {
            if (!await _groupWrite.HardDeleteAsync(id))
                return new ErrorResult("Uyğun qrup mövcud deyil");

            await _groupWrite.SaveAsync();
            return new SuccessResult("Qrup bazadan tamamilə silindi.");
        }

        public async Task<IResult> HardDeleteRangeAsync(List<Guid> ids)
        {
            var groups = await _groupRead.GetWhere(x => ids.Contains(x.Id), tracking: true).ToListAsync();
            if (!groups.Any())
                return new ErrorResult("Silmək üçün heç bir qrup tapılmadı");

            _groupWrite.HardDeleteRange(groups);
            await _groupWrite.SaveAsync();
            return new SuccessResult("Seçilmiş qruplar bazadan tamamilə silindi.");
        }

        public async Task<IResult> SoftDeleteAsync(Guid id)
        {
            if (!await _groupWrite.SoftDeleteAsync(id))
                return new ErrorResult("Uyğun qrup tapılmadı");

            await _groupWrite.SaveAsync();
            return new SuccessResult("Qrup müvəqqəti silindi");
        }

        public async Task<IResult> SoftDeleteRangeAsync(List<Guid> ids)
        {
            var groups = await _groupRead.GetWhere(x => ids.Contains(x.Id), tracking: true).ToListAsync();
            if (!groups.Any())
                return new ErrorResult("Silmək üçün heç bir qrup tapılmadı");

            _groupWrite.SoftDeleteRange(groups);
            await _groupWrite.SaveAsync();
            return new SuccessResult("Qruplar passivləşdirildi");
        }

        public async Task<IResult> RestoreAsync(Guid id)
        {
            if (!await _groupWrite.RestoreAsync(id))
                return new ErrorResult("Silinmiş məlumat tapılmadı və ya aktivdir");

            await _groupWrite.SaveAsync();
            return new SuccessResult("Məlumat bərpa edildi");
        }

        public async Task<IResult> UpdateAsync(UpdateGroupDTO model)
        {
            var group = await _groupRead
                .GetWhere(x => x.Id == model.Id, tracking: true)
                .Include(x => x.Students)
                .FirstOrDefaultAsync();

            if (group == null)
                return new ErrorResult("Uyğun qrup mövcud deyil");

            if (!await _specialityRead.GetWhere(x => x.Id == model.SpecialityId, tracking: false).AnyAsync())
                return new ErrorResult("Daxil edilən ixtisas mövcud deyil.");

            if (await _groupRead.GetWhere(x => x.Code == model.Code && x.Id != model.Id, tracking: false).AnyAsync())
                return new ErrorResult($"{model.Code} kodlu qrup artıq mövcuddur");

            group.Code = model.Code;
            group.SpecialityId = model.SpecialityId;

            if (model.StudentIds != null)
            {
                var students = await _studentRead
                    .GetWhere(x => model.StudentIds.Contains(x.Id), tracking: true)
                    .ToListAsync();

                group.Students.Clear();
                foreach (var student in students)
                    group.Students.Add(student);
            }

            await _groupWrite.SaveAsync();
            return new SuccessResult("Qrup uğurla yeniləndi");
        }
    }
}
