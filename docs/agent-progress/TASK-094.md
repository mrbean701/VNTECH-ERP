# TASK-094 — WORKFLOW PHÊ DUYỆT CHO 3 NHÓM QUY TRÌNH: MUA HÀNG · CẤP PHÁT · XUẤT–NHẬP KHO

- **Ngày:** 18/09/2026 · **Trạng thái:** `KHUNG-XONG / CHO-CHOT-NGHIEP-VU` (đã đo hiện trạng + đã có phương án; chờ người dùng chốt 5 câu hỏi ở §4)
- **Nguồn:** người dùng yêu cầu: *"Quy trình mua hàng, quy trình cấp phát, xuất – nhập đều phải có workflow phê duyệt, đề xuất phương án triển khai nếu đã có kế hoạch rồi thì nêu phương án lên."*
- **Công cụ đo:** `tools/do-workflow-phe-duyet-3-nhom.mjs` (đọc thẳng CSDL + mã nguồn, không chép tay)

## 1. HIỆN TRẠNG ĐO ĐƯỢC (18/09/2026) — nhóm nào ĐÃ có duyệt, nhóm nào CHƯA

| Quy trình | Có workflow phê duyệt? | Bằng chứng đo được |
|---|---|---|
| **Phiếu đề nghị mua hàng (MR)** | ✅ **CÓ** — 5 bước, `mode=single` (bước 5 = `all_roles`) | `approval_stage_catalog` **5 bước**: ① CHT xác nhận nhu cầu (`commander,cht`) ② Thư ký TGĐ duyệt (`thuky`) ③ Phòng Dự án kiểm tra khối lượng (`project,da_nv`) ④ Phòng Kế hoạch tiếp nhận (`procurement,kh_nv`) ⑤ Trưởng phòng DA + KH xác nhận cuối (`da_truong,kh_truong`, **all_roles**) · `approvals` **100 dòng** (approved **65** · pending **35**) · `approval_project_assignments` **5** |
| **Phát hành PO (mua hàng)** | ❌ **KHÔNG** | `create_po` gắn capability **`canCreate`**; **không tồn tại** action `approve_po`; PO phát hành thẳng sau khi phiếu được duyệt |
| **Cấp phát / Xuất kho** | ❌ **KHÔNG** | `issue_stock` = **`canCreate`**; **không có** `approve_issue` |
| **Nhập kho** | ⚠️ **MỘT PHẦN** | `receive_goods` = `canCreate` (không có duyệt); `confirm_delivery` = **`canApprove`** nhưng đây là **BCH xác nhận GIAO HÀNG THỰC TẾ**, không phải duyệt phiếu nhập |
| Điều chuyển · Kiểm kê · Hoàn trả kho tổng | ✅ **ĐÃ CÓ action duyệt** (nhưng **rời rạc**) | `approve_transfer_order` · `approve_stock_count` · `approve_central_return` — đều `canApprove` |
| Sản lượng · Nhật ký thi công · Chi phí công trường · Nghiệm thu lắp đặt | ✅ có action duyệt | `approve_production_report` · `approve_construction_daily_log` · `approve_site_expense_claim` · `confirm_installation` |
| **MAR — duyệt vật tư kỹ thuật** | ⚠️ **bảng đã có, CHƯA dùng** | `material_mar_approvals` = **0 dòng** |
| Engine workflow tổng quát | ⚠️ **có khung, chỉ phục vụ phiếu đề nghị** | `workflow_definitions` **1 dòng** (`WF-MUAHANG-01`, `module_key = requests`, mô tả *"Luồng duyệt 5 bước cho phiếu đề nghị mua hàng"*) · `workflow_steps` **5** · `workflow_step_approvers` **5** |
| Theo dõi tiến trình cung ứng (không phải duyệt) | ℹ️ đang chạy | `supply_workflow_steps` **56 dòng** (cột `request_id`/`purchase_order_id`/`receipt_id`/`step`/`status`/`due_at`) |

**Kết luận thẳng:** hiện **CHỈ phiếu đề nghị mua hàng** có luồng duyệt; **PO · cấp phát/xuất kho · nhập kho CHƯA có cổng phê duyệt**.
**Tin tốt:** nền móng đã có sẵn — engine duyệt (`approval_stage_catalog` + `workflow_*`), quyền `canApprove`, dải phê duyệt dùng chung (`ApprovalTimeline`), hộp thư duyệt, và 3 action duyệt mẫu của điều chuyển/kiểm kê/hoàn trả.

## 2. NGUYÊN TẮC TRIỂN KHAI (để không phá luồng đang chạy)

1. **KHÔNG dựng engine mới.** Mở rộng engine đang chạy theo `module_key` và **dùng lại** `ApprovalTimeline` + hộp duyệt + `canApprove`.
2. **Cổng chặn đặt ở đúng action "GHI SỔ"** (không chặn ở màn hình): `receive_goods` (nhập kho) · `issue_stock` (xuất/cấp phát) · `create_po` (phát hành PO) — vì mọi đường vào (UI, nhập Excel, gọi API trực tiếp) đều đi qua action.
3. **Không phá luồng phiếu đề nghị:** bảng `approvals` (100 dòng đang chạy) **giữ nguyên**; phần mới dùng **bảng/khung song song có `entity_type` + `entity_id`** rồi mới hợp nhất nếu an toàn.
4. **Mỗi giai đoạn phải có CỔNG ĐO có đối chứng dương**: *chưa duyệt ⇒ action bị chặn (mã lỗi + nguyên văn)* · *duyệt xong ⇒ action chạy* · **dọn sạch fixture** và khôi phục đúng số dòng.
5. **Parity 2 đường phục vụ:** mọi thay đổi phải có ở **cả Java (đường đang chạy `:9000`) và JS** (`scripts/system-route.mjs`), kèm migration **drizzle + Flyway** nếu đụng lược đồ.

## 3. PHƯƠNG ÁN TRIỂN KHAI — 6 GIAI ĐOẠN

| GĐ | Việc | Cổng kiểm chứng (đối chứng dương) |
|---|---|---|
| **P0** | **Khung dùng chung:** thêm `entity_type`/`entity_id` (+ `module_key`) cho khung duyệt; 1 hàm `requireApproved(entityType, entityId)` ở cả Java + JS; 1 hộp duyệt dùng chung cho mọi loại chứng từ | Cổng: `requireApproved` chặn khi `pending` · cho qua khi `approved` · **không đụng** luồng phiếu hiện có (100 dòng `approvals` giữ nguyên) |
| **P1** | **PO phát hành:** `create_po` ⇒ PO ở `pending_approval`; chỉ PO `approved` mới cho `receive_goods`; màn Mua hàng hiện badge + nút duyệt | Probe: tạo PO → **nhận hàng bị CHẶN** (nguyên văn) → duyệt → **nhận hàng chạy** → dọn fixture |
| **P2** | **Cấp phát / Xuất kho:** `issue_stock` ⇒ phiếu xuất `pending_approval` (người duyệt cấu hình theo `module_key=warehouse_issue`) | Probe: xuất kho khi chưa duyệt ⇒ **bị chặn**; sau duyệt ⇒ chạy; tồn kho **không đổi** khi còn `pending` |
| **P3** | **Nhập kho:** `receive_goods` ⇒ `pending_approval` (Thủ kho + BCH); **giữ** `confirm_delivery` như bước xác nhận riêng | Probe: nhập khi chưa duyệt ⇒ chặn; sau duyệt ⇒ tồn kho tăng **đúng số lượng** |
| **P4** | **Chuẩn hoá 3 action duyệt rời rạc** (`approve_transfer_order` · `approve_stock_count` · `approve_central_return`) vào cùng khung + cùng hộp duyệt | Probe: mỗi loại 1 chứng từ: chặn → duyệt → chạy (3/3) |
| **P5** | **MAR**: kích hoạt `material_mar_approvals` (duyệt vật tư kỹ thuật trước khi đặt hàng) | Probe: MAR `pending` ⇒ không cho đặt hàng; duyệt ⇒ cho |

**Ước lượng:** P0 **1 vòng** (khung + hàm + migration) · P1–P3 **mỗi giai đoạn 1 vòng** (Java + JS + UI + probe) · P4 **1 vòng** · P5 **1 vòng**. Tổng **6 vòng** theo đúng nhịp hiện tại (mỗi vòng đều có build + hồi quy + cổng ảnh + hồ sơ + commit).

## 4. ⏸️ 5 CÂU CẦN NGƯỜI DÙNG CHỐT TRƯỚC KHI THI HÀNH (nghiệp vụ)

1. **Ai duyệt từng nhóm?** (đề xuất: **PO** = Trưởng Kế hoạch + Kế toán · **Cấp phát/xuất** = CHT/BCH + Kế toán · **Nhập kho** = Thủ kho + BCH · **Điều chuyển** = 2 thủ kho + Kế toán)
2. **Có ngưỡng tiền không?** (ví dụ: PO < 20 triệu miễn duyệt; ≥ 20 triệu mới cần — nếu có, ngưỡng đặt ở đâu?)
3. **Mỗi chứng từ duyệt 1 bước hay nhiều bước tuần tự?** (phiếu đề nghị đang 5 bước — PO/xuất/nhập có cần nhiều bước như vậy không?)
4. **Chặn cứng hay chỉ cảnh báo?** (đề xuất **chặn cứng**: chưa duyệt thì không được nhập/xuất — đúng chữ *"phải có workflow phê duyệt"*)
5. **Nhập kho:** **thêm** một bước duyệt mới, hay **nâng cấp** `confirm_delivery` (BCH xác nhận giao hàng) thành bước duyệt chính thức?

## 6. ✅ CHỐT NGHIỆP VỤ CỦA NGƯỜI DÙNG (18/09) + THIẾT KẾ CHI TIẾT

**Người dùng chốt (nguyên văn ý):**
1. *"Làm theo nghiệp vụ được đề xuất, **thiết kế workflow ĐỘNG** để có thể thay đổi quy trình được. **Nạp sẵn dữ liệu để test** đối với các luồng mới này."*
2. *"Chưa cần đặt **ngưỡng tiền**. User có quyền từ chối PO sẽ tự ra quyết định thủ công. **Logic: PR được duyệt nhưng PO bị từ chối thì PR VẪN MỞ**, đồng thời **HỦY PO đó** và **yêu cầu user tạo PO đó làm lại / xử lý lại** (gửi **thông báo** đến user tạo PO)."*
3. *"Tạm thời phiếu đề nghị mua hàng cứ **giữ nguyên** như vậy, miễn đang là workflow động thì có thể chỉnh sửa được."*
4. *"**Chỉ cảnh báo**"* (KHÔNG chặn cứng).

### 6.1. Hệ quả kỹ thuật (đã sửa lại so với phương án ban đầu)

| Điểm | Phương án ban đầu | **CHỐT LẠI theo người dùng** |
|---|---|---|
| Cổng | `requireApproved()` **chặn** action | **CHỈ CẢNH BÁO**: action **vẫn chạy**, kèm `warning` + bản ghi duyệt `pending` + biểu ngữ trên giao diện. **Không** ném lỗi chặn. |
| Ngưỡng tiền | có thể cấu hình ngưỡng | **KHÔNG làm** (bỏ hẳn khỏi phạm vi P1–P3, ghi vào non-goals) |
| Cấu hình | sửa trong migration | **WORKFLOW ĐỘNG**: `workflow_definitions` + `workflow_steps` + `workflow_step_approvers` **sửa được qua giao diện quản trị** (đổi bước / đổi vai trò / bật-tắt / nhân bản định nghĩa theo `module_key` + `version`) |
| Phiếu đề nghị (PR) | có thể đổi | **GIỮ NGUYÊN 5 bước hiện tại**, chỉ **đưa vào engine động** để chỉnh được về sau |
| Dữ liệu test | chỉ probe tạm | **NẠP SẴN dữ liệu test** cho các luồng mới (xem §6.3) |

### 6.2. Luồng **PO bị từ chối** (nghiệp vụ mới, phải làm đúng)

```
PR đã duyệt  ──► tạo PO (pending_approval)
                     │
        ┌────────────┴─────────────┐
        ▼                          ▼
   PO được DUYỆT              PO bị TỪ CHỐI
   → approved                → cancelled (kèm lý do, người quyết, thời điểm)
   → cho phép nhận hàng      → **PR VẪN MỞ** (không đổi trạng thái PR)
                             → **THÔNG BÁO cho user đã tạo PO đó**: "PO <số> đã bị hủy — hãy tạo lại/xử lý lại"
                             → UI PO hiện rõ "Đã hủy — cần xử lý lại" + nút tạo lại
                             → ghi audit (ai từ chối, lý do) + vào hộp thư người tạo
```
* Dùng lại hạ tầng thông báo đang chạy: `task_notifications` + `email_outbox` (đã kiểm chứng ở TASK-080 đợt 2D).
* **Quyền từ chối PO** = `canApprove` trên module mua hàng (đã có sẵn cơ chế).

### 6.3. Dữ liệu test nạp sẵn cho các luồng mới (yêu cầu 1)
Seed (parity **drizzle + Flyway**) tạo **workflow definitions cho 3 module mới** (`purchasing` · `warehouse_issue` · `warehouse_receipt`) + **4 chứng từ mẫu** để test ngay trên UI:
1. PO `pending_approval` (để bấm Duyệt) · 2. PO `cancelled` do bị từ chối **kèm thông báo đã gửi cho người tạo** (để xem luồng xử lý lại) · 3. phiếu **xuất kho** `pending_approval` · 4. phiếu **nhập kho** `pending_approval`.
Kèm probe: **đối chứng dương** (chưa duyệt ⇒ có **cảnh báo** nhưng action vẫn chạy; sau duyệt ⇒ không còn cảnh báo) + **dọn sạch/khôi phục đúng số dòng** khi cần.

### 6.4. ⏸️ CÂU HỎI CÒN LẠI — mục 5 (nhập kho), người dùng yêu cầu em đề xuất rồi xác nhận

**Đề xuất của em: PHƯƠNG ÁN A — THÊM một bước duyệt mới cho phiếu nhập** (giữ `confirm_delivery` là bước BCH xác nhận hàng về).
* **Vì sao:** hai việc **khác nhau về bản chất** — `confirm_delivery` = *"hàng đã về đúng/sai so với chứng từ"* (xác nhận thực tế, do BCH/CHT), còn **duyệt phiếu nhập** = *"cho phép ghi TĂNG tồn kho"* (trách nhiệm thủ kho/kế toán). Trộn hai ý nghĩa vào một bước sẽ **mất truy vết** đúng như lớp lỗi đã gặp ở các module khác.
* **Phương án B (để anh cân nhắc):** **nâng cấp** chính `confirm_delivery` thành bước duyệt chính thức — ít bước hơn, nhưng **một bước mang hai nghĩa**, và sau này rất khó tách nếu cần báo cáo "hàng về đúng giờ" tách khỏi "đã cho nhập kho".
* **Đề xuất kèm (cho cả A và B):** bước duyệt phiếu nhập cấu hình được trong engine động ⇒ sau này có thể gộp/tách mà **không cần sửa mã**.

**👉 Cần anh xác nhận: A hay B?** (mặc định em làm **A** nếu anh không phản hồi, vì A giữ được truy vết và vẫn đổi được cấu hình sau).

### 6.5. Cập nhật thứ tự thi hành (sau khi chốt)
**P0** khung + engine động (+ màn quản trị sửa quy trình) → **P1** PO (+ luồng từ chối PO ở §6.2) → **P2** cấp phát/xuất → **P3** nhập kho (theo A/B) → **P4** chuẩn hoá 3 action duyệt rời rạc → **P5** MAR. **Chế độ CẢNH BÁO** ở mọi bước; **seed test data** ở §6.3 nạp cùng P1–P3.

## 7. RỦI RO ĐÃ NHẬN DIỆN

- **`approvals` đang có 35 dòng `pending`** ⇒ mọi thay đổi phải **không** làm hỏng luồng 5 bước đang chạy (P0 phải chứng minh bằng probe "100 dòng giữ nguyên").
- **Nhánh duyệt song song `all_roles` đang là mã chết ở cả hai lõi** (KP #54: JS ghi snapshot `single` cho mọi bước có Owner) ⇒ nếu P0–P5 dùng tới `all_roles`, phải **sửa cả gốc snapshot** trước, nếu không sẽ lặp lại đúng lỗi cũ.
- **Ngưỡng tiền** (câu 2) nếu có ⇒ phải thêm cột cấu hình + luật so tiền ở **cả hai đường**; dễ phát sinh lệch JS↔Java (đã có tiền lệ).
- **Tồn kho**: P2/P3 đụng trực tiếp số lượng tồn ⇒ mọi probe phải **đo tồn trước/sau** và **khôi phục đúng** số dòng (đã có mẫu ở các probe kho hiện tại).
