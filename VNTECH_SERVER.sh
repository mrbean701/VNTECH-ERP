#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
[ -f .env ] || { echo "Chua co .env - hay chay 01_CAI_DAT_MAY_CHU_LINUX_NAS.sh" >&2; exit 2; }
[ -f deploy/.active-profile.json ] || { echo "Chua co active profile." >&2; exit 2; }
overlay=$(sed -n 's/.*"composeOverlay"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' deploy/.active-profile.json | head -1)
[ -n "$overlay" ] || overlay="deploy/compose.direct.yml"
base="docker compose --env-file .env -f deploy/docker-compose.yml -f $overlay"
cmd="${1:-status}"
case "$cmd" in
  start) sh -c "$base up -d" ;;
  stop) sh -c "$base down" ;;
  restart) sh -c "$base restart" ;;
  status) sh -c "$base ps" ;;
  logs) sh -c "$base logs --tail 200 app" ;;
  backup)
    stamp=$(date +%Y%m%d_%H%M%S)
    sh -c "$base run --rm --entrypoint sh backup -c 'pg_dump --format=custom --compress=6 --file=/backups/database/manual_${stamp}.dump'"
    ;;
  restore)
    dump="${2:-}"; [ -n "$dump" ] || { echo "Cach dung: ./VNTECH_SERVER.sh restore /duong/dan/file.dump" >&2; exit 2; }
    dump=$(cd "$(dirname "$dump")" && pwd)/$(basename "$dump")
    [ -f "$dump" ] || { echo "Khong tim thay $dump" >&2; exit 2; }
    sh -c "$base stop app backup" || true
    sh -c "$base run --rm -v '$dump:/restore/vntech.dump:ro' --entrypoint sh backup -c 'pg_restore --clean --if-exists --no-owner --no-privileges --dbname=\$PGDATABASE /restore/vntech.dump'"
    sh -c "$base up -d app backup"
    ;;
  migrate-v47)
    old="${2:-}"; [ -n "$old" ] || { echo "Cach dung: ./VNTECH_SERVER.sh migrate-v47 /duong/dan/.local-data" >&2; exit 2; }
    old=$(cd "$old" && pwd)
    sh -c "$base stop app backup" || true
    sh -c "$base run --rm -v '$old:/import/v47:ro' app node scripts/migrate-sqlite-to-postgres.mjs /import/v47/warehouse.sqlite /import/v47/files /data/storage"
    sh -c "$base up -d app backup"
    ;;
  *) echo "Lenh: start|stop|restart|status|logs|backup|restore|migrate-v47" >&2; exit 2;;
esac
