-- =====================================================
-- APEX GYM — Migración 016
-- 016_add_client_photo.sql
--
-- Prerrequisito: 015_add_savings_permissions.sql aplicado.
--
-- Objetivo: en el mostrador se reconoce a la gente por la cara, no por el
-- número de documento. Con la foto en la fila de ingreso, la recepcionista
-- confirma de un vistazo que quien está enfrente es quien dice ser.
--
-- Guarda el NOMBRE del archivo, no la imagen: un BYTEA por cliente hincha
-- cada backup y cada `SELECT *` que nadie pidió. Es el mismo trato que
-- `payments.receipt_path` (migración 008), y la carpeta vive fuera de
-- `public/` porque la cara de un menor de edad no se sirve por una URL
-- adivinable.
--
-- NULL = sin foto. La mayoría de los clientes viejos no tendrá, y eso no es
-- un dato faltante que haya que rellenar.
--
-- No idempotente (una migración se ejecuta una sola vez).
-- =====================================================

BEGIN;

ALTER TABLE clients ADD COLUMN photo_path VARCHAR(80);

COMMENT ON COLUMN clients.photo_path IS
  'Nombre del archivo en la carpeta de fotos, generado por el servidor. NULL = sin foto. La imagen nunca se guarda en la base.';

COMMIT;
