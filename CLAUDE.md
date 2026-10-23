# Taller Mecánico — notas para Claude

**Sistema interno** para un taller mecánico: agenda de citas, fichas de clientes,
inventario de repuestos, servicios contratados y facturas en PDF, más una web pública
mínima. **Solo el personal tiene cuenta** (`admin`, `tecnico`); el cliente del taller no.
Hoy lo usa un solo taller (**Taller Mecánico San Gabriel**, Ecuador) y el objetivo es
**convertirlo en un producto comercializable** para otros talleres.

- **Backend**: Node.js + Express 4 + PostgreSQL (`pg`), CommonJS → [`Backend/`](Backend/)
- **Frontend**: Angular 18 con NgModules (no standalone), Bootstrap, Angular Material → [`ProyectoTW/`](ProyectoTW/)
- **Producción**: API en Render, web en Vercel, base PostgreSQL externa → [`docs/plan/06-operacion.md`](docs/plan/06-operacion.md)

📖 **La documentación está en [`docs/plan/`](docs/plan/README.md), partida por temas.**
Empieza por [`docs/plan/README.md`](docs/plan/README.md): es un índice que dice qué
archivo abrir según lo que vayas a hacer. **No leas todo**, y no explores el repositorio
antes de mirar [`docs/plan/01-estado.md`](docs/plan/01-estado.md), que tiene el mapa del
código, los endpoints y los fallos conocidos con su `archivo:línea`.

**Estado (2026-10-23):**
- **Fase 0** cerrada: credenciales fuera del repositorio e historial limpio.
- **Fase 1** (sistema interno, accesos cerrados) escrita y probada, en el PR #22, **sin
  fusionar**. Antes hay que conseguir que Vercel despliegue, auditar las cuentas y ejecutar
  la migración 001, esto último solo con permiso del usuario
  ([`fase-01`](docs/plan/fases/fase-01-sistema-interno.md#despliegue---en-este-orden-y-la-base-solo-con-permiso-del-usuario)).
- 🔴 **Pendiente del usuario**: revocar las dos contraseñas de aplicación de Gmail que
  estuvieron expuestas y pedir a GitHub que borre los PR #16–#20
  ([`fase-00`](docs/plan/fases/fase-00-credenciales-y-documentacion.md)).
- La siguiente es la **Fase 2 — corregir lo roto** ([`04-hoja-de-ruta.md`](docs/plan/04-hoja-de-ruta.md)).

## 🔴 Lo que no se puede olvidar

- **El repositorio es público** (`github.com/Dev-DsC/taller_mecanico`). Ningún secreto,
  correo personal, contraseña ni cadena de conexión se escribe en el código: todo va en
  `Backend/.env` (ignorado) y en las variables de Render. Plantilla: [`Backend/.env.example`](Backend/.env.example).
- **El historial se reescribió el 2026-10-23** para quitar dos contraseñas. Nunca se hace
  push desde un clon anterior a esa fecha, ni se restaura nada desde
  `taller_mecanico-backups/`: devolvería las contraseñas a GitHub.
- **La web de producción está congelada desde 2025-07-22** (`b190268`): en Vercel la
  instalación falla con `ERESOLVE` y además los despliegues salen bloqueados. Un PR en verde
  no significa que se haya publicado: hay que mirar que el despliegue quede `READY` en Vercel
  ([`06-operacion.md`](docs/plan/06-operacion.md#-la-web-de-producción-está-congelada-desde-2025-07-22)).
- **Toda ruta del API declara su acceso** en `Backend/src/routes/user.router.js`
  (`personal`, `soloAdmin` o `requiereAuth`); el rol se lee de `req.user`, que viene de la
  base, nunca del cuerpo. Las únicas públicas son el login y el catálogo de repuestos.
  `Backend/test/accesos.test.js` recorre el router y falla si una ruta nueva nace sin
  protección: una pública nueva se añade a `RUTAS_PUBLICAS` a propósito. Ver
  [`03-seguridad.md`](docs/plan/03-seguridad.md#reglas-para-no-reintroducir-lo-mismo).
- **Los clientes no tienen cuenta** (decisión del 2026-10-23,
  [`00-contexto.md`](docs/plan/00-contexto.md#decisiones-tomadas)). No se reintroduce
  registro público, rol `cliente` ni correo de verificación. Lo que necesite el cliente va sin
  contraseña (Fase 7). Las filas `rol = 'cliente'` que quedan en `usuarios` son de antes y
  no pueden entrar.
- **La cita es de una ficha de cliente** (`cita.cliente_id`), no de una cuenta.
  `cita.usuario_id` es heredado y no se escribe.
- **El esquema de la base no está en el repositorio**: tablas, vistas, procedimientos
  (`CALL insertar_cliente…`) y triggers viven solo en la base de producción. No inventes
  columnas: lo que se sabe está en [`02-modelo-datos.md`](docs/plan/02-modelo-datos.md).
  Los cambios van como SQL en `Backend/db/migraciones/` y **se ejecutan solo con permiso
  del usuario**: no hay base de desarrollo, la única es producción.
- **El IVA está fijo al 12 % en tres sitios**; en Ecuador es 15 % desde el 2024-04-01, y la
  "factura" no es un comprobante electrónico del SRI. Ver la Fase 6 de la hoja de ruta.
- **Todas las rutas del API cuelgan de `/api/users`**, también clientes, inventario y
  facturas (un solo router: `Backend/src/routes/user.router.js`).
- `index.js` carga `dotenv` **antes** de `require('./app')`: `db.js` lee `process.env` al
  importarse. No inviertas ese orden.

## Comandos

| Dónde | Comando | Qué hace |
|---|---|---|
| `Backend/` | `npm install` y `npm run dev` | API con nodemon en `:3000` (sin `Backend/.env` arranca igual, sin base) |
| `Backend/` | `npm test` | Jest + supertest con la base simulada: accesos, login, cuentas, citas, SQL |
| `Backend/` | `npm start` | API sin recarga (lo que ejecuta Render) |
| `ProyectoTW/` | `npm ci --legacy-peer-deps` y `npm start` | Angular en `:4200`, apunta a `http://localhost:3000` |
| `ProyectoTW/` | `npx ng build --output-path ../../build-tmp` | Build de verificación **fuera del repo** (`dist/` está versionado; no ensuciarlo) |
| `ProyectoTW/` | `npm test` | Karma + Jasmine: hoy **no compila** (`auth.guard.spec.ts`), Fase 2 |

`.claude/launch.json` tiene `api` y `web` para la vista previa. El backend no tiene linter:
`node --check <archivo>` es la verificación mínima de sintaxis.

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
