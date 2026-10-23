# 04 — Hoja de ruta para comercializarlo

> **Lee antes:** [`00-contexto.md`](00-contexto.md) (objetivo y decisiones abiertas) y
> [`01-estado.md`](01-estado.md) (lo que existe). Para la Fase 1, también
> [`03-seguridad.md`](03-seguridad.md).

Cada fase se hace en su rama `fase-NN-nombre`, termina con su archivo en
[`fases/`](fases/) y con `01-estado.md` al día. **Antes de empezar una, se vuelve a medir
contra el código**: este plan se escribió el 2026-10-23 y parte puede estar resuelto.
Las fases que dependen de una decisión abierta no empiezan sin esa respuesta.

## Orden

```
F0 ──► F1 ──► F2 ──► F3 ──► F4 ──┬──► F6 (fiscal) ──┐
contención  API    lo roto  esquema  marca     │                    ├──► F5 (multi-taller) ──► F9 (lanzamiento)
            cerrado         versionado blanca  └──► F7 (producto) ──┘
F8 (calidad y operación) avanza en paralelo desde F1: cada fase deja sus pruebas.
```

F1 va primero porque **ninguna otra mejora tiene sentido con el API abierto**: se podría
vender un producto al que cualquiera le borra los datos.

---

## Fase 0 — Contención de credenciales ✅ código · 🔴 pendiente del usuario

Ver [`fases/fase-00-credenciales-y-documentacion.md`](fases/fase-00-credenciales-y-documentacion.md).
Hecho: credenciales fuera del código, `.env.example`, `.gitignore`, esta documentación.
Falta (solo puede hacerlo el usuario): revocar las dos contraseñas de aplicación, cargar
las variables nuevas en Render y decidir si el repositorio pasa a privado.

## Fase 1 — Cerrar el API

**Objetivo**: que el backend, y no el navegador, decida quién puede hacer qué.

- `authMiddleware` en todas las rutas salvo las públicas declaradas: `login`, registro,
  `verificar-email`, `enviar-verificacion`, `GET /servicios`.
- Middleware de rol (`requiereRol`) con la misma matriz que `app-routing.module.ts`.
- El registro público crea siempre `cliente`; alta de personal en una ruta solo para admin.
- `PUT /usuarios/editar/:id`: solo admin, o el propio usuario sin tocar `rol`.
- Citas: el cliente lee y crea solo las suyas (`usuario_id` del token, no del cuerpo).
- `/profileUser` desde `req.user`, sin `password_hash`.
- Interceptor HTTP en Angular que envíe `Authorization: Bearer`, y que ante un 401 limpie la
  sesión y lleve al login.
- Tokens de verificación con secreto o `audience` propio; mensaje de login único;
  `express-rate-limit` en login, registro y reenvío; `helmet`; límite de cuerpo razonable.

**Hecho cuando**: con `curl` y sin token, cada ruta privada responde 401; con token de
`cliente`, las del personal responden 403; registrarse con `"rol":"admin"` crea un
`cliente`. Pruebas automáticas (supertest) que lo comprueban, en verde.

⚠️ Romperá el frontend en producción si se despliega el backend sin el interceptor: van
**en el mismo despliegue**.

## Fase 2 — Corregir lo roto

**Objetivo**: que lo que existe funcione siempre, antes de añadir nada.

- Todos los fallos de backend y frontend de [`01-estado.md`](01-estado.md#fallos-conocidos-no-arreglados),
  empezando por los que afectan al uso diario: alta de usuarios desde el panel, filtro de
  clientes, `createInventario` sin `await`, `updateFacturaId`, manejador de errores.
- Registro que no deja usuarios huérfanos si falla el correo, y pantalla para pedir otro.
- Factura en **una transacción** y número de factura con **secuencia** de PostgreSQL.
- Validación de entrada en el servidor (un esquema por ruta).
- Respuestas uniformes `{ ok, data | msg }` en todas las rutas.
- Dependencias de Angular alineadas (Material/CDK 18), fuera `nodemailer` del frontend y
  `bcryptjs` del backend; `dist/` fuera de git.

**Hecho cuando**: la lista de fallos de `01-estado.md` está vacía o cada uno remanente
tiene su motivo escrito.

## Fase 3 — Base de datos versionada

**Objetivo**: poder crear una base nueva desde el repositorio, sin copiar la de producción.

- `pg_dump --schema-only` de producción → primera migración (`Backend/db/migrations/`).
- Herramienta de migraciones (p. ej. `node-pg-migrate`) y `npm run db:migrate`.
- Seeds mínimos: servicios de ejemplo y un admin inicial creado por script, nunca con
  contraseña fija.
- Documentar los procedimientos y triggers en `02-modelo-datos.md` con su lógica real.
- Copias de seguridad automáticas y una restauración probada.

**Requiere del usuario**: acceso de lectura al esquema de la base de producción.

## Fase 4 — Marca blanca y configuración

**Objetivo**: que instalarlo para otro taller sea configurar, no programar.

- Tabla `configuracion_taller` (nombre, logo, RUC, dirección, teléfono, WhatsApp, redes,
  mapa, horario, moneda, % de IVA) y una pantalla de admin para editarla.
- Las páginas públicas, el correo y la cabecera del PDF leen de ahí.
- URLs a variables: `API_PUBLIC_URL`, `FRONTEND_URL`, `CORS_ORIGINS`.
- Imágenes propias o con licencia en lugar de las enlazadas de sitios ajenos
  (`servicios.component.html`, `acerca-de.component.html`, `index.html`).
- Correo con un proveedor transaccional y dominio propio (decisión abierta).

## Fase 5 — Varios talleres

**Depende de**: decisión «modelo de despliegue» de [`00-contexto.md`](00-contexto.md#decisiones-abiertas-las-toma-el-usuario).

- (a) **Instancia por taller**: plantilla de despliegue (Render + Vercel + base), script de
  alta y guía. Menos código, más operación.
- (b) **SaaS**: `taller_id` en cada tabla, filtrado obligatorio en un único punto del
  backend (no en cada consulta), registro de talleres, planes y cobro de la suscripción.

## Fase 6 — Facturación con validez en Ecuador

**Depende de**: decisión «facturación electrónica».

- IVA desde configuración (15 % hoy), con tarifa por línea (0 %, 15 %, …) y redondeo correcto.
- Datos del comprador (cédula/RUC, razón social) y del emisor (RUC, establecimiento, punto de emisión).
- Comprobante electrónico autorizado por el SRI (directo o por proveedor) y su RIDE en PDF;
  o, si se decide no facturar, renombrar en toda la interfaz a «orden de trabajo».
- 🔒 Facturas inmutables: se anulan con nota de crédito, nunca se editan ni borran.

## Fase 7 — Funciones que un taller paga

Por orden de valor estimado; se confirma con el usuario antes de cada una:

1. **Vehículos** (placa, marca, modelo, año, km) e historial por vehículo.
2. **Orden de trabajo** con varias líneas de servicio y repuesto, técnico asignado y
   estados (recibido → diagnóstico → presupuestado → aprobado → en reparación → listo → entregado).
3. **Presupuesto** que el cliente aprueba desde un enlace.
4. **Recordatorios** de cita y de mantenimiento (correo/WhatsApp).
5. **Alertas de stock mínimo** (`cantidad_minima` ya existe) y movimientos de inventario.
6. **Pagos y abonos** por orden; cuentas por cobrar.
7. **Reportes**: ingresos por periodo, servicios más vendidos, productividad por técnico.
8. Fotos de recepción del vehículo.

## Fase 8 — Calidad y operación (continua)

- Pruebas: supertest para auth/roles y facturación en el backend; e2e de los flujos de
  registro, cita y factura. Fuera las 27 «should create» vacías.
- CI en GitHub Actions: build del frontend, pruebas del backend, búsqueda de secretos (gitleaks).
- Entorno de staging con su propia base.
- Registro de errores (Sentry o similar) y salud del API (`GET /health`).
- Render gratuito duerme el API: plan de pago o aviso de «despertando» en el frontend.

## Fase 9 — Lanzamiento comercial

- Términos de uso y política de privacidad (LOPDP): consentimiento en el registro,
  derecho de acceso y eliminación de datos.
- Manual por rol (cliente, técnico, admin) y guía de alta de un taller.
- Landing de venta, precios, demo con datos ficticios, canal de soporte.
