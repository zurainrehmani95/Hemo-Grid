using System;
using System.Collections.Generic;

namespace BloodBankAPI.Models;

public partial class Donation
{
    public uint Id { get; set; }

    public uint DonorId { get; set; }

    public byte BloodGroupId { get; set; }

    public uint? BloodRequestId { get; set; }

    public uint Units { get; set; }

    public DateTime DonationDate { get; set; }

    public DateOnly ExpiryDate { get; set; }

    public string? ScreeningStatus { get; set; }

    public string? DonationStatus { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual BloodGroup BloodGroup { get; set; } = null!;

    public virtual BloodRequest? BloodRequest { get; set; }

    public virtual BloodScreening? BloodScreening { get; set; }

    public virtual Donor Donor { get; set; } = null!;
}
