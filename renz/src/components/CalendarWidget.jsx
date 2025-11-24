import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarWidget() {
  const navigate = useNavigate();
  
  const todayObj = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(todayObj.getFullYear(), todayObj.getMonth())); 
  const [selectedDay, setSelectedDay] = useState(todayObj.getDate()); 
  const [hoveredDay, setHoveredDay] = useState(null); 
  
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth });
  
  const apptDays = [5, 12, 15, 19, 24]; 

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const navigateMonth = (direction) => { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1)); };
  const goToToday = () => { const now = new Date(); setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDay(now.getDate()); };

  const handleDateClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    setSelectedDay(day); 
    navigate(`/appointments?date=${dateString}`); 
  };

  const getDailyStats = (day) => { if (day % 7 === 0) return { status: 'Closed', am: 0, pm: 0 }; if (apptDays.includes(day)) return { status: 'Busy', am: 1, pm: 2 }; return { status: 'Open', am: 4, pm: 5 }; };
  const isToday = (day) => { return day === todayObj.getDate() && currentMonth.getMonth() === todayObj.getMonth() && currentMonth.getFullYear() === todayObj.getFullYear(); };

  return (
    <div className="calendar-widget card" style={{ transition: 'transform 0.2s' }}>
      <div className="cal-header">
        <span style={{color: 'var(--primary-color)', fontSize:'1.1rem', fontWeight: '600'}}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
        <div style={{ display: 'flex', gap: '5px' }}><button onClick={goToToday} style={{background:'var(--accent-color)', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:'4px', color:'white', fontSize:'0.75rem', fontWeight:'600'}}>Today</button><button onClick={() => navigateMonth(-1)} className="icon-btn"><ChevronLeft size={20} /></button><button onClick={() => navigateMonth(1)} className="icon-btn"><ChevronRight size={20} /></button></div>
      </div>

      <div className="cal-grid">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => ( <div key={d} className="day-name">{d}</div> ))}
        {emptySlots.map((_, i) => <div key={`empty-${i}`} className="day-cell empty"></div>)}
        
        {days.map(day => {
          const stats = getDailyStats(day);
          const isHovered = hoveredDay === day;
          const isCurrentDay = isToday(day);
          const isSelected = selectedDay === day;
          const hasAppointment = apptDays.includes(day);

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
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span style={{color: 'var(--text-light)'}}>Appointments this month:</span><span style={{fontWeight: '600', color: 'var(--primary-color)'}}>{apptDays.length}</span></div>
      </div>
    </div>
  );
}