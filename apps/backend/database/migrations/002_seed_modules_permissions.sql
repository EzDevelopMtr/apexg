-- =====================================================
-- APEX GYM — Seed global
-- 002_seed_modules_permissions.sql
--
-- Ejecutar DESPUÉS de 001_initial_schema.sql.
-- Solo datos globales (independientes de company_id): modules y permissions.
-- No incluye roles, role_permissions ni datos de empresa.
--
-- Idempotente: puede volver a ejecutarse sin duplicar.
--   modules      -> ON CONFLICT (name)
--   permissions  -> ON CONFLICT (code)
--
-- IDs enteros: los genera PostgreSQL (IDENTITY). El código debe
-- localizar módulos y permisos por name / code, nunca por id fijo.
-- =====================================================

BEGIN;


-- =====================================================
-- Módulos globales
-- =====================================================

INSERT INTO modules (name, description, state) VALUES
    ('Usuarios',        'Gestión de usuarios y acceso del gimnasio',       1),
    ('Clientes',        'Gestión de clientes del gimnasio',                1),
    ('Membresias',      'Gestión de tipos y asignaciones de membresía',    1),
    ('Pagos',           'Registro y consulta de pagos y abonos',           1),
    ('Entrenadores',    'Gestión de entrenadores y comisiones',            1),
    ('Egresos',         'Gestión de egresos y categorías',                 1),
    ('Inventario',      'Gestión de inventario y mantenimiento',           1),
    ('Finanzas',        'Consulta de balances y reportes financieros',     1),
    ('Apartado diario', 'Gestión de la bitácora diaria',                   1),
    ('Asistencia',      'Registro y consulta de asistencia',               1),
    ('Auditoria',       'Consulta del registro de auditoría',              1)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    state       = EXCLUDED.state;


-- =====================================================
-- Permisos globales
-- module_id se resuelve por modules.name (sin IDs fijos).
-- =====================================================

INSERT INTO permissions (module_id, action, code, description)
SELECT m.id, v.action, v.code, v.description
FROM (
    VALUES
        -- Usuarios
        ('Usuarios',        'create', 'usuarios.create',         'Registrar usuarios'),
        ('Usuarios',        'read',   'usuarios.read',           'Consultar usuarios'),
        ('Usuarios',        'update', 'usuarios.update',         'Editar usuarios'),
        ('Usuarios',        'delete', 'usuarios.delete',         'Eliminar usuarios'),

        -- Clientes
        ('Clientes',        'create', 'clientes.create',         'Registrar clientes'),
        ('Clientes',        'read',   'clientes.read',           'Consultar clientes'),
        ('Clientes',        'update', 'clientes.update',         'Editar clientes'),
        ('Clientes',        'export', 'clientes.export',         'Exportar información de clientes'),

        -- Membresias
        ('Membresias',      'create', 'membresias.create',       'Crear tipos de membresía'),
        ('Membresias',      'read',   'membresias.read',         'Consultar membresías'),
        ('Membresias',      'update', 'membresias.update',       'Editar membresías'),
        ('Membresias',      'delete', 'membresias.delete',       'Eliminar membresías'),

        -- Pagos
        ('Pagos',           'create', 'pagos.create',            'Registrar pagos y abonos'),
        ('Pagos',           'read',   'pagos.read',              'Consultar pagos y abonos'),
        ('Pagos',           'export', 'pagos.export',            'Exportar información de pagos'),

        -- Entrenadores
        ('Entrenadores',    'create', 'entrenadores.create',     'Registrar entrenadores'),
        ('Entrenadores',    'read',   'entrenadores.read',       'Consultar entrenadores'),
        ('Entrenadores',    'update', 'entrenadores.update',     'Editar entrenadores'),
        ('Entrenadores',    'delete', 'entrenadores.delete',     'Eliminar entrenadores'),

        -- Egresos
        ('Egresos',         'create', 'egresos.create',          'Registrar egresos'),
        ('Egresos',         'read',   'egresos.read',            'Consultar egresos'),
        ('Egresos',         'update', 'egresos.update',          'Editar egresos'),
        ('Egresos',         'delete', 'egresos.delete',          'Eliminar egresos'),
        ('Egresos',         'export', 'egresos.export',          'Exportar información de egresos'),

        -- Inventario
        ('Inventario',      'create', 'inventario.create',       'Registrar artículos de inventario'),
        ('Inventario',      'read',   'inventario.read',         'Consultar inventario'),
        ('Inventario',      'update', 'inventario.update',       'Editar inventario'),
        ('Inventario',      'delete', 'inventario.delete',       'Eliminar artículos de inventario'),

        -- Finanzas
        ('Finanzas',        'read',   'finanzas.read',           'Consultar información financiera'),
        ('Finanzas',        'export', 'finanzas.export',         'Exportar información financiera'),

        -- Apartado diario
        ('Apartado diario', 'create', 'apartado_diario.create',  'Registrar bitácora diaria'),
        ('Apartado diario', 'read',   'apartado_diario.read',    'Consultar bitácora diaria'),
        ('Apartado diario', 'update', 'apartado_diario.update',  'Editar bitácora diaria'),

        -- Asistencia
        ('Asistencia',      'create', 'asistencia.create',       'Registrar asistencia'),
        ('Asistencia',      'read',   'asistencia.read',         'Consultar asistencia'),

        -- Auditoria
        ('Auditoria',       'read',   'auditoria.read',          'Consultar auditoría'),
        ('Auditoria',       'export', 'auditoria.export',        'Exportar registro de auditoría')
) AS v (module_name, action, code, description)
JOIN modules m ON m.name = v.module_name
ON CONFLICT (code) DO UPDATE SET
    module_id   = EXCLUDED.module_id,
    action      = EXCLUDED.action,
    description = EXCLUDED.description;


COMMIT;
