using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BloodBankAPI.Dtos;
using BloodBankAPI.Models;
using BloodBankAPI.Services;

namespace BloodBankAPI.Controllers;

// ============================================================================
// CREATE (the "C" in CRUD): adding a brand new donor.
// Only handles POST api/donors.
// ============================================================================
[ApiController]
[Authorize]
[Route("api/donors")]
public class DonorCreateController : ControllerBase
{
    private readonly BloodBankMsContext _context;
    private readonly ILogger<DonorCreateController> _logger;

    public DonorCreateController(BloodBankMsContext context, ILogger<DonorCreateController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // POST: api/donors  ->  insert a new donor row
    [HttpPost]
    public async Task<ActionResult> AddDonor([FromBody] DonorFormInput input)
    {
        try
        {
            // Start from a fresh entity with the columns the schema requires.
            var donor = new Donor
            {
                Address = "Islamabad",                                   // address is NOT NULL in the DB
                DateOfBirth = new DateOnly(2000, 1, 1),                  // placeholder, replaced by the age below
                RegistrationDate = DateOnly.FromDateTime(DateTime.Today),
                BloodGroupId = await DonorWriteHelpers.ResolveBloodGroupIdAsync(_context, input.BloodGroup)
            };

            // Copy the form fields and turn the entered age into a birth date.
            DonorWriteHelpers.ApplyEditableFields(donor, input);
            DonorWriteHelpers.ApplyAgeAsBirthDate(donor, input.Age);

            _context.Set<Donor>().Add(donor);
            await _context.SaveChangesAsync();

            // Log the create in the shared ledger.
            AuditLedger.Record(
                "DONOR REGISTRATION",
                $"Successfully onboarded donor profile: {input.FirstName} {input.LastName}.",
                1500.00m,
                "Financial");

            return Ok(DonorMapper.ToApiShape(donor));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Donor creation failed.");
            return StatusCode(500, "Could not save the new donor. Please check the submitted details.");
        }
    }
}
