// Aparte de login.test.js: el contador de intentos vive en memoria y lo compartirían
jest.mock('../src/config/db', () => require('./db-falsa'));
jest.mock('../src/models/user.model');

const request = require('supertest');
const app = require('../src/app');
const UserModel = require('../src/models/user.model');

test('a los 10 intentos fallidos el login responde 429', async () => {
    UserModel.findOneUserEmail.mockResolvedValue(undefined);
    const intentar = () =>
        request(app).post('/api/users/login').send({ email: 'nadie@taller.test', password_hash: 'x' });

    for (let i = 0; i < 10; i++) {
        expect((await intentar()).status).toBe(401);
    }

    const res = await intentar();
    expect(res.status).toBe(429);
    expect(res.body.ok).toBe(false);
});
