# P-09 — KẾ HOẠCH SỬA: 5 CHỖ `requireRole` DÙNG MÃ VAI TRÒ CŨ (lỗi PHÂN QUYỀN THẬT)

- **Ngày phân tích:** 20/09/2026 · **Trạng thái:** ĐÃ CHỨNG MINH — **chờ áp dụng** (sau khi hợp nhất 2 nhánh PHASE 3/4)
- **Mức:** P2 theo roadmap, nhưng **tác động thực tế CAO** (từ chối oan Chỉ huy trưởng / Phòng Dự án / Kỹ sư dự án)

## 1. HIỆN TRẠNG (bằng chứng từ mã + DB)

**5 chỗ trong `java-backend/application/src/main/java/com/vntech/erp/application/service/ProductionManagementUseCase.java`:**
| Dòng | Danh sách hiện tại |
|---|---|
| 217 | `List.of("admin", "commander", "project")` |
| 239 | `List.of("admin", "commander", "project")` |
| 264 | `List.of("admin", "commander", "project")` |
| 283 | `List.of("admin", "commander", "accountant", "project")` |
| (1 chỗ nữa — rà hết tệp khi sửa) | — |

**Chính tệp đó ghi rõ ở dòng 35–39:**
> `roleBase()` = **“Mã ENGINE (`role_catalog.base_role`) — giá trị THẬT SỰ dùng để phân quyền… Mặc định rơi về `role()` để tương thích ngược.”**

**`RbacService.requireRole` ghi rõ cơ chế:**
> *“JS so với `effectiveRole(user) = clean(user.roleBase || user.role)`, tức **mã ENGINE** (`base_role`), **không phải** mã vai trò chuẩn. Vì mã chuẩn ánh xạ **NHIỀU-VỀ-MỘT** sang `base_role` … nên **phải nhận CẢ HAI**: mã vai trò của chính tài khoản **VÀ** mã engine. Nếu chỉ so mã chuẩn thì mọi …”* (khuyết phần cuối trong ảnh trích)

## 2. ÁNH XẠ THẬT (đo từ `role_catalog`)

| `code` (mã người dùng có) | `base_role` (mã engine) |
|---|---|
| `accountant` | `accountant` |
| `cht` · `commander` | `commander` |
| `director` · `thuky` | `director` |
| `engineer` · `ksda` | `engineer` |
| `kh_nv` · `kh_truong` · `procurement` | `procurement` |
| `da_nv` · `da_truong` · `project` | `project` |
| `team` | `team` |
| `thu_kho` · `warehouse` | `warehouse` |

**Role THẬT đang có trên người dùng:** `ksda` (3) · `admin` · `da_nv` · `thuky` · `kh_nv` · `thu_kho` · `accountant` · `cht` · `kh_truong` · `da_truong`
⇒ **KHÔNG ai có `commander` hay `project`** ⇒ nếu `roleBase` trống (rơi về `role`), các danh sách trên **KHÔNG khớp** ⇒ **từ chối oan** ✗

## 3. CÁCH SỬA (đúng theo chính tài liệu của `requireRole`)

Thêm **mã vai trò chuẩn** vào từng danh sách (giữ nguyên mã engine để tương thích):
- `List.of("admin", "commander", "project")`
  ⇒ `List.of("admin", "commander", "cht", "project", "da_nv", "da_truong")`
- `List.of("admin", "commander", "accountant", "project")`
  ⇒ `List.of("admin", "commander", "cht", "accountant", "project", "da_nv", "da_truong")`

**Nguyên tắc:** *“nhận CẢ HAI”* — mã engine (để tương thích khi `roleBase` có giá trị) **và** mã chuẩn (để đúng khi `roleBase` trống) ✔

## 4. KIỂM CHỨNG SAU KHI SỬA (bắt buộc)
1. `cd java-backend && mvn -q -DskipTests package` (build Java **phải chạy trong `java-backend/`**, nếu không sẽ `MissingProjectException`)
2. Chạy test Java hiện có; nếu có test H2 cho `ProductionManagementUseCase` thì bổ sung ca: **user `role=cht` (không có roleBase) ⇒ ĐƯỢC phép**; user `engineer` ⇒ **bị chặn** (đúng)
3. Sau hợp nhất: `npx tsc --noEmit` + `npm test` + **cổng ảnh 68/68** (luồng Sản lượng/BCH)

## 5. RỦI RO & LƯU Ý
- **Không** nới rộng quá mức: chỉ thêm **mã chuẩn tương ứng đúng `base_role`** đã liệt kê; **không** thêm `engineer`/`team`/`warehouse` vào các danh sách trên (sẽ mở quyền sai ✗).
- **Không** sửa `RbacService.requireRole` trong phạm vi `P-09` (đổi hàm dùng chung ⇒ ảnh hưởng toàn hệ) — chỉ sửa **5 call site** ✔
- Sau khi sửa phải **kiểm lại bằng chứng**: chạy đúng người dùng `cht`/`da_truong` để xác nhận **hết từ chối oan** ✔
