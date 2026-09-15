-- =====================================================
-- APEX GYM — Migración 005
-- 005_add_inventory_categories.sql
--
-- Prerrequisito: 004_add_installment_number_and_trainer_extras.sql aplicado.
--
-- Objetivo: Inventario no tenía forma de diferenciar o agrupar ítems —
-- todos aparecían mezclados en una sola lista. Agrega un catálogo de
-- categorías administrable, con la misma forma que expense_categories
-- (RF-27), y una columna opcional en inventory_items que la referencia.
--
-- Decisión con el usuario (2026-09-15), no un requisito del ERS — el ERS
-- deja el alcance de Inventario pendiente de afinar (§2.4). category_id
-- es NULLABLE a propósito: los ítems ya existentes quedan "sin categoría"
-- en vez de forzar un backfill o una categoría por defecto inventada.
--
-- No idempotente (una migración se ejecuta una sola vez).
-- =====================================================

BEGIN;


-- =====================================================
-- inventory_categories
-- =====================================================

CREATE TABLE inventory_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies (id),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    state       INTEGER NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_inventory_categories_company_name UNIQUE (company_id, name)
);


-- =====================================================
-- inventory_items.category_id
-- =====================================================

ALTER TABLE inventory_items
    ADD COLUMN category_id UUID REFERENCES inventory_categories (id);

CREATE INDEX idx_inventory_items_category ON inventory_items (category_id);

COMMENT ON COLUMN inventory_items.category_id IS
  'Categoría del ítem (agrupación simple, no del ERS). NULL = sin categoría, incluida toda fila creada antes de esta migración.';


COMMIT;
