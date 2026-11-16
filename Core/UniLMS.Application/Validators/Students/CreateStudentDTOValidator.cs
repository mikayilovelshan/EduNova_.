using FluentValidation;
using UniLMS.Application.DTOs.Students;

namespace UniLMS.Application.Validators.Students
{
    public class CreateStudentDTOValidator : AbstractValidator<CreateStudentDTO>
    {
        public CreateStudentDTOValidator()
        {
            RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
            RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
            RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
            RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
            RuleFor(x => x.StudentNumber).NotEmpty().MaximumLength(50);
            RuleFor(x => x.GPA).InclusiveBetween(0, 100);
        }
    }
}
