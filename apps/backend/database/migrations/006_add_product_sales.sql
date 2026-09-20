-- =====================================================
-- APEX GYM — Migración 006
-- 006_add_product_sales.sql
--
-- Prerrequisito: 005_add_inventory_categories.sql aplicado.
--
-- Objetivo: el gimnasio también vende productos de inventario (proteínas,
-- bebidas, etc.), no solo cobra membresías. Se modela como tabla propia,
-- NO dentro de `payments` — un pago de membresía tiene saldo/abono/
-- comisión, una venta de producto no tiene nada de eso, forzarla en la
-- misma tabla hubiera significado condicionales por todos lados en
-- `PaymentsService`. `client_id` es NULLABLE a propósito (decisión del
-- usuario 2026-09-15): una venta de mostrador no siempre tiene un cliente
-- registrado detrás. El precio NO sale de `inventory_items` (no se agregó
-- columna de precio ahí) — se escribe a mano en cada venta, también por
-- decisión del usuario.
--
-- No idempotente (una migración se ejecuta una sola vez).
-- =====================================================

BEGIN;

CREATE TABLE product_sales (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id        UUID NOT NULL REFERENCES companies (id),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items (id),
    client_id         UUID REFERENCES clients (id),
    quantity          NUMERIC(12,3) NOT NULL,
    amount            NUMERIC(12,2) NOT NULL,
    payment_method    VARCHAR(20) NOT NULL,
    sold_at           TIMESTAMPTZ NOT NULL,
    notes             TEXT,
    created_by        UUID REFERENCES users (id),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_sales_company_sold ON product_sales (company_id, sold_at);
CREATE INDEX idx_product_sales_item         ON product_sales (inventory_item_id);

COMMENT ON TABLE product_sales IS
  'Venta de un ítem de inventario (no una membresía). Descuenta stock vía un movimiento "out" registrado en la misma transacción, no vía trigger.';
COMMENT ON COLUMN product_sales.client_id IS
  'NULL = venta de mostrador, sin cliente asociado.';

COMMIT;
