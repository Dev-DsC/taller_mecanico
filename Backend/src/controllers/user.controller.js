const UserModel = require("./../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UsuarioModel = require('../models/usuario.model');
const { ROLES_PERSONAL } = require('../config/roles');

// Si el correo no existe se compara igual contra este hash, para que el tiempo de
// respuesta no delate qué correos tienen cuenta
const HASH_DE_RELLENO = bcrypt.hashSync('correo-sin-cuenta', 10);


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

    // Correo inexistente y contraseña errónea dan la misma respuesta
    const matchPassword = await bcrypt.compare(
      String(password_hash),
      foundUser ? foundUser.password_hash : HASH_DE_RELLENO
    );

    if (!foundUser || !matchPassword) {

      return res.status(401).json({ ok: false, msg: "Invalid credentials" });

    }

    if (!ROLES_PERSONAL.includes(foundUser.rol)) {
      return res.status(403).json({ ok: false, msg: "Acceso solo para el personal del taller" });
    }

    // Cuentas antiguas que nunca se verificaron: ya no hay correo de verificación, así que
    // las activa el administrador (docs/plan/fases/fase-01-sistema-interno.md)
    if (!foundUser.email_verificado) {

      return res.status(403).json({ ok: false, msg: "Cuenta no activada" });
    }



    const token = jwt.sign(
      { userId: foundUser.usuario_id, rol: foundUser.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );


    return res.json({ ok: true, token });

  } catch (error) {
    console.error('ERROR EN LOGIN:', error);
    return res.status(500).json({
      ok: false,
      msg: "Server error during login",
    });
  }
};


const profileUser = async (req, res) => {
  try {
    const foundUser = await UsuarioModel.findUserById(req.user.userId);
    if (!foundUser) {
      return res.status(404).json({ ok: false, msg: "User not found" });
    }

    return res.json({ ok: true, data: foundUser });
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
  profileUser
};

module.exports = UserController;
