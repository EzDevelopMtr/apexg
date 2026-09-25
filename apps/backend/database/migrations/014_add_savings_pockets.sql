-- =====================================================
-- APEX GYM — Migración 014
-- 014_add_savings_pockets.sql
--
-- Prerrequisito: 013_weekly_visits_not_null.sql aplicado.
--
-- Objetivo: el gimnasio necesita apartar plata con destino — una máquina
-- nueva, el arriendo de diciembre — en vez de mirar un solo número de
-- utilidad acumulada y adivinar cuánto de eso ya está comprometido.
--
-- Dos tablas y no una columna en `expenses`: un egreso ya se gastó y un
-- ahorro sigue en caja. Comparten que ambos bajan la utilidad (RNF-07), y
-- ahí termina el parecido — un ahorro tiene meta, avance y se puede cerrar.
--
-- `savings_contributions` es append-only, igual que `payments`: para
-- deshacer un aporte se registra otro en contra y quedan los dos. Por eso
-- `created_by` no es opcional aquí — un movimiento financiero sin autor no
-- es trazable (RNF-07).
--
-- El monto NO está restringido a positivo en la base: un aporte en contra
-- (una corrección, o sacar plata del bolsillo para gastarla) es negativo a
-- propósito. Que un aporte normal sea positivo lo valida el dominio
-- (`contributionRefusal` en @apexg/core), que es donde está la regla.
--
-- No idempotente (una migración se ejecuta una sola vez).
-- =====================================================

BEGIN;

CREATE TABLE savings_pockets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies (id),
    name        VARCHAR(120) NOT NULL,
    goal_amount NUMERIC(12,2) NOT NULL,
    closed      BOOLEAN NOT NULL DEFAULT FALSE,
    created_by  UUID REFERENCES users (id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE savings_contributions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies (id),
    pocket_id  UUID NOT NULL REFERENCES savings_pockets (id),
    amount     NUMERIC(12,2) NOT NULL,
    saved_on   DATE NOT NULL,
    notes      TEXT,
    created_by UUID NOT NULL REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_savings_pockets_company ON savings_pockets (company_id, closed);
CREATE INDEX idx_savings_contrib_pocket  ON savings_contributions (pocket_id);
CREATE INDEX idx_savings_contrib_company_date
    ON savings_contributions (company_id, saved_on);

COMMENT ON TABLE savings_pockets IS
  'Destino al que el gimnasio aparta plata. La meta orienta, no limita: se puede ahorrar por encima de ella.';
COMMENT ON TABLE savings_contributions IS
  'Plata apartada hacia un bolsillo. Append-only (RNF-07): para deshacer un aporte se registra otro en contra.';
COMMENT ON COLUMN savings_contributions.amount IS
  'Puede ser negativo: una corrección, o sacar del bolsillo lo que ya se gastó.';

COMMIT;
