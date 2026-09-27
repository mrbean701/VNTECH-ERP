# TASK-MT3-BE-22 — Lô việc sau khi user gỡ TOÀN BỘ điểm chặn (27/09/2026)

| Mục | Nội dung |
|---|---|
| **Task** | Lô **A2 · A3 · A5 · A6 · A7** *(theo 8 quyết định mới của user)* |
| **Phase** | **GĐ1 (FRONTEND)** + xác minh GĐ2 |
| **Status** | ✅ **HOÀN TẤT 5/5 mục** *(⛔ A1/A4/C1/C2/B1 chuyển task sau)* |
| **Nguồn quyết định** | `docs/dsh/MT3_USER_DECISIONS.md` §«ĐỢT CHỐT THỨ 2 — 27/09/2026» |

---

## ✅ A2 — TÌM VẬT TƯ THEO **TÊN PHỤ (alias)** *(yêu cầu trực tiếp của user)*
**Nguyên văn user**: *«Trong phần modal tạo MR, PR, PO phải có giao diện tìm kiếm vật tư chứ. Tôi muốn thanh search có thể tìm kiếm được bằng alias nữa vì 1 số nhân sự không nắm rõ tên chính xác của vật tư họ thường tìm theo tên mà họ nhớ.»*

### 🔴 LỖ HỔNG THẬT (đo được, ⛔ không suy đoán)
| Đo | Kết quả |
|---|---|
| Ô chọn vật tư trong **`RequestModal`** *(modal tạo **MR/PR**)* | `app/page.tsx` — chỉ khớp **ĐÚNG CHUỖI** `` `${m.code} · ${m.name}` `` ⇒ ⛔ **alias KHÔNG tìm được** |
| `<datalist id={materialSearchListId}>` | chỉ sinh `<option value={`${code} · ${name}`}>` ⇒ ⛔ **không gợi ý alias** |
| **Thanh tìm kiếm TOÀN CỤC** (`page.tsx:529`) | haystack vật tư = `code · name + unit` ⇒ ⛔ **không gồm alias** |
| **`PoModal`** (`page.tsx:2716`, 11 dòng) | = **«Phát hành PO từ phiếu đã duyệt»** ⇒ vật tư **kế thừa từ phiếu**, ⛔ **không có ô chọn vật tư riêng** ⇒ ⛔ không cần sửa |
| Toàn hệ thống có mấy ô tìm vật tư? | **ĐÚNG 1** *(chính `RequestModal`)* ⇒ **A2 đúng chỗ, ⛔ không bỏ sót màn** |

### ✅ CÁCH BỊT — theo **§14 (helper DÙNG CHUNG)**, ⛔ không copy logic
| Tệp | Thay đổi |
|---|---|
| **`lib/material-alias.ts`** | ➕ **MỚI** — `aliasOf` · `normalizeForSearch` · `materialDisplayName` · `findMaterialBySearch` · `materialSearchTerms` |
| `app/page.tsx` | ➕ import helper · 🔁 `findMaterialBySearch(materials,data.materialAliases,value)` *(thay `find` cứng)* · 🔁 `<datalist>` **sinh thêm option cho từng alias** *(nhãn «— tên phụ»)* · 🔁 **thanh tìm kiếm toàn cục** gộp alias vào haystack |
| `tests/mt3-be-05-material-alias-search.test.mjs` | ➕ **MỚI** — **10 ca** |

### ✅ Đặc tính đã khoá bằng test
- ✅ Tìm theo **alias** ra đúng vật tư *(2 alias khác nhau của cùng vật tư đều ra)*
- ✅ Tìm alias **KHÔNG DẤU** vẫn ra *(«thep hop 40x40»)* — đúng nhu cầu *«tên họ nhớ»*
- ✅ **⛔ KHÔNG hồi quy**: khớp `mã · tên` **ĐÚNG** như trước
- ✅ **⛔ KHÔNG khớp mờ**: tên lạ ⇒ `undefined` *(tránh chọn nhầm vật tư)*
- ✅ **⛔ bỏ alias `active=0`** *(đã ngừng)*
- ✅ Xử lý đúng **chữ Đ** → `d` *(«Điều chuyển» → «dieu chuyen»)*

---

## ✅ A5 — KHO **⛔ KHÔNG ĐƯỢC XOÁ**, chỉ có nút **NGỪNG**
**Nguyên văn user**: *«Kho không được xóa, chỉ có nút ngừng. … vẫn cần kho trong database nếu xóa đi thì sẽ hỏng dữ liệu.»*

### 🎉 KẾT QUẢ: **ĐÃ ĐÁP ỨNG SẴN** ⇒ ⛔ **0 dòng mã phải sửa**
| Yêu cầu | Bằng chứng đo được |
|---|---|
| ⛔ **KHÔNG** có lệnh xoá kho | Grep toàn `java-backend/` chuỗi `delete_warehouse` ⇒ **0 kết quả** *(và **phải tiếp tục như vậy**)* |
| ✅ **CÓ** nút **ngừng** | `warehouses.active TINYINT(1) NOT NULL DEFAULT 1` · `OpsTaskStoreAdapter:289` `UPDATE warehouses SET active=?` · `ProjectAdminStoreAdapter:163` `SET active=? WHERE project_id=? AND type=?` · `SystemSettingsStoreAdapter:276` lưu kèm `active` |
| ✅ **Giữ dữ liệu** trong CSDL | Không có lệnh `DELETE` nào trên bảng `warehouses` |
📌 ⇒ **⛔ KHÔNG thêm `delete_warehouse`** *(đúng quyết định user + §17 DATABASE SAFETY)*. Ghi rõ nghiệp vụ user đã chốt: *dự án hoàn thành ⇒ xuất vật tư về kho tổng ⇒ **đóng kho** (ngừng) ⇒ dự án đóng vĩnh viễn; kho **vẫn ở lại** CSDL để giữ vết.*

---

## ✅ A7 — XOÁ probe cũ `tests/p07-supplier-partner-split-probe.mjs`
**Nguyên văn user**: *«Có thể xóa nếu nó không cần thiết nữa.»*
| Bước | Kết quả |
|---|---|
| Xác minh trước khi xoá | 12 tham chiếu — **⛔ KHÔNG cổng/test nào** dùng; chỉ **2 chú thích trong mã** + 10 tài liệu |
| Xác minh tệp thay thế | ✅ `tests/p07-supplier-partner-split.test.mjs` **(241 dòng, ĐANG ĐẠT)** đã phủ hợp đồng menu-key/`view` ở dạng **cập nhật** |
| Hành động | ✅ **ĐÃ XOÁ** tệp probe |
| Dọn chú thích mục nát | 🔁 `app/screens/SupplierManager.tsx:48` + `lib/menu-helpers.ts:90` — nay trỏ **tệp test ĐANG ĐẠT**, kèm ghi chú vì sao probe bị xoá |

---

## ✅ A3 — «audit & idempotency» cho xuất dữ liệu = **YÊU CẦU CHUNG**
**Nguyên văn user**: *«Yêu cầu chung»*
⇒ ⛔ **KHÔNG phải luật nghiệp vụ mới** ⇒ **⛔ không chế luật**. Phần **UTF-8/headers ĐÃ ĐẠT SẴN** *(tên tệp tiếng Việt dùng đúng **RFC 5987** tại `FileController:182`; `produces = JSON_UTF8`; template toàn ASCII nên ⛔ không phải lỗi)*.
✅ **BE-07 KẾT THÚC** — ⛔ không làm thêm.

## ✅ A6 — Màn «Báo cáo» của Mua hàng
**Nguyên văn user**: *«Màn báo cáo của mua hàng đang phát triển chưa chốt nghiệp vụ.»*
⇒ ⛔ **KHÔNG xây** *(đúng GOAL §19)*. Ghi lại để làm khi user chốt nghiệp vụ.

---

## 🧪 Testing — ✅ **10 test mới ĐẠT** + ⛔ **không hồi quy**
| Cổng | Kết quả |
|---|---|
| test mới `mt3-be-05-material-alias-search.test.mjs` | ✅ **`tests 10 · pass 10 · fail 0`** |
| `npx tsc --noEmit` | ✅ **`EXIT=0`** |
| contract **toàn bộ** | ✅ **`tests 646 · pass 645 · fail 0 · skipped 1`** *(636 cũ + **10 mới**)* ⇒ ⛔ **không hồi quy** |
| `npm run test:regression` | ✅ **`pass 69 · fail 0`** |
| `npm run verify:css-baseline` | ✅ **`ĐẠT`** · `dead classes=0 · dead vars=0` |

## Files changed
| Tệp | Việc |
|---|---|
| `lib/material-alias.ts` | ➕ **MỚI** — helper dùng chung (§14) |
| `app/page.tsx` | 🔁 import · `findMaterialBySearch` · `<datalist>` có alias · thanh tìm kiếm toàn cục gộp alias |
| `app/screens/SupplierManager.tsx` | 🔁 chú thích (⛔ hết trỏ tệp đã xoá) |
| `lib/menu-helpers.ts` | 🔁 chú thích |
| `tests/p07-supplier-partner-split-probe.mjs` | ❌ **ĐÃ XOÁ** *(user cho phép)* |
| `tests/mt3-be-05-material-alias-search.test.mjs` | ➕ **MỚI** — 10 ca |
| `docs/dsh/MT3_USER_DECISIONS.md` | 📝 ghi **8 quyết định mới** *(nguyên văn user)* |

## Blockers
⛔ **Không có** cho lô này.
⚠️ **Cổng `gd-cycle` vẫn bị chặn** — chờ **B1** *(user **ĐÃ cho phép** dừng PID 18808)* ⇒ sẽ chạy ở task sau.
⚠️ Hiện có **6 thay đổi `app/**`/`lib/**` chưa được cổng build xác minh** *(StatusBadge · MaterialListTable · TeamDirectory · WorkCenter · page.tsx · menu-helpers.ts)* — **5/6 cổng còn lại ĐẠT**.

## Next task
**A1** *(luật SLA 72h: sắp xếp + tự từ chối khi quá SLA, idempotent)* → **A4** *(thông báo phòng ban: mọi user trong phòng nhận được)* → **C2** *(#8 ngưỡng 1024px)* → **C1** *(#4 aside→modal + chụp lại 68 ảnh)* → **B1** *(dừng PID 18808 → `gd-cycle` → khởi động lại)*.