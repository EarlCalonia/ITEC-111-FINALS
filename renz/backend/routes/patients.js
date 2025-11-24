const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all patients
router.get('/', (req, res) => {
    const sql = "SELECT * FROM patients ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);

        // Map database snake_case columns to frontend camelCase if needed
        // But for now, we will adjust the frontend to read the data correctly.
        const formattedResults = results.map(p => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            email: p.email,
            dob: p.dob,
            status: p.status,
            lastVisit: p.last_visit ? new Date(p.last_visit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
        }));
        res.json(formattedResults);
    });
});

// POST new patient
router.post('/', (req, res) => {
    const { name, phone, email, dob, status } = req.body;
    const sql = "INSERT INTO patients (name, phone, email, dob, status) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, phone, email, dob, status], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, ...req.body, lastVisit: 'N/A' });
    });
});

// PUT update patient
router.put('/:id', (req, res) => {
    const { name, phone, email, dob, status } = req.body;
    const sql = "UPDATE patients SET name=?, phone=?, email=?, dob=?, status=? WHERE id=?";
    db.query(sql, [name, phone, email, dob, status, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Patient updated" });
    });
});

// DELETE patient
router.delete('/:id', (req, res) => {
    const sql = "DELETE FROM patients WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Patient deleted" });
    });
});

module.exports = router;