using FluentValidation;
using UniLMS.Application.DTOs.CourseSchedules;

namespace UniLMS.Application.Validators.CourseSchedules
{
    public class UpdateCourseScheduleDTOValidator : AbstractValidator<UpdateCourseScheduleDTO>
    {
        public UpdateCourseScheduleDTOValidator()
        {
            RuleFor(x => x.Id).NotEmpty();
            RuleFor(x => x.CourseOfferingId).NotEmpty();
            RuleFor(x => x.DayOfWeek).IsInEnum();
            RuleFor(x => x.StartTime).LessThan(x => x.EndTime);
        }
    }
}
