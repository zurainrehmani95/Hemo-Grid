using System;
using System.Collections.Generic;

namespace BloodBankAPI.Models;

public partial class BloodScreening
{
    public uint Id { get; set; }

    public uint DonationId { get; set; }

    public string? HivStatus { get; set; }

    public string? HepBStatus { get; set; }

    public string? HepCStatus { get; set; }

    public string? SyphilisStatus { get; set; }

    public string? TechnicianNotes { get; set; }

    public DateTime ScreeningDate { get; set; }

    public virtual Donation Donation { get; set; } = null!;
}
