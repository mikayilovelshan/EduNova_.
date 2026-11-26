using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniLMS.Application.DTOs.Auth;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Domain.Entities;
using UniLMS.Persistence.Contexts;
using UniLMS.WebApi.Extensions;

namespace UniLMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController(IAuthService _authService, UserManager<AppUser> _userManager, AppDbContext _context) : ControllerBase
    {
        /// <summary>
        /// Creates an additional administrator account. Students and teachers are provisioned with their
        /// academic profile through /Student/create and /Teacher/create, so open self-registration
        /// (which produced Student-role users without a student profile) is no longer allowed.
        /// </summary>
        [HttpPost("register")]
        [Authorize(Roles = "Admin")]
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
            if (!User.TryGetAppUserId(out var id))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound();

            var dto = new CurrentUserDTO
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = await _userManager.GetRolesAsync(user)
            };

            var student = await _context.Students.AsNoTracking()
                .Where(x => x.AppUserId == id)
                .Select(x => new { x.Id, x.StudentNumber, x.GPA, x.GroupId, GroupCode = x.Group != null ? x.Group.Code : null, SpecialityName = x.Group != null ? x.Group.Speciality.Name : null })
                .FirstOrDefaultAsync();

            if (student != null)
            {
                dto.StudentId = student.Id;
                dto.StudentNumber = student.StudentNumber;
                dto.GPA = student.GPA;
                dto.GroupId = student.GroupId;
                dto.GroupCode = student.GroupCode;
                dto.SpecialityName = student.SpecialityName;
            }

            var teacher = await _context.Teachers.AsNoTracking()
                .Where(x => x.AppUserId == id)
                .Select(x => new { x.Id, x.ScientificDegree, CafedraName = x.Cafedra.Name })
                .FirstOrDefaultAsync();

            if (teacher != null)
            {
                dto.TeacherId = teacher.Id;
                dto.ScientificDegree = teacher.ScientificDegree;
                dto.CafedraName = teacher.CafedraName;
            }

            return Ok(dto);
        }
    }
}
