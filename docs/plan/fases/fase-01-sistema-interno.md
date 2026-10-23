# Fase 1 — Sistema interno con accesos cerrados

> **Lee antes:** [`00-contexto.md`](../00-contexto.md#decisiones-tomadas) (por qué es interno)
> y [`01-estado.md`](../01-estado.md#endpoints) (la matriz de accesos de cada ruta).
> Rama `fase-01-sistema-interno`, 2026-10-23.

## Por qué

La aplicación mezclaba dos modelos: una web pública donde cualquiera se registraba (y podía
elegir el rol `admin`) y un panel del taller. El API no exigía sesión en casi nada y el
frontend nunca mandaba el token. El usuario decidió el **modelo interno**: solo el personal
tiene cuenta, el admin las crea, y el cliente no tiene contraseña.

Retirar el registro público obligaba a arreglar algo más: **las citas colgaban de cuentas
de usuario** (`cita.usuario_id`) y el personal solo podía agendar a clientes registrados por
la web. Sin registro, ningún cliente nuevo habría podido tener cita. Por eso la agenda pasa a
las fichas de `clientes` en esta misma fase.

## Qué se hizo

**Accesos (backend):**
- `middlewares/authMiddleware.js` exporta `requiereAuth` y `requiereRol`. `requiereAuth`
  verifica el JWT y **relee al usuario de la base** en cada petición: borrar una cuenta o
  cambiarle el rol surte efecto en el acto, sin esperar a que caduque el token (1 h).
- `routes/user.router.js` declara el acceso de cada ruta con `personal` o `soloAdmin`. Las
  únicas públicas son `POST /login` y `GET /catalogo/repuestos`.
- `config/roles.js`: `ROLES_PERSONAL = ['admin', 'tecnico']` y la longitud mínima de contraseña.
- Login:
  - una sola respuesta (401 `Invalid credentials`) para un correo inexistente o una
    contraseña errónea, comparando contra un hash de relleno para igualar el tiempo;
  - 403 si la cuenta es `cliente` o no está activada, siempre después de acertar la contraseña;
  - 10 intentos fallidos cada 15 min por IP (`express-rate-limit`, con `trust proxy` por Render).
- `helmet`. Límite de cuerpo de 100 kB, y 10 MB solo para `/inventario`, por la foto en base64.

**Cuentas:**
- Solo el admin crea, edita y borra cuentas, y solo con rol `admin` o `tecnico`.
- Contraseña de ≥ 8 caracteres comprobada en el servidor. La cuenta nace con
  `email_verificado = TRUE`.
- Editar acepta una contraseña nueva opcional: es la única forma de recuperar una cuenta.
- El admin no puede borrarse ni cambiarse su propio rol.
- Borrar una cuenta **desvincula** sus fichas de cliente y sus citas, nunca las borra.
- Fuera la verificación por correo: rutas, `email.service.js`, `nodemailer`, la pantalla
  `/verificado` y las variables `EMAIL_*`.

**Agenda:** `cita.cliente_id` en lugar de `usuario_id` para crear, editar y mostrar.
`obtenerPorId` muestra el nombre de la ficha o, para una cita antigua sin ficha, el de la
cuenta. Migración en `Backend/db/migraciones/001-citas-por-cliente.sql`, con su revisión
previa `.revisar.sql`.

**Frontend:**
- `interceptors/auth.interceptor.ts` manda `Authorization: Bearer` a las URLs del API. Ante un
  401 de una petición que llevaba token, cierra la sesión y lleva al login.
- Cookie `path=/`, `SameSite=Strict`, `Secure` en https, 1 h.
- Fuera: el registro, el botón «Crear nueva cuenta», «Agenda tu cita», la agenda y el
  calendario del cliente, y `/verificado`. `/agendar-cita-cliente` redirige a `/contactanos`
  (el WhatsApp) y `/verificado` a `/servicios`.
- `/usuario/add` tiene contraseña y solo roles de personal. Antes llamaba a una ruta que no
  existía y no tenía contraseña: el admin no podía crear a nadie.
- `/cita/agendar` elige entre fichas de clientes. `/repuestos` usa el catálogo público.
- Después del login se va a `/cita/agendar`.

## Cómo se comprobó

- `cd Backend && npm test`: 111 pruebas en `Backend/test/`, con la base simulada.
  `accesos.test.js` lee las rutas **del propio router**: una ruta nueva sin protección hace
  fallar «sin sesión ⇒ 401» sin que nadie tenga que acordarse. Comprobado quitando la
  protección a `GET /clientes`: fallaron 5 pruebas.
- `ng build` sin errores; 13 rutas prerenderizadas.
- API y web en local (sin base):
  - las rutas privadas dan 401 y `POST /usuarios/crear` sin sesión también;
  - `/verificar-email` da 404 y `helmet` pone sus cabeceras;
  - las redirecciones funcionan;
  - con un token falso de admin, el guard deja ver `/usuario/add`, pero la lista de usuarios
    recibe 401 del API y el interceptor cierra la sesión.
- **Sin probar todavía con datos reales**: login con una cuenta de verdad, agendar, facturar.
  Hace falta la base de producción (ver «Despliegue»).

## Despliegue — 🔴 en este orden, y la base solo con permiso del usuario

0. **Que Vercel pueda desplegar.** Hoy no puede: la web de producción está congelada en
   `b190268` (2025-07-22) porque la instalación falla con `ERESOLVE` y además Vercel bloquea
   todos los despliegues ([`06-operacion.md`](../06-operacion.md#-la-web-de-producción-está-congelada-desde-2025-07-22)).
   Si se fusiona antes, Render despliega el API nuevo y la web vieja, que no manda token,
   recibe 401 en todo: **el panel deja de funcionar**. El PR #22 no se fusiona hasta que un
   despliegue de Vercel quede `READY`.
1. Ejecutar `001-citas-por-cliente.revisar.sql` (solo lectura) y revisar:
   - **las cuentas de personal**: el API estuvo abierto y pudo haber admins creados por
     terceros. Se borran o se les cambia la contraseña desde `/usuario` una vez desplegado;
   - las citas que quedarían sin ficha;
   - los tipos de las columnas.
2. Ejecutar `001-citas-por-cliente.sql` (aditiva; el código viejo la ignora).
3. Fusionar el PR a una hora sin uso. Web y API nuevas dependen una de otra: durante los
   minutos que tardan en desplegarse las dos, el panel no funciona.
4. Comprobar en Vercel que el despliegue de producción de la fusión quedó `READY`. Si no,
   revertir Render al despliegue anterior hasta resolverlo.
5. Volver a ejecutar `001-citas-por-cliente.sql` para enlazar las citas creadas entretanto.
6. Quitar `EMAIL_USER`, `EMAIL_PASS` y `EMAIL_FROM` de Render, si llegaron a ponerse.

Una cuenta de personal sin activar (`email_verificado = FALSE`) ya no puede activarse sola.
Si es legítima: `UPDATE usuarios SET email_verificado = TRUE WHERE usuario_id = …`, con el
visto bueno del usuario.

## Decisiones

- **Token en `Authorization: Bearer`, no en cookie `HttpOnly`**: la web (`vercel.app`) y el API
  (`onrender.com`) son sitios distintos y los navegadores bloquean esas cookies. Con dominio
  propio (Fase 4) se puede pasar a `HttpOnly`.
- **Las cuentas `cliente` antiguas no se borran**: no pueden entrar y sus fichas siguen. Siguen
  apareciendo en `/usuario`; borrarlas es decisión del usuario.
- **`cita.usuario_id` no se borra todavía**: se retira cuando todas las citas tengan
  `cliente_id` y lleve un tiempo funcionando.
- **El parser de 10 MB de `/inventario` va antes que la autenticación**: el cuerpo se lee antes
  de saber si hay sesión. Es mucho menos que los 50 MB en todas las rutas de antes. Se
  arregla del todo cuando las imágenes salgan de la base (Fase 8).

## Para la fase que lo sufra

- **Fase 2:**
  - el personal no puede cambiar su propia contraseña, solo el admin ponérsela;
  - `/usuario` lista también las cuentas `cliente` antiguas;
  - la instalación del frontend necesita `npm ci --legacy-peer-deps` (Material 17 con Angular 18).
- **Fase 3:** esta es la primera migración versionada, y `Backend/db/migraciones/` es la
  carpeta. Al montar la herramienta de migraciones hay que contarla como ya aplicada.
- **Fase 7:** la solicitud de cita sin cuenta y los enlaces únicos (presupuesto, estado del
  carro) sustituyen a lo que se retiró aquí. Mientras tanto, el cliente pide cita por WhatsApp.
