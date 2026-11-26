using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using UniLMS.Application.DTOs.Chat;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Application.Repositories.ChatRepository;
using UniLMS.Application.Utilities.Grading;
using UniLMS.Domain.Enums;
using UniLMS.Infrastructure.Rag;

namespace UniLMS.Infrastructure
{
    /// <summary>
    /// SiriUs, the assistant. Talks to OpenRouter (OpenAI-compatible chat completions) using free models,
    /// grounded in the signed-in user's own records plus matching passages from their course materials.
    /// </summary>
    public class ChatService(
        IChatRepository _chatRepository,
        MaterialRetriever _retriever,
        HttpClient _httpClient,
        IConfiguration _configuration,
        ILogger<ChatService> _logger) : IChatService
    {
        private const int MaxHistoryTurns = 12;
        private const string DefaultBaseUrl = "https://openrouter.ai/api/v1";
        private const string DefaultModel = "google/gemma-4-31b-it:free";
        private const string DefaultFallback = "nvidia/nemotron-3-ultra-550b-a55b:free";

        public async Task<ChatResponseDTO> GetResponseAsync(ChatRequestDTO request, string userId)
        {
            if (!Guid.TryParse(userId, out var appUserId))
                return Reply("İstifadəçi müəyyən edilə bilmədi.");

            if (string.IsNullOrWhiteSpace(request.Message))
                return Reply("Zəhmət olmasa sualınızı yazın.");

            var apiKey = _configuration["OpenRouter:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
                return Reply("Süni intellekt köməkçisi hələ konfiqurasiya edilməyib. Administrator \"OpenRouter:ApiKey\" dəyərini təyin etməlidir.");

            var userContext = await _chatRepository.GetUserContextAsync(appUserId);
            var snippets = _retriever.Search(request.Message, userContext.MaterialSources);
            var systemPrompt = BuildSystemPrompt(userContext) + BuildMaterialSection(snippets);

            var aiReply = await GetAIResponseFromProviderAsync(apiKey, systemPrompt, request);

            return Reply(aiReply);
        }

        private static ChatResponseDTO Reply(string text) => new() { Reply = text, Timestamp = DateTime.UtcNow };

        private static string BuildSystemPrompt(ChatUserContextDTO ctx)
        {
            var az = CultureInfo.InvariantCulture;
            var sb = new StringBuilder();

            sb.AppendLine("Sənin adın SiriUs-dur. Sən UniLMS universitet tədris idarəetmə sisteminin süni intellekt köməkçisisən.");
            sb.AppendLine("Qaydalar:");
            sb.AppendLine("- Həmişə Azərbaycan dilində, nəzakətli, dostcanlı və qısa cavab ver. Lazım olduqda siyahı və cədvəllərdən (Markdown) istifadə et.");
            sb.AppendLine("- Yalnız aşağıdakı İSTİFADƏÇİ MƏLUMATLARINA və KURS MATERİALLARINDAN PARÇALARA əsaslan. Məlumat yoxdursa, bunu açıq de və uydurma.");
            sb.AppendLine("- Qiymətləri 'aşağı', 'zəif', 'pis', 'əla' kimi subyektiv sözlərlə qiymətləndirmə; rəqəmləri neytral təqdim et.");
            sb.AppendLine("- Başqa tələbələrin şəxsi məlumatlarını heç vaxt açıqlama.");
            sb.AppendLine("- Qiymətləndirmə sistemi: davamiyyət maks. 10 bal; gündəlik qiymət, kollokviumlar və sərbəst iş hər biri maks. 10 bal; imtahana qədər bal maks. 50; yekun imtahan maks. 50. " +
                          $"Keçid üçün cəmi ən azı {GradingPolicy.MinTotalToPass} bal və imtahandan ən azı {GradingPolicy.MinFinalToPass} bal lazımdır. " +
                          "Hərf qiymətləri: A 91+, B 81-90, C 71-80, D 61-70, E 51-60, F <51.");
            var today = DateTime.Today;
            sb.AppendLine($"- Bugünkü tarix: {today:yyyy-MM-dd}, {DayName(today.DayOfWeek)} ({today.DayOfWeek}). Saat: {DateTime.Now:HH:mm}.");
            sb.AppendLine("- Diqqət: 'Çərşənbə axşamı' = Tuesday, 'Çərşənbə' = Wednesday, 'Cümə axşamı' = Thursday, 'Cümə' = Friday.");
            sb.AppendLine("- Tarixləri və həftənin günlərini ÖZÜN HESABLAMA. 'Bu gün', 'sabah', 'birigün' və konkret tarixlər üçün yalnız aşağıdakı " +
                          "'YAXIN GÜNLƏRİN DƏRSLƏRİ' bölməsindən istifadə et — orada hər günün tarixi və dərsləri artıq hesablanıb.");
            sb.AppendLine();
            sb.AppendLine("İSTİFADƏÇİ MƏLUMATLARI:");
            sb.AppendLine($"Ad: {ctx.FullName}; Rollar: {string.Join(", ", ctx.Roles)}");
            if (ctx.ActiveSemester != null) sb.AppendLine($"Aktiv semestr: {ctx.ActiveSemester}");
            if (ctx.StudentNumber != null)
                sb.AppendLine($"Tələbə nömrəsi: {ctx.StudentNumber}; Qrup: {ctx.GroupCode ?? "-"}; İxtisas: {ctx.SpecialityName ?? "-"}; ÜOMG (GPA): {ctx.GPA?.ToString("0.##", az) ?? "-"}");
            if (ctx.ScientificDegree != null)
                sb.AppendLine($"Elmi dərəcə: {ctx.ScientificDegree}; Kafedra: {ctx.CafedraName}");

            sb.AppendLine();
            sb.AppendLine(ctx.StudentNumber != null ? "FƏNLƏR (davamiyyət və nəticələrlə):" : "FƏNLƏR:");
            if (ctx.Courses.Count == 0)
                sb.AppendLine("Heç bir fənn tapılmadı.");

            foreach (var c in ctx.Courses)
            {
                sb.AppendLine($"* {c.CourseName} ({c.CourseCode}) — müəllim: {c.TeacherName}; qrup: {c.GroupCode}; otaq: {c.RoomCode}; semestr: {c.SemesterName}");

                if (ctx.StudentNumber != null)
                {
                    var attendanceScore = GradingPolicy.AttendanceScore(c.TotalClasses, c.AttendedClasses);
                    var scored = c.Results.Select(r => (r.Type, r.Score)).ToList();
                    var entry = GradingPolicy.EntryScore(attendanceScore, scored);
                    var final = GradingPolicy.FinalScore(scored);
                    var hasFinal = c.Results.Any(r => r.Type == ExamType.FinalExam);

                    sb.AppendLine($"  Davamiyyət: {c.AttendedClasses}/{c.TotalClasses} dərsdə iştirak (qayıb: {c.TotalClasses - c.AttendedClasses}), davamiyyət balı {attendanceScore.ToString("0.##", az)}/10");
                    sb.AppendLine(c.Results.Count == 0
                        ? "  Nəticələr: hələ qiymət yoxdur"
                        : "  Nəticələr: " + string.Join("; ", c.Results.Select(r => $"{ExamTypeName(r.Type)} {r.Score.ToString("0.##", az)}/{GradingPolicy.MaxScoreFor(r.Type)} ({r.Date:yyyy-MM-dd})")));
                    sb.AppendLine($"  İmtahana qədər bal: {entry.ToString("0.##", az)}/50; " +
                                  (hasFinal
                                      ? $"yekun imtahan: {final.ToString("0.##", az)}/50; cəmi {(entry + final).ToString("0.##", az)}; hərf qiyməti {GradingPolicy.LetterGrade(entry, final)}"
                                      : "yekun imtahan hələ keçirilməyib"));
                }
                else
                {
                    sb.AppendLine($"  Tələbə sayı: {c.StudentCount}");
                }

                if (c.Materials.Count > 0)
                    sb.AppendLine($"  Materiallar: {string.Join(", ", c.Materials)}");
            }

            sb.AppendLine();
            sb.AppendLine("HƏFTƏLİK DƏRS CƏDVƏLİ:");
            if (ctx.Schedule.Count == 0)
                sb.AppendLine("Cədvəl boşdur.");
            foreach (var s in ctx.Schedule)
                sb.AppendLine($"* {DayName(s.Day)} ({s.Day}) {s.Start:hh\\:mm}-{s.End:hh\\:mm}: {s.CourseName}, otaq {s.RoomCode}, qrup {s.GroupCode}, müəllim {s.TeacherName}");

            AppendUpcomingDays(sb, ctx.Schedule);

            return sb.ToString();
        }

        /// <summary>
        /// The weekly timetable unrolled onto real dates for the next two weeks, so the model never has to do
        /// calendar arithmetic (small models confuse "Çərşənbə axşamı"/Tuesday with "Çərşənbə"/Wednesday).
        /// </summary>
        private static void AppendUpcomingDays(StringBuilder sb, List<ChatScheduleItemDTO> schedule)
        {
            const int days = 14;
            var now = DateTime.Now;
            var today = now.Date;
            var az = new CultureInfo("az-Latn-AZ");

            sb.AppendLine();
            sb.AppendLine($"YAXIN GÜNLƏRİN DƏRSLƏRİ (bu gündən {days} gün; tarixlər dəqiqdir):");
            for (var offset = 0; offset < days; offset++)
            {
                var date = today.AddDays(offset);
                var label = offset switch { 0 => "BU GÜN", 1 => "SABAH", 2 => "BİRİGÜN", _ => null };
                var head = $"{date:yyyy-MM-dd} — {date.ToString("d MMMM", az)}, {DayName(date.DayOfWeek)} ({date.DayOfWeek})" +
                           (label != null ? $" [{label}]" : "");

                var lessons = schedule.Where(s => s.Day == date.DayOfWeek).OrderBy(s => s.Start).ToList();
                if (lessons.Count == 0)
                {
                    sb.AppendLine($"* {head}: dərs yoxdur");
                    continue;
                }

                sb.AppendLine($"* {head}:");
                foreach (var s in lessons)
                {
                    var state = offset != 0 ? ""
                        : now.TimeOfDay >= s.End ? " (bitib)"
                        : now.TimeOfDay >= s.Start ? " (indi gedir)"
                        : "";
                    sb.AppendLine($"  - {s.Start:hh\\:mm}-{s.End:hh\\:mm} {s.CourseName}{state}, otaq {s.RoomCode}, müəllim {s.TeacherName}, qrup {s.GroupCode}");
                }
            }
        }

        private static string BuildMaterialSection(IReadOnlyList<MaterialSnippet> snippets)
        {
            if (snippets.Count == 0)
                return string.Empty;

            var sb = new StringBuilder();
            sb.AppendLine();
            sb.AppendLine("KURS MATERİALLARINDAN PARÇALAR (suala ən uyğun hissələr):");
            sb.AppendLine("- Sual materialın məzmunu haqqındadırsa, bu parçalara əsaslan və cavabda mənbəni (material adını) göstər.");
            sb.AppendLine("- Parçalarda cavab yoxdursa, bunu de; uydurma.");
            foreach (var s in snippets)
            {
                sb.AppendLine();
                sb.AppendLine($"[Mənbə: {s.Title} — {s.CourseName}]");
                sb.AppendLine(s.Text);
            }
            return sb.ToString();
        }

        /// <summary>Primary model first, then the configured fallbacks; the next one is tried on rate limits or outages.</summary>
        private List<string> Models()
        {
            var primary = _configuration["OpenRouter:Model"];
            var models = new List<string> { string.IsNullOrWhiteSpace(primary) ? DefaultModel : primary };

            var fallbacks = _configuration.GetSection("OpenRouter:FallbackModels").GetChildren()
                .Select(c => c.Value)
                .Where(v => !string.IsNullOrWhiteSpace(v))
                .Select(v => v!)
                .ToList();
            models.AddRange(fallbacks.Count > 0 ? fallbacks : [DefaultFallback]);

            return models.Distinct().ToList();
        }

        private async Task<string> GetAIResponseFromProviderAsync(string apiKey, string systemPrompt, ChatRequestDTO request)
        {
            var configuredUrl = _configuration["OpenRouter:BaseUrl"];
            var baseUrl = (string.IsNullOrWhiteSpace(configuredUrl) ? DefaultBaseUrl : configuredUrl).TrimEnd('/');

            var history = (request.History ?? new List<ChatHistoryItemDTO>())
                .Where(x => !string.IsNullOrWhiteSpace(x.Content))
                .TakeLast(MaxHistoryTurns)
                .Select(x => (Role: x.Role == "assistant" ? "assistant" : "user", Content: x.Content))
                .ToList();

            var rateLimited = false;
            foreach (var model in Models())
            {
                try
                {
                    using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/chat/completions")
                    {
                        Content = JsonContent.Create(new
                        {
                            model,
                            messages = BuildMessages(model, systemPrompt, history, request.Message),
                            temperature = 0.4,
                            max_tokens = 1500
                        })
                    };
                    httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                    httpRequest.Headers.Add("X-Title", "UniLMS");

                    using var response = await _httpClient.SendAsync(httpRequest);
                    if (!response.IsSuccessStatusCode)
                    {
                        var status = (int)response.StatusCode;
                        var body = await response.Content.ReadAsStringAsync();
                        // Error bodies never contain the prompt, so they are safe to log.
                        _logger.LogWarning("OpenRouter model {Model} failed with {Status}: {Body}", model, status, body.Length > 500 ? body[..500] : body);

                        if (status == 401)
                            return "Süni intellekt xidmətinin API açarı qəbul edilmədi. Administrator \"OpenRouter:ApiKey\" dəyərini yoxlamalıdır.";
                        if (status == 429)
                            rateLimited = true;
                        continue; // rate limit, model unavailable or provider error: try the next model
                    }

                    var json = await response.Content.ReadFromJsonAsync<JsonElement>();
                    if (json.TryGetProperty("error", out var error))
                    {
                        _logger.LogWarning("OpenRouter model {Model} returned an error: {Error}", model, error.ToString());
                        continue;
                    }

                    var message = json.GetProperty("choices")[0].GetProperty("message");
                    var text = message.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.String
                        ? content.GetString()
                        : null;

                    if (!string.IsNullOrWhiteSpace(text))
                        return text.Trim();

                    _logger.LogWarning("OpenRouter model {Model} returned an empty answer", model);
                }
                catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException or KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException)
                {
                    _logger.LogError(ex, "OpenRouter request to {Model} failed", model);
                }
            }

            return rateLimited
                ? "Pulsuz süni intellekt modelinin limiti hazırda dolub. Bir neçə dəqiqədən sonra yenidən cəhd edin."
                : "Üzr istəyirəm, hazırda süni intellekt xidmətinə qoşulmaq mümkün olmadı. Bir az sonra yenidən cəhd edin.";
        }

        /// <summary>
        /// OpenAI-style messages. Gemma models served by Google reject a separate system role, so for them the
        /// instructions travel inside the first user turn instead.
        /// </summary>
        private static List<object> BuildMessages(string model, string systemPrompt, List<(string Role, string Content)> history, string message)
        {
            var turns = history.Append((Role: "user", Content: message)).ToList();
            var messages = new List<object>();

            if (model.Contains("gemma", StringComparison.OrdinalIgnoreCase))
            {
                var firstUser = turns.FindIndex(t => t.Role == "user");
                turns[firstUser] = ("user", $"{systemPrompt}\n\n---\nİstifadəçinin sualı:\n{turns[firstUser].Content}");
            }
            else
            {
                messages.Add(new { role = "system", content = systemPrompt });
            }

            messages.AddRange(turns.Select(t => (object)new { role = t.Role, content = t.Content }));
            return messages;
        }

        private static string ExamTypeName(ExamType type) => type switch
        {
            ExamType.DailyGrade => "Gündəlik qiymət",
            ExamType.Colloquium1 => "Kollokvium 1",
            ExamType.Colloquium2 => "Kollokvium 2",
            ExamType.Colloquium3 => "Kollokvium 3",
            ExamType.IndependentWork => "Sərbəst iş",
            ExamType.FinalExam => "Yekun imtahan",
            _ => type.ToString()
        };

        private static string DayName(DayOfWeek day) => day switch
        {
            DayOfWeek.Monday => "Bazar ertəsi",
            DayOfWeek.Tuesday => "Çərşənbə axşamı",
            DayOfWeek.Wednesday => "Çərşənbə",
            DayOfWeek.Thursday => "Cümə axşamı",
            DayOfWeek.Friday => "Cümə",
            DayOfWeek.Saturday => "Şənbə",
            _ => "Bazar"
        };
    }
}
