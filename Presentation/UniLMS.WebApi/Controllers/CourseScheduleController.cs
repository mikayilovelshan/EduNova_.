using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniLMS.Application.DTOs.CourseSchedules;
using UniLMS.Application.Interfaces.Services;
using UniLMS.WebApi.Extensions;

namespace UniLMS.WebApi.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class CourseScheduleController(ICourseScheduleService _courseScheduleService) : ControllerBase
    {
        // Timetabling is administrative: a teacher must not be able to book slots for other teachers' offerings.
        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateCourseScheduleDTO model)
        {
            var result = await _courseScheduleService.CreateAsync(model);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromBody] UpdateCourseScheduleDTO model)
        {
            var result = await _courseScheduleService.UpdateAsync(model);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("soft")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDelete(List<Guid> ids)
        {
            var result = await _courseScheduleService.SoftDeleteRangeAsync(ids);
            return Ok(result);
        }

        [HttpDelete("hard")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> HardDelete(List<Guid> ids)
        {
            var result = await _courseScheduleService.HardDeleteRangeAsync(ids);
            return Ok(result);
        }

        /// <summary>Admins see the whole timetable, teachers their own lessons, students their group's lessons.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _courseScheduleService.GetAllAsync(
                studentAppUserId: User.AppUserIdIfInRole("Student"),
                teacherAppUserId: User.AppUserIdIfInRole("Teacher"));
            return Ok(result);
        }

        [HttpGet("id")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _courseScheduleService.GetByIdAsync(id,
                studentAppUserId: User.AppUserIdIfInRole("Student"),
                teacherAppUserId: User.AppUserIdIfInRole("Teacher"));
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost("restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(Guid id)
        {
            var result = await _courseScheduleService.RestoreAsync(id);
            return Ok(result);
        }
    }
}
