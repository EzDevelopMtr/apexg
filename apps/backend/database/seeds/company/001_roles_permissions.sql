-- =====================================================
-- APEX GYM — Seed por empresa
-- seeds/company/001_roles_permissions.sql
--
-- Crea los roles base (Administrador, Recepcionista) y sus
-- permisos para UNA empresa concreta.
--
-- Depende de:
--   001_initial_schema.sql
--   002_seed_modules_permissions.sql   (modules + permissions ya cargados)
--
-- No crea empresas, usuarios ni datos de negocio.
--
-- Uso:
--   psql "$DATABASE_URL" \
--     -v company_id='00000000-0000-0000-0000-000000000000' \
--     -f apps/backend/database/seeds/company/001_roles_permissions.sql
--
-- La empresa se identifica SOLO por companies.id (nunca por nombre).
-- Si el company_id no existe, la FK de roles.company_id falla y la
-- transacción hace ROLLBACK (comportamiento deseado).
--
-- Idempotente: reejecutable para la misma empresa sin duplicar.
--   roles            -> ON CONFLICT (company_id, name)
--   role_permissions -> ON CONFLICT (role_id, permission_id) DO NOTHING
-- Nunca hace DELETE: no "sincroniza" quitando permisos concedidos aparte.
-- =====================================================

\set ON_ERROR_STOP on

BEGIN;


-- =====================================================
-- Roles base de la empresa
-- IDs generados por IDENTITY; se resuelven luego por (company_id, name).
-- =====================================================

INSERT INTO roles (company_id, name, description, state) VALUES
    (:'company_id'::uuid, 'Administrador', 'Acceso completo a la gestión del gimnasio', 1),
    (:'company_id'::uuid, 'Recepcionista', 'Gestión operativa diaria del gimnasio',     1)
ON CONFLICT (company_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    state       = EXCLUDED.state;


-- =====================================================
-- Administrador -> TODOS los permisos existentes en permissions
-- (no se enumeran códigos; se toma el catálogo completo)
-- =====================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.company_id = :'company_id'::uuid
  AND r.name = 'Administrador'
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- =====================================================
-- Recepcionista -> exactamente 12 permisos aprobados
--
-- entrenadores.read: aprobado para que Recepcionista pueda elegir
-- entrenador al registrar una membresía Personalizado/Semipersonalizado.
-- El backend debe limitar el selector a id / full_name / state /
-- max_clients y NO exponer salary ni datos administrativos.
-- =====================================================

WITH reception_codes (code) AS (
    VALUES
        ('clientes.create'),
        ('clientes.read'),
        ('clientes.update'),
        ('membresias.read'),
        ('pagos.create'),
        ('pagos.read'),
        ('entrenadores.read'),
        ('apartado_diario.create'),
        ('apartado_diario.read'),
        ('apartado_diario.update'),
        ('asistencia.create'),
        ('asistencia.read')
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN reception_codes rc
JOIN permissions p ON p.code = rc.code
WHERE r.company_id = :'company_id'::uuid
  AND r.name = 'Recepcionista'
ON CONFLICT (role_id, permission_id) DO NOTHING;


COMMIT;


-- =====================================================
-- Verificación informativa (no modifica datos)
-- =====================================================

-- Roles creados para la empresa
SELECT r.name, r.description, r.state
FROM roles r
WHERE r.company_id = :'company_id'::uuid
ORDER BY r.name;

-- Cantidad de permisos por rol  (esperado: Administrador 37, Recepcionista 12)
SELECT r.name AS rol, COUNT(rp.permission_id) AS permisos
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
WHERE r.company_id = :'company_id'::uuid
GROUP BY r.name
ORDER BY r.name;
