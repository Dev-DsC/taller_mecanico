const express = require('express');
const rateLimit = require('express-rate-limit');
const routerUsers = express.Router();
const UserController  = require("../controllers/user.controller");
const { requiereAuth, requiereRol } = require("../middlewares/authMiddleware");
const InventarioController = require('../controllers/inventario.controller');
const ClienteController = require('../controllers/cliente.controller');
const ServiceDetalleController = require('../controllers/service_detalle.controller')
const UsuarioController = require('../controllers/usuario.controller');
const FacturaController = require('../controllers/factura.controller');
const FacturaDetalleController = require('../controllers/factura_detalle.controller');
const CitaController = require('../controllers/cita.controller');

// Matriz de accesos: toda ruta declara quién la usa. Solo el personal tiene cuenta, y las
// únicas rutas públicas son el login y el catálogo de repuestos. Una ruta pública nueva se
// añade también a RUTAS_PUBLICAS en test/accesos.test.js, o esa prueba falla.
const personal = [requiereAuth, requiereRol('admin', 'tecnico')];
const soloAdmin = [requiereAuth, requiereRol('admin')];

// Solo cuentan los intentos fallidos: el personal que entra bien no se bloquea
const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { ok: false, msg: 'Demasiados intentos. Espere unos minutos y vuelva a probar.' }
});


routerUsers.post('/login', limiteLogin, UserController.login);
routerUsers.get('/profileUser', requiereAuth, UserController.profileUser);

routerUsers.get('/catalogo/repuestos', InventarioController.listCatalogo);


routerUsers.post('/inventario', personal, InventarioController.createInventario)
routerUsers.get('/inventarios', personal, InventarioController.listInventarios)
routerUsers.put('/inventario/:id', personal, InventarioController.updateInventario);
routerUsers.get('/inventario/filtrar/:id', personal, InventarioController.listInventariosId);
routerUsers.delete('/inventario/:id', soloAdmin, InventarioController.deleteInventario);
routerUsers.get('/inventarios/filter', personal, InventarioController.filterInventarios);

routerUsers.post('/cliente', personal, ClienteController.createCliente)
routerUsers.get('/clientes', personal, ClienteController.listClientes)
routerUsers.put('/cliente/:id', personal, ClienteController.updateCliente);
routerUsers.get('/cliente/filtrar/:id', personal, ClienteController.listClienteId);
routerUsers.delete('/cliente/:id', personal, ClienteController.deleteCliente);
routerUsers.get('/clientes/filter', personal, ClienteController.filterClientes);


routerUsers.post('/servicio-detalle', personal, ServiceDetalleController.createServiceDetalle)
routerUsers.get('/servicio-detalles', personal, ServiceDetalleController.listServiceDetalle)
routerUsers.get('/servicios', personal, ServiceDetalleController.listServicios)
routerUsers.get('/servicios/:id', personal, ServiceDetalleController.getServicioById)
routerUsers.put('/servicio-detalle/:id', personal, ServiceDetalleController.updateFacturaId);

routerUsers.get('/usuarios', soloAdmin, UsuarioController.findAll);
routerUsers.get('/usuarios/filtrar/:id', soloAdmin, UsuarioController.findById);
routerUsers.post('/usuarios/crear', soloAdmin, UsuarioController.create);
routerUsers.put('/usuarios/editar/:id', soloAdmin, UsuarioController.update);
routerUsers.delete('/usuarios/eliminar/:id', soloAdmin, UsuarioController.remove);

routerUsers.post('/factura', personal, FacturaController.createFactura);
routerUsers.get('/facturas', personal, FacturaController.listFacturas);
// primero la ruta más específica
routerUsers.get('/factura/filtrar/:id', personal, FacturaController.getOrCreateFacturaByDetalleId);

// después la ruta genérica
routerUsers.get('/factura/:id', personal, FacturaController.getFacturaById);


routerUsers.post('/factura-detalle', personal, FacturaDetalleController.createFacturaDetalle);
routerUsers.get('/factura-detalles', personal, FacturaDetalleController.listFacturaDetalles);
routerUsers.get('/factura-detalles/:id', personal, FacturaDetalleController.getDetallesByFacturaId);


routerUsers.get('/servicio/:id', personal, ServiceDetalleController.getServicioById);

routerUsers.get('/cita', personal, CitaController.listarCita);
routerUsers.post('/cita', personal, CitaController.crearCita);
routerUsers.get('/cita/:id', personal, CitaController.obtenerCitaPorId);
routerUsers.put('/cita/:id', personal, CitaController.actualizarCita);
routerUsers.delete('/cita/eliminar/:id', personal, CitaController.eliminarCita);

module.exports = routerUsers;
