using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using System.Text.Json;
using UniLMS.Application.DTOs.Chat;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Application.Repositories.ChatRepository;

namespace UniLMS.Infrastructure
{
    public class ChatService(
        IChatRepository _chatRepository,
        HttpClient _httpClient,
        IConfiguration _configuration) : IChatService
    {
        public async Task<ChatResponseDTO> GetResponseAsync(ChatRequestDTO request, string userId)
        {
            var courses = await _chatRepository.GetAllCourseAsync();
            var materials = await _chatRepository.GetAllCourseMaterialsAsync();
            var userCourses = await _chatRepository.GetUserCoursesAsync(userId);
            var userGrades = await _chatRepository.GetUserGradesAsync(userId);

            string courseText = courses.Any() ? string.Join(",", courses.Select(c => c.Name))
                : "Hələ ki kurs mövcud deyil.";
            string materialText = materials.Any() ? string.Join(",", materials.Select(m => m.Title))
                : "Hələ ki material mövcud deyil.";

            string userCoursesText = userCourses.Any() ? string.Join(",", userCourses)
                : "Hələ ki istifadəçi üçün kurs mövcud deyil.";
            string userGradesText = userGrades.Any() ? string.Join(",", userGrades.Select(g => $"{g.CourseName}: {g.Grade}"))
                : "Hələ ki istifadəçi üçün qiymət mövcud deyil.";

            string databaseContext =
            $"Sistem məlumatları:\n" +
            $"Ümumi kurslar: {courseText}\n" +
            $"Yüklənmiş materiallar: {materialText}\n" +
            $"Sizin kurslarınız: {userCoursesText}\n" +
            $"Sizin qiymətləriniz: {userGradesText}";

            string systemPrompt =
                "Sənin adın SiriUs-dur. Sən UniLMS sisteminin köməkçisisən. " +
                "Danışıq tərzin nəzakətli, dostcanlı və təbii olsun (robot kimi quru danışma, amma həddindən artıq qeyri-rəsmi də olma). " +
                "Tələbəyə qiymətlərini və ya kurslarını deyərkən **heç vaxt** qiymətin 'aşağı', 'yuxarı', 'zəif', 'pis' və ya 'əla' olduğu barədə subyektiv şərh və ya qiymətləndirmə vermə. " +
                "Yalnız mövcud qiyməti neytral, səliqəli və mehriban şəkildə təqdim et. " +
                "Həmişə yalnız aşağıdakı fərdi məlumatlara əsaslan:\n\n" +
                databaseContext;

            
            string aiReply = await GetAIResponseFromProviderAsync(systemPrompt, request.Message);

            return new ChatResponseDTO
            {
                Reply = aiReply,
                Timestamp = DateTime.UtcNow
            };
        }

        private async Task<string> GetAIResponseFromProviderAsync(string systemPrompt, string userMessage)
        {
            
            string apiKey = _configuration["Gemini:ApiKey"]
                ?? throw new InvalidOperationException("Gemini API Key tapılmadı.");

            string url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = $"{systemPrompt}\n\nİstifadəçinin sualı: {userMessage}" }
                        }
                    }
                }
            };

            try
            {
                var response = await _httpClient.PostAsJsonAsync(url, requestBody);
                if (!response.IsSuccessStatusCode)
                {
                    return "Üzr istəyirəm, hazırda süni intellekt xidmətinə qoşulmaq mümkün olmadı.";
                }

                var jsonResponse = await response.Content.ReadFromJsonAsync<JsonElement>();

                // Gemini JSON cavab strukturundan mətnin çıxarılması
                string replyText = jsonResponse
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text").GetString()
                    ?? "Cavab tapılmadı.";

                return replyText;
            }
            catch(Exception)
            {
                return "Sorğu yerinə yetirilərkən texniki xəta baş verdi.";
            }
        }
    }
}