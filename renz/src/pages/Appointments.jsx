import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Calendar as CalendarIcon, X, Clock, Mail, FileText, Plus, Search, ChevronDown } from 'lucide-react';

// Mock Data
const INITIAL_APPOINTMENTS = [
  { id: 1, time: '09:00 AM', duration: '30 min', patient: 'John Smith', phone: '555-0101', email: 'john.smith@email.com', doc: 'Dr. Johnson', type: 'General Checkup', notes: 'Annual checkup, feeling well', status: 'Confirmed', date: '2025-11-24' },
  { id: 2, time: '10:30 AM', duration: '45 min', patient: 'Sarah Williams', phone: '555-0102', email: 'sarah.w@email.com', doc: 'Dr. Davis', type: 'Pediatric Review', notes: 'Follow-up on treatment', status: 'Pending', date: '2025-11-24' },
  { id: 3, time: '02:00 PM', duration: '60 min', patient: 'Mike Brown', phone: '555-0103', email: 'mike.brown@email.com', doc: 'Dr. Miller', type: 'Heart Screening', notes: 'Pre-surgical screening', status: 'Completed', date: '2025-11-24' },
];

// Backend-Ready Data
const PATIENTS_DB = [
  { id: 101, name: 'John Smith' }, { id: 102, name: 'Sarah Williams' }, { id: 103, name: 'Michael Brown' },
  { id: 104, name: 'Emily Davis' }, { id: 105, name: 'Robert Wilson' }, { id: 106, name: 'Lisa Chen' },
  { id: 107, name: 'David Park' }, { id: 108, name: 'Sophia Turner' }
];

const DOCTORS_DB = [
  { id: 1, name: 'Dr. Johnson' }, { id: 2, name: 'Dr. Davis' }, { id: 3, name: 'Dr. Miller' }
];

const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'];

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Appointments() {
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || getTodayString()); 
  const [selectedAppointments, setSelectedAppointments] = useState(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [selectedApt, setSelectedApt] = useState(null);
  const [aptToDelete, setAptToDelete] = useState(null);

  const [formData, setFormData] = useState({ patient: '', doc: '', date: '', time: '', notes: '', status: 'Pending' });
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  
  // NEW: Error State for Validation
  const [errors, setErrors] = useState({});

  const filteredPatientsList = PATIENTS_DB.filter(p => p.name.toLowerCase().includes(formData.patient.toLowerCase()));

  useEffect(() => {
    const urlDate = searchParams.get('date');
    if (urlDate) setDateFilter(urlDate);
  }, [searchParams]);

  const isSlotBooked = (slotTime) => {
    if (!formData.doc) return false;
    return appointments.some(apt => apt.date === formData.date && apt.doc === formData.doc && apt.time === slotTime && apt.id !== selectedApt?.id);
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const searchMatch = apt.patient.toLowerCase().includes(searchTerm.toLowerCase()) || apt.type.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || apt.status === statusFilter;
      const doctorMatch = doctorFilter === 'all' || apt.doc === doctorFilter;
      const dateMatch = !dateFilter || apt.date === dateFilter;
      let timeMatch = true;
      if (timeFilter !== 'all') {
         const hour = parseInt(apt.time.split(':')[0]);
         const isPM = apt.time.includes('PM');
         const realHour = (isPM && hour !== 12) ? hour + 12 : (hour === 12 && !isPM) ? 0 : hour;
         if (timeFilter === 'morning') timeMatch = realHour < 12;
         if (timeFilter === 'afternoon') timeMatch = realHour >= 12;
      }
      return searchMatch && statusMatch && doctorMatch && timeMatch && dateMatch; 
    });
  }, [appointments, searchTerm, statusFilter, timeFilter, doctorFilter, dateFilter]);

  const toggleSelection = (id) => {
    const newSelection = new Set(selectedAppointments);
    if (newSelection.has(id)) newSelection.delete(id); else newSelection.add(id);
    setSelectedAppointments(newSelection);
  };

  const handleView = (apt) => { setSelectedApt(apt); setModalMode('view'); setIsModalOpen(true); };
  
  const handleReschedule = (apt) => {
    setSelectedApt(apt);
    setFormData({ patient: apt.patient, doc: apt.doc, date: apt.date, time: apt.time, notes: apt.notes, status: apt.status });
    setErrors({});
    setModalMode('reschedule');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedApt(null);
    setFormData({ patient: '', doc: '', date: getTodayString(), time: '', notes: '', status: 'Pending' });
    setErrors({});
    setModalMode('create');
    setIsModalOpen(true);
  };

  // FIXED: Validation Logic
  const handleSave = (e) => {
    e.preventDefault();
    
    // 1. Check for errors
    const newErrors = {};
    if (!formData.patient) newErrors.patient = "Please select a patient";
    if (!formData.doc) newErrors.doc = "Please select a doctor";
    if (!formData.time) newErrors.time = "Please select a time slot";

    // 2. If errors exist, show them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 3. Proceed if valid
    if (modalMode === 'reschedule' && selectedApt) {
      setAppointments(appointments.map(a => a.id === selectedApt.id ? { ...a, ...formData } : a));
    } else if (modalMode === 'create') {
      const newId = Math.max(...appointments.map(a => a.id), 0) + 1;
      const newApt = { id: newId, duration: '30 min', email: 'patient@email.com', type: 'General Visit', phone: '555-0000', ...formData };
      setAppointments([...appointments, newApt]);
    }
    setIsModalOpen(false);
  };

  const handleCancelClick = (apt) => setAptToDelete(apt);
  const confirmDelete = () => { if (aptToDelete) { setAppointments(appointments.filter(a => a.id !== aptToDelete.id)); setAptToDelete(null); } };

  return (
    <div className="animate-fade-in"> 
      <div className="page-header">
        <div><h2 className="page-title">Appointments</h2><p className="page-subtitle">Manage your schedule and bookings</p></div>
        <button onClick={handleCreate} className="btn btn-primary"><Plus size={18} /> New Appointment</button>
      </div>

      <div className="dashboard-filters-card">
        <div className="dashboard-filters-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
          <div className="dashboard-filter-group"><label>Search</label><div className="filter-input-wrapper"><Search size={16} className="filter-input-icon" /><input type="text" placeholder="Patient or Type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
          <div className="dashboard-filter-group"><label>Date</label><input type="date" className="form-control" style={{height: '40px'}} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} /></div>
          <div className="dashboard-filter-group"><label>Status</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All Status</option><option value="Confirmed">Confirmed</option><option value="Pending">Pending</option><option value="Completed">Completed</option></select></div>
          <div className="dashboard-filter-group"><label>Time</label><select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}><option value="all">All Day</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option></select></div>
          <div className="dashboard-filter-group"><label>Doctor</label><select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}><option value="all">All Doctors</option>{DOCTORS_DB.map(doc => <option key={doc.id} value={doc.name}>{doc.name}</option>)}</select></div>
        </div>
      </div>

      {selectedAppointments.size > 0 && (
        <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f9ff', borderColor: 'var(--primary-color)' }}>
          <span style={{fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-color)'}}>{selectedAppointments.size} selected</span>
          <div style={{display: 'flex', gap: '8px'}}><button className="btn-outline" style={{padding:'6px 12px', fontSize:'0.85rem', background: 'white'}}>Mark Complete</button><button className="btn-outline" style={{padding:'6px 12px', fontSize:'0.85rem', background: 'white', color: 'var(--danger)', borderColor: '#fecaca'}}>Cancel Selection</button></div>
        </div>
      )}
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
          <table>
            <thead><tr><th style={{width: '40px', paddingLeft: '1.25rem'}}><input type="checkbox" onChange={(e) => setSelectedAppointments(e.target.checked ? new Set(filteredAppointments.map(a => a.id)) : new Set())} /></th><th style={{minWidth: '90px'}}>Time</th><th style={{minWidth: '140px'}}>Patient</th><th style={{minWidth: '160px', width: '35%'}}>Visit Info</th><th style={{minWidth: '110px'}}>Doctor</th><th style={{minWidth: '100px'}}>Status</th><th style={{textAlign:'right', paddingRight: '1.5rem'}}>ACTIONS</th></tr></thead>
            <tbody>
              {filteredAppointments.length === 0 ? ( <tr><td colSpan="7" style={{textAlign:'center', padding:'2rem', color:'#6b7280'}}>No appointments found for {dateFilter || 'this filter'}.</td></tr> ) : filteredAppointments.map((apt) => (
                <tr key={apt.id} style={{backgroundColor: selectedAppointments.has(apt.id) ? '#f8fafc' : 'transparent'}}>
                  <td style={{paddingLeft: '1.25rem'}}><input type="checkbox" checked={selectedAppointments.has(apt.id)} onChange={() => toggleSelection(apt.id)} /></td>
                  <td><div style={{fontWeight: '700', color: 'var(--text-dark)', whiteSpace: 'nowrap'}}>{apt.time}</div><div style={{fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px'}}><Clock size={12}/> {apt.duration}</div></td>
                  <td><div style={{fontWeight: '600', color: 'var(--primary-color)'}}>{apt.patient}</div><div style={{fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', whiteSpace: 'nowrap'}}><Mail size={12}/> {apt.email}</div></td>
                  <td><div style={{fontWeight: '500', fontSize: '0.9rem'}}>{apt.type}</div><div style={{fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', alignItems: 'flex-start', gap: '4px', marginTop: '2px', lineHeight: '1.3'}}><FileText size={12} style={{marginTop:'2px', flexShrink: 0}}/> <span>{apt.notes}</span></div></td>
                  <td style={{color: 'var(--text-dark)', fontWeight: '500', whiteSpace: 'nowrap'}}>{apt.doc}</td>
                  <td><span className={`badge ${apt.status === 'Confirmed' ? 'badge-green' : apt.status === 'Pending' ? 'badge-blue' : 'badge-completed'}`}>{apt.status}</span></td>
                  <td style={{textAlign: 'right', paddingRight: '1.5rem'}}>
                    <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                      <button className="icon-btn view" title="View Details" onClick={() => handleView(apt)}><Eye size={18}/></button>
                      <button className="icon-btn edit" title="Reschedule" onClick={() => handleReschedule(apt)}><CalendarIcon size={18}/></button>
                      <button className="icon-btn delete" title="Cancel" onClick={() => handleCancelClick(apt)}><X size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header"><h3 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{modalMode === 'view' ? 'Appointment Details' : modalMode === 'reschedule' ? 'Reschedule Appointment' : 'New Appointment'}</h3><button onClick={() => setIsModalOpen(false)} className="modal-close"><X size={20} /></button></div>
            
            {/* VIEW MODE (Unchanged) */}
            {modalMode === 'view' && selectedApt && (
              <div className="modal-body">
                <div className="view-details">
                  <div className="detail-group"><div className="detail-label">Patient</div><div className="detail-value" style={{fontSize: '1.4rem', fontWeight: '700', color: 'var(--primary-color)'}}>{selectedApt.patient}</div><div className="detail-value" style={{fontSize: '0.9rem', color: 'var(--text-light)'}}>{selectedApt.email}</div></div>
                  <div className="form-row-2">
                    <div className="detail-group"><div className="detail-label">Date & Time</div><div className="detail-value">{selectedApt.date} at {selectedApt.time}</div></div>
                    <div className="detail-group"><div className="detail-label">Doctor</div><div className="detail-value">{selectedApt.doc}</div></div>
                  </div>
                  <div className="detail-group"><div className="detail-label">Purpose</div><div className="detail-value">{selectedApt.type}</div><div className="detail-value" style={{fontSize: '0.9rem', color: 'var(--text-light)'}}>{selectedApt.notes}</div></div>
                  <div className="detail-group"><div className="detail-label">Status</div><span className={`badge ${selectedApt.status === 'Confirmed' ? 'badge-green' : selectedApt.status === 'Pending' ? 'badge-blue' : 'badge-completed'}`}>{selectedApt.status}</span></div>
                </div>
                <div className="modal-footer"><button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Close</button><button className="btn btn-primary" onClick={() => handleReschedule(selectedApt)}>Edit Booking</button></div>
              </div>
            )}

            {/* CREATE / RESCHEDULE MODE */}
            {(modalMode === 'create' || modalMode === 'reschedule') && (
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-group" style={{position: 'relative'}}>
                      <label className="form-label">Select Patient</label>
                      <div style={{position: 'relative'}}>
                        {/* INPUT WITH ERROR STATE */}
                        <input 
                          className="form-control" 
                          style={{ borderColor: errors.patient ? 'var(--danger)' : 'var(--border)' }}
                          value={formData.patient} 
                          onChange={e => { setFormData({...formData, patient: e.target.value}); setIsPatientDropdownOpen(true); setErrors({...errors, patient: null}); }} 
                          onFocus={() => setIsPatientDropdownOpen(true)} 
                          onBlur={() => setTimeout(() => setIsPatientDropdownOpen(false), 200)} 
                          placeholder="Search patient name..." 
                          autoComplete="off" 
                        />
                        <ChevronDown size={16} style={{position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-light)', pointerEvents:'none'}}/>
                        {isPatientDropdownOpen && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            {filteredPatientsList.length > 0 ? filteredPatientsList.map((patient) => (
                              <div key={patient.id} onMouseDown={() => { setFormData({...formData, patient: patient.name}); setIsPatientDropdownOpen(false); setErrors({...errors, patient: null}); }} style={{ padding: '10px 12px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-dark)', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>{patient.name}</div>
                            )) : ( <div style={{padding: '12px', fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic'}}>No patients found.</div> )}
                          </div>
                        )}
                      </div>
                      {/* ERROR MESSAGE */}
                      {errors.patient && <span style={{fontSize:'0.75rem', color:'var(--danger)', marginTop:'4px'}}>{errors.patient}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Doctor</label>
                      <select 
                        className="form-control" 
                        style={{ 
                          /* If doc is empty string, make text Gray. Otherwise, Standard Dark. */
                          color: formData.doc === "" ? '#94a3b8' : 'var(--text-dark)',
                          borderColor: errors.doc ? 'var(--danger)' : 'var(--border)'
                        }}
                        value={formData.doc} 
                        onChange={e => { 
                          setFormData({...formData, doc: e.target.value}); 
                          setErrors({...errors, doc: null}); 
                        }}
                        required
                      >
                        <option value="" disabled>Select a doctor...</option>
                        {DOCTORS_DB.map(doc => (
                          <option key={doc.id} value={doc.name} style={{ color: 'var(--text-dark)' }}>
                            {doc.name}
                          </option>
                        ))}
                      </select>
                      {errors.doc && <span style={{fontSize:'0.75rem', color:'var(--danger)', marginTop:'4px'}}>{errors.doc}</span>}
                    </div>
                    <div className="form-group"><label className="form-label">Select Time</label><div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px'}}>{TIME_SLOTS.map(time => { const booked = isSlotBooked(time); const isSelected = formData.time === time; return ( <button type="button" key={time} disabled={booked || !formData.doc} onClick={() => { setFormData({...formData, time}); setErrors({...errors, time: null}); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 4px', borderRadius: '8px', border: '1px solid', borderColor: isSelected ? 'var(--primary-color)' : booked ? 'transparent' : 'var(--border)', backgroundColor: isSelected ? 'var(--primary-color)' : booked ? '#f3f4f6' : 'white', color: isSelected ? 'white' : booked ? '#9ca3af' : 'var(--text-dark)', cursor: (booked || !formData.doc) ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', fontWeight: isSelected ? '600' : '400', boxShadow: isSelected ? '0 2px 4px rgba(59, 130, 246, 0.25)' : 'none', minHeight: '45px', opacity: !formData.doc ? 0.6 : 1 }} > <span style={{ fontSize: '0.85rem' }}>{time}</span> {booked && ( <span style={{fontSize: '0.6rem', color: '#ef4444', fontWeight: '700', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Booked</span> )} </button> ); })}</div>
                    {!formData.doc ? <span style={{fontSize:'0.75rem', color:'#94a3b8', marginTop:'4px'}}>* Select a doctor to see availability</span> : errors.time ? <span style={{fontSize:'0.75rem', color:'var(--danger)', marginTop:'4px'}}>{errors.time}</span> : null}</div>
                    <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
                  </div>
                </div>
                {/* BUTTON ENABLED ALWAYS - VALIDATION HAPPENS ON CLICK */}
                <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">{modalMode === 'reschedule' ? 'Update Appointment' : 'Confirm Booking'}</button></div>
              </form>
            )}
          </div>
        </div>
      )}

      {aptToDelete && (
        <div className="modal-overlay" onClick={() => setAptToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
             <div className="modal-header"><h3 style={{ fontWeight: 'bold', color: 'var(--danger)' }}>Cancel Appointment</h3><button onClick={() => setAptToDelete(null)} className="modal-close"><X size={20} /></button></div>
            <div className="modal-body"><p className="modal-text">Are you sure you want to cancel the appointment for <strong>{aptToDelete.patient}</strong>? This action cannot be undone.</p></div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setAptToDelete(null)}>Keep</button><button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', boxShadow: 'none' }} onClick={confirmDelete}>Cancel Appointment</button></div>
          </div>
        </div>
      )}
    </div>
  );
}