using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UniLMS.Application.DTOs.ExamResults;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Persistence.Contexts;

namespace UniLMS.WebApi.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class ExamResultController(IExamResultService _examResultService, IAcademicOwnershipService _ownershipService) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _examResultService.GetAllAsync(
                studentAppUserId: GetAppUserIdForRole("Student"),
                teacherAppUserId: GetAppUserIdForRole("Teacher"));
            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            if (!User.IsInRole("Admin"))
            {
                if (!TryGetAuthenticatedUserId(out var appUserId))
                    return Forbid();

                if (!await _ownershipService.ExamResultExistsAsync(id))
                    return NotFound();

                if (!await _ownershipService.CanAccessExamResultAsync(id, appUserId))
                    return Forbid();
            }

            var result = await _examResultService.GetByIdAsync(id,
                studentAppUserId: GetAppUserIdForRole("Student"),
                teacherAppUserId: GetAppUserIdForRole("Teacher"));
            if (result.Success)
                return Ok(result);

            return NotFound(result);
        }

        [HttpGet("student-summary")]
        public async Task<IActionResult> GetStudentExamResultSummary([FromQuery] Guid studentId, [FromQuery] Guid courseOfferingId)
        {
            if (!await _ownershipService.StudentExistsAsync(studentId) ||
                !await _ownershipService.CourseOfferingExistsAsync(courseOfferingId))
                return NotFound();

            if (!User.IsInRole("Admin") && (!TryGetAuthenticatedUserId(out var appUserId) ||
                !await _ownershipService.CanAccessStudentCourseAsync(studentId, courseOfferingId, appUserId, User.IsInRole("Teacher"))))
                return Forbid();

            var result = await _examResultService.GetStudentExamResultSummary(studentId, courseOfferingId);
            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpGet("course-detailed-report")]
        public async Task<IActionResult> GetStudentCourseDetailedReport([FromQuery] Guid studentId, [FromQuery] Guid courseOfferingId)
        {
            if (!await _ownershipService.StudentExistsAsync(studentId) ||
                !await _ownershipService.CourseOfferingExistsAsync(courseOfferingId))
                return NotFound();

            if (!User.IsInRole("Admin") && (!TryGetAuthenticatedUserId(out var appUserId) ||
                !await _ownershipService.CanAccessStudentCourseAsync(studentId, courseOfferingId, appUserId, User.IsInRole("Teacher"))))
                return Forbid();

            var result = await _examResultService.GetStudentCourseDetailedReport(studentId, courseOfferingId);
            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        /// <summary>Grade summaries of the signed-in student for every course of their group.</summary>
        [HttpGet("my-summaries")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMySummaries()
        {
            if (!TryGetAuthenticatedUserId(out var appUserId))
                return Unauthorized();

            var result = await _examResultService.GetMySummariesAsync(appUserId);
            return result.Success ? Ok(result) : NotFound(result);
        }

        /// <summary>Gradebook: grade summary of every student of a course offering.</summary>
        [HttpGet("offering-summaries")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetOfferingSummaries([FromQuery] Guid courseOfferingId)
        {
            if (!await _ownershipService.CourseOfferingExistsAsync(courseOfferingId))
                return NotFound();

            if (!User.IsInRole("Admin") && (!TryGetAuthenticatedUserId(out var appUserId) ||
                !await _ownershipService.CanManageCourseOfferingAsync(courseOfferingId, appUserId)))
                return Forbid();

            var result = await _examResultService.GetCourseOfferingSummariesAsync(courseOfferingId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("create-range")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> CreateRange([FromBody] CreateExamResultRangeDTO model)
        {
            if (!await _ownershipService.CourseOfferingExistsAsync(model.CourseOfferingId))
                return NotFound();

            if (!User.IsInRole("Admin"))
            {
                if (!TryGetAuthenticatedUserId(out var appUserId) ||
                    !await _ownershipService.CanManageCourseOfferingAsync(model.CourseOfferingId, appUserId))
                    return Forbid();
            }

            var result = await _examResultService.CreateRangeAsync(model);
            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpPut]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Update([FromBody] UpdateExamResultDTO model)
        {
            if (!User.IsInRole("Admin"))
            {
                if (!TryGetAuthenticatedUserId(out var appUserId))
                    return Forbid();

                if (!await _ownershipService.ExamResultExistsAsync(model.Id))
                    return NotFound();

                if (!await _ownershipService.CanManageExamResultAsync(model.Id, appUserId))
                    return Forbid();
            }

            var result = await _examResultService.UpdateAsync(model);
            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        private bool TryGetAuthenticatedUserId(out Guid appUserId)
        {
            return Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out appUserId);
        }

        private Guid? GetAppUserIdForRole(string role)
        {
            if (!User.IsInRole(role))
                return null;

            return Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var appUserId)
                ? appUserId
                : Guid.Empty;
        }

        [HttpDelete("soft/{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDelete(Guid id)
        {
            var result = await _examResultService.SoftDeleteAsync(id);
            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpPost("soft-range")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDeleteRange([FromBody] List<Guid> ids)
        {
            var result = await _examResultService.SoftDeleteRangeAsync(ids);
            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpDelete("hard/{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> HardDelete(Guid id)
        {
            var result = await _examResultService.HardDeleteAsync(id);
            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpPost("hard-range")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> HardDeleteRange([FromBody] List<Guid> ids)
        {
            var result = await _examResultService.HardDeleteRangeAsync(ids);
            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpPost("restore/{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(Guid id)
        {
            var result = await _examResultService.RestoreAsync(id);
            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }
    }
}