using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using UniLMS.Application.DTOs.Chat;

namespace UniLMS.Infrastructure.Rag
{
    public record MaterialSnippet(string Title, string CourseName, string Text, double Score);

    /// <summary>
    /// Retrieval for the assistant (the "R" in RAG) without paid embeddings: course materials are split into
    /// overlapping chunks and ranked against the question with BM25. Only materials of the user's own courses
    /// are ever passed in, so retrieval cannot leak another course's files.
    /// </summary>
    public partial class MaterialRetriever(IFileService _files, IMemoryCache _cache, ILogger<MaterialRetriever> _logger)
    {
        private const int ChunkChars = 1100;
        private const int ChunkOverlap = 200;
        private const double K1 = 1.4;
        private const double B = 0.75;
        private const double MinScore = 1.5;

        private static readonly CultureInfo Az = new("az-Latn-AZ");

        private static readonly HashSet<string> StopWords = new(StringComparer.Ordinal)
        {
            "və", "ilə", "bu", "bir", "üçün", "nə", "necə", "hansı", "mən", "mənim", "sən", "olan", "olur", "edir",
            "da", "də", "ki", "ya", "isə", "kimi", "haqqında", "barədə", "nədir", "neçə", "var", "yox", "daha", "çox",
            "the", "and", "for", "what", "how", "with", "this", "that", "are", "is"
        };

        private record Chunk(string Text, string[] Terms);

        public IReadOnlyList<MaterialSnippet> Search(string query, IReadOnlyList<ChatMaterialSourceDTO> sources, int take = 4)
        {
            var queryTerms = Tokenize(query).Distinct().ToArray();
            if (queryTerms.Length == 0 || sources.Count == 0)
                return [];

            var corpus = new List<(ChatMaterialSourceDTO Source, Chunk Chunk)>();
            foreach (var source in sources)
                foreach (var chunk in ChunksOf(source))
                    corpus.Add((source, chunk));

            if (corpus.Count == 0)
                return [];

            var avgLength = corpus.Average(c => c.Chunk.Terms.Length);
            var df = queryTerms.ToDictionary(t => t, t => corpus.Count(c => c.Chunk.Terms.Contains(t)));
            var n = corpus.Count;

            return corpus
                .Select(c =>
                {
                    var score = 0.0;
                    foreach (var term in queryTerms)
                    {
                        var tf = c.Chunk.Terms.Count(x => x == term);
                        if (tf == 0) continue;
                        var idf = Math.Log(1 + (n - df[term] + 0.5) / (df[term] + 0.5));
                        score += idf * tf * (K1 + 1) / (tf + K1 * (1 - B + B * c.Chunk.Terms.Length / avgLength));
                    }
                    return new MaterialSnippet(c.Source.Title, c.Source.CourseName, c.Chunk.Text, score);
                })
                .Where(s => s.Score >= MinScore)
                .OrderByDescending(s => s.Score)
                .Take(take)
                .ToList();
        }

        /// <summary>Chunks of one material, cached until the file changes.</summary>
        private IReadOnlyList<Chunk> ChunksOf(ChatMaterialSourceDTO source)
        {
            var path = string.IsNullOrWhiteSpace(source.FilePath) ? null : _files.GetPhysicalPath(source.FilePath);
            var stamp = path != null ? File.GetLastWriteTimeUtc(path).Ticks : 0;
            var key = $"rag:{source.Id}:{stamp}";

            return _cache.GetOrCreate(key, entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(6);
                entry.Size = 1;

                // The title and description are always searchable, even when the file itself is not.
                var header = $"{source.Title}. {source.Description}".Trim();
                var body = string.Empty;
                if (path != null && MaterialTextExtractor.IsSupported(source.FileName))
                {
                    try
                    {
                        body = MaterialTextExtractor.Extract(path);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not read material {MaterialId} for retrieval", source.Id);
                    }
                }

                var chunks = new List<Chunk> { new(header, Tokenize(header)) };
                chunks.AddRange(Split(Normalize(body)).Select(text => new Chunk(text, Tokenize(text))));
                return chunks.Where(c => c.Terms.Length > 0).ToList();
            }) ?? [];
        }

        private static IEnumerable<string> Split(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                yield break;

            var start = 0;
            while (start < text.Length)
            {
                var end = Math.Min(text.Length, start + ChunkChars);
                // Prefer to break at a paragraph or sentence end so chunks stay readable.
                if (end < text.Length)
                {
                    var breakAt = text.LastIndexOf('\n', end - 1, end - start);
                    if (breakAt < start + ChunkChars / 2) breakAt = text.LastIndexOf(". ", end - 1, end - start, StringComparison.Ordinal);
                    if (breakAt > start + ChunkChars / 2) end = breakAt + 1;
                }

                var piece = text[start..end].Trim();
                if (piece.Length > 0) yield return piece;
                if (end >= text.Length) break;
                start = Math.Max(end - ChunkOverlap, start + 1);
            }
        }

        private static string Normalize(string text) => Whitespace().Replace(text.Replace("\r", ""), " ").Replace(" \n", "\n");

        /// <summary>
        /// Lower-cases with Azerbaijani rules and cuts words to a 6-letter stem, a cheap way to match
        /// agglutinated forms ("imtahan", "imtahanda", "imtahanın").
        /// </summary>
        private static string[] Tokenize(string text) =>
            NonWord().Split(text.ToLower(Az))
                .Where(t => t.Length >= 3 && !StopWords.Contains(t))
                .Select(t => t.Length > 6 ? t[..6] : t)
                .ToArray();

        [GeneratedRegex(@"[^\p{L}\p{Nd}]+")]
        private static partial Regex NonWord();

        [GeneratedRegex(@"[ \t\f\v]+")]
        private static partial Regex Whitespace();
    }
}
