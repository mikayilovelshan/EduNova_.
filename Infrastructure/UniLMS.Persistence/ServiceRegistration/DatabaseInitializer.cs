using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using UniLMS.Domain.Entities;
using UniLMS.Domain.Enums;
using UniLMS.Persistence.Contexts;

namespace UniLMS.Persistence.ServiceRegistration
{
    /// <summary>
    /// Brings the database to a usable state on startup:
    /// 1. applies pending EF migrations (Database:AutoMigrate, default true),
    /// 2. seeds the Admin/Teacher/Student roles,
    /// 3. creates the first administrator from Seed:Admin when no administrator exists (otherwise nobody could ever manage the system),
    /// 4. repairs accounts that have a student/teacher profile but are missing the matching role,
    /// 5. optionally (Seed:DemoData, Development only) seeds a realistic demo faculty when there are no students yet.
    /// </summary>
    public static class DatabaseInitializer
    {
        public static async Task InitializeDatabaseAsync(this IHost app)
        {
            using var scope = app.Services.CreateScope();
            var services = scope.ServiceProvider;
            var config = services.GetRequiredService<IConfiguration>();
            var env = services.GetRequiredService<IHostEnvironment>();
            var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseInitializer");
            var context = services.GetRequiredService<AppDbContext>();

            if (config.GetValue("Database:AutoMigrate", true))
                await context.Database.MigrateAsync();

            await app.SeedRolesAsync();

            var userManager = services.GetRequiredService<UserManager<AppUser>>();

            await EnsureAdminAsync(userManager, config, logger);
            await RepairMissingRolesAsync(context, userManager);

            if (env.IsDevelopment() && config.GetValue("Seed:DemoData", false) && !await context.Students.IgnoreQueryFilters().AnyAsync())
            {
                logger.LogInformation("Seeding demo data...");
                await DemoDataSeeder.SeedAsync(context, userManager, services.GetRequiredService<IWebHostEnvironment>());
                logger.LogInformation("Demo data seeded.");
            }
        }

        private static async Task EnsureAdminAsync(UserManager<AppUser> userManager, IConfiguration config, ILogger logger)
        {
            if ((await userManager.GetUsersInRoleAsync("Admin")).Any())
                return;

            var email = config["Seed:Admin:Email"];
            var password = config["Seed:Admin:Password"];
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                logger.LogWarning("No administrator exists. Configure Seed:Admin:Email and Seed:Admin:Password to create one.");
                return;
            }

            var admin = await userManager.FindByEmailAsync(email);
            if (admin == null)
            {
                admin = new AppUser
                {
                    Email = email,
                    UserName = email,
                    FirstName = config["Seed:Admin:FirstName"] ?? "Sistem",
                    LastName = config["Seed:Admin:LastName"] ?? "Administratoru",
                    EmailConfirmed = true
                };

                var created = await userManager.CreateAsync(admin, password);
                if (!created.Succeeded)
                {
                    logger.LogError("Could not create the administrator: {Errors}", string.Join("; ", created.Errors.Select(e => e.Description)));
                    return;
                }
            }

            await userManager.AddToRoleAsync(admin, "Admin");
            logger.LogInformation("Administrator {Email} is ready.", email);
        }

        private static async Task RepairMissingRolesAsync(AppDbContext context, UserManager<AppUser> userManager)
        {
            var teacherUserIds = await context.Teachers.Select(x => x.AppUserId).ToListAsync();
            var studentUserIds = await context.Students.Select(x => x.AppUserId).ToListAsync();

            foreach (var (ids, role) in new[] { (teacherUserIds, "Teacher"), (studentUserIds, "Student") })
            {
                foreach (var id in ids)
                {
                    var user = await userManager.FindByIdAsync(id.ToString());
                    if (user != null && !await userManager.IsInRoleAsync(user, role))
                        await userManager.AddToRoleAsync(user, role);
                }
            }
        }
    }

    internal static class DemoDataSeeder
    {
        private const string TeacherPassword = "Teacher123!";
        private const string StudentPassword = "Student123!";

        public static async Task SeedAsync(AppDbContext context, UserManager<AppUser> userManager, IWebHostEnvironment env)
        {
            var random = new Random(2026);
            var today = DateTime.Today;

            // ---- Academic structure -------------------------------------------------------------
            var faculty = await context.Faculties.FirstOrDefaultAsync(x => x.Code == "FITM")
                ?? context.Faculties.Add(new Faculty
                {
                    Name = "İnformasiya Texnologiyaları və İdarəetmə",
                    Code = "FITM",
                    Description = "Proqram təminatı, verilənlər elmi və informasiya sistemləri üzrə kadr hazırlığı.",
                    Cafedras = new List<Cafedra>(),
                    Specialities = new List<Speciality>()
                }).Entity;

            var csCafedra = new Cafedra { Name = "Kompüter Elmləri", Code = "KE-01", Description = "Alqoritmlər, proqramlaşdırma və sistemlər.", Faculty = faculty };
            var mathCafedra = new Cafedra { Name = "Tətbiqi Riyaziyyat", Code = "TR-01", Description = "Riyazi analiz, xətti cəbr və statistika.", Faculty = faculty };
            context.Cafedras.AddRange(csCafedra, mathCafedra);

            var courses = new[]
            {
                new Course { Name = "Alqoritmlər və verilənlər strukturları", Code = "CS201", Description = "Sıralama, axtarış, ağaclar, qraflar və mürəkkəblik analizi.", Cafedra = csCafedra },
                new Course { Name = "Verilənlər bazası sistemləri", Code = "CS205", Description = "Relyasiya modeli, SQL, normallaşdırma və tranzaksiyalar.", Cafedra = csCafedra },
                new Course { Name = "Veb proqramlaşdırma", Code = "CS210", Description = "HTML, CSS, JavaScript, React və REST API-lər.", Cafedra = csCafedra },
                new Course { Name = "Xətti cəbr", Code = "MATH110", Description = "Matrislər, determinantlar, vektor fəzaları və xətti çevirmələr.", Cafedra = mathCafedra },
                new Course { Name = "Əməliyyat sistemləri", Code = "CS220", Description = "Proseslər, yaddaş idarəetməsi, fayl sistemləri.", Cafedra = csCafedra },
            };
            context.Courses.AddRange(courses);

            var speciality = new Speciality
            {
                Name = "Kompüter elmləri",
                Code = "050509",
                Description = "Bakalavr pilləsi üzrə kompüter elmləri ixtisası.",
                Degree = SpecialityDegree.Bachelor,
                Faculty = faculty,
                Cafedra = csCafedra,
                Courses = courses.ToList()
            };
            context.Specialities.Add(speciality);

            var group = new Group { Code = "KE-24A", Speciality = speciality, Students = new List<Student>() };
            context.Groups.Add(group);

            var semester = await context.Semesters.FirstOrDefaultAsync(x => x.IsActive);
            if (semester == null)
            {
                semester = new Semester
                {
                    Name = "2026/2027 Payız semestri",
                    StartDate = new DateTime(today.Year, 9, 15),
                    EndDate = new DateTime(today.Year + 1, 1, 25),
                    IsActive = true
                };
                context.Semesters.Add(semester);
            }

            await context.SaveChangesAsync();

            // ---- People ----------------------------------------------------------------------
            var teacherSeeds = new[]
            {
                ("teacher@unilms.az", "Rəşad", "Məmmədov", "Dosent, t.ü.f.d.", csCafedra),
                ("l.huseynova@unilms.az", "Leyla", "Hüseynova", "Professor, t.e.d.", csCafedra),
                ("e.quliyev@unilms.az", "Elvin", "Quliyev", "Baş müəllim, f.-r.ü.f.d.", mathCafedra),
            };

            var teachers = new List<Teacher>();
            foreach (var (email, first, last, degree, cafedra) in teacherSeeds)
            {
                var user = await CreateUserAsync(userManager, email, first, last, TeacherPassword, "Teacher");
                var teacher = new Teacher { AppUserId = user.Id, ScientificDegree = degree, CafedraId = cafedra.Id };
                context.Teachers.Add(teacher);
                teachers.Add(teacher);
            }

            var studentSeeds = new[]
            {
                ("student@unilms.az", "Aysel", "Əliyeva"),
                ("murad.hasanov@unilms.az", "Murad", "Həsənov"),
                ("nigar.babayeva@unilms.az", "Nigar", "Babayeva"),
                ("tural.ismayilov@unilms.az", "Tural", "İsmayılov"),
                ("gunel.rzayeva@unilms.az", "Günel", "Rzayeva"),
                ("kamran.nasirov@unilms.az", "Kamran", "Nəsirov"),
                ("sabina.kerimova@unilms.az", "Səbinə", "Kərimova"),
                ("orxan.abbasov@unilms.az", "Orxan", "Abbasov"),
            };

            var students = new List<Student>();
            var number = 1;
            foreach (var (email, first, last) in studentSeeds)
            {
                var user = await CreateUserAsync(userManager, email, first, last, StudentPassword, "Student");
                var student = new Student
                {
                    AppUserId = user.Id,
                    StudentNumber = $"24KE{number++:000}",
                    GPA = Math.Round(70 + (decimal)random.NextDouble() * 25, 1),
                    GroupId = group.Id
                };
                context.Students.Add(student);
                students.Add(student);
            }

            await context.SaveChangesAsync();

            // ---- Teaching: offerings and weekly timetable ------------------------------------
            var plan = new[]
            {
                (Course: courses[0], Teacher: teachers[0], Room: "301", Slots: new[] { (DayOfWeek.Monday, 9, 0), (DayOfWeek.Wednesday, 10, 30) }),
                (Course: courses[1], Teacher: teachers[1], Room: "Lab-2", Slots: new[] { (DayOfWeek.Tuesday, 9, 0), (DayOfWeek.Thursday, 12, 0) }),
                (Course: courses[2], Teacher: teachers[0], Room: "Lab-1", Slots: new[] { (DayOfWeek.Monday, 12, 0), (DayOfWeek.Friday, 9, 0) }),
                (Course: courses[3], Teacher: teachers[2], Room: "214", Slots: new[] { (DayOfWeek.Tuesday, 10, 30), (DayOfWeek.Thursday, 9, 0) }),
                (Course: courses[4], Teacher: teachers[1], Room: "305", Slots: new[] { (DayOfWeek.Wednesday, 9, 0), (DayOfWeek.Friday, 10, 30) }),
            };

            var offerings = new List<CourseOffering>();
            var schedules = new List<CourseSchedule>();
            foreach (var item in plan)
            {
                var offering = new CourseOffering
                {
                    CourseId = item.Course.Id,
                    TeacherId = item.Teacher.Id,
                    GroupId = group.Id,
                    SemesterId = semester.Id,
                    RoomCode = item.Room,
                    CourseSchedules = new List<CourseSchedule>()
                };
                context.CourseOfferings.Add(offering);
                offerings.Add(offering);

                foreach (var (day, hour, minute) in item.Slots)
                {
                    var start = new TimeSpan(hour, minute, 0);
                    var schedule = new CourseSchedule { CourseOffering = offering, DayOfWeek = day, StartTime = start, EndTime = start.Add(TimeSpan.FromMinutes(80)) };
                    context.CourseSchedules.Add(schedule);
                    schedules.Add(schedule);
                }
            }

            await context.SaveChangesAsync();

            // ---- Attendance for the past eight weeks -----------------------------------------
            var from = today.AddDays(-56);
            foreach (var schedule in schedules)
            {
                for (var date = from; date < today; date = date.AddDays(1))
                {
                    if (date.DayOfWeek != schedule.DayOfWeek)
                        continue;

                    foreach (var student in students)
                    {
                        var present = random.NextDouble() < 0.87;
                        context.Attendances.Add(new Attendance
                        {
                            StudentId = student.Id,
                            CourseScheduleId = schedule.Id,
                            Date = date,
                            IsPresent = present,
                            Note = present ? null : (random.NextDouble() < 0.4 ? "Üzrlü səbəb (arayış)" : null)
                        });
                    }
                }
            }

            // ---- Exam results so far this semester -------------------------------------------
            var assessments = new[]
            {
                (Type: ExamType.Colloquium1, Date: today.AddDays(-35)),
                (Type: ExamType.DailyGrade, Date: today.AddDays(-14)),
                (Type: ExamType.Colloquium2, Date: today.AddDays(-7)),
            };

            foreach (var offering in offerings)
            {
                foreach (var (type, date) in assessments)
                {
                    foreach (var student in students)
                        context.ExamResults.Add(new ExamResult { StudentId = student.Id, CourseOfferingId = offering.Id, ExamType = type, EvaluationDate = date, Score = random.Next(5, 11) });
                }

                if (offering.CourseId == courses[0].Id || offering.CourseId == courses[1].Id)
                {
                    foreach (var student in students)
                        context.ExamResults.Add(new ExamResult { StudentId = student.Id, CourseOfferingId = offering.Id, ExamType = ExamType.IndependentWork, EvaluationDate = today.AddDays(-3), Score = random.Next(6, 11) });
                }
            }

            // ---- A few course materials ------------------------------------------------------
            var materials = new[]
            {
                (Course: courses[0], Title: "Mühazirə 1 — Alqoritmlərin mürəkkəbliyi", File: "muhazire-1-murekkeblik.md", Body: "# Alqoritmlərin mürəkkəbliyi\n\n- Big-O, Big-Θ, Big-Ω\n- Ən pis, orta və ən yaxşı hal\n- Nümunə: ikili axtarış O(log n)\n"),
                (Course: courses[1], Title: "SQL praktikumu — JOIN növləri", File: "sql-join-praktikum.md", Body: "# JOIN növləri\n\n```sql\nSELECT s.Name, g.Code\nFROM Students s\nINNER JOIN Groups g ON g.Id = s.GroupId;\n```\n"),
                (Course: courses[2], Title: "Laboratoriya işi 2 — REST API", File: "lab-2-rest-api.txt", Body: "Laboratoriya işi 2\n\nTapşırıq: tələbələr üçün CRUD REST API hazırlayın (GET, POST, PUT, DELETE).\nTəhvil müddəti: 2 həftə.\n"),
                (Course: courses[3], Title: "Xətti cəbr — məsələlər toplusu", File: "xetti-cebr-meseleler.txt", Body: "1. A matrisinin determinantını tapın.\n2. Tərs matrisi hesablayın.\n3. Xətti tənliklər sistemini Kramer üsulu ilə həll edin.\n"),
            };

            var uploads = Path.Combine(string.IsNullOrWhiteSpace(env.WebRootPath) ? Path.Combine(env.ContentRootPath, "wwwroot") : env.WebRootPath, "uploads", "materials");
            Directory.CreateDirectory(uploads);

            foreach (var m in materials)
            {
                var stored = $"{Guid.NewGuid()}{Path.GetExtension(m.File)}";
                await File.WriteAllTextAsync(Path.Combine(uploads, stored), m.Body);
                context.CourseMaterials.Add(new CourseMaterial
                {
                    Title = m.Title,
                    Description = m.Course.Name + " fənni üzrə material",
                    CourseId = m.Course.Id,
                    FileName = m.File,
                    FilePath = $"uploads/materials/{stored}"
                });
            }

            await context.SaveChangesAsync();
        }

        private static async Task<AppUser> CreateUserAsync(UserManager<AppUser> userManager, string email, string first, string last, string password, string role)
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user == null)
            {
                user = new AppUser { Email = email, UserName = email, FirstName = first, LastName = last, EmailConfirmed = true };
                var result = await userManager.CreateAsync(user, password);
                if (!result.Succeeded)
                    throw new InvalidOperationException($"Demo user {email} could not be created: {string.Join("; ", result.Errors.Select(e => e.Description))}");
            }

            if (!await userManager.IsInRoleAsync(user, role))
                await userManager.AddToRoleAsync(user, role);

            return user;
        }
    }
}
