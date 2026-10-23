const bcrypt = require('bcrypt');
const UsuarioModel = require('../models/usuario.model');
const { ROLES_PERSONAL, LONGITUD_MINIMA_CONTRASENA } = require('../config/roles');

// Todas estas rutas son solo del administrador: las cuentas son del personal y las crea él

const contrasenaInvalida = (password) =>
    typeof password !== 'string' || password.length < LONGITUD_MINIMA_CONTRASENA;

// Crear nuevo usuario
const create = async (req, res) => {
    try {
        const { nombre, email, password_hash, rol } = req.body;

        if (!nombre || !email || !ROLES_PERSONAL.includes(rol)) {
            return res.status(400).json({ ok: false, msg: 'Nombre, email y rol (admin o tecnico) son obligatorios' });
        }
        if (contrasenaInvalida(password_hash)) {
            return res.status(400).json({ ok: false, msg: `La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres` });
        }

        const emailExists = await UsuarioModel.findOneUserEmail(email);
        if (emailExists) {
            return res.status(409).json({ ok: false, msg: 'Email ya existe' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password_hash, salt);

        const newUser = await UsuarioModel.createUser({
            nombre,
            email,
            password_hash: hashedPassword,
            rol,
        });

        res.status(201).json({ ok: true, usuario: newUser, msg: 'Usuario creado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al crear usuario' });
    }
};

// Listar todos los usuarios
const findAll = async (req, res) => {
    try {
        const usuarios = await UsuarioModel.findAllUsers();
        res.json(usuarios);
    } catch (error) {
        console.error("Error en findAll usuarios:", error);
        res.status(500).json({ ok: false, msg: 'Error al obtener usuarios' });
    }
};

// Obtener un usuario por ID
const findById = async (req, res) => {
    try {
        const id = req.params.id;
        const usuario = await UsuarioModel.findUserById(id);
        if (!usuario) {
            return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ ok: false, msg: 'Error al buscar usuario' });
    }
};

// Actualizar usuario. Si llega una contraseña, el admin la está restableciendo: sin correo
// no hay «olvidé mi contraseña», así que es la única forma de recuperar una cuenta.
const update = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nombre, email, rol, password_hash } = req.body;

        if (!ROLES_PERSONAL.includes(rol)) {
            return res.status(400).json({ ok: false, msg: 'El rol debe ser admin o tecnico' });
        }
        // Así nunca se queda el taller sin administrador por un descuido
        if (id === req.user.userId && rol !== req.user.rol) {
            return res.status(400).json({ ok: false, msg: 'No puede cambiar su propio rol' });
        }
        if (password_hash && contrasenaInvalida(password_hash)) {
            return res.status(400).json({ ok: false, msg: `La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres` });
        }

        const usuario = await UsuarioModel.findUserById(id);
        if (!usuario) {
            return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
        }

        const updatedUser = await UsuarioModel.updateUser(id, {
            nombre,
            email,
            rol,
        });

        if (password_hash) {
            const hashedPassword = await bcrypt.hash(password_hash, 10);
            await UsuarioModel.updatePassword(id, hashedPassword);
        }

        res.json({ ok: true, msg: 'Usuario actualizado', usuario: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al actualizar usuario' });
    }
};



// Eliminar usuario
const remove = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (id === req.user.userId) {
            return res.status(400).json({ ok: false, msg: 'No puede eliminar su propia cuenta' });
        }

        await UsuarioModel.deleteUser(id);
        res.json({ ok: true, msg: 'Usuario eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al eliminar usuario' });
    }
};

const UserController = {
    create,
    findAll,
    findById,
    update,
    remove,
};

module.exports = UserController;
