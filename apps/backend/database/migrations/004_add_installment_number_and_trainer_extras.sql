-- =====================================================
-- APEX GYM — Migración 004
-- 004_add_installment_number_and_trainer_extras.sql
--
-- Prerrequisito: 003_harden_users_auth.sql aplicado.
--
-- Objetivo — cierra 3 gaps de esquema ya documentados en el backend
-- (ver payments.service.ts, trainers.types.ts):
--   1. payments.installment_number: numera con exactitud el abono dentro
--      de su membresía. `payment_type` solo distingue 4 categorías, no un
--      número — un plan con 3+ abonos intermedios los confundía todos en
--      "second_installment", perdiendo cuál era el 2do, 3ro o 4to.
--   2. trainers.certifications: texto libre (RF-22), ausente hasta ahora.
--   3. trainer_commissions.settled/settled_at: no existía ninguna forma
--      de marcar una comisión como liquidada/pagada al entrenador.
--
-- Alcance controlado: SOLO payments, trainers y trainer_commissions.
-- Backfill incluido para payments.installment_number: las filas ya
-- existentes no pueden quedar en NULL antes de aplicar NOT NULL, y el
-- orden que replica (paid_at) es el mismo que ya usa el backend para
-- clasificar payment_type — no inventa un criterio nuevo.
--
-- No idempotente (una migración se ejecuta una sola vez).
-- =====================================================

BEGIN;


-- =====================================================
-- payments.installment_number
-- =====================================================

ALTER TABLE payments ADD COLUMN installment_number INTEGER;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY client_membership_id ORDER BY paid_at, id
  ) AS seq
  FROM payments
)
UPDATE payments
SET installment_number = numbered.seq
FROM numbered
WHERE payments.id = numbered.id;

ALTER TABLE payments ALTER COLUMN installment_number SET NOT NULL;

COMMENT ON COLUMN payments.installment_number IS
  'Número de abono dentro de su membresía (1, 2, 3...), en orden de paid_at. Complementa a payment_type, que solo distingue full/first/second/final.';


-- =====================================================
-- trainers.certifications
-- =====================================================

ALTER TABLE trainers ADD COLUMN certifications TEXT;

COMMENT ON COLUMN trainers.certifications IS
  'RF-22: certificados del entrenador, texto libre. NULL si no aplica.';


-- =====================================================
-- trainer_commissions.settled / settled_at
-- =====================================================

ALTER TABLE trainer_commissions ADD COLUMN settled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trainer_commissions ADD COLUMN settled_at TIMESTAMPTZ;

COMMENT ON COLUMN trainer_commissions.settled IS
  'true una vez que el gimnasio le pagó la comisión al entrenador.';
COMMENT ON COLUMN trainer_commissions.settled_at IS
  'Momento en que se marcó settled = true. NULL mientras no esté liquidada.';


COMMIT;
