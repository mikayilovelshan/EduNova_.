using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;

namespace UniLMS.Infrastructure
{
    public class FileService(IWebHostEnvironment _env) : IFileService
    {
        public void DeleteFile(string filePath)
        {
            var fullPath = GetSafePath(filePath);

            if(File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }

        public async Task<(Stream FileStream, string ContentType, string FileName)?> DownLoadFileAsync(string filePath)
        {
            var fullpath = GetSafePath(filePath);

            if (!File.Exists(fullpath))
                return null;

            var memoryStream = new MemoryStream();
            using (var stream = new FileStream(fullpath, FileMode.Open, FileAccess.Read))
            {
                await stream.CopyToAsync(memoryStream);
            }

            memoryStream.Position = 0;

            var fileName = Path.GetFileName(fullpath);
            if (!new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider().TryGetContentType(fullpath, out var contentType))
                contentType = "application/octet-stream";

            return (memoryStream, contentType, fileName);
            

        }

        public async Task<string> UploadFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Fayl seçilməyib və ya boşdur.");

            var uploadsFolder = Path.Combine(GetWebRootPath(), "uploads", "materials");

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);

            var physicalFilePath = Path.Combine(uploadsFolder, uniqueFileName);

            using(var fileStream = new FileStream(physicalFilePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return Path.Combine("uploads", "materials", uniqueFileName).Replace("\\", "/");
        }

        public string? GetPhysicalPath(string filePath)
        {
            try
            {
                var fullPath = GetSafePath(filePath);
                return File.Exists(fullPath) ? fullPath : null;
            }
            catch (ArgumentException)
            {
                return null;
            }
        }

        private string GetSafePath(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                throw new ArgumentException("Fayl seçilməyib və ya boşdur.");

            var root = Path.GetFullPath(GetWebRootPath())
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                + Path.DirectorySeparatorChar;
            var fullPath = Path.GetFullPath(Path.Combine(root, relativePath.Replace('/', Path.DirectorySeparatorChar)));

            if (!fullPath.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Fayl yolu icazəli qovluqdan kənardadır.");

            return fullPath;
        }

        private string GetWebRootPath()
        {
            var webRootPath = _env.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRootPath))
                webRootPath = Path.Combine(_env.ContentRootPath, "wwwroot");

            Directory.CreateDirectory(webRootPath);
            return webRootPath;
        }
    }
}
