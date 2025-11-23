import React, { useState } from 'react';
import { Eye, Calendar, X, Clock, CheckCircle, AlertCircle, Plus, Search, Phone, Mail, FileText } from 'lucide-react';
import CalendarWidget from '../components/CalendarWidget';
import BookingModal from '../components/BookingModal';

export default function Appointments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const [appointments] = useState([
    { 
      id: 1, 
      time: '09:00 AM', 
      duration: '30 min',
      patient: 'John Smith', 
      phone: '555-0101',
      email: 'john.smith@email.com',
      doc: 'Dr. Johnson', 
      type: 'General Checkup', 
      notes: 'Annual checkup, feeling well',
      status: 'Confirmed' 
    },
    { 
      id: 2, 
      time: '10:30 AM', 
      duration: '45 min',
      patient: 'Sarah Williams', 
      phone: '555-0102',
      email: 'sarah.w@email.com',
      doc: 'Dr. Davis', 
      type: 'Pediatric Review', 
      notes: 'Follow-up on treatment',
      status: 'Pending' 
    },
    { 
      id: 3, 
      time: '02:00 PM', 
      duration: '60 min',
      patient: 'Mike Brown', 
      phone: '555-0103',
      email: 'mike.brown@email.com',
      doc: 'Dr. Miller', 
      type: 'Heart Screening', 
      notes: 'Pre-surgical screening',
      status: 'Completed' 
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedAppointments, setSelectedAppointments] = useState(new Set());

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelection = (id) => {
    const newSelection = new Set(selectedAppointments);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedAppointments(newSelection);
  };

  const handleView = (apt) => { console.log("View", apt) };
  const handleReschedule = (apt) => { console.log("Reschedule", apt) };
  const handleCancel = (apt) => { console.log("Cancel", apt) };

  return (
    <div className="animate-fade-in"> 
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Appointments</h2>
          <p className="page-subtitle">Manage your schedule</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={18} /> New Appointment
        </button>
      </div>

      <div className="dashboard-container"> 
        
        {/* Left Column: Calendar */}
        <div className="left-col animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CalendarWidget />
        </div>

        {/* Right Column: Content */}
        <div className="right-col animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Filters */}
          <div className="dashboard-filters-card">
            <h4 className="dashboard-filters-title">Search &amp; Filters</h4>
            <div className="dashboard-filters-row">
              <div className="dashboard-filter-group">
                <label>Search</label>
                <div className="filter-input-wrapper">
                  <Search size={16} className="filter-input-icon" />
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="dashboard-filter-group">
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="dashboard-filter-group">
                <label>Time Range</label>
                <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                  <option value="all">All Day</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                </select>
              </div>
              <div className="dashboard-filter-group">
                <label>Doctor</label>
                <select><option>All Doctors</option></select>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedAppointments.size > 0 && (
            <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{fontSize: '0.9rem', fontWeight: '600'}}>{selectedAppointments.size} selected</span>
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <button className="btn-outline" style={{padding:'4px 12px', fontSize:'0.8rem'}}>Mark Complete</button>
                <button className="btn-outline" style={{padding:'4px 12px', fontSize:'0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)'}}>Cancel</button>
              </div>
            </div>
          )}
          
          {/* THE TABLE (ADJUSTED FOR ALIGNMENT) */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th style={{width: '40px', paddingLeft: '1.25rem'}}>
                      <input type="checkbox" onChange={(e) => setSelectedAppointments(e.target.checked ? new Set(filteredAppointments.map(a => a.id)) : new Set())} />
                    </th>
                    
                    <th style={{minWidth: '90px'}}>Time</th>
                    <th style={{minWidth: '140px'}}>Patient</th>
                    
                    {/* Expanded 'Visit Info' to 35% to push Actions column to the far right edge */}
                    <th style={{minWidth: '160px', width: '35%'}}>Visit Info</th>
                    
                    <th style={{minWidth: '110px'}}>Doctor</th>
                    <th style={{minWidth: '100px'}}>Status</th>
                    
                    {/* Removed Right Padding so icons align flush with the header button above */}
                    <th style={{textAlign:'right', minWidth: '90px', paddingRight: '1.25rem'}}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} style={{backgroundColor: selectedAppointments.has(apt.id) ? '#f0f9ff' : 'transparent'}}>
                      <td style={{paddingLeft: '1.25rem'}}>
                        <input type="checkbox" checked={selectedAppointments.has(apt.id)} onChange={() => toggleSelection(apt.id)} />
                      </td>
                      
                      <td>
                        <div style={{fontWeight: '700', color: 'var(--text-dark)', whiteSpace: 'nowrap'}}>{apt.time}</div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px'}}>
                          <Clock size={12}/> {apt.duration}
                        </div>
                      </td>

                      <td>
                        <div style={{fontWeight: '600', color: 'var(--primary-color)'}}>{apt.patient}</div>
                        <div style={{fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', whiteSpace: 'nowrap'}}>
                          <Mail size={12}/> {apt.email}
                        </div>
                      </td>

                      <td>
                        <div style={{fontWeight: '500', fontSize: '0.9rem'}}>{apt.type}</div>
                        <div style={{fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', alignItems: 'flex-start', gap: '4px', marginTop: '2px', lineHeight: '1.3'}}>
                          <FileText size={12} style={{marginTop:'2px', flexShrink: 0}}/> 
                          <span>{apt.notes}</span>
                        </div>
                      </td>

                      <td style={{color: 'var(--text-dark)', fontWeight: '500', whiteSpace: 'nowrap'}}>{apt.doc}</td>

                      <td>
                        <span className={`badge ${
                          apt.status === 'Confirmed' ? 'badge-green' : 
                          apt.status === 'Pending' ? 'badge-blue' : 'badge-completed'
                        }`}>
                          {apt.status}
                        </span>
                      </td>

                      {/* Reduced Padding Right on Data Cells too */}
                      <td style={{textAlign: 'right', paddingRight: '1.25rem'}}>
                        <div style={{display: 'flex', gap: '4px', justifyContent: 'flex-end'}}>
                          <button className="icon-btn view" title="View Details" onClick={() => handleView(apt)}>
                            <Eye size={18}/>
                          </button>
                          <button className="icon-btn edit" title="Reschedule" onClick={() => handleReschedule(apt)}>
                            <Calendar size={18}/>
                          </button>
                          <button className="icon-btn delete" title="Cancel" onClick={() => handleCancel(apt)}>
                            <X size={18}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
      
      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}