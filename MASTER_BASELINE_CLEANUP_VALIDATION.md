# MASTER BASELINE R1.1.1 FINAL — VALIDATION

Ngày: 08/09/2026

## Gate đã PASS trên source hiện tại

- JS/MJS syntax: **PASS — 57 file trên cây source/release hiện tại**.
- Shell syntax: **PASS — 11 file**.
- Source preflight: **PASS**.
- CSS baseline audit: **PASS — 2.725 dòng / 400.653 B / 4.950 `!important` / dead class=0 / dead var=0 / dynamic contract=PASS / empty media=0 / historical marker=0**.
- Master Baseline architecture gate: **PASS**.
- Source/brand/release fingerprint verifier: **PASS — 171 source file**.
- PostgreSQL migration preflight: **PASS — 50 file / 554 statements / head 0049**.
- SQL bind arity: **PASS — 510 literal + 6 dynamic-controlled**.
- Template preflight: **PASS — 5 XLSX + 4 CSV**.
- OpenXML preflight: **PASS — 5 XLSX**.
- Visual RGB/computed-style equivalence: **PASS — 12/12 trạng thái, 0 pixel diff, 0 computed-style diff**.
- Core MJS regression không cần build artifact: **PASS — 44/44** (Mobile + Runtime/Admin/BOQ + Security + Trust; test `rendered-html` được tách vì yêu cầu `dist/server/index.js`).
- Admin import/role/org: **PASS — 10/10** bằng global ts-node loader.
- Email dispatcher: **PASS** (SMTP auth → MIME message → sent status).
- Local runtime fresh migration: **PASS — 50 migrations, head 0049**.
- Local storage contract: **PASS — put/get/delete/get=null**.
- Upgrade R1.1 → R1.1.1: **PASS — 49/0048 → 50/0049, fingerprint được refresh đúng**.

## Identity/lineage

- Source fingerprint: `7f76ccf7c21946d07ac670fb23c98ad04809aa2e9e144263f60fffa787de0d24`.
- Fingerprint short: `VNTECH-FP-7F76CCF7C21946D0`.
- Brand fingerprint: `e4fce926e21c0627cb82d8d35f413255f120f1e77312b6be5e9ecc08151146ba`.
- Release fingerprint: `add41b0f41d3b7753b59ec0ef5fd6d495c1018d5825e2ef64111b7195d3a6a5b`.
- Migration range: `0000..0049`.
- Migration head: `0049_master_baseline_identity_refresh_r1_1_1.sql`.

## Kiểm soát hồi quy CSS

Bản R1.1 aggressive trước đó từng xóa nhầm `.nav-glyph-green` và làm suy yếu base `.nav-glyph`. R1.1.1 đã:

1. phục hồi contract đầy đủ;
2. thay chiến lược cleanup bằng safe-clean;
3. thêm audit hai chiều Source ↔ CSS;
4. thêm regression test cho dynamic CSS classes;
5. xác minh visual settled-state 12/12.

## Giới hạn môi trường còn mở

Môi trường kiểm định này không tải hoàn tất dependency từ npm registry (`EAI_AGAIN`), nên **full ESLint + TypeScript + production build + rendered-html/workflow-direct dựa trên dependency cục bộ không được gắn PASS giả**. Lần `npm ci` đã dừng do DNS/registry, không phải do lỗi source được phát hiện.

Bộ cài không đóng gói `node_modules`/`dist`; installer vẫn tự cài dependency/build và chỉ được coi là cài thành công khi preflight/build/runtime health trên máy đích đạt. Đây là giới hạn môi trường kiểm định, không được che thành PASS.

## Staging sạch trước đóng ZIP

Staging được tạo mới từ source R1.1.1 và loại toàn bộ `node_modules`, `.sites-runtime`, `dist`, `.next`, `.local-data`, backup/log/cache/runtime artifact. Trên staging sạch:

- release manifest: **PASS — 193 file được băm**;
- strict package/source verifier: **PASS**;
- source preflight + CSS audit + Master Baseline gate + fingerprint + migration/SQL/template/OpenXML: **PASS**;
- core MJS regression: **44/44 PASS**;
- admin import/role/org: **10/10 PASS**;
- email dispatcher: **PASS**;
- Local runtime fresh migration/storage: **PASS — 50 migration, head 0049, put/get/delete/get=null, fingerprint đúng**.

Không có dependency/cache/runtime artifact được phép đi vào ZIP phát hành.

## Điều kiện đóng gói FINAL

- staging phải loại `node_modules`, `.sites-runtime`, `dist`, `.next`, `.local-data`, backup/log/cache;
- tái sinh `MANIFEST_SHA256.txt` trên staging;
- strict package verifier, source preflight, CSS/Master gate, fingerprint, migration/SQL/template/OpenXML và regression độc lập phải chạy lại trên **clean-extract chính ZIP FINAL**;
- checksum ZIP phải được phát hành kèm.
