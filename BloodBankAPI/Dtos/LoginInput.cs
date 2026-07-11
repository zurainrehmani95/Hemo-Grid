using System.ComponentModel.DataAnnotations;

namespace BloodBankAPI.Dtos;

// The shape the React login form sends up as JSON. Kept separate from any entity so the
// frontend only ever deals with a plain username/password pair.
public class LoginInput
{
    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Username { get; set; } = "";

    [Required]
    [StringLength(255, MinimumLength = 1)]
    public string Password { get; set; } = "";
}
