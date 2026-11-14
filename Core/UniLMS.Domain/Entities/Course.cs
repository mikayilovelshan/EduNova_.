using System;
using System.Collections.Generic;
using System.Text;
using UniLMS.Domain.Entities.Common;

namespace UniLMS.Domain.Entities
{
    public class Course : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public string Code { get; set; } = string.Empty;

        public string? Description { get; set; }

        public Guid CafedraId { get; set; }

        public Cafedra Cafedra { get; set; } = null!;

        public ICollection<Speciality> Specialities { get; set; } = new List<Speciality>();
    }
}
