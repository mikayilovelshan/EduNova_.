using FluentValidation;
using UniLMS.Application.DTOs.Groups;

namespace UniLMS.Application.Validators.Groups
{
    public class CreateGroupDTOValidator : AbstractValidator<CreateGroupDTO>
    {
        public CreateGroupDTOValidator()
        {
            RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
            RuleFor(x => x.SpecialityId).NotEmpty();
            RuleForEach(x => x.StudentIds).NotEmpty();
        }
    }
}
