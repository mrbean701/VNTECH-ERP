# BÁO CÁO KIỂM THỬ TOÀN DIỆN — VNTECH ERP V5.3.0

- **Ngày**: 21/09/2026 · **Người thực hiện**: đội kiểm thử (captain + các nhánh chuyên sâu)
- **Phạm vi**: theo yêu cầu người dùng gồm 7 nhóm việc *(tạo tài khoản fit luồng duyệt · dữ liệu mẫu · luồng mua hàng end-to-end tới nhập kho · cấp phát/xuất kho · kiểm quyền từng user · tổ đội + nhà cung cấp · báo cáo)*
- **Môi trường**: hệ thống ĐANG CHẠY THẬT — Java `:18081` *(jar mới 21/09 09:33)* · UI `:8787` · proxy `:9000` *(cả 3 = HTTP 200)* · CSDL MySQL `vntech_erp`
- **Nguyên tắc**: mọi kết luận phải có **lệnh + kết quả thật** *(SQL hoặc HTTP)* · dữ liệu test **chỉ INSERT/UPDATE**, ⛔ **không DROP/ALTER/DELETE bảng-cột**

---

## 1. TÀI KHOẢN TEST *(yêu cầu ①)*

**Mật khẩu chung của tài khoản demo: `Vntech@2026`** *(do probe đặt qua admin — ghi lại để người dùng tự đăng nhập kiểm)*

| Tài khoản | Vai trò | Phòng | Dùng để test |
|---|---|---|---|
| `admin` | admin | Công ty VNTECH | quản trị, đặt mật khẩu, các action đặc quyền |
| `ksda.demo` / `engineer.demo` | ksda | Phòng Dự án | **lập phiếu đề nghị mua** |
| `cha.ht` | cht | Ban chỉ huy công trường | duyệt BCH · **khoá KHO** *(nhận hàng)* |
| `thukydemo` | thuky | Tổng công ty | **duyệt bước 2** *(Thư ký TGĐ)* |
| `nvdademo` | da_nv | Phòng Dự án | **duyệt bước 3** *(kiểm khối lượng)* |
| `nvkhdemo` | kh_nv | Phòng Kế hoạch | **duyệt bước 4** + **lập PO** |
| `trdademo` | da_truong | Phòng Dự án | đối chứng âm bước 5 |
| `trinhtrench` | kh_truong | Phòng Kế hoạch | đối chứng âm · đối tác |
| `giamdoc.demo` | director | Ban giám đốc | **chốt bước 5** *(Owner được phân phân công của dự án)* |
| `tkhodemo` | thu_kho | Ban chỉ huy công trường | **nhận hàng (GRN)** · **tạo phiếu xuất kho** |
| `kttdemo` | accountant | Tài chính–Kế toán | duyệt kế toán *(mật khẩu KHÁC `Vntech@2026` — đang được đặt lại)* |

**Ma trận quyền đo được** *(`user_module_permissions`, tổng 1048 dòng + 480 dòng quyền phòng ban)*:

| User | Module | `can_edit` | Ghi chú |
|---|---|---|---|
| `ksda.demo` · `engineer.demo` · `nvdademo` · `trdademo` | 60 | **14** | `dept_project_*` |
| `nvkhdemo` · `trinhtrench` | 60 | **14** | `dept_plan_*` *(gồm `dept_plan_purchasing`, `dept_plan_suppliers`)* |
| `kttdemo` | 60 | **6** | `dept_finance_*` |
| `cha.ht` · `tkhodemo` | 60 | **2** | `receiving` · `warehouse_receipt` |
| `thukydemo` | 60 | **0** | ⚠️ **0 quyền sửa nhưng VẪN duyệt được** ⇒ cơ chế duyệt dùng **đường quyền riêng**, không qua `can_edit` |
| `giamdoc.demo` | **2 → 60** | 0 | ✅ **đã sửa lỗ hổng**: trước chỉ có 2 module + `can_approve=0`, nay **60 module · 60 `can_approve`** |
| `admin` | **0 dòng** | — | **superuser bằng MÃ** *(không phải lỗi dữ liệu — đã kiểm chứng admin chạy được mọi action)* |

> **SQL đã chạy để cấp quyền Giám đốc** *(hoàn tác được)*:
> ```sql
> -- cấp bộ module của Thư ký TGĐ cho Giám đốc (chỉ thêm dòng còn thiếu)
> INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,created_at,updated_at,can_create,can_edit,can_approve,can_export,permission_source)
> SELECT CONCAT('UMP_',LOWER(HEX(RANDOM_BYTES(16)))), @dir, t.module_key, t.can_view,t.can_use,@now,@now,t.can_create,t.can_edit,t.can_approve,t.can_export,'manual_override'
> FROM user_module_permissions t WHERE t.user_id=@tpl AND NOT EXISTS (...);
> -- bật can_approve cho 2 dòng có sẵn
> UPDATE user_module_permissions SET can_approve=1, can_use=1 WHERE user_id=@dir AND module_key IN ('approvals','requests');
> -- HOÀN TÁC:
> DELETE FROM user_module_permissions WHERE user_id=(SELECT id FROM users WHERE username='giamdoc.demo') AND module_key NOT IN ('approvals','requests');
> ```

---

## 2. DỮ LIỆU MẪU ĐÃ TẠO *(yêu cầu ②)*

### 2.1 Mã vật tư mẫu — **14 → 36 mã / 6 nhóm**
| Nhóm | Số mã | Mã mẫu |
|---|---|---|
| `CAT-DIEN` *(Điện)* | 9 | `DIEN-DAY-CAD-001…004` · `DIEN-ONG-LUON-001/002` · `DIEN-THIET-BI-001…003` |
| `CAT-KHAC` *(Khác/VLXD + Văn phòng)* | 10 | `KHAC-VLXD-001…008` · `KHAC-VAN-PHONG-001/002` *(giấy A4, mực in)* |
| `CAT-CTN` *(Cấp thoát nước)* | 7 | `CTN-ONG-NHUA-001…004` · `CTN-VAN-001…003` |
| `CAT-HVAC` | 4 | `HVAC-ONG-GIO-001…003` · `HVAC-MAY-LANH-001` |
| **`CAT-ELV`** *(Điện nhẹ)* | **3** | `ELV-CAMERA-001` · `ELV-DAY-MANG-001` · `ELV-TU-DIEN-001` |
| **`CAT-PCCC`** | **3** | `PCCC-DAU-PHUN-001` · `PCCC-BINH-CHUA-CHAY-001` · `PCCC-ONG-THEP-001` |

> **`ELV` và `PCCC` trước đó KHÔNG có mã nào** — nay đã có để test đủ nhóm.
> Mỗi mã có **tên · đơn vị · đơn giá chuẩn · tồn tối thiểu · cờ `requires_cocq` · cờ `requires_mar`** *(3 mã PCCC đặt `requires_cocq=1`)* + `subcategory_id` theo quy ước `<NHÓM>-<LOẠI>`.
> ⛔ **Chỉ INSERT** — 14 mã gốc giữ nguyên.

### 2.2 Tổ đội + kho — **tổ đội 1 → 3 · kho 4 → 6**
```sql
-- thêm 2 tổ đội (mỗi tổ có kho riêng, copy cấu trúc kho tổ đội sẵn có)
INSERT INTO warehouses (...) SELECT CONCAT('WHTEAM_',LOWER(HEX(RANDOM_BYTES(16)))),'TD-PRJ-DEMO-01-TD-02','Kho to doi - To doi dien nuoc 2','team',project_id,parent_warehouse_id,keeper_user_id,1,@now,@now FROM warehouses WHERE code='TD-PRJ-DEMO-01-TD-01';
INSERT INTO warehouses (...) SELECT ... 'TD-PRJ-DEMO-01-TD-03','Kho to doi - To doi hoan thien 3','team', ... ;
INSERT INTO teams (id,code,name,trade,project_id,warehouse_id,leader_user_id,active,created_at,updated_at) VALUES (...,'TD-02','To doi dien nuoc 2','dien_nuoc',@prj,(SELECT id FROM warehouses WHERE code='TD-PRJ-DEMO-01-TD-02'),@leader,1,@now,@now);
INSERT INTO teams (...) VALUES (...,'TD-03','To doi hoan thien 3','hoan_thien',@prj,(SELECT id FROM warehouses WHERE code='TD-PRJ-DEMO-01-TD-03'),@leader,1,@now,@now);
```
Kết quả: `TD-01` *(installation, có sẵn)* · **`TD-02`** *(dien_nuoc)* · **`TD-03`** *(hoan_thien)* — tổ trưởng `cha.ht`.

### 2.3 Phạm vi kho *(sửa lỗi chặn — xem §4.1)*
```sql
INSERT INTO user_warehouse_scopes (id,user_id,warehouse_id,permission,created_at,updated_at)
SELECT CONCAT('UWS_',LOWER(HEX(RANDOM_BYTES(16)))), u.id, w.id, 'write', @now, @now
FROM users u CROSS JOIN warehouses w
WHERE u.username IN ('tkhodemo','cha.ht','kttdemo','trdademo')
  AND w.code IN ('KHO-PRJ-DEMO-01','TD-PRJ-DEMO-01-TD-01','KHO-TONG')
  AND NOT EXISTS (SELECT 1 FROM user_warehouse_scopes s WHERE s.user_id=u.id AND s.warehouse_id=w.id);
-- KẾT QUẢ: 0 → 12 dòng.   HOÀN TÁC: DELETE FROM user_warehouse_scopes WHERE user_id IN (...);
```

---

## 3. LUỒNG MUA HÀNG END-TO-END *(yêu cầu ③)* — **33/35 bước ĐẠT**

**Lệnh**: `node tools/probe-purchasing-flow.mjs --apply` *(đăng nhập bằng **đúng tài khoản từng vai trò**, không dùng admin cho nghiệp vụ)*

```
✔ ksda.demo       LẬP PHIẾU ĐỀ NGHỊ MUA   DNMH-PRJ-DEMO-01-2026-0151  (2 dòng vật tư)
✔ thukydemo       duyệt bước 2  (Thư ký Tổng giám đốc)
✔ nvdademo        duyệt bước 3  (Phòng Dự án — kiểm khối lượng)
✔ nvkhdemo        duyệt bước 4  (Phòng Kế hoạch — tiếp nhận)
✔ giamdoc.demo    duyệt bước 5  (Giám đốc — Owner ĐƯỢC PHÂN CÔNG của dự án) ⇒ CHỐT HỒ SƠ
✔ nvkhdemo        LẬP PO         PO-PRJ-DEMO-01-2026-0015   (waiting_delivery)
✔ tkhodemo        NHẬN HÀNG      GRN-PRJ-DEMO-01-2026-0014
✔ 4 ĐỐI CHỨNG ÂM  cha.ht (bước 1 đã tắt) · trinhtrench · trdademo · trdademo-lần-2 ⇒ đều bị từ chối HTTP 400 ĐÚNG
❌ 5a/5b          xác nhận giao hàng ⇒ HTTP 400 "Phải tải ít nhất một ẢNH GIAO HÀNG THỰC TẾ trước khi BCH xác nhận."  ← LUẬT NGHIỆP VỤ, không phải lỗi mã
```

**Chuỗi duyệt đã được chứng minh trong CSDL** *(`approvals` của phiếu `DNMH-PRJ-DEMO-01-2026-0151`)*:
| stage | người duyệt | vai trò | status |
|---|---|---|---|
| 2 | `thukydemo` | `thuky` | approved |
| 3 | `nvdademo` | `da_nv` | approved |
| 4 | `nvkhdemo` | `kh_nv` | approved |
| 5 | **`giamdoc.demo`** | `director` | approved |

> ⇒ **4 người duyệt với 4 vai trò THẬT khác nhau** ⇒ đúng yêu cầu “fit luồng duyệt”.

### 3.1 🎯 TRẠNG THÁI PHIẾU ĐỀ NGHỊ SAU KHI NHẬP HẾT VẬT TƯ *(câu người dùng dặn)*

CSDL có **2 cột trạng thái độc lập**: `status` *(vòng đời **duyệt**)* và **`supply_status`** *(vòng đời **cung ứng**)*.

| Tình huống | `status` | `approval_stage` | **`supply_status`** |
|---|---|---|---|
| **Nhận ĐỦ hàng (GRN xong)** | `approved` | **5** | 🎯 **`awaiting_bch_confirmation`** |
| **Nhận MỘT PHẦN** | `approved` | 5 | **`partial_delivery`** |
| Đã lập PO, chờ giao | `approved` | 5 | `waiting_delivery` |
| Đã duyệt, chưa có PO | `approved` | 5 | `awaiting_po` |
| Chưa duyệt | `pending_approval` | — | `approval_pending` |

**Phân bố THẬT của 59 phiếu** *(`SELECT status, supply_status, COUNT(*) FROM material_requests GROUP BY status, supply_status`)*:
```
approval_pending 31 · awaiting_po 17 · awaiting_bch_confirmation 7 · partial_delivery 2 · waiting_delivery 2
```
> ⚠️ **KHÔNG tồn tại** giá trị `received` / `completed` / `closed` nào trong CSDL ⇒ ⇒ **“BCH xác nhận giao hàng” là ĐIỂM CUỐI của luồng**, và **chưa phiếu nào vượt qua** *(vì luật ảnh giao hàng thực tế)*.
> ⇒ **Kết luận**: luồng nhập kho **ĐÃ ĐÚNG** tới `awaiting_bch_confirmation`; muốn đi tiếp **phải có ảnh giao hàng thật** *(hoặc nới luật — chờ người dùng quyết)*.

---

## 4. LỖI THẬT ĐÃ TÌM VÀ SỬA

### 4.1 `user_warehouse_scopes` TRỐNG ⇒ chặn nhận hàng (403) — **ĐÃ SỬA**
- **Triệu chứng**: `tkhodemo` (thủ kho, **đúng vai trò**) gọi `receive_goods` ⇒ **HTTP 403 “Tài khoản không có quyền thao tác kho nhận hàng này.”**
- **Nguyên nhân gốc**: bảng `user_warehouse_scopes` **0 dòng** cho mọi user + `role_catalog.warehouse_scope_kind` = `NULL` ⇒ không có phạm vi kho nào.
- **Cách sửa**: cấp **12 dòng** phạm vi kho *(4 user vận hành × 3 kho, quyền `write` — SQL ở §2.3)*.
- **Bằng chứng sau sửa**: probe chạy lại ⇒ **`4a tkhodemo nhận hàng` từ 403 ⇒ 200** ✔ và tạo được **GRN**.

### 4.2 Lỗi chặn bước 5 luồng mua hàng *(TASK-128)* — **KHÔNG phải lỗi mã**
- **Triệu chứng**: `trdademo` *(được cho là người chỉ định bước 5)* ⇒ HTTP 400 *“Bạn không phải Owner được phân công của bước này hoặc không đủ RBAC để phê duyệt.”*
- **Nguyên nhân gốc** *(đo thật)*: cấu hình duyệt **đang chạy** là **`approval_stage_catalog` + `approval_project_assignments`** — **KHÔNG phải** bảng `workflow_step_approvers` *(bảng đó là **ẢNH CHỤP CŨ** do `V8__workflow_multi.sql` seed 18/09/2026; `TASK-106` ngày 20/09 đã đổi owner sang `giamdoc.demo` **mà không cập nhật ảnh chụp**)*.
- **Kết luận**:
  - Owner **THẬT** của bước 5 = **`giamdoc.demo`** *(từ `approvals.approver_user_id` + `approval_project_assignments`)*.
  - `trdademo` chỉ tồn tại trong **ảnh chụp cũ** ⇒ bị từ chối là **ĐÚNG**.
  - Bước 1 (`CHT`) **đã TẮT** trong catalog *(`active=0`)* ⇒ phiếu **sinh ra ở bước 2**.
  - **Chứng minh Java không phải thủ phạm**: đăng nhập `giamdoc.demo` ⇒ `decide_approval stage=5` ⇒ **HTTP 200** *(“Đã hoàn tất luồng phê duyệt; hồ sơ tự chuyển sang Mua hàng & PO…")*.
- **Đã sửa**: **chỉ `tools/probe-purchasing-flow.mjs`** *(kỳ vọng của probe sai, không phải mã app)* → **24/29 ⇒ 33/35 bước ĐẠT**. Commit: `90b52f6` · `1abeddf` · `af3fb0d` · `dc9b0e4`. **Java không sửa dòng nào.**

> ⚠️ **Ghi chú**: các `INSERT` vào bảng **cũ** `workflow_step_approvers` *(gán người duyệt cho 3 luồng)* **không có tác dụng** lên cấu hình đang chạy — bài học cho các lần thiết lập fixture sau.

---

## 5. CẤP PHÁT / XUẤT KHO *(yêu cầu ④)* — **9/12 bước ĐẠT**

**Lệnh**: `node tools/probe-stock-issue-flow.mjs --apply`

```
✅ ĐỐI CHỨNG ÂM: engineer.demo · giamdoc.demo gọi issue_stock ⇒ HTTP 403 "Tài khoản không có quyền thực hiện nghiệp vụ này." ✔
✅ tkhodemo (thủ kho) TẠO ĐƯỢC PHIẾU XUẤT:  PX-PRJ-DEMO-01-2026-0014  ·  status = posted
   ⚠️ kèm cảnh báo: "chưa có bản ghi phê duyệt nào (quy trình động chưa được khởi tạo)"
❌ duyệt bước 1 bằng cha.ht ⇒ HTTP 400 "Không tìm thấy đơn yêu cầu."   ← ảnh hưởng của phát hiện bên dưới
✅ ĐỐI CHỨNG ÂM: duyệt SAI BƯỚC ⇒ bị từ chối ✔
❌ kttdemo đăng nhập ⇒ HTTP 401 (mật khẩu tài khoản khác — lỗi fixture, không phải app)
```

### 🔴 PHÁT HIỆN THẬT #1 — **Phiếu xuất kho KHÔNG đi qua chuỗi duyệt `WF-XUATKHO-01`**
- Cấu hình `WF-XUATKHO-01` **(2 bước: `cha.ht` → `kttdemo`)** **CÓ tồn tại** trong CSDL nhưng **KHÔNG được áp dụng** cho nghiệp vụ xuất kho.
- Bằng chứng: ① cảnh báo của hệ thống *“quy trình động chưa được khởi tạo”* ② gọi duyệt ⇒ **400 “Không tìm thấy đơn yêu cầu”** ③ phiếu tạo ra có `status = posted` **ngay**.
- **Ảnh hưởng**: 🔴 **lỗ hổng kiểm soát** — thủ kho bấm xuất là hàng ra khỏi kho, **không cần BCH/Kế toán duyệt**.
- **Trạng thái**: **CHỜ NGƯỜI DÙNG QUYẾT** *(xuất kho có bắt buộc duyệt 2 bước không?)*.

---

## 6. TỔ ĐỘI + NHÀ CUNG CẤP *(yêu cầu ⑥)*

### 6.1 NHÀ CUNG CẤP + ĐỐI TÁC — **74/75 bước ĐẠT**
**Lệnh**: `node tools/probe-supplier-crud-flow.mjs --apply`
```
✅ delete_partner ⇒ 403 với CẢ 7 user không phải admin (nvkhdemo · trinhtrench · engineer.demo · cha.ht · tkhodemo · ksda.demo · giamdoc.demo)
✅ set_partner_status ⇒ 403 với tkhodemo + ksda.demo
✅ admin XOÁ được ⇒ HTTP 200 "Đã xóa Đối tác" ⇒ SQL xác nhận xoá cứng
✅ TOÀN VẸN: NCC 2→2 · Đối tác 3→3 · PO 22→22 · PO mồ côi 0 · 2 NCC gốc + 3 đối tác gốc NGUYÊN
❌ kttdemo đăng nhập 401 (lỗi fixture — đang đặt lại mật khẩu)
```

### 6.2 TỔ ĐỘI — API đã đối chiếu 3 lớp *(Java ↔ Node ↔ UI)*
| Action | Java | Node |
|---|---|---|
| `create_project_team` | `SystemController.java:960` | `system-route.mjs:1699` |
| `set_project_team_status` | `:965` | `:1716` |
| `delete_project_team` | `:970` | `:1720` |
| `save_team_subcontract` | `:620` | `:1409` |
| `save_team_production` | `:625` | `:1412` |
| `approve_team_production` | `:630` | `:1415` |
| `save_team_payment` | `:635` | `:1418` |
| `settle_team_subcontract` | `:655` | `:1421` |
UI `TeamDirectory.tsx:73-75` khai nút **“Tạo tổ đội” / “Ngừng-khôi phục tổ đội” / “Xoá tổ đội chưa phát sinh giao dịch”** với module quyền **`site_command`**.
**Đã đạt hợp đồng hiển thị** *(`node tools/probe-team-screen.mjs`)*: 6 cột `TM-01` ✔ · ô tìm kiếm ✔ · ghi chú sắp xếp `TM-02` ✔ · **khối GHI NGUỒN** *(teams 1→3 · team_members 6)* ✔ · chi tiết **đúng 6 tab `TM-03`** ✔.

### 🔴 PHÁT HIỆN THẬT #2 — `delete_partner` yêu cầu **ADMIN**
- **Trưởng phòng Kế hoạch (`trinhtrench`) cũng bị 403**; chỉ `admin` xoá được.
- Bản JS cho phép thêm `isDepartmentApprover(user,"KH")` ⇒ **bản Java CHẶT HƠN JS**.
- **Trạng thái**: **CHỜ NGƯỜI DÙNG QUYẾT** *(giữ chặt hay nới theo chức danh?)*.

---

## 7. PHÂN LOẠI “HỎNG” — TÁCH RÕ **LỖI THẬT** vs **KỲ VỌNG LỖI THỜI CỦA TEST CŨ**

Nhiều probe cũ báo “HỎNG” dù **hợp đồng thật ĐẠT** — cần đọc theo bảng sau:

| Probe | Mục báo HỎNG | Phân loại | Lý do |
|---|---|---|---|
| `probe-purchasing-flow` | `2.1 cha.ht` 400 | ⚪ **kỳ vọng sai** | phiếu **sinh ra ở bước 2** *(`ASTAGE-1 active=0`)* ⇒ duyệt bước 1 là duyệt bước **đã qua** |
| `probe-purchasing-flow` | `2.5 trinhtrench` 400 | ⚪ **kỳ vọng sai** | tài khoản **không** được chỉ định ở bước 5 |
| `probe-team-screen` | 3 mục “Tổng quan / Thành viên / Đơn từ” | ⚪ **kỳ vọng sai** | hợp đồng thật `TM-03` là **6 tab khác**: Thông tin · Nhân sự · Dự án · Kho · Cấp phát · Lịch sử |
| `probe-p5` | 4 mục UI *(dropdown phòng ban rỗng · nhãn kèm mã · nút cấp quyền hàng loạt · ô tìm kiếm)* | ⚪ **cần xác minh thêm** | probe cũ; phần còn lại **12 tab · 6 cột quyền · 421 ô tick · 2 dropdown lọc** đều ĐẠT |

| Lỗi | Phân loại |
|---|---|
| `user_warehouse_scopes` trống ⇒ 403 thủ kho | 🔴 **LỖI THẬT** *(dữ liệu)* — **đã sửa** |
| Xuất kho không qua chuỗi duyệt | 🔴 **LỖI THẬT** *(kiểm soát nghiệp vụ)* — **chờ quyết** |
| `delete_partner` chặt hơn JS | 🟡 **KHÁC BIỆT CÓ CHỦ ĐÍCH** — **chờ quyết** |
| Bước 5 bị 400 với `trdademo` | ⚪ **không phải lỗi** *(ảnh chụp cũ lệch cấu hình đang chạy)* |
| Luật ảnh giao hàng chặn BCH | ⚪ **luật nghiệp vụ thật** |
| `kttdemo` 401 | ⚪ **lỗi fixture** *(đang đặt lại mật khẩu)* |

---

## 8. CỔNG KHÔNG HỒI QUY *(yêu cầu “giữ 69/69 · 79/79 · 108/110”)*

| Cổng | Lệnh | Kết quả |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **0 lỗi** |
| Hồi quy | `npm run test:regression` | **69/69 ĐẠT · 0 HỎNG** |
| Workflow | `npm run test:workflow` | **ĐẠT** *(“FULL W2 passed: four-stage spec approvals/email/SLA → …")* |
| Java *(khi có sửa Java)* | `mvn -B -pl web -am test` | **79/79 ĐẠT · 0 fail · 0 error · `MVN_EXIT=0`** |
| Lộ trình | `node tools/probe-roadmap-progress.mjs` | **DONE 108/110 (98,2 %)** |

---

## 9. CÒN LẠI — CẦN NGƯỜI DÙNG QUYẾT

| # | Việc | Vì sao cần quyết |
|---|---|---|
| 1 | 🔴 **Xuất kho có PHẢI duyệt 2 bước (CHT → Kế toán) không?** | phát hiện mới: hiện **xuất thẳng**, không có bản ghi phê duyệt |
| 2 | **`delete_partner` yêu cầu ADMIN** *(TP Kế hoạch cũng 403)* | giữ chặt hay nới theo chức danh như bản JS? |
| 3 | **BCH xác nhận giao hàng cần ẢNH THỰC TẾ** | cần ảnh mẫu *(không tự bịa ảnh)* hoặc cho phép nới luật trong môi trường test |
| 4 | **Ảnh chụp cũ `workflow_step_approvers` bước 5** | có đồng bộ cho khớp cấu hình đang chạy không? *(SQL đề xuất ở TASK-128 §4.2)* |
| 5 | **User rác `testuser86661`** *(role `ksda` nhưng ở phòng Kế hoạch, **không mã nhân viên**)* | tắt / xoá mềm / giữ? |

---

## 10. PHỤ LỤC — LỆNH TÁI LẬP

```bash
# Luồng mua hàng (đúng vai trò, KHÔNG dùng admin cho nghiệp vụ)
node tools/probe-purchasing-flow.mjs            # xem kế hoạch
node tools/probe-purchasing-flow.mjs --apply    # chạy thật

# Cấp phát / xuất kho
node tools/probe-stock-issue-flow.mjs --apply

# Nút NCC + đối tác (kèm đối chứng âm quyền)
node tools/probe-supplier-crud-flow.mjs --apply

# Hợp đồng hiển thị
node tools/probe-team-screen.mjs
node tools/probe-p5.mjs

# Cổng
npx tsc --noEmit && npm run test:regression && npm run test:workflow
cd java-backend && mvn -B -pl web -am test
node tools/probe-roadmap-progress.mjs
```
**Mật khẩu tài khoản demo**: `Vntech@2026` *(riêng `kttdemo` đang được đặt lại)*.
