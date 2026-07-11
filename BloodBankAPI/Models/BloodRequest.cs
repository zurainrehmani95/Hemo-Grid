using System;
using System.Collections.Generic;

namespace BloodBankAPI.Models;

public partial class BloodRequest
{
    public uint Id { get; set; }

    public uint PatientId { get; set; }

    public byte BloodGroupId { get; set; }

    public uint UnitsRequested { get; set; }

    public DateTime RequestDate { get; set; }

    public string? Status { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual BloodGroup BloodGroup { get; set; } = null!;

    public virtual ICollection<Donation> Donations { get; set; } = new List<Donation>();

    public virtual Patient Patient { get; set; } = null!;
}
