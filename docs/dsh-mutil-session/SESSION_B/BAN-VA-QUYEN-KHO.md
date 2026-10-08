# BẢN VÁ SẴN — QUYỀN MODULE KHO (`TASK-239`)

> ⭐ **Phiên 02 dựng sẵn — `ERP-SESSION-01` chỉ việc DÁN vào, ⛔ không phải tự viết.**
> ⚠️ Nguồn: `DEC-20261008-013` (quy tắc user) · `HANDOFF-20261008-009` · đo từ `V3__reference_seed.sql` + `ActionRbacRegistry.java`

---

## ① KẾT LUẬN ĐO ĐƯỢC — ⛔ KHÔNG CẦN TẠO MODULE MỚI

| Hạng mục | Kết quả đo |
|---|---|
| Bảng `module_catalog` | `module_key · label · icon · group_name · **group_key** · active · sort_order · system_locked · created_at · updated_at` |
| Nhóm menu kho | **`group_key = 'warehouse'`** — nhóm **«KHO VẬT TƯ»** |
| Module KHO **đã có sẵn 3** | `central_warehouse` («Kho Tổng & mã vật tư gốc») · `warehouse_receipt` («Nhập kho») · `warehouse_issue` («Xuất kho») |
| Module thứ 4 hay dùng | `inventory` |

⇒ ⭐ **⛔ KHÔNG thêm dòng `module_catalog` nào.** ⭐ **⛔ KHÔNG tạo module mới.**
⚠️ **VÌ SAO**: quyền **module** là **DỮ LIỆU CSDL** — nhưng quyền **ACTION** lại là **JAVA** (`ActionRbacRegistry`).
⇒ ⭐ **«sửa db thì cứ làm» ⛔ KHÔNG đủ** để khai 3 action mới ⚠️

---

## ② BẢN VÁ JAVA — `ActionRbacRegistry.java`

⚠️ **Dán 3 dòng này vào map action→module** (chỗ có `Map.entry("save_warehouse_location", List.of("inventory","central_warehouse"))` — dòng ~278):

```java
    // ⭐ TASK-239 (08/10/2026) — 3 action MỚI cho chức năng kho (user chốt · DEC-20261008-013)
    //    Quy tắc ①: tạo kho (khi lập dự án HOẶC bằng tay) ⇒ cần quyền TẠO
    Map.entry("create_warehouse", List.of("central_warehouse")),
    //    Quy tắc ②: «sửa kho: cho sửa, nhưng phải có PHÂN QUYỀN sửa kho thì mới được» ⇒ cần quyền SỬA
    Map.entry("update_warehouse", List.of("central_warehouse")),
    //    Quy tắc ③: «không cho phép xoá» — chỉ ẨN / NGỪNG HOẠT ĐỘNG ⇒ đổi trạng thái = quyền SỬA
    Map.entry("set_warehouse_status", List.of("central_warehouse")),
```

⚠️ **Và 3 dòng map action→CỜ QUYỀN** (chỗ có `Map.entry("save_warehouse_location", "canEdit")` — dòng ~527):

```java
    Map.entry("create_warehouse", "canCreate"),
    Map.entry("update_warehouse", "canEdit"),
    Map.entry("set_warehouse_status", "canEdit"),
```

### ⛔ TUYỆT ĐỐI KHÔNG KHAI
```java
    // ⛔⛔ KHÔNG — user chốt «Xóa kho: KHÔNG cho phép» (quy tắc ③)
    // Map.entry("delete_warehouse", ...)
```

---

## ③ VÌ SAO CHỌN `central_warehouse` *(lý do — để S01 ⛔ không phải đoán)*

| Action | Module | Vì sao |
|---|---|---|
| `create_warehouse` | `central_warehouse` | Kho **Tổng** và **kho dự án** dùng **cùng một** bảng `warehouses` · cùng nhóm `group_key='warehouse'` |
| `update_warehouse` | `central_warehouse` | Cùng lý do — sửa kho Tổng hay kho dự án là **cùng một thao tác** |
| `set_warehouse_status` | `central_warehouse` | Ẩn/ngừng là **đổi trạng thái**, không phải xoá ⇒ đi cùng quyền quản lý kho |

⚠️ **NẾU user/anh muốn TÁCH quyền theo loại kho** (vd: chỉ admin được tạo kho Tổng) ⇒ ⭐ **BÁO LẠI phiên 02**, em sửa bản vá.

---

## ④ KIỂM SAU KHI DÁN
```bash
npm test          # ⇒ 0 fail (⭐ kỳ vọng: lint 0 errors · test toàn bộ xanh)
```
⚠️ ⭐ **BÀI HỌC TỪ PHIÊN 02 (TEST-047)**: `tsc=0` ⛔ **KHÔNG đủ** — **phải chạy `npm run lint`** *(ESLint bắt lỗi mà `tsc` bỏ qua)*.
⚠️ ⚠️ **Và chạy ĐÚNG script dự án** — `npx eslint .` thiếu `--ignore-pattern dist` sẽ **báo lỗi GIẢ trong `dist/`**.

---

## ⑤ TRUY VẾT
⭐ `DEC-20261008-013` · `HANDOFF-20261008-009` · `TASK-234→239` · phiên 02 đã dựng sẵn `WarehouseFormModal` + 10 hàm quy tắc (33 ca test PASS)
