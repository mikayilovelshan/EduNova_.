using FluentValidation;
using UniLMS.Application.DTOs.Semesters;

namespace UniLMS.Application.Validators.Semesters
{
    public class UpdateSemesterDTOValidator : AbstractValidator<UpdateSemesterDTO>
    {
        public UpdateSemesterDTOValidator()
        {
            RuleFor(x => x.Id).NotEmpty();
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
            RuleFor(x => x.StartDate).NotEmpty();
            RuleFor(x => x.EndDate).GreaterThan(x => x.StartDate);
        }
    }
}
