// La matriz de accesos, comprobada contra el router real: si alguien añade una ruta sin
// protegerla, la prueba «sin sesión ⇒ 401» la encuentra sola.
jest.mock('../src/config/db', () => require('./db-falsa'));
jest.mock('../src/models/usuario.model');

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const routerUsers = require('../src/routes/user.router');
const UsuarioModel = require('../src/models/usuario.model');
const { ADMIN, TECNICO, CLIENTE, tokenDe, buscarCuenta } = require('./ayudas');

// Lo único que se usa sin sesión. Una ruta pública nueva se añade aquí, a propósito.
const RUTAS_PUBLICAS = ['POST /login', 'GET /catalogo/repuestos'];

const SOLO_ADMIN = [
    'GET /usuarios',
    'GET /usuarios/filtrar/:id',
    'POST /usuarios/crear',
    'PUT /usuarios/editar/:id',
    'DELETE /usuarios/eliminar/:id',
    'DELETE /inventario/:id',
];

const RUTAS = routerUsers.stack
    .filter((capa) => capa.route)
    .flatMap((capa) => Object.keys(capa.route.methods).map((m) => `${m.toUpperCase()} ${capa.route.path}`));

const PRIVADAS = RUTAS.filter((r) => !RUTAS_PUBLICAS.includes(r));
const DEL_PERSONAL = PRIVADAS.filter((r) => !SOLO_ADMIN.includes(r));

const pedir = (ruta, token) => {
    const [metodo, path] = ruta.split(' ');
    const peticion = request(app)[metodo.toLowerCase()]('/api/users' + path.replace(/:\w+/g, '1'));
    return token ? peticion.set('Authorization', `Bearer ${token}`) : peticion;
};

beforeEach(() => {
    UsuarioModel.findUserById.mockImplementation(buscarCuenta);
});

test('las rutas públicas existen y son solo las declaradas', () => {
    expect(RUTAS).toEqual(expect.arrayContaining(RUTAS_PUBLICAS));
    expect(SOLO_ADMIN.every((r) => RUTAS.includes(r))).toBe(true);
});

test('la verificación por correo ya no existe', () => {
    expect(RUTAS.some((r) => r.includes('verific'))).toBe(false);
});

test.each(PRIVADAS)('%s sin sesión ⇒ 401', async (ruta) => {
    const res = await pedir(ruta);
    expect(res.status).toBe(401);
});

test.each(RUTAS_PUBLICAS)('%s no pide sesión', async (ruta) => {
    const res = await pedir(ruta);
    expect([401, 403]).not.toContain(res.status);
});

test.each(SOLO_ADMIN)('%s con sesión de técnico ⇒ 403', async (ruta) => {
    const res = await pedir(ruta, tokenDe(TECNICO));
    expect(res.status).toBe(403);
});

test.each(DEL_PERSONAL)('%s con sesión de técnico pasa', async (ruta) => {
    const res = await pedir(ruta, tokenDe(TECNICO));
    expect([401, 403]).not.toContain(res.status);
});

test.each(SOLO_ADMIN)('%s con sesión de admin pasa', async (ruta) => {
    const res = await pedir(ruta, tokenDe(ADMIN));
    expect([401, 403]).not.toContain(res.status);
});

describe('el token no basta: manda lo que dice la base', () => {
    test('una cuenta cliente de las de antes ⇒ 401', async () => {
        const res = await pedir('GET /clientes', tokenDe(CLIENTE));
        expect(res.status).toBe(401);
    });

    test('una cuenta borrada ⇒ 401', async () => {
        const borrada = { usuario_id: 99, rol: 'admin' };
        const res = await pedir('GET /clientes', tokenDe(borrada));
        expect(res.status).toBe(401);
    });

    test('si el admin le bajó el rol, el token viejo de admin ya no abre lo de admin', async () => {
        const tokenViejo = tokenDe({ usuario_id: TECNICO.usuario_id, rol: 'admin' });
        const res = await pedir('GET /usuarios', tokenViejo);
        expect(res.status).toBe(403);
    });

    test('un token sin userId (como los enlaces de verificación de antes) ⇒ 401', async () => {
        const token = jwt.sign({ email: ADMIN.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const res = await pedir('GET /clientes', token);
        expect(res.status).toBe(401);
    });

    test('un token firmado con otro secreto ⇒ 401', async () => {
        const res = await pedir('GET /clientes', tokenDe(ADMIN, 'otro-secreto'));
        expect(res.status).toBe(401);
    });
});

test('/profileUser devuelve la cuenta de la sesión, sin password_hash', async () => {
    const res = await pedir('GET /profileUser', tokenDe(TECNICO));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(TECNICO);
    expect(res.body.data).not.toHaveProperty('password_hash');
});
