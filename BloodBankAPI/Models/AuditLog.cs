using System;
using System.Collections.Generic;

namespace BloodBankAPI.Models;

public partial class AuditLog
{
    public ulong Id { get; set; }

    public uint AdminId { get; set; }

    public string ActionPerformed { get; set; } = null!;

    public string TableAffected { get; set; } = null!;

    public uint? RecordId { get; set; }

    public string IpAddress { get; set; } = null!;

    public DateTime? Timestamp { get; set; }

    public virtual Admin Admin { get; set; } = null!;
}
