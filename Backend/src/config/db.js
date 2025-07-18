const pg = require('pg');
require('dotenv').config();

const{Pool}= pg;


const db = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});


try {
    db.query('SELECT NOW()');
    console.log('database connected');
} catch (error) {
    console.log('error connection');
}

module.exports = db;