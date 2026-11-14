using System;
using System.Collections.Generic;
using System.Text;
using UniLMS.Domain.Entities.Common;

namespace UniLMS.Domain.Entities
{
    public class Cafedra : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public string Code { get; set; } = string.Empty;    

        public string? Description { get; set; }    

        public Guid FacultyId { get; set; }

        public Faculty Faculty { get; set; } = null!;    

        public ICollection<Speciality> Specialities { get; set; } = new List<Speciality>();

        public ICollection<Course> Courses { get; set; } = new List<Course>();

    }
}
