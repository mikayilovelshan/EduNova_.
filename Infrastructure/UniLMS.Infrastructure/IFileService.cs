using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace UniLMS.Infrastructure
{
    public interface IFileService
    {
        Task<string> UploadFileAsync(IFormFile file);
        void DeleteFile(string filePath);
        Task<(Stream FileStream, string ContentType, string FileName)?> DownLoadFileAsync(string filePath);

        /// <summary>Absolute path of a stored file inside the uploads root, or null when it does not exist.</summary>
        string? GetPhysicalPath(string filePath);
    }
}
