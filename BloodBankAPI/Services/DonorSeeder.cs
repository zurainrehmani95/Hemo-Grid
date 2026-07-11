using System;
using System.Linq;
using BloodBankAPI.Models;

namespace BloodBankAPI.Services;

// Inserts a set of dummy donors covering every blood group (A+ .. O-) so the directory and the
// blood-group search have data to show out of the box. It's idempotent: each seed donor has a
// stable, unique email, and we skip any that already exist, so restarting the API won't create
// duplicates or trip the unique phone/email constraints.
public static class DonorSeeder
{
    // code, first, last, gender, age, phone, email, eligibility
    private static readonly (string Code, string First, string Last, string Gender, int Age, string Phone, string Email, string Eligibility)[] Seed =
    {
        ("A+",  "Hassan",  "Raza",     "Male",   28, "0300000001", "seed.aplus1@bloodbank.local",  "Eligible"),
        ("A+",  "Sana",    "Malik",    "Female", 24, "0300000002", "seed.aplus2@bloodbank.local",  "Eligible"),
        ("A-",  "Bilal",   "Ahmed",    "Male",   35, "0300000003", "seed.aminus1@bloodbank.local", "Eligible"),
        ("A-",  "Ayesha",  "Khan",     "Female", 29, "0300000004", "seed.aminus2@bloodbank.local", "Deferred_Temporary"),
        ("B+",  "Usman",   "Tariq",    "Male",   31, "0300000005", "seed.bplus1@bloodbank.local",  "Eligible"),
        ("B+",  "Hina",    "Shah",     "Female", 26, "0300000006", "seed.bplus2@bloodbank.local",  "Eligible"),
        ("B-",  "Kamran",  "Ali",      "Male",   40, "0300000007", "seed.bminus1@bloodbank.local", "Eligible"),
        ("B-",  "Nadia",   "Iqbal",    "Female", 33, "0300000008", "seed.bminus2@bloodbank.local", "Eligible"),
        ("AB+", "Faisal",  "Butt",     "Male",   45, "0300000009", "seed.abplus1@bloodbank.local", "Eligible"),
        ("AB+", "Mariam",  "Sheikh",   "Female", 22, "0300000010", "seed.abplus2@bloodbank.local", "Eligible"),
        ("AB-", "Zeeshan", "Qureshi",  "Male",   38, "0300000011", "seed.abminus1@bloodbank.local","Deferred_Temporary"),
        ("AB-", "Rabia",   "Aslam",    "Female", 27, "0300000012", "seed.abminus2@bloodbank.local","Eligible"),
        ("O+",  "Ahmed",   "Nawaz",    "Male",   30, "0300000013", "seed.oplus1@bloodbank.local",  "Eligible"),
        ("O+",  "Fatima",  "Zafar",    "Female", 25, "0300000014", "seed.oplus2@bloodbank.local",  "Eligible"),
        ("O-",  "Tariq",   "Mehmood",  "Male",   50, "0300000015", "seed.ominus1@bloodbank.local", "Eligible"),
        ("O-",  "Sadia",   "Yousaf",   "Female", 34, "0300000016", "seed.ominus2@bloodbank.local", "Eligible"),
    };

    public static void EnsureSeedDonors(BloodBankMsContext context)
    {
        // Map blood group code -> id so we can wire up the FK for each dummy donor.
        var groupIdByCode = context.BloodGroups
            .Where(g => g.Code != null)
            .ToDictionary(g => g.Code!, g => g.Id, StringComparer.OrdinalIgnoreCase);

        if (groupIdByCode.Count == 0)
        {
            return; // No blood groups configured yet; nothing we can attach donors to.
        }

        // Skip any seed rows already present (matched by their stable email) so this is safe to
        // run on every startup.
        var existingEmails = context.Donors.Select(d => d.Email).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var today = DateOnly.FromDateTime(DateTime.Today);
        var added = 0;

        foreach (var s in Seed)
        {
            if (existingEmails.Contains(s.Email)) continue;
            if (!groupIdByCode.TryGetValue(s.Code, out var bloodGroupId)) continue;

            context.Donors.Add(new Donor
            {
                FirstName = s.First,
                LastName = s.Last,
                Gender = s.Gender,
                Phone = s.Phone,
                Email = s.Email,
                Address = "Islamabad",
                BloodGroupId = bloodGroupId,
                DateOfBirth = today.AddYears(-s.Age),
                RegistrationDate = today,
                EligibilityStatus = s.Eligibility
            });
            added++;
        }

        if (added > 0)
        {
            context.SaveChanges();
        }
    }
}
