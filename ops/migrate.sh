#!/bin/sh
# Aplica, en orden, las migraciones que la base todavía no registra en
# schema_migrations. Cada una corre con ON_ERROR_STOP y su propio BEGIN/COMMIT:
# si una falla, se detiene ahí y no se registra. Idempotente.
set -eu

psql -v ON_ERROR_STOP=1 -c "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())" >/dev/null

for file in $(ls /migrations/*.sql | sort); do
  name=$(basename "$file")
  applied=$(psql -tAc "SELECT 1 FROM schema_migrations WHERE name = '$name'")
  if [ "$applied" != "1" ]; then
    echo "Aplicando $name"
    psql -v ON_ERROR_STOP=1 -f "$file"
    psql -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations (name) VALUES ('$name')" >/dev/null
  fi
done
echo "Migraciones al día."
