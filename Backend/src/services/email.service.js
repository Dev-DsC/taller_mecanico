const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'daltonsteve22@gmail.com', // tu correo real
        pass: '***ELIMINADA***'      // tu contraseña de aplicación real
    }
});

const enviarCorreoVerificacion = async (email, token) => {
  const link = `https://taller-mecanico-t7lv.onrender.com/api/users/verificar-email/${token}`;

  await transporter.sendMail({
    from: '"Taller Mecánico San Gabriel 🚗" <daltonsteve22@gmail.com>',
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
