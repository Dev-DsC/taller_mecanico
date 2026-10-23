# 01 — Estado actual

> **Lee antes:** [`00-contexto.md`](00-contexto.md) si no sabes qué es el producto.
> Medido contra el código el **2026-10-23** (rama `fase-00-credenciales-y-documentacion`,
> partiendo de `main` = `a65d99c`, que era `c60d5d8` antes de limpiar el historial). Si cambias algo de lo que aquí se describe, actualiza
> este archivo en el mismo commit.

## Estructura

```
taller_mecanico/
├── CLAUDE.md                 Entrada para Claude: reglas y lo que no se puede olvidar
├── docs/plan/                Esta documentación
├── Backend/                  API Express (CommonJS), desplegada en Render
│   ├── .env.example          Plantilla de variables (Backend/.env está ignorado)
│   └── src/
│       ├── index.js          Carga dotenv, luego la app, y escucha en PORT
│       ├── app.js            CORS, body parser (50 MB), manejador de errores, monta /api/users
│       ├── config/db.js      Pool de pg con DATABASE_URL y SSL
│       ├── config/connectionDB.js   ⚠️ Script suelto, nadie lo importa
│       ├── routes/user.router.js    El ÚNICO router: todas las rutas del API
│       ├── controllers/      Un archivo por entidad; validan poco y llaman al modelo
│       ├── models/           SQL parametrizado ($1…) o CALL a procedimientos
│       ├── middlewares/authMiddleware.js   Verifica el JWT (solo lo usa /profileUser)
│       └── services/email.service.js       Correo de verificación por Gmail (nodemailer)
└── ProyectoTW/               Angular 18 con NgModules, desplegado en Vercel
    ├── dist/                 ⚠️ Build versionado en git (`#/dist` comentado en .gitignore)
    ├── server.ts             SSR de Angular (prerender activo; Vercel sirve estático)
    └── src/
        ├── environments/     backendUrl: localhost:3000 (dev) / Render (prod)
        └── app/
            ├── app-routing.module.ts   Rutas y roles por ruta
            ├── auth/                   Login (AuthComponent), registro, AuthService (JWT en cookie)
            ├── guards/auth.guard.ts    Decodifica el JWT sin verificarlo y compara el rol
            ├── services/               Un servicio HTTP por entidad + AlertService (SweetAlert2)
            ├── pages/                  Pantallas (ver tabla)
            ├── components/             navbar (con el modal de registro), home, factura-form, factura-pdf
            ├── helpers/factura-html.helper.ts   HTML de la factura que html2pdf convierte en PDF
            ├── models/ e interface/    Tipos
```

## Endpoints

Todos bajo **`/api/users`** (`Backend/src/routes/user.router.js`). 🔓 = sin autenticación.
Hoy **solo `GET /profileUser` exige token**; el resto es 🔓 aunque la pantalla esté
protegida en Angular.

| Entidad | Método y ruta | Controlador | Notas |
|---|---|---|---|
| Auth | `POST /login` | `user.login` | Devuelve `{ ok, token }` (JWT 1 h con `userId`, `rol`) |
| Auth | `POST /enviar-verificacion` | `user.enviarVerificacionEmail` | Reenvía el correo. El frontend no lo usa |
| Auth | `GET /verificar-email/:token` | `user.verificarEmail` | Marca `email_verificado` y redirige a Vercel `/verificado` |
| Auth | `GET /profileUser` 🔒 | `user.profileUser` | Lee `email` del **cuerpo** de un GET y devuelve la fila entera, hash incluido |
| Usuarios | `POST /usuarios/crear` | `usuario.create` | Registro público **y** alta desde el panel. Acepta `rol` del cuerpo |
| Usuarios | `GET /usuarios`, `GET /usuarios/filtrar/:id` | `usuario.findAll/findById` | Sin `password_hash` |
| Usuarios | `PUT /usuarios/editar/:id`, `DELETE /usuarios/eliminar/:id` | `usuario.update/remove` | Borrar usuario borra sus filas de `clientes` |
| Clientes | `POST /cliente`, `GET /clientes`, `GET /cliente/filtrar/:id` | `cliente.*` | |
| Clientes | `PUT /cliente/:id`, `DELETE /cliente/:id`, `GET /clientes/filter` | `cliente.*` | `filter` siempre da 500 (ver fallos) |
| Inventario | `POST /inventario`, `GET /inventarios`, `GET /inventario/filtrar/:id` | `inventario.*` | `imagen` es base64 dentro de la fila |
| Inventario | `PUT /inventario/:id`, `DELETE /inventario/:id`, `GET /inventarios/filter?nombre=` | `inventario.*` | |
| Servicios | `GET /servicios`, `GET /servicios/:id`, `GET /servicio/:id` | `service_detalle.*` | Catálogo de servicios; las dos rutas por id son la misma |
| Servicio contratado | `POST /servicio-detalle`, `GET /servicio-detalles` | `service_detalle.*` | Un servicio + un repuesto + cantidad por fila; el trigger valida stock |
| Servicio contratado | `PUT /servicio-detalle/:id` | `service_detalle.updateFacturaId` | Nunca encuentra la fila (ver fallos) |
| Facturas | `GET /factura/filtrar/:id` | `factura.getOrCreateFacturaByDetalleId` | **Un GET que crea** la factura de un `detalle_id` si no existe |
| Facturas | `POST /factura`, `GET /facturas`, `GET /factura/:id` | `factura.*` | |
| Factura detalle | `POST /factura-detalle`, `GET /factura-detalles`, `GET /factura-detalles/:id` | `factura_detalle.*` | |
| Citas | `GET /cita`, `POST /cita`, `GET /cita/:id`, `PUT /cita/:id`, `DELETE /cita/eliminar/:id` | `cita.*` | `GET /cita` devuelve **las citas de todos** |

Forma de respuesta habitual: `{ ok, data }` / `{ ok, msg }`. Excepciones: `GET /usuarios`
devuelve el arreglo pelado; `POST /cita` devuelve la fila pelada.

## Pantallas (Angular)

| Ruta | Componente | Acceso (solo en el navegador) |
|---|---|---|
| `/servicios` (inicio), `/repuestos`, `/ubicacion`, `/acerca-de`, `/contactanos` | `pages/*` | Pública |
| `/register` | `AuthComponent` — es el **login**, pese al nombre | Pública |
| (modal de la barra) | `RegisterComponent` dentro de `navbar.component.html:161` | Pública |
| `/verificado` | `VerificacionExitosaComponent` | Pública (destino del enlace del correo) |
| `/agendar-cita-cliente` | `AgendarCitaClienteComponent` + calendario del cliente | Sin guard; el componente exige cookie |
| `/cita/agendar` | `AgendarCitaComponent` + calendario completo | admin, tecnico |
| `/cliente`, `/cliente/edit/:id` | `ClienteComponent`, `AddClienteComponent` | admin, tecnico |
| `/inventario` | `InventarioComponent` | admin |
| `/inventario/add`, `/inventario/add/:id` | `AddRespuestoComponent` | admin, tecnico |
| `/servicio-contratado` | `ServicioContratadoComponent` (genera y descarga facturas) | admin, tecnico |
| `/usuario`, `/usuario/add`, `/usuario/edit/:id` | `UsuarioComponent`, `AddUsuarioComponent` | admin |

`''` y `'**'` redirigen a `/servicios`. Cada ruta lleva `data.index` para la animación de
transición de `app.component.ts`.

## Flujos principales

- **Registro → verificación → login**: `POST /usuarios/crear` crea `usuarios` (y `clientes`
  si el rol es `cliente`), envía el correo con un JWT de 1 día; el enlace llama al API, que
  redirige a `/verificado`. `POST /login` exige `email_verificado`. El token se guarda en
  la cookie `token` (no HttpOnly) y el rol se lee decodificando el JWT en el navegador.
- **Servicio contratado → factura**: el personal registra `servicio_detalle` (CALL con
  trigger de stock). En `/servicio-contratado`, «previsualizar» o «descargar» llama a
  `GET /factura/filtrar/:detalle_id`, que crea la factura (número `FA-00001`…, IVA 12 %)
  si no existía, y el PDF se genera en el navegador con `html2pdf`.
- **Citas**: el cliente agenda en `/agendar-cita-cliente` (`usuario_id` sale del JWT
  decodificado en el navegador); el personal las ve y edita en el calendario de FullCalendar.

## Fallos conocidos (no arreglados)

Ordenados por zona. Los de seguridad están aparte en [`03-seguridad.md`](03-seguridad.md).
Cuando se arregle uno, **se borra de aquí** en el mismo commit.

### Backend

| Dónde | Qué pasa |
|---|---|
| `Backend/src/app.js:34-40` | El manejador de errores se registra **antes** de las rutas (`:43`): nunca atrapa nada |
| `Backend/src/controllers/cliente.controller.js:94` | `filterClientes` usa `InventarioModel`, que no está importado → siempre 500 |
| `Backend/src/controllers/inventario.controller.js:10` | `createInventario` no hace `await`: responde 201 antes de insertar y un fallo queda sin capturar |
| `Backend/src/controllers/service_detalle.controller.js:80` | Lee `req.params.detalle_id`, pero la ruta es `/:id` → siempre 404 |
| `Backend/src/controllers/user.controller.js:9-24` | `enviarVerificacionEmail` sin `try/catch`: un fallo del correo es un rechazo no manejado |
| `Backend/src/controllers/usuario.controller.js:39` | El correo se envía **después** de crear el usuario: si falla, responde 500, el usuario ya existe y no puede volver a registrarse (409) ni pedir otro correo desde la web |
| `Backend/src/models/cliente.model.js:7` | `crear` recibe `email` pero no lo pasa a `insertar_cliente` (3 argumentos) |
| `Backend/src/models/usuario.model.js:23-24` | Al registrarse un cliente se le **asocia una ficha existente** si coinciden nombre y teléfono |
| `Backend/src/models/factura.model.js:48-75` | El siguiente número de factura se calcula leyendo el último: dos facturas a la vez pueden salir con el mismo número |
| `Backend/src/controllers/factura.controller.js:6-84` | Crear factura + detalles + enlazar al servicio son consultas sueltas, sin transacción |
| `Backend/src/controllers/user.controller.js:41` y `services/email.service.js:21` | URLs de Vercel y Render escritas a mano |
| `Backend/src/app.js:13-22` | Orígenes de CORS escritos a mano |
| `Backend/src/config/connectionDB.js` | Código muerto que imprime clientes por consola |
| `Backend/package.json` | `bcrypt` y `bcryptjs` a la vez; solo se usa `bcrypt` |

### Frontend

| Dónde | Qué pasa |
|---|---|
| `ProyectoTW/src/app/services/usuario.service.ts:31` | `insertarUsuario` llama a `POST /api/users/crear`, que no existe → **el admin no puede crear usuarios** desde `/usuario/add` |
| `ProyectoTW/src/app/services/factura.service.ts:17` | `POST /facturas` no existe. Lo usa `FacturaFormComponent`, que no está en ninguna plantilla |
| `ProyectoTW/src/app/auth/auth.component.ts:35` | Tras el login navega a `/servicio` (no existe; acaba en `/servicios` por el comodín) y recarga la página |
| `ProyectoTW/src/app/components/shared/navbar/navbar.component.html:127` | Enlace a `/login`, que no existe |
| `ProyectoTW/src/app/auth/components/register.component.ts:86-88` | Navega a `/home` y luego a `' '` |
| `ProyectoTW/src/app/pages/cita/agendar-cita-cliente/agendar-cita-cliente.component.ts:107` | Espera `error.code === '23505'` de un `HttpErrorResponse`, que nunca lo trae: la cita duplicada sale como error genérico |
| IVA 12 %: `factura-form.component.ts:23,117`, `helpers/factura-html.helper.ts:59` | Y en el backend `factura.controller.js:37`. Ecuador: 15 % desde 2024-04-01 |
| `ProyectoTW/package.json` | `@angular/material` y `@angular/cdk` en 17 con el core en 18; `nodemailer` instalado en el frontend sin uso |
| `ProyectoTW/.gitignore:4` | `#/dist` comentado: cada build se sube a git |
| Pruebas | 32 `it`, todos los «should create» que genera la CLI. Ninguna prueba del backend |

### Producto (no son fallos, son huecos para venderlo)

- No existe **vehículo** (placa, marca, modelo, kilometraje): un servicio se asocia a un cliente.
- Un servicio contratado es **un servicio y un repuesto**: no hay orden de trabajo con varias líneas.
- `cantidad_minima` se guarda y se muestra, pero nada avisa cuando el stock la cruza.
- No hay estados de trabajo, presupuestos, pagos/abonos, reportes ni recordatorios.
- El contenido del taller (textos, fotos de sitios ajenos, WhatsApp, mapa) está en las plantillas.
