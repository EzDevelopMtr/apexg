-- =====================================================
-- APEX GYM — Seed por empresa
-- seeds/company/002_membership_types.sql
--
-- Carga las 9 membresías base para UNA empresa concreta.
--
-- Depende de:
--   001_initial_schema.sql
--   (no depende de 002_seed_modules_permissions ni de 001_roles_permissions)
--
-- Uso:
--   psql "$DATABASE_URL" \
--     -v company_id='UUID-DE-LA-EMPRESA' \
--     -f apps/backend/database/seeds/company/002_membership_types.sql
--
-- La empresa se identifica SOLO por companies.id (nunca por nombre).
-- Si el company_id no existe, la FK membership_types.company_id falla
-- y la transacción hace ROLLBACK.
--
-- Idempotente: reejecutable para la misma empresa sin duplicar
-- (ON CONFLICT (company_id, name) DO UPDATE). Nunca hace DELETE.
--
-- Decisión de implementación:
--   'Personalizado' y 'Semipersonalizado' se configuran con
--   duration_value = 1 y duration_unit = 'month'. El ERS define su
--   precio, abono mínimo y distribución entrenador/negocio, pero no
--   fija la duración en esa fila; se adopta 1 mes.
--
-- minimum_payment: en los planes que NO admiten abonos queda NULL
--   (no se iguala al precio). El "pago completo" se deriva luego de
--   allows_partial_payment = FALSE.
--
-- Este seed NO crea promotion_groups ni promotion_group_members.
-- Las reglas de 'Promo amigos/familiar' (mín. 3 clientes, pago
-- conjunto el mismo día, permanencia del grupo) y de 'Promo folleto
-- físico' (cliente nuevo, primer mes, folleto) se validan en backend.
-- =====================================================

\set ON_ERROR_STOP on

BEGIN;


INSERT INTO membership_types (
    company_id, name, price, description,
    duration_value, duration_unit,
    minimum_payment, trainer_share, business_share,
    allows_partial_payment, is_promotional, state
) VALUES
    (:'company_id'::uuid, 'Mensualidad (lunes a sábado)', 65000,
        'Acceso de lunes a sábado durante un mes',
        1, 'month',
        30000, NULL, NULL,
        TRUE, FALSE, 1),

    (:'company_id'::uuid, 'Mes 3 veces por semana', 50000,
        'Acceso tres días por semana durante un mes',
        1, 'month',
        30000, NULL, NULL,
        TRUE, FALSE, 1),

    (:'company_id'::uuid, 'Quincena', 45000,
        'Vigencia de 15 días calendario',
        15, 'day',
        NULL, NULL, NULL,
        FALSE, FALSE, 1),

    (:'company_id'::uuid, 'Semana', 25000,
        'Vigencia de 7 días calendario',
        7, 'day',
        NULL, NULL, NULL,
        FALSE, FALSE, 1),

    (:'company_id'::uuid, 'Día', 6000,
        'Vigencia de un día',
        1, 'day',
        NULL, NULL, NULL,
        FALSE, FALSE, 1),

    (:'company_id'::uuid, 'Promo amigos/familiar', 60000,
        'Tarifa por persona para grupos de tres o más clientes que pagan juntos el mismo día',
        1, 'month',
        NULL, NULL, NULL,
        FALSE, TRUE, 1),

    (:'company_id'::uuid, 'Promo folleto físico', 55000,
        'Promoción para clientes nuevos que presentan folleto físico; aplica al primer mes',
        1, 'month',
        NULL, NULL, NULL,
        FALSE, TRUE, 1),

    -- Personalizado: duración 1 mes (decisión de implementación)
    (:'company_id'::uuid, 'Personalizado', 200000,
        'Entrenamiento personalizado uno a uno',
        1, 'month',
        100000, 100000, 100000,
        TRUE, FALSE, 1),

    -- Semipersonalizado: duración 1 mes (decisión de implementación)
    (:'company_id'::uuid, 'Semipersonalizado', 150000,
        'Entrenamiento semipersonalizado',
        1, 'month',
        75000, 75000, 75000,
        TRUE, FALSE, 1)
ON CONFLICT (company_id, name) DO UPDATE SET
    price                  = EXCLUDED.price,
    description             = EXCLUDED.description,
    duration_value         = EXCLUDED.duration_value,
    duration_unit          = EXCLUDED.duration_unit,
    minimum_payment        = EXCLUDED.minimum_payment,
    trainer_share          = EXCLUDED.trainer_share,
    business_share         = EXCLUDED.business_share,
    allows_partial_payment = EXCLUDED.allows_partial_payment,
    is_promotional         = EXCLUDED.is_promotional,
    state                  = EXCLUDED.state,
    updated_at             = NOW();


COMMIT;


-- =====================================================
-- Verificación informativa (no modifica datos)
-- =====================================================

SELECT name, price, duration_value, duration_unit,
       minimum_payment, trainer_share, business_share,
       allows_partial_payment, is_promotional, state
FROM membership_types
WHERE company_id = :'company_id'::uuid
ORDER BY price DESC, name;
