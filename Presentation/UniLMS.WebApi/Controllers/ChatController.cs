using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UniLMS.Application.DTOs.Chat;
using UniLMS.Application.Interfaces.Services;

namespace UniLMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] 
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] ChatRequestDTO request)
        {
            
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "İstifadəçi身份 (Token) tapılmadı və ya etibarsızdır." });
            }

            
            var response = await _chatService.GetResponseAsync(request, userId);
            return Ok(response);
        }
    }
}
