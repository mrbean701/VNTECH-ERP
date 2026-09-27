# TASK-MT3-UI-10d — Dọn khối «Luân chuyển vật tư dư» CŨ (hết trùng 2 nơi)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-10d |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE** |
| **Requirement** | Nối tiếp **QUYẾT ĐỊNH USER 26/09/2026** («luân chuyển vật tư là 1 phần của cấp phát & hoàn trả»): sau khi chuyển danh sách sang tab «Cấp phát & hoàn trả» (P3-UI-10c), **bản CŨ còn sót** ở màn «Kho Tổng» ⇒ **trùng 2 nơi** ⇒ phải dọn. |

## Bằng chứng vì sao đây là ĐƯỜNG CHẾT (⛔ không xoá nghiệp vụ đang dùng)
1. `lib/menu-helpers.ts:141` ghi rõ: `central_warehouse` **«bị ẨN KHỎI MENU nhưng VẪN là khoá nghiệp vụ THẬT»** — nay menu dùng `warehouse_hub` (nhãn «Kho») ⇒ màn `central_warehouse` **không còn lối vào**.
2. Danh sách này **đã được chuyển đầy đủ** sang tab «Cấp phát & hoàn trả» của `app/screens/Inventory.tsx` ở **P3-UI-10c** — gồm **duyệt** (`approve_central_return`) · **kiểm đếm** (`centralReceive`) · **hồ sơ ảnh** (`AttachmentPanel`).
⇒ Gỡ bản cũ **⛔ không mất nghiệp vụ nào**.

## Implementation
- Gỡ **1 khối** `<section className="card">…centralReturns…</section>` khỏi `app/page.tsx` (màn `CentralWarehouse`).
- Thay bằng **khối chú thích** ghi rõ: lý do gỡ · vì sao là đường chết · danh sách nay ở đâu · ⛔ không mất nghiệp vụ.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | gỡ khối «Luân chuyển vật tư dư dự án → Kho Tổng» (màn `CentralWarehouse`) + chú thích giải thích |

## Frontend / Backend / Database / API / Permission / Workflow changes
Chỉ **gỡ UI trùng** ở màn đã bị ẩn menu. ⛔ KHÔNG đổi API · ⛔ KHÔNG đổi quyền · ⛔ KHÔNG đổi CSDL · ⛔ KHÔNG đổi luồng nghiệp vụ.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| **Xác minh đã gỡ** | ✅ grep `«Luân chuyển vật tư dư dự án → Kho Tổng»` = **1 khớp** ⇒ **chỉ còn chú thích**, ⛔ không còn khối UI |
| contract toàn bộ | ✅ **620 tests · 619 pass · 0 fail · 1 skip** (⛔ không sửa test nào) |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-1E87EFEF2EF55B80` |

## Bài học đã mắc trong task này
- ⛔ **Không dùng số dòng cũ đã ghi trong checkpoint**: tôi ghi «`page.tsx:1151`» từ vòng trước, nhưng sau nhiều lần sửa thì dòng 1151 nay là **bảng KPI của màn Nhập kho** — ⛔ không phải khối cần gỡ. ⇒ **Phải định vị theo NỘI DUNG** (`Select-String` theo tiêu đề khối) rồi mới sửa. Nếu sửa theo số dòng cũ sẽ **xoá nhầm màn khác**.
- Ghi chú kèm: dòng cần gỡ thực tế dài **1482 ký tự** — vẫn nằm trong ngưỡng đọc được (2000) nên lấy được **nguyên văn** để thay chính xác.

## Known issues
1. ⛔ **P3-UI-12d** (thanh 10 tab nhóm «Mua hàng & Cung ứng») **vẫn còn nợ** — xem `TASK-MT3-UI-12b.md`.
2. ⛔ Xác minh bằng mắt (ảnh chuẩn) — **P3-UI-17**.

## Blockers
⛔ **Không có.**

## Next task
**P3-UI-17** — chụp lại **68 ảnh chuẩn** + probe từng màn + **xác minh bằng mắt** (cũng là nơi xử lý `probe-toolbar-order.mjs` chưa từng đo được).
Sau đó: **P3-UI-12d** (thanh 10 tab) → **GĐ2**.
