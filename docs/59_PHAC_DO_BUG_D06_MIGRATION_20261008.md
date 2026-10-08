# PHÁC ĐỒ XỬ LÝ `BUG-D06` — 40 NHÓM TRÙNG SỐ MIGRATION (đang làm ĐỎ cổng phát hành)

Phiên soạn: **`ERP-SESSION-04`** (`SESSION_D`) · Ngày: **08/10/2026** · Trạng thái: **PHÂN TÍCH XONG — ⛔ CHƯA SỬA GÌ** (chờ uỷ quyền `drizzle/**`)
Người thi hành đề xuất: **chủ `drizzle/**` + chủ `tools/gd-cycle.mjs`** (⚠️ ⛔ KHÔNG phải phiên 04 — ngoài phạm vi được uỷ quyền)

---

## 1. BẰNG CHỨNG (đo thật, vòng 72–73)

```text
npm run test:release-static
→ [RELEASE GATE] Package/source verifier
→ FULL W2 SOURCE PREFLIGHT: ĐẠT · 5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908   ✅
→ 🔴 Error: Migration chain phải có đúng 353 file (0000..0352), nhận 393.
→ RELEASE STATIC GATE: KHÔNG ĐẠT
```
| Số đo | Giá trị |
|---|---|
| Tổng file `.sql` trong `drizzle/` | **393** |
| Số **mã số** phân biệt (tiền tố 4 chữ số) | **353** (`0000` … `0352`) |
| Số **nhóm TRÙNG mã số** | **40** ⛔ |
| `scripts/verify-full-release.mjs:15` | `expectedMigrationCount = migrationHeadNumber + 1` = **353** ⇒ so `migrations.length` (**393**) ⇒ **throw** |

## 2. BẢN CHẤT 40 NHÓM TRÙNG (không phải «file rác»)

Mỗi mã số trùng chứa **HAI file KHÁC NHAU về nội dung**, thuộc **HAI DÒNG TÍNH NĂNG** khác nhau:
```text
nhóm [0225] x2:
  0225_phase_gd_mt3_f1_trung_tam_phe_duyet_binh_luan_chu_identity.sql
  0225_phase_gd_rut_gon_da_quy_trinh_phe_duyet_bo_mo_ta__identity.sql
nhóm [0226] x2: …mt3_f1b… | …uu_tien_buoc_da_duyet…        (… tương tự tới ~0264)
```
⇒ ⛔ **KHÔNG được xoá file nào** (xoá là **mất 1 lần làm mới fingerprint** của một dòng tính năng).
⇒ ⭐ **1 file = 1 lần `gd-cycle` của một dòng công việc** ⇒ **hai dòng chạy song song** ⇒ cùng tính ra một số kế tiếp ⇒ **trùng số**.

### Vì sao trùng: cơ chế cấp số hiện tại
⚠️ Nếu bộ sinh (`tools/gd-cycle.mjs`) lấy số kế tiếp theo **số lượng file** (hoặc theo «max đã đọc lúc bắt đầu»), thì **hai lần chạy đồng thời** (2 phiên DSH) sẽ cùng nhận **cùng một số** ⇒ ⭐ **đúng dấu vết đa phiên** mà `DEC-D15` của phiên 04 đã cảnh báo.

## 3. HAI SỰ THẬT QUYẾT ĐỊNH CÁCH SỬA (đã đọc mã, ⛔ không suy đoán)

### 3.1 Bộ theo dõi khoá theo **TÊN ĐẦY ĐỦ file** ⇒ ⚠️ ĐỔI TÊN = CHẠY LẠI
| Bằng chứng | Nội dung |
|---|---|
| `scripts/local-runtime.mjs:144` | `CREATE TABLE IF NOT EXISTS __mep_migrations (name …)` |
| `:149` + `:158` | `SELECT name FROM __mep_migrations` ⇒ `Set` ⇒ `INSERT … VALUES (name, applied_at)` |
| `scripts/migrate-postgres.mjs:346` | `name text PRIMARY KEY NOT NULL` · `:363` `INSERT INTO __mep_migrations(name,applied_at)` |
| `scripts/universal-runtime.mjs:57-67` | như trên |
⇒ ⭐ **Hệ quả**: đổi tên một file **đã áp** ⇒ tên mới **không** có trong bảng ⇒ máy sẽ **CHẠY LẠI** file đó.

### 3.2 Nhưng các file trùng là **metadata identity** ⇒ CHẠY LẠI **AN TOÀN** ✅
Nguyên văn đầu file (`0225_…_identity.sql`):
> *«VNTECH ERP V5.3.0 … (metadata identity refresh) — **Không đổi nghiệp vụ và không đổi schema**. Chỉ cập nhật source fingerprint sau khi thay đổi mã nguồn …»*
> *«Giai đoạn này không thay đổi cấu trúc dữ liệu.»*

và toàn bộ thân file là **`DROP TRIGGER IF EXISTS …` / `CREATE TRIGGER …`** ⇒ ⭐ **idempotent** ⇒ chạy lại **không** hỏng dữ liệu, **không** đổi schema.

## 4. BA PHƯƠNG ÁN (kèm rủi ro thật)

| # | Phương án | Việc phải làm | Rủi ro | Đánh giá |
|---|---|---|---|---|
| **A** | **Đánh số lại** 40 file trùng lên `0353..0392` | ① đổi tên 40 file ② chạy migration (40 file **chạy lại** — an toàn ✅) ③ sửa `expectedMigrationCount` ⇒ **393** | 🟡 Trung bình — ⚠️ **40 file bị coi là mới** ⇒ chạy lại trên **mọi môi trường** (local/Postgres); ⚠️ nếu môi trường nào có một file **cùng tên mới** thì xung đột; ⚠️ lịch sử `gd-cycle` bị «nhảy số» | Chỉ nên làm nếu dự án **buộc** mã số duy nhất |
| **B** | ⭐ **Tách số đếm trong CỔNG** (`scripts/verify-full-release.mjs`) | Đếm **migration schema** và **identity refresh** **RIÊNG**: `schema.length === migrationHeadNumber + 1` **VÀ** `identity.length > 0` (hoặc cho phép trùng số với `*_identity.sql`) | 🟢 **Thấp** — ⛔ **không đụng 1 file migration nào** ⇒ ⛔ không chạy lại gì, ⛔ không đổi CSDL | ⭐ **KHUYẾN NGHỊ** — đúng bản chất: identity **không phải** schema migration |
| **C** | ⭐ **Chặn nguyên nhân gốc** ở bộ sinh (`tools/gd-cycle.mjs`) | Cấp số kế tiếp = **quét thư mục lấy MAX + 1** (⛔ không dùng «số lượng file» / giá trị đọc lúc đầu) + ⛔ **khoá chống chạy song song** (lock file) | 🟢 Thấp — chỉ đổi chỗ sinh số | ⭐ **PHẢI LÀM TRƯỚC** (nếu không, trùng số sẽ **tái sinh** sau mỗi lần 2 phiên cùng build) |

## 5. ĐỀ XUẤT THỨ TỰ THI HÀNH (an toàn nhất)

```text
BƯỚC 1 (C)  Sửa bộ sinh số trong tools/gd-cycle.mjs: MAX+1 + lock chống song song
            ⇒ ⛔ dừng «chảy máu» (mỗi lần 2 phiên build là +1 nhóm trùng)
BƯỚC 2 (B)  Sửa scripts/verify-full-release.mjs: tách số đếm schema vs identity
            ⇒ ✅ cổng phát hành XANH LẠI mà ⛔ KHÔNG đụng CSDL, ⛔ KHÔNG chạy lại migration
BƯỚC 3 (A)  CHỈ KHI cần mã số duy nhất tuyệt đối: đánh số lại 40 file (đã chứng minh an toàn ✅)
            ⇒ ⚠️ phải làm khi KHÔNG phiên nào đang build, và phải chạy lại migration có kiểm soát
```

## 6. VIỆC PHIÊN 04 ĐÃ LÀM / CHƯA LÀM (minh bạch)

- ✅ **ĐÃ LÀM (chỉ đọc + phân tích)**: chạy cổng, đếm 393/353/40, đọc 4 nơi dùng `__mep_migrations`, đọc 2 file trùng để xác minh **tính idempotent**, truy nguyên nhóm trùng theo **2 dòng tính năng**
- ⛔ **CHƯA LÀM (⛔ ngoài uỷ quyền)**: ⛔ **không** đổi tên file nào · ⛔ **không** sửa `gd-cycle.mjs` / `verify-full-release.mjs` · ⛔ **không** chạy lại migration nào
- 📌 **Ghi nhận**: cổng phát hành **đang ĐỎ** ⇒ ⚠️ **chặn go-live** cho tới khi chọn xong phương án
