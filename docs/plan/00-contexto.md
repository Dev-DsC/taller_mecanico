# 00 — Contexto del producto

> **Lee antes:** nada. Este es el punto de partida.

## Qué es

Un **sistema interno para un taller mecánico**, con una web pública mínima:

- **Interna** (solo el personal, con cuenta): agenda de citas, fichas de clientes,
  inventario de repuestos, servicios contratados, facturas en PDF y usuarios.
- **Pública** (sin cuenta): páginas del taller (servicios, catálogo de repuestos, ubicación,
  acerca de, contacto con WhatsApp).

Nació como proyecto académico para **Taller Mecánico San Gabriel** (Ecuador). El WhatsApp y
las redes están en `pages/contactanos` y el mapa en `pages/ubicacion`. El nombre del taller
está escrito a mano en el frontend y en la cabecera del PDF de la factura.

## Quién lo usa — roles

| Rol | Qué hace |
|---|---|
| `admin` (el dueño) | Todo: además de lo del técnico, inventario completo (borrar) y las cuentas del personal |
| `tecnico` | Agenda, fichas de clientes, servicios contratados y facturas; añade y edita repuestos |
| Cliente del taller | **No tiene cuenta.** Ve la web pública y pide cita por WhatsApp. Su ficha la lleva el personal |

Los roles los comprueba **el backend** en cada ruta (`routes/user.router.js`); el `AuthGuard`
de Angular solo esconde pantallas. Quedan en la base cuentas con rol `cliente` de cuando
había registro público: no pueden entrar
([Fase 1](fases/fase-01-sistema-interno.md#decisiones)).

## Objetivo: comercializarlo

El usuario quiere venderlo a otros talleres. Eso cambia el listón respecto a un proyecto
para un solo cliente:

1. **Seguro por defecto.** El sistema guarda datos de los clientes de cada taller, así que
   aplica la Ley Orgánica de Protección de Datos Personales de Ecuador.
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

## Decisiones tomadas

| Fecha | Decisión | Por qué |
|---|---|---|
| 2026-10-23 | **Sistema interno; el cliente no tiene cuenta.** Lo que el cliente necesita llega sin contraseña: la web, una solicitud de cita, y enlaces únicos para aprobar un presupuesto o ver el estado de su carro (Fase 7), más avisos por WhatsApp | Quien paga es el dueño del taller, y el valor está en la operación. El cliente en Ecuador ya habla con el taller por WhatsApp y rara vez crea cuentas. Se eliminan por diseño el registro, los roles elegidos por el cliente y la verificación de correo. Un portal con cuenta puede ser un módulo opcional más adelante |

## Decisiones abiertas (las toma el usuario)

Estas cambian el diseño de fases posteriores. No se implementa nada que dependa de ellas
sin preguntarlas:

| Decisión | Opciones | Afecta a |
|---|---|---|
| Modelo de despliegue | (a) una instancia por taller — simple, aislamiento total; (b) SaaS multi-taller con `taller_id` en cada tabla | Fase 5 |
| Facturación electrónica | (a) integrar directamente con el SRI (firma `.p12`, XML, clave de acceso); (b) usar un proveedor autorizado por API; (c) no facturar y emitir «orden de trabajo» | Fase 6 |
| Repositorio | Seguir público o pasarlo a privado (el código es el producto) | Fase 0 |
| Avisos al cliente | WhatsApp (API de Meta o un proveedor) y/o correo transaccional con dominio propio | Fase 7 |
| Imágenes | Hoy en base64 dentro de la base y de sitios ajenos enlazados; mover a almacenamiento de objetos y usar imágenes propias | Fases 4 y 8 |
