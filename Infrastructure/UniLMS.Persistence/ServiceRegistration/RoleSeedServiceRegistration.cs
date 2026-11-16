using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Threading.Tasks;
using UniLMS.Domain.Entities; // AppRole-un yerləşdiyi namespace (lazım olarsa yoxla)

namespace UniLMS.Persistence.ServiceRegistration
{
    public static class RoleSeedServiceRegistration
    {
        public static async Task SeedRolesAsync(this IHost app)
        {
            using var scope = app.Services.CreateScope();

            
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<AppRole>>();

            string[] roleNames = { "Admin", "Teacher", "Student" };

            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new AppRole { Name = roleName });
                }
            }
        }
    }
}