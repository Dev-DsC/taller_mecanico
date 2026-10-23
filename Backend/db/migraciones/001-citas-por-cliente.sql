-- 001 — Las citas pasan a ser de una ficha de cliente, no de una cuenta de usuario.
-- Por qué: docs/plan/fases/fase-01-sistema-interno.md
--
-- Antes: ejecutar 001-citas-por-cliente.revisar.sql y revisar el resultado.
-- Aditiva e idempotente: no borra ninguna columna y se puede volver a ejecutar. Se ejecuta
-- antes de desplegar la Fase 1 y otra vez después, para enlazar las citas que se hayan
-- creado entretanto con el código viejo.

BEGIN;

ALTER TABLE cita ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes (cliente_id);

-- Enlazar cada cita con la ficha de la cuenta que la pidió. Solo toca las que aún no tienen ficha.
UPDATE cita c
SET cliente_id = cl.cliente_id
FROM clientes cl
WHERE cl.usuario_id = c.usuario_id
  AND c.cliente_id IS NULL;

CREATE INDEX IF NOT EXISTS cita_cliente_id_idx ON cita (cliente_id);

-- Las citas nuevas ya no llevan cuenta de usuario
ALTER TABLE cita ALTER COLUMN usuario_id DROP NOT NULL;

COMMIT;
