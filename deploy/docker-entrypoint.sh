#!/bin/sh
set -eu
cd /app

echo "[VNTECH ERP] Xac nhan runtime FULL W2..."
node scripts/verify-built-ui-contract.mjs --runtime

if [ "${VNTECH_DB_ENGINE:-postgres}" = "postgres" ] || [ "${VNTECH_DB_ENGINE:-postgres}" = "postgresql" ]; then
  echo "[VNTECH] Cho PostgreSQL san sang..."
  attempt=0
  until node --input-type=module -e '
    const m=await import("pg"); const api=m.default??m; const Pool=api.Pool??m.Pool;
    const p=new Pool({connectionString:process.env.DATABASE_URL,max:1,connectionTimeoutMillis:2000});
    try { await p.query("SELECT 1"); } finally { await p.end(); }
  ' >/dev/null 2>&1; do
    attempt=$((attempt+1))
    if [ "$attempt" -ge 30 ]; then
      echo "[VNTECH] PostgreSQL chua san sang sau 30 lan thu." >&2
      exit 75
    fi
    sleep 2
  done

  echo "[VNTECH] Kiem tra va cap nhat PostgreSQL..."
  # Deterministic migration errors must stop immediately; do not retry the same bad SQL 20 times.
  node scripts/migrate-postgres.mjs
fi

if [ "$#" -gt 0 ]; then
  exec "$@"
fi
exec node scripts/universal-server.mjs
