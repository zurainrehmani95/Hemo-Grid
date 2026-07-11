using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BloodBankAPI.Dtos;
using BloodBankAPI.Models;
using BloodBankAPI.Services;

namespace BloodBankAPI.Controllers;

// ============================================================================
// READ (the "R" in CRUD): listing donors, searching, and reading the ledger.
//
// All four donor controllers use the SAME route: "api/donors". That is allowed
// because each controller handles a different HTTP verb, so the combinations
// (GET api/donors, POST api/donors, PUT api/donors/{id}, DELETE api/donors/{id})
// never clash. This file owns every GET.
// ============================================================================
[ApiController]
[Authorize]
[Route("api/donors")]
public class DonorsReadController : ControllerBase
{
    private readonly BloodBankMsContext _context;
    private readonly ILogger<DonorsReadController> _logger;

    public DonorsReadController(BloodBankMsContext context, ILogger<DonorsReadController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/donors  ->  return every donor
    [HttpGet]
    public async Task<ActionResult> GetDonors()
    {
        try
        {
            var donors = await _context.Set<Donor>()
                .Include(d => d.BloodGroup) // load the group so we can send its code string
                .ToListAsync();

            return Ok(donors.Select(DonorMapper.ToApiShape));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Internal directory query failed.");
            return StatusCode(500, "Internal directory query failed.");
        }
    }

    // GET: api/donors/search?bloodGroup=A+  ->  donors filtered by blood group
    [HttpGet("search")]
    public async Task<ActionResult> SearchByBloodGroup([FromQuery] string bloodGroup)
    {
        try
        {
            var donors = await _context.Set<Donor>()
                .Include(d => d.BloodGroup)
                .ToListAsync();

            // No filter provided -> return everything.
            if (!string.IsNullOrEmpty(bloodGroup))
            {
                donors = donors
                    .Where(d => d.BloodGroup != null
                        && !string.IsNullOrEmpty(d.BloodGroup.Code)
                        && d.BloodGroup.Code.Equals(bloodGroup, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            return Ok(donors.Select(DonorMapper.ToApiShape));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Directory search failed.");
            return StatusCode(500, "Directory search failed.");
        }
    }

    // GET: api/donors/audit-trail  ->  the in-memory cash-flow ledger
    [HttpGet("audit-trail")]
    public ActionResult<IEnumerable<AuditLogEntry>> GetAuditTrail()
    {
        return Ok(AuditLedger.Snapshot());
    }
}
