using FluentValidation;
using UniLMS.Application.DTOs.CourseMaterials;

namespace UniLMS.Application.Validators.CourseMaterials
{
    public class UploadMaterialDTOValidator : AbstractValidator<UploadMaterialDTO>
    {
        public UploadMaterialDTOValidator()
        {
            RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
            RuleFor(x => x.Description).MaximumLength(1000);
            RuleFor(x => x.CourseId).NotEmpty();
            RuleFor(x => x.File).NotNull();
        }
    }
}
