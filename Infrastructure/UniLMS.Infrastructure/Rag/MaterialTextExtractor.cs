using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using DocumentFormat.OpenXml.Packaging;
using UglyToad.PdfPig;

namespace UniLMS.Infrastructure.Rag
{
    /// <summary>Pulls plain text out of uploaded course materials (PDF, Word, PowerPoint and text-like files).</summary>
    public static partial class MaterialTextExtractor
    {
        /// <summary>Files larger than this are not read (keeps a single request fast).</summary>
        private const long MaxFileBytes = 30 * 1024 * 1024;

        /// <summary>Upper bound for the text kept per file.</summary>
        private const int MaxChars = 400_000;

        private static readonly HashSet<string> PlainText = new(StringComparer.OrdinalIgnoreCase)
        {
            ".txt", ".md", ".csv", ".json", ".xml", ".yml", ".yaml",
            ".cs", ".java", ".py", ".js", ".ts", ".sql", ".c", ".cpp", ".h", ".css"
        };

        public static bool IsSupported(string fileName)
        {
            var ext = Path.GetExtension(fileName);
            return PlainText.Contains(ext) || ext is ".pdf" or ".docx" or ".pptx" or ".html" or ".htm";
        }

        public static string Extract(string path)
        {
            var info = new FileInfo(path);
            if (!info.Exists || info.Length > MaxFileBytes)
                return string.Empty;

            var ext = info.Extension.ToLowerInvariant();
            var text = ext switch
            {
                ".pdf" => FromPdf(path),
                ".docx" => FromDocx(path),
                ".pptx" => FromPptx(path),
                ".html" or ".htm" => FromHtml(File.ReadAllText(path)),
                _ when PlainText.Contains(ext) => File.ReadAllText(path),
                _ => string.Empty
            };

            return text.Length > MaxChars ? text[..MaxChars] : text;
        }

        private static string FromPdf(string path)
        {
            var sb = new StringBuilder();
            using var doc = PdfDocument.Open(path);
            foreach (var page in doc.GetPages())
            {
                sb.AppendLine(page.Text);
                sb.AppendLine();
                if (sb.Length > MaxChars) break;
            }
            return sb.ToString();
        }

        private static string FromDocx(string path)
        {
            using var doc = WordprocessingDocument.Open(path, false);
            var body = doc.MainDocumentPart?.Document?.Body;
            if (body == null) return string.Empty;

            var sb = new StringBuilder();
            foreach (var p in body.Descendants<DocumentFormat.OpenXml.Wordprocessing.Paragraph>())
            {
                sb.AppendLine(p.InnerText);
                if (sb.Length > MaxChars) break;
            }
            return sb.ToString();
        }

        private static string FromPptx(string path)
        {
            using var doc = PresentationDocument.Open(path, false);
            var part = doc.PresentationPart;
            if (part?.Presentation?.SlideIdList == null) return string.Empty;

            var sb = new StringBuilder();
            var number = 0;
            foreach (var slideId in part.Presentation.SlideIdList.Elements<DocumentFormat.OpenXml.Presentation.SlideId>())
            {
                number++;
                if (slideId.RelationshipId?.Value is not { } relId || part.GetPartById(relId) is not SlidePart slide)
                    continue;

                sb.AppendLine($"Slayd {number}:");
                foreach (var p in slide.Slide.Descendants<DocumentFormat.OpenXml.Drawing.Paragraph>())
                    sb.AppendLine(p.InnerText);
                sb.AppendLine();
                if (sb.Length > MaxChars) break;
            }
            return sb.ToString();
        }

        private static string FromHtml(string html)
        {
            var noScripts = ScriptOrStyle().Replace(html, " ");
            var noTags = Tag().Replace(noScripts, "\n");
            return WebUtility.HtmlDecode(noTags);
        }

        [GeneratedRegex(@"<(script|style)[^>]*>[\s\S]*?</\1>", RegexOptions.IgnoreCase)]
        private static partial Regex ScriptOrStyle();

        [GeneratedRegex("<[^>]+>")]
        private static partial Regex Tag();
    }
}
