-- =====================================================
-- APEX GYM — Migración 021
-- 021_company_slug_state.sql
--
-- Objetivo: que una sola instalación atienda a varios gimnasios
-- (docs/plan-multi-gimnasio.md, fase 1).
--
-- `slug`: identifica al gimnasio en la URL (`<link>/apex-gym`). Único y
-- obligatorio. El formato (minúsculas, dígitos y guiones; nunca una ruta
-- reservada del frontend) lo impone `company-slug.ts`, no la base: mismo
-- criterio "Sin ENUM / sin CHECK de negocio" de 001 y 009.
--
-- `state`: 1 = activo, 2 = suspendido. Un gimnasio suspendido no puede
-- iniciar sesión y sus sesiones abiertas dejan de valer.
--
-- Backfill: hoy existe un solo gimnasio, APEX GYM, que pasa a `apex-gym`.
-- Cualquier otra fila (no debería haberla) recibe un slug derivado de su id
-- para no dejar la columna sin valor.
-- =====================================================

BEGIN;

ALTER TABLE companies ADD COLUMN slug VARCHAR(40);

UPDATE companies SET slug = 'apex-gym' WHERE name = 'APEX GYM';
UPDATE companies SET slug = 'company-' || left(id::text, 8) WHERE slug IS NULL;

ALTER TABLE companies ALTER COLUMN slug SET NOT NULL;
ALTER TABLE companies ADD CONSTRAINT uq_companies_slug UNIQUE (slug);

ALTER TABLE companies ADD COLUMN state INTEGER NOT NULL DEFAULT 1;

COMMIT;
