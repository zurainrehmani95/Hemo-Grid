using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Railway (and similar hosts) assign a dynamic PORT — bind to it so the container stays healthy.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

var connectionString = BloodBankAPI.Services.ConnectionStringResolver.Resolve(builder.Configuration);

// Explicit version instead of ServerVersion.AutoDetect, which connects at startup and would
// take the whole API down if MySQL happens to be unavailable. Change this if your server differs.
var serverVersion = new MySqlServerVersion(new Version(8, 0, 0));

builder.Services.AddDbContext<BloodBankAPI.Models.BloodBankMsContext>(options =>
    options.UseMySql(connectionString, serverVersion));

// Local dev: any localhost port. Production: origins listed in Cors:AllowedOrigins (comma-separated).
var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"]?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return false;
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;

                if (uri.Host is "localhost" or "127.0.0.1")
                    return true;

                // Vercel preview + production URLs change per deployment — allow the whole domain.
                if (uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase))
                    return true;

                return allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
            })
            .AllowAnyMethod()
            .AllowAnyHeader());
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddOpenApi();

// JWT bearer authentication. The API only trusts tokens signed with our secret ("Jwt:Key")
// and issued/consumed by us, so a client can't fake being logged in.
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key is not configured. On Railway, set Jwt__Key to a long random secret (32+ characters).");
builder.Services.AddScoped<BloodBankAPI.Services.JwtTokenService>();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();

// Throttle the login endpoint so passwords can't be brute-forced: max 5 attempts per minute
// per client IP.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

var app = builder.Build();

// Create tables + seed admin/donors on first run. Railway MySQL starts empty.
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<BloodBankAPI.Models.BloodBankMsContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        BloodBankAPI.Services.DatabaseBootstrap.EnsureReady(context, config, app.Logger);
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Database bootstrap failed (check MySQL connection string).");
    }
}

// Basic hardening headers on every response.
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    await next();
});

// Railway terminates HTTPS at the edge — trust forwarded headers before redirect logic.
app.UseForwardedHeaders();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// UseCors must run before auth/MapControllers.
app.UseCors("AllowReactApp");

app.UseRateLimiter();

// Authentication (who are you?) must come before authorization (are you allowed?).
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/health/config", (IConfiguration config) =>
    Results.Ok(BloodBankAPI.Services.ConnectionStringResolver.GetDiagnostics(config)));
app.MapGet("/api/health/db", async (BloodBankAPI.Models.BloodBankMsContext db, IConfiguration config) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        if (!canConnect)
        {
            var diag = BloodBankAPI.Services.ConnectionStringResolver.GetDiagnostics(config);
            return Results.Json(new
            {
                status = "fail",
                admins = 0,
                error = "Cannot reach MySQL.",
                diag
            });
        }

        var adminCount = await db.Admins.CountAsync();
        return Results.Ok(new { status = "ok", admins = adminCount });
    }
    catch (Exception ex)
    {
        return Results.Json(new { status = "fail", error = ex.Message }, statusCode: 503);
    }
});

app.Run();