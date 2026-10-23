# 02 — Modelo de datos

> **Lee antes:** [`01-estado.md`](01-estado.md#endpoints) para saber qué endpoint toca cada tabla.

## 🔴 El esquema no está en el repositorio

No hay migraciones, ni `schema.sql`, ni seeds. Las tablas, la vista, los procedimientos
almacenados y los triggers **existen solo en la base de producción** (la que apunta
`DATABASE_URL` en Render). Todo lo de abajo está **inferido de las consultas del código**:
las columnas listadas son las que el código lee o escribe, no necesariamente todas.

Consecuencias mientras no se cierre la [Fase 3](04-hoja-de-ruta.md#fase-3--base-de-datos-versionada):

- No se puede levantar una base nueva (otro taller, pruebas, staging) sin copiar la de producción.
- La lógica de los `CALL` (validación de stock, qué se descuenta, qué se borra en cascada)
  **no se puede leer** desde aquí. Antes de cambiar un modelo que usa un procedimiento,
  hay que pedir su definición (`\sf nombre` en `psql`, o `pg_dump --schema-only`).
- No inventes columnas ni restricciones. Si hace falta una, se pregunta.

## Tablas

| Tabla | Clave | Columnas que usa el código | Modelo |
|---|---|---|---|
| `usuarios` | `usuario_id` | `nombre`, `email`, `password_hash` (bcrypt, 10 rondas), `rol` (`admin` · `tecnico` · `cliente`), `email_verificado` | `user.model.js`, `usuario.model.js` |
| `clientes` | `cliente_id` | `nombre`, `telefono`, `email`, `direccion`, `usuario_id` (nulo si lo dio de alta el personal) | `cliente.model.js` |
| `inventarios` | `repuesto_id` | `nombre`, `cantidad_disponible`, `cantidad_minima`, `costo_unitario`, `imagen` (data-URL base64), `descripcion`, `fecha_ingreso`(?) | `inventario.model.js` |
| `servicios` | `servicio_id` | `descripcion`, `costo_servicio` | `servicio-detalle.js` |
| `servicio_detalle` | `detalle_id` | `servicio_id`, `cliente_id`, `repuesto_id`, `cantidad`, `factura_id` (nulo hasta facturar) | `servicio-detalle.js` |
| `factura` | `factura_id` | `numero_factura` (`FA-00001`), `cliente_id`, `fecha_emision`, `subtotal`, `iva`, `total`, `estado` | `factura.model.js` |
| `factura_detalle` | `factura_detalle_id` | `factura_id`, `servicio_id` **o** `repuesto_id`, `cantidad`, `precio_unitario`, `subtotal` | `factura_detalle.model.js` |
| `cita` | `cita_id` | `usuario_id` (el usuario, no el cliente), `servicio_id`, `fecha`, `hora`, `estado` (`PENDIENTE`…), `observaciones`, `creado_en` | `cita.model.js` |

`fecha_ingreso` aparece en el formulario de repuestos pero ningún modelo la escribe: el
procedimiento `insertar_inventario` recibe 6 argumentos sin ella.

El frontend espera un error `23505` (violación de unicidad) al duplicar una cita en la
misma fecha y hora, lo que sugiere un `UNIQUE (fecha, hora)` en `cita` — **sin confirmar**.

## Vista

| Vista | Para qué | Usada en |
|---|---|---|
| `vista_servicio_detalle` | `servicio_detalle` con nombres de cliente, servicio y repuesto; ordenada por `detalle_id` | `findViewServiceDetalle`, `findDetalleById` |

## Procedimientos y funciones

| Llamada | Argumentos | Notas |
|---|---|---|
| `CALL insertar_cliente` | `nombre, telefono, direccion` | Sin `email`, aunque el controlador lo recibe |
| `CALL actualizar_cliente` | `id, nombre, telefono, direccion` | |
| `CALL eliminar_cliente` | `id` | Comportamiento con facturas/citas del cliente: desconocido |
| `filter_cliente_por_nombre($1)` | `nombre` | Función que devuelve filas. Ningún endpoint la usa bien todavía |
| `CALL insertar_inventario` | `nombre, cantidad_disponible, cantidad_minima, costo_unitario, imagen, descripcion` | |
| `CALL actualizar_inventario` | `id` + los 6 anteriores | |
| `CALL eliminar_inventario` | `id` | |
| `filter_inventario_por_nombre($1)` | `nombre` | |
| `CALL insertar_Servicio_Detalle` | `servicio_id, cliente_id, repuesto_id, cantidad` | Un trigger lanza `P0001` con «El repuesto no existe en el inventario» o «Cantidad no disponible en el stock». Probablemente descuenta stock — **sin confirmar** |

Los mensajes `P0001` se traducen a 400 en `service_detalle.controller.js:26-32` y
`cliente.controller.js:17-19`: si se cambia el texto en la base, hay que cambiar el
`includes(...)` del controlador.

## Facturación

- **Origen**: una factura nace de **un** `servicio_detalle` (`GET /factura/filtrar/:detalle_id`).
  Crea hasta dos líneas de `factura_detalle`: una del servicio (cantidad 1) y una del repuesto.
- **Cálculo** (`factura.controller.js:27-38`): `subtotal = costo_servicio + costo_unitario × cantidad`,
  `iva = subtotal × 0.12`, `total = subtotal + iva`. Los precios se leen de la base en ese
  momento, no del navegador (bien), pero el IVA está fijo.
- **Número**: `FA-` + 5 dígitos, el último leído + 1, sin secuencia ni bloqueo.
- **Estado**: se crea `PENDIENTE`; nada lo cambia después.
- **PDF**: lo arma el navegador (`helpers/factura-html.helper.ts` + `html2pdf`). La cabecera
  del taller está escrita en el helper.
- No hay RUC/cédula del cliente, ni del emisor, ni punto de emisión: **no es un comprobante
  tributario**. Ver la [Fase 6](04-hoja-de-ruta.md#fase-6--facturación-con-validez-en-ecuador).

## Borrados

- `DELETE /usuarios/eliminar/:id` borra en transacción las filas de `clientes` de ese usuario
  y luego el usuario (`usuario.model.js:104-119`). Si `factura` referencia al cliente, o
  falla por clave foránea o arrastra facturas — depende de una restricción que no vemos.
  🔒 Una factura emitida **no debería poder borrarse nunca**; a partir de la Fase 2 se
  desactiva al cliente en vez de borrarlo.
