// Donor registry tab: the search bar plus the results table.
// This is a "dumb" component - all data and handlers come from App via props.
function DonorsTab({
  selectedGroup, setSelectedGroup,
  handleSearch,
  bloodGroups,
  hasSearched, error, loading,
  donors,
  openEditModal, handleDeleteDonor
}) {
  return (
    <div className="tab-view-container animate-fade-in">
      <section className="google-search-container">
        <div className="google-logo">BLOOD DIRECTORY</div>
        <form onSubmit={handleSearch} className="google-search-bar-form">
          <div className="search-input-wrapper">
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="google-select">
              <option value="">All Blood Records</option>
              {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
          <div className="google-btn-row">
            <button type="submit" className="google-search-btn">Execute Index Search</button>
          </div>
        </form>
      </section>

      {/* Results only show after the first search runs */}
      {hasSearched && (
        <main className="dashboard-content">
          {error && <div className="alert-message error-box">{error}</div>}
          {loading && <div className="alert-message loading-box">Scanning Indexed MySQL Rows...</div>}

          {!loading && !error && (
            <div className="table-responsive">
              <table className="donor-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Full Name</th><th>Age</th><th>Group</th><th>Gender</th><th>Phone Line</th><th>Email Record</th><th>Status</th><th style={{ textAlign: 'center' }}>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.length > 0 ? (
                    donors.map((donor) => {
                      // bloodGroup usually arrives as a plain code string, but guard against
                      // the older object shape just in case.
                      const renderGroup = donor.bloodGroup && typeof donor.bloodGroup === 'object'
                        ? donor.bloodGroup.name || donor.bloodGroup.type
                        : donor.bloodGroup;
                      return (
                        <tr key={donor.id}>
                          <td className="accent-text">#{donor.id}</td>
                          <td style={{ fontWeight: '600' }} className="table-main-text-color">{donor.firstName} {donor.lastName}</td>
                          <td>{donor.age || '—'} Yrs</td>
                          <td><span className="blood-badge-icon">{renderGroup || 'N/A'}</span></td>
                          <td>{donor.gender}</td>
                          <td>{donor.phone}</td>
                          <td>{donor.email}</td>
                          <td><span className={`status-badge ${donor.eligibilityStatus?.toLowerCase()}`}>{donor.eligibilityStatus || 'Eligible'}</span></td>
                          <td className="action-cell-buttons">
                            <button className="edit-action-btn" onClick={() => openEditModal(donor)}>Modify</button>
                            <button className="delete-action-btn" onClick={() => handleDeleteDonor(donor.id)}>Purge</button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="9" className="empty-row">No active profiles matching query criteria.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default DonorsTab;
