-- =====================================================
-- APEX GYM — Migración 022
-- 022_platform_admins.sql
--
-- Objetivo: el super admin (docs/plan-multi-gimnasio.md, fase 4).
--
-- `platform_admins` existe desde 001 y nunca se usó (está vacía): se vuelven
-- obligatorios email y contraseña, y `state` toma el mismo criterio que
-- `users` (1 activo). El email se guarda en minúsculas; lo impone el código.
--
-- `audit_logs.platform_admin_id`: la tabla existe desde 001 sin uso. Se
-- reutiliza para registrar qué hizo el super admin (crear, suspender,
-- cambiar marca, restablecer contraseñas) en vez de abrir otra.
-- =====================================================

BEGIN;

ALTER TABLE platform_admins ALTER COLUMN email SET NOT NULL;
ALTER TABLE platform_admins ALTER COLUMN password SET NOT NULL;
ALTER TABLE platform_admins ALTER COLUMN full_name SET NOT NULL;
UPDATE platform_admins SET state = 1 WHERE state IS NULL;
ALTER TABLE platform_admins ALTER COLUMN state SET DEFAULT 1;
ALTER TABLE platform_admins ALTER COLUMN state SET NOT NULL;

ALTER TABLE audit_logs
  ADD COLUMN platform_admin_id UUID REFERENCES platform_admins (id);

COMMIT;
