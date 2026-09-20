-- 012: todo plan lleva un cupo semanal; se acaba el NULL.
--
-- "Sin límite" confundía en el formulario: quien crea un plan no distingue a
-- simple vista entre "sin tope" y "aún no lo he puesto", y ese vacío es
-- justamente el estado que dejaba pasar los siete días.
--
-- Los planes que no tenían tope pasan a 6, que con el domingo cerrado es
-- acceso completo. No pierden nada: ninguno podía usarse más de seis días por
-- semana de todos modos, y los cortos (Día, Semana, Quincena) siguen limitados
-- de verdad por su fecha de vencimiento, que es otra cosa y no cambia.

UPDATE membership_types
SET weekly_visits = 6
WHERE weekly_visits IS NULL;
