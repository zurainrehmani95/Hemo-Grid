import { NavLink } from 'react-router-dom';

// Left navigation rail: brand, the tab links, and logout. The admin profile chip now lives
// in the top header (see TopHeader). Navigation is handled by react-router `NavLink`s, which
// change the URL and automatically apply the "active" class to the current route. `onLogout`
// ends the session.
function Sidebar({ onLogout }) {
  // NavLink passes an { isActive } flag; reuse the existing `.nav-menu-item.active` styles.
  const linkClass = ({ isActive }) => `nav-menu-item ${isActive ? 'active' : ''}`;

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand-area">
        <div className="brand-pulse-icon">🩸</div>
        <div className="brand-title-text">HEMO<span className="brand-sub-title">GRID</span></div>
      </div>

      <nav className="sidebar-nav-menu">
        <NavLink to="/donors" className={linkClass}>
          <span className="menu-icon-slot">📂</span> Donor Registry
        </NavLink>
        <NavLink to="/stats" className={linkClass}>
          <span className="menu-icon-slot">📊</span> Statistics Matrix
        </NavLink>
        <NavLink to="/audit" className={linkClass}>
          <span className="menu-icon-slot">📈</span> Ledger & Cash Flow
        </NavLink>
        <NavLink to="/settings" className={linkClass}>
          <span className="menu-icon-slot">⚙️</span> Control Settings
        </NavLink>
      </nav>

      <div className="sidebar-contact-box">
        <span className="contact-box-title">📞 EMERGENCY DESK</span>
        <span className="contact-box-number">03184618851</span>
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={onLogout}>
          Terminate Session
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
