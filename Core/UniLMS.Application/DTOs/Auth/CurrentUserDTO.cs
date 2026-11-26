namespace UniLMS.Application.DTOs.Auth
{
    public class CurrentUserDTO
    {
        public Guid Id { get; set; }
        public string? Email { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public IList<string> Roles { get; set; } = new List<string>();

        public Guid? StudentId { get; set; }
        public string? StudentNumber { get; set; }
        public decimal? GPA { get; set; }
        public Guid? GroupId { get; set; }
        public string? GroupCode { get; set; }
        public string? SpecialityName { get; set; }

        public Guid? TeacherId { get; set; }
        public string? ScientificDegree { get; set; }
        public string? CafedraName { get; set; }
    }
}
