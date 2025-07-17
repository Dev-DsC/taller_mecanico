const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect()
    .then(() => console.log('database connected'))
    .catch(err => console.error('Database connection error:', err));

module.exports = db;
