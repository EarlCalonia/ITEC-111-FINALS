import React, { useState } from 'react';
import '../styles/Doctors.css';
import { Plus, Edit2, Trash2, X, Search, Phone, Mail, Clock, ShieldAlert } from 'lucide-react';

// Initial Mock Data
const INITIAL_DOCTORS = [
  { 
    id: 1, 
    firstName: 'James',
    lastName: 'Johnson',
    email: 'j.johnson@calonia.com',
    phone: '555-0101',
    role: 'General Practitioner', 
    scheduleStart: '09:00',
    scheduleEnd: '17:00',
    status: 'Active',
    leaves: []
  },
  { 
    id: 2, 
    firstName: 'Sarah',
    lastName: 'Davis',
    email: 's.davis@calonia.com',
    phone: '555-0102',
    role: 'Pediatrician', 
    scheduleStart: '08:00',
    scheduleEnd: '16:00',
    status: 'Active',
    leaves: [
      { date: '2025-11-20', reason: 'Personal Leave' }
    ]
  },
  { 
    id: 3, 
    firstName: 'Emily',
    lastName: 'Miller',
    email: 'e.miller@calonia.com',
    phone: '555-0103',
    role: 'Cardiologist', 
    scheduleStart: '10:00',
    scheduleEnd: '18:00',
    status: 'Active',
    leaves: []
  },
];

export default function Doctors() {
  // State
  const [doctors, setDoctors] = useState(INITIAL_DOCTORS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null); // Null = Add Mode
  const [blockingDoctorId, setBlockingDoctorId] = useState(''); // For the select dropdown

  // Forms
  const [doctorForm, setDoctorForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: '', scheduleStart: '09:00', scheduleEnd: '17:00'
  });
  
  const [blockForm, setBlockForm] = useState({
    reason: 'Personal Leave', date: '', notes: ''
  });

  // --- ACTIONS ---

  const handleOpenAdd = () => {
    setEditingDoctor(null);
    setDoctorForm({ firstName: '', lastName: '', email: '', phone: '', role: '', scheduleStart: '09:00', scheduleEnd: '17:00' });
    setIsDoctorModalOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingDoctor(doc);
    setDoctorForm({ ...doc });
    setIsDoctorModalOpen(true);
  };

  const handleDelete = (id) => {
    if(window.confirm('Are you sure you want to remove this doctor?')) {
      setDoctors(doctors.filter(d => d.id !== id));
    }
  };

  const handleSaveDoctor = (e) => {
    e.preventDefault();
    if (editingDoctor) {
      // Update Logic
      setDoctors(doctors.map(d => d.id === editingDoctor.id ? { ...d, ...doctorForm } : d));
    } else {
      // Create Logic
      const newId = Math.max(...doctors.map(d => d.id), 0) + 1;
      setDoctors([...doctors, { id: newId, status: 'Active', leaves: [], ...doctorForm }]);
    }
    setIsDoctorModalOpen(false);
  };

  const handleOpenBlock = (specificId = '') => {
    setBlockingDoctorId(specificId); // If clicked from card, pre-select. If from top btn, empty.
    setBlockForm({ reason: 'Personal Leave', date: '', notes: '' });
    setIsBlockModalOpen(true);
  };

  const handleSaveBlock = (e) => {
    e.preventDefault();
    if (!blockingDoctorId) {
      alert("Please select a doctor");
      return;
    }
    
    // Add leave to the specific doctor's leaves array
    setDoctors(doctors.map(d => {
      if (d.id === parseInt(blockingDoctorId)) {
        return { 
          ...d, 
          leaves: [...d.leaves, { date: blockForm.date, reason: blockForm.reason }] 
        };
      }
      return d;
    }));

    setIsBlockModalOpen(false);
  };

  const handleRemoveLeave = (docId, leaveIndex) => {
    setDoctors(doctors.map(d => {
      if (d.id === docId) {
        const newLeaves = [...d.leaves];
        newLeaves.splice(leaveIndex, 1);
        return { ...d, leaves: newLeaves };
      }
      return d;
    }));
  };

  // Search Logic
  const filteredDoctors = doctors.filter(d => 
    `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      
      {/* --- 1. UNIFIED HEADER (Match Patients/Appointments) --- */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Doctor Availability</h2>
          <p className="page-subtitle">Manage profiles, schedules, and time-off</p>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          <button 
            className="btn btn-outline" 
            style={{color: 'var(--warning)', borderColor: 'var(--warning)'}} 
            onClick={() => handleOpenBlock('')}
          >
            <ShieldAlert size={18} /> Block Time
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> Add Doctor
          </button>
        </div>
      </div>

      {/* --- 2. UNIFIED FILTER CARD --- */}
      <div className="dashboard-filters-card">
        <div className="dashboard-filters-row">
          {/* Search Input taking full width */}
          <div className="dashboard-filter-group" style={{ gridColumn: '1 / -1' }}>
            <label>Search Doctors</label>
            <div className="filter-input-wrapper">
              <Search size={16} className="filter-input-icon" />
              <input 
                type="text" 
                placeholder="Search by name or specialization..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Grid Layout */}
      <div className="doctors-grid">
        {filteredDoctors.map((doc) => (
          <div key={doc.id} className="doctor-card">
            {/* Card Header */}
            <div className="doc-header">
              <div className="doc-avatar">
                {doc.firstName[0]}{doc.lastName[0]}
              </div>
              <div className="doc-info">
                <h3>Dr. {doc.firstName} {doc.lastName}</h3>
                <span className="doc-specialty">{doc.role}</span>
              </div>
              <span className={`status-badge ${doc.leaves.length > 0 ? 'status-leave' : 'status-active'}`}>
                {doc.leaves.length > 0 ? 'On Leave' : 'Active'}
              </span>
            </div>

            {/* Card Body */}
            <div className="doc-body">
              <div className="info-row">
                <Mail size={14} className="info-icon"/> {doc.email}
              </div>
              <div className="info-row">
                <Phone size={14} className="info-icon"/> {doc.phone}
              </div>

              <div className="schedule-mini">
                <div className="schedule-title">Weekly Schedule</div>
                <div className="info-row">
                  <Clock size={14} className="info-icon"/> 
                  <span className="schedule-time">Mon - Fri: {doc.scheduleStart} - {doc.scheduleEnd}</span>
                </div>
              </div>

              {/* Leaves Section */}
              {doc.leaves.length > 0 && (
                <div>
                  <div className="schedule-title" style={{marginTop: '0.5rem'}}>Upcoming Leaves</div>
                  <div className="leaves-list">
                    {doc.leaves.map((leave, idx) => (
                      <div key={idx} className="leave-tag">
                        <span>{new Date(leave.date).toLocaleDateString()} - {leave.reason}</span>
                        <button onClick={() => handleRemoveLeave(doc.id, idx)} style={{border:'none', background:'none', cursor:'pointer', color:'#c2410c'}}><X size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="doc-footer">
              <button className="btn-outline" style={{fontSize:'0.8rem', padding:'4px 8px'}} onClick={() => handleOpenBlock(doc.id)}>
                + Add Leave
              </button>
              <div className="footer-actions">
                <button className="icon-btn" title="Edit" onClick={() => handleOpenEdit(doc)}><Edit2 size={16}/></button>
                <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(doc.id)}><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL 1: ADD / EDIT DOCTOR --- */}
      {isDoctorModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontWeight: 'bold' }}>{editingDoctor ? 'Edit Profile' : 'Add New Doctor'}</h3>
              <button onClick={() => setIsDoctorModalOpen(false)} className="modal-close"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveDoctor}>
              <div className="modal-body">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input required className="form-control" value={doctorForm.firstName} onChange={e => setDoctorForm({...doctorForm, firstName: e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input required className="form-control" value={doctorForm.lastName} onChange={e => setDoctorForm({...doctorForm, lastName: e.target.value})}/>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Email</label><input required type="email" className="form-control" value={doctorForm.email} onChange={e => setDoctorForm({...doctorForm, email: e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Phone</label><input required className="form-control" value={doctorForm.phone} onChange={e => setDoctorForm({...doctorForm, phone: e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Specialization</label><input required className="form-control" placeholder="e.g. General Practitioner" value={doctorForm.role} onChange={e => setDoctorForm({...doctorForm, role: e.target.value})}/></div>
                
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  <div className="form-group"><label className="form-label">Shift Start</label><input type="time" className="form-control" value={doctorForm.scheduleStart} onChange={e => setDoctorForm({...doctorForm, scheduleStart: e.target.value})}/></div>
                  <div className="form-group"><label className="form-label">Shift End</label><input type="time" className="form-control" value={doctorForm.scheduleEnd} onChange={e => setDoctorForm({...doctorForm, scheduleEnd: e.target.value})}/></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsDoctorModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: BLOCK TIME / ADD LEAVE --- */}
      {isBlockModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontWeight: 'bold' }}>Block Time Slot</h3>
              <button onClick={() => setIsBlockModalOpen(false)} className="modal-close"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveBlock}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Doctor</label>
                  <select 
                    className="form-control" 
                    value={blockingDoctorId} 
                    onChange={e => setBlockingDoctorId(e.target.value)}
                    disabled={!!blockingDoctorId && filteredDoctors.find(d => d.id === parseInt(blockingDoctorId))} // Optional: disable if pre-selected
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <select className="form-control" value={blockForm.reason} onChange={e => setBlockForm({...blockForm, reason: e.target.value})}>
                    <option>Personal Leave</option>
                    <option>Emergency</option>
                    <option>Holiday</option>
                    <option>Conference</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input required type="date" className="form-control" value={blockForm.date} onChange={e => setBlockForm({...blockForm, date: e.target.value})}/>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea className="form-control" placeholder="Additional notes..." value={blockForm.notes} onChange={e => setBlockForm({...blockForm, notes: e.target.value})}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsBlockModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Block</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}