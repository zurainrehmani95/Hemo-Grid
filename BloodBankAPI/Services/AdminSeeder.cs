using BloodBankAPI.Models;

namespace BloodBankAPI.Services;

// Makes sure the admin login actually lives in MySQL (the `admins` table) rather than in a
// config file. On startup we check whether the configured admin username already exists; if
// not, we insert it with a hashed password. This is what moves the credentials into the
// database. The bootstrap values come from appsettings.json -> "AdminCredentials" so there is
// a single, obvious place to change the very first admin.
public static class AdminSeeder
{
    public static void EnsureSeedAdmin(BloodBankMsContext context, IConfiguration config)
    {
        var username = config["AdminCredentials:Username"] ?? "admin";
        var password = config["AdminCredentials:Password"] ?? "ghost230";
        var name = config["AdminCredentials:Name"] ?? "System Administrator";
        var email = config["AdminCredentials:Email"] ?? "admin@bloodbank.local";

        var existing = context.Admins.FirstOrDefault(a => a.Username == username);
        if (existing != null)
        {
            return; // Admin already stored in the database; leave their record untouched.
        }

        context.Admins.Add(new Admin
        {
            Username = username,
            PasswordHash = PasswordHasher.Hash(password),
            Name = name,
            Email = email
        });

        context.SaveChanges();
    }
}
