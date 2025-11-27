import React, { useState, useEffect } from 'react';
import '../styles/Doctors.css';
import { Plus, Edit2, Trash2, X, Search, Phone, Mail, Clock, ShieldAlert, CalendarPlus } from 'lucide-react';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  
  // ID for blocking time
  const [blockingDoctorId, setBlockingDoctorId] = useState('');
  const [isDoctorFixed, setIsDoctorFixed] = useState(false);
  
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [errors, setErrors] = useState({});

  // Forms
  const [doctorForm, setDoctorForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '', scheduleStart: '09:00', scheduleEnd: '17:00' });
  
  // --- UPDATED BLOCK FORM: Added endDate ---
  const [blockForm, setBlockForm] = useState({ reason: '', date: '', endDate: '', notes: '' });

  // 1. FETCH DATA
  const fetchDoctors = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/doctors');
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Handlers
  const handleOpenAdd = () => { 
    setEditingDoctor(null); 
    setDoctorForm({ firstName: '', lastName: '', email: '', phone: '', role: '', scheduleStart: '09:00', scheduleEnd: '17:00' }); 
    setErrors({}); 
    setIsDoctorModalOpen(true); 
  };

  const handleOpenEdit = (doc) => { 
    setEditingDoctor(doc); 
    setDoctorForm({ ...doc }); 
    setErrors({}); 
    setIsDoctorModalOpen(true); 
  };

  const handleDeleteClick = (doc) => { setDoctorToDelete(doc); };

  // 2. SAVE DOCTOR
  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!doctorForm.firstName) newErrors.firstName = "First Name is required";
    if (!doctorForm.lastName) newErrors.lastName = "Last Name is required";
    if (!doctorForm.email) newErrors.email = "Email is required";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    try {
        if (editingDoctor) {
            await fetch(`http://localhost:5000/api/doctors/${editingDoctor.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(doctorForm)
            });
        } else {
            await fetch('http://localhost:5000/api/doctors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(doctorForm)
            });
        }
        fetchDoctors();
        setIsDoctorModalOpen(false);
    } catch (err) {
        console.error("Error saving doctor:", err);
    }
  };

  // 3. BLOCK TIME (Add Leave)
  const handleOpenBlock = (specificId = '') => { 
    setBlockingDoctorId(specificId ? specificId.toString() : ''); 
    setIsDoctorFixed(!!specificId); 
    
    // Reset form including endDate
    setBlockForm({ reason: '', date: '', endDate: '', notes: '' }); 
    setErrors({}); 
    setIsBlockModalOpen(true); 
  };
  
  const handleSaveBlock = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!blockingDoctorId) newErrors.doctor = "Please select a doctor";
    if (!blockForm.reason) newErrors.reason = "Please select a reason";
    if (!blockForm.date) newErrors.date = "Start Date is required";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    try {
        // --- NEW LOGIC: HANDLE DATE RANGE LOOP ---
        const start = new Date(blockForm.date);
        const end = blockForm.endDate ? new Date(blockForm.endDate) : new Date(blockForm.date);
        
        // Loop through every day from Start to End
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
            // Format to YYYY-MM-DD using Local Time
            const year = dt.getFullYear();
            const month = String(dt.getMonth() + 1).padStart(2, '0');
            const day = String(dt.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            await fetch(`http://localhost:5000/api/doctors/${blockingDoctorId}/leaves`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: blockForm.reason,
                    date: formattedDate,
                    notes: blockForm.notes
                })
            });
        }

        fetchDoctors();
        setIsBlockModalOpen(false);
    } catch (err) {
        console.error("Error adding leave:", err);
    }
  };

  // 4. REMOVE LEAVE
  const handleRemoveLeave = async (leaveId) => {
    if (!window.confirm("Remove this leave entry?")) return;
    try {
        await fetch(`http://localhost:5000/api/doctors/leaves/${leaveId}`, { method: 'DELETE' });
        fetchDoctors();
    } catch (err) {
        console.error("Error deleting leave:", err);
    }
  };

  // 5. DELETE DOCTOR
  const confirmDelete = async () => {
    if (doctorToDelete) {
        try {
            await fetch(`http://localhost:5000/api/doctors/${doctorToDelete.id}`, { method: 'DELETE' });
            fetchDoctors();
            setDoctorToDelete(null);
        } catch (err) {
            console.error("Error deleting doctor:", err);
        }
    }
  };

  const filteredDoctors = doctors.filter(d => 
    `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h2 className="page-title">Doctor Availability</h2><p className="page-subtitle">Manage profiles, schedules, and time-off</p></div>
        <div style={{display: 'flex', gap: '10px'}}><button className="btn btn-outline" style={{color: 'var(--warning)', borderColor: 'var(--warning)'}} onClick={() => handleOpenBlock('')}><ShieldAlert size={18} /> Block Time</button><button className="btn btn-primary" onClick={handleOpenAdd}><Plus size={18} /> Add Doctor</button></div>
      </div>

      <div className="dashboard-filters-card">
        <div className="dashboard-filters-row">
          <div className="dashboard-filter-group" style={{ gridColumn: '1 / -1' }}><label>Search Doctors</label><div className="filter-input-wrapper"><Search size={16} className="filter-input-icon" /><input type="text" placeholder="Search by name or specialization..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div></div>
        </div>
      </div>

      <div className="doctors-grid">
        {filteredDoctors.map((doc) => (
          <div key={doc.id} className="doctor-card">
            <div className="doc-header"><div className="doc-avatar">{doc.firstName[0]}{doc.lastName[0]}</div><div className="doc-info"><h3>Dr. {doc.firstName} {doc.lastName}</h3><span className="doc-specialty">{doc.role}</span></div><span className={`status-badge ${doc.leaves && doc.leaves.length > 0 ? 'status-leave' : 'status-active'}`}>{doc.leaves && doc.leaves.length > 0 ? 'On Leave' : 'Active'}</span></div>
            <div className="doc-body">
              <div className="info-row"><Mail size={14} className="info-icon"/> {doc.email}</div><div className="info-row"><Phone size={14} className="info-icon"/> {doc.phone}</div>
              <div className="schedule-mini"><div className="schedule-title">Weekly Schedule</div><div className="info-row"><Clock size={14} className="info-icon"/> <span className="schedule-time">Mon - Fri: {doc.scheduleStart?.slice(0,5)} - {doc.scheduleEnd?.slice(0,5)}</span></div></div>
              {doc.leaves && doc.leaves.length > 0 && ( <div><div className="schedule-title" style={{marginTop: '0.5rem'}}>Upcoming Leaves</div><div className="leaves-list">{doc.leaves.map((leave, idx) => ( <div key={idx} className="leave-tag"><span>{new Date(leave.date).toLocaleDateString()} - {leave.reason}</span><button onClick={() => handleRemoveLeave(leave.id)} style={{border:'none', background:'none', cursor:'pointer', color:'#c2410c'}}><X size={12}/></button></div> ))}</div></div> )}
            </div>
            <div className="doc-footer"><button className="icon-btn" title="Add Leave" onClick={() => handleOpenBlock(doc.id)}><CalendarPlus size={18} /></button><div className="footer-actions"><button className="icon-btn" title="Edit" onClick={() => handleOpenEdit(doc)}><Edit2 size={16}/></button><button className="icon-btn delete" title="Delete" onClick={() => handleDeleteClick(doc)}><Trash2 size={16}/></button></div></div>
          </div>
        ))}
      </div>

      {isDoctorModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDoctorModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{editingDoctor ? 'Edit Profile' : 'Add New Doctor'}</h3><button onClick={() => setIsDoctorModalOpen(false)} className="modal-close"><X size={20}/></button></div>
            <form onSubmit={handleSaveDoctor}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-row-2">
                    <div className="form-group"><label className="form-label">First Name</label><input className="form-control" placeholder="e.g. John" style={{ borderColor: errors.firstName ? 'var(--danger)' : 'var(--border)' }} value={doctorForm.firstName} onChange={e => { setDoctorForm({...doctorForm, firstName: e.target.value}); setErrors({...errors, firstName: null}); }}/>{errors.firstName && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.firstName}</span>}</div>
                    <div className="form-group"><label className="form-label">Last Name</label><input className="form-control" placeholder="e.g. Doe" style={{ borderColor: errors.lastName ? 'var(--danger)' : 'var(--border)' }} value={doctorForm.lastName} onChange={e => { setDoctorForm({...doctorForm, lastName: e.target.value}); setErrors({...errors, lastName: null}); }}/>{errors.lastName && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.lastName}</span>}</div>
                  </div>
                  <div className="form-group"><label className="form-label">Email</label><input required type="email" className="form-control" placeholder="doctor@calonia.com" style={{ borderColor: errors.email ? 'var(--danger)' : 'var(--border)' }} value={doctorForm.email} onChange={e => { setDoctorForm({...doctorForm, email: e.target.value}); setErrors({...errors, email: null}); }}/>{errors.email && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.email}</span>}</div>
                  <div className="form-group"><label className="form-label">Phone</label><input required className="form-control" placeholder="555-0101" value={doctorForm.phone} onChange={e => setDoctorForm({...doctorForm, phone: e.target.value})}/></div>
                  <div className="form-group"><label className="form-label">Specialization</label><input className="form-control" style={{ borderColor: errors.role ? 'var(--danger)' : 'var(--border)' }} placeholder="e.g. General Practitioner" value={doctorForm.role} onChange={e => { setDoctorForm({...doctorForm, role: e.target.value}); setErrors({...errors, role: null}); }}/>{errors.role && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.role}</span>}</div>
                  <div className="form-row-2"><div className="form-group"><label className="form-label">Shift Start</label><input type="time" className="form-control" value={doctorForm.scheduleStart} onChange={e => setDoctorForm({...doctorForm, scheduleStart: e.target.value})}/></div><div className="form-group"><label className="form-label">Shift End</label><input type="time" className="form-control" value={doctorForm.scheduleEnd} onChange={e => setDoctorForm({...doctorForm, scheduleEnd: e.target.value})}/></div></div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setIsDoctorModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save Changes</button></div>
            </form>
          </div>
        </div>
      )}

      {isBlockModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBlockModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{blockingDoctorId ? 'Add Leave' : 'Block Time Slot'}</h3><button onClick={() => setIsBlockModalOpen(false)} className="modal-close"><X size={20}/></button></div>
            <form onSubmit={handleSaveBlock}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Select Doctor</label>
                    <select 
                      className="form-control" 
                      style={{ 
                        color: blockingDoctorId ? 'var(--text-dark)' : '#94a3b8',
                        borderColor: errors.doctor ? 'var(--danger)' : 'var(--border)' 
                      }}
                      value={blockingDoctorId} 
                      onChange={e => { setBlockingDoctorId(e.target.value); setErrors({...errors, doctor: null}); }}
                      disabled={isDoctorFixed} 
                      required
                    > 
                      <option value="" disabled>-- Choose Doctor --</option> 
                      {doctors.map(d => ( 
                        <option key={d.id} value={d.id} style={{color: 'var(--text-dark)'}}>
                          Dr. {d.firstName} {d.lastName}
                        </option> 
                      ))} 
                    </select>
                    {errors.doctor && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.doctor}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Reason</label>
                    <select className="form-control" required value={blockForm.reason} onChange={e => setBlockForm({...blockForm, reason: e.target.value})}>
                      <option value="">Select Reason...</option>
                      <option>Personal Leave</option><option>Emergency</option><option>Holiday</option><option>Conference</option>
                    </select>
                    {errors.reason && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>Please select a reason</span>}
                  </div>

                  {/* --- UPDATED DATE INPUTS FOR RANGE --- */}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input required type="date" className="form-control" style={{ borderColor: errors.date ? 'var(--danger)' : 'var(--border)' }} value={blockForm.date} onChange={e => { setBlockForm({...blockForm, date: e.target.value}); setErrors({...errors, date: null}); }}/>
                      {errors.date && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.date}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date (Optional)</label>
                      <input type="date" className="form-control" value={blockForm.endDate} onChange={e => setBlockForm({...blockForm, endDate: e.target.value})} placeholder="Same as start" min={blockForm.date} />
                    </div>
                  </div>

                  <div className="form-group"><label className="form-label">Notes (Optional)</label><textarea className="form-control" rows="3" placeholder="e.g. Out of town for a wedding..." value={blockForm.notes} onChange={e => setBlockForm({...blockForm, notes: e.target.value})}></textarea></div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setIsBlockModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">Confirm Block</button></div>
            </form>
          </div>
        </div>
      )}

      {doctorToDelete && (
        <div className="modal-overlay" onClick={() => setDoctorToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
             <div className="modal-header"><h3 style={{ fontWeight: 'bold', color: 'var(--danger)' }}>Remove Doctor</h3><button onClick={() => setDoctorToDelete(null)} className="modal-close"><X size={20} /></button></div>
            <div className="modal-body"><p className="modal-text">Are you sure you want to remove <strong>Dr. {doctorToDelete.lastName}</strong>? This cannot be undone.</p></div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setDoctorToDelete(null)}>Cancel</button><button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', boxShadow: 'none' }} onClick={confirmDelete}>Remove Permanently</button></div>
          </div>
        </div>
      )}
    </div>
  );
}