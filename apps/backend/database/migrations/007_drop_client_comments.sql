-- 007: quita clients.comments.
--
-- Pedía texto libre que nadie volvía a leer, así que el formulario dejó de
-- ofrecerlo y la columna se queda sin quien la escriba. Se elimina en vez de
-- dejarla muerta: una columna que ya nadie llena termina leyéndose como un
-- dato que existe y está vacío, que es peor que no tenerlo.
--
-- Destructivo: borra lo que hubiera guardado. Autorizado explícitamente por
-- el usuario — los datos actuales son de prueba.

ALTER TABLE clients DROP COLUMN IF EXISTS comments;
