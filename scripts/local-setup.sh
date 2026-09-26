#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "Cần cài Node.js 22 trở lên trước khi thiết lập."
  exit 1
fi

node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [ "$node_major" -lt 22 ]; then
  echo "Phiên bản Node.js phải từ 22 trở lên."
  exit 1
fi

npm install --no-audit --no-fund
npm run build
./node_modules/.bin/wrangler d1 migrations apply DB --local --persist-to .local-data --config wrangler.local.jsonc
mkdir -p .local-backups

echo "Thiết lập hoàn tất. Chạy npm run local:start để mở phần mềm."
