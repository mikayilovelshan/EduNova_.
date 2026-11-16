using FluentValidation;
using UniLMS.Application.DTOs.Groups;

namespace UniLMS.Application.Validators.Groups
{
    public class UpdateGroupDTOValidator : AbstractValidator<UpdateGroupDTO>
    {
        public UpdateGroupDTOValidator()
        {
            RuleFor(x => x.Id).NotEmpty();
            RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
            RuleFor(x => x.SpecialityId).NotEmpty();
            RuleForEach(x => x.StudentIds).NotEmpty();
        }
    }
}
