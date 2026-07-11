using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace BloodBankAPI.Models;

public partial class Donor
{
    public uint Id { get; set; }

    // The table has no age column, so derive it from date_of_birth. [NotMapped] stops EF
    // from looking for a column.
    [NotMapped]
    public int Age
    {
        get
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            var years = today.Year - DateOfBirth.Year;
            if (DateOfBirth > today.AddYears(-years)) years--;
            return years < 0 ? 0 : years;
        }
    }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public byte BloodGroupId { get; set; }

    public string Gender { get; set; } = null!;

    public DateOnly DateOfBirth { get; set; }

    public string Phone { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Address { get; set; } = null!;

    public DateOnly RegistrationDate { get; set; }

    public DateOnly? LastDonationDate { get; set; }

    public string? EligibilityStatus { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual BloodGroup BloodGroup { get; set; } = null!;

    public virtual ICollection<Donation> Donations { get; set; } = new List<Donation>();
}
