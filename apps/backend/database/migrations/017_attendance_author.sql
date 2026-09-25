-- =====================================================
-- APEX GYM — Migración 017
-- 017_attendance_author.sql
--
-- Prerrequisito: 016_add_client_photo.sql aplicado.
--
-- Objetivo: con más de una recepcionista en el mostrador hay que poder
-- responder quién registró cada cosa. Pagos, egresos, ventas y clientes ya
-- guardaban `created_by`; las asistencias no, y son justo el registro que
-- más veces al día toca alguien distinto.
--
-- NULLABLE a propósito: los ingresos que ya existen no tienen autor, y
-- inventarle uno sería peor que dejarlo en blanco. Las filas nuevas sí lo
-- llevan — lo pone el backend desde el token, nunca el cliente.
--
-- No idempotente (una migración se ejecuta una sola vez).
-- =====================================================

BEGIN;

ALTER TABLE attendances ADD COLUMN created_by UUID REFERENCES users (id);

COMMENT ON COLUMN attendances.created_by IS
  'Quién registró el ingreso. NULL en los anteriores a esta migración.';

COMMIT;
