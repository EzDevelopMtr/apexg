-- =====================================================
-- APEX GYM — Migración 018
-- 018_add_day_passes.sql
--
-- Prerrequisito: 017_attendance_author.sql aplicado.
--
-- Objetivo: vender un día a un visitante (alguien de paso por la ciudad) sin
-- registrarlo como cliente. Tabla propia, NO dentro de `payments`: un pago
-- cuelga de una membresía (`client_membership_id NOT NULL`) y lo que se
-- quiere evitar es justo abrirle una a quien probablemente no vuelve.
--
-- Trazabilidad igual que un pago (RNF-07): quién lo vendió, cuándo, cómo se
-- pagó y la foto del comprobante. `receipt_path` es nullable por la misma
-- razón que en 008 — el efectivo no deja archivo; la API exige el comprobante
-- a todo lo que no sea efectivo.
--
-- `membership_type_id` guarda con qué plan se vendió y `amount` el precio de
-- ese momento: si mañana sube el plan, los pases ya vendidos no cambian.
--
-- No idempotente (una migración se ejecuta una sola vez).
-- =====================================================

BEGIN;

CREATE TABLE day_passes (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id         UUID NOT NULL REFERENCES companies (id),
    membership_type_id UUID NOT NULL REFERENCES membership_types (id),
    visitor_name       VARCHAR(150) NOT NULL,
    visitor_contact    VARCHAR(50),
    amount             NUMERIC(12,2) NOT NULL,
    payment_method     VARCHAR(20) NOT NULL,
    receipt_path       VARCHAR(255),
    sold_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by         UUID NOT NULL REFERENCES users (id),
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_day_passes_company_sold ON day_passes (company_id, sold_at);

COMMENT ON TABLE day_passes IS
  'Un día vendido a un visitante sin ficha de cliente. No es un pago: no cuelga de ninguna membresía.';
COMMENT ON COLUMN day_passes.visitor_contact IS
  'Documento o teléfono, opcional. Sirve para reconocer al visitante que vuelve.';
COMMENT ON COLUMN day_passes.amount IS
  'Precio del plan al momento de la venta; no se recalcula si el plan cambia.';

COMMIT;
