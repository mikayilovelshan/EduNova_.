using FluentValidation;
using UniLMS.Application.DTOs.Teachers;

namespace UniLMS.Application.Validators.Teachers
{
    public class UpdateTeacherDTOValidator : AbstractValidator<UpdateTeacherDTO>
    {
        public UpdateTeacherDTOValidator()
        {
            RuleFor(x => x.Id).NotEmpty();
            RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
            RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
            RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
            RuleFor(x => x.ScientificDegree).NotEmpty().MaximumLength(150);
            RuleFor(x => x.CafedraId).NotEmpty();
        }
    }
}
