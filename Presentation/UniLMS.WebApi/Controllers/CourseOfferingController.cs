using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniLMS.Application.DTOs.CourseOfferings;
using UniLMS.Application.Interfaces.Services;
using UniLMS.WebApi.Extensions;

namespace UniLMS.WebApi.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class CourseOfferingController(ICourseOfferingService _courseOfferingService, IAcademicOwnershipService _ownershipService) : ControllerBase
    {
        // Assigning a course/teacher/room to a group is an administrative decision.
        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateCourseOfferingDTO model)
        {
            var result = await _courseOfferingService.CreateAsync(model);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromBody] UpdateCourseOfferingDTO model)
        {
            var result = await _courseOfferingService.UpdateAsync(model);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("soft")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDelete(List<Guid> ids)
        {
            var result = await _courseOfferingService.SoftDeleteRangeAsync(ids);
            return Ok(result);
        }

        [HttpDelete("hard")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> HardDelete(List<Guid> ids)
        {
            var result = await _courseOfferingService.HardDeleteRangeAsync(ids);
            return Ok(result);
        }

        /// <summary>Admins see everything, teachers their own offerings, students their group's offerings.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _courseOfferingService.GetAllAsync(
                studentAppUserId: User.AppUserIdIfInRole("Student"),
                teacherAppUserId: User.AppUserIdIfInRole("Teacher"));
            return Ok(result);
        }

        [HttpGet("id")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _courseOfferingService.GetByIdAsync(id,
                studentAppUserId: User.AppUserIdIfInRole("Student"),
                teacherAppUserId: User.AppUserIdIfInRole("Teacher"));
            return result.Success ? Ok(result) : NotFound(result);
        }

        /// <summary>Students of the group a course offering is taught to (for attendance and grading).</summary>
        [HttpGet("{id:guid}/students")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetStudents(Guid id)
        {
            if (!await _ownershipService.CourseOfferingExistsAsync(id))
                return NotFound();

            if (!User.IsInRole("Admin") && (!User.TryGetAppUserId(out var appUserId) ||
                !await _ownershipService.CanManageCourseOfferingAsync(id, appUserId)))
                return Forbid();

            var result = await _courseOfferingService.GetStudentsAsync(id);
            return Ok(result);
        }

        [HttpPost("restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(Guid id)
        {
            var result = await _courseOfferingService.RestoreAsync(id);
            return Ok(result);
        }
    }
}
