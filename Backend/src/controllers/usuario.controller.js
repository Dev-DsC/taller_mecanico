const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario.model');

// Crear nuevo usuario
const { enviarCorreoVerificacion } = require('../services/email.service'); // asegúrate de importarlo

const create = async (req, res) => {
    try {
        const { nombre, email, password_hash, rol, telefono, direccion } = req.body;

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
            telefono,
            direccion,
            email_verificado: false, // Asegúrate que el modelo permita esto o lo ponga por defecto
        });

        // Generar token de verificación
        const token = jwt.sign(
            { email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Enviar correo de verificación
        await enviarCorreoVerificacion(email, token);

        res.status(201).json({ 
            ok: true, 
            usuario: newUser, 
            msg: 'Usuario creado correctamente. Revisa tu correo para verificar tu cuenta.' 
        });
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

// Actualizar usuario SIN modificar la contraseña
const update = async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, email, rol } = req.body;

        const usuario = await UsuarioModel.findUserById(id);
        if (!usuario) {
            return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
        }

        const updatedUser = await UsuarioModel.updateUser(id, {
            nombre,
            email,
            rol,
        });

        res.json({ ok: true, msg: 'Usuario actualizado', usuario: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al actualizar usuario' });
    }
};



// Eliminar usuario
const remove = async (req, res) => {
    try {
        const id = req.params.id;
        await UsuarioModel.deleteUser(id);
        res.json({ ok: true, msg: 'Usuario eliminado' });
    } catch (error) {
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
