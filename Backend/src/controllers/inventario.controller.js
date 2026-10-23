const InventarioModel = require('./../models/inventario.model.js')

const createInventario = async (req, res) => {
    try {

        const { nombre, cantidad_disponible, cantidad_minima, costo_unitario, imagen, descripcion } = req.body;
        
        
        // Enviamos todos los valores esperados por la consulta
        const inventarioCreate = InventarioModel.create({ 
            nombre, cantidad_disponible, cantidad_minima, costo_unitario, imagen, descripcion 
        });

        return res.status(201).json({ ok: true, msg: "Inventario creado", data: inventarioCreate });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: "Error del servidor" });
    }
};

// Listar todos los inventarios
const listInventariosId = async (req, res) => {
    try {
        const { id } = req.params;
        const inventario = await InventarioModel.filterInventarioId(+id);

        if (!inventario) {
            return res.status(404).json({ ok: false, msg: 'Repuesto no encontrado' });
        }

        return res.status(200).json({ ok: true, data: inventario }); // ✅ aquí aseguramos que se devuelve el dato
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: "Error del servidor" });
    }
};

// Listar todos los inventarios
const listInventarios = async (req, res) => {
    try {
        const inventarios = await InventarioModel.findAllInventario();
        return res.status(200).json({ ok: true, data: inventarios });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: "Error del servidor" });
    }
};

// Catálogo público de /repuestos: sin stock ni mínimos, que son del personal
const listCatalogo = async (req, res) => {
    try {
        const repuestos = await InventarioModel.findCatalogo();
        return res.status(200).json({ ok: true, data: repuestos });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: "Error del servidor" });
    }
};
// Actualizar inventario
const updateInventario = async (req, res) => {
    
    try {
        const { id } = req.params;
        const { nombre, cantidad_disponible, cantidad_minima, costo_unitario, imagen, descripcion } = req.body;

        const inventarioUpdated = await InventarioModel.updateInventarios(+id, { 
            nombre, cantidad_disponible, cantidad_minima, costo_unitario, imagen, descripcion 
        });

        return res.status(200).json({ ok: true, msg: "Inventario actualizado", data: inventarioUpdated });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: "Error del servidor" });
    }
};

// Eliminar inventario
const deleteInventario = async (req, res) => {
    try {
        const { id } = req.params;

        const inventarioDeleted = await InventarioModel.deleteInventario(id);

        if (!inventarioDeleted) {
            return res.status(404).json({ ok: false, msg: "Inventario no encontrado" });
        }

        return res.status(200).json({ ok: true, msg: "Inventario eliminado", data: inventarioDeleted });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: "Error del servidor" });
    }
};

// Filtrar inventarios por nombre
const filterInventarios = async (req, res) => {
    try {
        const { nombre } = req.query;

        const inventariosFiltered = await InventarioModel.filterInventario(nombre);

        return res.status(200).json({ ok: true, data: inventariosFiltered });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: "Error del servidor" });
    }
};

const InventarioController = {
    createInventario,
    listInventarios,
    updateInventario,
    deleteInventario,
    filterInventarios,
    listInventariosId,
    listCatalogo
};

module.exports = InventarioController;