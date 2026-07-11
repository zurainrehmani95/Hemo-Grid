using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BloodBankAPI.Dtos;
using BloodBankAPI.Models;

namespace BloodBankAPI.Services;

// Shared write logic used by BOTH the create and update controllers, so the two stay in sync.
// If the way we map a form onto a Donor ever changes, we only change it here.
public static class DonorWriteHelpers
{
    // Look up the blood_groups row whose code matches the requested value (e.g. "A+") and
    // return its id. Falls back to the first group if nothing matches.
    public static async Task<byte> ResolveBloodGroupIdAsync(BloodBankMsContext context, string bloodGroupCode)
    {
        var groups = await context.Set<BloodGroup>().ToListAsync();

        var match = groups.FirstOrDefault(g =>
            g.Code != null && g.Code.Equals(bloodGroupCode, StringComparison.OrdinalIgnoreCase));

        if (match != null) return match.Id;
        return groups.FirstOrDefault()?.Id ?? (byte)1;
    }

    // Copy the editable text fields from the form onto the entity.
    public static void ApplyEditableFields(Donor donor, DonorFormInput input)
    {
        donor.FirstName = input.FirstName;
        donor.LastName = input.LastName;
        donor.Gender = input.Gender;
        donor.Phone = input.Phone;
        donor.Email = input.Email;
        donor.EligibilityStatus = input.EligibilityStatus;
    }

    // There is no age column, so translate the entered age into a date_of_birth. Invalid or
    // empty values are simply ignored (the existing birth date is left untouched).
    public static void ApplyAgeAsBirthDate(Donor donor, string? age)
    {
        if (int.TryParse(age, out var years) && years > 0 && years < 120)
        {
            donor.DateOfBirth = DateOnly.FromDateTime(DateTime.Today.AddYears(-years));
        }
    }
}
