using System;
using System.Collections.Generic;

namespace BloodBankAPI.Models;

public partial class Hospital
{
    public uint Id { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public string ContactNumber { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<Patient> Patients { get; set; } = new List<Patient>();
}
