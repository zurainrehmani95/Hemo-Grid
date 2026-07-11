using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BloodBankAPI.Dtos;
using BloodBankAPI.Models;
using BloodBankAPI.Services;

namespace BloodBankAPI.Controllers;

// ============================================================================
// UPDATE (the "U" in CRUD): editing an existing donor.
// Only handles PUT api/donors/{id}.
// ============================================================================
[ApiController]
[Authorize]
[Route("api/donors")]
public class DonorUpdateController : ControllerBase
{
    private readonly BloodBankMsContext _context;
    private readonly ILogger<DonorUpdateController> _logger;

    public DonorUpdateController(BloodBankMsContext context, ILogger<DonorUpdateController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // PUT: api/donors/{id}  ->  update the donor with this id
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDonor(int id, [FromBody] DonorFormInput input)
    {
        // The id in the URL must match the id in the body, otherwise we'd edit the wrong row.
        if (id != input.Id) return BadRequest("Target identifier tracking mismatch.");

        // Donor.Id is a uint. FindAsync won't coerce an int, so cast it or it throws.
        var donor = await _context.Set<Donor>().FindAsync((uint)id);
        if (donor == null) return NotFound();

        try
        {
            DonorWriteHelpers.ApplyEditableFields(donor, input);
            donor.BloodGroupId = await DonorWriteHelpers.ResolveBloodGroupIdAsync(_context, input.BloodGroup);
            DonorWriteHelpers.ApplyAgeAsBirthDate(donor, input.Age);

            // The entity is already tracked (we fetched it with FindAsync), so saving persists
            // the changes - no need to force EntityState.Modified.
            await _context.SaveChangesAsync();

            AuditLedger.Record(
                "PROFILE MODIFICATION",
                $"Administrative revision applied to Donor Tracking Index #{id}.",
                0.00m,
                "System");

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Donor update failed for id {DonorId}.", id);
            return StatusCode(500, "Could not update the donor. Please check the submitted details.");
        }
    }
}
