using FluentValidation;
using UniLMS.Application.DTOs.Specialities;

namespace UniLMS.Application.Validators.Specialities
{
    public class CreateSpecialityDTOValidator : AbstractValidator<CreateSpecialityDTO>
    {
        public CreateSpecialityDTOValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
            RuleFor(x => x.Code).NotEmpty().MaximumLength(20);
            RuleFor(x => x.Description).MaximumLength(500);
            RuleFor(x => x.Degree).IsInEnum();
            RuleForEach(x => x.CourseIds).NotEmpty();
        }
    }
}
