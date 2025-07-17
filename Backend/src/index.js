const dotenv = require('dotenv');
const app = require('./app');

dotenv.config();

const PORT = process.env.PORT || 3000;

// Aquí es donde debes poner '0.0.0.0' para escuchar por IP
app.listen(PORT, '0.0.0.0', () => {
    console.log('listening server on ' + PORT);
});
