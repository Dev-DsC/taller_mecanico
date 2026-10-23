# 03 — Seguridad

> **Lee antes:** [`01-estado.md`](01-estado.md#endpoints) (qué rutas existen).
> Auditoría del **2026-10-23** sobre `c60d5d8`. Cuando se corrija un hallazgo, **se marca
> ✅ con la fase y el commit**, y a la siguiente revisión se borra.

## Resumen

El API está **abierto**: casi ninguna ruta exige token, los roles solo se comprueban en
Angular, y el registro deja elegir `rol`. Cualquiera con la URL de Render puede listar,
modificar o borrar clientes, usuarios, citas, inventario y facturas, o darse de alta como
`admin`. Esto es lo primero que se cierra (Fase 1) y bloquea la venta.

## 🔴 Críticos

| # | Hallazgo | Dónde | Corrección |
|---|---|---|---|
| C1 | **Dos contraseñas de aplicación de Gmail** de la cuenta personal del usuario, en el historial de un repositorio **público** desde 2025-07-17 | Commits `73da14c`, `30d466b` (una) y `383c361` (otra), `Backend/src/services/email.service.js` | ✅ Fuera del código en la Fase 0. 🔴 **Falta revocarlas** en Google: mientras no se revoquen, funcionan. Ver [`fase-00`](fases/fase-00-credenciales-y-documentacion.md) |
| C2 | **Rutas sin autenticación**: solo `/profileUser` usa `authMiddleware` | `Backend/src/routes/user.router.js:21-68` | Middleware de autenticación en todo lo que no sea público, y un interceptor HTTP en Angular que envíe `Authorization: Bearer` (hoy **no se envía nunca**) |
| C3 | **Escalada de privilegios en el registro**: `POST /usuarios/crear` toma `rol` del cuerpo; el frontend lo fija a `cliente` solo en el navegador | `Backend/src/controllers/usuario.controller.js:11`, `register.component.ts:70-72` | El registro público crea siempre `cliente`. Alta de `tecnico`/`admin` solo por un admin autenticado, en otra ruta |
| C4 | **Roles solo en el cliente**: el `AuthGuard` decodifica el JWT sin verificar la firma y el backend no mira `rol` | `ProyectoTW/src/app/guards/auth.guard.ts:26-31` | Middleware `requiereRol('admin', 'tecnico')` en el backend. El guard queda como comodidad visual |
| C5 | `PUT /usuarios/editar/:id` cambia `rol` y `email` de cualquiera, sin autenticación | `usuario.controller.js:78-99` | Solo admin; un usuario solo edita su propio perfil y sin `rol` |

## 🟠 Altos

| # | Hallazgo | Dónde | Corrección |
|---|---|---|---|
| A1 | `/profileUser` devuelve la fila completa **con `password_hash`**, buscando por un `email` del cuerpo: cualquier usuario logueado lee el hash de otro | `user.controller.js:110-119` | Leer el usuario de `req.user.userId` y devolver columnas explícitas |
| A2 | Cualquiera puede leer **todas las citas** (y con ellas qué cliente viene cuándo) | `GET /cita`, `cita.model.js:19-25` | El cliente solo ve las suyas; el personal ve todas |
| A3 | El registro de un cliente **se apropia de una ficha existente** si coinciden nombre y teléfono (con su historial y facturas) | `usuario.model.js:23-36` | Vincular solo por confirmación del personal, o por correo verificado que ya esté en la ficha |
| A4 | El JWT vive en una cookie **legible por JavaScript**, sin `Secure` ni `SameSite`; un XSS lo roba | `auth.service.ts:59-61` | Cookie `HttpOnly; Secure; SameSite` emitida por el API, o al menos `Secure` + `SameSite=Strict` y vida corta |
| A5 | El token del enlace de verificación (`{ email }`) se firma con el mismo `JWT_SECRET` y `authMiddleware` lo acepta como sesión | `user.controller.js:16-20`, `authMiddleware.js:10` | Secreto o `audience` distintos para cada tipo de token; la sesión exige `userId` |
| A6 | Sin límite de intentos en `/login`, `/usuarios/crear` ni `/enviar-verificacion`: fuerza bruta y **bombardeo de correos** desde la cuenta de Gmail (Google la bloquea) | `app.js` | `express-rate-limit` por IP y por correo |
| A7 | El login dice si el correo existe («Email not found» vs «Invalid credentials») | `user.controller.js:66-68` | Un único mensaje. El frontend ya traduce ambos en `auth.component.ts:44-57` |

## 🟡 Medios

| # | Hallazgo | Dónde | Corrección |
|---|---|---|---|
| M1 | Cuerpo de hasta **50 MB** e imágenes en base64 dentro de la base: denegación de servicio barata y base inflada | `app.js:30-31` | Límite de ~1 MB para JSON; imágenes a almacenamiento de objetos con subida firmada |
| M2 | Sin validación de entrada en el servidor (longitudes, tipos, contraseña mínima): solo la del formulario | Todos los controladores | Un esquema por ruta (`zod` o `express-validator`) |
| M3 | Sin cabeceras de seguridad | `app.js` | `helmet` |
| M4 | El manejador de errores nunca se ejecuta (va antes de las rutas); si Express usa el suyo sin `NODE_ENV=production`, devuelve la traza | `app.js:34-43` | Moverlo al final y fijar `NODE_ENV=production` en Render |
| M5 | `ssl: { rejectUnauthorized: false }` acepta cualquier certificado de la base | `config/db.js:5-7` | Verificar el certificado del proveedor (CA en variable de entorno) |
| M6 | `process.on('unhandledRejection')` traga los errores y el proceso sigue en estado desconocido | `app.js:8-10` | Registrar y dejar que Render reinicie, o capturar en cada controlador |
| M7 | `GET /factura/filtrar/:id` **crea** facturas: un rastreador o un precargador del navegador puede emitirlas | `user.router.js:51` | `POST` explícito |

## Lo que está bien (no romperlo)

- 🔒 Todas las consultas son **parametrizadas** (`$1, $2…`): no hay inyección SQL. Mantenerlo.
- 🔒 Las contraseñas se guardan con **bcrypt**, y los listados de usuarios no devuelven el hash.
- 🔒 El total de la factura se calcula en el servidor con precios de la base, no con lo que manda el navegador.
- 🔒 CORS restringido a orígenes concretos con `credentials: true`.

## Reglas para no reintroducir lo mismo

1. **Ningún secreto en el código**, tampoco «temporalmente» ni en un commit de prueba: el
   repositorio es público y el historial no se borra solo. Plantilla en `Backend/.env.example`.
2. **Toda ruta nueva nace protegida**: si es pública, se declara explícitamente y se anota
   aquí por qué.
3. **El rol y el usuario salen del token verificado en el servidor**, nunca del cuerpo,
   de la URL ni del JWT decodificado en el navegador.
4. **Ninguna respuesta devuelve `password_hash`**: se seleccionan columnas, nunca `SELECT *`
   de `usuarios`.
