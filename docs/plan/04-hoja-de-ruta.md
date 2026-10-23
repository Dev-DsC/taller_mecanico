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
contención  sistema lo roto esquema  marca     │                    ├──► F5 (multi-taller) ──► F9 (lanzamiento)
            interno         versionado blanca  └──► F7 (producto) ──┘
F8 (calidad y operación) avanza en paralelo desde F1: cada fase deja sus pruebas.
```

F1 fue primero porque **ninguna otra mejora tenía sentido con el API abierto**: se habría
vendido un producto al que cualquiera le borra los datos.

---

## Fase 0 — Contención de credenciales ✅ código · 🔴 pendiente del usuario

Ver [`fases/fase-00-credenciales-y-documentacion.md`](fases/fase-00-credenciales-y-documentacion.md).
Hecho: credenciales fuera del código y del historial de las ramas, `.env.example`,
`.gitignore`, esta documentación. Falta (solo puede hacerlo el usuario): revocar las dos
contraseñas de aplicación, pedir a GitHub que borre los PR #16–#20 y decidir si el
repositorio pasa a privado. (Desde la Fase 1 ya no hace falta una contraseña nueva de Gmail.)

## Fase 1 — Sistema interno con accesos cerrados ✅ código · 🔴 pendiente de desplegar

Ver [`fases/fase-01-sistema-interno.md`](fases/fase-01-sistema-interno.md). Solo el personal
tiene cuenta y el admin las crea. El backend exige sesión y rol en cada ruta, comprobado
por una prueba que recorre el router. La agenda pasa a las fichas de clientes. Se retiraron
el registro público, el rol `cliente` y el correo. Está en el PR #22. 🔴 Antes de fusionar:
que Vercel vuelva a desplegar (la web está congelada desde 2025-07-22, ver
[`06-operacion.md`](06-operacion.md#-la-web-de-producción-está-congelada-desde-2025-07-22)),
auditar las cuentas y ejecutar la migración 001, con permiso del usuario.

## Fase 2 — Corregir lo roto

**Objetivo**: que lo que existe funcione siempre, antes de añadir nada.

- Todos los fallos de backend y frontend de [`01-estado.md`](01-estado.md#fallos-conocidos-no-arreglados),
  empezando por los que afectan al uso diario: filtro de clientes, `createInventario` sin
  `await`, `updateFacturaId`, manejador de errores.
- Cambiar la contraseña propia desde el panel. Separar en `/usuario` las cuentas `cliente`
  antiguas (o borrarlas, si el usuario lo decide).
- Factura en **una transacción** y número de factura con **secuencia** de PostgreSQL.
- Validación de entrada en el servidor (un esquema por ruta).
- Respuestas uniformes `{ ok, data | msg }` en todas las rutas.
- Dependencias de Angular alineadas (Material/CDK 18) y, con eso, fuera `ProyectoTW/.npmrc`
  (`legacy-peer-deps`, puesto en el PR #22 para que Vercel pudiera instalar). Fuera
  `nodemailer` del frontend y `bcryptjs` del backend; `dist/` fuera de git.

**Hecho cuando**: la lista de fallos de `01-estado.md` está vacía o cada uno remanente
tiene su motivo escrito.

## Fase 3 — Base de datos versionada

**Objetivo**: poder crear una base nueva desde el repositorio, sin copiar la de producción.

- `pg_dump --schema-only` de producción → migración base en `Backend/db/migraciones/`, que
  ya existe con la 001 de la Fase 1 (la herramienta tiene que darla por aplicada).
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

Por orden de valor estimado; se confirma con el usuario antes de cada una. 🔒 El cliente
**no tiene cuenta** ([decisión](00-contexto.md#decisiones-tomadas)): todo lo que le llega va
sin contraseña, con enlaces únicos que caducan y límite de abusos.

1. **Vehículos** (placa, marca, modelo, año, km) e historial por vehículo.
2. **Orden de trabajo** con varias líneas de servicio y repuesto, técnico asignado y
   estados (recibido → diagnóstico → presupuestado → aprobado → en reparación → listo → entregado).
3. **Solicitud de cita desde la web**, sin cuenta: nombre, teléfono, placa, servicio y hueco
   preferido. El personal la confirma, y se convierte en cita de una ficha (nueva o existente).
4. **Enlace único por orden**: el cliente ve el presupuesto y lo aprueba, y sigue el estado de su carro.
5. **Avisos y recordatorios** de cita, de carro listo y de mantenimiento (WhatsApp/correo).
6. **Alertas de stock mínimo** (`cantidad_minima` ya existe) y movimientos de inventario.
7. **Pagos y abonos** por orden; cuentas por cobrar.
8. **Reportes**: ingresos por periodo, servicios más vendidos, productividad por técnico.
9. Fotos de recepción del vehículo.

## Fase 8 — Calidad y operación (continua)

- Pruebas: el backend ya tiene Jest + supertest (Fase 1: accesos, login, cuentas, citas).
  Faltan facturación y e2e de los flujos de cita y factura. Fuera las 26 «should create»
  vacías del frontend (hoy `npm test` ni compila).
- CI en GitHub Actions: build del frontend, pruebas del backend, búsqueda de secretos (gitleaks).
- Entorno de staging con su propia base.
- Registro de errores (Sentry o similar) y salud del API (`GET /health`).
- Render gratuito duerme el API: plan de pago o aviso de «despertando» en el frontend.

## Fase 9 — Lanzamiento comercial

- Términos de uso y política de privacidad (LOPDP): el taller es el responsable de los datos
  de sus clientes; consentimiento en la solicitud de cita, derecho de acceso y eliminación.
- Manual por rol (técnico, admin) y guía de alta de un taller.
- Landing de venta, precios, demo con datos ficticios, canal de soporte.
