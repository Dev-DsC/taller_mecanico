const express = require('express');
const cors = require('cors');
const routerUsers = require('./routes/user.router');
/* const userRoutes = require('./routes/userRoutes');
 */
const app = express();
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Something went wrong!' });
});

app.use('/api/users', routerUsers);

module.exports = app;