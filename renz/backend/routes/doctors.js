const express = require('express');
const router = express.Router();
const db = require('../db');


// Function to get the total count of appointments for a specific day
const getDailyAppointments = (db, date, status) => {
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
// Export it so it can be used in server.js
module.exports.getDailyAppointments = getDailyAppointments;

// GET all doctors (with their leaves)
router.get('/', (req, res) => {
    const sqlDocs = "SELECT * FROM doctors ORDER BY id DESC";
    const sqlLeaves = "SELECT * FROM doctor_leaves WHERE leave_date >= CURDATE()";

    db.query(sqlDocs, (err, doctors) => {
        if (err) return res.status(500).json(err);

        db.query(sqlLeaves, (err, leaves) => {
            if (err) return res.status(500).json(err);

            // Combine doctors with their specific leaves
            const combinedData = doctors.map(doc => {
                const docLeaves = leaves.filter(l => l.doctor_id === doc.id);
                return {
                    id: doc.id,
                    firstName: doc.first_name,
                    lastName: doc.last_name,
                    email: doc.email,
                    phone: doc.phone,
                    role: doc.role,
                    scheduleStart: doc.schedule_start,
                    scheduleEnd: doc.schedule_end,
                    status: doc.status,
                    leaves: docLeaves.map(l => ({ id: l.id, date: l.leave_date, reason: l.reason }))
                };
            });
            res.json(combinedData);
        });
    });
});

// POST new doctor
router.post('/', (req, res) => {
    const { firstName, lastName, email, phone, role, scheduleStart, scheduleEnd } = req.body;
    const sql = "INSERT INTO doctors (first_name, last_name, email, phone, role, schedule_start, schedule_end) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [firstName, lastName, email, phone, role, scheduleStart, scheduleEnd], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Doctor added successfully", id: result.insertId });
    });
});

// PUT update doctor
router.put('/:id', (req, res) => {
    const { firstName, lastName, email, phone, role, scheduleStart, scheduleEnd } = req.body;
    const sql = "UPDATE doctors SET first_name=?, last_name=?, email=?, phone=?, role=?, schedule_start=?, schedule_end=? WHERE id=?";
    
    db.query(sql, [firstName, lastName, email, phone, role, scheduleStart, scheduleEnd, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Doctor updated" });
    });
});

// POST add leave (Block Time)
router.post('/:id/leaves', (req, res) => {
    const { date, reason } = req.body;
    const sql = "INSERT INTO doctor_leaves (doctor_id, leave_date, reason) VALUES (?, ?, ?)";
    
    db.query(sql, [req.params.id, date, reason], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Leave added" });
    });
});

// DELETE remove leave
router.delete('/leaves/:leaveId', (req, res) => {
    const sql = "DELETE FROM doctor_leaves WHERE id = ?";
    db.query(sql, [req.params.leaveId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Leave removed" });
    });
});

// DELETE doctor
router.delete('/:id', (req, res) => {
    const sql = "DELETE FROM doctors WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Doctor deleted" });
    });
});

module.exports = router;