// El SQL de los modelos, con la base simulada: que diga lo que la fase decidió
jest.mock('../src/config/db', () => require('./db-falsa'));

const db = require('../src/config/db');
const UsuarioModel = require('../src/models/usuario.model');
const InventarioModel = require('../src/models/inventario.model');
const CitaModel = require('../src/models/cita.model');

const textos = (mockQuery) => mockQuery.mock.calls.map(([q]) => (typeof q === 'string' ? q : q.text));

beforeEach(() => jest.clearAllMocks());

test('una cuenta creada por el admin nace verificada', async () => {
    await UsuarioModel.createUser({ nombre: 'N', email: 'n@taller.test', password_hash: 'h', rol: 'tecnico' });
    const [sql] = textos(db.query);
    expect(sql).toMatch(/email_verificado/);
    expect(sql).toMatch(/TRUE/);
});

test('borrar una cuenta desvincula fichas y citas, nunca las borra', async () => {
    await UsuarioModel.deleteUser(7);
    const sql = textos(db.cliente.query).join('\n');
    expect(sql).not.toMatch(/DELETE FROM public\.clientes/);
    expect(sql).toMatch(/UPDATE public\.clientes SET usuario_id = NULL/);
    expect(sql).toMatch(/DELETE FROM public\.usuarios/);
});

test('el catálogo público no saca stock ni mínimos', async () => {
    await InventarioModel.findCatalogo();
    const [sql] = textos(db.query);
    expect(sql).not.toMatch(/cantidad_disponible|cantidad_minima|\*/);
});

test('una cita nueva se guarda con la ficha del cliente', async () => {
    await CitaModel.crear({ cliente_id: 4, servicio_id: 1, fecha: '2026-11-02', hora: '10:00', estado: 'PENDIENTE' });
    const [{ text, values }] = db.query.mock.calls[0];
    expect(text).toMatch(/INSERT INTO cita \(cliente_id/);
    expect(values[0]).toBe(4);
});
