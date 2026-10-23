# 00 — Contexto del producto

> **Lee antes:** nada. Este es el punto de partida.

## Qué es

Una aplicación web para un taller mecánico con dos caras:

- **Pública**: páginas del taller (servicios, repuestos, ubicación, acerca de, contacto),
  registro de clientes y **agenda de citas** con calendario.
- **Interna** (personal del taller): clientes, inventario de repuestos, servicios
  contratados, facturas en PDF, usuarios y la agenda completa.

Nació como proyecto académico/a medida para **Taller Mecánico San Gabriel** (Ecuador;
WhatsApp y redes en `pages/contactanos`, mapa en `pages/ubicacion`). El nombre del taller
está escrito a mano en el frontend, en el correo de verificación y en la cabecera del PDF
de la factura.

## Quién lo usa — roles

| Rol | Qué hace | Dónde se decide |
|---|---|---|
| `cliente` | Se registra solo, verifica el correo, agenda citas y ve su calendario | `register.component.ts` fuerza `cliente`… **solo en el navegador** |
| `tecnico` | Agenda citas, clientes, servicios contratados, añade repuestos | `data.roles` en `app-routing.module.ts` |
| `admin` | Todo lo anterior más inventario y usuarios | Ídem |

🔴 Los roles **solo existen en el frontend**. El backend firma `{ userId, rol }` en el JWT
pero ninguna ruta lo comprueba. Ver [`03-seguridad.md`](03-seguridad.md).

## Objetivo: comercializarlo

El usuario quiere venderlo a otros talleres. Eso cambia el listón respecto a un proyecto
para un solo cliente:

1. **Seguro por defecto.** Datos de clientes de terceros → la Ley Orgánica de Protección
   de Datos Personales de Ecuador aplica. Hoy cualquiera puede leer o borrar todo.
2. **Configurable, no a medida.** Nombre, logo, contacto, servicios, IVA y textos salen de
   configuración, no del código.
3. **Legal en lo fiscal.** Si se llama «factura», tiene que poder ser un comprobante
   electrónico autorizado por el SRI, o llamarse de otra forma (orden de trabajo, proforma).
4. **Operable por alguien que no lo escribió**: esquema versionado, pruebas, despliegue
   documentado, copias de seguridad.
5. **Con funciones por las que un taller paga**: vehículos, órdenes de trabajo con estados,
   presupuestos aprobados por el cliente, recordatorios, reportes. Hoy no existe ni la
   entidad «vehículo».

La hoja de ruta que lleva de aquí a ahí está en [`04-hoja-de-ruta.md`](04-hoja-de-ruta.md).

## Decisiones abiertas (las toma el usuario)

Estas cambian el diseño de fases posteriores. No se implementa nada que dependa de ellas
sin preguntarlas:

| Decisión | Opciones | Afecta a |
|---|---|---|
| Modelo de despliegue | (a) una instancia por taller — simple, aislamiento total; (b) SaaS multi-taller con `taller_id` en cada tabla | Fase 5 |
| Facturación electrónica | (a) integrar directamente con el SRI (firma `.p12`, XML, clave de acceso); (b) usar un proveedor autorizado por API; (c) no facturar y emitir «orden de trabajo» | Fase 6 |
| Repositorio | Seguir público o pasarlo a privado (el código es el producto) | Fase 0 |
| Correo transaccional | Seguir con Gmail (límites diarios, riesgo de bloqueo) o un proveedor (Resend, SES…) con dominio propio | Fases 0 y 4 |
| Imágenes | Hoy en base64 dentro de la base y de sitios ajenos enlazados; mover a almacenamiento de objetos y usar imágenes propias | Fases 4 y 8 |
