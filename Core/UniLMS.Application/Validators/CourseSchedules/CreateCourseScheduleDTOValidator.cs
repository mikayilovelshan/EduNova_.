using FluentValidation;
using UniLMS.Application.DTOs.CourseSchedules;

namespace UniLMS.Application.Validators.CourseSchedules
{
    public class CreateCourseScheduleDTOValidator : AbstractValidator<CreateCourseScheduleDTO>
    {
        public CreateCourseScheduleDTOValidator()
        {
            RuleFor(x => x.CourseOfferingId).NotEmpty();
            RuleFor(x => x.DayOfWeek).IsInEnum();
            RuleFor(x => x.StartTime).LessThan(x => x.EndTime);
        }
    }
}
