import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import API, { TOKEN_KEY } from './services/api';
import './index.css';

import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import WaveCanvas from './components/WaveCanvas';
import DonorsTab from './components/DonorsTab';
import StatsTab from './components/StatsTab';
import LedgerTab from './components/LedgerTab';
import SettingsTab from './components/SettingsTab';
import DonorModal from './components/DonorModal';
import Footer from './components/Footer';

// App is the "container": it owns all the state and the API calls, and hands the data +
// callbacks down to the presentational components in /components.
function App() {
  const [theme, setTheme] = useState('dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  // Display name of the logged-in admin, read from the MySQL `admins` row via the login API.
  const [adminName, setAdminName] = useState('');
  // Timestamp (ms) of when the current session started, so the header can show a live timer.
  const [loginTime, setLoginTime] = useState(null);

  // The old `activeTab` string is now derived from the URL instead of local state, so the
  // sidebar links, the header title, and the browser address bar all stay in sync.
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.replace('/', '') || 'donors';

  // Donor directory
  const [donors, setDonors] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Audit ledger
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const quotes = [
    "“Your blood is precious: Share it, save a life.”",
    "“Every blood donor is a lifesaver in disguise.”",
    "“The gift of blood is the gift of life. There is no substitute.”",
    "“You don't have to be a doctor to save lives. Just donate blood.”",
    "“To give blood is to give another birthday, another anniversary, another chance.”"
  ];
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Add/edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formData, setFormData] = useState({
    id: 0, firstName: '', lastName: '', age: '', gender: 'Male', phone: '', email: '', bloodGroup: 'A+', eligibilityStatus: 'Eligible'
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const [isHovered, setIsHovered] = useState(false);

  // Cycle the login-screen quote every couple of minutes
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 120000);
    return () => clearInterval(quoteInterval);
  }, []);

  // Credentials are now verified by the backend (POST /api/auth/login). The password is
  // never stored in the frontend anymore. On success we flip auth state and let routing
  // send the admin into the workspace; on failure we surface the server's message.
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/auth/login', { username, password });
      // Store the JWT first so the initial data-load requests are already authenticated.
      if (response.data?.token) {
        sessionStorage.setItem(TOKEN_KEY, response.data.token);
      }
      setAdminName(response.data?.name || '');
      setLoginTime(Date.now());
      setIsLoggedIn(true);
      setLoginError('');
      setPassword('');
      navigate('/donors');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setLoginError('Invalid administrative credentials.');
      } else {
        setLoginError(err.friendlyMessage || 'Login service is unavailable.');
      }
    }
  };

  // Load donors - either all of them or filtered by the selected blood group.
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      let response;
      if (selectedGroup) {
        response = await API.get(`/donors/search?bloodGroup=${encodeURIComponent(selectedGroup)}`);
      } else {
        response = await API.get('/donors');
      }
      setDonors(response.data);
    } catch (err) {
      setError(err.friendlyMessage || 'Could not fetch synchronized directory lines.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditTrail = async () => {
    setAuditLoading(true);
    try {
      const response = await API.get('/donors/audit-trail');
      setAuditLogs(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  // On login, pull the initial data.
  useEffect(() => {
    if (isLoggedIn) {
      handleSearch();
      fetchAuditTrail();
    }
  }, [isLoggedIn]);

  const openAddModal = () => {
    setFormMode('add');
    setFormData({ id: 0, firstName: '', lastName: '', age: '', gender: 'Male', phone: '', email: '', bloodGroup: selectedGroup || 'A+', eligibilityStatus: 'Eligible' });
    setIsModalOpen(true);
  };

  const openEditModal = (donor) => {
    setFormMode('edit');
    const groupText = donor.bloodGroup && typeof donor.bloodGroup === 'object' ? donor.bloodGroup.name || donor.bloodGroup.type || 'A+' : donor.bloodGroup || 'A+';
    // age is sent to the API as a string, so coerce it here
    setFormData({ ...donor, age: donor.age != null ? String(donor.age) : '', bloodGroup: groupText });
    setIsModalOpen(true);
  };

  // Create (add) or update (edit), then refetch so the table + ledger stay in sync.
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formMode === 'add') { await API.post('/donors', formData); }
      else { await API.put(`/donors/${formData.id}`, formData); }
      setIsModalOpen(false);
      handleSearch();
      fetchAuditTrail();
    } catch (err) {
      alert(err.friendlyMessage || 'Error committing transactional schema changes.');
    }
  };

  const handleDeleteDonor = async (id) => {
    if (window.confirm('Are you certain you wish to purge this record index completely?')) {
      try {
        await API.delete(`/donors/${id}`);
        handleSearch();
        fetchAuditTrail();
      } catch (err) {
        alert(err.friendlyMessage || 'Failed to drop data index.');
      }
    }
  };

  // Logged-out view: the login screen lives at /login, and every other URL is guarded -
  // an unauthenticated visitor gets bounced there by the catch-all route below.
  if (!isLoggedIn) {
    const loginScreen = (
      <LoginScreen
        theme={theme}
        username={username} setUsername={setUsername}
        password={password} setPassword={setPassword}
        loginError={loginError}
        handleLogin={handleLogin}
        quotes={quotes} currentQuoteIndex={currentQuoteIndex}
        isHovered={isHovered} setIsHovered={setIsHovered}
      />
    );

    return (
      <Routes>
        <Route path="/login" element={loginScreen} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Logged-in workspace
  return (
    <div className={`theme-wrapper ${theme}`}>
      {/* PS3 wave backdrop — same ribbon animation as the login screen, dimmed behind panels. */}
      <div className="workspace-backdrop" aria-hidden="true">
        <WaveCanvas isHovered={false} variant={theme} />
        <div className="workspace-backdrop-vignette" />
      </div>

      <div className={`app-workspace-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

        <Sidebar
          onLogout={() => { sessionStorage.removeItem(TOKEN_KEY); setIsLoggedIn(false); setHasSearched(false); setAdminName(''); setLoginTime(null); }}
        />

        <div className="app-content-viewport">
          <TopHeader
            activeTab={activeTab}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            onAddDonor={openAddModal}
            adminName={adminName}
            loginTime={loginTime}
          />

          {/* Each tab is now a URL: /donors, /stats, /audit, /settings. Unknown paths (like
              the initial "/") fall through to the donor registry. */}
          <Routes>
            <Route
              path="/donors"
              element={
                <DonorsTab
                  selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup}
                  handleSearch={handleSearch}
                  bloodGroups={bloodGroups}
                  hasSearched={hasSearched} error={error} loading={loading}
                  donors={donors}
                  openEditModal={openEditModal} handleDeleteDonor={handleDeleteDonor}
                />
              }
            />
            <Route path="/stats" element={<StatsTab donors={donors} bloodGroups={bloodGroups} />} />
            <Route path="/audit" element={<LedgerTab auditLogs={auditLogs} auditLoading={auditLoading} />} />
            <Route path="/settings" element={<SettingsTab theme={theme} setTheme={setTheme} />} />
            <Route path="*" element={<Navigate to="/donors" replace />} />
          </Routes>
        </div>
      </div>

      <Footer />

      {isModalOpen && (
        <DonorModal
          formMode={formMode}
          formData={formData} setFormData={setFormData}
          bloodGroups={bloodGroups}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}

export default App;
