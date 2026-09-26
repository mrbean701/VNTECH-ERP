#!/bin/sh
set -eu
mkdir -p /backups/database /backups/files
while true; do
  stamp="$(date +%Y%m%d_%H%M%S)"
  echo "[VNTECH BACKUP] PostgreSQL $stamp"
  pg_dump --format=custom --compress=6 --file="/backups/database/vntech_erp_${stamp}.dump"
  if [ "${VNTECH_BACKUP_FILES_ENABLED:-0}" = "1" ]; then
    echo "[VNTECH BACKUP] Attachments $stamp (không nén)"
    mkdir -p "/backups/files/vntech_erp_files_${stamp}"
    cp -a /storage/. "/backups/files/vntech_erp_files_${stamp}/" || true
  fi
  find /backups/database -type f -name 'vntech_erp_*.dump' -mtime +"${VNTECH_BACKUP_RETENTION_DAYS:-30}" -delete || true
  find /backups/files -mindepth 1 -maxdepth 1 -type d -name 'vntech_erp_files_*' -mtime +"${VNTECH_BACKUP_RETENTION_DAYS:-30}" -exec rm -rf {} + || true
  sleep 86400
done
