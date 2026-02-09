#!/usr/bin/env bash
set -euo pipefail

# Requiere secret en GitHub: DTS_DATABASE_URL
: "${DTS_DATABASE_URL:?ERROR: DTS_DATABASE_URL no está definido}"

OUTDIR="supabase/functions"
mkdir -p "$OUTDIR"

echo "Exportando RPCs desde DB → $OUTDIR"

# Exporta funciones del schema public cuyo nombre empiece por dts_
# Formato: function_name<TAB>ddl
psql "$DTS_DATABASE_URL" \
  -v ON_ERROR_STOP=1 \
  -At \
  -F $'\t' \
  -c "
    select
      p.proname as function_name,
      pg_get_functiondef(p.oid) as ddl
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like 'dts\_%' escape '\'
    order by p.proname;
  " \
| while IFS=$'\t' read -r fname ddl; do
    # Limpieza mínima por si acaso
    fname="$(echo "$fname" | tr -d '\r' | xargs)"
    if [[ -z "$fname" ]]; then
      continue
    fi

    file="$OUTDIR/${fname}.sql"
    printf "%s\n" "$ddl" > "$file"

    bytes=$(wc -c < "$file" | tr -d ' ')
    if [[ "$bytes" -lt 50 ]]; then
      echo "⚠️  WARNING: $file exportado muy pequeño ($bytes bytes)"
    else
      echo "✅ $file ($bytes bytes)"
    fi
done

echo "Done."
