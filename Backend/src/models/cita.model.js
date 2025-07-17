const db = require('../config/db.js');

// Crear nueva cita
const crear = async ({ usuario_id, servicio_id, fecha, hora, estado, observaciones }) => {
  const query = {
    text: `
      INSERT INTO cita (usuario_id, servicio_id, fecha, hora, estado, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `,
    values: [usuario_id, servicio_id, fecha, hora, estado, observaciones],
  };

  const { rows } = await db.query(query);
  return rows[0];
};

// Listar todas las citas
const listar = async () => {
  const query = {
    text: 'SELECT * FROM cita ORDER BY cita_id ASC;',
  };
  const { rows } = await db.query(query);
  return rows;
};

// Obtener cita por ID con JOIN a clientes y servicios
// Obtener cita por ID con JOIN a clientes y servicios incluyendo IDs y nombres
const obtenerPorId = async (cita_id) => {
  const query = {
    text: `
      SELECT 
        c.cita_id,
        c.usuario_id,
        cli.nombre AS cliente_nombre,
        c.servicio_id,
        s.descripcion AS servicio_descripcion,
        c.fecha,
        c.hora,
        c.estado,
        COALESCE(c.observaciones, 'Ninguna') AS observaciones
      FROM cita c
      LEFT JOIN clientes cli ON c.usuario_id = cli.usuario_id
      LEFT JOIN servicios s ON c.servicio_id = s.servicio_id
      WHERE c.cita_id = $1;
    `,
    values: [cita_id],
  };
  const { rows } = await db.query(query);
  return rows[0]; // Retorna una cita o undefined
};


// Actualizar cita
const actualizar = async (cita_id, { usuario_id, servicio_id, fecha, hora, estado, observaciones }) => {
  const query = {
    text: `
      UPDATE cita 
      SET usuario_id = $1, servicio_id = $2, fecha = $3, hora = $4, estado = $5, observaciones = $6
      WHERE cita_id = $7
      RETURNING *;
    `,
    values: [usuario_id, servicio_id, fecha, hora, estado, observaciones, cita_id],
  };
  const { rows } = await db.query(query);
  return rows[0];
};

// Eliminar cita
const eliminar = async (cita_id) => {
  const query = {
    text: 'DELETE FROM cita WHERE cita_id = $1 RETURNING *;',
    values: [cita_id],
  };
  const { rows } = await db.query(query);
  return rows[0]; // Retorna la cita eliminada o undefined
};

const CitaModel = {
  crear,
  listar,
  obtenerPorId,
  actualizar,
  eliminar,
};

module.exports = CitaModel;
