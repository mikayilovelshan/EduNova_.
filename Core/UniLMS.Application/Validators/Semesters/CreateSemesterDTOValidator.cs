using FluentValidation;
using UniLMS.Application.DTOs.Semesters;

namespace UniLMS.Application.Validators.Semesters
{
    public class CreateSemesterDTOValidator : AbstractValidator<CreateSemesterDTO>
    {
        public CreateSemesterDTOValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
            RuleFor(x => x.StartDate).NotEmpty();
            RuleFor(x => x.EndDate).GreaterThan(x => x.StartDate);
        }
    }
}
