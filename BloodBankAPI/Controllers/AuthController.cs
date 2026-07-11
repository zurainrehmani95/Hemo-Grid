using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using BloodBankAPI.Dtos;
using BloodBankAPI.Models;
using BloodBankAPI.Services;

namespace BloodBankAPI.Controllers;

// ============================================================================
// AUTH: validates the admin login against the MySQL `admins` table and, on
// success, issues a signed JWT the frontend must send on every protected call.
// The username + password live in the database (hashed with BCrypt), never in
// the React app or in config at runtime.
// ============================================================================
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly BloodBankMsContext _context;
    private readonly JwtTokenService _tokens;
    private readonly ILogger<AuthController> _logger;

    public AuthController(BloodBankMsContext context, JwtTokenService tokens, ILogger<AuthController> logger)
    {
        _context = context;
        _tokens = tokens;
        _logger = logger;
    }

    // POST: api/auth/login  ->  200 { token, name, username } on success, 401 on bad credentials
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<ActionResult> Login([FromBody] LoginInput input)
    {
        if (input is null || string.IsNullOrWhiteSpace(input.Username) || string.IsNullOrWhiteSpace(input.Password))
        {
            return BadRequest("Username and password are required.");
        }

        try
        {
            var admin = await _context.Admins
                .FirstOrDefaultAsync(a => a.Username == input.Username);

            if (admin == null || !PasswordHasher.Verify(input.Password, admin.PasswordHash))
            {
                AuditLedger.Record(
                    "AUTH FAILURE",
                    $"Rejected login attempt for user '{input.Username}'.",
                    0.00m,
                    "Security");
                return Unauthorized("Invalid administrative credentials.");
            }

            AuditLedger.Record(
                "AUTH SUCCESS",
                $"Administrator '{admin.Name}' authenticated.",
                0.00m,
                "Security");

            var token = _tokens.CreateToken(admin);

            // The name comes from the database row, so the frontend session shows the real admin.
            return Ok(new
            {
                success = true,
                token,
                username = admin.Username,
                name = admin.Name
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Authentication lookup failed.");
            return StatusCode(500, "Authentication service is temporarily unavailable.");
        }
    }
}
