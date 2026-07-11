using System.ComponentModel.DataAnnotations;

namespace BloodBankAPI.Dtos;

// This is the exact shape the React form sends up as JSON. It is deliberately kept separate
// from the EF Core "Donor" entity so the frontend can speak in simple values (a blood-group
// code like "A+", age as plain text) while the entity/database keep their own structure.
public class DonorFormInput
{
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string FirstName { get; set; } = "";

    [Required]
    [StringLength(50)]
    public string LastName { get; set; } = "";

    // Age is a string (not an int) because the number <input> can arrive empty, and there is
    // no age column in the database - the server converts it into a date_of_birth.
    public string? Age { get; set; }

    [Required]
    public string Gender { get; set; } = "Male";

    [Required]
    [Phone]
    [StringLength(20)]
    public string Phone { get; set; } = "";

    [Required]
    [EmailAddress]
    [StringLength(100)]
    public string Email { get; set; } = "";

    [Required]
    [StringLength(3)]
    public string BloodGroup { get; set; } = "A+";

    public string EligibilityStatus { get; set; } = "Eligible";
}
