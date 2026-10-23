const dotenv = require('dotenv');

// Antes de cargar la app: db.js lee process.env al importarse
dotenv.config();

const app = require('./app');

const PORT = process.env.PORT || 3000;

// Aquí es donde debes poner '0.0.0.0' para escuchar por IP
app.listen(PORT, '0.0.0.0', () => {
    console.log('listening server on ' + PORT);
});
