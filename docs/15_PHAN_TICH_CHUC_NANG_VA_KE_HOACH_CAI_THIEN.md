# 15 — PHÂN TÍCH CHỨC NĂNG & KẾ HOẠCH CẢI THIỆN

Ngày lập: 14/09/2026 · Người lập: Agent phát triển · Căn cứ: **đo đạc trên hệ thống đang chạy** (Java + MySQL thật)

> Tài liệu này **phân tích** hệ thống hiện tại và **đề xuất cải thiện** — không phải kế hoạch cutover (xem `docs/14`).
> Mọi số liệu dưới đây đều lấy từ máy thật, có lệnh tái lập ở mục 9.

---

## 1. QUY MÔ HỆ THỐNG (đo thực tế)

| Hạng mục | Số liệu | Nguồn |
|---|---|---|
| **Action nghiệp vụ** | **174** — đã port **174/174** sang Java | `ACTION_CATALOG.json` |
| **Module chức năng** | **61** module keys (trong seed JS) | `drizzle/*.sql` |
| **Nhóm menu** | **12** nhóm | `menu_group_catalog` seed |
| **Bảng dữ liệu** | **115 bảng · 1.478 cột** | `information_schema` |
| **Đơn vị tổ chức** | **7** (VNTECH, KH, DA, TCKT, HCPC, BCH…) | `organization_units` seed |
| **Mã nguồn UI** | `app/page.tsx` **682 KB / 1 file** | filesystem |
| **Mã nguồn Java** | **113 file / 1.246 KB** | filesystem |
| **Backend JS cũ** | `scripts/system-route.mjs` **601 KB** | filesystem |
| **Test** | **64 test / 0 fail** | Maven |
| **Độ phủ smoke** | **18/174 action (10,3%)** chạy HTTP thật | contract-tests |

### Phân bố 174 action theo module (top 12)

| Module | Số action | Ý nghĩa nghiệp vụ |
|---|---|---|
| `material_catalog` | 15 | Danh mục vật tư, quy cách, mã ngoài, quy đổi ĐVT |
| `boq` | 15 | BOQ, mapping vật tư, so khớp, import giá |
| `inventory` | 8 | Tồn kho, điều chuyển, kho tổng |
| `requests` | 6 | Phiếu đề nghị mua hàng (DNMH) |
| `central_warehouse` | 4 | Hoàn trả Kho Tổng |
| `material_norms` | 4 | Định mức vật tư |
| `stocktake` | 4 | Kiểm kê, đối chiếu |
| `dept_legal_*` | 12 | Pháp chế: văn bản, công văn, con dấu, BHXH |
| `dept_finance_*` | 14 | Tài chính: thanh toán, tạm ứng, chi phí, quỹ |
| `dept_plan_*` / `dept_project_*` | 12 | Nhiệm vụ phòng ban |
| `admin` / `purchasing` / `teams` / … | phần còn lại | Quản trị, mua hàng, tổ đội |

**Phân bố theo quyền**: `canEdit` 58 · `canCreate` 29 · `canApprove` 17 · `canView` 4 · `canUse` 2 · không gắn module 64.

---

## 2. 🔴 PHÁT HIỆN NGHIÊM TRỌNG NHẤT: THIẾU SEED DANH MỤC NỀN

### 2.1 Bằng chứng

```
JS  (drizzle/ — 76 migration): seed 25 bảng, 66 lệnh INSERT
Java (V2__system_seed.sql)   : seed  2 bảng (role_catalog, approval_stage_catalog)

⇒ 23 BẢNG JS SEED MÀ JAVA CHƯA SEED
```

Đo trên MySQL đang chạy:

| Bảng | Số dòng | Cần cho |
|---|---|---|
| `module_catalog` | **0** | Menu, phân quyền theo module |
| `menu_group_catalog` | **0** | Nhóm menu (12 nhóm) |
| `organization_units` | **0** | **Tạo người dùng** (phòng/ban) |
| `business_scope_catalog` | **0** | Phạm vi nghiệp vụ |
| `business_role_group_catalog` | **0** | Nhóm vai trò nghiệp vụ |
| `business_role_group_scopes` | **0** | Gán phạm vi cho nhóm vai trò |
| `material_categories` / `material_subcategories` | **0** | Cây danh mục vật tư |
| `user_module_permissions` | **0** | Quyền chi tiết từng user |
| `form_field_config` | **0** | Biểu mẫu động |
| `task_sla_policies` | **0** | Chính sách SLA |
| `vntech_product_identity` / `vntech_trust_settings` | **0** | Bản sắc/trust lock |
| … *(23 bảng, xem mục 9 để tái lập)* | | |

### 2.2 Vì sao bug này **vô hình** cho tới giờ

Mọi test và smoke trước đây đều chạy bằng **`admin`**. Nhưng lý do sâu hơn nằm ở **mục 2.5** — và nó nghiêm trọng hơn cả việc thiếu seed.

### 2.3 Hậu quả THẬT (đã kiểm chứng bằng script, không suy đoán)

| # | Hậu quả | Mức | Bằng chứng |
|---|---|---|---|
| **H1** | **KHÔNG tạo được người dùng nào** — `create_user` gọi `resolveOrganization()` cần `organization_units`; rỗng ⇒ lỗi *"Phòng/bộ phận không tồn tại hoặc đã được lưu trữ"* | 🔴 **ĐÃ XÁC NHẬN** | `tools/probe-nonadmin-access.mjs` → HTTP **400** |
| **H2** | ~~Người dùng không phải admin bị chặn mọi thao tác~~ | ❌ **SAI — đã bác bỏ** | Kỹ sư gọi `save_material` → HTTP **200** (không bị chặn). Lý do: xem mục 2.5 |
| **H3** | Menu không phân theo quyền (UI dùng fallback tĩnh) ⇒ mọi vai trò thấy cùng menu | 🟠 Cao | `moduleCatalog=0` khi bootstrap |
| **H4** | Màn "Danh mục vật tư" không có cây danh mục gốc | 🟠 Cao | `material_categories=0` |
| **H5** | Biểu mẫu động, SLA policy, trust lock không hoạt động | 🟡 TB | `form_field_config=0`, `task_sla_policies=0` |
| **H6** | Màn Quản trị (module/menu/phân quyền) trống — admin không cấu hình được | 🟠 Cao | `module_catalog=0` |

> ⚠️ **Đính chính**: bản nháp đầu của tài liệu này suy luận rằng người dùng không phải admin sẽ bị **chặn mọi thao tác (H2)**. Kiểm chứng thực tế **bác bỏ** suy luận đó — và phát hiện ra một lỗi **nghiêm trọng hơn nhiều** (mục 2.5).

### 2.5 🔴 LỖI NGHIÊM TRỌNG NHẤT: PHÂN QUYỀN MODULE BỊ VÔ HIỆU HOÀN TOÀN

```
RbacService.requireActionModule()  — ĐƯỢC ĐỊNH NGHĨA
Nhưng: số lần GỌI trong toàn bộ java-backend = 0
```

**Kiểm chứng thực tế** (`tools/probe-rbac-gap.mjs`) — user role `engineer` (không phải admin), gọi các action mà JS yêu cầu quyền module/vai trò:

| Action | Yêu cầu theo JS | Kết quả thật | Đánh giá |
|---|---|---|---|
| `save_material` | `material_catalog` / canEdit | **HTTP 200** — tạo được vật tư | ⚠️ Thoát |
| `save_supplier` | `supplier_catalog` / canCreate | **HTTP 200** — tạo được NCC | ⚠️ Thoát |
| `save_approval_stage` | `approvals` / canUse | **HTTP 200** — tạo được bước duyệt | ⚠️ Thoát |
| `save_bank_account` | `dept_finance_cashbank` | HTTP 400 (lỗi thiếu dữ liệu, **không phải 403**) | ⚠️ Thoát |
| `create_project` | vai trò `admin` | **HTTP 403** — chặn đúng | ✅ Đúng |

**⇒ 4/5 action THOÁT khỏi kiểm soát phân quyền module.**

**Bản chất**: có **2 lớp** phân quyền trong thiết kế, nhưng chỉ **1 lớp** được nối:

| Lớp | Trạng thái |
|---|---|
| `requireRole()` — kiểm tra **vai trò** (admin/commander/…) | ✅ **Đang chạy** (vd `create_project` 403 đúng) |
| `requireActionModule()` — kiểm tra **quyền module chi tiết** của từng người | ❌ **Chưa nối** (0 lời gọi) |

**Hệ quả vận hành**: mọi nhân viên đã đăng nhập đều có thể sửa **danh mục vật tư, nhà cung cấp, bước phê duyệt, tài khoản ngân hàng…** bất kể được cấp quyền gì. Nghiêm trọng hơn: kết hợp với H1 (không tạo được user) thì hiện chỉ có admin tồn tại — nhưng **ngay khi tạo được người dùng, lỗ hổng này lộ ra toàn bộ**.

> **Đây là ưu tiên số 1 của toàn bộ kế hoạch**, trước cả việc sinh seed.

### 2.4 Cách sửa (đề xuất ưu tiên #1)

Mở rộng `tools/generate-system-seed.mjs` để sinh **V3__reference_seed.sql** từ chính 76 file `drizzle/*.sql`:

1. Trích mọi `INSERT [OR IGNORE] INTO <bảng>` từ `drizzle/` (theo **đúng thứ tự** migration để tôn trọng phụ thuộc).
2. Chuyển cú pháp SQLite → MySQL:
   - `INSERT OR IGNORE INTO` → `INSERT IGNORE INTO`
   - `datetime('now')` → `CURRENT_TIMESTAMP(3)`
   - `ON CONFLICT(...) DO UPDATE` → `ON DUPLICATE KEY UPDATE`
   - Bỏ `AUTOINCREMENT`/`RETURNING`
3. **Giữ ưu tiên migration sau ghi đè migration trước** (JS dùng mô hình tuần tự; `0029` và `0045` ghi đè nhãn/thứ tự của `0010`/`0011`) ⇒ dùng `INSERT ... ON DUPLICATE KEY UPDATE` cho các bảng danh mục.
4. Chạy lại Flyway ⇒ V3 nạp 61 module + 12 nhóm menu + 7 đơn vị tổ chức + danh mục vật tư + quyền mặc định.

**Kiểm chứng bắt buộc sau khi sửa**: tạo user **không phải admin** và chạy 1 action nghiệp vụ — đây là kịch bản chưa từng được test.

---

## 3. ĐÁNH GIÁ CHỨC NĂNG THEO NHÓM

### 3.1 Đã hoàn chỉnh & đã kiểm chứng thật

| Nhóm chức năng | Trạng thái | Bằng chứng |
|---|---|---|
| **Xác thực & phiên** | ✅ Tốt | PBKDF2-SHA256 600k, cookie `mep_session`, lockout 10 lần/15 phút |
| **Chuỗi mua hàng** (DNMH → duyệt 5 bậc → PO → nhập kho → BCH xác nhận) | ✅ **Chạy trọn vẹn** | smoke 28/28 PASS |
| **Kho & cấp phát** (xuất cho tổ đội → hoàn trả) | ✅ Đã sửa bug tồn kho | movement `SMI` + ledger ±5 |
| **Dự án & hợp đồng & BOQ** | ✅ Nền tảng tốt | BOQ version → dòng BOQ → mapping |
| **Tệp đính kèm** (`/api/files`) | ✅ Mới port | upload 201 · tải về đúng byte |
| **Bảo mật giao diện** | ✅ Tốt | fingerprint gate, trust lock, header `x-vntech-*` |

### 3.2 Có nhưng **chưa từng chạy thật** (rủi ro cao)

**156/174 action (89,7%)** chưa chạy HTTP trên MySQL thật. Nhóm rủi ro nhất:

| Nhóm | Số action | Rủi ro nếu sai |
|---|---|---|
| **Kho nâng cao**: điều chuyển 4 bước, hoàn trả Kho Tổng 3 bước, kiểm kê, đối chiếu, chuyển quyền sở hữu, đảo bút toán | ~15 | 🔴 **Sai số liệu tồn kho** (đã có tiền lệ bug #10) |
| **Tài chính**: kế hoạch thanh toán, tạm ứng, chi phí công trường, sổ quỹ, chứng từ kế toán, ngân hàng | ~14 | 🔴 **Sai số liệu tiền** |
| **BOQ nâng cao**: import, replace 4 chế độ, giá hợp đồng, mapping, so khớp | ~10 | 🟠 Sai khối lượng/giá trị hợp đồng |
| **Luồng duyệt**: trả lại, gửi lại, hủy, xóa phiếu, bình luận | ~8 | 🟠 Kẹt luồng phê duyệt thật |
| **Quản trị**: user/role/module/menu/biểu mẫu, license, factory reset | ~25 | 🟠 Dùng khi cấu hình |

### 3.3 Khoảng trống chức năng đã biết

| # | Thiếu | Mức |
|---|---|---|
| G2 | **Java không gửi email** (có `spring-boot-starter-mail` nhưng 0 class dùng) | 🔴 |
| G3 | Email/SLA worker tồn tại nhưng chưa nối SMTP thật | 🟠 |
| — | **Không có phân trang** cho danh sách lớn (bootstrap `LIMIT 300`, 200…) | 🟠 |
| — | **Không có test tải/hiệu năng**; `app/page.tsx` 682 KB tải 1 lần | 🟠 |
| — | **Không có audit log ghi** (`audit_logs` = 0 dòng dù đã thao tác) | 🟠 |
| — | Không có xuất Excel/PDF phía server (đang làm ở client) | 🟡 |

---

## 4. ĐÁNH GIÁ KIẾN TRÚC & CHẤT LƯỢNG

### 4.1 Điểm mạnh

- ✅ **Clean Architecture** rõ ràng: `web → infrastructure → application → domain`, 32 port.
- ✅ **Tương thích 100% hợp đồng JS** ⇒ UI không phải sửa.
- ✅ Flyway + MySQL thuần, **không còn phụ thuộc SQLite**.
- ✅ Có **3 lớp gate**: test H2 · smoke HTTP thật · scanner SQL tĩnh.
- ✅ **Fingerprint integrity** bảo vệ mã nguồn gốc.

### 4.2 Điểm yếu (xếp theo mức nguy hiểm)

| # | Điểm yếu | Mức | Ghi chú |
|---|---|---|---|
| **Y1** | **Phân quyền module bị vô hiệu** — `requireActionModule()` 0 lời gọi ⇒ 4/5 action rò rỉ quyền | 🔴 **NGHIÊM TRỌNG** | Lỗ hổng bảo mật; xem mục 2.5 |
| **Y2** | **Thiếu seed danh mục nền** — không tạo được người dùng | 🔴 | Chặn vận hành nhiều người |
| **Y3** | **Test H2 không tương đương MySQL** — đã sửa UNIQUE, còn FK/index/kiểu | 🔴 | Nguồn gốc nhiều bug lọt |
| **Y4** | **Test tự `INSERT` dữ liệu nền** thay vì đi qua use-case | 🔴 | Che bug port |
| **Y5** | **Email chưa hoạt động** | 🔴 | Mất thông báo phê duyệt |
| **Y6** | **Không ghi audit log** (`audit_logs`=0 dù đã thao tác) | 🟠 | Truy vết yếu |
| **Y7** | **Độ phủ smoke 10,3%** | 🟠 | 156 action chưa kiểm chứng |
| **Y8** | **`app/page.tsx` 682 KB, 1 file** | 🟠 | Khó bảo trì, tải chậm |
| **Y9** | **Không phân trang** | 🟠 | Chậm khi dữ liệu lớn |
| **Y10** | **UI là SSR** ⇒ chưa bỏ được Node | 🟡 | Phương án B chưa làm |
| **Y11** | Không có CI/CD tự động chạy smoke | 🟡 | Gate phụ thuộc thao tác tay |

---

## 5. KẾ HOẠCH CẢI THIỆN — 4 GIAI ĐOẠN

### GIAI ĐOẠN 1 — Vá chặn vận hành 🔴 *(2–3 tuần)* — **BẮT BUỘC trước khi dùng thật**

| # | Việc | Kết quả mong đợi | Ước lượng |
|---|---|---|---|
| **1.1** | **NỐI LẠI PHÂN QUYỀN MODULE** — gọi `requireActionModule(user, action)` trong `SystemController.post()` trước khi dispatch (mục 2.5) | 4/5 action rò rỉ ⇒ 0; mọi action đúng quyền module | 1–2 ngày |
| **1.2** | **Test phân quyền**: user role `engineer` phải bị **403** ở `save_material`/`save_supplier`/`save_approval_stage` | Chốt hồi quy cho lỗ hổng nghiêm trọng nhất | 1 ngày |
| **1.3** | **Sinh `V3__reference_seed.sql`** từ `drizzle/` (mục 2.4) — gồm `organization_units` | 61 module + 12 menu + 7 đơn vị + danh mục vật tư + quyền mặc định | 2–3 ngày |
| **1.4** | **Test tạo user KHÔNG phải admin** rồi chạy action nghiệp vụ | Bắt được H1; xác nhận hệ thống dùng được nhiều người | 0,5 ngày |
| **1.5** | **Port email** (`EmailDispatcher` + `@Scheduled`) | Email phê duyệt/SLA gửi được | 1–2 ngày |
| **1.6** | **Ghi audit log** cho mọi action ghi | Truy vết được ai đổi gì (hiện `audit_logs` = 0) | 1 ngày |
| **1.7** | **Đồng bộ schema test H2 với MySQL** (FK, index, kiểu) | Test H2 phát hiện lỗi như MySQL | 1 ngày |
| **1.8** | Smoke **P0**: kho nâng cao + tài chính (~29 action) | Độ phủ ~47/174 (27%) | 3–5 ngày |

### GIAI ĐOẠN 2 — Hoàn thiện chất lượng 🟠 *(2–3 tuần)*

| # | Việc | Kết quả |
|---|---|---|
| 2.1 | Smoke **P1**: BOQ nâng cao + luồng duyệt (~18 action) | Độ phủ ~65/174 (37%) |
| 2.2 | **Bỏ thói quen test tự seed** — chuyển sang đi qua use-case | Chống tái phát bug #7–#12 |
| 2.3 | **Phân trang + lọc server-side** cho danh sách lớn | Tải nhanh khi nhiều dữ liệu |
| 2.4 | **Tách `app/page.tsx`** thành module theo màn hình | Bảo trì được, bundle nhỏ hơn |
| 2.5 | **Đưa smoke vào CI** (chạy cùng `mvn verify`) | Gate tự động |
| 2.6 | Test hiệu năng cơ bản (bootstrap 1000 dự án/vật tư) | Biết ngưỡng chịu tải |

### GIAI ĐOẠN 3 — Hoàn thiện nghiệp vụ 🟡 *(3–4 tuần)*

| # | Việc | Kết quả |
|---|---|---|
| 3.1 | Smoke **P2**: quản trị, HR, pháp chế, sản lượng (~25 action) | Độ phủ ~90/174 (52%) |
| 3.2 | Xuất Excel/PDF **phía server** (thay vì client) | In ấn ổn định, đúng mẫu |
| 3.3 | Báo cáo tổng hợp: tồn kho theo thời điểm, công nợ, tiến độ | Giá trị quản trị |
| 3.4 | Thông báo trong ứng dụng + email tuỳ chọn theo người dùng | Giảm phụ thuộc email |
| 3.5 | Nhật ký bảo mật: đăng nhập, đổi quyền, xóa | Tuân thủ |

### GIAI ĐOẠN 4 — Bỏ hẳn Node *(tuỳ chọn, 2–3 tuần)*

| # | Việc | Kết quả |
|---|---|---|
| 4.1 | Chuyển UI SSR → SPA tĩnh, nhúng vào Java `static/` | Bỏ Node vĩnh viễn |
| 4.2 | Kiểm chứng lại **toàn bộ** giao diện sau chuyển đổi | Không hồi quy UI |
| 4.3 | Đóng gói 1 artifact duy nhất (JAR) + runbook mới | Vận hành đơn giản |

---

## 6. THỨ TỰ ƯU TIÊN ĐỀ XUẤT

```
NGAY (chặn vận hành — theo thứ tự BẮT BUỘC)
  1. Nối lại phân quyền module   ← LỖ HỔNG BẢO MẬT: 4/5 action rò rỉ quyền
  2. Test phân quyền             ← chốt hồi quy cho #1
  3. V3 reference seed           ← không có thì KHÔNG tạo được người dùng nào
  4. Test user không phải admin  ← kịch bản chưa từng chạy
  5. Email dispatcher
  6. Audit log

TIẾP THEO (chất lượng)
  7. Đồng bộ schema test H2
  8. Smoke P0 (kho + tài chính)
  9. Phân trang
  10. Tách page.tsx

SAU (hoàn thiện)
  11-16. Smoke P1/P2 · báo cáo · thông báo · bảo mật · Phương án B
```

---

## 7. RỦI RO NẾU KHÔNG CẢI THIỆN

| Kịch bản | Hậu quả |
|---|---|
| Đưa vào dùng thật ngay | **Không tạo được người dùng** (H1) ⇒ chỉ admin dùng được; **và** nếu tạo được thì **mọi nhân viên sửa được danh mục vật tư/NCC/bước duyệt** (Y1) |
| Không nối lại phân quyền | Rủi ro **nội bộ & tuân thủ**: nhân viên sửa được dữ liệu nền tảng, tạo bước phê duyệt, đổi tài khoản ngân hàng |
| Không mở rộng smoke | 156 action chưa kiểm chứng — bug như #10 (sai tồn kho) có thể còn |
| Không làm email | Phê duyệt không có thông báo ⇒ quy trình treo vì không ai biết |
| Không phân trang | Ứng dụng chậm dần khi dữ liệu thật đổ vào |
| Không làm audit log | Không truy vết được ai đã sửa gì khi có sự cố |

---

## 8. KẾT LUẬN

**Điểm mạnh**: nền tảng kỹ thuật **tốt và đã kiểm chứng thật** — 174/174 action, chuỗi cung ứng chạy trọn vẹn, 64 test xanh, dữ liệu đúng, kiến trúc sạch, bảo toàn hợp đồng UI.

**Hai lỗi quyết định phát hiện trong lần phân tích này** (đều **đã kiểm chứng bằng script**, không suy đoán):

1. 🔴 **Phân quyền module bị vô hiệu hoàn toàn** — `requireActionModule()` có định nghĩa nhưng **0 lời gọi**; user role `engineer` gọi được `save_material`, `save_supplier`, `save_approval_stage` (**4/5 action rò rỉ**). Chỉ còn lớp `requireRole()` hoạt động.
2. 🔴 **Thiếu seed 23 bảng danh mục nền** — `organization_units` rỗng ⇒ `create_user` trả **400**, **không tạo được bất kỳ người dùng nào**; kèm `module_catalog`/`menu_group_catalog` rỗng ⇒ menu không phân quyền, màn Quản trị trống.

Hai lỗi này **bổ sung cho nhau thành rủi ro lớn**: hiện chỉ có admin dùng được, nhưng **ngay khi tạo được người dùng thì lỗ hổng phân quyền lộ ra toàn bộ**.

**Bài học phương pháp**: cả 64 test lẫn mọi smoke trước đây đều chạy bằng `admin`, nên **cả hai lỗi đều vô hình**. ⇒ Phải bổ sung bài test **"người dùng không phải admin"** như một gate bắt buộc — đây là kịch bản chưa từng tồn tại trong bộ test.

**Khuyến nghị**: làm **mục 1.1–1.4 của Giai đoạn 1** trước khi cho bất kỳ ai khác dùng thử.

---

## 9. LỆNH TÁI LẬP SỐ LIỆU

```powershell
# 1) Quy mô
(Get-Content java-backend/ACTION_CATALOG.json -Raw | ConvertFrom-Json).actions.Count   # 174
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u vntech -pvntech vntech_erp -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='vntech_erp';"   # 115

# 2) Danh mục nền rỗng (bằng chứng thiếu seed)
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u vntech -pvntech vntech_erp -e "SELECT 'module_catalog' t,COUNT(*) n FROM module_catalog UNION ALL SELECT 'menu_group_catalog',COUNT(*) FROM menu_group_catalog UNION ALL SELECT 'organization_units',COUNT(*) FROM organization_units UNION ALL SELECT 'role_catalog',COUNT(*) FROM role_catalog;"

# 3) Khoảng trống seed JS vs Java (25 bảng vs 2 bảng)
node tools/measure-seed-gap.mjs

# 4) XÁC NHẬN H1: không tạo được người dùng
node tools/probe-nonadmin-access.mjs

# 5) XÁC NHẬN LỖ HỔNG PHÂN QUYỀN (nghiêm trọng nhất)
node tools/probe-rbac-gap.mjs

# 6) Chứng minh requireActionModule KHÔNG được gọi ở đâu
Select-String -Path "java-backend\**\*.java" -Pattern "requireActionModule" |
  Where-Object { $_.Path -notmatch "RbacService|ActionRbacRegistry" }   # ⇒ rỗng

# 7) Độ phủ smoke
Get-ChildItem java-backend/contract-tests/*.mjs | Select-String -Pattern 'call\("([a-z_]+)"' -AllMatches

# 8) Khôi phục mật khẩu admin nếu cần
node tools/reset-password.mjs admin "Vntech@2026"
```

**Người quyết định**: cần bạn xác nhận thứ tự ưu tiên (mục 6) trước khi bắt tay Giai đoạn 1.
