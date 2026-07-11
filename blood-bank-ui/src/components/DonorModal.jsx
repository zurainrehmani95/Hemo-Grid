// Add / edit donor dialog. The same form serves both modes:
//   - formMode "add"  -> title/behaviour for a new donor
//   - formMode "edit" -> title/behaviour for an existing donor
// `formData`/`setFormData` are the controlled form state (owned by App); `onSubmit` sends it
// to the API and `onClose` dismisses the modal.
function DonorModal({ formMode, formData, setFormData, bloodGroups, onClose, onSubmit }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card animate-fade-in">
        <h3>{formMode === 'add' ? 'ONBOARD NEW REGISTRATION' : 'REVISE PROFILE METADATA'}</h3>
        <form onSubmit={onSubmit}>
          <div className="modal-grid-inputs">
            <div className="form-group"><label>First Name</label><input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required /></div>
            <div className="form-group"><label>Last Name</label><input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required /></div>
            <div className="form-group"><label>Donor Age</label><input type="number" min="17" max="80" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="Years" required /></div>
            <div className="form-group">
              <label>Blood Group</label>
              <select value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group"><label>Phone Line</label><input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></div>
            <div className="form-group full-width-input"><label>Email Address</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
            <div className="form-group full-width-input">
              <label>Eligibility Clearance</label>
              <select value={formData.eligibilityStatus} onChange={(e) => setFormData({ ...formData, eligibilityStatus: e.target.value })}>
                <option value="Eligible">Eligible</option><option value="Deferred">Deferred</option><option value="Ineligible">Ineligible</option>
              </select>
            </div>
          </div>
          <div className="modal-action-row">
            <button type="button" className="cancel-modal-btn" onClick={onClose}>Abort</button>
            <button type="submit" className="save-modal-btn">Commit Package</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DonorModal;
