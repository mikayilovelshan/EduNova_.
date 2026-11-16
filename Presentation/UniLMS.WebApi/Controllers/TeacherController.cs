using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UniLMS.Application.DTOs.Teachers;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Persistence.Contexts;

namespace UniLMS.WebApi.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class TeacherController(ITeacherService _teacherService, AppDbContext _context) : ControllerBase
    {
        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateTeacherDTO model)
        {
            var result = await _teacherService.CreateAsync(model);
            return Ok(result);
        }

        [HttpPut("update")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromBody] UpdateTeacherDTO model)
        {
            var result = await _teacherService.UpdateAsync(model);
            return Ok(result);
        }

        [HttpDelete("soft")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDelete(List<Guid> ids)
        {
            var result = await _teacherService.SoftDeleteRangeAsync(ids);
            return Ok(result);
        }

        [HttpDelete("hard")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> HardDelete(List<Guid> ids)
        {
            var result = await _teacherService.HardDeleteRangeAsync(ids);
            return Ok(result);
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _teacherService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("id")]
        public async Task<IActionResult> GetById(Guid id)
        {
            if (!await CanViewTeacherAsync(id))
                return Forbid();

            var result = await _teacherService.GetByIdAsync(id);
            return Ok(result);
        }

        [HttpPost("restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(Guid id)
        {
            var result = await _teacherService.RestoreAsync(id);
            return Ok(result);
        }

        private async Task<bool> CanViewTeacherAsync(Guid teacherId)
        {
            if (User.IsInRole("Admin"))
                return true;

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return User.IsInRole("Teacher")
                && Guid.TryParse(userId, out var appUserId)
                && await _context.Teachers.AnyAsync(x => x.Id == teacherId && x.AppUserId == appUserId);
        }
    }
}
