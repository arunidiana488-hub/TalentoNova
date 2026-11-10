
const express = require('express');
const cors = require('cors');

const app = express();
const jobsRoutes = require('./routes/jobs.routes');

app.use(cors());
app.use(express.json());
app.use('/api/jobs', jobsRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        proyecto: 'Sistema de Curriculum Vitae',
        mensaje: 'API REST funcionando correctamente',
        version: '1.0.0'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        estado: 'OK',
        servidor: 'Activo'
    });
});

module.exports = app;
