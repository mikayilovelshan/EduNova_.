using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UniLMS.Application.DTOs.Auth;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Domain.Entities;

namespace UniLMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController(IAuthService _authService, UserManager<AppUser> _userManager) : ControllerBase
    {
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO model)
        {
            var result = await _authService.Register(model);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO model)
        {
            var result = await  _authService.Login(model);

            return result.Success ? Ok(result) : Unauthorized(result);
        }

        [HttpPost("refreshtoken")]
        public async Task<IActionResult> RefreshToken([FromBody] string refreshToken)
        {
            var result = await _authService.RefreshToken(refreshToken);

            return result.Success ? Ok(result) : Unauthorized(result);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userId, out var id))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound();

            return Ok(new
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                Roles = await _userManager.GetRolesAsync(user)
            });
        }
    }
}
