-- =====================================================
-- APEX GYM — Seed por empresa
-- seeds/company/003_expense_categories.sql
--
-- Carga las 4 categorías de egreso base para UNA empresa concreta.
--
-- Depende de:
--   001_initial_schema.sql
--
-- Uso:
--   psql "$DATABASE_URL" \
--     -v company_id='UUID-DE-LA-EMPRESA' \
--     -f apps/backend/database/seeds/company/003_expense_categories.sql
--
-- La empresa se identifica SOLO por companies.id (nunca por nombre).
-- Si el company_id no existe, la FK expense_categories.company_id
-- falla y la transacción hace ROLLBACK.
--
-- Idempotente: reejecutable para la misma empresa sin duplicar
-- (ON CONFLICT (company_id, name) DO UPDATE). Nunca hace DELETE.
--
-- Este seed NO crea egresos (tabla expenses). El Administrador podrá
-- crear categorías adicionales después desde la aplicación.
-- =====================================================

\set ON_ERROR_STOP on

BEGIN;


INSERT INTO expense_categories (company_id, name, description, state) VALUES
    (:'company_id'::uuid, 'Nómina',
        'Pagos de nómina y remuneraciones del personal', 1),

    (:'company_id'::uuid, 'Mantenimiento',
        'Gastos de mantenimiento de equipos e instalaciones', 1),

    (:'company_id'::uuid, 'Servicios públicos',
        'Pagos de servicios públicos del gimnasio', 1),

    (:'company_id'::uuid, 'Insumos de aseo/antibacteriales',
        'Compra de productos de aseo, limpieza y antibacteriales', 1)
ON CONFLICT (company_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    state       = EXCLUDED.state,
    updated_at  = NOW();


COMMIT;


-- =====================================================
-- Verificación informativa (no modifica datos)
-- =====================================================

SELECT name, description, state
FROM expense_categories
WHERE company_id = :'company_id'::uuid
ORDER BY name;
