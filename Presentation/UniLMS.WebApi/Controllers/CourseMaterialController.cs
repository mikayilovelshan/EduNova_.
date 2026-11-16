using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniLMS.Application.DTOs.CourseMaterials;
using UniLMS.Domain.Entities;
using UniLMS.Infrastructure;
using UniLMS.Persistence.Contexts;
using System.Security.Claims;

namespace UniLMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CourseMaterialController(IFileService _fileService,
                    AppDbContext _context) : ControllerBase
    {
        [HttpPost("upload")]
        [Authorize(Roles = "Admin, Teacher")]
        public async Task<IActionResult> UploadMaterial([FromForm] UploadMaterialDTO model)
        {
            if (!User.IsInRole("Admin") && !await CanManageCourseAsync(model.CourseId))
                return Forbid();

            var uploadResult = await _fileService.UploadFileAsync(model.File);

            try
            {
                var material = new CourseMaterial
                {
                    Title = model.Title,
                    Description = model.Description,
                    CourseId = model.CourseId,
                    FileName = model.File.FileName,
                    FilePath = uploadResult,
                    CreatedDate = DateTime.UtcNow
                };

                _context.CourseMaterials.Add(material);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Material uploaded successfully.",
                    materialId = material.Id,
                    filePath = uploadResult
                });
            }
            catch
            {
                _fileService.DeleteFile(uploadResult);
                throw;
            }
        }

        [HttpGet("download")]
        [Authorize(Roles = "Student, Teacher, Admin")]

        public async Task<IActionResult> DownloadMaterial([FromQuery] string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
                return BadRequest(new { message = "File path is required." });

            var material = await _context.CourseMaterials
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.FilePath == filePath);

            if (material == null || !await CanAccessCourseAsync(material.CourseId))
                return NotFound("Material tapılmadı və ya ona giriş icazəniz yoxdur.");

            var fileResult = await _fileService.DownLoadFileAsync(material.FilePath);

            if (fileResult == null)
                return NotFound("Fayl tapılmadı və ya artıq silinib.");

            var (fileStream, contentType, fileName) = fileResult.Value;

            return File(fileStream, contentType, fileName);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var materials = _context.CourseMaterials.AsNoTracking();
            if (User.IsInRole("Student") || User.IsInRole("Teacher"))
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!Guid.TryParse(userId, out var appUserId))
                    return Unauthorized();

                if (User.IsInRole("Student"))
                {
                    var courseIds = _context.CourseOfferings
                        .Where(x => x.Group.Students.Any(s => s.AppUserId == appUserId))
                        .Select(x => x.CourseId);
                    materials = materials.Where(x => courseIds.Contains(x.CourseId));
                }
                else
                {
                    var courseIds = _context.CourseOfferings
                        .Where(x => x.Teacher.AppUserId == appUserId)
                        .Select(x => x.CourseId);
                    materials = materials.Where(x => courseIds.Contains(x.CourseId));
                }
            }

            return Ok(await materials.Select(x => new
            {
                x.Id,
                x.Title,
                x.Description,
                x.CourseId,
                x.FileName,
                x.CreatedDate
            }).ToListAsync());
        }

        [HttpDelete("delete")]
        [Authorize(Roles = "Admin, Teacher")]
        public async Task<IActionResult> DeleteMaterial([FromQuery] string filePath)
        {
            if(string.IsNullOrEmpty(filePath))
                return BadRequest(new { message = "File path is required." });

            var material = await _context.CourseMaterials.FirstOrDefaultAsync(x => x.FilePath == filePath);

            if (material == null)
                return NotFound("Bu ünvana uyğun material bazada tapılmadı.");

            if (!User.IsInRole("Admin") && !await CanManageCourseAsync(material.CourseId))
                return Forbid();

            _fileService.DeleteFile(filePath);

            _context.CourseMaterials.Remove(material);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Material və fiziki fayl uğurla silindi." });


        }

        private async Task<bool> CanAccessCourseAsync(Guid courseId)
        {
            if (User.IsInRole("Admin"))
                return true;

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userId, out var appUserId))
                return false;

            if (User.IsInRole("Student"))
                return await _context.CourseOfferings.AnyAsync(x => x.CourseId == courseId && x.Group.Students.Any(s => s.AppUserId == appUserId));

            return await _context.CourseOfferings.AnyAsync(x => x.CourseId == courseId && x.Teacher.AppUserId == appUserId);
        }

        private async Task<bool> CanManageCourseAsync(Guid courseId)
        {
            if (User.IsInRole("Admin"))
                return true;

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userId, out var appUserId)
                && User.IsInRole("Teacher")
                && await _context.CourseOfferings.AnyAsync(x => x.CourseId == courseId && x.Teacher.AppUserId == appUserId);
        }
    }
}
