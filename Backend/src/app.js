const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routerUsers = require('./routes/user.router');

const app = express();

// Render pone un proxy delante: sin esto, el límite de intentos del login contaría la IP
// del proxy y no la del cliente
app.set('trust proxy', 1);
app.use(helmet());

// Manejar promesas no controladas para evitar que se caiga el backend
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Configuración de CORS para permitir solo tu dominio de Vercel y permitir credenciales
const corsOptions = {
    origin: [
        'https://taller-mecanico-52bo.vercel.app',
        'https://www.taller-mecanico-52bo.vercel.app',
        'http://localhost:4200'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));


// Middleware para recibir JSON y formularios
// La foto de un repuesto viaja en base64 dentro del JSON; ninguna otra ruta necesita más
// de 100 kB. Este parser va primero, así que el general ya no vuelve a leer ese cuerpo.
app.use('/api/users/inventario', express.json({ limit: '10mb' }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));

// Middleware para capturar errores generales
app.use((err, req, res, next) => {
    console.error(err.stack);
    // Si quieres más detalles del error en desarrollo:
    // res.status(500).send({ error: 'Something went wrong!', details: err.message });
    // En producción, es mejor solo el mensaje genérico:
    res.status(500).send({ error: 'Something went wrong!' });
});

// Tus rutas API
app.use('/api/users', routerUsers);

// Exporta tu app para usar en index.js o server.js
module.exports = app;
