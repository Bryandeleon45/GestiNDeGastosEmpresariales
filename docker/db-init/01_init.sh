#!/bin/sh
# Inicializa la base de datos local aplicando migraciones y semillas en orden.
# Solo se ejecuta cuando el volumen de PostgreSQL está vacío.
set -e

# Si existe una copia de la base de datos local, se restaura tal cual
# (esquema, datos, triggers, etc.) en lugar de ejecutar migraciones y semillas.
if [ -f /local-db/local.sql ]; then
  echo "[db-init] Restaurando copia de la base de datos local..."
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /local-db/local.sql
  echo "[db-init] Base de datos local restaurada correctamente."
  exit 0
fi

aplicar_semillas() {
  for archivo in /seeds/*.sql; do
    echo "[db-init] Aplicando semilla: $(basename "$archivo")"
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$archivo"
  done
}

semillas_aplicadas=0

for archivo in /migrations/*.sql; do
  echo "[db-init] Aplicando migracion: $(basename "$archivo")"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$archivo"

  # Las semillas de usuarios/roles deben existir antes de 020 (presupuestos y
  # permisos) y antes de 060 (oportunidades de demostración del portal).
  if [ "$semillas_aplicadas" -eq 0 ] && [ "$(basename "$archivo")" = "003_ajustes_modulo_usuarios.sql" ]; then
    aplicar_semillas
    semillas_aplicadas=1
  fi
done

if [ "$semillas_aplicadas" -eq 0 ]; then
  aplicar_semillas
fi

echo "[db-init] Base de datos inicializada correctamente."
