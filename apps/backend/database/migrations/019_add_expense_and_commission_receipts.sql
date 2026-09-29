-- =====================================================
-- APEX GYM — Migración 019
-- 019_add_expense_and_commission_receipts.sql
--
-- Prerrequisito: 018_add_day_passes.sql aplicado.
--
-- Objetivo: la plata que SALE del gimnasio deja el mismo rastro que la que
-- entra (RNF-07). Un egreso y el pago de comisiones a un entrenador guardan
-- cómo se pagaron y la foto del comprobante; la API lo exige a todo lo que
-- no sea efectivo, con la misma regla que un pago (008) o un pase de día (018).
--
-- Todas las columnas son nullable a propósito:
--   * `receipt_path` / `settlement_receipt_path`: el efectivo no deja archivo.
--   * `payment_method` / `settlement_method`: los egresos y liquidaciones ya
--     registrados en el piloto no dijeron cómo se pagaron. NO se rellenan:
--     inventar "efectivo" falsearía el rastro. La UI muestra "—".
--
-- Un pago a un entrenador cubre varias comisiones con un solo comprobante:
-- todas las filas liquidadas juntas comparten el mismo `settlement_receipt_path`.
--
-- No idempotente (una migración se ejecuta una sola vez).
-- =====================================================

BEGIN;

ALTER TABLE expenses
    ADD COLUMN payment_method VARCHAR(20),
    ADD COLUMN receipt_path   VARCHAR(255);

COMMENT ON COLUMN expenses.payment_method IS
  'cash | transfer. NULL solo en egresos anteriores a la migración 019.';
COMMENT ON COLUMN expenses.receipt_path IS
  'Nombre del comprobante en el almacén de comprobantes; NULL si no hay (efectivo).';

ALTER TABLE trainer_commissions
    ADD COLUMN settlement_method       VARCHAR(20),
    ADD COLUMN settlement_receipt_path VARCHAR(255);

COMMENT ON COLUMN trainer_commissions.settlement_method IS
  'Cómo se le pagó al entrenador: cash | transfer. NULL si no está liquidada o se liquidó antes de la 019.';
COMMENT ON COLUMN trainer_commissions.settlement_receipt_path IS
  'Comprobante del pago; compartido por todas las comisiones liquidadas en el mismo pago.';

COMMIT;
