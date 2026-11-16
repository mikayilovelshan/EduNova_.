using AutoMapper;
using System;
using System.Collections.Generic;
using System.Text;
using UniLMS.Application.DTOs.Groups;
using UniLMS.Domain.Entities;

namespace UniLMS.Application.Mappings
{
    public class GroupMappingProfile : Profile
    {
        public GroupMappingProfile() 
        {
            CreateMap<CreateGroupDTO, Group>();

            CreateMap<UpdateGroupDTO, Group>();

            CreateMap<Student, GroupStudentDTO>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.AppUser.FirstName} {src.AppUser.LastName}"));

            CreateMap<Group, GetGroupDTO>()
                .ForMember(dest => dest.SpecialityId, opt => opt.MapFrom(src => src.SpecialityId))
                .ForMember(dest => dest.SpecialityName, opt => opt.MapFrom(src => src.Speciality.Name));
                
        }
    }
}
