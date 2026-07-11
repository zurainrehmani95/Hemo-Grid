using System;
using System.Collections.Generic;
using System.Linq;
using BloodBankAPI.Dtos;

namespace BloodBankAPI.Services;

// Thread-safe, in-memory ledger shared by every donor controller.
// Because it is a static list it is shared across all requests, but it resets whenever the
// API restarts (there is no database table behind it). Keeping it here means the Create,
// Update and Delete controllers can all write to the same ledger without duplicating code.
public static class AuditLedger
{
    private static readonly List<AuditLogEntry> _logs = new()
    {
        new AuditLogEntry { Id = 1, Timestamp = DateTime.Now.AddDays(-1), Operation = "SYSTEM COLD BOOT", Details = "Data synchronization pipeline established with local MySQL instance.", CashFlowAmount = 0.00m, LogType = "System" },
        new AuditLogEntry { Id = 2, Timestamp = DateTime.Now.AddHours(-4), Operation = "GOVERNMENT GRANT", Details = "Administrative overhead subsidy allocation received.", CashFlowAmount = 25000.00m, LogType = "Financial" }
    };

    // Return a copy of the ledger, newest entries first.
    public static List<AuditLogEntry> Snapshot()
    {
        lock (_logs)
        {
            return _logs.OrderByDescending(l => l.Timestamp).ToList();
        }
    }

    // Append a new line, giving it the next id automatically. The lock keeps concurrent
    // requests from corrupting the list.
    public static void Record(string operation, string details, decimal cashFlowAmount, string logType)
    {
        lock (_logs)
        {
            _logs.Add(new AuditLogEntry
            {
                Id = _logs.Any() ? _logs.Max(l => l.Id) + 1 : 1,
                Timestamp = DateTime.Now,
                Operation = operation,
                Details = details,
                CashFlowAmount = cashFlowAmount,
                LogType = logType
            });
        }
    }
}
