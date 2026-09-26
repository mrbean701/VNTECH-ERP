# TASK-034 — GỠ CHẶN DỰNG BUNDLE UI (**ĐƯỜNG GĂNG ĐÃ THÔNG**)

**Trạng thái:** ✅ DONE — `npm run build` **EXIT 0** · UI `:8787` + proxy `:9000` đang phục vụ **bản MỚI** · hồi quy **59/61** (đúng 2 ca đã biết)
**Ngày:** 17/09/2026 · **Nhánh:** `unity` · **Người dùng cho phép:** tái lập định danh + dừng đúng 2 tiến trình cũ (chốt trong phiên)

---

## 1. Vì sao đây là đường găng

Từ TASK-033, mọi thay đổi giao diện **không thể kiểm chứng lúc chạy**: `dist` cũ hơn nguồn, `npm run build` bị cổng
dấu vân tay chặn, mà `scripts/local-server.mjs:20` lại **nạp `dist/server/index.js` một lần lúc khởi động**
⇒ dựng lại `dist` **chưa đủ**, còn phải **khởi động lại tiến trình UI**. Toàn bộ §8.1/§8.2/§8.3 (TASK-072 → 075)
vì thế chỉ được chứng minh bằng **phép đo TĨNH**.

## 2. ĐÍNH CHÍNH hồ sơ cũ (quan trọng)

`TASK-INDEX` ghi: *"**KHÔNG có script GHI** (chỉ có `verify:fingerprint` để đọc)"* — **SAI**.
Công cụ ghi **tồn tại**: **`tools/refresh-phase-identity.mjs <head-file.sql> <label>`**, chạy theo cơ chế
**fixed point** (literal 64-hex được bộ chuẩn hoá che ⇒ băm lại vẫn bằng chính nó, tự khẳng định
`Fixed point stable: OK`).

## 3. Đã làm (theo đúng cơ chế của dự án, không tắt cổng)

| Bước | Việc | Bằng chứng |
|---|---|---|
| 1 | Tạo head mới `drizzle/0109_phase1_ui_identity.sql` (comment-only + khối identity do công cụ sinh) | công cụ tự append: `DROP TRIGGER` → `UPDATE vntech_product_identity SET source_fingerprint=…` → **tạo lại 2 trigger chống sửa/xoá** |
| 2 | Chạy `node tools/refresh-phase-identity.mjs 0109_phase1_ui_identity.sql "PHASE 1 - UI COMPLETION"` | `0c5e9c0a…` → **`3e28c42d…`** · brand `9f87609e…` · release `053a67de…` · **Fixed point stable: OK** |
| 3 | Đồng bộ SSOT | `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json` · `VNTECH_PRODUCT_IDENTITY.txt` · `VNTECH_PACKAGE_ID.txt` · `VNTECH_FULL_W2_ID.txt` |
| 4 | Đồng bộ dòng định danh **MySQL** (Java đọc để hiển thị) | `VNTECH-KHO-MEP-001`: `86a68b97…` → `3e28c42d…` |
| 5 | **`npm run build`** | **EXIT 0** · `BUILT ARTIFACT VALIDATION: ĐẠT` |
| 6 | Dừng **đúng 2 PID** (`node scripts/local-server.mjs`, `node tools/cutover-proxy.mjs`) — **không đụng `java`** | kiểm **dòng lệnh từng PID** trước khi dừng; 2 job nền của phiên trước báo kết thúc ⇒ đúng đối tượng |
| 7 | Chạy lại UI + proxy | UI in `Fingerprint: VNTECH-FP-3E28C42DB2755DAF`; proxy `:9000` → UI `:8787` + API `:18081` |

## 4. Chứng minh **BẢN MỚI THỰC SỰ ĐƯỢC PHỤC VỤ** (không chỉ "server sống")

| Phép kiểm | Kết quả |
|---|---|
| Header `x-vntech-source-fingerprint` của `:8787` | **`VNTECH-FP-3E28C42DB2755DAF` = bản MỚI** |
| `GET :9000/` | **HTTP 200** · 7123 byte |
| Bundle trình duyệt tải (`/assets/page-hpg07hY4.js`) | **chứa cả 5 thay đổi giao diện**: `vt-timeline-step` (§8.1) · `entity-detail-modal` (§8.2) · `attachment-photos` + `attachment-thumb` (§8.3) · `Tổng hợp giao nhận` |
| Đăng nhập qua `:9000` | **HTTP 200** + cookie `mep_session` |
| `GET :9000/api/files?…` (qua proxy → Java) | **HTTP 200** `{"ok":true,"attachments":[]}` |
| `verify-vntech-fingerprint.mjs` | **ĐẠT** · source **242 tệp** · brand/release verified |
| `npm run test:regression` | **61 test · 59 PASS · 2 FAIL** = **đúng mốc nền** (TASK-031, TASK-032) |
| `scripts/master-baseline-gate.mjs` | **ĐẠT** · `!important=4950` · `css=400643B` |

## 5. Cơ chế phải nhớ cho các phiên sau

1. `scripts/local-runtime.mjs:175` **tự áp mọi migration trong `drizzle/`** khi khởi động (bảng `__mep_migrations`),
   rồi `:177` **TỪ CHỐI KHỞI ĐỘNG** nếu `vntech_product_identity.source_fingerprint` ≠ hằng số SSOT.
   ⇒ Mọi lần "refresh identity" **phải** kèm một migration có `UPDATE` dòng định danh (khối của công cụ đã làm sẵn).
2. Bảng định danh có **trigger chặn UPDATE/DELETE** ⇒ khối migration phải `DROP TRIGGER` trước, tạo lại sau.
3. **Java KHÔNG kiểm** dấu vân tay (chỉ đọc để hiển thị) và **không chỗ nào kiểm** `vntech_trust_settings`
   ⇒ chỉ cần đồng bộ `vntech_product_identity` bên MySQL; **hai tệp DB vẫn đồng bộ với nhau** (cùng giữ giá trị cũ ở `vntech_trust_settings`).
4. **Sau mỗi lần build lại phải KHỞI ĐỘNG LẠI tiến trình UI** — dựng `dist` không đủ.
5. `tools/` **không** nằm trong tập băm nguồn ⇒ thêm/sửa công cụ **không** làm lệch dấu vân tay;
   nhưng `app/`, `drizzle/`, `lib/`, `scripts/`, `db/`, `public/`, `tests/`, `worker/` **có** ⇒ mọi sửa giao diện
   hay migration đều **bắt buộc** refresh identity trước khi build.

## 6. Giới hạn & việc còn lại

1. **Chưa kiểm bằng mắt** các thay đổi §8.1/§8.2/§8.3 — nay **đã có thể**: người dùng test ở
   **http://127.0.0.1:9000** (bản mới). Cổng ảnh 28 ảnh **không phủ** màn chi tiết phiếu (Known Problem #68).
2. `vntech_trust_settings.brand_fingerprint`/`release_fingerprint` (cả SQLite lẫn MySQL) **vẫn là giá trị cũ**
   — **không chỗ nào kiểm**, nhưng nếu UI có hiển thị thì sẽ lệch với hằng số SSOT; đã ghi lại, **không tự sửa**.
3. Chuỗi `drizzle/0109…` là **head mới**; lần refresh sau phải tạo head `0110…` (công cụ **từ chối** chạy lại
   trên head đã có giá trị thật).

## 7. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `drizzle/0109_phase1_ui_identity.sql` | **MỚI** — head + khối identity (fixed point) |
| `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json` · `VNTECH_PRODUCT_IDENTITY.txt` · `VNTECH_PACKAGE_ID.txt` · `VNTECH_FULL_W2_ID.txt` | dấu vân tay mới |
| `docs/agent-progress/{MASTER_STATUS,TASK_INDEX}.md` | TASK-034 → **DONE**, BLOCKED ITEMS gỡ TASK-034, Known Problem #68 đóng phần bundle |
