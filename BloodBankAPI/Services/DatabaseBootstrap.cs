using BloodBankAPI.Models;

namespace BloodBankAPI.Services;

// Creates the MySQL schema on first run (Railway starts with an empty database) and seeds the
// blood group lookup rows donors depend on.
public static class DatabaseBootstrap
{
    private static readonly string[] BloodGroupCodes =
        ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    public static void EnsureReady(BloodBankMsContext context, IConfiguration config, ILogger logger)
    {
        context.Database.EnsureCreated();
        EnsureBloodGroups(context);
        AdminSeeder.EnsureSeedAdmin(context, config);
        DonorSeeder.EnsureSeedDonors(context);
        logger.LogInformation("Database bootstrap completed.");
    }

    private static void EnsureBloodGroups(BloodBankMsContext context)
    {
        if (context.BloodGroups.Any())
        {
            return;
        }

        byte id = 1;
        foreach (var code in BloodGroupCodes)
        {
            context.BloodGroups.Add(new BloodGroup { Id = id++, Code = code });
        }

        context.SaveChanges();
    }
}
