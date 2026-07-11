using BloodBankAPI.Models;

namespace BloodBankAPI.Services;

// Converts a Donor entity into the flat object the frontend table/form expects.
// This keeps every controller returning donors in exactly the same shape (blood group as
// its code string, plus the computed age) and avoids serializing the whole navigation graph.
public static class DonorMapper
{
    public static object ToApiShape(Donor d) => new
    {
        id = d.Id,
        firstName = d.FirstName,
        lastName = d.LastName,
        age = d.Age,
        gender = d.Gender,
        phone = d.Phone,
        email = d.Email,
        bloodGroup = d.BloodGroup != null ? d.BloodGroup.Code : null,
        eligibilityStatus = d.EligibilityStatus
    };
}
