-- 013: weekly_visits deja de admitir NULL.
--
-- La 012 dio cupo a todos los planes, asi que NULL ya no describe ningun
-- estado real. Mientras la columna lo permita, cada capa por encima tiene que
-- seguir preguntandose que hacer con "sin tope" — una rama que nunca se
-- ejecuta pero que hay que leer, probar y mantener.
--
-- 6 por defecto: con el domingo cerrado es el acceso completo, de modo que un
-- plan creado sin decidir el cupo queda en lo mas permisivo y no en lo mas
-- restrictivo. Equivocarse hacia el lado de dejar entrar es preferible a
-- bloquear a alguien que pago.

ALTER TABLE membership_types
  ALTER COLUMN weekly_visits SET DEFAULT 6;

UPDATE membership_types SET weekly_visits = 6 WHERE weekly_visits IS NULL;

ALTER TABLE membership_types
  ALTER COLUMN weekly_visits SET NOT NULL;
