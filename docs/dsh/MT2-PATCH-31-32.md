# MT2 — BẢN VÁ #31 & #32 (ĐÃ VIẾT + KIỂM CHỨNG, SAU ĐÓ **HOÀN TÁC** ĐỂ CHỜ USER QUYẾT)

> TRẠNG THÁI: **CHƯA ÁP DỤNG** (đã hoàn tác bằng `git checkout` để repo trở lại đúng trạng thái user đã thấy)
> ⛔ NO COMMIT · NO PUSH · Cập nhật: **23/09/2026** · Liên quan: `MT2_BLOCKER_DECISION_BRIEF.md` §⑤.5

---

## 1. VÌ SAO PHẢI HOÀN TÁC (nói thẳng)
* 2 bản vá này sửa tệp trong **`scripts/`** — mà `scripts/` **NẰM TRONG `ROOT_DIRS`** của **fingerprint phát hành** (xem `tools/gd-cycle.mjs:3`: «mỗi khi sửa file trong ROOT_DIRS (app/ lib/ scripts/ drizzle/ …)»).
* ⇒ Sau khi vá, cổng **`test:release-static` tầng ③ «Brand fingerprint verifier» báo ĐỎ** vì **danh tính `VNTECH-FP-…` đã đổi** ⇒ muốn xanh phải **làm mới danh tính + build lại**.
* ⛔ Tôi **KHÔNG tự làm mới danh tính phát hành** (đây là mục **⑤.5** đang chờ user) ⇒ thay vào đó **hoàn tác** để repo về trạng thái NHẤT QUÁN như trước, và **lưu bản vá ở đây** để áp lại trong 1 bước khi user đồng ý.
* ✅ **ĐÃ KIỂM CHỨNG SAU HOÀN TÁC:** `git status --porcelain` cho 3 tệp = **rỗng (sạch)** · `npm run verify:fingerprint` ⇒ **ĐẠT · `VNTECH-FP-7A4835FBC5BCBCA7` · source:513 files**.

## 2. BẢN VÁ #31 — `scripts/generate-release-manifest.mjs` (manifest chứa TỆP TRẠNG THÁI)
**Lỗi (bằng chứng nguyên văn của cổng):**
```text
Error: SHA256 không khớp: .ai/orchestration/MASTER_STATE.md
RELEASE STATIC GATE: KHÔNG ĐẠT · Package/source verifier
```
**Nguyên nhân:** `MANIFEST_SHA256.txt` (7.579 dòng) chứa **15 đường dẫn là tệp trạng thái nội bộ hay đổi** (`.ai/**` 5 · `.memsearch/**` 10) ⇒ cứ agent ghi là checksum lệch. ⛔ Không phải lỗi mã sản phẩm.
**ĐÍCH SỬA:** `const excludedTopDirs = new Set([...])` (dòng 9–12) — thêm 2 mục:
```js
  '.ai', '.memsearch'
```
**Vì sao ⛔ KHÔNG đổi chính sách:** chính tệp này đã loại `.sites-runtime`, `.vntech_update_state`, `.local-data`… và in ra «volatile cache/log/update-backup state excluded» ⇒ 2 mục trên **cùng nhóm**, chỉ là **thiếu sót**.
**KIỂM CHỨNG ĐÃ CHẠY (khi còn áp dụng):** sinh lại manifest ⇒ **7.579 → 7.561 dòng** · dòng `.ai/` = **0** · dòng `.memsearch/` = **0**; cổng **vượt qua tầng ①**.

## 3. BẢN VÁ #32 — `scripts/migrate-postgres.mjs` (bộ chuyển đổi thiếu ánh xạ `datetime(n)`)
**Lỗi (nguyên văn, tầng ② «Migration verification»):**
```text
Error: 0080_phase_p4_workflow_multi_identity.sql: con cu phap SQLite sau khi chuyen doi (datetime()):
CREATE TABLE IF NOT EXISTS "workflow_definitions" (
```
**Nguyên nhân:** bộ kiểm `assertTranslatedSql` (dòng **228**) bắt **MỌI** mẫu `\bdatetime\s*\(` còn sót; bộ chuyển đổi **chưa ánh xạ** kiểu cột MySQL `datetime(n)` (tệp `drizzle/0080_phase_p4_workflow_multi_identity.sql` dùng `datetime(3)` **6 lần**).
**ĐÍCH SỬA:** trong khối `.replace` (dòng 147–152) — **THÊM** dòng sau **TRƯỚC** quy tắc `datetime('now')`:
```js
    .replace(/\bdatetime\s*\(\s*(\d+)\s*\)/gi, "timestamp($1)")
```
*(regex yêu cầu **chữ số** trong ngoặc ⇒ ⛔ không nuốt dạng `datetime('now')`; `timestamp(3)` là cú pháp PostgreSQL hợp lệ.)*
**KIỂM CHỨNG ĐÃ CHẠY (khi còn áp dụng):** `node scripts/migrate-postgres.mjs --preflight` ⇒ **EXIT = 0** · «PostgreSQL migration preflight: DAT · **221 files · 852 statements**» ⇒ cổng **vượt qua tầng ②**.

## 4. MUỐN ÁP LẠI — QUY TRÌNH 4 BƯỚC (đúng thứ tự, ⛔ không đảo)
```text
1) Áp 2 bản vá ở §2 và §3 vào 2 tệp scripts/ (dùng công cụ `edit`, ⛔ không dùng PowerShell ghi tệp)
2) LÀM MỚI DANH TÍNH:  node tools/gd-cycle.mjs "<NHÃN GIAI ĐOẠN>" --no-build
3) BUILD LẠI:          npm run build            (bước này BẮT BUỘC để :8787 phục vụ bundle mới)
4) SINH LẠI MANIFEST:  node scripts/generate-release-manifest.mjs
   RỒI KIỂM:           npm run test:release-static        (kỳ vọng ĐẠT cả 3 tầng)
   VÀ KIỂM LẠI:        npm run verify:fingerprint         (kỳ vọng ĐẠT với mã FP MỚI)
```
⚠️ **Hệ quả phải chấp nhận khi áp lại:** danh tính **`VNTECH-FP-7A4835FBC5BCBCA7` sẽ BỊ THAY** bằng mã mới ⇒ phải cập nhật mọi hồ sơ ghi mã cũ (`MT2_EXECUTION_STATE.md`, `MT2_PHASE_TASK_LIST.md`, `MASTER_STATUS.md`, `MT2_FINAL_AUDIT_DRAFT.md` §A.1) và **bundle mới sẽ có tên asset khác** (`dist/…/page-XXXX.js`) ⇒ cập nhật dòng «bundle đang phục vụ».

## 5. LIÊN QUAN
* Quyết định đang chờ: **`MT2_BLOCKER_DECISION_BRIEF.md` §⑤.5** — **(A)** áp lại + làm mới danh tính + build · **(B)** giữ nguyên trạng thái hiện tại (2 lỗi công cụ đã ghi nhận, ⛔ chưa vá) · **(C)** áp lại nhưng **không** làm mới danh tính (⚠️ cổng ③ sẽ đỏ — ⛔ tôi không khuyến nghị).
* Bằng chứng gốc: `MT2_GATE_SWEEP_23-09.md` §H (khối «ĐÍNH CHÍNH CHÍNH BẢN ĐÍNH CHÍNH» — 3 tầng của cổng).
