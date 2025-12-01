import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Calendar as CalendarIcon, X, Clock, Mail, FileText, Plus, Search, ChevronDown, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import '../styles/Appointments.css';

// Constants
const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'];

// UPDATED: Predefined list of common visit types for quick selection
const VISIT_TYPES = [
  'Annual Wellness Exam',
  'New Patient Visit (Initial)',
  'Follow-up Consultation',
  'Acute Illness (Same-Day)',
  'Chronic Disease Management',
  'Vaccination / Immunization',
  'Sports Physical',
  'Pre-operative Clearance',
  'Hospital Follow-up',
  'Lab Results Review',
  'Maternity / Prenatal Visit',
];

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Appointments() {
  const [searchParams] = useSearchParams();
  
  // 1. DATA STATES
  const [appointments, setAppointments] = useState([]);
  const [patientsList, setPatientsList] = useState([]); 
  const [doctorsList, setDoctorsList] = useState([]);   

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || getTodayString()); 

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [selectedApt, setSelectedApt] = useState(null);
  const [aptToDelete, setAptToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({ patient_id: '', doctor_id: '', date: '', time: '', notes: '', status: 'Pending', type: '' }); // Initial type is set to ''
  
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  // NEW STATE for Visit Type Dropdown
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false); 
  const [patientSearch, setPatientSearch] = useState(''); 
  const [errors, setErrors] = useState({});

  // Message Box State
  const [messageBox, setMessageBox] = useState({ show: false, title: '', message: '', type: 'success' });
  const closeMessageBox = () => setMessageBox({ ...messageBox, show: false });

  // 2. FETCH DATA FROM API
  const fetchAllData = async () => {
    try {
        // Helper function to safely parse response
        const safeFetch = async (url) => {
            try {
                const res = await fetch(url);
                if (!res.ok) return [];
                const data = await res.json();
                return Array.isArray(data) ? data : [];
            } catch (e) {
                console.warn(`Failed to fetch ${url}`, e);
                return [];
            }
        };

        // Fetch all in parallel
        const [aptData, patData, docData] = await Promise.all([
            safeFetch('http://localhost:5000/api/appointments'),
            safeFetch('http://localhost:5000/api/patients'),
            safeFetch('http://localhost:5000/api/doctors')
        ]);

        setAppointments(aptData);
        setPatientsList(patData);
        setDoctorsList(docData);

    } catch (err) {
        console.error("Critical error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const urlDate = searchParams.get('date');
    if (urlDate) setDateFilter(urlDate);
  }, [searchParams]);


  const filteredPatientsList = patientsList.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()));

  // NEW: Memoized Filtered Visit Types
  const filteredVisitTypes = useMemo(() => {
    if (!formData.type) return VISIT_TYPES;
    const term = formData.type.toLowerCase();
    return VISIT_TYPES.filter(type => type.toLowerCase().includes(term));
  }, [formData.type]);

  // --- CHECK IF SLOT IS IN THE PAST ---
  const isTimeSlotPast = (slotTime, selectedDate) => {
    if (!selectedDate) return false;
    const todayStr = getTodayString();
    if (selectedDate < todayStr) return true;
    if (selectedDate > todayStr) return false;
    const now = new Date();
    const [timePart, modifier] = slotTime.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    const slotDate = new Date();
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate < now;
  };

  // --- CHECK LEAVE STATUS (Used by dropdown and time slots) ---
  const getDoctorLeaveStatus = (selectedDate, doctorId) => {
    if (!selectedDate || !doctorId) return null;
    const doctor = doctorsList.find(d => d.id === parseInt(doctorId));
    if (!doctor || !doctor.leaves) return null;
    const leave = doctor.leaves.find(l => {
        const dbDate = new Date(l.date);
        const year = dbDate.getFullYear();
        const month = String(dbDate.getMonth() + 1).padStart(2, '0');
        const day = String(dbDate.getDate()).padStart(2, '0');
        const formattedDbDate = `${year}-${month}-${day}`;
        return formattedDbDate === selectedDate;
    });
    return leave ? leave.reason : null; 
  };

  // --- NEW: CHECK IF SLOT IS WITHIN DOCTOR'S SHIFT ---
  const isTimeWithinShift = (slotTime, doctorId) => {
    if (!doctorId) return true; 
    const doctor = doctorsList.find(d => d.id === parseInt(doctorId));
    if (!doctor || !doctor.scheduleStart || !doctor.scheduleEnd) return true;

    const [timePart, modifier] = slotTime.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    const slotMinutes = hours * 60 + minutes;

    const [startH, startM] = doctor.scheduleStart.split(':').map(Number);
    const startMinutes = startH * 60 + startM;

    const [endH, endM] = doctor.scheduleEnd.split(':').map(Number);
    const endMinutes = endH * 60 + endM;

    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  };

  const isSlotBooked = (slotTime) => {
    if (!formData.doctor_id) return false;
    return appointments.some(apt => 
        apt.date === formData.date && 
        apt.doctor_id === parseInt(formData.doctor_id) && 
        apt.time === slotTime && 
        apt.id !== selectedApt?.id
    );
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const searchMatch = (apt.patient || '').toLowerCase().includes(searchTerm.toLowerCase()) || (apt.type || '').toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || apt.status === statusFilter;
      const doctorMatch = doctorFilter === 'all' || apt.doc === doctorFilter;
      const dateMatch = !dateFilter || apt.date === dateFilter;
      
      let timeMatch = true;
      if (timeFilter !== 'all' && apt.time) {
         const hour = parseInt(apt.time.split(':')[0]);
         const isPM = apt.time.includes('PM');
         const realHour = (isPM && hour !== 12) ? hour + 12 : (hour === 12 && !isPM) ? 0 : hour;
         if (timeFilter === 'morning') timeMatch = realHour < 12;
         if (timeFilter === 'afternoon') timeMatch = realHour >= 12;
      }
      return searchMatch && statusMatch && doctorMatch && timeMatch && dateMatch; 
    });
  }, [appointments, searchTerm, statusFilter, timeFilter, doctorFilter, dateFilter]);

  const handleView = (apt) => { setSelectedApt(apt); setModalMode('view'); setIsModalOpen(true); };
  
  const handleReschedule = (apt) => {
    if (isEditLocked(apt.status)) return;
    setSelectedApt(apt);
    setPatientSearch(apt.patient); 
    setFormData({ 
        patient_id: apt.patient_id, 
        doctor_id: apt.doctor_id, 
        date: apt.date, 
        time: apt.time, 
        notes: apt.notes, 
        status: apt.status,
        type: apt.type 
    });
    setErrors({});
    setModalMode('reschedule');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedApt(null);
    setPatientSearch('');
    
    // IMPROVEMENT: Set type to '' so all options are shown initially
    setFormData({ patient_id: '', doctor_id: '', date: getTodayString(), time: '', notes: '', status: 'Pending', type: '' }); 
    
    setErrors({});
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.patient_id) newErrors.patient = "Please select a patient from the list";
    if (!formData.doctor_id) newErrors.doc = "Please select a doctor";
    if (!formData.time) newErrors.time = "Please select a time slot";

    const leaveReason = getDoctorLeaveStatus(formData.date, formData.doctor_id);
    if (leaveReason) newErrors.time = `Doctor is unavailable: ${leaveReason}`;
    
    // --- VALIDATION: Check for patient's existing appointment on the same day ---
    const existingPatientAppt = appointments.find(apt => 
        // 1. Check if it's the same patient
        apt.patient_id === parseInt(formData.patient_id) &&
        // 2. Check if it's the same date
        apt.date === formData.date &&
        // 3. Exclude the current appointment if we are in 'reschedule' mode
        apt.id !== selectedApt?.id
    );

    if (existingPatientAppt) {
        newErrors.date = `Patient already has an appointment today at ${existingPatientAppt.time} with ${existingPatientAppt.doc}.`;
    }
    // --- END VALIDATION ---

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    try {
        if (modalMode === 'reschedule' && selectedApt) {
            await fetch(`http://localhost:5000/api/appointments/${selectedApt.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else if (modalMode === 'create') {
            await fetch('http://localhost:5000/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }
        fetchAllData(); 
        setIsModalOpen(false);
        setMessageBox({ show: true, title: 'Success', message: modalMode === 'create' ? 'Appointment booked successfully!' : 'Appointment updated successfully!', type: 'success' });
    } catch (err) {
        console.error("Error saving appointment:", err);
        setMessageBox({ show: true, title: 'Error', message: 'Failed to save appointment.', type: 'error' });
    }
  };

  const handleCancelClick = (apt) => {
    if (apt.status === 'Completed') return; 
    setAptToDelete(apt);
  };

  const confirmDelete = async () => { 
    if (aptToDelete) { 
        try {
            await fetch(`http://localhost:5000/api/appointments/${aptToDelete.id}`, { method: 'DELETE' });
            fetchAllData();
            setAptToDelete(null); 
            setMessageBox({ show: true, title: 'Success', message: 'Appointment cancelled.', type: 'success' });
        } catch (err) {
            console.error("Error deleting:", err);
            setMessageBox({ show: true, title: 'Error', message: 'Failed to cancel appointment.', type: 'error' });
        }
    } 
  };

  const isEditLocked = (status) => status === 'Completed' || status === 'Confirmed';

  return (
    <div className="animate-fade-in"> 
      <div className="page-header">
        <div><h2 className="page-title">Appointments</h2><p className="page-subtitle">Manage your schedule and bookings</p></div>
        <button onClick={handleCreate} className="btn btn-primary"><Plus size={18} /> New Appointment</button>
      </div>

      <div className="dashboard-filters-card">
        {/* FIXED: Balanced Width Grid */}
        <div className="dashboard-filters-row" style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1.5fr', gap: '1rem', width: '100%' }}>
          <div className="dashboard-filter-group"><label>Search</label><div className="filter-input-wrapper"><Search size={16} className="filter-input-icon" /><input type="text" placeholder="Patient or Type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
          <div className="dashboard-filter-group"><label>Date</label><input type="date" className="form-control" style={{height: '40px'}} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} /></div>
          <div className="dashboard-filter-group"><label>Status</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All Status</option><option value="Confirmed">Confirmed</option><option value="Pending">Pending</option><option value="Completed">Completed</option></select></div>
          <div className="dashboard-filter-group"><label>Time</label><select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}><option value="all">All Day</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option></select></div>
          <div className="dashboard-filter-group"><label>Doctor</label><select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}><option value="all">All Doctors</option>{doctorsList.map(doc => <option key={doc.id} value={`Dr. ${doc.lastName}`}>Dr. {doc.lastName}</option>)}</select></div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
          <table>
            <thead>
              {/* FIX: Collapsed the <th> elements onto a single line to remove unwanted whitespace text nodes */}
              <tr>
                <th style={{minWidth: '90px', paddingLeft: '1.25rem'}}>Time</th><th style={{minWidth: '140px', width: '25%'}}>Patient</th><th style={{minWidth: '160px', width: '20%'}}>Visit Info</th><th style={{minWidth: '120px', width: '15%'}}>Doctor</th><th style={{minWidth: '100px'}}>Status</th><th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? ( <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem', color:'#6b7280'}}>No appointments found for {dateFilter || 'this filter'}.</td></tr> ) : filteredAppointments.map((apt) => (
                <tr key={apt.id}>
                  <td><div style={{fontWeight: '700', color: 'var(--text-dark)', whiteSpace: 'nowrap'}}>{apt.time}</div><div style={{fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px'}}><Clock size={12}/> {apt.duration}</div></td>
                  <td><div style={{fontWeight: '600', color: 'var(--primary-color)'}}>{apt.patient}</div><div style={{fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', whiteSpace: 'nowrap'}}><Mail size={12}/> {apt.email || 'N/A'}</div></td>
                  <td><div style={{fontWeight: '500', fontSize: '0.9rem'}}>{apt.type}</div><div style={{fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', alignItems: 'flex-start', gap: '4px', marginTop: '2px', lineHeight: '1.3'}}><FileText size={12} style={{marginTop:'2px', flexShrink: 0}}/> <span>{apt.notes}</span></div></td>
                  <td style={{color: 'var(--text-dark)', fontWeight: '500', whiteSpace: 'nowrap'}}>{apt.doc}</td>
                  <td><span className={`badge ${apt.status === 'Confirmed' ? 'badge-green' : apt.status === 'Pending' ? 'badge-blue' : 'badge-completed'}`}>{apt.status}</span></td>
                  
                  {/* Applied col-actions class for vertical and horizontal centering */}
                  <td className="col-actions">
                    <div className="action-group">
                      <button className="icon-btn view" title="View Details" onClick={() => handleView(apt)}><Eye size={18}/></button>
                      <button className="icon-btn edit" title={isEditLocked(apt.status) ? "Cannot edit locked appointment" : "Reschedule"} onClick={() => handleReschedule(apt)} disabled={isEditLocked(apt.status)} style={{ opacity: isEditLocked(apt.status) ? 0.3 : 1, cursor: isEditLocked(apt.status) ? 'not-allowed' : 'pointer'}}><CalendarIcon size={18}/></button>
                      <button className="icon-btn delete" title={apt.status === 'Completed' ? "Cannot cancel completed appointment" : "Cancel"} onClick={() => handleCancelClick(apt)} disabled={apt.status === 'Completed'} style={{ opacity: apt.status === 'Completed' ? 0.3 : 1, cursor: apt.status === 'Completed' ? 'not-allowed' : 'pointer',}}><X size={18}/></button>
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
          <div className="modal-content booking-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            
            <div className="modal-header">
              <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                {modalMode === 'view' ? 'Appointment Details' : modalMode === 'reschedule' ? 'Reschedule Appointment' : 'New Appointment'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>
            
            {modalMode === 'view' && selectedApt && (
              <>
                <div className="booking-modal-body">
                  <div className="view-details">
                    <div className="detail-group"><div className="detail-label">Patient</div><div className="detail-value" style={{fontSize: '1.4rem', fontWeight: '700', color: 'var(--primary-color)'}}>{selectedApt.patient}</div><div className="detail-value" style={{fontSize: '0.9rem', color: 'var(--text-light)'}}>{selectedApt.email}</div></div>
                    <div className="form-row-2">
                      <div className="detail-group"><div className="detail-label">Date & Time</div><div className="detail-value">{selectedApt.date} at {selectedApt.time}</div></div>
                      <div className="detail-group"><div className="detail-label">Doctor</div><div className="detail-value">{selectedApt.doc}</div></div>
                    </div>
                    <div className="detail-group"><div className="detail-label">Purpose</div><div className="detail-value">{selectedApt.type}</div><div className="detail-value" style={{fontSize: '0.9rem', color: 'var(--text-light)'}}>{selectedApt.notes}</div></div>
                    <div className="detail-group"><div className="detail-label">Status</div><span className={`badge ${selectedApt.status === 'Confirmed' ? 'badge-green' : selectedApt.status === 'Pending' ? 'badge-blue' : 'badge-completed'}`}>{selectedApt.status}</span></div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Close</button>
                  {selectedApt.status === 'Pending' && ( <button className="btn btn-primary" style={{ backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' }} 
                    onClick={async () => { try { await fetch(`http://localhost:5000/api/appointments/${selectedApt.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient_id: selectedApt.patient_id, doctor_id: selectedApt.doctor_id, date: selectedApt.date, time: selectedApt.time, type: selectedApt.type, notes: selectedApt.notes, status: 'Confirmed' }) }); fetchAllData(); setIsModalOpen(false); setMessageBox({ show: true, title: 'Success', message: 'Appointment confirmed.', type: 'success' }); } catch (err) { console.error("Error confirming:", err); } }}>Confirm Appointment</button> )}
                  {selectedApt.status === 'Confirmed' && ( <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }} 
                    onClick={async () => { try { await fetch(`http://localhost:5000/api/appointments/${selectedApt.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient_id: selectedApt.patient_id, doctor_id: selectedApt.doctor_id, date: selectedApt.date, time: selectedApt.time, type: selectedApt.type, notes: selectedApt.notes, status: 'Completed' }) }); fetchAllData(); setIsModalOpen(false); setMessageBox({ show: true, title: 'Success', message: 'Appointment marked as completed.', type: 'success' }); } catch (err) { console.error("Error completing:", err); } }}>Mark Completed</button> )}
                  {!isEditLocked(selectedApt.status) && ( <button className="btn btn-primary" onClick={() => handleReschedule(selectedApt)}>Edit</button> )}
                </div>
              </>
            )}

            {(modalMode === 'create' || modalMode === 'reschedule') && (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="booking-modal-body">
                  <div className="form-grid">
                    <div className="form-group patient-select-wrapper">
                      <label className="form-label">Select Patient</label>
                      <div style={{position: 'relative'}}>
                        <input className="form-control" style={{ borderColor: errors.patient ? 'var(--danger)' : 'var(--border)' }} value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setIsPatientDropdownOpen(true); }} onFocus={() => setIsPatientDropdownOpen(true)} onBlur={() => setTimeout(() => setIsPatientDropdownOpen(false), 200)} placeholder="Search patient name..." autoComplete="off" />
                        <ChevronDown size={16} style={{position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-light)', pointerEvents:'none'}}/>
                        {isPatientDropdownOpen && ( <div className="patient-dropdown-list"> {filteredPatientsList.length > 0 ? filteredPatientsList.map((patient) => ( <div key={patient.id} className="patient-dropdown-item" onMouseDown={() => { setPatientSearch(patient.name); setFormData({...formData, patient_id: patient.id}); setIsPatientDropdownOpen(false); setErrors({...errors, patient: null}); }}>{patient.name}</div> )) : ( <div className="patient-dropdown-empty">No patients found.</div> )} </div> )}
                      </div>
                      {errors.patient && <span style={{fontSize:'0.75rem', color:'var(--danger)', marginTop:'4px'}}>{errors.patient}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Doctor</label>
                      <select 
                        className="form-control" 
                        style={{ 
                          color: formData.doctor_id === "" ? '#94a3b8' : 'var(--text-dark)', 
                          borderColor: errors.doc ? 'var(--danger)' : 'var(--border)' 
                        }} 
                        value={formData.doctor_id} 
                        onChange={e => { 
                          setFormData({...formData, doctor_id: e.target.value}); 
                          setErrors({...errors, doc: null}); 
                        }}
                      >
                        <option value="" disabled>Select a doctor...</option>
                        {doctorsList.map(doc => {
                          const leaveReason = getDoctorLeaveStatus(formData.date, doc.id);
                          const isUnavailable = !!leaveReason;

                          return (
                              <option 
                                  key={doc.id} 
                                  value={doc.id} 
                                  // Disable the option if the doctor is on leave
                                  disabled={isUnavailable} 
                                  style={{ 
                                      // Visually mark as unavailable
                                      color: isUnavailable ? 'var(--danger)' : 'var(--text-dark)',
                                      backgroundColor: isUnavailable ? '#fef2f2' : 'white',
                                      fontStyle: isUnavailable ? 'italic' : 'normal'
                                  }}
                              >
                                  `Dr. ${doc.firstName} ${doc.lastName}` 
                                  {isUnavailable ? ` (On Leave: ${leaveReason})` : ''}
                              </option>
                          );
                        })}
                      </select>
                      {errors.doc && <span style={{fontSize:'0.75rem', color:'var(--danger)', marginTop:'4px'}}>{errors.doc}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={formData.date} 
                        onChange={e => {
                          setFormData({...formData, date: e.target.value, time: ''}); 
                          setErrors({...errors, date: null});
                        }} 
                        min={getTodayString()} 
                        style={{ borderColor: errors.date ? 'var(--danger)' : 'var(--border)' }} // Apply border color based on date error
                      />
                      {errors.date && <span style={{fontSize:'0.75rem', color:'var(--danger)', marginTop:'4px'}}>{errors.date}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Select Time</label>
                      <div className="time-slot-grid">
                        {TIME_SLOTS.map(time => { 
                          const booked = isSlotBooked(time); 
                          const isPast = isTimeSlotPast(time, formData.date);
                          const leaveReason = getDoctorLeaveStatus(formData.date, formData.doctor_id);
                          const isShiftValid = isTimeWithinShift(time, formData.doctor_id);
                          const isSelected = formData.time === time; 
                          const isDisabled = booked || isPast || !!leaveReason || !formData.doctor_id || !formData.date || !isShiftValid;

                          return ( 
                            <button 
                              type="button" 
                              key={time} 
                              disabled={isDisabled} 
                              onClick={() => { setFormData({...formData, time}); setErrors({...errors, time: null}); }} 
                              className={`time-slot-btn ${isSelected ? 'selected' : ''}`}
                              style={{ opacity: isDisabled ? 0.5 : 1 }}
                            > 
                              <span style={{ fontSize: '0.85rem' }}>{time}</span> 
                              {booked && ( <span className="booked-label">Booked</span> )} 
                              {isPast && !booked && ( <span className="booked-label" style={{color:'#94a3b8'}}>Passed</span> )}
                              {!isShiftValid && !leaveReason && ( <span className="booked-label" style={{color:'#94a3b8'}}>Closed</span> )}
                              {leaveReason && !isPast && !booked && (
                                <span className="booked-label" style={{color: 'var(--warning)'}}>{leaveReason}</span>
                              )}
                            </button> 
                          ); 
                        })}
                      </div>
                      
                      {getDoctorLeaveStatus(formData.date, formData.doctor_id) ? (
                        <div style={{marginTop:'8px', color: 'var(--warning)', fontSize: '0.8rem', display:'flex', alignItems:'center', gap:'4px'}}>
                            <AlertCircle size={14}/> Doctor is on leave ({getDoctorLeaveStatus(formData.date, formData.doctor_id)})
                        </div>
                      ) : !formData.doctor_id ? (
                        <span style={{fontSize:'0.75rem', color:'#94a3b8', marginTop:'4px'}}>* Select a doctor and date to see availability</span>
                      ) : errors.time && (
                        <span style={{fontSize:'0.75rem', color:'var(--danger)', marginTop:'4px'}}>{errors.time}</span>
                      )}
                    </div>
                    
                    <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      
                      {/* UPDATED: Type of Visit Input with Custom Searchable Dropdown */}
                      <div className="form-group patient-select-wrapper">
                        <label className="form-label">Type of Visit</label>
                        <div style={{position: 'relative'}}>
                          <input 
                              className="form-control" 
                              value={formData.type} 
                              onChange={e => {
                                  setFormData({...formData, type: e.target.value}); 
                                  setIsTypeDropdownOpen(true);
                              }} 
                              onFocus={() => setIsTypeDropdownOpen(true)}
                              onBlur={() => setTimeout(() => setIsTypeDropdownOpen(false), 200)}
                              placeholder="e.g. General Checkup" // Shortened placeholder to fix overlap
                              autoComplete="off"
                          />
                          <ChevronDown size={16} style={{position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-light)', pointerEvents:'none'}}/>

                          {isTypeDropdownOpen && (
                              <div className="patient-dropdown-list">
                                  {filteredVisitTypes.map((type) => (
                                      <div 
                                          key={type} 
                                          className="patient-dropdown-item" 
                                          // Use onMouseDown to prevent onBlur from firing first
                                          onMouseDown={() => { 
                                              setFormData({...formData, type: type}); 
                                              setIsTypeDropdownOpen(false); 
                                          }}
                                      >
                                          {type}
                                      </div>
                                  ))}
                                  {filteredVisitTypes.length === 0 && formData.type && (
                                    <div className="patient-dropdown-empty">No matching types found. New type will be saved.</div>
                                  )}
                                  {filteredVisitTypes.length === 0 && !formData.type && (
                                    <div className="patient-dropdown-empty">Start typing to search or select below.</div>
                                  )}
                              </div>
                          )}
                        </div>
                      </div>
                      {/* END UPDATED */}

                      <div className="form-group"><label className="form-label">Status</label><select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="Pending">Pending</option><option value="Confirmed">Confirmed</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></div>
                    </div>

                    <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
                  </div>
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">{modalMode === 'reschedule' ? 'Update Appointment' : 'Confirm Booking'}</button></div>
              </form>
            )}
          </div>
        </div>
      )}

      {aptToDelete && (
        <div className="modal-overlay" onClick={() => setAptToDelete(null)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '350px', height: 'auto', display: 'flex', flexDirection: 'column' }}
          >
             <div className="modal-header">
               <h3 style={{ fontWeight: 'bold', color: 'var(--danger)' }}>Cancel Appointment</h3>
               <button onClick={() => setAptToDelete(null)} className="modal-close"><X size={20} /></button>
             </div>
            <div className="modal-body" style={{ flex: '0 0 auto' }}>
              <p className="modal-text">Are you sure you want to cancel the appointment for <strong>{aptToDelete.patient}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal-footer" style={{ flex: '0 0 auto' }}>
              <button className="btn btn-outline" onClick={() => setAptToDelete(null)}>Keep</button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', boxShadow: 'none' }} onClick={confirmDelete}>Cancel Appointment</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Message Box */}
      {messageBox.show && (
        <div className="modal-overlay" onClick={closeMessageBox}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem', height: 'auto', minHeight: 'unset' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                {messageBox.type === 'success' ? (
                    <div style={{ padding: '12px', borderRadius: '50%', background: '#dcfce7' }}>
                        <CheckCircle size={48} color="#166534" />
                    </div>
                ) : (
                    <div style={{ padding: '12px', borderRadius: '50%', background: '#fee2e2' }}>
                        <AlertTriangle size={48} color="#991b1b" />
                    </div>
                )}
                
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--text-dark)' }}>{messageBox.title}</h3>
                    <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.95rem' }}>{messageBox.message}</p>
                </div>

                <button className="btn btn-primary" onClick={closeMessageBox} style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                    OK
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}