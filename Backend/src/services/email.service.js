const nodemailer = require('nodemailer');

// Las credenciales vienen del entorno (Backend/.env en local, variables de Render en producción).
// Nunca se escriben aquí: el repositorio es público. Ver docs/plan/06-operacion.md
const { EMAIL_USER, EMAIL_PASS } = process.env;
const EMAIL_FROM = process.env.EMAIL_FROM || `"Taller Mecánico San Gabriel 🚗" <${EMAIL_USER}>`;

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

const enviarCorreoVerificacion = async (email, token) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error('Faltan EMAIL_USER y EMAIL_PASS en el entorno: no se puede enviar el correo de verificación');
  }

  const link = `https://taller-mecanico-t7lv.onrender.com/api/users/verificar-email/${token}`;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'Confirma tu correo',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2E86C1;">Verifica tu cuenta</h2>
        <p>Gracias por registrarte en Taller Mecánico San Gabriel.</p>
        <p>Por favor, haz clic en el siguiente botón para verificar tu correo:</p>
        <a href="${link}" 
           style="display: inline-block; background-color: #2E86C1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Hacer clic aquí para verificar
        </a>
        <p>Si no solicitaste esta verificación, ignora este mensaje.</p>
        <hr />
        <small style="color: gray;">© 2025 Taller Mecánico San Gabriel</small>
      </div>
    `
  });
};


module.exports = { enviarCorreoVerificacion };
