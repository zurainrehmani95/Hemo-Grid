using System;
using System.Collections.Generic;

namespace BloodBankAPI.Models;

public partial class BloodGroup
{
    public byte Id { get; set; }

    public string Code { get; set; } = null!;

    public virtual BloodInventory? BloodInventory { get; set; }

    public virtual ICollection<BloodRequest> BloodRequests { get; set; } = new List<BloodRequest>();

    public virtual ICollection<Donation> Donations { get; set; } = new List<Donation>();

    public virtual ICollection<Donor> Donors { get; set; } = new List<Donor>();

    public virtual ICollection<Patient> Patients { get; set; } = new List<Patient>();
}
