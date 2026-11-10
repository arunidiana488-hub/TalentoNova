require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log('================================');
    console.log(' API REST - CURRICULUM VITAE');
    console.log('================================');
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log('Estado: Ejecutándose correctamente');
    console.log('Proceso activo:', process.pid);
});

server.on('close', () => {
    console.log('El servidor se ha cerrado.');
});

server.on('error', (error) => {
    console.error('Error del servidor:', error.message);
});