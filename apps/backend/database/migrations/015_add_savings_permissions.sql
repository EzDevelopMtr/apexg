-- =====================================================
-- APEX GYM — Migración 015
-- 015_add_savings_permissions.sql
--
-- Prerrequisito: 014_add_savings_pockets.sql aplicado.
--
-- Objetivo: el módulo Finanzas solo tenía permisos de lectura y exportación,
-- porque hasta ahora no había nada que escribir ahí — el balance se calcula,
-- no se registra. Los bolsillos de ahorro sí se crean y se abonan.
--
-- Solo para Administrador, no para Recepcionista: decidir cuánto de la
-- utilidad se aparta y para qué es una decisión de dueño, no de mostrador.
--
-- Idempotente en la parte de `permissions` (ON CONFLICT por code), igual que
-- el seed 002, para que reaplicarlo no duplique el catálogo global.
-- =====================================================

BEGIN;

INSERT INTO permissions (module_id, action, code, description)
SELECT m.id, v.action, v.code, v.description
FROM (
    VALUES
        ('Finanzas', 'create', 'finanzas.create', 'Crear bolsillos de ahorro y registrar aportes'),
        ('Finanzas', 'update', 'finanzas.update', 'Editar o cerrar bolsillos de ahorro')
) AS v(module_name, action, code, description)
JOIN modules m ON m.name = v.module_name
ON CONFLICT (code) DO UPDATE SET
    module_id   = EXCLUDED.module_id,
    action      = EXCLUDED.action,
    description = EXCLUDED.description;

-- Se los damos a todo rol llamado Administrador, de cualquier empresa: el
-- catálogo de permisos es global pero los roles son por empresa.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrador'
  AND p.code IN ('finanzas.create', 'finanzas.update')
ON CONFLICT DO NOTHING;

COMMIT;
