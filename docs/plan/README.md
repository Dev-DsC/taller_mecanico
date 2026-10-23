# Taller Mecánico — índice de documentación

**Empieza siempre por aquí.** Este índice existe para que no tengas que leer todo ni
explorar el repositorio entero antes de trabajar: dice qué archivo abrir según lo que
vayas a hacer, y nada más. Las reglas para mantener estos documentos están en
[`CLAUDE.md`](../../CLAUDE.md#-regla-de-documentación--aplica-a-todo-trabajo-en-este-repositorio).

## Qué leer según lo que vayas a hacer

| Si vas a… | Lee | Y ten presente |
|---|---|---|
| Retomar el trabajo sin contexto | [`01-estado.md`](01-estado.md) | Mapa del código, endpoints, pantallas y la lista de fallos conocidos con `archivo:línea` |
| Elegir o empezar la siguiente fase | [`04-hoja-de-ruta.md`](04-hoja-de-ruta.md) | Las fases para comercializar, su orden y su criterio de «hecho». 🔴 La Fase 1 (cerrar el API) va antes que cualquier funcionalidad |
| Entender qué es el producto y para quién | [`00-contexto.md`](00-contexto.md) | El cliente actual, el objetivo comercial y las decisiones que todavía no se han tomado |
| Tocar la base de datos, un modelo o una consulta | [`02-modelo-datos.md`](02-modelo-datos.md) | 🔴 El esquema **no está versionado**: tablas, vistas, procedimientos y triggers viven solo en la base de producción |
| Tocar login, registro, roles, tokens o permisos | [`03-seguridad.md`](03-seguridad.md) | 🔴 El API no exige token en casi ninguna ruta y el registro acepta `rol` del cliente |
| Tocar facturas, el IVA o el PDF | [`02-modelo-datos.md`](02-modelo-datos.md#facturación) + Fase 6 de [`04-hoja-de-ruta.md`](04-hoja-de-ruta.md#fase-6--facturación-con-validez-en-ecuador) | 🔴 IVA fijo al 12 % en tres sitios; Ecuador cobra 15 % desde 2024-04-01. No es un comprobante del SRI |
| Escribir código en este repositorio | [`05-convenciones.md`](05-convenciones.md) | Forma de las respuestas `{ ok, data, msg }`, controlador → modelo, nombres en español |
| Levantarlo en local, desplegar o tocar variables de entorno | [`06-operacion.md`](06-operacion.md) | `dotenv` se carga antes que la app. Las credenciales se rotan desde ahí |
| Tocar el envío de correos o las credenciales | [`fases/fase-00-credenciales-y-documentacion.md`](fases/fase-00-credenciales-y-documentacion.md) | 🔴 Hay dos contraseñas de aplicación de Gmail en el historial público: revocadas o no, nunca vuelven al código |

## Archivos

| Archivo | Contenido |
|---|---|
| [`00-contexto.md`](00-contexto.md) | Qué es, quién lo usa, objetivo comercial, decisiones abiertas |
| [`01-estado.md`](01-estado.md) | Lo que existe hoy: estructura, endpoints, pantallas, roles, fallos conocidos |
| [`02-modelo-datos.md`](02-modelo-datos.md) | Tablas, vistas y procedimientos inferidos del código, y cómo versionarlos |
| [`03-seguridad.md`](03-seguridad.md) | Auditoría por severidad, con `archivo:línea` y la corrección propuesta |
| [`04-hoja-de-ruta.md`](04-hoja-de-ruta.md) | Fases 0 a 9 para llevarlo a producto vendible |
| [`05-convenciones.md`](05-convenciones.md) | Cómo está escrito el código y cómo seguir escribiéndolo |
| [`06-operacion.md`](06-operacion.md) | Local, despliegue, variables de entorno, rotación de credenciales |
| [`fases/`](fases/) | Un archivo por fase **cerrada**: qué se hizo, por qué, y qué aprendimos |
