using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UniLMS.Application.DTOs.Students;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Persistence.Contexts;


namespace UniLMS.WebApi.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class StudentController(IStudentService _studentService, AppDbContext _context) : ControllerBase
    {
        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateStudentDTO model)
        {
            var result = await _studentService.CreateAsync(model);
            return Ok(result);
        }

        [HttpPut("update")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromBody] UpdateStudentDTO model)
        {
            var result = await _studentService.UpdateAsync(model);
            return Ok(result);
        }

        [HttpDelete("soft")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDelete(List<Guid> ids)
        {
            var result = await _studentService.SoftDeleteRangeAsync(ids);
            return Ok(result);
        }

        [HttpDelete("hard")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> HardDelete(List<Guid> ids)
        {
            var result = await _studentService.HardDeleteRangeAsync(ids);
            return Ok(result);
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _studentService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("id")]
        public async Task<IActionResult> GetById(Guid id)
        {
            if (!await CanViewStudentAsync(id))
                return Forbid();

            var result = await _studentService.GetByIdAsync(id);
            return Ok(result);
        }

        [HttpPost("restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(Guid id)
        {
            var result = await _studentService.RestoreAsync(id);
            return Ok(result);
        }

        private async Task<bool> CanViewStudentAsync(Guid studentId)
        {
            if (User.IsInRole("Admin") || User.IsInRole("Teacher"))
                return true;

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userId, out var appUserId)
                && await _context.Students.AnyAsync(x => x.Id == studentId && x.AppUserId == appUserId);
        }
    }
}

