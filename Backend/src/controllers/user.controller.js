const UserModel = require("./../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require('../config/db');
const UsuarioModel = require('../models/usuario.model');
const { enviarCorreoVerificacion } = require('../services/email.service');

const enviarVerificacionEmail = async (req, res) => {
    const { email } = req.body;
    const usuario = await UsuarioModel.findOneUserEmail(email);
    if (!usuario) return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });

    const token = jwt.sign(
        { email: usuario.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    await enviarCorreoVerificacion(usuario.email, token);
    res.json({ ok: true, msg: 'Correo de verificación enviado' });
};

const verificarEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;

        const usuario = await UsuarioModel.findOneUserEmail(email);
        if (!usuario) return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });

        const query = {
            text: `UPDATE public.usuarios SET email_verificado = TRUE WHERE email = $1`,
            values: [email],
        };
        await db.query(query);

        res.redirect('http://localhost:4200/auth?verified=true'); // Angular redirige aquí después de confirmar
    } catch (err) {
        res.status(400).json({ ok: false, msg: 'Token inválido o expirado' });
    }
};


const login = async (req, res) => {
  try {
    const { email, password_hash } = req.body;

    if (!email || !password_hash) {
      return res.status(400).json({
        ok: false,
        msg: "Required fields: email and password",
      });
    }

    const foundUser = await UserModel.findOneUserEmail(email);
    if (!foundUser) {
      return res.status(401).json({ ok: false, msg: "Email not found" });
    }

    if (!foundUser.email_verificado) {
      return res.status(403).json({ ok: false, msg: "Debe verificar su correo primero" });
    }

    const matchPassword = await bcrypt.compare(
      password_hash,
      foundUser.password_hash
    );
    if (!matchPassword) {
      return res.status(401).json({ ok: false, msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: foundUser.usuario_id, rol: foundUser.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ ok: true, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      msg: "Server error during login",
    });
  }
};


const profileUser = async (req, res) => {
  try {
    const { email } = req.body;

    const foundUser = await UserModel.findOneUserEmail(email);
    if (!foundUser) {
      return res.status(404).json({ ok: false, msg: "User not found" });
    }

    return res.json({ ok: true, msg: foundUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      msg: "Server error fetching profile",
    });
  }
};

const UserController = {
  login,
  profileUser,
  enviarVerificacionEmail,
  verificarEmail
};

module.exports = UserController;
