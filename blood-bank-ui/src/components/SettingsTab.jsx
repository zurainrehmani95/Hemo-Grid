// Settings tab: the light / dark theme switch. The theme itself is owned by App, so this
// component just reads `theme` and calls `setTheme`.
function SettingsTab({ theme, setTheme }) {
  return (
    <div className="tab-view-container animate-fade-in">
      <div className="settings-panel-card">
        <h3>Workspace Personalization</h3>
        <p className="settings-panel-subtitle">Manage system visualization modes and rendering parameters.</p>
        <hr className="settings-divider" />
        <div className="settings-control-row">
          <div className="settings-text-block">
            <span className="control-title">Interface Visual Engine</span>
            <p className="control-desc">Swap global aesthetics layout matrices seamlessly across light and dark color schemas.</p>
          </div>
          <div className="settings-action-block">
            <div className="theme-toggle-switch-row">
              <button className={`theme-toggle-btn-option light-opt ${theme === 'light' ? 'selected' : ''}`} onClick={() => setTheme('light')}>☀️ Light Theme</button>
              <button className={`theme-toggle-btn-option dark-opt ${theme === 'dark' ? 'selected' : ''}`} onClick={() => setTheme('dark')}>🌙 Dark Theme</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsTab;
