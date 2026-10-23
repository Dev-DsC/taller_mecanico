-- Solo lectura. Se ejecuta ANTES de 001-citas-por-cliente.sql y se revisa el resultado.
-- Por qué: docs/plan/fases/fase-01-sistema-interno.md

-- 1. Cuentas del personal que existen hoy. El API estuvo abierto: cualquiera pudo crearse
--    una cuenta admin. Decidir cuáles son legítimas antes de desplegar.
SELECT usuario_id, nombre, email, rol, email_verificado
FROM usuarios
WHERE rol <> 'cliente'
ORDER BY usuario_id;

-- 2. Tipos de las columnas que toca la migración. Si clientes.cliente_id no es integer,
--    ajustar el tipo de cita.cliente_id en la migración.
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('cita', 'clientes')
  AND column_name IN ('cita_id', 'usuario_id', 'cliente_id')
ORDER BY table_name, column_name;

-- 3. Restricciones actuales de cita (claves foráneas, únicas).
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'cita'::regclass;

-- 4. Citas cuyo usuario no tiene ficha de cliente: se quedarían sin cliente_id.
SELECT c.cita_id, c.usuario_id, u.nombre, u.email, c.fecha, c.hora
FROM cita c
LEFT JOIN clientes cl ON cl.usuario_id = c.usuario_id
LEFT JOIN usuarios u ON u.usuario_id = c.usuario_id
WHERE cl.cliente_id IS NULL;

-- 5. Cuentas con más de una ficha: el relleno elegiría una cualquiera.
SELECT usuario_id, COUNT(*) AS fichas
FROM clientes
WHERE usuario_id IS NOT NULL
GROUP BY usuario_id
HAVING COUNT(*) > 1;
