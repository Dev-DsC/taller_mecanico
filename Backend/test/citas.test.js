jest.mock('../src/config/db', () => require('./db-falsa'));
jest.mock('../src/models/usuario.model');
jest.mock('../src/models/cita.model');

const request = require('supertest');
const app = require('../src/app');
const UsuarioModel = require('../src/models/usuario.model');
const CitaModel = require('../src/models/cita.model');
const { TECNICO, tokenDe, buscarCuenta } = require('./ayudas');

const agendar = (datos) =>
    request(app).post('/api/users/cita').set('Authorization', `Bearer ${tokenDe(TECNICO)}`).send(datos);

beforeEach(() => {
    jest.clearAllMocks();
    UsuarioModel.findUserById.mockImplementation(buscarCuenta);
    CitaModel.crear.mockImplementation(async (c) => ({ cita_id: 1, ...c }));
});

test('el personal agenda para una ficha de cliente', async () => {
    const res = await agendar({ cliente_id: 4, servicio_id: 1, fecha: '2026-11-02', hora: '10:00' });

    expect(res.status).toBe(201);
    expect(CitaModel.crear).toHaveBeenCalledWith(expect.objectContaining({ cliente_id: 4, estado: 'PENDIENTE' }));
});

test('sin ficha de cliente ⇒ 400', async () => {
    const res = await agendar({ usuario_id: 3, servicio_id: 1, fecha: '2026-11-02', hora: '10:00' });

    expect(res.status).toBe(400);
    expect(CitaModel.crear).not.toHaveBeenCalled();
});
