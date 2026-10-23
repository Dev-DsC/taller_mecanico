jest.mock('../src/config/db', () => require('./db-falsa'));
jest.mock('../src/models/usuario.model');

const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../src/app');
const UsuarioModel = require('../src/models/usuario.model');
const { ADMIN, TECNICO, tokenDe, buscarCuenta } = require('./ayudas');

const comoAdmin = (peticion) => peticion.set('Authorization', `Bearer ${tokenDe(ADMIN)}`);

beforeEach(() => {
    jest.clearAllMocks();
    UsuarioModel.findUserById.mockImplementation(buscarCuenta);
    UsuarioModel.findOneUserEmail.mockResolvedValue(undefined);
    UsuarioModel.createUser.mockImplementation(async (u) => ({ usuario_id: 10, nombre: u.nombre, email: u.email, rol: u.rol }));
});

describe('crear', () => {
    const crear = (datos) => comoAdmin(request(app).post('/api/users/usuarios/crear').send(datos));
    const valido = { nombre: 'Nuevo', email: 'nuevo@taller.test', password_hash: 'segura-123', rol: 'tecnico' };

    test('crea personal con la contraseña hasheada', async () => {
        const res = await crear(valido);

        expect(res.status).toBe(201);
        const guardado = UsuarioModel.createUser.mock.calls[0][0];
        expect(guardado.rol).toBe('tecnico');
        expect(guardado.password_hash).not.toBe(valido.password_hash);
        expect(bcrypt.compareSync(valido.password_hash, guardado.password_hash)).toBe(true);
    });

    test.each(['cliente', '', undefined, 'superadmin'])('rol %p ⇒ 400', async (rol) => {
        const res = await crear({ ...valido, rol });
        expect(res.status).toBe(400);
        expect(UsuarioModel.createUser).not.toHaveBeenCalled();
    });

    test('contraseña de menos de 8 caracteres ⇒ 400', async () => {
        const res = await crear({ ...valido, password_hash: 'corta' });
        expect(res.status).toBe(400);
        expect(UsuarioModel.createUser).not.toHaveBeenCalled();
    });

    test('correo repetido ⇒ 409', async () => {
        UsuarioModel.findOneUserEmail.mockResolvedValue({ usuario_id: 5 });
        const res = await crear(valido);
        expect(res.status).toBe(409);
    });
});

describe('editar', () => {
    const editar = (id, datos) => comoAdmin(request(app).put(`/api/users/usuarios/editar/${id}`).send(datos));

    test('el admin no puede quitarse el rol de admin', async () => {
        const res = await editar(ADMIN.usuario_id, { nombre: 'Admin', email: ADMIN.email, rol: 'tecnico' });
        expect(res.status).toBe(400);
        expect(UsuarioModel.updateUser).not.toHaveBeenCalled();
    });

    test('sin contraseña nueva no se toca la actual', async () => {
        const res = await editar(TECNICO.usuario_id, { nombre: 'Técnico', email: TECNICO.email, rol: 'tecnico' });
        expect(res.status).toBe(200);
        expect(UsuarioModel.updatePassword).not.toHaveBeenCalled();
    });

    test('con contraseña nueva, el admin la restablece hasheada', async () => {
        const res = await editar(TECNICO.usuario_id, { nombre: 'Técnico', email: TECNICO.email, rol: 'tecnico', password_hash: 'nueva-clave-1' });
        expect(res.status).toBe(200);
        const [id, hash] = UsuarioModel.updatePassword.mock.calls[0];
        expect(id).toBe(TECNICO.usuario_id);
        expect(bcrypt.compareSync('nueva-clave-1', hash)).toBe(true);
    });

    test('no se puede convertir una cuenta en cliente', async () => {
        const res = await editar(TECNICO.usuario_id, { nombre: 'Técnico', email: TECNICO.email, rol: 'cliente' });
        expect(res.status).toBe(400);
    });
});

test('el admin no puede borrar su propia cuenta', async () => {
    const res = await comoAdmin(request(app).delete(`/api/users/usuarios/eliminar/${ADMIN.usuario_id}`));
    expect(res.status).toBe(400);
    expect(UsuarioModel.deleteUser).not.toHaveBeenCalled();
});
