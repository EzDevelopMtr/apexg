-- =====================================================
-- APEX GYM — Migración 020
-- 020_day_pass_without_plan.sql
--
-- Prerrequisito: 018_add_day_passes.sql aplicado.
--
-- Objetivo: el pase de día deja de salir del plan de un día del catálogo.
-- La recepcionista escribe el valor cobrado y el visitante nunca se registra
-- como cliente, así que los pases nuevos no apuntan a ningún plan.
--
-- `membership_type_id` pasa a ser nullable. Se conserva la FK: los pases ya
-- vendidos guardan el plan con que se vendieron. `visitor_contact` también
-- se conserva (ya era nullable); la API simplemente deja de escribirlo.
-- =====================================================

BEGIN;

ALTER TABLE day_passes ALTER COLUMN membership_type_id DROP NOT NULL;

COMMIT;
