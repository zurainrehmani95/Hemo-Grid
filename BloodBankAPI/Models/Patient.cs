using System;
using System.Collections.Generic;

namespace BloodBankAPI.Models;

public partial class Patient
{
    public uint Id { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public byte BloodGroupId { get; set; }

    public uint HospitalId { get; set; }

    public string TreatingDoctor { get; set; } = null!;

    public string ContactNumber { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual BloodGroup BloodGroup { get; set; } = null!;

    public virtual ICollection<BloodRequest> BloodRequests { get; set; } = new List<BloodRequest>();

    public virtual Hospital Hospital { get; set; } = null!;
}
