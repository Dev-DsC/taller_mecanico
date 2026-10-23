# 05 — Convenciones de código

> **Lee antes:** nada. Las reglas de proceso (ramas, commits, documentación) están en
> [`CLAUDE.md`](../../CLAUDE.md#cómo-se-trabaja-aquí); aquí solo las de código.

Describe cómo **está** escrito el proyecto. Código nuevo sigue esto salvo que una fase
decida cambiarlo, y entonces se actualiza este archivo.

## Backend (`Backend/src`)

- **CommonJS** (`require` / `module.exports`), sin TypeScript ni transpilador. Node ≥ 18.
- **Capas**: `routes/user.router.js` → `controllers/<entidad>.controller.js` →
  `models/<entidad>.model.js` → `config/db.js`. El controlador no escribe SQL; el modelo no
  conoce `req`/`res`.
- **Exportación**: cada archivo define funciones sueltas y exporta un objeto con nombre
  (`const ClienteController = { createCliente, … }; module.exports = ClienteController;`).
- **SQL**: siempre parametrizado con `{ text, values }` y `$1…$n`. Nunca concatenar ni
  interpolar valores. `RETURNING *` en inserciones y actualizaciones que devuelven la fila,
  salvo en `usuarios`, donde se listan columnas para no devolver `password_hash`.
- **Transacciones**: `const client = await db.connect()` + `BEGIN` / `COMMIT` / `ROLLBACK`
  y `client.release()` en `finally` (ver `deleteUser` en `usuario.model.js`). Toda escritura
  en más de una tabla va así.
- **Respuestas**: `res.status(...).json({ ok: true, data })`, `{ ok: true, msg, data }` al
  crear/editar, `{ ok: false, msg }` en error. Mensajes al usuario en español.
- **Errores**: `try/catch` en cada controlador, `console.error(error)` y 500 genérico. Un
  `P0001` de PostgreSQL es un error de negocio lanzado por un procedimiento → 400 con su mensaje.
- **Configuración**: solo por `process.env`, leído al importar el módulo. Variable nueva →
  se añade a `Backend/.env.example` y a [`06-operacion.md`](06-operacion.md#variables-de-entorno)
  en el mismo commit.
- **Nombres**: en español y `camelCase` para funciones (`crearCita`, `listClientes` — hay
  mezcla inglés/español heredada; lo nuevo, en español). Columnas en `snake_case`.
- **Rutas nuevas**: en `user.router.js` mientras no se parta el router, con la convención
  existente: `POST /<entidad>`, `GET /<entidad>s`, `GET /<entidad>/filtrar/:id`,
  `PUT /<entidad>/:id`, `DELETE /<entidad>/:id`. Ruta específica antes que la genérica
  (`/factura/filtrar/:id` antes de `/factura/:id`).
- **Acceso**: toda ruta lleva `personal`, `soloAdmin` o `requiereAuth` como segundo
  argumento. Quién es el usuario y qué rol tiene se lee de `req.user` (lo pone
  `requiereAuth` desde la base). Los roles válidos están en `config/roles.js`.
- **Pruebas**: en `Backend/test/*.test.js`, Jest + supertest contra `app`. La base se
  sustituye con `jest.mock('../src/config/db', () => require('./db-falsa'))` y los modelos con
  `jest.mock(...)`. Las cuentas de prueba y `tokenDe(usuario)` están en `test/ayudas.js`. Lo
  que cambia el comportamiento de una ruta lleva su prueba en el mismo commit.

## Frontend (`ProyectoTW/src/app`)

- **Angular 18 con NgModules**: `standalone: false` está fijado en `angular.json`. Todo
  componente nuevo se declara en `app.module.ts`; toda ruta nueva va en
  `app-routing.module.ts` con su `data: { roles, animation, index }`.
- **Un servicio por entidad** en `services/`, con
  `private apiUrl = \`${environment.backendUrl}/api/users\`` y métodos que devuelven
  `Observable`. Si el backend envuelve en `{ ok, data }`, el servicio hace `map(r => r.data)`.
- **Nunca** una URL del API escrita a mano en un componente: siempre `environment.backendUrl`.
  Así el `AuthInterceptor` le pone el token: solo lo hace con las URLs que empiezan por ella.
- **Sesión**: el token lo manda el interceptor; ningún servicio añade `Authorization` a mano
  ni decodifica el JWT para sacar ids. El rol del JWT solo sirve para esconder pantallas
  (`AuthGuard`, barra); quien decide es el API.
- **Formularios**: reactivos (`FormBuilder` + `Validators`). Los nombres de los controles
  son los de las columnas (`password_hash` incluso para la contraseña en claro del login:
  el backend lo espera así).
- **Avisos**: `ngx-toastr` (`ToastrService`) para lo nuevo — es lo que se está adoptando en
  citas. `AlertService` (SweetAlert2) sigue en las pantallas antiguas.
- **Estilos**: Bootstrap 5 por CDN en `index.html` + CSS por componente (presupuesto de
  4 kB por componente en producción: `angular.json:60-62`).
- **SSR/prerender** activo: no acceder a `window`, `document` ni a la cookie fuera del
  navegador sin comprobar la plataforma, o el prerender falla.
- **Animaciones de ruta**: `data.index` decide la dirección. Al añadir una ruta, darle un
  índice coherente con su posición en la barra.

## Commits

Mensajes cortos en español, en minúscula y en imperativo o infinitivo, como el historial
(`agregar toastr a clientes agendar cita`, `arreglar behavior en citas calendario`).
Terminan con la línea de coautoría cuando los hace Claude.
