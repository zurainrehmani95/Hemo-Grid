using System;
using System.Collections.Generic;

namespace BloodBankAPI.Models;

public partial class BloodInventory
{
    public byte BloodGroupId { get; set; }

    public uint UnitsAvailable { get; set; }

    public DateTime? LastUpdated { get; set; }

    public virtual BloodGroup BloodGroup { get; set; } = null!;
}
