const db = require('../config/db');  // Asegúrate de que esta ruta sea correcta según tu proyecto

// Listar todos los inventarios
const findAllInventario = async () => {
    const query = {
        text: 'SELECT * FROM public.inventarios;', // Llamada a la función almacenada
    };
    const { rows } = await db.query(query); // Ejecutar la llamada a la función
    return rows; // Retornar los resultados
};

// Catálogo público: solo lo que enseña /repuestos. costo_unitario es hoy el precio de venta.
const findCatalogo = async () => {
    const query = {
        text: 'SELECT repuesto_id, nombre, descripcion, costo_unitario, imagen FROM public.inventarios ORDER BY nombre;',
    };
    const { rows } = await db.query(query);
    return rows;
};


// Filtrar inventarios por ID
const filterInventarioId = async (id) => {
    const query = {
        text: "SELECT * FROM inventarios WHERE repuesto_id = $1;",
        values: [id]
    };

    const { rows } = await db.query(query);
    return rows[0];
};
// Filtrar inventarios por nombre
const filterInventario = async (nombre) => {
    const query = {
        text: 'SELECT * FROM filter_inventario_por_nombre($1);',
        values: [nombre]
    };
    const { rows } = await db.query(query);
    return rows;
};

// Insertar un inventario
const create = async({nombre, cantidad_disponible, cantidad_minima, costo_unitario, imagen, descripcion}) => {
    const query = {
        text: `
            CALL insertar_inventario($1, $2, $3, $4, $5, $6);
        `,
        values: [nombre, cantidad_disponible, cantidad_minima, costo_unitario, imagen, descripcion]
    };

    await db.query(query);
};

// Actualizar un inventario
const updateInventarios = async (id, { nombre, cantidad_disponible, cantidad_minima, costo_unitario, imagen, descripcion }) => {
    const query = {
        text: `
            CALL actualizar_inventario($1, $2, $3, $4, $5, $6, $7);
        `,
        values: [id, nombre, cantidad_disponible, cantidad_minima, costo_unitario, imagen, descripcion]
    };

    await db.query(query);
};

// Eliminar un inventario
const deleteInventario = async (id) => {
    const query = {
        text: `
            CALL eliminar_inventario($1);
        `,
        values: [id]
    };

    await db.query(query);
};

const InventarioModel = {
    create,
    findAllInventario,
    findCatalogo,
    updateInventarios,
    deleteInventario,
    filterInventarioId,
    filterInventario
};

module.exports = InventarioModel;
