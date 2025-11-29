import React, { useMemo, useState, useEffect } from 'react';
import '../styles/Patients.css';
import { Plus, Search, Eye, Edit2, Trash2, FileDown, ChevronLeft, ChevronRight, X, Phone, Mail, Calendar, Activity, CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper functions
const formatDOB = (dob) => { if (!dob) return ''; return new Date(dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const computeAge = (dob) => { if (!dob) return ''; return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)); };
const getInitials = (name) => { return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(); };

const PAGE_SIZE = 5;

// Sort function
const sortData = (data, sortConfig) => {
  if (!sortConfig.key) return data;
  return [...data].sort((a, b) => {
    const valA = a[sortConfig.key]; const valB = b[sortConfig.key];
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0;
  });
};

export default function Patients() {
  const [patientsData, setPatientsData] = useState([]);
  const [appointmentsData, setAppointmentsData] = useState([]); // Store appointments for history
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', dob: '', status: 'Active' });
  const [errors, setErrors] = useState({});

  // Message Box State
  const [messageBox, setMessageBox] = useState({ show: false, title: '', message: '', type: 'success' });
  const closeMessageBox = () => setMessageBox({ ...messageBox, show: false });

  // --- FETCH DATA (SAFE) ---
  const fetchData = async () => {
    try {
      // 1. Fetch Patients
      const patRes = await fetch('http://127.0.0.1:5000/api/patients');
      const patData = await patRes.json();
      if (Array.isArray(patData)) setPatientsData(patData);
      else setPatientsData([]);

      // 2. Fetch Appointments (For History)
      const aptRes = await fetch('http://127.0.0.1:5000/api/appointments');
      const aptData = await aptRes.json();
      if (Array.isArray(aptData)) setAppointmentsData(aptData);
      else setAppointmentsData([]);

    } catch (error) {
      console.error('Error fetching data:', error);
      if (patientsData.length === 0) setPatientsData([]);
      if (appointmentsData.length === 0) setAppointmentsData([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter & Sort Logic
  const filteredPatients = useMemo(() => { 
    const term = searchTerm.toLowerCase(); 
    return patientsData.filter((patient) => 
      patient.name.toLowerCase().includes(term) || 
      patient.phone.toLowerCase().includes(term) || 
      patient.id.toString().includes(term)
    ); 
  }, [searchTerm, patientsData]);

  const sortedPatients = useMemo(() => sortData(filteredPatients, sortConfig), [filteredPatients, sortConfig]);
  
  // Pagination
  const totalPages = Math.ceil(sortedPatients.length / PAGE_SIZE) || 1;
  const paginatedPatients = sortedPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages }, (_, idx) => idx + 1);
  const showingStart = sortedPatients.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingEnd = sortedPatients.length === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, sortedPatients.length);

  const handleSort = (key) => { setSortConfig((prev) => { if (prev.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }; return { key, direction: 'asc' }; }); };
  
  const openView = (patient) => { setSelectedPatient(patient); setModalMode('view'); setIsModalOpen(true); };
  
  const openCreate = () => { 
    setSelectedPatient(null); 
    setFormData({ name: '', phone: '', email: '', dob: '', status: 'Active' }); 
    setErrors({}); 
    setModalMode('create'); 
    setIsModalOpen(true); 
  };

  const openEdit = (patient) => { 
    setSelectedPatient(patient); 
    const formattedDOB = patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '';
    setFormData({ ...patient, dob: formattedDOB }); 
    setErrors({}); 
    setModalMode('edit'); 
    setIsModalOpen(true); 
  };

  const closeModal = () => { setIsModalOpen(false); setSelectedPatient(null); };
  
  // Handle Save
  const handleSavePatient = async (e) => {
    e.preventDefault();
    const newErrors = {};
    
    // Name Validation
    if (!formData.name) newErrors.name = "Patient Name is required";
    
    // PHONE VALIDATION (UPDATED)
    if (!formData.phone) {
        newErrors.phone = "Phone number is required";
    } else if (formData.phone.length !== 11) {
        newErrors.phone = "Phone must be exactly 11 digits";
    }

    // DOB Validation
    if (!formData.dob) newErrors.dob = "Date of Birth is required";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    try {
      let url = 'http://127.0.0.1:5000/api/patients';
      let method = 'POST';

      if (modalMode === 'edit' && selectedPatient) {
        url = `http://127.0.0.1:5000/api/patients/${selectedPatient.id}`;
        method = 'PUT';
      }

      await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
      });

      fetchData();
      closeModal();
      setMessageBox({ show: true, title: 'Success', message: modalMode === 'create' ? 'Patient registered successfully!' : 'Patient record updated!', type: 'success' });

    } catch (error) {
      console.error('Error saving patient:', error);
      setMessageBox({ show: true, title: 'Error', message: 'Failed to save patient. Please check your connection.', type: 'error' });
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (patientToDelete) { 
        try {
            await fetch(`http://127.0.0.1:5000/api/patients/${patientToDelete.id}`, { method: 'DELETE' });
            fetchData();
            setPatientToDelete(null); 
            setMessageBox({ show: true, title: 'Success', message: 'Patient record deleted.', type: 'success' });
        } catch (error) {
            console.error("Error deleting patient:", error);
            setMessageBox({ show: true, title: 'Error', message: 'Failed to delete record.', type: 'error' });
        }
    } 
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); 
    doc.setFont("helvetica", "bold");
    doc.text("CALONIA", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Centralized Appointment & Logistics Operations", 14, 26);
    doc.setDrawColor(200); 
    doc.line(14, 30, 196, 30);
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Patient Records Registry", 14, 42);
    doc.setFontSize(10);
    doc.setTextColor(100);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated on: ${today}`, 14, 48);

    const tableColumn = ["ID", "Name", "Phone", "Email", "DOB", "Last Visit", "Status"];
    const tableRows = patientsData.map(p => [ p.id, p.name, p.phone, p.email || '--', formatDOB(p.dob), p.lastVisit || 'New Patient', p.status ]);

    autoTable(doc, {
      startY: 55,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: 50, fontSize: 9 },
      alternateRowStyles: { fillColor: [240, 249, 255] },
      columnStyles: { 0: { halign: 'center', cellWidth: 15 }, 6: { halign: 'center', fontStyle: 'bold' } },
      didDrawPage: function (data) {
        const pageCount = doc.internal.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, pageHeight - 10);
        const footerText = "CALONIA Clinic System - Confidential";
        const textWidth = doc.getTextWidth(footerText);
        doc.text(footerText, pageSize.width - data.settings.margin.right - textWidth, pageHeight - 10);
      }
    });
    doc.save('calonia_patients_report.pdf');
  };

  // Get Appointment History for Selected Patient
  const patientHistory = useMemo(() => {
    if (!selectedPatient) return [];
    return appointmentsData.filter(apt => apt.patient_id === selectedPatient.id);
  }, [selectedPatient, appointmentsData]);

  return (
    <div className="patients-page animate-fade-in">
      <div className="page-header">
        <div><h2 className="page-title">Patient Records</h2><p className="page-subtitle">Monitor the complete list of patients, visits, and activity</p></div>
        <div className="header-actions"><button className="btn btn-outline" onClick={handleExportPDF}><FileDown size={18} /> Export PDF</button><button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> New Patient</button></div>
      </div>

      <div className="dashboard-filters-card">
        <div className="dashboard-filters-row" style={{ display: 'grid', gridTemplateColumns: '1fr', width: '100%' }}>
          <div className="dashboard-filter-group" style={{ width: '100%' }}>
            <label>Search Patients</label>
            <div className="filter-input-wrapper" style={{ width: '100%' }}>
              <Search size={16} className="filter-input-icon" />
              <input 
                type="text" 
                placeholder="Search by name, phone, or ID" 
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                {[ { label: 'ID', key: 'id' }, { label: 'Patient Name', key: 'name' }, { label: 'Phone', key: 'phone' }, { label: 'Status', key: 'status' } ].map((col) => ( 
                  <th key={col.key} onClick={() => handleSort(col.key)} className="sortable"> 
                    {col.label} {sortConfig.key === col.key && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>} 
                  </th> 
                ))}
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPatients.length === 0 ? ( <tr><td colSpan="5" style={{textAlign: 'center', padding: '3rem', color: '#6b7280'}}>No patients found.</td></tr> ) : paginatedPatients.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: '#6b7280' }}>#{p.id}</td>
                  <td style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{p.name}</td>
                  <td>{p.phone}</td>
                  <td><span className={`badge ${p.status === 'Active' ? 'badge-green' : p.status === 'Pending' ? 'badge-blue' : 'badge-completed'}`}>{p.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-group">
                      <button className="icon-btn view" onClick={() => openView(p)} title="View Details"><Eye size={18} /></button>
                      <button className="icon-btn edit" onClick={() => openEdit(p)} title="Edit"><Edit2 size={18} /></button>
                      <button className="icon-btn delete" onClick={() => setPatientToDelete(p)} title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination-controls">
          <div className="pagination-meta" style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Showing <strong>{showingStart === 0 ? 0 : showingStart} - {showingEnd}</strong> of <strong>{filteredPatients.length}</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><button className="btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft size={16} /></button><div className="pagination-pages">{pageNumbers.map((num) => (<button key={num} className={`page-btn ${num === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(num)}>{num}</button>))}</div><button className="btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}><ChevronRight size={16} /></button></div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: modalMode === 'view' ? '600px' : '450px', // Wider for view mode to fit history 
              width: '95%', 
              height: 'auto', 
              maxHeight: '90vh',
              display: 'flex', 
              flexDirection: 'column' 
            }}
          >
            <div className="modal-header">
              <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{modalMode === 'view' ? 'Patient Profile' : modalMode === 'edit' ? 'Edit Patient' : 'New Patient'}</h3><button onClick={closeModal} className="modal-close"><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ flex: '1', overflowY: 'auto' }}>
              {modalMode === 'view' && selectedPatient && (
                <div className="view-details">
                  {/* Header Profile Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#eff6ff', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '700', border: '2px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>{getInitials(selectedPatient.name)}</div>
                    <div><h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-dark)' }}>{selectedPatient.name}</h2><div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}><span className={`badge ${selectedPatient.status === 'Active' ? 'badge-green' : 'badge-blue'}`}>{selectedPatient.status}</span><span style={{ fontSize: '0.8rem', color: 'var(--text-light)', display:'flex', alignItems:'center' }}>#{selectedPatient.id}</span></div></div>
                  </div>

                  {/* Profile Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                    <div><div className="detail-label"><Calendar size={14} style={{display:'inline', marginRight:'4px'}}/> Date of Birth</div><div className="detail-value">{formatDOB(selectedPatient.dob)}</div><div style={{fontSize: '0.8rem', color: 'var(--text-light)'}}>{computeAge(selectedPatient.dob)} years old</div></div>
                    <div><div className="detail-label"><Activity size={14} style={{display:'inline', marginRight:'4px'}}/> Last Visit</div><div className="detail-value">{selectedPatient.lastVisit || 'N/A'}</div><div style={{fontSize: '0.8rem', color: 'var(--text-light)'}}>General Checkup</div></div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginTop: '1rem' }}>
                    <div className="detail-label" style={{marginBottom:'0.5rem'}}>Contact Details</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><Phone size={16} color="var(--text-light)"/> <span>{selectedPatient.phone}</span></div><div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><Mail size={16} color="var(--text-light)"/> <span>{selectedPatient.email || 'N/A'}</span></div></div>
                  </div>

                  {/* Appointment History Table */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div className="detail-label" style={{ marginBottom: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Appointment History</div>
                    {patientHistory.length > 0 ? (
                      <div className="table-container" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }}>
                        <table>
                          <thead>
                            <tr>
                              <th style={{ padding: '0.5rem', background: '#f8fafc' }}>Date</th>
                              <th style={{ padding: '0.5rem', background: '#f8fafc' }}>Time</th>
                              <th style={{ padding: '0.5rem', background: '#f8fafc' }}>Doctor</th>
                              <th style={{ padding: '0.5rem', background: '#f8fafc' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patientHistory.map((apt) => (
                              <tr key={apt.id}>
                                <td style={{ padding: '0.5rem' }}>{apt.date}</td>
                                <td style={{ padding: '0.5rem' }}>{apt.time}</td>
                                <td style={{ padding: '0.5rem' }}>{apt.doc}</td>
                                <td style={{ padding: '0.5rem' }}>
                                  <span className={`badge ${apt.status === 'Completed' ? 'badge-completed' : apt.status === 'Confirmed' ? 'badge-green' : apt.status === 'Cancelled' ? 'badge-red' : 'badge-blue'}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                    {apt.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>No appointment history found.</p>
                    )}
                  </div>
                </div>
              )}

              {(modalMode === 'edit' || modalMode === 'create') && (
                <form id="patient-form" onSubmit={handleSavePatient} className="form-grid">
                  <div className="form-group"><label className="form-label">Full Name</label><input required className="form-control" style={{ borderColor: errors.name ? 'var(--danger)' : 'var(--border)' }} value={formData.name} onChange={e => { setFormData({...formData, name: e.target.value}); setErrors({...errors, name: null}); }} placeholder="e.g. John Doe" />{errors.name && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.name}</span>}</div>
                  <div className="form-row-2">
                    <div className="form-group"><label className="form-label">Phone Number</label>
                    
                    {/* --- FIXED: PHONE INPUT VALIDATION --- */}
                    <input 
                      required 
                      className="form-control" 
                      style={{ borderColor: errors.phone ? 'var(--danger)' : 'var(--border)' }} 
                      value={formData.phone} 
                      onChange={e => { 
                        // 1. Filter: Allow only Numbers
                        const val = e.target.value.replace(/\D/g, '');
                        // 2. Filter: Limit to 11 chars
                        if (val.length <= 11) {
                            setFormData({...formData, phone: val}); 
                            setErrors({...errors, phone: null}); 
                        }
                      }} 
                      placeholder="09123456789" 
                    />
                    
                    {errors.phone && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.phone}</span>}</div>
                    <div className="form-group"><label className="form-label">Email Address</label><input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" /></div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group"><label className="form-label">Date of Birth</label><input required type="date" className="form-control" style={{ borderColor: errors.dob ? 'var(--danger)' : 'var(--border)' }} value={formData.dob} onChange={e => { setFormData({...formData, dob: e.target.value}); setErrors({...errors, dob: null}); }} />{errors.dob && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.dob}</span>}</div>
                    <div className="form-group"><label className="form-label">Status</label><select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Pending">Pending</option></select></div>
                  </div>
                </form>
              )}
            </div>
            <div className="modal-footer" style={{ flex: '0 0 auto' }}>
              {modalMode === 'view' ? ( 
                <> 
                  <button type="button" className="btn btn-outline" onClick={closeModal}>Close</button> 
                  <button key="edit-btn" type="button" className="btn btn-primary" onClick={() => openEdit(selectedPatient)}>Edit Record</button> 
                </> 
              ) : ( 
                <> 
                  <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button> 
                  <button key="save-btn" type="submit" form="patient-form" className="btn btn-primary">{modalMode === 'edit' ? 'Save Changes' : 'Create Patient'}</button> 
                </> 
              )}
            </div>
          </div>
        </div>
      )}

      {patientToDelete && (
        <div className="modal-overlay" onClick={() => setPatientToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '350px', height: 'auto', display: 'flex', flexDirection: 'column' }}>
             <div className="modal-header"><h3 style={{ fontWeight: 'bold', color: 'var(--danger)' }}>Delete Patient</h3><button onClick={() => setPatientToDelete(null)} className="modal-close"><X size={20} /></button></div>
            <div className="modal-body" style={{ flex: '0 0 auto' }}><p className="modal-text">Are you sure you want to delete <strong>{patientToDelete.name}</strong>? This action cannot be undone.</p></div>
            <div className="modal-footer" style={{ flex: '0 0 auto' }}><button className="btn btn-outline" onClick={() => setPatientToDelete(null)}>Cancel</button><button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', boxShadow: 'none' }} onClick={handleDeleteConfirm}>Delete Permanently</button></div>
          </div>
        </div>
      )}

      {messageBox.show && (
        <div className="modal-overlay" onClick={closeMessageBox}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem', height: 'auto', minHeight: 'unset' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                {messageBox.type === 'success' ? (<div style={{ padding: '12px', borderRadius: '50%', background: '#dcfce7' }}><CheckCircle size={48} color="#166534" /></div>) : (<div style={{ padding: '12px', borderRadius: '50%', background: '#fee2e2' }}><AlertTriangle size={48} color="#991b1b" /></div>)}
                <div><h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--text-dark)' }}>{messageBox.title}</h3><p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.95rem' }}>{messageBox.message}</p></div>
                <button className="btn btn-primary" onClick={closeMessageBox} style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}