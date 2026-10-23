# 03 — Seguridad

> **Lee antes:** [`01-estado.md`](01-estado.md#endpoints) (qué rutas existen y su acceso).
> Auditoría del **2026-10-23** sobre `c60d5d8` (tras la limpieza del historial, `a65d99c`),
> revisada al cerrar la Fase 1. Cuando se corrija un hallazgo, **se marca ✅ con la fase**, y
> a la siguiente revisión se borra.

## Resumen

Hasta la Fase 1 el API estaba **abierto**: casi ninguna ruta exigía token, los roles solo se
comprobaban en Angular y el registro dejaba elegir `rol`. La Fase 1 lo cerró. Ahora solo el
personal tiene cuenta, el backend exige sesión y rol en cada ruta, y una prueba recorre el
router entero. Queda lo que se arrastra de antes: **revocar las credenciales filtradas** y
**auditar las cuentas** que pudieron crearse mientras estuvo abierto.

## 🔴 Críticos

| # | Hallazgo | Dónde | Corrección |
|---|---|---|---|
| C1 | **Dos contraseñas de aplicación de Gmail** de la cuenta personal del usuario, en el historial de un repositorio **público** desde 2025-07-17 | Commits en [`fase-00`](fases/fase-00-credenciales-y-documentacion.md) | ✅ Fuera del código y del historial de las ramas (Fase 0); desde la Fase 1 el sistema ya no usa correo. 🔴 **Falta revocarlas** en Google y pedir a GitHub que borre los PR #16–#20: mientras no se revoquen, funcionan |
| C6 | Mientras el API estuvo abierto (al menos desde 2025-07), **cualquiera pudo crearse una cuenta `admin`** o tocar datos | Base de producción | 🔴 Auditar las cuentas de personal con `001-citas-por-cliente.revisar.sql` (consulta 1) antes de desplegar la Fase 1, y revisar los datos que no se reconozcan |
| C2 | ✅ Fase 1 — Rutas sin autenticación | `routes/user.router.js` | `requiereAuth` + `requiereRol` en toda ruta salvo login y catálogo; interceptor que manda el token |
| C3 | ✅ Fase 1 — Escalada de privilegios en el registro | `usuario.controller.js` | No hay registro público; solo el admin crea cuentas, y solo `admin`/`tecnico` |
| C4 | ✅ Fase 1 — Roles solo en el cliente | `middlewares/authMiddleware.js` | El backend comprueba el rol, leído **de la base**, no del token |
| C5 | ✅ Fase 1 — `PUT /usuarios/editar/:id` sin autenticación | `usuario.controller.js` | Solo admin, y nadie se cambia su propio rol |

## 🟠 Altos

| # | Hallazgo | Dónde | Corrección |
|---|---|---|---|
| A4 | El JWT vive en una cookie **legible por JavaScript**: un XSS lo roba | `auth.service.ts` (`setTokenCookie`) | ✅ Fase 1: `Secure` (https), `SameSite=Strict`, 1 h. Falta `HttpOnly`, que exige web y API en el mismo sitio (dominio propio, Fase 4) |
| A1 | ✅ Fase 1 — `/profileUser` devolvía `password_hash` de cualquiera | `user.controller.js` | Lee la cuenta de la sesión con columnas explícitas |
| A2 | ✅ Fase 1 — Cualquiera leía todas las citas | `GET /cita` | Solo personal |
| A3 | ✅ Fase 1 — El registro se apropiaba de fichas por nombre + teléfono | `usuario.model.js` | El código ya no existe: el personal no tiene ficha de cliente |
| A5 | ✅ Fase 1 — El token de verificación valía como sesión | `authMiddleware.js` | No hay tokens de verificación, y la sesión exige `userId` de una cuenta de personal existente |
| A6 | ✅ Fase 1 — Sin límite de intentos | `routes/user.router.js` (`limiteLogin`) | 10 fallos/15 min por IP en el login (`trust proxy` por Render). Registro y reenvío de correo ya no existen |
| A7 | ✅ Fase 1 — El login decía si el correo existía | `user.controller.js` | Respuesta única y tiempo igualado con un hash de relleno |

## 🟡 Medios

| # | Hallazgo | Dónde | Corrección |
|---|---|---|---|
| M1 | Imágenes en base64 dentro de la base, y `/inventario` acepta 10 MB **antes** de comprobar la sesión | `app.js:35` | ✅ en parte (Fase 1): 100 kB en el resto. Falta: imágenes a almacenamiento de objetos con subida firmada (Fase 8) |
| M2 | Sin validación de entrada en el servidor salvo en usuarios y citas | Controladores | Un esquema por ruta (`zod` o `express-validator`) — Fase 2 |
| M4 | El manejador de errores nunca se ejecuta (va antes de las rutas); si Express usa el suyo sin `NODE_ENV=production`, devuelve la traza | `app.js:40-49` | Moverlo al final y fijar `NODE_ENV=production` en Render |
| M5 | `ssl: { rejectUnauthorized: false }` acepta cualquier certificado de la base | `config/db.js:6` | Verificar el certificado del proveedor (CA en variable de entorno) |
| M6 | `process.on('unhandledRejection')` traga los errores y el proceso sigue en estado desconocido | `app.js:14-16` | Registrar y dejar que Render reinicie, o capturar en cada controlador |
| M7 | `GET /factura/filtrar/:id` **crea** facturas: un precargador del navegador puede emitirlas | `user.router.js:67` | `POST` explícito |
| M3 | ✅ Fase 1 — Sin cabeceras de seguridad | `app.js` | `helmet` |

## Lo que está bien (no romperlo)

- 🔒 Todas las consultas son **parametrizadas** (`$1, $2…`): no hay inyección SQL. Mantenerlo.
- 🔒 Las contraseñas se guardan con **bcrypt**, y ninguna respuesta devuelve el hash.
- 🔒 El total de la factura se calcula en el servidor con precios de la base, no con lo que manda el navegador.
- 🔒 CORS restringido a orígenes concretos.
- 🔒 `test/accesos.test.js` lee las rutas del router: una ruta nueva sin protección rompe la prueba.

## Reglas para no reintroducir lo mismo

1. **Ningún secreto en el código**, tampoco «temporalmente» ni en un commit de prueba: el
   repositorio es público y el historial no se borra solo. Plantilla en `Backend/.env.example`.
2. **Toda ruta nueva declara su acceso** en `user.router.js` (`personal`, `soloAdmin` o
   `requiereAuth`). Si es pública, se añade a `RUTAS_PUBLICAS` en `test/accesos.test.js` y
   se anota aquí por qué.
3. **El rol y el usuario salen de `req.user`**, que pone `requiereAuth` desde la base; nunca
   del cuerpo, de la URL ni del JWT decodificado en el navegador.
4. **Ninguna respuesta devuelve `password_hash`**: se seleccionan columnas, nunca `SELECT *`
   de `usuarios` hacia fuera (`findOneUserEmail` lo hace solo para el login).
5. **Los clientes no tienen cuenta.** Lo que se les dé (solicitud de cita, enlaces de
   presupuesto) va sin contraseña, con enlaces de un solo uso y límite de abusos (Fase 7).
