-- 009: deja payment_method en solo dos valores, cash y transfer.
--
-- Nequi, Bancolombia y tarjeta acaban igual para el gimnasio: el dinero entra
-- a la cuenta y hay una pantalla que lo prueba. Lo único sobre lo que el
-- sistema decide es si hay comprobante que adjuntar, y eso es una división en
-- dos. Mantener cinco valores solo alargaba el desplegable y daba tres cosas
-- más que sincronizar entre capas.
--
-- Las filas existentes con otro valor pasan a 'transfer': todas lo eran en el
-- sentido que importa, dinero que llegó por fuera de la caja.
--
-- La columna sigue siendo VARCHAR libre (ver CLAUDE.md, "Sin ENUM"), así que
-- quien impone los dos valores es el DTO, no la base.

UPDATE payments
SET payment_method = 'transfer'
WHERE payment_method NOT IN ('cash', 'transfer');
