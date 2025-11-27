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

// Helper 3: Get Today's detailed schedule (Accepts dynamic date)
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

            // Handle case where results might be undefined
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

// Helper 4: Get simple list of doctors
const getDoctorStatus = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT d.first_name, d.last_name, 
            (SELECT COUNT(a.id) FROM appointments a WHERE a.doctor_id = d.id AND DATE(a.date) = CURDATE()) AS daily_count
            FROM doctors d
        `;
        db.query(sql, (err, results) => {
            if (err) return reject(err);
            if (!results) return resolve([]);

            const statusData = results.map(doc => ({
                name: `Dr. ${doc.last_name}`,
                status: doc.daily_count > 0 ? 'Busy' : 'Available',
                dailyCount: doc.daily_count,
                next: '10:15 AM', 
            }));
            resolve(statusData);
        });
    });
};

// Helper 5: Get weekly appointment totals
const getWeeklyApptData = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                DATE(date) as day, 
                COUNT(id) as count 
            FROM appointments 
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
            GROUP BY DATE(date) 
            ORDER BY DATE(date) ASC
        `;
        db.query(sql, (err, results) => {
            if (err) return reject(err);
            if (!results) return resolve([]);

            const weeklyData = results.map(row => {
                // Safety check: ensure row.day is a valid date object before converting
                let dayLabel = 'N/A';
                if (row.day) {
                    const d = new Date(row.day);
                    if (!isNaN(d.getTime())) {
                        dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
                    }
                }
                return {
                    day: dayLabel,
                    count: row.count
                };
            });
            resolve(weeklyData);
        });
    });
};

// Helper 6: Get recent activity logs
const getRecentActivity = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5`;
        db.query(sql, (err, results) => {
            if (err) return reject(err);
            resolve(results || []);
        });
    });
};

// --- Main Route ---

router.get('/summary', async (req, res) => {
    try {
        // 1. Robust Manual Date Calculation (YYYY-MM-DD) based on Local Time
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dynamicToday = `${year}-${month}-${day}`;

        console.log("Fetching dashboard for date:", dynamicToday); // Debug Log

        const [
            totalPatients, 
            todayAppts, 
            pendingAppts, 
            allApptDates, 
            todaySchedule, 
            doctorStatus, 
            weeklyAppts,
            recentActivity 
        ] = await Promise.all([
            getCount('patients'),
            getDailyAppointments(dynamicToday, null),
            getDailyAppointments(dynamicToday, 'Pending'),
            new Promise((resolve, reject) => {
                const sql = "SELECT DISTINCT date FROM appointments WHERE status != 'Cancelled'";
                db.query(sql, (err, results) => {
                    if (err) return reject(err);
                    // Safety map
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
            getRecentActivity()
        ]);

        res.json({
            totalPatients,
            todayAppts,
            pendingAppts,
            apptDates: allApptDates,
            scheduleData: todaySchedule, 
            doctorStatus: doctorStatus, 
            weeklyAppts: weeklyAppts, 
            recentActivity: recentActivity, 
            alerts: [] 
        });

    } catch (error) {
        console.error('Dashboard summary error:', error);
        // Return a basic valid structure even on error to prevent white screen
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