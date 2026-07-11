using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BloodBankAPI.Models;
using BloodBankAPI.Services;

namespace BloodBankAPI.Controllers;

// ============================================================================
// DELETE (the "D" in CRUD): removing a donor.
// Only handles DELETE api/donors/{id}.
// ============================================================================
[ApiController]
[Authorize]
[Route("api/donors")]
public class DonorDeleteController : ControllerBase
{
    private readonly BloodBankMsContext _context;
    private readonly ILogger<DonorDeleteController> _logger;

    public DonorDeleteController(BloodBankMsContext context, ILogger<DonorDeleteController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // DELETE: api/donors/{id}  ->  delete this donor (and its dependent rows if required)
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDonor(int id)
    {
        // Cast to uint to match the key type (same reason as the update controller).
        var donor = await _context.Set<Donor>().FindAsync((uint)id);
        if (donor == null) return NotFound();

        try
        {
            var savedName = $"{donor.FirstName} {donor.LastName}";

            try
            {
                // Happy path: no related rows, so the donor deletes straight away.
                _context.Set<Donor>().Remove(donor);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // The donor is referenced by donation rows, so MySQL rejected the delete.
                // Remove the dependent rows first, then delete the donor.
                var linkedDonations = await _context.Set<Donation>()
                    .Where(d => d.DonorId == donor.Id)
                    .ToListAsync();

                if (linkedDonations.Count > 0)
                {
                    var donationIds = linkedDonations.Select(d => d.Id).ToList();

                    // Screenings reference donations, so they have to go too.
                    var linkedScreenings = await _context.Set<BloodScreening>()
                        .Where(s => donationIds.Contains(s.DonationId))
                        .ToListAsync();

                    _context.Set<BloodScreening>().RemoveRange(linkedScreenings);
                    _context.Set<Donation>().RemoveRange(linkedDonations);
                }

                _context.Set<Donor>().Remove(donor);
                await _context.SaveChangesAsync();
            }

            AuditLedger.Record(
                "RECORD PURGE",
                $"Permanently dropped file indexing for donor: {savedName}.",
                -450.00m,
                "Financial");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Donor delete failed for id {DonorId}.", id);
            return StatusCode(500, "Could not delete the donor record.");
        }
    }
}
