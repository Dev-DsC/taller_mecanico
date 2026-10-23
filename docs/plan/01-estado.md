# 01 — Estado actual

> **Lee antes:** [`00-contexto.md`](00-contexto.md) si no sabes qué es el producto.
> Medido contra el código el **2026-10-23**, al cerrar la Fase 1 (rama
> `fase-01-sistema-interno`). Si cambias algo de lo que aquí se describe, actualiza este
> archivo en el mismo commit.

## Estructura

```
taller_mecanico/
├── CLAUDE.md                 Entrada para Claude: reglas y lo que no se puede olvidar
├── docs/plan/                Esta documentación
├── .claude/launch.json       API (:3000) y web (:4200) para la vista previa de Claude
├── Backend/                  API Express (CommonJS), desplegada en Render
│   ├── .env.example          Plantilla de variables (Backend/.env está ignorado)
│   ├── db/migraciones/       SQL versionado: 001 (citas por ficha de cliente) + su revisión previa
│   ├── test/                 Jest + supertest, con la base simulada (npm test)
│   └── src/
│       ├── index.js          Carga dotenv, luego la app, y escucha en PORT
│       ├── app.js            trust proxy, helmet, CORS, límites de cuerpo, manejador de errores, monta /api/users
│       ├── config/db.js      Pool de pg con DATABASE_URL y SSL
│       ├── config/roles.js   ROLES_PERSONAL (admin, tecnico) y longitud mínima de contraseña
│       ├── config/connectionDB.js   ⚠️ Script suelto, nadie lo importa
│       ├── routes/user.router.js    El ÚNICO router: todas las rutas y su acceso
│       ├── middlewares/authMiddleware.js   requiereAuth (JWT + relee la cuenta) y requiereRol
│       ├── controllers/      Un archivo por entidad; validan poco y llaman al modelo
│       └── models/           SQL parametrizado ($1…) o CALL a procedimientos
└── ProyectoTW/               Angular 18 con NgModules, desplegado en Vercel
    ├── dist/                 ⚠️ Build versionado en git (`#/dist` comentado en .gitignore)
    ├── server.ts             SSR de Angular (prerender activo; Vercel sirve estático)
    └── src/
        ├── environments/     backendUrl: localhost:3000 (dev) / Render (prod)
        └── app/
            ├── app-routing.module.ts   Rutas, roles por ruta y redirecciones de URLs retiradas
            ├── auth/                   Login (AuthComponent) y AuthService (JWT en cookie)
            ├── interceptors/auth.interceptor.ts   Manda el token al API; ante un 401 cierra sesión
            ├── guards/auth.guard.ts    Esconde pantallas según el rol del JWT (no lo verifica: eso lo hace el API)
            ├── services/               Un servicio HTTP por entidad + AlertService (SweetAlert2)
            ├── pages/                  Pantallas (ver tabla)
            ├── components/             navbar (con el modal de login), home, factura-form, factura-pdf
            ├── helpers/factura-html.helper.ts   HTML de la factura que html2pdf convierte en PDF
            ├── models/ e interface/    Tipos
```

## Endpoints

Todos bajo **`/api/users`** (`Backend/src/routes/user.router.js`). Acceso:
🌐 pública · 👤 cualquier empleado · **S** `admin` y `tecnico` · **A** solo `admin`.
Sin sesión ⇒ 401; con sesión sin el rol ⇒ 403. `test/accesos.test.js` lo comprueba ruta a
ruta leyendo el router.

| Entidad | Método y ruta | Acceso | Notas |
|---|---|---|---|
| Auth | `POST /login` | 🌐 | `{ ok, token }` (JWT 1 h con `userId`, `rol`). Solo entra el personal. 10 fallos/15 min por IP ⇒ 429 |
| Auth | `GET /profileUser` | 👤 | La cuenta de la sesión, sin `password_hash` |
| Catálogo | `GET /catalogo/repuestos` | 🌐 | Nombre, descripción, `costo_unitario` (es el precio de venta) e imagen. Sin stock |
| Usuarios | `GET /usuarios`, `GET /usuarios/filtrar/:id` | A | Sin `password_hash`. Lista también las cuentas `cliente` antiguas |
| Usuarios | `POST /usuarios/crear` | A | Solo roles `admin`/`tecnico`, contraseña ≥ 8; nace verificada |
| Usuarios | `PUT /usuarios/editar/:id` | A | Contraseña nueva opcional (restablecer). No se puede cambiar el propio rol |
| Usuarios | `DELETE /usuarios/eliminar/:id` | A | No a uno mismo. Desvincula fichas y citas, no las borra |
| Clientes | `POST /cliente`, `GET /clientes`, `GET /cliente/filtrar/:id`, `PUT /cliente/:id`, `DELETE /cliente/:id` | S | |
| Clientes | `GET /clientes/filter` | S | Siempre da 500 (ver fallos) |
| Inventario | `GET /inventarios`, `GET /inventario/filtrar/:id`, `GET /inventarios/filter?nombre=`, `POST /inventario`, `PUT /inventario/:id` | S | `imagen` es base64 dentro de la fila (hasta 10 MB de cuerpo) |
| Inventario | `DELETE /inventario/:id` | A | |
| Servicios | `GET /servicios`, `GET /servicios/:id`, `GET /servicio/:id` | S | Catálogo de servicios; las dos rutas por id son la misma |
| Servicio contratado | `POST /servicio-detalle`, `GET /servicio-detalles` | S | Un servicio + un repuesto + cantidad por fila; el trigger valida stock |
| Servicio contratado | `PUT /servicio-detalle/:id` | S | Nunca encuentra la fila (ver fallos) |
| Facturas | `GET /factura/filtrar/:id` | S | **Un GET que crea** la factura de un `detalle_id` si no existe |
| Facturas | `POST /factura`, `GET /facturas`, `GET /factura/:id` | S | |
| Factura detalle | `POST /factura-detalle`, `GET /factura-detalles`, `GET /factura-detalles/:id` | S | |
| Citas | `GET /cita`, `POST /cita`, `GET /cita/:id`, `PUT /cita/:id`, `DELETE /cita/eliminar/:id` | S | Por ficha de cliente (`cliente_id`); crear exige cliente, servicio, fecha y hora |

Forma de respuesta habitual: `{ ok, data }` / `{ ok, msg }`. Excepciones: `GET /usuarios`
devuelve el arreglo pelado; `POST /cita` devuelve la fila pelada.

## Pantallas (Angular)

| Ruta | Componente | Acceso |
|---|---|---|
| `/servicios` (inicio), `/repuestos`, `/ubicacion`, `/acerca-de`, `/contactanos` | `pages/*` | Pública |
| `/register` | `AuthComponent` — es el **login**, pese al nombre (también va en un modal de la barra) | Pública |
| `/agendar-cita-cliente`, `/verificado` | — | Redirigen a `/contactanos` y `/servicios` (URLs de cuando los clientes tenían cuenta) |
| `/cita/agendar` | `AgendarCitaComponent` + calendario | admin, tecnico (destino tras el login) |
| `/cliente`, `/cliente/edit/:id` | `ClienteComponent`, `AddClienteComponent` | admin, tecnico |
| `/inventario` | `InventarioComponent` | admin |
| `/inventario/add`, `/inventario/add/:id` | `AddRespuestoComponent` | admin, tecnico |
| `/servicio-contratado` | `ServicioContratadoComponent` (genera y descarga facturas) | admin, tecnico |
| `/usuario`, `/usuario/add`, `/usuario/edit/:id` | `UsuarioComponent`, `AddUsuarioComponent` | admin |

`''` y `'**'` redirigen a `/servicios`. Cada ruta lleva `data.index` para la animación de
transición de `app.component.ts`.

## Flujos principales

- **Cuentas del personal**: el admin las crea en `/usuario/add` con contraseña; no hay
  registro público ni correo. Si alguien olvida su contraseña, el admin le pone otra al
  editarlo. El token se guarda en la cookie `token` (1 h, `SameSite=Strict`) y el
  interceptor lo manda en `Authorization`.
- **Citas**: el personal agenda en `/cita/agendar` eligiendo una **ficha de cliente** (también
  las de clientes de mostrador) y las ve y edita en el calendario. El cliente pide cita por
  WhatsApp.
- **Servicio contratado → factura**: el personal registra `servicio_detalle` (CALL con
  trigger de stock). En `/servicio-contratado`, «previsualizar» o «descargar» llama a
  `GET /factura/filtrar/:detalle_id`, que crea la factura (número `FA-00001`…, IVA 12 %)
  si no existía, y el PDF se genera en el navegador con `html2pdf`.

## Fallos conocidos (no arreglados)

Ordenados por zona. Los de seguridad están aparte en [`03-seguridad.md`](03-seguridad.md).
Cuando se arregle uno, **se borra de aquí** en el mismo commit.

### Backend

| Dónde | Qué pasa |
|---|---|
| `Backend/src/app.js:40-46` | El manejador de errores se registra **antes** de las rutas (`:49`): nunca atrapa nada |
| `Backend/src/controllers/cliente.controller.js:94` | `filterClientes` usa `InventarioModel`, que no está importado → siempre 500 |
| `Backend/src/controllers/inventario.controller.js:10` | `createInventario` no hace `await`: responde 201 antes de insertar y un fallo queda sin capturar |
| `Backend/src/controllers/service_detalle.controller.js:80` | Lee `req.params.detalle_id`, pero la ruta es `/:id` → siempre 404 |
| `Backend/src/models/cliente.model.js:7` | `crear` recibe `email` pero no lo pasa a `insertar_cliente` (3 argumentos) |
| `Backend/src/models/factura.model.js:48-75` | El siguiente número de factura se calcula leyendo el último: dos facturas a la vez pueden salir con el mismo número |
| `Backend/src/controllers/factura.controller.js:6-84` | Crear factura + detalles + enlazar al servicio son consultas sueltas, sin transacción |
| `Backend/src/app.js:19-28` | Orígenes de CORS escritos a mano |
| `Backend/src/config/connectionDB.js` | Código muerto que imprime clientes por consola |
| `Backend/package.json` | `bcrypt` y `bcryptjs` a la vez; solo se usa `bcrypt` |
| Cuentas | El personal no puede cambiar su propia contraseña, solo el admin ponérsela |

### Frontend

| Dónde | Qué pasa |
|---|---|
| `ProyectoTW/src/app/services/factura.service.ts:17` | `POST /facturas` no existe. Lo usa `FacturaFormComponent`, que no está en ninguna plantilla |
| `ProyectoTW/src/app/components/shared/navbar/navbar.component.html:118` | El botón «Iniciar sesión» lleva `routerLink="/login"`, que no existe: además de abrir el modal, navega a `/servicios` |
| IVA 12 %: `factura-form.component.ts:23,117`, `helpers/factura-html.helper.ts:59` | Y en el backend `factura.controller.js:37`. Ecuador: 15 % desde 2024-04-01 |
| `ProyectoTW/package.json` | `@angular/material` y `@angular/cdk` en 17 con el core en 18: `ProyectoTW/.npmrc` pone `legacy-peer-deps` para poder instalar (en Vercel la instalación fallaba desde 2025-07-23) ([`06-operacion.md`](06-operacion.md#-la-web-de-producción-está-congelada-desde-2025-07-22)). `nodemailer` instalado sin uso |
| `ProyectoTW/.gitignore:4` | `#/dist` comentado: cada build se sube a git |
| `ng build` | Aviso (no error): el bundle inicial pasa 143 kB del presupuesto de 2 MB |
| Pruebas | 26 `it`, todos los «should create» de la CLI. `auth.guard.spec.ts` importa `authGuard`, que no existe: **`npm test` no compila** |

### Producto (no son fallos, son huecos para venderlo)

- No existe **vehículo** (placa, marca, modelo, kilometraje): un servicio se asocia a un cliente.
- Un servicio contratado es **un servicio y un repuesto**: no hay orden de trabajo con varias líneas.
- `cantidad_minima` se guarda y se muestra, pero nada avisa cuando el stock la cruza.
- No hay estados de trabajo, presupuestos, pagos/abonos, reportes ni recordatorios.
- El cliente no puede pedir cita desde la web (solo por WhatsApp) ni recibir avisos.
- El contenido del taller (textos, fotos de sitios ajenos, WhatsApp, mapa) está en las plantillas.
