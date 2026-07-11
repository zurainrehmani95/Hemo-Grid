using BCryptNet = BCrypt.Net.BCrypt;

namespace BloodBankAPI.Services;

// Hashes admin passwords with BCrypt (salted + deliberately slow), so the `password_hash`
// column can't be reversed with rainbow tables and is resistant to brute force. Both seeding
// and login go through the same methods, so stored and entered values line up.
public static class PasswordHasher
{
    public static string Hash(string plain) => BCryptNet.HashPassword(plain);

    public static bool Verify(string plain, string storedHash)
    {
        if (string.IsNullOrEmpty(storedHash)) return false;
        try
        {
            return BCryptNet.Verify(plain, storedHash);
        }
        catch
        {
            // A stored value that isn't a valid BCrypt hash (e.g. an old SHA-256 row) should
            // simply fail verification rather than throw.
            return false;
        }
    }
}
