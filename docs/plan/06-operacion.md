# 06 — Operación: local, despliegue y credenciales

> **Lee antes:** nada para levantarlo en local. Para tocar credenciales, también
> [`fases/fase-00-credenciales-y-documentacion.md`](fases/fase-00-credenciales-y-documentacion.md).

## Dónde corre cada pieza

| Pieza | Dónde | URL | Configurado en |
|---|---|---|---|
| API | Render (Web Service, `npm start`) | `https://taller-mecanico-t7lv.onrender.com` | Variables en Render → Environment |
| Web | Vercel (estático con reescritura a `index.html`) | `https://taller-mecanico-52bo.vercel.app` | `ProyectoTW/vercel.json`, `environment.prod.ts` |
| Base | PostgreSQL con SSL (proveedor **por confirmar**) | `DATABASE_URL` | Render |
| Correo | Gmail por SMTP con contraseña de aplicación | — | `EMAIL_USER` / `EMAIL_PASS` en Render |

Las URLs de producción también están escritas a mano en `app.js:13-22` (CORS),
`user.controller.js:41` (redirección tras verificar) y `email.service.js:21` (enlace del
correo). Cambiar de dominio exige tocar los tres hasta la Fase 4.

## Variables de entorno

Plantilla: [`Backend/.env.example`](../../Backend/.env.example). `Backend/.env` está en
`.gitignore` (raíz y `Backend/`) y **nunca** se sube.

| Variable | Obligatoria | Para qué | Si falta |
|---|---|---|---|
| `PORT` | No (3000) | Puerto HTTP. Render la inyecta | — |
| `DATABASE_URL` | Sí | Conexión a PostgreSQL (`db.js` exige SSL) | Arranca, pero toda consulta falla |
| `JWT_SECRET` | Sí | Firma sesiones y enlaces de verificación | `jwt.sign` lanza: no hay login ni registro |
| `EMAIL_USER` | Sí | Cuenta de Gmail remitente | El registro responde 500 con «Faltan EMAIL_USER y EMAIL_PASS…» en el log |
| `EMAIL_PASS` | Sí | Contraseña de **aplicación** de esa cuenta (no la de la cuenta) | Ídem |
| `EMAIL_FROM` | No | Remitente visible; por defecto `"Taller Mecánico San Gabriel 🚗" <EMAIL_USER>` | — |

🔴 `index.js` llama a `dotenv.config()` **antes** de `require('./app')`, porque `db.js` y
`email.service.js` leen el entorno al importarse. Si se invierte, en local todo arranca
sin variables (en Render no se nota porque las inyecta el sistema).

## Levantarlo en local

```bash
cd Backend && cp .env.example .env
```

Rellenar `.env` (para `DATABASE_URL` hace falta una base: hoy solo existe la de
producción, ver [`02-modelo-datos.md`](02-modelo-datos.md)). Luego:

```bash
cd Backend && npm install && npm run dev
```

```bash
cd ProyectoTW && npm install && npm start
```

La web queda en `http://localhost:4200` contra el API en `http://localhost:3000`
(`environment.ts`). `localhost:4200` ya está en los orígenes de CORS.

⚠️ Con la `DATABASE_URL` de producción en local, **se escribe en producción** y los
correos de verificación salen de verdad.

## Desplegar

- **API**: Render despliega `Backend/` con `npm start`. Una variable nueva se añade en
  Render **antes** de desplegar el código que la usa.
- **Web**: `npm run build` usa `environment.prod.ts`. Vercel sirve `dist/spa/browser` con
  `vercel.json` reescribiendo todo a `index.html`. (La configuración exacta del proyecto
  en Vercel —directorio raíz, comando— está **por confirmar**.)
- Backend y frontend se despliegan juntos cuando cambia un contrato (rutas, forma de la
  respuesta, cabecera `Authorization` en la Fase 1).

## Rotar una credencial

1. Generar la nueva en su origen:
   - Gmail: <https://myaccount.google.com/apppasswords> (requiere verificación en dos pasos).
   - `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
     Rotarlo **cierra todas las sesiones** e invalida los enlaces de verificación pendientes.
   - `DATABASE_URL`: cambiar la contraseña del usuario en el proveedor de la base.
2. Ponerla en Render (y en el `Backend/.env` local) y redeplegar.
3. Comprobar: registrarse con un correo propio y recibir el enlace; iniciar sesión.
4. **Revocar la anterior** en su origen. Hasta este paso, la vieja sigue funcionando.

Al diagnosticar, no imprimir valores: comparar por longitud o por
`node -e "console.log(require('crypto').createHash('sha256').update(process.env.X).digest('hex').slice(0,8))"`.
