#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d .local-data ]; then
  echo "Không tìm thấy dữ liệu để sao lưu."
  exit 1
fi

mkdir -p .local-backups
stamp="$(date +%Y%m%d-%H%M%S)"
archive=".local-backups/mep-warehouse-${stamp}.tar.gz"
tar -czf "$archive" .local-data
echo "Đã tạo bản sao lưu: $archive"
