import React, { useState } from 'react';
import '../styles/Doctors.css';
import { Plus, Edit2, Trash2, X, Search, Phone, Mail, Clock, ShieldAlert, CalendarPlus } from 'lucide-react';

const INITIAL_DOCTORS = [
  { id: 1, firstName: 'James', lastName: 'Johnson', email: 'j.johnson@calonia.com', phone: '555-0101', role: 'General Practitioner', scheduleStart: '09:00', scheduleEnd: '17:00', status: 'Active', leaves: [] },
  { id: 2, firstName: 'Sarah', lastName: 'Davis', email: 's.davis@calonia.com', phone: '555-0102', role: 'Pediatrician', scheduleStart: '08:00', scheduleEnd: '16:00', status: 'Active', leaves: [{ date: '2025-11-20', reason: 'Personal Leave' }] },
  { id: 3, firstName: 'Emily', lastName: 'Miller', email: 'e.miller@calonia.com', phone: '555-0103', role: 'Cardiologist', scheduleStart: '10:00', scheduleEnd: '18:00', status: 'Active', leaves: [] },
];

export default function Doctors() {
  const [doctors, setDoctors] = useState(INITIAL_DOCTORS);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [blockingDoctorId, setBlockingDoctorId] = useState('');
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [errors, setErrors] = useState({});

  const [doctorForm, setDoctorForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '', scheduleStart: '09:00', scheduleEnd: '17:00' });
  const [blockForm, setBlockForm] = useState({ reason: '', date: '', notes: '' }); // Default reason empty

  const handleOpenAdd = () => { setEditingDoctor(null); setDoctorForm({ firstName: '', lastName: '', email: '', phone: '', role: '', scheduleStart: '09:00', scheduleEnd: '17:00' }); setErrors({}); setIsDoctorModalOpen(true); };
  const handleOpenEdit = (doc) => { setEditingDoctor(doc); setDoctorForm({ ...doc }); setErrors({}); setIsDoctorModalOpen(true); };
  const handleDeleteClick = (doc) => { setDoctorToDelete(doc); };
  const confirmDelete = () => { if (doctorToDelete) { setDoctors(doctors.filter(d => d.id !== doctorToDelete.id)); setDoctorToDelete(null); } };

  const handleSaveDoctor = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!doctorForm.firstName) newErrors.firstName = "First Name is required";
    if (!doctorForm.lastName) newErrors.lastName = "Last Name is required";
    if (!doctorForm.email) newErrors.email = "Email is required";
    if (!doctorForm.role) newErrors.role = "Specialization is required";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    if (editingDoctor) { setDoctors(doctors.map(d => d.id === editingDoctor.id ? { ...d, ...doctorForm } : d)); } 
    else { const newId = Math.max(...doctors.map(d => d.id), 0) + 1; setDoctors([...doctors, { id: newId, status: 'Active', leaves: [], ...doctorForm }]); }
    setIsDoctorModalOpen(false);
  };

  const handleOpenBlock = (specificId = '') => { setBlockingDoctorId(specificId); setBlockForm({ reason: '', date: '', notes: '' }); setErrors({}); setIsBlockModalOpen(true); };
  
  const handleSaveBlock = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!blockingDoctorId) newErrors.doctor = "Please select a doctor";
    if (!blockForm.reason) newErrors.reason = "Please select a reason"; // Validation for reason
    if (!blockForm.date) newErrors.date = "Date is required";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setDoctors(doctors.map(d => { if (d.id === parseInt(blockingDoctorId)) { return { ...d, leaves: [...d.leaves, { date: blockForm.date, reason: blockForm.reason }] }; } return d; }));
    setIsBlockModalOpen(false);
  };

  const handleRemoveLeave = (docId, leaveIndex) => { setDoctors(doctors.map(d => { if (d.id === docId) { const newLeaves = [...d.leaves]; newLeaves.splice(leaveIndex, 1); return { ...d, leaves: newLeaves }; } return d; })); };
  const filteredDoctors = doctors.filter(d => `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || d.role.toLowerCase().includes(searchTerm.toLowerCase()));

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
            <div className="doc-header"><div className="doc-avatar">{doc.firstName[0]}{doc.lastName[0]}</div><div className="doc-info"><h3>Dr. {doc.firstName} {doc.lastName}</h3><span className="doc-specialty">{doc.role}</span></div><span className={`status-badge ${doc.leaves.length > 0 ? 'status-leave' : 'status-active'}`}>{doc.leaves.length > 0 ? 'On Leave' : 'Active'}</span></div>
            <div className="doc-body">
              <div className="info-row"><Mail size={14} className="info-icon"/> {doc.email}</div><div className="info-row"><Phone size={14} className="info-icon"/> {doc.phone}</div>
              <div className="schedule-mini"><div className="schedule-title">Weekly Schedule</div><div className="info-row"><Clock size={14} className="info-icon"/> <span className="schedule-time">Mon - Fri: {doc.scheduleStart} - {doc.scheduleEnd}</span></div></div>
              {doc.leaves.length > 0 && ( <div><div className="schedule-title" style={{marginTop: '0.5rem'}}>Upcoming Leaves</div><div className="leaves-list">{doc.leaves.map((leave, idx) => ( <div key={idx} className="leave-tag"><span>{new Date(leave.date).toLocaleDateString()} - {leave.reason}</span><button onClick={() => handleRemoveLeave(doc.id, idx)} style={{border:'none', background:'none', cursor:'pointer', color:'#c2410c'}}><X size={12}/></button></div> ))}</div></div> )}
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
                    {/* ADDED PLACEHOLDERS */}
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
                    {/* ADDED REQUIRED AND EMPTY OPTION */}
                    <select 
                      className="form-control" 
                      style={{ borderColor: errors.doctor ? 'var(--danger)' : 'var(--border)' }}
                      value={blockingDoctorId} 
                      onChange={e => { setBlockingDoctorId(e.target.value); setErrors({...errors, doctor: null}); }}
                      disabled={!!blockingDoctorId && filteredDoctors.find(d => d.id === parseInt(blockingDoctorId))} 
                      required
                    > 
                      <option value="">-- Choose Doctor --</option> {doctors.map(d => ( <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option> ))} 
                    </select>
                    {errors.doctor && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.doctor}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reason</label>
                    <select className="form-control" required value={blockForm.reason} onChange={e => setBlockForm({...blockForm, reason: e.target.value})}>
                      <option value="">Select Reason...</option> {/* Placeholder */}
                      <option>Personal Leave</option><option>Emergency</option><option>Holiday</option><option>Conference</option>
                    </select>
                    {errors.reason && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>Please select a reason</span>}
                  </div>
                  <div className="form-group"><label className="form-label">Date</label><input required type="date" className="form-control" style={{ borderColor: errors.date ? 'var(--danger)' : 'var(--border)' }} value={blockForm.date} onChange={e => { setBlockForm({...blockForm, date: e.target.value}); setErrors({...errors, date: null}); }}/>{errors.date && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.date}</span>}</div>
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