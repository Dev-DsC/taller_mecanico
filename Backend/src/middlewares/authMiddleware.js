const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario.model');
const { ROLES_PERSONAL } = require('../config/roles');

// Exige una sesión válida y relee al usuario de la base: si lo borraron o le cambiaron el
// rol, el token deja de valer en el acto en vez de seguir sirviendo hasta que caduque.
const requiereAuth = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ ok: false, msg: 'Debe iniciar sesión' });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ ok: false, msg: 'Sesión inválida o expirada' });
    }

    try {
        const usuario = payload.userId ? await UsuarioModel.findUserById(payload.userId) : null;
        if (!usuario || !ROLES_PERSONAL.includes(usuario.rol)) {
            return res.status(401).json({ ok: false, msg: 'Sesión inválida o expirada' });
        }

        req.user = { userId: usuario.usuario_id, rol: usuario.rol };
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: 'Error del servidor' });
    }
};

// Va siempre después de requiereAuth
const requiereRol = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
        return res.status(403).json({ ok: false, msg: 'No tiene permiso para esta acción' });
    }
    next();
};

module.exports = { requiereAuth, requiereRol };
