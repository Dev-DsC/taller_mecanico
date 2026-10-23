const db = require('../config/db.js');


// Crear una cuenta del personal. La crea el administrador, así que nace verificada:
// ya no hay correo de verificación
const createUser = async ({ nombre, email, password_hash, rol }) => {
    const query = {
        text: `INSERT INTO public.usuarios (nombre, email, password_hash, rol, email_verificado)
               VALUES ($1, $2, $3, $4, TRUE)
               RETURNING usuario_id, nombre, email, rol;`,
        values: [nombre, email, password_hash, rol],
    };
    const { rows } = await db.query(query);
    return rows[0];
};


// Obtener todos los usuarios sin incluir password_hash
const findAllUsers = async () => {
    const query = {
        text: 'SELECT usuario_id, nombre, email, rol FROM public.usuarios;',
    };
    const { rows } = await db.query(query);
    return rows;
};

// Obtener usuario por ID sin incluir password_hash
const findUserById = async (id) => {
    const query = {
        text: 'SELECT usuario_id, nombre, email, rol FROM public.usuarios WHERE usuario_id = $1;',
        values: [id],
    };
    const { rows } = await db.query(query);
    return rows[0];
};

// Buscar por email (para login)
const findOneUserEmail = async (email) => {
    const query = {
        text: 'SELECT * FROM public.usuarios WHERE email = $1;',
        values: [email],
    };
    const { rows } = await db.query(query);
    return rows[0];
};

// Actualizar usuario SIN modificar la contraseña
const updateUser = async (id, { nombre, email, rol }) => {
    const query = {
        text: `UPDATE public.usuarios 
               SET nombre = $1, email = $2, rol = $3
               WHERE usuario_id = $4
               RETURNING usuario_id, nombre, email, rol;`,
        values: [nombre, email, rol, id],
    };
    const { rows } = await db.query(query);
    return rows[0]; // Retorna el usuario actualizado
};

// Restablecer la contraseña (la pone el administrador)
const updatePassword = async (id, password_hash) => {
    const query = {
        text: 'UPDATE public.usuarios SET password_hash = $1 WHERE usuario_id = $2;',
        values: [password_hash, id],
    };
    await db.query(query);
};


// Borrar una cuenta nunca borra datos del taller: las fichas de clientes y las citas que
// apuntaban a ella (de cuando los clientes tenían cuenta) se quedan, desvinculadas
const deleteUser = async (id) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query('UPDATE public.clientes SET usuario_id = NULL WHERE usuario_id = $1;', [id]);
    await client.query('UPDATE public.cita SET usuario_id = NULL WHERE usuario_id = $1;', [id]);
    await client.query('DELETE FROM public.usuarios WHERE usuario_id = $1;', [id]);
    await client.query('COMMIT');
    return { msg: 'Usuario eliminado correctamente' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


const UsuarioModel = {
    createUser,
    findAllUsers,
    findOneUserEmail,
    findUserById,
    updateUser,
    updatePassword,
    deleteUser,
};

module.exports = UsuarioModel;
