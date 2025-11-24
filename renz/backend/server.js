const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const patientsRoutes = require('./routes/patients');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/patients', patientsRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const doctorsRoutes = require('./routes/doctors'); 
app.use('/api/patients', patientsRoutes);
app.use('/api/doctors', doctorsRoutes); 

const appointmentsRoutes = require('./routes/appointments'); 

app.use('/api/patients', patientsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes); 

const dashboardRoutes = require('./routes/dashboard'); 



app.use('/api/dashboard', dashboardRoutes);