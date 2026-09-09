#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"

command -v node >/dev/null 2>&1 || { echo "[LOI] Can Node.js 22.13 tro len." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "[LOI] Chua co Docker/Container Manager." >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "[LOI] Docker Compose chua san sang." >&2; exit 1; }

echo "============================================================="
echo " VNTECH ERP V5.3.0 FULL W2 - UNIVERSAL CENTRAL SERVER"
echo "============================================================="
VNTECH_FINAL_CLEAN_INSTALL=1 node scripts/universal-installer.mjs
