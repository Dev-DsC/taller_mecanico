const express = require('express');
const cors = require('cors');
const routerUsers = require('./routes/user.router');

const app = express();

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Define los orígenes permitidos para CORS
const allowedOrigins = [
  'https://taller-frontend.vercel.app',  // Cambia esta URL por la de tu frontend real en Vercel
  'http://localhost:4200'                 // Para pruebas locales Angular
];

// Configuración CORS personalizada
app.use(cors({
  origin: function(origin, callback) {
    // Permite peticiones sin origen (Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'El CORS no está permitido para este origen.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Something went wrong!' });
});

// Rutas de usuarios
app.use('/api/users', routerUsers);

module.exports = app;
