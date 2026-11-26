namespace UniLMS.Application.DTOs.Chat
{
    public class ChatRequestDTO
    {
        public string Message { get; set; }

        /// <summary>Optional previous turns of the conversation (oldest first) so the assistant can keep context.</summary>
        public List<ChatHistoryItemDTO>? History { get; set; }
    }

    public class ChatHistoryItemDTO
    {
        /// <summary>"user" or "assistant".</summary>
        public string Role { get; set; } = "user";

        public string Content { get; set; } = string.Empty;
    }
}
