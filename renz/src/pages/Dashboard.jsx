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

// MOCK SCHEDULE DATA REMOVED

export default function Dashboard() {
  // Initial state updated to include weeklyAppts
  const [summaryData, setSummaryData] = useState({
    totalPatients: 0,
    todayAppts: 0,
    pendingAppts: 0,
    scheduleData: [], 
    doctorStatus: [], 
    weeklyAppts: [], // NOW LIVE
    alerts: [] ,
    recentActivity: []

  });
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/dashboard/summary');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setSummaryData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard summary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    
    const timer = setInterval(() => { setCurrentDate(new Date()); }, 1000); 
    return () => clearInterval(timer);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  const formattedDateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTimeStr = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Filter using LIVE SCHEDULE DATA
  const filteredSchedule = useMemo(() => {
    return summaryData.scheduleData.filter((item) => {
      const searchMatch = item.patient.toLowerCase().includes(searchTerm.toLowerCase()) || item.type.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      
      // Time parsing is tricky since DB time format might be 'HH:MM:SS'
      const timeParts = item.time.includes('M') ? item.time.split(/[: ]/) : [item.time.slice(0, 2), item.time.slice(3, 5), 'AM'];
      let hour = parseInt(timeParts[0], 10);
      const period = timeParts.length > 2 ? timeParts[2] : 'AM';
      
      const hour24 = period === 'AM' && hour !== 12 ? hour : period === 'PM' && hour !== 12 ? hour + 12 : hour;
      
      const timeMatch = timeFilter === 'all' || 
                        (timeFilter === 'morning' && hour24 >= 6 && hour24 < 12) || 
                        (timeFilter === 'afternoon' && hour24 >= 12 && hour24 < 18) || 
                        (timeFilter === 'evening' && hour24 >= 18);
                        
      const doctorMatch = doctorFilter === 'all' || item.doctor === doctorFilter;
      return searchMatch && statusMatch && timeMatch && doctorMatch;
    });
  }, [summaryData.scheduleData, doctorFilter, searchTerm, statusFilter, timeFilter]);

  const getStatusBadge = (status) => { if (status === 'Completed') return 'badge badge-completed'; if (status === 'Confirmed') return 'badge badge-green'; return 'badge badge-blue'; };
  
  // Logic for Weekly Chart (Real Data)
  const maxAppts = Math.max(...summaryData.weeklyAppts.map(a => a.count), 0);
  const chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) {
    return (
        <div className="dashboard-loading" style={{textAlign: 'center', padding: '5rem', fontSize: '1.2rem', color: 'var(--text-light)'}}>
            <p>Loading Dashboard...</p>
        </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h2 className="page-title">Dashboard</h2><span className="page-date" style={{color:'var(--text-light)', fontWeight:'500'}}>{formattedDateStr}</span></div>

      <div className="dashboard-container">
        <div className="left-col animate-slide-up">
          <CalendarWidget />
          
          {/* Doctor Status Card (LIVE BASE DATA) */}
          <div className="card card-spacing doctor-status">
            <h4>Doctor Status</h4>
            {summaryData.doctorStatus.map(doc => (
                <div key={doc.name}>
                    <div className="doctor-info">
                        <div className="doctor-name-status">
                            <span><strong>{doc.name}</strong></span>
                            <span className={`badge ${doc.status === 'Available' ? 'badge-green' : 'badge-blue'}`}>{doc.status}</span>
                        </div>
                        <div className="doctor-details">
                            {/* NOTE: Patient count and Next Appt are still simplified/mocked in BE for now */}
                            <div>• {doc.dailyCount} patients today</div>
                            <div>• Next: {doc.next}</div> 
                        </div>
                    </div>
                </div>
            ))}
          </div>

          {/* Alerts Card (MOCK REMOVED - Empty array sent from BE) */}
          <div className="card card-spacing alerts">
            <h4><AlertCircle size={18} color="#f59e0b" /> Alerts & Notifications</h4>
            {summaryData.alerts.length === 0 ? (
                <div className="alert-item warning">
                    <div className="alert-title">No Critical Alerts</div>
                    <div className="alert-message">System is running normally.</div>
                </div>
            ) : (
                summaryData.alerts.map((alert, index) => (
                    <div key={index} className="alert-item warning">
                        <div className="alert-title">{alert.title}</div>
                        <div className="alert-message">{alert.message}</div>
                    </div>
                ))
            )}
          </div>
        </div>

        <div className="right-col animate-slide-up">
          <div className="stats-grid">
            <StatCard 
                title="Today's Appts" 
                value={summaryData.todayAppts} 
                icon={<Calendar size={24}/>} 
                color="#2563eb" 
                trend="up" 
                trendValue="8% from yesterday" 
            />
            <StatCard 
                title="Total Patients" 
                value={summaryData.totalPatients} 
                icon={<Users size={24}/>} 
                color="#10b981" 
                trend="up" 
                trendValue="12 new this week" 
            />
            <StatCard 
                title="Pending Today" 
                value={summaryData.pendingAppts} 
                icon={<AlertCircle size={24}/>} 
                color="#f59e0b" 
                trend="down" 
                trendValue="2% from yesterday" 
            />
          </div>

          <div className="dashboard-filters-card">
            <h4 className="dashboard-filters-title">Search &amp; Filters</h4>
            <div className="dashboard-filters-row">
              <div className="dashboard-filter-group"><label>Search</label><div className="filter-input-wrapper"><Search size={16} className="filter-input-icon" /><input type="text" placeholder="Search patients or notes" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div></div>
              <div className="dashboard-filter-group"><label>Status</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All Status</option><option value="Confirmed">Confirmed</option><option value="Pending">Pending</option><option value="Completed">Completed</option><option value="In Progress">In Progress</option></select></div>
              <div className="dashboard-filter-group"><label>Time Range</label><select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}><option value="all">All Day</option><option value="morning">Morning (6AM-12PM)</option><option value="afternoon">Afternoon (12PM-6PM)</option><option value="evening">Evening (6PM+)</option></select></div>
              <div className="dashboard-filter-group"><label>Doctor</label><select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}><option value="all">All Doctors</option>{summaryData.doctorStatus.map(doc => <option key={doc.name} value={doc.name}>{doc.name}</option>)}</select></div>
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

          {/* Weekly Overview - NOW LIVE DATA */}
          <div className="card card-spacing weekly-overview">
            <h4><BarChart3 size={20} color="#3b82f6" /> Weekly Overview</h4>
            <div className="chart-container">
                <div>
                    <h5 className="chart-title">Appointments Last 7 Days</h5>
                    <div className="bar-chart">
                        {summaryData.weeklyAppts.map((appt, index) => { // 1. Add 'index' here
                            const percentage = maxAppts > 0 ? (appt.count / maxAppts) * 100 : 0;
                            const isToday = index === summaryData.weeklyAppts.length - 1; 

                            return ( 
                                // 2. Change key={appt.day} to key={index}
                                <div key={index} className="bar-wrapper">
                                    <div className={`animate-slide-up bar ${isToday ? 'today' : 'other'}`} style={{ height: `${percentage}%` }}>
                                        <div className="bar-tooltip">{appt.count}</div>
                                    </div>
                                    <span className="day-label">{appt.day.slice(0, 3)}</span>
                                </div> 
                            ); 
                        })}
                    </div>
                    {summaryData.weeklyAppts.length === 0 && <p style={{textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)'}}>No appointment data in the last 7 days.</p>}
                </div>
            </div>
          </div>

          {/* Activity Feed - MOCK REMOVED */}
         <div className="card card-spacing activity-feed">
  <h4>Recent Activity</h4>
  {summaryData.recentActivity && summaryData.recentActivity.length > 0 ? (
    <div>
      {summaryData.recentActivity.map((log) => (
        <div key={log.id} className="activity-item">
          <div className={`activity-icon ${log.status}`}>
            {log.status === 'danger' ? <XCircle size={16} color="#dc2626" /> : <CheckCircle size={16} color="#15803d" />}
          </div>
          <div className="activity-content">
            <div className="activity-title">{log.action_type} Update</div>
            <div className="activity-description">{log.description}</div>
            {/* Simple time formatting */}
            <div className="activity-time">{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p style={{textAlign: 'center', padding: '1rem', fontSize: '0.8rem', color: 'var(--text-light)'}}>No recent activity.</p>
  )}
</div>
        </div>
      </div>
    </div>
  );  
}