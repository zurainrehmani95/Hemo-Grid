using System;

namespace BloodBankAPI.Dtos;

// A single line in the in-memory audit / cash-flow ledger that the "Ledger & Cash Flow"
// tab displays. This is not a database table - see AuditLedger for where it lives.
public class AuditLogEntry
{
    public int Id { get; set; }
    public DateTime Timestamp { get; set; }
    public string Operation { get; set; } = "";
    public string Details { get; set; } = "";
    public decimal CashFlowAmount { get; set; }
    public string LogType { get; set; } = "System";
}
