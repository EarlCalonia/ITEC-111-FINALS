const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all appointments (Joined with Patient and Doctor names)
router.get('/', (req, res) => {
    // We select data from appointments (a), patients (p), and doctors (d)
    const sql = `
        SELECT 
            a.id, a.date, a.time, a.duration, a.type, a.notes, a.status,
            p.id as patientId, p.name as patientName, p.email as patientEmail, p.phone as patientPhone,
            d.id as doctorId, d.last_name as doctorLastName, d.first_name as doctorFirstName
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        ORDER BY a.date DESC, a.time ASC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);

        // Format data to match exactly what the React Frontend expects
        const formatted = results.map(row => ({
            id: row.id,
            date: new Date(row.date).toLocaleDateString('en-CA'), // YYYY-MM-DD format
            time: row.time,
            duration: row.duration,
            type: row.type,
            notes: row.notes,
            status: row.status,
            patient: row.patientName || 'Unknown', // Frontend expects "patient" (name)
            patient_id: row.patientId,             // Keep ID for logic
            email: row.patientEmail,
            phone: row.patientPhone,
            doc: row.doctorLastName ? `Dr. ${row.doctorLastName}` : 'Unknown', // Frontend expects "doc" string
            doctor_id: row.doctorId
        }));
        res.json(formatted);
    });
});

// POST new appointment
router.post('/', (req, res) => {
    const { patient_id, doctor_id, date, time, type, notes, status } = req.body;
    const sql = "INSERT INTO appointments (patient_id, doctor_id, date, time, type, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [patient_id, doctor_id, date, time, type, notes, status], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Appointment booked", id: result.insertId });
    });
});

/// PUT update appointment
router.put('/:id', (req, res) => {
    const { patient_id, doctor_id, date, time, type, notes, status } = req.body;
    const sql = "UPDATE appointments SET patient_id=?, doctor_id=?, date=?, time=?, type=?, notes=?, status=? WHERE id=?";
    
    db.query(sql, [patient_id, doctor_id, date, time, type, notes, status, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);

        // --- NEW: LOG THE ACTIVITY ---
        // We only log if the status is interesting (Confirmed, Completed, Cancelled)
        if (['Confirmed', 'Completed', 'Cancelled'].includes(status)) {
            const logSql = "INSERT INTO activity_logs (action_type, description, status) VALUES (?, ?, ?)";
            const logDesc = `Appointment ${status} for ${date} at ${time}`;
            const logStatus = status === 'Cancelled' ? 'danger' : 'success';
            
            db.query(logSql, ['Appointment', logDesc, logStatus], (logErr) => {
                if (logErr) console.error("Logging failed", logErr);
            });
        }
        // -----------------------------

        res.json({ message: "Appointment updated" });
    });
});
// DELETE appointment
router.delete('/:id', (req, res) => {
    const sql = "DELETE FROM appointments WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Appointment cancelled" });
    });
});

module.exports = router;