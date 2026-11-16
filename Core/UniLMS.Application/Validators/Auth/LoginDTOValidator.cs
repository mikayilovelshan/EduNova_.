using FluentValidation;
using UniLMS.Application.DTOs.Auth;

namespace UniLMS.Application.Validators.Auth
{
    public class LoginDTOValidator : AbstractValidator<LoginDTO>
    {
        public LoginDTOValidator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
            RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
        }
    }
}
