using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using UniLMS.Application.DTOs.Auth;
using UniLMS.Application.Interfaces.Services;
using UniLMS.Application.Utilities.Results;
using UniLMS.Domain.Entities;
using UniLMS.Persistence.Contexts;

namespace UniLMS.Persistence.Services
{
    public class AuthService(UserManager<AppUser> _userManager,
        ITokenService _tokenService,
        AppDbContext _context) : IAuthService
    {
        public async Task<IDataResult<TokenResponseDTO>> Login(LoginDTO model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return new ErrorDataResult<TokenResponseDTO>("Email və ya şifrə yanlışdır");

            var result = await _userManager.CheckPasswordAsync(user, model.Password);

            if (!result)
                return new ErrorDataResult<TokenResponseDTO>("Email və ya şifrə yanlışdır.");

            if (await IsDeactivatedAsync(user.Id))
                return new ErrorDataResult<TokenResponseDTO>("Hesabınız deaktiv edilib. Universitet administrasiyası ilə əlaqə saxlayın.");
            

            var accessToken = _tokenService.CreateAccessToken(user);

            var refreshToken = _tokenService.CreateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenEndDate = DateTime.UtcNow.AddDays(7);

            await _userManager.UpdateAsync(user);

            var dto = new TokenResponseDTO
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                AccessTokenExpiration = _tokenService.GetAccessTokenExpiration(),
            };

            return new SuccessDataResult<TokenResponseDTO>(dto);

        }

        public async Task<IDataResult<TokenResponseDTO>> RefreshToken(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
                return new ErrorDataResult<TokenResponseDTO>("Refresh token tələb olunur.");

            var user = await _userManager.Users.FirstOrDefaultAsync(x => x.RefreshToken == refreshToken);

            if (user == null)
                return new ErrorDataResult<TokenResponseDTO>("İstifadəçi tapılmadı");

            if (!user.RefreshTokenEndDate.HasValue || user.RefreshTokenEndDate.Value <= DateTime.UtcNow || await IsDeactivatedAsync(user.Id))
                return new ErrorDataResult<TokenResponseDTO>("Yenidən login olmalısız");

            var accessToken = _tokenService.CreateAccessToken(user);
            var dto = new TokenResponseDTO
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                AccessTokenExpiration = _tokenService.GetAccessTokenExpiration(),
            };

            return new SuccessDataResult<TokenResponseDTO>(dto);
        }

        public async Task<IResult> Register(RegisterDTO model)
        {
            var email = await _userManager.FindByEmailAsync(model.Email);

            if (email != null)
                return new ErrorResult("Bu emailə malik istifadəçi mövcuddur");

            var user = new AppUser
            {
                FirstName = model.Name,
                LastName = model.Surname,
                UserName = model.Email,
                Email = model.Email
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
                return new ErrorResult("Hesab yaradıla bilmədi: " + string.Join(" ", result.Errors.Select(e => e.Description)));

            var roleResult = await _userManager.AddToRoleAsync(user, "Admin");
            if (!roleResult.Succeeded)
            {
                await _userManager.DeleteAsync(user);
                return new ErrorResult("Admin rolu təyin edilə bilmədi.");
            }

            return new SuccessResult("Hesab uğurla yaradıldı");
        }
    
        /// <summary>A soft-deleted (deactivated) student or teacher must not be able to sign in.</summary>
        private async Task<bool> IsDeactivatedAsync(Guid appUserId)
            => await _context.Students.IgnoreQueryFilters().AnyAsync(x => x.AppUserId == appUserId && x.IsDeleted)
            || await _context.Teachers.IgnoreQueryFilters().AnyAsync(x => x.AppUserId == appUserId && x.IsDeleted);
    }
}
