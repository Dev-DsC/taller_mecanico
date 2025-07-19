const express = require('express');
const cors = require('cors');
const routerUsers = require('./routes/user.router');

const app = express();

// Manejar promesas no controladas para evitar que se caiga el backend
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Configuración de CORS para permitir solo tu dominio de Vercel y permitir credenciales
const corsOptions = {
    origin: [
        'https://taller-mecanico-52bo.vercel.app',
        'https://www.taller-mecanico-52bo.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));



// Middleware para recibir JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para capturar errores generales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Something went wrong!' });
});

// Tus rutas API
app.use('/api/users', routerUsers);

// Exporta tu app para usar en index.js o server.js
module.exports = app;
