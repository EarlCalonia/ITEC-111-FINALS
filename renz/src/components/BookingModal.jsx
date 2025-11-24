import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

export default function BookingModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [selectedTime, setSelectedTime] = useState(null);

  // Mock Availability Data
  const timeSlots = [
    { time: '09:00 AM', status: 'available' },
    { time: '09:30 AM', status: 'booked' },
    { time: '10:00 AM', status: 'available' },
    { time: '10:30 AM', status: 'blocked' }, // Break
    { time: '11:00 AM', status: 'available' },
    { time: '11:30 AM', status: 'available' },
    { time: '02:00 PM', status: 'available' },
    { time: '02:30 PM', status: 'available' },
    { time: '03:00 PM', status: 'booked' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        
        {/* Header */}
        <div className="modal-header">
          <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>New Appointment</h3>
          <button onClick={onClose} className="modal-close">
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          <form className="form-grid">
            
            {/* Patient Selection */}
            <div className="form-group">
              <label className="form-label">Select Patient</label>
              <select className="form-control">
                <option value="">Search or select a patient...</option>
                <option value="101">John Smith (ID: 101)</option>
                <option value="102">Sarah Williams (ID: 102)</option>
                <option value="104">Emily Davis (ID: 104)</option>
              </select>
            </div>

            {/* Doctor & Date Row */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Doctor</label>
                <select className="form-control">
                  <option>Dr. Johnson (GP)</option>
                  <option>Dr. Davis (Pediatric)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" />
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="form-group" style={{marginTop: '0.5rem'}}>
              <label className="form-label" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Clock size={16} className="text-primary"/> Available Slots
              </label>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', /* 4 cols looks better in modal */
                gap: '10px',
                marginTop: '8px' 
              }}>
                {timeSlots.map((slot, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    disabled={slot.status !== 'available'}
                    onClick={() => setSelectedTime(slot.time)}
                    style={{
                      padding: '8px 4px',
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                      border: selectedTime === slot.time ? '1px solid var(--primary-color)' : '1px solid var(--border)',
                      background: selectedTime === slot.time ? 'var(--primary-color)' : slot.status === 'available' ? 'white' : '#f1f5f9',
                      color: selectedTime === slot.time ? 'white' : slot.status === 'available' ? 'var(--text-dark)' : '#94a3b8',
                      cursor: slot.status === 'available' ? 'pointer' : 'not-allowed',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    {slot.time}
                    {slot.status === 'booked' && (
                      <span style={{
                        display:'block', fontSize:'0.55rem', color:'#ef4444', 
                        position:'absolute', bottom:'-6px', left:0, right:0, textAlign:'center', fontWeight:'700'
                      }}>BOOKED</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Appointment Notes</label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="Reason for visit, symptoms, etc..."
              ></textarea>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-outline">Cancel</button>
          <button className="btn btn-primary" disabled={!selectedTime}>
            Confirm Booking
          </button>
        </div>

      </div>
    </div>
  );
}