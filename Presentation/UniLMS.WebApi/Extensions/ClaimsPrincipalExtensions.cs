using System.Security.Claims;

namespace UniLMS.WebApi.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static bool TryGetAppUserId(this ClaimsPrincipal user, out Guid appUserId)
            => Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out appUserId);

        /// <summary>Returns the user id when the user is in <paramref name="role"/>, otherwise null (used to scope queries).</summary>
        public static Guid? AppUserIdIfInRole(this ClaimsPrincipal user, string role)
        {
            if (!user.IsInRole(role))
                return null;

            return user.TryGetAppUserId(out var id) ? id : Guid.Empty;
        }
    }
}
