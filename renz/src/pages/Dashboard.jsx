import React, { useMemo, useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import { Calendar, Users, AlertCircle, TrendingUp, TrendingDown, Clock, BarChart3, Search, CheckCircle, XCircle } from 'lucide-react';
import CalendarWidget from '../components/CalendarWidget';
import '../App.css';

const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
  <div className="card stat-card">
    <div><p className="stat-title">{title}</p><h3 className="stat-value">{value}</h3>{trend && (<div className="stat-trend">{trend === 'up' ? <TrendingUp size={16} color="#10b981" /> : <TrendingDown size={16} color="#ef4444" />}<span className={trend === 'up' ? 'trend-up' : 'trend-down'}>{trendValue}</span></div>)}</div><div className="stat-icon" style={{ backgroundColor: color }}>{icon}</div>
  </div>
);

const SCHEDULE_DATA = [
  { id: 1, time: '09:00 AM', patient: 'John Smith', type: 'General Checkup', duration: '30 min', doctor: 'Dr. Johnson', status: 'Completed' },
  { id: 2, time: '09:30 AM', patient: 'Sarah Williams', type: 'Follow-up', duration: '15 min', doctor: 'Dr. Davis', status: 'In Progress' },
  { id: 3, time: '10:15 AM', patient: 'Michael Brown', type: 'Consultation', duration: '45 min', doctor: 'Dr. Johnson', status: 'Pending', isCurrent: true },
  { id: 4, time: '11:00 AM', patient: 'Emily Davis', type: 'Urgent Care', duration: '30 min', doctor: 'Dr. Davis', status: 'Confirmed' },
  { id: 5, time: '11:30 AM', patient: 'Robert Wilson', type: 'General Checkup', duration: '30 min', doctor: 'Dr. Johnson', status: 'Confirmed' },
];

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => { const timer = setInterval(() => { setCurrentDate(new Date()); }, 1000); return () => clearInterval(timer); }, []);

  const formattedDateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTimeStr = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const filteredSchedule = useMemo(() => {
    return SCHEDULE_DATA.filter((item) => {
      const searchMatch = item.patient.toLowerCase().includes(searchTerm.toLowerCase()) || item.type.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      const hour = parseInt(item.time.split(':')[0], 10); const period = item.time.split(' ')[1]; const hour24 = period === 'AM' && hour !== 12 ? hour : period === 'PM' && hour !== 12 ? hour + 12 : hour;
      const timeMatch = timeFilter === 'all' || (timeFilter === 'morning' && hour24 >= 6 && hour24 < 12) || (timeFilter === 'afternoon' && hour24 >= 12 && hour24 < 18) || (timeFilter === 'evening' && hour24 >= 18);
      const doctorMatch = doctorFilter === 'all' || item.doctor === doctorFilter;
      return searchMatch && statusMatch && timeMatch && doctorMatch;
    });
  }, [doctorFilter, searchTerm, statusFilter, timeFilter]);

  const getStatusBadge = (status) => { if (status === 'Completed') return 'badge badge-completed'; if (status === 'Confirmed') return 'badge badge-green'; return 'badge badge-blue'; };

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h2 className="page-title">Dashboard</h2><span className="page-date" style={{color:'var(--text-light)', fontWeight:'500'}}>{formattedDateStr}</span></div>

      <div className="dashboard-container">
        <div className="left-col animate-slide-up">
          <CalendarWidget />
          <div className="card card-spacing doctor-status"><h4>Doctor Status</h4><div className="doctor-info"><div className="doctor-name-status"><span><strong>Dr. Johnson</strong></span><span className="badge badge-green">Available</span></div><div className="doctor-details"><div>• 4 patients today</div><div>• Next: 10:15 AM</div><div>• Available after 12:00 PM</div></div></div><div><div className="doctor-name-status"><span><strong>Dr. Davis</strong></span><span className="badge badge-blue">Busy</span></div><div className="doctor-details"><div>• 3 patients today</div><div>• With patient now</div><div>• Available after 11:30 AM</div></div></div></div>
          <div className="card card-spacing alerts"><h4><AlertCircle size={18} color="#f59e0b" /> Alerts & Notifications</h4><div><div className="alert-item warning"><div className="alert-title">Patient Waiting</div><div className="alert-message">Sarah Williams has been waiting 15 minutes past appointment time</div></div><div className="alert-item danger"><div className="alert-title">Urgent Appointment</div><div className="alert-message">Emily Davis - Urgent Care needs immediate attention</div></div></div></div>
        </div>

        <div className="right-col animate-slide-up">
          <div className="stats-grid"><StatCard title="Today's Appts" value="12" icon={<Calendar size={24}/>} color="#2563eb" trend="up" trendValue="8% from yesterday" /><StatCard title="Total Patients" value="248" icon={<Users size={24}/>} color="#10b981" trend="up" trendValue="12 new this week" /><StatCard title="Pending" value="3" icon={<AlertCircle size={24}/>} color="#f59e0b" trend="down" trendValue="2% from yesterday" /></div>

          <div className="dashboard-filters-card">
            <h4 className="dashboard-filters-title">Search &amp; Filters</h4>
            <div className="dashboard-filters-row">
              <div className="dashboard-filter-group"><label>Search</label><div className="filter-input-wrapper"><Search size={16} className="filter-input-icon" /><input type="text" placeholder="Search patients or notes" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div></div>
              <div className="dashboard-filter-group"><label>Status</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All Status</option><option value="Confirmed">Confirmed</option><option value="Pending">Pending</option><option value="Completed">Completed</option><option value="In Progress">In Progress</option></select></div>
              <div className="dashboard-filter-group"><label>Time Range</label><select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}><option value="all">All Day</option><option value="morning">Morning (6AM-12PM)</option><option value="afternoon">Afternoon (12PM-6PM)</option><option value="evening">Evening (6PM+)</option></select></div>
              <div className="dashboard-filter-group"><label>Doctor</label><select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}><option value="all">All Doctors</option><option value="Dr. Johnson">Dr. Johnson</option><option value="Dr. Davis">Dr. Davis</option></select></div>
            </div>
          </div>

          <div className="card schedule-card">
            <div className="schedule-header"><h3>Today's Schedule</h3><span className="current-time">Current: <strong>{formattedTimeStr}</strong></span></div>
            <div className="table-container">
              <table>
                <thead><tr><th>Time</th><th>Patient</th><th>Type</th><th>Duration</th><th>Doctor</th><th>Status</th></tr></thead>
                <tbody>
                  {filteredSchedule.length === 0 ? ( <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No appointments match your filters.</td></tr> ) : ( filteredSchedule.map((item) => ( <tr key={item.id} className={item.isCurrent ? 'current-appointment' : ''}><td>{item.time}</td><td>{item.patient}</td><td>{item.type}</td><td>{item.duration}</td><td>{item.doctor}</td><td><span className={getStatusBadge(item.status)}>{item.status === 'Completed' && <Calendar size={12} />} {item.status === 'Confirmed' && <CheckCircle size={12} />} {item.status !== 'Completed' && item.status !== 'Confirmed' && <Clock size={12} />} {' '} {item.status}</span></td></tr> )) )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card card-spacing weekly-overview">
            <h4><BarChart3 size={20} color="#3b82f6" /> Weekly Overview</h4>
            <div className="chart-container"><div><h5 className="chart-title">Appointments This Week</h5><div className="bar-chart">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => { const percentages = [40, 65, 85, 35, 60]; const isToday = index === 2; return ( <div key={day} className="bar-wrapper"><div className={`animate-slide-up bar ${isToday ? 'today' : 'other'}`} style={{ height: `${percentages[index]}%` }}><div className="bar-tooltip">{isToday ? '12' : ''}</div></div><span className="day-label">{day}</span></div> ); })}</div></div></div>
          </div>

          <div className="card card-spacing activity-feed">
            <h4>Recent Activity</h4>
            <div><div className="activity-item"><div className="activity-icon success"><CheckCircle size={16} color="#15803d" /></div><div className="activity-content"><div className="activity-title">Appointment Completed</div><div className="activity-description">John Smith - General Checkup with Dr. Johnson</div><div className="activity-time">5 minutes ago</div></div></div><div className="activity-item"><div className="activity-icon danger"><XCircle size={16} color="#dc2626" /></div><div className="activity-content"><div className="activity-title">Appointment Cancelled</div><div className="activity-description">James Anderson - Follow-up (patient request)</div><div className="activity-time">1 hour ago</div></div></div></div>
          </div>
        </div>
      </div>
    </div>
  );  
}