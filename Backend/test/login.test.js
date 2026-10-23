jest.mock('../src/config/db', () => require('./db-falsa'));
jest.mock('../src/models/user.model');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const UserModel = require('../src/models/user.model');

const CONTRASENA = 'correcta-123';
const HASH = bcrypt.hashSync(CONTRASENA, 4);

// Fila completa de usuarios, como la devuelve findOneUserEmail
const cuenta = (cambios = {}) => ({
    usuario_id: 1,
    nombre: 'Admin',
    email: 'admin@taller.test',
    password_hash: HASH,
    rol: 'admin',
    email_verificado: true,
    ...cambios,
});

const entrar = (password_hash) =>
    request(app).post('/api/users/login').send({ email: 'admin@taller.test', password_hash });

test('correo inexistente y contraseña errónea dan la misma respuesta', async () => {
    UserModel.findOneUserEmail.mockResolvedValueOnce(undefined);
    const sinCuenta = await entrar(CONTRASENA);

    UserModel.findOneUserEmail.mockResolvedValueOnce(cuenta());
    const malaContrasena = await entrar('no-es-esta');

    expect(sinCuenta.status).toBe(401);
    expect(malaContrasena.status).toBe(401);
    expect(sinCuenta.body).toEqual(malaContrasena.body);
});

test('el personal con la contraseña buena recibe un token con su rol', async () => {
    UserModel.findOneUserEmail.mockResolvedValueOnce(cuenta({ usuario_id: 2, rol: 'tecnico' }));
    const res = await entrar(CONTRASENA);

    expect(res.status).toBe(200);
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload).toMatchObject({ userId: 2, rol: 'tecnico' });
});

test('una cuenta cliente de las de antes, con la contraseña buena ⇒ 403', async () => {
    UserModel.findOneUserEmail.mockResolvedValueOnce(cuenta({ rol: 'cliente' }));
    const res = await entrar(CONTRASENA);

    expect(res.status).toBe(403);
    expect(res.body.token).toBeUndefined();
});

test('una cuenta sin activar ⇒ 403, y solo después de acertar la contraseña', async () => {
    UserModel.findOneUserEmail.mockResolvedValueOnce(cuenta({ email_verificado: false }));
    const buena = await entrar(CONTRASENA);
    expect(buena.status).toBe(403);

    UserModel.findOneUserEmail.mockResolvedValueOnce(cuenta({ email_verificado: false }));
    const mala = await entrar('no-es-esta');
    expect(mala.status).toBe(401);
});
