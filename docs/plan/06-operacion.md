# 06 — Operación: local, pruebas, despliegue y credenciales

> **Lee antes:** nada para levantarlo en local. Para tocar credenciales, también
> [`fases/fase-00-credenciales-y-documentacion.md`](fases/fase-00-credenciales-y-documentacion.md).

## Dónde corre cada pieza

| Pieza | Dónde | URL | Configurado en |
|---|---|---|---|
| API | Render (Web Service, `npm start`) | `https://taller-mecanico-t7lv.onrender.com` | Variables en Render → Environment |
| Web | Vercel (estático con reescritura a `index.html`) | `https://taller-mecanico-52bo.vercel.app` | `ProyectoTW/vercel.json`, `environment.prod.ts` |
| Base | PostgreSQL con SSL (proveedor **por confirmar**) | `DATABASE_URL` | Render |

El sistema **no envía correo** desde la Fase 1. La URL de la web también está escrita a mano
en `app.js:19-28` (CORS): cambiar de dominio exige tocarla hasta la Fase 4.

## Variables de entorno

Plantilla: [`Backend/.env.example`](../../Backend/.env.example). `Backend/.env` está en
`.gitignore` (raíz y `Backend/`) y **nunca** se sube.

| Variable | Obligatoria | Para qué | Si falta |
|---|---|---|---|
| `PORT` | No (3000) | Puerto HTTP. Render la inyecta | — |
| `DATABASE_URL` | Sí | Conexión a PostgreSQL (`db.js` exige SSL) | Arranca, pero toda consulta falla |
| `JWT_SECRET` | Sí | Firma las sesiones | El login falla con 500 |

`EMAIL_USER`, `EMAIL_PASS` y `EMAIL_FROM` ya no se usan: si siguen en Render, se quitan.

🔴 `index.js` llama a `dotenv.config()` **antes** de `require('./app')`, porque `db.js` lee
el entorno al importarse. Si se invierte, en local todo arranca sin variables (en Render no se
nota porque las inyecta el sistema).

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
cd ProyectoTW && npm ci --legacy-peer-deps && npm start
```

`--legacy-peer-deps` hace falta por Material 17 con Angular 18 (Fase 2). La web queda en
`http://localhost:4200` contra el API en `http://localhost:3000` (`environment.ts`).
`localhost:4200` ya está en los orígenes de CORS. Para la vista previa de Claude están las
dos en `.claude/launch.json` (`api` y `web`).

Sin `DATABASE_URL`, el API arranca igual: sirve para comprobar accesos (401/403), no datos.

⚠️ Con la `DATABASE_URL` de producción en local, **se escribe en producción**.

## Pruebas

```bash
cd Backend && npm test
```

Jest + supertest contra la app real, con `config/db` sustituido por `test/db-falsa.js`: no
necesitan base ni variables (`test/entorno.js` pone un `JWT_SECRET` de prueba).
`test/accesos.test.js` recorre **todas las rutas del router**: una ruta nueva sin
protección la hace fallar. Las pruebas del frontend (`ng test`) no compilan todavía (Fase 2).

Para el frontend, la verificación es el build. Como `dist/` está en git, se compila fuera
para no ensuciar el árbol:

```bash
cd ProyectoTW && npx ng build --output-path ../../build-tmp
```

## Migraciones

Están en `Backend/db/migraciones/`, en SQL, y se ejecutan **a mano y solo con permiso del
usuario**: la única base es la de producción. Cada una lleva un `.revisar.sql` de solo lectura
que se ejecuta antes y cuyo resultado se revisa con el usuario. Estado de cada una en
[`02-modelo-datos.md`](02-modelo-datos.md).

## Desplegar

- **API**: Render despliega `Backend/` con `npm start`. Una variable nueva se añade en
  Render **antes** de desplegar el código que la usa.
- **Web**: `npm run build` usa `environment.prod.ts`. Vercel sirve `dist/spa/browser` con
  `vercel.json` reescribiendo todo a `index.html`. (La configuración exacta del proyecto
  en Vercel —directorio raíz, comando de instalación— está **por confirmar**.)
- Backend y frontend se despliegan juntos cuando cambia un contrato (rutas, forma de la
  respuesta, cabeceras). La Fase 1 es uno: su orden está en
  [`fase-01`](fases/fase-01-sistema-interno.md#despliegue---en-este-orden-y-la-base-solo-con-permiso-del-usuario).
- 🔴 Vercel ha bloqueado previews con *«Deployment was blocked»* en commits con coautor ajeno
  al equipo (PR #21). Comprobar siempre que el despliegue de producción salió.

## Rotar una credencial

1. Generar la nueva en su origen:
   - `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
     Rotarlo **cierra todas las sesiones**.
   - `DATABASE_URL`: cambiar la contraseña del usuario en el proveedor de la base.
2. Ponerla en Render (y en el `Backend/.env` local) y redeplegar.
3. Comprobar: iniciar sesión con una cuenta del personal.
4. **Revocar la anterior** en su origen. Hasta este paso, la vieja sigue funcionando.

Contraseña olvidada de un empleado: el admin le pone otra al editarlo en `/usuario`. Si es la
del único admin, solo queda hacerlo en la base (hash bcrypt de 10 rondas), con el usuario.

Al diagnosticar, no imprimir valores: comparar por longitud o por
`node -e "console.log(require('crypto').createHash('sha256').update(process.env.X).digest('hex').slice(0,8))"`.
