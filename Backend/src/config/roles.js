// Solo el personal del taller tiene cuenta (docs/plan/fases/fase-01-sistema-interno.md).
// Las cuentas con rol 'cliente' que quedan en la base son de antes y ya no pueden entrar.
const ROLES_PERSONAL = ['admin', 'tecnico'];

const LONGITUD_MINIMA_CONTRASENA = 8;

module.exports = { ROLES_PERSONAL, LONGITUD_MINIMA_CONTRASENA };
