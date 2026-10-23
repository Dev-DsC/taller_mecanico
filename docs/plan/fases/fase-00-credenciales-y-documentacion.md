# Fase 0 — Credenciales fuera del código y documentación

> **Lee antes:** [`06-operacion.md`](../06-operacion.md#variables-de-entorno) (variables) y
> [`03-seguridad.md`](../03-seguridad.md) (hallazgo C1).
> Rama `fase-00-credenciales-y-documentacion`, 2026-10-23.

## Por qué

El repositorio `Dev-DsC/taller_mecanico` es **público** y `email.service.js` llevaba
escritos el correo personal del usuario y una **contraseña de aplicación de Gmail**. Una
contraseña de aplicación da acceso SMTP (enviar correo como esa cuenta) y, según el
tipo de acceso, IMAP: no es «solo para este proyecto».

En el historial hay **dos distintas**:

| Contraseña | Commits donde aparece | Desde |
|---|---|---|
| La primera | `73da14c`, `30d466b` | 2025-07-17 |
| La segunda | `383c361` y siguientes hasta `c60d5d8` | 2025-07-19 |

Ni siquiera un prefijo de cada una se escribe aquí: Google las lista por el nombre que se
les dio al crearlas, no por su valor, así que para revocarlas no hace falta.

## Qué se hizo

- `Backend/src/services/email.service.js`: usuario, contraseña y remitente salen de
  `EMAIL_USER`, `EMAIL_PASS` y `EMAIL_FROM`. Si faltan, `enviarCorreoVerificacion` lanza un
  error que lo dice, en vez de un fallo de autenticación SMTP difícil de leer.
- `Backend/src/index.js`: `dotenv.config()` antes de `require('./app')`. Antes iba
  después, y en local los módulos que leen `process.env` al importarse (`db.js`, ahora
  también `email.service.js`) arrancaban sin variables. En Render no se notaba.
- `Backend/.env.example` con todas las variables y cómo generarlas.
- `.gitignore` de la raíz (estaba vacío): ignora `.env` y `.env.*` en todo el repositorio,
  salvo `.env.example`. `ProyectoTW/.gitignore` solo ignoraba `/env`.
- Documentación en `docs/plan/` y `CLAUDE.md` reescrito (antes era un volcado de CodeViz).

Verificado: `node --check` de los dos archivos; en una copia con dependencias instaladas,
sin variables el servicio lanza el error esperado y con `.env` cargado primero las ve;
`git grep` no encuentra ninguna de las dos contraseñas ni el correo en el árbol.

## 🔴 Lo que falta y solo puede hacer el usuario

1. **Revocar las dos contraseñas de aplicación** en <https://myaccount.google.com/apppasswords>.
   Quitarlas del código no las invalida: siguen en el historial público y en cualquier
   clon o fork.
2. Crear una nueva y ponerla en Render como `EMAIL_PASS`, con `EMAIL_USER` = la cuenta.
   **Hasta entonces el registro de clientes falla** en cuanto se despliegue esta rama (y
   también fallará en `main` en cuanto se revoque la vieja).
3. Revisar en la cuenta de Google la actividad reciente y los dispositivos.
4. Decidir si el repositorio pasa a **privado** (recomendado si el código es el producto).

## Decisiones

- **No se reescribió el historial.** Borrar las contraseñas de los commits exige
  `git filter-repo` y un `push --force` a las tres ramas remotas que las contienen
  (`main`, `pruebas_deploy`, `agregar-calendario-citas`), rompe los clones
  existentes y no alcanza a forks ni cachés. Una vez revocadas, lo que queda en el
  historial no sirve para nada. Si aun así se quiere, es una operación aparte que el
  usuario tiene que pedir.
- **Las URLs de Render y Vercel siguen escritas a mano**: no son secretos, y cambiarlas a
  variables va en la Fase 4 junto con el resto de la marca blanca.
- **El nombre del taller queda como remitente por defecto** para no cambiar lo que ve el
  cliente actual.

## Para la fase que lo sufra

- Fase 1: el error de correo del registro sigue dejando al usuario creado y sin forma de
  pedir otro enlace desde la web (`usuario.controller.js:39`, ya en `01-estado.md`).
- Fase 4: si se cambia Gmail por un proveedor transaccional, `EMAIL_PASS` pasa a ser una
  API key y `EMAIL_FROM` tendrá que ser de un dominio verificado.
