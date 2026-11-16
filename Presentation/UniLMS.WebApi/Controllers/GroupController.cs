using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UniLMS.Application.DTOs.Groups;
using UniLMS.Application.Interfaces.Services;

namespace UniLMS.WebApi.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class GroupController(IGroupService _groupService) : ControllerBase
    {
        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateGroupDTO model)
        {
            var result = await _groupService.CreateAsync(model);
            return Ok(result);
        }

        [HttpPut("update")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromBody] UpdateGroupDTO model)
        {
            var result = await _groupService.UpdateAsync(model);
            return Ok(result);
        }

        [HttpDelete("soft")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDelete(List<Guid> ids)
        {
            var result = await _groupService.SoftDeleteRangeAsync(ids);
            return Ok(result);
        }

        [HttpDelete("hard")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> HardDelete(List<Guid> ids)
        {
            var result = await _groupService.HardDeleteRangeAsync(ids);
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _groupService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("id")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _groupService.GetByIdAsync(id);
            return Ok(result);
        }

        [HttpPost("restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(Guid id)
        {
            var result = await _groupService.RestoreAsync(id);
            return Ok(result);
        }
    }
}
