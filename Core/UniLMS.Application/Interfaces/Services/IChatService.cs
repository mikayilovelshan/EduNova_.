using System;
using System.Collections.Generic;
using System.Text;
using UniLMS.Application.DTOs.Chat;

namespace UniLMS.Application.Interfaces.Services
{
    public interface IChatService
    {
        Task<ChatResponseDTO> GetResponseAsync(ChatRequestDTO request, string userId);
    }
}
