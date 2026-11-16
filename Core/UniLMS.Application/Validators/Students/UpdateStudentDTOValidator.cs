using FluentValidation;
using UniLMS.Application.DTOs.Students;

namespace UniLMS.Application.Validators.Students
{
    public class UpdateStudentDTOValidator : AbstractValidator<UpdateStudentDTO>
    {
        public UpdateStudentDTOValidator()
        {
            RuleFor(x => x.Id).NotEmpty();
            RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
            RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
            RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
            RuleFor(x => x.StudentNumber).NotEmpty().MaximumLength(50);
            RuleFor(x => x.GroupId).NotEmpty();
        }
    }
}
