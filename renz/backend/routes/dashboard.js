const express = require('express');
const router = express.Router();
const db = require('../db'); 
const TODAY = new Date().toISOString().split('T')[0];

// Helper 1: Get counts for total patients/doctors
const getCount = (table) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT COUNT(id) as count FROM ${table}`;
        db.query(sql, (err, results) => {
            if (err) return reject(err);
            resolve(results[0].count);
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
            resolve(results[0].count);
        });
    });
};

// Helper 3: Get Today's detailed schedule (LIVE DATA)
const getTodaySchedule = () => {
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
        db.query(sql, [TODAY], (err, results) => {
            if (err) return reject(err);

            const schedule = results.map(row => ({
                id: row.id,
                time: row.time,
                patient: row.patient,
                type: row.type,
                duration: row.duration || '30 min',
                doctor: `Dr. ${row.doctorLastName}`,
                status: row.status,
                isCurrent: false // Simple simulation: check if time is within current hour
            }));
            resolve(schedule);
        });
    });
};

// Helper 4: Get simple list of doctors (for Doctor Status card)
const getDoctorStatus = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT d.first_name, d.last_name, 
            (SELECT COUNT(a.id) FROM appointments a WHERE a.doctor_id = d.id AND DATE(a.date) = CURDATE()) AS daily_count
            FROM doctors d
        `;
        db.query(sql, (err, results) => {
            if (err) return reject(err);
            
            // Map results to provide mock status/next appointment logic
            const statusData = results.map(doc => ({
                name: `Dr. ${doc.last_name}`,
                status: doc.daily_count > 0 ? 'Busy' : 'Available', // Simple dynamic status
                dailyCount: doc.daily_count,
                next: '10:15 AM', // Mock next appointment time (requires advanced query)
            }));
            resolve(statusData);
        });
    });
};

// Helper 5: Get weekly appointment totals (LIVE DATA)
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
            
            const weeklyData = results.map(row => ({
                day: row.day.toLocaleDateString('en-US', { weekday: 'short' }),
                count: row.count
            }));
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
            resolve(results);
        });
    });
};


// GET dashboard summary data
router.get('/summary', async (req, res) => {
    try {
        const [
            totalPatients, 
            todayAppts, 
            pendingAppts, 
            allApptDates, 
            todaySchedule, 
            doctorStatus, 
            weeklyAppts,
            recentActivity // <--- Now included
        ] = await Promise.all([
            getCount('patients'),
            getDailyAppointments(TODAY, null),
            getDailyAppointments(TODAY, 'Pending'),
            new Promise((resolve, reject) => {
                const sql = "SELECT DISTINCT date FROM appointments WHERE status != 'Cancelled'";
                db.query(sql, (err, results) => {
                    if (err) return reject(err);
                    resolve(results.map(r => r.date.toISOString().split('T')[0])); 
                });
            }),
            getTodaySchedule(), 
            getDoctorStatus(),
            getWeeklyApptData(),
            getRecentActivity() // <--- Now called
        ]);

        res.json({
            totalPatients,
            todayAppts,
            pendingAppts,
            apptDates: allApptDates,
            scheduleData: todaySchedule, 
            doctorStatus: doctorStatus, 
            weeklyAppts: weeklyAppts, 
            recentActivity: recentActivity, // <--- Sent to frontend
            
            // Alerts are now fully removed from backend (sent as empty array)
            alerts: [] 
        });

    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard summary.', detail: error.message });
    }
});

module.exports = router;