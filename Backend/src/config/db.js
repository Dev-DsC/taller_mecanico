const pg = require('pg');
require('dotenv').config();

const { Pool } = pg;

const db = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect()
    .then(() => console.log('database connected'))
    .catch(err => console.error('Database connection error:', err));

module.exports = db;
