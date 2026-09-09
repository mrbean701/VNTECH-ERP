# VNTECH ERP – Project Navigation Fingerprint Refresh Fix

Ngày: 08/09/2026

## Root cause

Project Navigation thay đổi source hợp lệ (`app/page.tsx`, regression/preflight contract) nhưng release identity vẫn giữ source fingerprint của MASTER BASELINE trước thay đổi. `verify-vntech-fingerprint.mjs` vì vậy chặn cài đặt đúng thiết kế Trust Lock.

- Expected cũ: `7f76ccf7c21946d07ac670fb23c98ad04809aa2e9e144263f60fffa787de0d24`
- Calculated source mới: `31cb2728606df468efa00fed311063c86708cd775db620a9cb8d96f097e8a3f2`
- Source fingerprint short mới: `VNTECH-FP-31CB2728606DF468`
- Brand fingerprint mới: `f78676950be10bee6bf18985dfb39a84f685b09d87ec181696509d6e04caff21`
- Release fingerprint: giữ nguyên vì build/package/UI contract/migration head không đổi.

## Phạm vi fix

Chỉ refresh public release identity / Trust metadata cho source Project Navigation đã chốt:

- `lib/vntech-identity-data.mjs`
- `VNTECH_FINGERPRINT.json`
- `VNTECH_PRODUCT_IDENTITY.txt`
- `drizzle/0049_master_baseline_identity_refresh_r1_1_1.sql` (metadata identity refresh; không đổi schema/business data)
- `MANIFEST_SHA256.txt` tái sinh sau fix

Không sửa navigation logic, BOQ, API, workflow, RBAC, database schema hoặc CSS.
