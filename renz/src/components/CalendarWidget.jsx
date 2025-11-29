import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarWidget() {
  const navigate = useNavigate();
  
  const todayObj = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(todayObj.getFullYear(), todayObj.getMonth())); 
  const [selectedDay, setSelectedDay] = useState(todayObj.getDate()); 
  const [hoveredDay, setHoveredDay] = useState(null); 
  const [apptDates, setApptDates] = useState([]); // State to store fetched appointment dates
  const [loading, setLoading] = useState(true);
  
  // --- FETCH APPOINTMENT DATES (FIXED) ---
  useEffect(() => {
    const fetchApptDates = async () => {
        try {
            // Direct IP
            const res = await fetch('http://127.0.0.1:5000/api/dashboard/summary');
            if (!res.ok) return;
            const data = await res.json();
            setApptDates(data.apptDates || []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch appointment dates:", error);
            setLoading(false);
        }
    };
    fetchApptDates();
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth });
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const navigateMonth = (direction) => { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1)); };
  const goToToday = () => { const now = new Date(); setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDay(now.getDate()); };

  const handleDateClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    setSelectedDay(day); 
    // Navigate to appointments page with selected date filter
    navigate(`/appointments?date=${dateString}`); 
  };

  const getDailyStats = (day) => { 
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    // Check if appointment exists
    const hasAppointment = apptDates.includes(dateString);

    if (day % 7 === 0) return { status: 'Closed', am: 0, pm: 0, hasAppointment: false }; 
    if (hasAppointment) return { status: 'Busy', am: 1, pm: 2, hasAppointment: true }; 
    return { status: 'Open', am: 4, pm: 5, hasAppointment: false }; 
  };

  const isToday = (day) => { return day === todayObj.getDate() && currentMonth.getMonth() === todayObj.getMonth() && currentMonth.getFullYear() === todayObj.getFullYear(); };

  if (loading) {
    return (
        <div className="calendar-widget card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Loading calendar data...</p>
        </div>
    );
  }

  return (
    <div className="calendar-widget card" style={{ transition: 'transform 0.2s' }}>
      <div className="cal-header">
        <span style={{color: 'var(--primary-color)', fontSize:'1.1rem', fontWeight: '600'}}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
        <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={goToToday} style={{background:'var(--accent-color)', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:'4px', color:'white', fontSize:'0.75rem', fontWeight:'600'}}>Today</button>
            <button onClick={() => navigateMonth(-1)} className="icon-btn"><ChevronLeft size={20} /></button>
            <button onClick={() => navigateMonth(1)} className="icon-btn"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="cal-grid">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => ( <div key={d} className="day-name">{d}</div> ))}
        {emptySlots.map((_, i) => <div key={`empty-${i}`} className="day-cell empty"></div>)}
        
        {days.map(day => {
          const stats = getDailyStats(day);
          const isHovered = hoveredDay === day;
          const isCurrentDay = isToday(day);
          const isSelected = selectedDay === day && currentMonth.getMonth() === todayObj.getMonth() && currentMonth.getFullYear() === todayObj.getFullYear();
          const hasAppointment = stats.hasAppointment;

          return (
            <div key={day} className={`day-cell ${isSelected ? 'active' : ''} ${isCurrentDay ? 'today' : ''}`} onClick={() => handleDateClick(day)} onMouseEnter={() => setHoveredDay(day)} onMouseLeave={() => setHoveredDay(null)}>
              {day}
              {hasAppointment && <div className="appt-dot"></div>}
              {isHovered && ( <div className="calendar-tooltip">{stats.status === 'Closed' ? ( <div style={{color: '#fda4af'}}>Clinic Closed</div> ) : ( <> <div className="tooltip-row"><span><span className="dot dot-green"></span>Morning</span><strong>{stats.am} slots</strong></div> <div className="tooltip-row"><span><span className="dot dot-yellow"></span>Afternoon</span><strong>{stats.pm} slots</strong></div> <div style={{fontSize:'0.65rem', marginTop:'4px', color:'#94a3b8', borderTop:'1px solid #334155', paddingTop:'2px'}}>Click to view details</div> </> )}</div> )}
            </div>
          );
        })}
      </div>
      
      <div style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span style={{color: 'var(--text-light)'}}>Appointments shown:</span><span style={{fontWeight: '600', color: 'var(--primary-color)'}}>{apptDates.length} days</span></div>
      </div>
    </div>
  );
}