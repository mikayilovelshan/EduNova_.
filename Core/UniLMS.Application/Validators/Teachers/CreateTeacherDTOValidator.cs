using FluentValidation;
using UniLMS.Application.DTOs.Teachers;

namespace UniLMS.Application.Validators.Teachers
{
    public class CreateTeacherDTOValidator : AbstractValidator<CreateTeacherDTO>
    {
        public CreateTeacherDTOValidator()
        {
            RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
            RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
            RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
            RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
            RuleFor(x => x.ScientificDegree).NotEmpty().MaximumLength(150);
            RuleFor(x => x.CafedraId).NotEmpty();
        }
    }
}
