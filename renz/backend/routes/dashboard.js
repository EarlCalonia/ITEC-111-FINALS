const express = require('express');
const router = express.Router();
const db = require('../db'); 

// --- Helper Functions ---

// Helper 1: Get counts for total patients/doctors
const getCount = (table) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT COUNT(id) as count FROM ${table}`;
        db.query(sql, (err, results) => {
            if (err) return reject(err);
            resolve(results[0]?.count || 0);
        });
    });
};

// Helper 2: Function to get the total count of appointments for a specific day
const getDailyAppointments = (date, status) => { 
    return new Promise((resolve, reject) => {
        let sql = `SELECT COUNT(id) as count FROM appointments WHERE DATE(date) = ?`;
        const params = [date];
        
        if (status) {
            sql += ` AND status = ?`;
            params.push(status);
        }
        
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results[0]?.count || 0);
        });
    });
};

// Helper 3: Get Today's detailed schedule
const getTodaySchedule = (date) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                a.id, a.time, a.duration, a.type, a.status,
                p.name as patient,
                d.last_name as doctorLastName
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            WHERE DATE(a.date) = ? AND a.status != 'Cancelled'
            ORDER BY a.time ASC
        `;
        db.query(sql, [date], (err, results) => {
            if (err) return reject(err);
            if (!results) return resolve([]);

            const schedule = results.map(row => ({
                id: row.id,
                time: row.time,
                patient: row.patient || 'Unknown',
                type: row.type,
                duration: row.duration || '30 min',
                doctor: row.doctorLastName ? `Dr. ${row.doctorLastName}` : 'Unassigned',
                status: row.status,
                isCurrent: false 
            }));
            resolve(schedule);
        });
    });
};

// Helper 4: Get simple list of doctors (UPDATED to get more data)
const getDoctorStatus = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                d.id, d.first_name, d.last_name, 
            (SELECT MIN(a.time) FROM appointments a WHERE a.doctor_id = d.id AND DATE(a.date) = CURDATE() AND a.status != 'Cancelled' AND a.status != 'Completed') AS next_appt_time,
            (SELECT COUNT(a.id) FROM appointments a WHERE a.doctor_id = d.id AND DATE(a.date) = CURDATE() AND a.status != 'Cancelled') AS daily_count
            FROM doctors d
        `;
        db.query(sql, (err, results) => {
            if (err) return reject(err);
            if (!results) return resolve([]);

            const statusData = results.map(doc => ({
                id: doc.id, // KEEP ID for matching with leaves later
                name: `Dr. ${doc.last_name}`,
                dailyCount: doc.daily_count || 0,
                // Initial status based only on appointments
                status: doc.daily_count > 0 ? 'Busy' : 'Available',
                next: doc.next_appt_time || 'N/A', 
            }));
            resolve(statusData);
        });
    });
};

// Helper 5: Get weekly appointment totals (TIMEZONE FIXED)
const getWeeklyApptData = () => {
    return new Promise((resolve, reject) => {
        // 1. Generate the last 7 dates using LOCAL time components
        // This fixes bugs where UTC time might make "Today" appear as yesterday
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            
            days.push(`${year}-${month}-${day}`); // YYYY-MM-DD
        }

        // 2. Query database
        const sql = `
            SELECT 
                DATE(date) as dateStr, 
                COUNT(id) as count 
            FROM appointments 
            WHERE date >= ? 
            GROUP BY DATE(date)
        `;
        
        db.query(sql, [days[0]], (err, results) => {
            if (err) return reject(err);
            
            const countsMap = {};
            if (results) {
                results.forEach(r => {
                    let key = r.dateStr;
                    // Handle MySQL Date object conversion
                    if (r.dateStr instanceof Date) {
                        const year = r.dateStr.getFullYear();
                        const month = String(r.dateStr.getMonth() + 1).padStart(2, '0');
                        const day = String(r.dateStr.getDate()).padStart(2, '0');
                        key = `${year}-${month}-${day}`;
                    }
                    countsMap[key] = r.count;
                });
            }

            const weeklyData = days.map(dateStr => {
                const dateObj = new Date(dateStr);
                return {
                    day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
                    count: countsMap[dateStr] || 0
                };
            });

            resolve(weeklyData);
        });
    });
};

// Helper 6: Get recent activity
const getRecentActivity = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5`;
        db.query(sql, (err, results) => {
            if (err) return reject(err);
            resolve(results || []);
        });
    });
};

// Helper 7: Get doctors on leave (UPDATED to return IDs for merging)
const getDoctorLeaves = (date) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT d.id as doctorId, d.first_name, d.last_name, l.reason 
            FROM doctor_leaves l
            JOIN doctors d ON l.doctor_id = d.id
            WHERE l.leave_date = ?
        `;
        db.query(sql, [date], (err, results) => {
            if (err) return reject(err);
            // Return IDs and reason of doctors on leave today
            resolve((results || []).map(r => ({ id: r.doctorId, reason: r.reason, lastName: r.last_name }))); 
        });
    });
};

// --- Main Route ---

router.get('/summary', async (req, res) => {
    try {
        // 1. Calculate Dynamic Today using LOCAL time
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dynamicToday = `${year}-${month}-${day}`;

        const [
            totalPatients, 
            todayAppts, 
            pendingAppts, 
            allApptDates, 
            todaySchedule, 
            rawDoctorStatus, 
            weeklyAppts,
            recentActivity,
            todaysLeaves 
        ] = await Promise.all([
            getCount('patients'),
            getDailyAppointments(dynamicToday, null),
            getDailyAppointments(dynamicToday, 'Pending'),
            new Promise((resolve, reject) => {
                const sql = "SELECT DISTINCT date FROM appointments WHERE status != 'Cancelled'";
                db.query(sql, (err, results) => {
                    if (err) return reject(err);
                    const dates = (results || []).map(r => {
                        try { return r.date.toISOString().split('T')[0]; } 
                        catch (e) { return null; }
                    }).filter(d => d);
                    resolve(dates); 
                });
            }),
            getTodaySchedule(dynamicToday), 
            getDoctorStatus(), 
            getWeeklyApptData(),
            getRecentActivity(),
            getDoctorLeaves(dynamicToday)
        ]);

        const alerts = [];
        const onLeaveDoctorIds = new Set(todaysLeaves.map(l => l.id));

        // FIX: Combine rawDoctorStatus with todaysLeaves to get final doctorStatus
        const finalDoctorStatus = rawDoctorStatus.map(doc => {
            if (onLeaveDoctorIds.has(doc.id)) {
                const leave = todaysLeaves.find(l => l.id === doc.id);
                return { 
                    ...doc, 
                    status: 'On Leave', 
                    // Update 'next' field to show the reason for leave
                    next: `On Leave: ${leave.reason}`, 
                    dailyCount: 0 // Doctor has 0 availability when on leave
                };
            }
            
            // If not on leave, format the 'next' appointment time
            if (doc.status === 'Available') {
                doc.next = 'No appointments scheduled';
            } else if (doc.next !== 'N/A') {
                 doc.next = `Next: ${doc.next}`;
            }

            return doc;
        });

        // Update alerts based on actual leaves
        todaysLeaves.forEach(leave => {
            alerts.push({
                title: "Doctor Absent",
                message: `Dr. ${leave.lastName} is on leave (${leave.reason}).`,
                type: "warning"
            });
        });


        if (pendingAppts > 5) {
            alerts.push({
                title: "Action Required",
                message: `${pendingAppts} appointments are pending confirmation.`,
                type: "danger"
            });
        }

        res.json({
            totalPatients,
            todayAppts,
            pendingAppts,
            apptDates: allApptDates,
            scheduleData: todaySchedule, 
            doctorStatus: finalDoctorStatus, // Use the merged list
            weeklyAppts: weeklyAppts, 
            recentActivity: recentActivity, 
            alerts: alerts 
        });

    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.json({
            totalPatients: 0,
            todayAppts: 0,
            pendingAppts: 0,
            apptDates: [],
            scheduleData: [], 
            doctorStatus: [], 
            weeklyAppts: [], 
            recentActivity: [], 
            alerts: [{ title: "System Error", message: "Could not load data." }] 
        });
    }
});

module.exports = router;