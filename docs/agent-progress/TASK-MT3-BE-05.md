# TASK-MT3-BE-05 — Tìm vật tư theo TÊN CHÍNH + ALIAS

| Mục | Nội dung |
|---|---|
| **Task** | P3-BE-05 |
| **Phase** | **GĐ2 — BACKEND** (⚠️ xem phát hiện ở mục 3: **rất có thể phần lớn là FRONTEND**) |
| **Status** | 🟡 **KHẢO SÁT XONG** · ⏳ **CHƯA SỬA MÃ** (⛔ không tự nhận DONE) |
| **Requirement** | Tìm vật tư phải khớp **cả tên chính LẪN tên phụ/alias** (không chỉ tên chính) |

## KẾT QUẢ KHẢO SÁT (đo trên mã — ⛔ không giả định)

### 1) ✅ ĐÃ CÓ SẴN hạ tầng cần thiết
| Thành phần | Vị trí | Ý nghĩa |
|---|---|---|
| **Hàm chuẩn hoá tên dùng chung** | **`MaterialSystemCodes.normalizeMaterialName(...)`** — dùng ở `MaterialCatalogManagementUseCase.java:124,130,140` | ⛔ **KHÔNG viết lại chuẩn hoá** — tái dùng đúng hàm này để so khớp |
| **Bảng alias riêng** | **`material_aliases`** — cột `material_id` · `alias_name` · **`normalized_name`** · `verified` · `active` | đã có **cột `normalized_name`** ⇒ **so khớp bằng tên đã chuẩn hoá** là thiết kế SẴN CÓ |
| **Dữ liệu alias vào payload** | `BootstrapDataAdapter.java:250` — `… FROM material_aliases WHERE active=1 ORDER BY alias_name` | alias **đã được nạp sẵn** cho giao diện (⇒ `data.materialAliases`) |
| **Alias dựng lại từ `aliasText`** | `MaterialCatalogManagementUseCase.java:121-131` (TASK-047) | quy tắc có sẵn: `split(/[;\n]+/)` → trim → bỏ rỗng → `normalizeMaterialName` |

### 2) ⚠️ PHÁT HIỆN QUAN TRỌNG: **tìm kiếm hiện chạy PHÍA CLIENT**
- `app/page.tsx:529` — `globalSearchResults` lọc bằng `search.trim().toLocaleLowerCase("vi")` trên dữ liệu đã nạp.
- Màn Kho/Vật tư lọc trên `data.inventory` / `data.materials` (ví dụ `app/screens/Inventory.tsx:60`).
- ⇒ **Chưa thấy action backend nào chuyên để «tìm vật tư»** trong các truy vấn đã rà (`AdminOpsStoreAdapter.java:129` chỉ `SELECT … FROM materials WHERE active=1`).
- ⇒ **Kết luận**: nếu yêu cầu chỉ là «ô tìm kiếm khớp thêm alias», thì chỗ sửa là **BỘ LỌC Ở GIAO DIỆN** (khớp thêm `materialAliases`), ⛔ **không phải backend**. ⚠️ **Task này có thể đã bị xếp nhầm phase** trong phân rã ban đầu.

### 3) Hai đường — **cần xác định đúng phạm vi trước khi sửa**
| Đường | Việc phải làm | Ghi chú |
|---|---|---|
| **(A) Nếu chỉ cần ô tìm kiếm hiện tại khớp thêm alias** | sửa **bộ lọc phía client** để khớp `data.materialAliases` (so bằng `toLocaleLowerCase("vi")`) | ⛔ **KHÔNG cần đổi backend/CSDL**; đây là việc **FRONTEND** thuộc GĐ1 |
| **(B) Nếu cần TÌM Ở MÁY CHỦ (phân trang/dữ liệu lớn)** | thêm action tìm kiếm ở backend: `JOIN material_aliases` + so `normalized_name` bằng `MaterialSystemCodes.normalizeMaterialName(q)` **∪** `materials.name` | ⛔ **cần chốt với user** vì phát sinh **API mới**; ⛔ tuân DATABASE SAFETY (chỉ ĐỌC, ⛔ không đổi schema) |

⚠️ **⛔ KHÔNG tự chọn (A) hay (B)**: chọn sai sẽ hoặc **thừa API mới** (phình hệ thống) hoặc **không đáp ứng yêu cầu** nếu đề bài buộc tìm ở máy chủ. Cần câu chữ đề bài hoặc user chốt.

## Files dự kiến phải sửa
- Đường **(A)**: `app/page.tsx` (bộ lọc) + màn danh mục vật tư; test hợp đồng `.mjs`.
- Đường **(B)**: `SystemController` (case mới) + use-case + store (`JOIN material_aliases`) + `ActionRbacRegistry` (2 dòng) + test backend.

## Testing hiện tại (nền vẫn sạch)
| Cổng | Kết quả |
|---|---|
| `mvn -f java-backend/pom.xml test` | ✅ **65/65 ĐẠT** · `BUILD SUCCESS` |
| `tools/verify-java-compile.ps1` | ✅ 115 tệp · 0 lỗi |
| `tsc` · contract · regression · `verify:css-baseline` · `verify:master-baseline` | ✅ đều ĐẠT |

## Blockers
⛔ **Cần chốt phạm vi (A) hay (B)** — nếu chọn sai sẽ thừa API hoặc trượt yêu cầu.
📌 **Cùng nhóm chờ với P3-BE-02/03** (cũng đang chờ câu chữ §B.1) ⇒ đề xuất user trả lời **một lần cho cả 3**.

## Next action
Chờ user chốt phạm vi. Trong lúc chờ, ⛔ **KHÔNG sửa** — và chuyển sang task GĐ2 **chắc chắn rõ phạm vi**:
**P3-BE-08** (backend **cưỡng chế quyền** cho CRUD Thi công + phạm vi kho/dự án) — đây là **cổng an ninh**, phạm vi rõ ràng, ⛔ không phụ thuộc câu chữ mơ hồ.