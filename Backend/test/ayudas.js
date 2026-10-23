const jwt = require('jsonwebtoken');

// Cuentas tal como las devuelve UsuarioModel.findUserById (sin password_hash)
const ADMIN = { usuario_id: 1, nombre: 'Admin', email: 'admin@taller.test', rol: 'admin' };
const TECNICO = { usuario_id: 2, nombre: 'Técnico', email: 'tecnico@taller.test', rol: 'tecnico' };
const CLIENTE = { usuario_id: 3, nombre: 'Cliente antiguo', email: 'cliente@taller.test', rol: 'cliente' };
const CUENTAS = [ADMIN, TECNICO, CLIENTE];

// Token de sesión como el que firma el login
const tokenDe = (usuario, secreto = process.env.JWT_SECRET) =>
    jwt.sign({ userId: usuario.usuario_id, rol: usuario.rol }, secreto, { expiresIn: '1h' });

// Para UsuarioModel.findUserById simulado: busca entre las cuentas de arriba
const buscarCuenta = async (id) => CUENTAS.find((u) => u.usuario_id === Number(id));

module.exports = { ADMIN, TECNICO, CLIENTE, tokenDe, buscarCuenta };
