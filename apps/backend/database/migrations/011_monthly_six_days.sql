-- 011: la mensualidad queda en 6 visitas por semana.
--
-- "Mensualidad (lunes a sábado)" llevaba el limite solo en el nombre y
-- `weekly_visits` en NULL, es decir sin tope: el sistema habria aceptado los
-- siete dias.
--
-- Se fija 6 y no una lista de dias permitidos porque el gimnasio no abre los
-- domingos: con la puerta cerrada, contar seis visitas y prohibir el domingo
-- dan el mismo resultado, y la cifra es un dato que cualquiera entiende. Si
-- algun dia abren domingo, esto deja de alcanzar y hara falta guardar los dias
-- habilitados por plan.

UPDATE membership_types
SET weekly_visits = 6
WHERE name ILIKE 'Mensualidad%';
