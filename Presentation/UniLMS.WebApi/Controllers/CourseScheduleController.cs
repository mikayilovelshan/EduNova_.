using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UniLMS.Application.DTOs.CourseSchedules;
using UniLMS.Application.Interfaces.Services;

namespace UniLMS.WebApi.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class CourseScheduleController(ICourseScheduleService _courseScheduleService) : ControllerBase
    {
        [HttpPost("create")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Create([FromBody] CreateCourseScheduleDTO model)
        {
            var result = await _courseScheduleService.CreateAsync(model);
            return Ok(result);
        }

        [HttpPut("update")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Update([FromBody] UpdateCourseScheduleDTO model)
        {
            var result = await _courseScheduleService.UpdateAsync(model);
            return Ok(result);
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

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _courseScheduleService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("id")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _courseScheduleService.GetByIdAsync(id);
            return Ok(result);
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
