# Taller Mecánico — notas para Claude

Sistema de gestión para un taller mecánico: web pública del taller, agenda de citas,
clientes, inventario de repuestos, servicios contratados y facturas en PDF. Hoy lo usa
un solo taller (**Taller Mecánico San Gabriel**, Ecuador) y el objetivo es
**convertirlo en un producto comercializable** para otros talleres.

- **Backend**: Node.js + Express 4 + PostgreSQL (`pg`), CommonJS → [`Backend/`](Backend/)
- **Frontend**: Angular 18 con NgModules (no standalone), Bootstrap, Angular Material → [`ProyectoTW/`](ProyectoTW/)
- **Producción**: API en Render, web en Vercel, base PostgreSQL externa → [`docs/plan/06-operacion.md`](docs/plan/06-operacion.md)

📖 **La documentación está en [`docs/plan/`](docs/plan/README.md), partida por temas.**
Empieza por [`docs/plan/README.md`](docs/plan/README.md): es un índice que dice qué
archivo abrir según lo que vayas a hacer. **No leas todo**, y no explores el repositorio
antes de mirar [`docs/plan/01-estado.md`](docs/plan/01-estado.md), que tiene el mapa del
código, los endpoints y los fallos conocidos con su `archivo:línea`.

**Estado (2026-10-23):** Fase 0 cerrada en código (credenciales fuera del repo,
documentación). 🔴 **Pendiente del usuario**: revocar las dos contraseñas de aplicación
de Gmail que siguen en el historial público y poner `EMAIL_USER`/`EMAIL_PASS` en Render
([`fase-00`](docs/plan/fases/fase-00-credenciales-y-documentacion.md)). La siguiente es la
**Fase 1 — cerrar el API** ([`04-hoja-de-ruta.md`](docs/plan/04-hoja-de-ruta.md)).

## 🔴 Lo que no se puede olvidar

- **El repositorio es público** (`github.com/Dev-DsC/taller_mecanico`). Ningún secreto,
  correo personal, contraseña ni cadena de conexión se escribe en el código: todo va en
  `Backend/.env` (ignorado) y en las variables de Render. Plantilla: [`Backend/.env.example`](Backend/.env.example).
- **El API no tiene autenticación real**: solo `/profileUser` pasa por `authMiddleware`, y
  el frontend nunca envía el token. Los roles solo se comprueban en el `AuthGuard` de
  Angular. Hasta que se cierre la Fase 1, **cualquier endpoint es público**. Ver
  [`03-seguridad.md`](docs/plan/03-seguridad.md).
- **El esquema de la base no está en el repositorio**: tablas, vistas, procedimientos
  (`CALL insertar_cliente…`) y triggers viven solo en la base de producción. No inventes
  columnas: lo que se sabe está en [`02-modelo-datos.md`](docs/plan/02-modelo-datos.md).
- **El IVA está fijo al 12 % en tres sitios**; en Ecuador es 15 % desde el 2024-04-01, y la
  "factura" no es un comprobante electrónico del SRI. Ver la Fase 6 de la hoja de ruta.
- **Todas las rutas del API cuelgan de `/api/users`**, también clientes, inventario y
  facturas (un solo router: `Backend/src/routes/user.router.js`).
- `index.js` carga `dotenv` **antes** de `require('./app')`: `db.js` y `email.service.js`
  leen `process.env` al importarse. No inviertas ese orden.

## Comandos

| Dónde | Comando | Qué hace |
|---|---|---|
| `Backend/` | `npm install` y `npm run dev` | API con nodemon en `:3000` (necesita `Backend/.env`) |
| `Backend/` | `npm start` | API sin recarga (lo que ejecuta Render) |
| `ProyectoTW/` | `npm install` y `npm start` | Angular en `:4200`, apunta a `http://localhost:3000` |
| `ProyectoTW/` | `npm run build` | Build de producción a `dist/spa/` con `environment.prod.ts` (API de Render) |
| `ProyectoTW/` | `npm test` | Karma + Jasmine (solo pruebas «should create» de plantilla) |

El backend no tiene pruebas ni linter. `node --check <archivo>` es la verificación mínima
de sintaxis.

## Cómo se trabaja aquí

Las reglas de código (forma de las respuestas, controlador → modelo, nombres en español)
están en [`docs/plan/05-convenciones.md`](docs/plan/05-convenciones.md). Las de proceso:

1. **Diagnóstico y plan antes de cambiar.** Ante un fallo: causa con `archivo:línea` y
   esperar aprobación. Ante una funcionalidad: preguntas de diseño y plan, luego código.
   Cambiar solo lo necesario; lo demás que aparezca se anota en `01-estado.md`.
2. **Antes de arreglar algo, comprobar que no esté ya resuelto** en el código actual y en
   el historial reciente: producción puede ir por detrás de `main`.
3. **Una rama por fase** (`fase-NN-nombre`), nunca trabajo directo en `main`. Commits
   separados por efecto: lo que cambia comportamiento va solo. `git add` con rutas
   explícitas. **No hacer `push` sin que lo pida el usuario.**
4. **No imprimir secretos** al diagnosticar, aunque haya que leer `Backend/.env`: se
   compara por longitud o por el inicio de su SHA-256.
5. **Hablar siempre en español** con el usuario. Código, comandos y errores citados quedan
   en su idioma original.

### 🔒 Regla de documentación — aplica a todo trabajo en este repositorio

**Al terminar una fase o un bloque de trabajo, se actualiza el archivo de esa fase en
`docs/plan/fases/` y `docs/plan/01-estado.md`.** No se crea un documento nuevo por cada
tarea ni se deja crecer uno sin límite. Existe porque quien retome esto llega sin
contexto: un documento de 600 líneas no se lee, y se acaba explorando todo el código y
repitiendo decisiones ya tomadas.

1. **Un hecho vive en un solo archivo**; los demás enlazan.
2. **Cada archivo de fase declara arriba qué leer antes.** Esa lista es el contrato.
3. **Se escribe el *porqué*, no el *qué*.** Lo que hace el código se lee en el código.
4. **Lo aprendido al implementar pesa más que lo planeado**: se anota en la fase donde
   apareció y se enlaza desde la que lo va a sufrir.
5. **Si un archivo pasa de ~250 líneas, se parte.**
6. **Lo que deja de ser cierto se borra.** El historial está en git.
7. Un fallo de `01-estado.md` que se arregla **se quita de esa lista** en el mismo commit.
