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
        'https://www.taller-mecanico-52bo.vercel.app',
        'http://localhost:4200'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));


// Middleware para recibir JSON y formularios
// ¡¡¡CAMBIO AQUÍ: AUMENTA EL LÍMITE DE TAMAÑO DEL CUERPO DE LA PETICIÓN!!!
// '50mb' es un buen punto de partida, ajusta según el tamaño máximo esperado de tus imágenes.
// Puedes usar '10mb', '20mb', '100mb' etc., pero 50mb suele ser suficiente para la mayoría de las imágenes web.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); // También importante para formularios grandes

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
