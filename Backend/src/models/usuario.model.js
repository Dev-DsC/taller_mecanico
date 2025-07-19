const db = require('../config/db.js');


// Crear nuevo usuario y, si es cliente, también crear en tabla clientes
const createUser = async ({ nombre, email, password_hash, rol, telefono, direccion }) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Crear usuario
        const userInsert = {
            text: `INSERT INTO public.usuarios (nombre, email, password_hash, rol)
                   VALUES ($1, $2, $3, $4)
                   RETURNING usuario_id, nombre, email, rol;`,
            values: [nombre, email, password_hash, rol],
        };
        const { rows } = await client.query(userInsert);
        const usuario = rows[0];

        // 2. Si es cliente, verificar si ya existe en la tabla clientes
        if (rol === 'cliente') {
            const buscarCliente = {
                text: `SELECT * FROM clientes WHERE nombre = $1 AND telefono = $2 LIMIT 1;`,
                values: [nombre, telefono]
            };
            const clienteResult = await client.query(buscarCliente);
            const clienteExistente = clienteResult.rows[0];

            if (clienteExistente) {
                // Ya existe → solo actualiza el usuario_id
                const updateCliente = {
                    text: `UPDATE clientes SET usuario_id = $1 WHERE cliente_id = $2;`,
                    values: [usuario.usuario_id, clienteExistente.cliente_id]
                };
                await client.query(updateCliente);
            } else {
                // No existe → crea uno nuevo
                const clienteInsert = {
                    text: `INSERT INTO public.clientes (nombre, telefono, direccion, usuario_id)
                           VALUES ($1, $2, $3, $4);`,
                    values: [nombre, telefono, direccion, usuario.usuario_id]
                };
                await client.query(clienteInsert);
            }
        }

        await client.query('COMMIT');
        return usuario;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
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



const deleteUser = async (id) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM public.clientes WHERE usuario_id = $1;', [id]);
    await client.query('DELETE FROM public.usuarios WHERE usuario_id = $1;', [id]);
    await client.query('COMMIT');
    return { msg: 'Usuario y cliente(s) eliminados correctamente' };
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
    deleteUser,
};

module.exports = UsuarioModel;
