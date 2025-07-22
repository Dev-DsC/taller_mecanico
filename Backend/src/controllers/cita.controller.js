const CitaModel = require('./../models/cita.model.js');

// Crear nueva cita
async function crearCita(req, res) {
  try {
    const { usuario_id, servicio_id, fecha, hora, estado, observaciones } = req.body;

    const estadoCita = estado || 'PENDIENTE';

    // Usar estadoCita al insertar en DB
    const nuevaCita = await CitaModel.crear({
      usuario_id,
      servicio_id,
      fecha,
      hora,
      estado: estadoCita,
      observaciones
    });

    res.status(201).json(nuevaCita);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear cita' });
  }
}


// Listar citas
const listarCita = async (req, res) => {
  try {
    const citas = await CitaModel.listar();
    return res.status(200).json({ ok: true, data: citas });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, msg: "Error del servidor" });
  }
};


const obtenerCitaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const cita = await CitaModel.obtenerPorId(id);

    if (!cita) {
      return res.status(404).json({ ok: false, msg: "Cita no encontrada" });
    }

    return res.status(200).json({ ok: true, data: cita });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, msg: "Error del servidor" });
  }
};

// Actualizar cita
const actualizarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id, servicio_id, fecha, hora, estado, observaciones } = req.body;

    const citaActualizada = await CitaModel.actualizar(id, {
      usuario_id,
      servicio_id,
      fecha,
      hora,
      estado,
      observaciones,
    });

    if (!citaActualizada) {
      return res.status(404).json({ ok: false, msg: "Cita no encontrada para actualizar" });
    }

    return res.status(200).json({ ok: true, msg: "Cita actualizada", data: citaActualizada });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, msg: "Error del servidor" });
  }
};

// Eliminar cita
const eliminarCita = async (req, res) => {
  try {
    const { id } = req.params;

    const citaEliminada = await CitaModel.eliminar(id);

    if (!citaEliminada) {
      return res.status(404).json({ ok: false, msg: "Cita no encontrada para eliminar" });
    }

    return res.status(200).json({ ok: true, msg: "Cita eliminada", data: citaEliminada });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, msg: "Error del servidor" });
  }
};

const CitaController = {
  crearCita,
  listarCita,
  obtenerCitaPorId,
  actualizarCita,
  eliminarCita,
};

module.exports = CitaController;
