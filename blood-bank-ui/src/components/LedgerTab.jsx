// Ledger & cash-flow tab: net balance card, a sparkline of the running balance, and the
// full audit table. It computes the running totals from the `auditLogs` it receives.
function LedgerTab({ auditLogs, auditLoading }) {
  // Walk the logs oldest-to-newest, accumulating a running balance for each point.
  let rollingCashBalance = 0;
  const computedCashPoints = [...auditLogs].reverse().map(log => {
    rollingCashBalance += Number(log.cashFlowAmount || 0);
    return { ...log, rollingBalance: rollingCashBalance };
  });
  const finalNetWorth = rollingCashBalance;
  const maxBalancePeak = Math.max(...computedCashPoints.map(p => Math.abs(p.rollingBalance)), 1);

  return (
    <div className="tab-view-container animate-fade-in">
      <div className="financial-analytics-wrapper-grid">
        <div className="financial-metric-sheet-card">
          <span className="widget-label">Net System Running Cash Flow Balance</span>
          <h2 className={finalNetWorth >= 0 ? 'cash-positive' : 'cash-negative'}>PKR {finalNetWorth.toLocaleString()}</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>Unified balance aggregated from background logs</p>
        </div>

        <div className="financial-sparkline-chart-card">
          <h3>CASH FLOW REVENUE BALANCE HISTORICAL POINTS</h3>
          <div className="sparkline-trend-row-matrix">
            {computedCashPoints.map((point, index) => {
              const ratioValue = (point.rollingBalance / maxBalancePeak) * 50;
              const heightOffset = 50 + ratioValue;
              return (
                <div className="spark-node-pillar-wrapper" key={index} title={`Balance: PKR ${point.rollingBalance}`}>
                  <div className="spark-pillar-line" style={{ height: `${heightOffset}%` }}>
                    <div className={`spark-dot-head ${point.cashFlowAmount >= 0 ? 'pos' : 'neg'}`}></div>
                  </div>
                  <span className="spark-axis-index">pt.{index + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {auditLoading ? (
        <div className="alert-message loading-box">Interrogating Ledger Buffer Lines...</div>
      ) : (
        <div className="table-responsive">
          <table className="donor-table">
            <thead>
              <tr>
                <th>Log ID</th><th>Timestamp Reference</th><th>Operation Type</th><th>Details Statement</th><th>Classification</th><th style={{ textAlign: 'right' }}>Cash Flow Margin</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="accent-text">00{log.id}</td>
                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ fontWeight: 'bold' }} className="table-main-text-color">{log.operation}</td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: '350px' }}>{log.details}</td>
                    <td><span className={`type-tag-flag ${log.logType?.toLowerCase()}`}>{log.logType}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }} className={log.cashFlowAmount > 0 ? 'cash-positive' : log.cashFlowAmount < 0 ? 'cash-negative' : 'cash-neutral'}>
                      {log.cashFlowAmount > 0 ? `+PKR ${log.cashFlowAmount}` : log.cashFlowAmount < 0 ? `-PKR ${Math.abs(log.cashFlowAmount)}` : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="empty-row">No system logging history parameters found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LedgerTab;
