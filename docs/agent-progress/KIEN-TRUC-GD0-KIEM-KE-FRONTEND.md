# GĐ0 — KIỂM KÊ & PHÂN LOẠI LOGIC FRONTEND (VNTECH ERP V5.3.0)

- **Ngày**: 21/09/2026 · **Người thực hiện**: captain
- **Căn cứ chỉ đạo**: *“đã chuyển backend sang java hoàn toàn rồi, tôi cần **mọi logic xử lý phải ở backend java**, frontend chỉ còn nhiệm vụ **render** thôi.”*
- **Trạng thái**: **CHỈ ĐỌC** — chưa sửa dòng mã nào. Đây là danh sách để chốt thứ tự chuyển.

---

## 1. VÌ SAO `domain/entity` CHỈ CÓ 2 CLASS

```
java-backend/domain  = 9 tệp · 825 dòng
  domain/entity      : Project.java · User.java                                   ← CHỈ 2
  domain/service     : MaterialMatcherV2 · MaterialSystemCodes · StockLedgerEngine  ← 3 thuật toán thuần
  domain/valueobject : ProjectStatus.java
  (+ 3 test)
```
**Nguyên nhân**: cách port JS→Java đã chọn là **Ports & Adapters + Use-case (transaction script)** — mỗi nghiệp vụ là một lớp `*UseCase` gọi thẳng cổng ra, **KHÔNG** dựng domain model 1 entity cho mỗi bảng.

| Tầng | Số tệp | Số dòng |
|---|---|---|
| `domain` | 9 | 825 |
| `application` | 58 | 11.163 |
| `infrastructure` | 41 | 9.738 |
| `web` | 24 | 5.395 |

⇒ **Kết luận**: không phải thiếu sót tuỳ tiện, mà là **hệ quả của kiểu port**. Tuy nhiên đúng là **tầng domain rất mỏng** — muốn “logic ở backend” đúng nghĩa thì cần cả: (a) gom luật vào `application`/`domain`, (b) **gỡ luật đang nằm ở frontend**.

---

## 2. TỔNG QUAN KÍCH THƯỚC

```
FRONTEND (app + lib): **10.422 dòng**        BACKEND (java): 27.121 dòng
```
Top tệp frontend lớn nhất:
```
app/page.tsx                2.780   ← khổng lồ, cần tách module TRƯỚC khi chuyển logic
app/screens/TeamDirectory          520
lib/p08-nav-trace.ts               460
lib/ui-shared.tsx                  384
app/screens/WorkCenter             316
lib/report-catalog.ts              300
app/screens/Purchasing             281
lib/admin-bulk-import.ts           276
lib/request-export.ts              240
app/screens/WarehouseDashboard     240
lib/menu-helpers.ts                235
lib/material-import.ts             221
app/screens/WorkHierarchy          214
lib/ProjectDetailTabs              204
lib/report-engine.ts               173
```

**Mật độ dấu hiệu logic nghiệp vụ** *(validate · trạng thái · sinh mã · tính toán · quyền)*:
| Tệp | Dấu hiệu | Đánh giá |
|---|---|---|
| **`app/page.tsx`** | **205** ✗ | 🔴 phải tách + chuyển |
| `BoqControl.tsx` | 13 | 🟠 |
| `Payments.tsx` | 13 | 🟠 |
| `MaterialListTable.tsx` | 12 | 🟠 |
| `ui-shared.tsx` | 12 | 🟡 (nhiều khả năng là render — cần soi) |
| `Purchasing.tsx` | 10 | 🟠 |
| `WarehouseDashboard.tsx` | 10 | 🟠 |
| `ConstructionScreen.tsx` | 9 | 🟠 |
| `permissions.ts` | 9 | 🔴 **nghi TRÙNG RBAC của Java** |

---

## 3. PHÂN LOẠI `lib/` (30 tệp)

### (c) 🔴 LOGIC NGHIỆP VỤ — PHẢI CHUYỂN SANG JAVA
| Tệp | Dòng | Vì sao |
|---|---|---|
| `report-engine.ts` | 173 | **tổng hợp báo cáo** (`kh…`) — luật tính |
| `report-catalog.ts` | 300 | **danh mục báo cáo** — định nghĩa nghiệp vụ |
| `request-export.ts` | 240 | **biểu mẫu đề nghị cấp vật tư** (PDF/Excel) — mẫu chứng từ |
| `material-import.ts` | 221 | **parse Excel/CSV vật tư** — ánh xạ + validate |
| `admin-bulk-import.ts` | 276 | **nhập hàng loạt** — validate + luật |
| `p2-po-trace.ts` | 182 | **truy vết PR → PO → GRN** — luật dữ liệu |
| `p2-approval-timeline.ts` | 85 | **mốc thời gian duyệt** — suy từ dữ liệu |
| `request-context.ts` | 23 | **suy KL hợp đồng / tồn kho theo dòng** — luật |
| `workflow-helpers.ts` | 55 | luật luồng duyệt |
| `approval-helpers.ts` | 35 | luật phê duyệt |
| `request-actions.ts` | 29 | hành động hợp lệ theo trạng thái |
| `form-fields.ts` | 112 | cấu hình trường/định nghĩa |
| `boq-export.ts` · `material-catalog-export.ts` · `tabular-export.ts` | 90+36+94 | kết xuất chứng từ |

### (d) 🔴 TRÙNG LOGIC JAVA — PHẢI XOÁ + GỌI API
| Tệp | Dòng | Đối chiếu Java |
|---|---|---|
| `permissions.ts` | 23 | **RBAC đã có ở Java** (`RbacService`, `ActionRbacRegistry`) |
| `audit-log-display.ts` | 160 | một phần trùng `BootstrapDataAdapter` (Q1 đã chuyển hiển thị sang backend) |
| `workflow-display.ts` | 87 | một phần trùng dữ liệu bootstrap |

### (a)/(b) RENDER & ĐỊNH DẠNG — **GIỮ** *(trừ khi anh yêu cầu khác)*
```
ui-shared.tsx 384 · menu-helpers.ts 235 · p08-nav-trace.ts 460 (logic ĐIỀU HƯỚNG = UI)
boq-line-display.ts 78 · labels.ts 15 · date-helpers.ts 22 · report-rows.ts 24
boq-normalize.ts 19 · runtime-env.ts 11 · vntech-brand.ts 2 · ui-blocks.tsx 18 · supply-docs.tsx 52
```

---

## 4. THỨ TỰ CHUYỂN ĐỀ XUẤT *(GĐ1)*

| # | Lát cắt | Vì sao trước | Rủi ro nếu để lại |
|---|---|---|---|
| **1** | `permissions.ts` + mọi kiểm quyền ở UI | **an ninh** — luật quyền không được ở client | 🔴 nghiêm trọng |
| **2** | `request-context.ts` + `request-actions.ts` + `workflow-helpers.ts` + `approval-helpers.ts` | luật trạng thái/khối lượng của phiếu | 🔴 sai nghiệp vụ |
| **3** | `material-import.ts` + `admin-bulk-import.ts` | validate dữ liệu nhập | 🟠 dữ liệu bẩn |
| **4** | `report-engine.ts` + `report-catalog.ts` | số liệu báo cáo | 🟠 lệch số |
| **5** | `request-export.ts` + các `*-export.ts` | **mẫu chứng từ** (số hiệu/mẫu in) | 🟠 |
| **6** | `p2-po-trace.ts` + `p2-approval-timeline.ts` | truy vết — hiện là hàm thuần trên dữ liệu đã tải | 🟡 |
| **7** | Tách module `app/page.tsx` (2.780 dòng) rồi chuyển dần | nền tảng để chuyển các lát còn lại | 🟡 |

---

## 5. VIỆC CẦN ANH CHỐT TRƯỚC KHI CHUYỂN

1. **Thứ tự ở §4** có đúng ưu tiên của anh không? *(em đề xuất: QUYỀN trước, rồi luật phiếu, rồi nhập liệu, báo cáo, chứng từ)*
2. **Định dạng hiển thị** (số/ngày/tiền) — giữ ở frontend *(thuần render)* hay chuyển luôn sang server?
3. **Trạng thái UI** (mở/đóng modal, sắp xếp cột, kéo-thả, local storage) — em **đề xuất GIỮ ở frontend** vì là render; nếu anh muốn chuyển thì nói rõ.
4. **`app/page.tsx` 2.780 dòng**: cho phép em **tách module trước** *(không đổi hành vi)* rồi mới chuyển logic — hay anh muốn chuyển thẳng?
5. **Tiêu chí “xong”**: frontend **không còn luật** *(bảo vệ bằng test tự động)* — anh có muốn em viết test cấm frontend chứa luật *(ví dụ cấm `status===`, `reduce(`, tính tiền, sinh mã)* không?

---

## 6. RÀNG BUỘC KỸ THUẬT ĐÃ RÚT RA TRONG PHIÊN *(tránh lặp lại)*

```
· Các file `drizzle/` chạy trên **SQLite** (node:sqlite) ⇒ CHỈ dùng `ALTER TABLE ... ADD`;
  `MODIFY COLUMN` sẽ làm UI :8787 DOWN. Thay đổi cấu trúc thật phải ở **Flyway (MySQL)**.
· ⛔ KHÔNG chạy 2 tiến trình `mvn` song song trên cùng `target/` ⇒ sinh hàng loạt lỗi GIẢ
  «Failed to load ApplicationContext / No qualifying bean». Phân biệt `Failures` vs `Errors`.
· Nhãn/`required` của form **bị bảng `form_field_config` trong CSDL ĐÈ lên mã nguồn** ⇒ sửa mã phải sửa cả CSDL.
· Sau khi sửa `app/**` hoặc `lib/**` **PHẢI rebuild bundle** (`gd-cycle`: dừng UI 8787 + proxy 9000 **theo PID**).
```
