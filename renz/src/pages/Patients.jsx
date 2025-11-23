import React, { useMemo, useState } from 'react';
import '../styles/Patients.css';
import { Plus, Search, Eye, Edit, Trash2, FileDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
    const valA = a[sortConfig.key];
    const valB = b[sortConfig.key];
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
};

const formatDOB = (dob) => {
  if (!dob) return '';
  const date = new Date(dob);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const computeAge = (dob) => {
  if (!dob) return '';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

export default function Patients() {
  // State
  const [patientsData, setPatientsData] = useState(INITIAL_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [viewPatient, setViewPatient] = useState(null);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null); 

  // Form State
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', dob: '', status: 'Active'
  });

  // --- DATA PROCESSING ---
  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return patientsData.filter((patient) =>
      patient.name.toLowerCase().includes(term) ||
      patient.phone.toLowerCase().includes(term) ||
      patient.id.toString().includes(term)
    );
  }, [searchTerm, patientsData]);

  const sortedPatients = useMemo(() => sortData(filteredPatients, sortConfig), [filteredPatients, sortConfig]);

  const totalPages = Math.ceil(sortedPatients.length / PAGE_SIZE) || 1;
  const paginatedPatients = sortedPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages }, (_, idx) => idx + 1);
  const showingStart = sortedPatients.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingEnd = sortedPatients.length === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, sortedPatients.length);

  // --- HANDLERS ---
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Patient Records Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["ID", "Name", "Phone", "Email", "DOB", "Last Visit", "Status"];
    const tableRows = [];

    patientsData.forEach(patient => {
      const patientData = [
        patient.id,
        patient.name,
        patient.phone,
        patient.email,
        formatDOB(patient.dob),
        patient.lastVisit,
        patient.status,
      ];
      tableRows.push(patientData);
    });

    doc.autoTable({
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 }
    });

    doc.save('patients_report.pdf');
  };

  const openNewPatientForm = () => {
    setEditingPatient(null);
    setFormData({ name: '', phone: '', email: '', dob: '', status: 'Active' });
    setIsFormOpen(true);
  };

  const openEditForm = (patient) => {
    setEditingPatient(patient);
    setFormData({ ...patient });
    setIsFormOpen(true);
  };

  const handleSavePatient = (e) => {
    e.preventDefault();
    if (editingPatient) {
      const updatedList = patientsData.map(p => 
        p.id === editingPatient.id ? { ...formData, id: editingPatient.id, lastVisit: editingPatient.lastVisit } : p
      );
      setPatientsData(updatedList);
    } else {
      const newId = Math.max(...patientsData.map(p => p.id), 0) + 1;
      const newPatient = {
        ...formData,
        id: newId,
        lastVisit: 'N/A',
      };
      setPatientsData([...patientsData, newPatient]);
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (patientToDelete) {
      setPatientsData(patientsData.filter(p => p.id !== patientToDelete.id));
      setPatientToDelete(null);
    }
  };

  return (
    <div className="patients-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Patient Records</h2>
          <p className="page-subtitle" style={{ color: 'var(--text-light)' }}>Monitor the complete list of patients, visits, and activity</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleExportPDF}>
            <FileDown size={18} /> Export PDF
          </button>
          <button className="btn btn-primary" onClick={openNewPatientForm}>
            <Plus size={18} /> New Patient
          </button>
        </div>
      </div>

      {/* Filter Card - SEARCH MAXIMIZED */}
      <div className="dashboard-filters-card">
        <div className="dashboard-filters-row">
          {/* We use gridColumn: 1/-1 to make it span the entire row */}
          <div className="dashboard-filter-group" style={{ gridColumn: '1 / -1' }}>
            <label>Search Patients</label>
            <div className="filter-input-wrapper">
              <Search size={16} className="filter-input-icon" />
              <input
                type="text"
                placeholder="Search by name, phone, or ID"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                {[
                  { label: 'ID', key: 'id' },
                  { label: 'Patient Name', key: 'name' },
                  { label: 'Phone', key: 'phone' },
                  { label: 'Email', key: 'email' },
                  { label: 'Age / DOB', key: 'dob' },
                  { label: 'Last Visit', key: 'lastVisit' },
                  { label: 'Status', key: 'status' },
                ].map((col) => (
                  <th key={col.key} onClick={() => handleSort(col.key)} className="sortable">
                    {col.label}
                    {sortConfig.key === col.key && (
                      <span className="sort-indicator">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                ))}
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPatients.length === 0 ? (
                 <tr><td colSpan="8" style={{textAlign: 'center', padding: '3rem', color: '#6b7280'}}>No patients found.</td></tr>
              ) : paginatedPatients.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: '#6b7280' }}>#{p.id}</td>
                  <td style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{p.name}</td>
                  <td>{p.phone}</td>
                  <td style={{ color: 'var(--text-light)' }}>{p.email}</td>
                  <td>
                    <div className="age-dob">
                      <strong>{computeAge(p.dob)} yrs</strong>
                      <span>{formatDOB(p.dob)}</span>
                    </div>
                  </td>
                  <td>{p.lastVisit}</td>
                  <td>
                    <span className={`badge ${p.status === 'Active' ? 'badge-green' : p.status === 'Pending' ? 'badge-blue' : 'badge-completed'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-group">
                      <button className="icon-btn view" onClick={() => setViewPatient(p)} title="View"><Eye size={18} /></button>
                      <button className="icon-btn edit" onClick={() => openEditForm(p)} title="Edit"><Edit size={18} /></button>
                      <button className="icon-btn delete" onClick={() => setPatientToDelete(p)} title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls - META INFO MOVED HERE */}
        <div className="pagination-controls">
          
          {/* 1. Left: Showing X of Y */}
          <div className="pagination-meta" style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
             Showing <strong>{showingStart === 0 ? 0 : showingStart} - {showingEnd}</strong> of <strong>{filteredPatients.length}</strong>
          </div>

          {/* 2. Right: Navigation Buttons (Grouped) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn-outline"
              style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center' }}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="pagination-pages">
              {pageNumbers.map((num) => (
                <button
                  key={num}
                  className={`page-btn ${num === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            
            <button
              className="btn-outline"
              style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center' }}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALS (Keep existing logic) --- */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontWeight: 'bold' }}>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSavePatient}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input required className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe"/>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input required className="form-control" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="555-0000"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input required type="date" className="form-control" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})}/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john@example.com"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingPatient ? 'Save Changes' : 'Create Patient'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontWeight: 'bold' }}>Patient Details</h3>
              <button onClick={() => setViewPatient(null)} className="modal-close"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="modal-content-view">
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-light)' }}>Patient ID</span>
                  <span style={{ fontWeight: '600' }}>#{viewPatient.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-light)' }}>Name</span>
                  <span style={{ fontWeight: '600' }}>{viewPatient.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-light)' }}>Contact Info</span>
                  <div style={{ textAlign: 'right' }}>
                    <div>{viewPatient.phone}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{viewPatient.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-light)' }}>Birth Date</span>
                  <span>{formatDOB(viewPatient.dob)} ({computeAge(viewPatient.dob)} years)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-light)' }}>Status</span>
                  <span className={`badge ${viewPatient.status === 'Active' ? 'badge-green' : 'badge-blue'}`}>{viewPatient.status}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setViewPatient(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewPatient(null); openEditForm(viewPatient); }}>Edit Record</button>
            </div>
          </div>
        </div>
      )}

      {patientToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
             <div className="modal-header">
              <h3 style={{ fontWeight: 'bold', color: 'var(--danger)' }}>Delete Patient</h3>
              <button onClick={() => setPatientToDelete(null)} className="modal-close"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p className="modal-text">
                Are you sure you want to delete <strong>{patientToDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setPatientToDelete(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', boxShadow: 'none' }} onClick={handleDeleteConfirm}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}