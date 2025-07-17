const express = require('express');
const routerUsers = express.Router();
const UserController  = require("../controllers/user.controller");
const AuthMiddleware= require("../middlewares/authMiddleware");
const InventarioController = require('../controllers/inventario.controller');
const ClienteController = require('../controllers/cliente.controller');
const ServiceDetalleController = require('../controllers/service_detalle.controller')
const UsuarioController = require('../controllers/usuario.controller');
const FacturaController = require('../controllers/factura.controller');
const FacturaDetalleController = require('../controllers/factura_detalle.controller');
const CitaController = require('../controllers/cita.controller');


routerUsers.post('/enviar-verificacion', UserController.enviarVerificacionEmail);
routerUsers.get('/verificar-email/:token', UserController.verificarEmail);

routerUsers.post('/login',UserController.login); 
routerUsers.get('/profileUser',AuthMiddleware,UserController.profileUser); 


routerUsers.post('/inventario', InventarioController.createInventario)
routerUsers.get('/inventarios', InventarioController.listInventarios)
routerUsers.put('/inventario/:id', InventarioController.updateInventario);
routerUsers.get('/inventario/filtrar/:id', InventarioController.listInventariosId);
routerUsers.delete('/inventario/:id', InventarioController.deleteInventario);
routerUsers.get('/inventarios/filter', InventarioController.filterInventarios);

routerUsers.post('/cliente', ClienteController.createCliente)
routerUsers.get('/clientes', ClienteController.listClientes)
routerUsers.put('/cliente/:id', ClienteController.updateCliente);
routerUsers.get('/cliente/filtrar/:id', ClienteController.listClienteId);
routerUsers.delete('/cliente/:id', ClienteController.deleteCliente);
routerUsers.get('/clientes/filter', ClienteController.filterClientes);


routerUsers.post('/servicio-detalle', ServiceDetalleController.createServiceDetalle)
routerUsers.get('/servicio-detalles', ServiceDetalleController.listServiceDetalle)
routerUsers.get('/servicios', ServiceDetalleController.listServicios)
routerUsers.get('/servicios/:id', ServiceDetalleController.getServicioById)
routerUsers.put('/servicio-detalle/:id', ServiceDetalleController.updateFacturaId);

routerUsers.get('/usuarios', UsuarioController.findAll);
routerUsers.get('/usuarios/filtrar/:id', UsuarioController.findById);
routerUsers.post('/usuarios/crear', UsuarioController.create);
routerUsers.put('/usuarios/editar/:id', UsuarioController.update);
routerUsers.delete('/usuarios/eliminar/:id', UsuarioController.remove);

routerUsers.post('/factura', FacturaController.createFactura);
routerUsers.get('/facturas', FacturaController.listFacturas);
// primero la ruta más específica
routerUsers.get('/factura/filtrar/:id', FacturaController.getOrCreateFacturaByDetalleId);

// después la ruta genérica
routerUsers.get('/factura/:id', FacturaController.getFacturaById);


routerUsers.post('/factura-detalle', FacturaDetalleController.createFacturaDetalle);
routerUsers.get('/factura-detalles', FacturaDetalleController.listFacturaDetalles);
routerUsers.get('/factura-detalles/:id', FacturaDetalleController.getDetallesByFacturaId);


routerUsers.get('/servicio/:id', ServiceDetalleController.getServicioById);

routerUsers.get('/cita',CitaController.listarCita);
routerUsers.post('/cita', CitaController.crearCita);
routerUsers.get('/cita/:id', CitaController.obtenerCitaPorId);
routerUsers.put('/cita/:id', CitaController.actualizarCita);
routerUsers.delete('/cita/eliminar/:id', CitaController.eliminarCita);

module.exports = routerUsers;   