#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DTS_DATABASE_URL:-}" ]]; then
  echo "ERROR: DTS_DATABASE_URL no está definido."
  exit 1
fi

OUT_DIR="supabase/functions"
mkdir -p "$OUT_DIR"

echo "Exportando RPCs desde DB → $OUT_DIR"

mapfile -t OIDS < <(
  psql "$DTS_DATABASE_URL" -Atc "
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like 'dts_%'
    order by p.proname asc, p.oid asc;
  "
)

if [[ "${#OIDS[@]}" -eq 0 ]]; then
  echo "WARNING: no se encontraron funciones public.dts_%"
  exit 0
fi

declare -A COUNT_BY_NAME
while IFS=$'\t' read -r name; do
  COUNT_BY_NAME["$name"]=$(( ${COUNT_BY_NAME["$name"]:-0} + 1 ))
done < <(
  psql "$DTS_DATABASE_URL" -Atc "
    select p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.proname like 'dts_%';
  "
)

exported=0

for oid in "${OIDS[@]}"; do
  fname="$(psql "$DTS_DATABASE_URL" -Atc "select p.proname from pg_proc p where p.oid=${oid};")"

  if [[ "${COUNT_BY_NAME[$fname]:-1}" -gt 1 ]]; then
    file="$OUT_DIR/${fname}__${oid}.sql"
  else
    file="$OUT_DIR/${fname}.sql"
  fi

  ddl="$(psql "$DTS_DATABASE_URL" -Atc "select pg_get_functiondef(${oid});")"
  printf "%s\n" "$ddl" > "$file"
  exported=$((exported + 1))
  echo "  ✓ $file"
done

echo "OK: exportadas ${exported} RPCs."
