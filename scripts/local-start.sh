#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d .local-data ]; then
  echo "Chưa có dữ liệu cục bộ. Hãy chạy npm run local:setup trước."
  exit 1
fi

npm run build
./node_modules/.bin/wrangler d1 migrations apply DB --local --persist-to .local-data --config wrangler.local.jsonc
./node_modules/.bin/wrangler dev --local --persist-to .local-data --config wrangler.local.jsonc --ip 0.0.0.0 --port 8787
