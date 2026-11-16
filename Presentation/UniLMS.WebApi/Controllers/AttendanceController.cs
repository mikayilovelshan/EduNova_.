
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UniLMS.Application.DTOs.Attendance;
using UniLMS.Application.Interfaces.Services;

namespace UniLMS.WebApi.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class AttendanceController(IAttendanceService _attendanceService, IAcademicOwnershipService _ownershipService) : ControllerBase
    {
        [HttpPost("create")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> CreateRange([FromBody] CreateAttendanceRangeDTO model)
        {
            if (!await _ownershipService.CourseScheduleExistsAsync(model.CourseScheduleId))
                return NotFound();

            if (!User.IsInRole("Admin"))
            {
                if (!TryGetAuthenticatedUserId(out var appUserId) ||
                    !await _ownershipService.CanManageCourseScheduleAsync(model.CourseScheduleId, appUserId))
                    return Forbid();
            }

            var result = await _attendanceService.CreateRangeAsync(model);

            return StatusCode(200, result);
        }

        [HttpPut]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> UpdateRange([FromBody] UpdateAttendanceRangeDTO model)
        {
            if (!User.IsInRole("Admin"))
            {
                if (!TryGetAuthenticatedUserId(out var appUserId))
                    return Forbid();

                var ids = model.Students.Select(x => x.AttendanceId).Distinct().ToList();
                foreach (var id in ids)
                {
                    if (!await _ownershipService.AttendanceExistsAsync(id))
                        return NotFound();
                }

                if (!await _ownershipService.CanAccessAttendanceRangeAsync(ids, appUserId))
                    return Forbid();
            }

            var result = await _attendanceService.UpdateRangeAsync(model);

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _attendanceService.GetAllAsync(
                studentAppUserId: GetAppUserIdForRole("Student"),
                teacherAppUserId: GetAppUserIdForRole("Teacher"));
            return Ok(result);
        }

        [HttpGet("id")]
        public async Task<IActionResult> GetById(Guid id)
        {
            if (!User.IsInRole("Admin"))
            {
                if (!TryGetAuthenticatedUserId(out var appUserId))
                    return Forbid();

                if (!await _ownershipService.AttendanceExistsAsync(id))
                    return NotFound();

                if (!await _ownershipService.CanAccessAttendanceAsync(id, appUserId))
                    return Forbid();
            }

            var result = await _attendanceService.GetByIdAsync(id,
                studentAppUserId: GetAppUserIdForRole("Student"),
                teacherAppUserId: GetAppUserIdForRole("Teacher"));
            return Ok(result);
        }

        private Guid? GetAppUserIdForRole(string role)
        {
            if (!User.IsInRole(role))
                return null;

            return Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var appUserId)
                ? appUserId
                : Guid.Empty;
        }

        private bool TryGetAuthenticatedUserId(out Guid appUserId)
        {
            return Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out appUserId);
        }

        [HttpDelete("soft")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDelete(List<Guid> ids)
        {
            var result = await _attendanceService.SoftDeleteRangeAsync(ids);
            return Ok(result);
        }

        [HttpDelete("hard")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> HardDelete(List<Guid> ids)
        {
            var result = await _attendanceService.HardDeleteRangeAsync(ids);
            return Ok(result);
        }

        [HttpPost("restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(Guid id)
        {
            var result = await _attendanceService.RestoreAsync(id);
            return Ok(result);
        }
    }
}
