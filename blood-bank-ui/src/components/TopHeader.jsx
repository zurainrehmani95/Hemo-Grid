import { useState, useEffect } from 'react';

// Turn an elapsed-milliseconds value into a HH:MM:SS string for the session timer.
function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Top bar of the workspace: the sidebar toggle, the current tab's title, and (on the
// right) the admin profile chip plus, on the donors tab only, the "Onboard New Donor" button.
function TopHeader({ activeTab, sidebarCollapsed, setSidebarCollapsed, onAddDonor, adminName, loginTime }) {
  // Tick once a second so the session timer stays live while the admin is logged in.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!loginTime) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [loginTime]);

  const sessionTime = loginTime ? formatElapsed(now - loginTime) : '00:00:00';

  // Fall back to a generic label until the name arrives from the database.
  const displayName = adminName || 'System Admin';
  // Build up-to-two-letter initials for the avatar (e.g. "System Administrator" -> "SA").
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'AD';

  return (
    <header className="viewport-top-header">
      <div className="viewport-header-left-group">
        <button
          className={`hamburger-menu-toggle ${sidebarCollapsed ? '' : 'is-x'}`}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label="Toggle Sidebar Menu"
        >
          <span></span><span></span><span></span>
        </button>
        <h2>
          <span className="header-title-long">
            {activeTab === 'donors' && 'DONOR REGISTRY CONTROL'}
            {activeTab === 'stats' && 'ANALYTICS & DISTRIBUTIONS'}
            {activeTab === 'audit' && 'SYSTEM REVENUE LEDGERS'}
            {activeTab === 'settings' && 'SYSTEM WORKSPACE CONFIGURATIONS'}
          </span>
          <span className="header-title-short">
            {activeTab === 'donors' && 'DONORS'}
            {activeTab === 'stats' && 'STATS'}
            {activeTab === 'audit' && 'LEDGER'}
            {activeTab === 'settings' && 'SETTINGS'}
          </span>
        </h2>
      </div>

      <div className="viewport-header-right-group">
        <div className="header-admin-profile">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-details">
            <span className="profile-name">{displayName}</span>
            <span className="profile-status">Online Mode</span>
            <span className="profile-session">⏱ Session {sessionTime}</span>
          </div>
        </div>

        {activeTab === 'donors' && (
          <button className="top-bar-action-btn" onClick={onAddDonor}>
            <span className="action-btn-long">+ Onboard New Donor</span>
            <span className="action-btn-short">+ Add</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default TopHeader;
