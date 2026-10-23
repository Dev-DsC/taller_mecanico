# Fase 0 — Credenciales fuera del código y documentación

> **Lee antes:** [`06-operacion.md`](../06-operacion.md#variables-de-entorno) (variables) y
> [`03-seguridad.md`](../03-seguridad.md) (hallazgo C1).
> Rama `fase-00-credenciales-y-documentacion`, 2026-10-23.

## Por qué

El repositorio `Dev-DsC/taller_mecanico` es **público** y `email.service.js` llevaba
escritos el correo personal del usuario y una **contraseña de aplicación de Gmail**. Una
contraseña de aplicación da acceso SMTP (enviar correo como esa cuenta) y, según el
tipo de acceso, IMAP: no es «solo para este proyecto».

En el historial había **dos distintas**. Los hashes «antes» son los que tenían esos
commits hasta la limpieza del historial (abajo); siguen sirviendo para pedirle a GitHub que
borre su copia:

| Contraseña | Apareció en (hash antes → ahora) | Desde |
|---|---|---|
| La primera | «prueba deploy» `73da14c` → `e2a43a0`, «Correcion de rutas enviroments» `30d466b` → `388224f` | 2025-07-17 |
| La segunda | «mejoras y correcion de email de verificacion» `383c361` → `e6202dd`, y todos los siguientes hasta `c60d5d8` → `a65d99c` | 2025-07-19 |

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

## Limpieza del historial (2026-10-23, autorizada por el usuario)

En cada commit de las ramas `main`, `pruebas_deploy`, `agregar-calendario-citas` y
`fase-00-credenciales-y-documentacion`, la contraseña de `email.service.js` se sustituyó
por `***ELIMINADA***`, con `git filter-branch --index-filter` sobre un clon *bare*
aparte, y se subió con `push --force-with-lease`. Las otras 7 ramas no se tocaron.

- 🔴 **`filter-branch` borra la firma GPG de los merges que hace GitHub**, y un merge sin
  firma tiene otro hash. Reescribir «todo» cambió 34 commits que no tenían contraseña y
  desconectó las 7 ramas sin tocar de `main`. Se repitió reescribiendo **solo** los
  commits que contienen la contraseña o descienden de uno que la tiene (`--not` con los
  padres de frontera). En `main` cambiaron 41 de 81 commits; los otros 40 conservan hash y
  firma, y las 7 ramas siguen siendo ancestros de `main`.
- Comprobado desde un clon nuevo de GitHub: 0 coincidencias en los 85 commits de todas las
  ramas; contenido final de cada rama idéntico al anterior salvo esa línea; autores,
  fechas y mensajes iguales (salvo el último commit de esta rama, reformulado).
- Los merges reescritos **pierden la marca «Verified»** de GitHub: es el precio de cambiar
  su contenido.
- **Copia del estado anterior**, con todas las ramas y referencias:
  `C:\Users\dalto\Desktop\PROGRAMACION\taller_mecanico-backups\antes-de-limpiar-historial-2026-10-23.git`.
  Contiene las contraseñas: no se sube a ningún sitio.

🔴 **Nadie debe hacer push desde un clon anterior al 2026-10-23**: reintroduciría los
commits viejos con las contraseñas. Quien tenga uno (Carlos, otra máquina) lo borra y vuelve
a clonar.

Lo que la limpieza **no** alcanza, porque solo GitHub puede borrarlo:

- Los PR cerrados **#16 a #20** siguen apuntando a commits con la contraseña
  (`refs/pull/N/head`), y los commits viejos se pueden abrir por su hash
  (`github.com/Dev-DsC/taller_mecanico/commit/383c361`).
- Para borrarlos: formulario de soporte de GitHub, «Remove sensitive data», indicando el
  repositorio, los PR #16–#20 y los hashes «antes» de la tabla de arriba.
- Forks y clones de terceros: fuera de alcance. Por eso lo que de verdad protege es revocar.

## 🔴 Lo que falta y solo puede hacer el usuario

1. **Revocar las dos contraseñas de aplicación** en <https://myaccount.google.com/apppasswords>.
   Limpiar el historial no las invalida: pasaron más de un año en el historial de un
   repositorio que hoy es público, y siguen en las copias de GitHub de los PR #16–#20 y en
   cualquier clon o fork.
2. Crear una nueva y ponerla en Render como `EMAIL_PASS`, con `EMAIL_USER` = la cuenta.
   **Hasta entonces el registro de clientes falla** en cuanto se despliegue esta rama (y
   también fallará en `main` en cuanto se revoque la vieja).
3. Revisar en la cuenta de Google la actividad reciente y los dispositivos.
4. Pedir a GitHub que borre los PR #16–#20 y los commits viejos (ver arriba).
5. Avisar a quien tenga un clon de que lo borre y vuelva a clonar.
6. Decidir si el repositorio pasa a **privado** (recomendado si el código es el producto).

## Decisiones

- **Las contraseñas se sustituyeron, no se borró el archivo**: el historial sigue contando
  qué pasó en cada commit, sin el secreto. El correo de la cuenta no se sustituyó: ya es
  público como autor de 55 commits.
- **Las URLs de Render y Vercel siguen escritas a mano**: no son secretos, y cambiarlas a
  variables va en la Fase 4 junto con el resto de la marca blanca.
- **El nombre del taller queda como remitente por defecto** para no cambiar lo que ve el
  cliente actual.

## Para la fase que lo sufra

- Fase 1: el error de correo del registro sigue dejando al usuario creado y sin forma de
  pedir otro enlace desde la web (`usuario.controller.js:39`, ya en `01-estado.md`).
- Fase 4: si se cambia Gmail por un proveedor transaccional, `EMAIL_PASS` pasa a ser una
  API key y `EMAIL_FROM` tendrá que ser de un dominio verificado.
