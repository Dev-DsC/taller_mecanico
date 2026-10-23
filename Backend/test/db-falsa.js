// Sustituye al pool de PostgreSQL de src/config/db.js: ninguna prueba toca la base.
// Uso: jest.mock('../src/config/db', () => require('./db-falsa'));
const cliente = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    release: jest.fn(),
};

module.exports = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn().mockResolvedValue(cliente),
    cliente,
};
