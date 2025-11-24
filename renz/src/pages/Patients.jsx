import React, { useMemo, useState } from 'react';
import '../styles/Patients.css';
import { Plus, Search, Eye, Edit2, Trash2, FileDown, ChevronLeft, ChevronRight, X, User, Phone, Mail, Calendar, Activity } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const INITIAL_DATA = [
  { id: 101, name: 'John Smith', phone: '555-0101', email: 'john.smith@email.com', dob: '1988-03-14', lastVisit: 'Jan 10, 2025', status: 'Active' },
  { id: 102, name: 'Sarah Williams', phone: '555-0102', email: 'sarah.w@email.com', dob: '1992-11-02', lastVisit: 'Jan 08, 2025', status: 'Active' },
  { id: 103, name: 'Michael Brown', phone: '555-0103', email: 'michael.brown@email.com', dob: '1985-07-19', lastVisit: 'Jan 05, 2025', status: 'Inactive' },
  { id: 104, name: 'Emily Davis', phone: '555-0104', email: 'emily.davis@email.com', dob: '1999-05-23', lastVisit: 'Dec 30, 2024', status: 'Active' },
  { id: 105, name: 'Robert Wilson', phone: '555-0105', email: 'robert.w@email.com', dob: '1978-09-11', lastVisit: 'Dec 28, 2024', status: 'Pending' },
  { id: 106, name: 'Lisa Chen', phone: '555-0106', email: 'lisa.chen@email.com', dob: '1995-01-08', lastVisit: 'Dec 22, 2024', status: 'Active' },
  { id: 107, name: 'David Park', phone: '555-0107', email: 'david.park@email.com', dob: '1983-04-12', lastVisit: 'Dec 20, 2024', status: 'Inactive' },
  { id: 108, name: 'Sophia Turner', phone: '555-0108', email: 'sophia.turner@email.com', dob: '1990-02-17', lastVisit: 'Dec 18, 2024', status: 'Active' },
];

const PAGE_SIZE = 5;

const sortData = (data, sortConfig) => {
  if (!sortConfig.key) return data;
  return [...data].sort((a, b) => {
    const valA = a[sortConfig.key]; const valB = b[sortConfig.key];
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0;
  });
};

const formatDOB = (dob) => { if (!dob) return ''; return new Date(dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const computeAge = (dob) => { if (!dob) return ''; return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)); };
const getInitials = (name) => { return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(); };

export default function Patients() {
  const [patientsData, setPatientsData] = useState(INITIAL_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', dob: '', status: 'Active' });
  const [errors, setErrors] = useState({});

  const filteredPatients = useMemo(() => { const term = searchTerm.toLowerCase(); return patientsData.filter((patient) => patient.name.toLowerCase().includes(term) || patient.phone.toLowerCase().includes(term) || patient.id.toString().includes(term)); }, [searchTerm, patientsData]);
  const sortedPatients = useMemo(() => sortData(filteredPatients, sortConfig), [filteredPatients, sortConfig]);
  const totalPages = Math.ceil(sortedPatients.length / PAGE_SIZE) || 1;
  const paginatedPatients = sortedPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages }, (_, idx) => idx + 1);
  const showingStart = sortedPatients.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingEnd = sortedPatients.length === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, sortedPatients.length);

  const handleSort = (key) => { setSortConfig((prev) => { if (prev.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }; return { key, direction: 'asc' }; }); };
  
  const openView = (patient) => { 
    setSelectedPatient(patient); 
    setModalMode('view'); 
    setIsModalOpen(true); 
  };

  const openCreate = () => { 
    setSelectedPatient(null); 
    setFormData({ name: '', phone: '', email: '', dob: '', status: 'Active' }); 
    setErrors({}); 
    setModalMode('create'); 
    setIsModalOpen(true); 
  };

  // FIXED: This function now correctly updates the mode and ensures data is populated
  const openEdit = (patient) => { 
    setSelectedPatient(patient); 
    setFormData({ ...patient }); // Pre-fill form with patient data
    setErrors({}); 
    setModalMode('edit'); // Switch mode
    setIsModalOpen(true); // Ensure modal stays open
  };

  const closeModal = () => { setIsModalOpen(false); setSelectedPatient(null); };
  
  const handleSavePatient = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name) newErrors.name = "Patient Name is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.dob) newErrors.dob = "Date of Birth is required";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    if (modalMode === 'edit' && selectedPatient) { 
      const updatedList = patientsData.map(p => p.id === selectedPatient.id ? { ...formData, id: selectedPatient.id, lastVisit: selectedPatient.lastVisit } : p); 
      setPatientsData(updatedList); 
    } else if (modalMode === 'create') { 
      const newId = Math.max(...patientsData.map(p => p.id), 0) + 1; 
      setPatientsData([...patientsData, { ...formData, id: newId, lastVisit: 'N/A' }]); 
    }
    closeModal();
  };

  const handleDeleteConfirm = () => { if (patientToDelete) { setPatientsData(patientsData.filter(p => p.id !== patientToDelete.id)); setPatientToDelete(null); } };
  const handleExportPDF = () => { const doc = new jsPDF(); doc.text('Patient Records Report', 14, 22); const tableColumn = ["ID", "Name", "Phone", "Email", "DOB", "Last Visit", "Status"]; const tableRows = patientsData.map(p => [p.id, p.name, p.phone, p.email, formatDOB(p.dob), p.lastVisit, p.status]); doc.autoTable({ startY: 35, head: [tableColumn], body: tableRows }); doc.save('patients_report.pdf'); };

  return (
    <div className="patients-page animate-fade-in">
      <div className="page-header">
        <div><h2 className="page-title">Patient Records</h2><p className="page-subtitle">Monitor the complete list of patients, visits, and activity</p></div>
        <div className="header-actions"><button className="btn btn-outline" onClick={handleExportPDF}><FileDown size={18} /> Export PDF</button><button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> New Patient</button></div>
      </div>

      <div className="dashboard-filters-card">
        <div className="dashboard-filters-row">
          <div className="dashboard-filter-group" style={{ gridColumn: '1 / -1' }}><label>Search Patients</label><div className="filter-input-wrapper"><Search size={16} className="filter-input-icon" /><input type="text" placeholder="Search by name, phone, or ID" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} /></div></div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead><tr>{[ { label: 'ID', key: 'id' }, { label: 'Patient Name', key: 'name' }, { label: 'Phone', key: 'phone' }, { label: 'Email', key: 'email' }, { label: 'Age / DOB', key: 'dob' }, { label: 'Last Visit', key: 'lastVisit' }, { label: 'Status', key: 'status' } ].map((col) => ( <th key={col.key} onClick={() => handleSort(col.key)} className="sortable"> {col.label} {sortConfig.key === col.key && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>} </th> ))} <th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody>
              {paginatedPatients.length === 0 ? ( <tr><td colSpan="8" style={{textAlign: 'center', padding: '3rem', color: '#6b7280'}}>No patients found.</td></tr> ) : paginatedPatients.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: '#6b7280' }}>#{p.id}</td><td style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{p.name}</td><td>{p.phone}</td><td style={{ color: 'var(--text-light)' }}>{p.email}</td>
                  <td><div className="age-dob"><strong>Age: {computeAge(p.dob)}</strong><span style={{fontSize: '0.75rem', color: 'var(--text-light)'}}>Born {formatDOB(p.dob)}</span></div></td>
                  <td>{p.lastVisit}</td><td><span className={`badge ${p.status === 'Active' ? 'badge-green' : p.status === 'Pending' ? 'badge-blue' : 'badge-completed'}`}>{p.status}</span></td>
                  <td style={{ textAlign: 'right' }}><div className="action-group"><button className="icon-btn view" onClick={() => openView(p)} title="View Details"><Eye size={18} /></button><button className="icon-btn edit" onClick={() => openEdit(p)} title="Edit"><Edit2 size={18} /></button><button className="icon-btn delete" onClick={() => setPatientToDelete(p)} title="Delete"><Trash2 size={18} /></button></div></td>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            
            <div className="modal-header">
              {/* DYNAMIC TITLE based on mode */}
              <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                {modalMode === 'view' && 'Patient Profile'} 
                {modalMode === 'edit' && 'Edit Patient'} 
                {modalMode === 'create' && 'New Patient'}
              </h3>
              <button onClick={closeModal} className="modal-close"><X size={20} /></button>
            </div>

            <div className="modal-body">
              {/* VIEW MODE */}
              {modalMode === 'view' && selectedPatient && (
                <div className="view-details">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#eff6ff', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '700', border: '2px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>{getInitials(selectedPatient.name)}</div>
                    <div><h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-dark)' }}>{selectedPatient.name}</h2><div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}><span className={`badge ${selectedPatient.status === 'Active' ? 'badge-green' : 'badge-blue'}`}>{selectedPatient.status}</span><span style={{ fontSize: '0.8rem', color: 'var(--text-light)', display:'flex', alignItems:'center' }}>#{selectedPatient.id}</span></div></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                    <div><div className="detail-label"><Calendar size={14} style={{display:'inline', marginRight:'4px'}}/> Date of Birth</div><div className="detail-value">{formatDOB(selectedPatient.dob)}</div><div style={{fontSize: '0.8rem', color: 'var(--text-light)'}}>{computeAge(selectedPatient.dob)} years old</div></div>
                    <div><div className="detail-label"><Activity size={14} style={{display:'inline', marginRight:'4px'}}/> Last Visit</div><div className="detail-value">{selectedPatient.lastVisit}</div><div style={{fontSize: '0.8rem', color: 'var(--text-light)'}}>General Checkup</div></div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginTop: '0.5rem' }}>
                    <div className="detail-label" style={{marginBottom:'0.5rem'}}>Contact Details</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><Phone size={16} color="var(--text-light)"/> <span>{selectedPatient.phone}</span></div><div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><Mail size={16} color="var(--text-light)"/> <span>{selectedPatient.email}</span></div></div>
                  </div>
                </div>
              )}

              {/* EDIT / CREATE FORM */}
              {(modalMode === 'edit' || modalMode === 'create') && (
                <form id="patient-form" onSubmit={handleSavePatient} className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input required className="form-control" style={{ borderColor: errors.name ? 'var(--danger)' : 'var(--border)' }} value={formData.name} onChange={e => { setFormData({...formData, name: e.target.value}); setErrors({...errors, name: null}); }} placeholder="e.g. John Doe" />
                    {errors.name && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.name}</span>}
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input required className="form-control" style={{ borderColor: errors.phone ? 'var(--danger)' : 'var(--border)' }} value={formData.phone} onChange={e => { setFormData({...formData, phone: e.target.value}); setErrors({...errors, phone: null}); }} placeholder="555-0000" />
                      {errors.phone && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.phone}</span>}
                    </div>
                    <div className="form-group"><label className="form-label">Email Address</label><input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" /></div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input required type="date" className="form-control" style={{ borderColor: errors.dob ? 'var(--danger)' : 'var(--border)' }} value={formData.dob} onChange={e => { setFormData({...formData, dob: e.target.value}); setErrors({...errors, dob: null}); }} />
                      {errors.dob && <span style={{fontSize:'0.75rem', color:'var(--danger)'}}>{errors.dob}</span>}
                    </div>
                    <div className="form-group"><label className="form-label">Status</label><select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Pending">Pending</option></select></div>
                  </div>
                </form>
              )}
            </div>

            {/* DYNAMIC FOOTER */}
            <div className="modal-footer">
              {modalMode === 'view' ? (
                <> 
                  <button className="btn btn-outline" onClick={closeModal}>Close</button> 
                  {/* This button now triggers the switch to Edit mode correctly */}
                  <button className="btn btn-primary" onClick={() => openEdit(selectedPatient)}>Edit Record</button> 
                </>
              ) : (
                <> 
                  <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button> 
                  <button type="submit" form="patient-form" className="btn btn-primary">{modalMode === 'edit' ? 'Save Changes' : 'Create Patient'}</button> 
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {patientToDelete && (
        <div className="modal-overlay" onClick={() => setPatientToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
             <div className="modal-header"><h3 style={{ fontWeight: 'bold', color: 'var(--danger)' }}>Delete Patient</h3><button onClick={() => setPatientToDelete(null)} className="modal-close"><X size={20} /></button></div>
            <div className="modal-body"><p className="modal-text">Are you sure you want to delete <strong>{patientToDelete.name}</strong>? This action cannot be undone.</p></div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setPatientToDelete(null)}>Cancel</button><button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', boxShadow: 'none' }} onClick={handleDeleteConfirm}>Delete Permanently</button></div>
          </div>
        </div>
      )}
    </div>
  );
}