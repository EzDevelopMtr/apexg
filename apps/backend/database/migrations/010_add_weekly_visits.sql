-- 010: cupo semanal de visitas por plan.
--
-- El plan "Mes 3 veces por semana" llevaba su límite SOLO en el nombre, como
-- texto. Nada en el sistema podía compararlo, así que no había forma de saber
-- si alguien con derecho a 3 días venía 4.
--
-- NULL significa "sin tope semanal", no "muchos": la mensualidad corrida no
-- tiene límite, y escribir 7 inventaría una regla que nadie acordó y volvería
-- indistinguible "ilimitado" de "siete".

ALTER TABLE membership_types
  ADD COLUMN IF NOT EXISTS weekly_visits INTEGER;

UPDATE membership_types
SET weekly_visits = 3
WHERE name ILIKE '%3 veces por semana%';
