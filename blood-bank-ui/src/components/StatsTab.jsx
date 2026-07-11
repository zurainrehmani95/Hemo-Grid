// Statistics tab: summary cards + a simple blood-group distribution bar chart.
// It derives everything it needs from the `donors` list, so App doesn't have to.
function StatsTab({ donors, bloodGroups }) {
  const statsTotalDonors = donors.length;
  const statsEligibleCount = donors.filter(d => d.eligibilityStatus?.toLowerCase() === 'eligible').length;
  const statsDeferredCount = donors.filter(d => d.eligibilityStatus?.toLowerCase() === 'deferred').length;

  // Count how many donors fall into each blood group.
  const groupDistribution = bloodGroups.reduce((acc, group) => {
    acc[group] = donors.filter(d => {
      const gText = d.bloodGroup && typeof d.bloodGroup === 'object' ? d.bloodGroup.name : d.bloodGroup;
      return gText === group;
    }).length;
    return acc;
  }, {});
  const maxDistributionValue = Math.max(...Object.values(groupDistribution), 1);

  return (
    <div className="tab-view-container animate-fade-in">
      <div className="analytics-summary-cards">
        <div className="stat-card-widget">
          <span className="widget-label">Total Indexed Database Donors</span>
          <h3>{statsTotalDonors} Profiles</h3>
          <div className="widget-bar-track"><div className="widget-fill" style={{ width: '100%', backgroundColor: 'var(--accent-cyan)' }}></div></div>
        </div>
        <div className="stat-card-widget">
          <span className="widget-label">Active Eligible Candidates</span>
          <h3 style={{ color: '#10b981' }}>{statsEligibleCount} Users</h3>
          <div className="widget-bar-track"><div className="widget-fill" style={{ width: `${(statsEligibleCount/Math.max(statsTotalDonors,1))*100}%`, backgroundColor: '#10b981' }}></div></div>
        </div>
        <div className="stat-card-widget">
          <span className="widget-label">Temporary Medical Deferrals</span>
          <h3 style={{ color: '#f59e0b' }}>{statsDeferredCount} Holds</h3>
          <div className="widget-bar-track"><div className="widget-fill" style={{ width: `${(statsDeferredCount/Math.max(statsTotalDonors,1))*100}%`, backgroundColor: '#f59e0b' }}></div></div>
        </div>
      </div>

      <div className="chart-analytics-frame-container">
        <h3>BLOOD GROUP DISTRIBUTION COUNTS</h3>
        <p className="chart-subtitle">Real-time analytical metrics mapped across index registries</p>
        <div className="native-bar-chart-grid">
          {bloodGroups.map(group => {
            const count = groupDistribution[group] || 0;
            const percentageHeight = (count / maxDistributionValue) * 100;
            return (
              <div className="chart-column-node" key={group}>
                <div className="chart-bar-value-label">{count}</div>
                <div className="chart-bar-pillar-wrapper">
                  <div className="chart-pillar-fill" style={{ height: `${Math.max(percentageHeight, 4)}%` }}></div>
                </div>
                <div className="chart-axis-label-node">{group}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StatsTab;
