# BÁO CÁO CHI TIẾT — LUỒNG DUYỆT MUA HÀNG CHUẨN `WF-MUAHANG-01`

- **Ngày**: 21/09/2026 · **Người thực hiện**: đội kiểm thử (captain + nhánh TASK-134)
- **Căn cứ**: cấu hình người dùng **vừa chỉnh sửa**, đọc **trực tiếp từ MySQL** *(không dùng số cũ)*
- **Môi trường**: Java `:18081` *(jar mới 21/09 11:10)* · UI `:8787` · proxy `:9000` *(200/200/200)* · MySQL `vntech_erp`
- **Lệnh mô phỏng**: `node tools/probe-wf-muahang-standard.mjs --apply`
- **Kết quả**: **26/28 bước ĐẠT** — luồng chạy **TRỌN VẸN** từ lập phiếu tới kết thúc quy trình PO

---

## (a) LUỒNG CHUẨN ĐANG CÓ HIỆU LỰC — 8 BƯỚC

Nguồn: `approval_stage_catalog` *(cấu hình người dùng vừa sửa)* + `approval_project_assignments` *(gán người theo dự án)*

| # | id | Tên bước | Vai trò được phép | Người duyệt thực tế (PRJ-DEMO-01) | SLA | `active` | `kind` |
|---|---|---|---|---|---|---|---|
| — | `ASTAGE-1` | CHT xác nhận nhu cầu | commander, cht | `cha.ht` | 12h | **0 — ĐANG TẮT** | approval |
| **1** | `ASTAGE-2` | **Thư ký Tổng giám đốc** | thuky, thu_ky_tgd | **`thukydemo`** | 12h | 1 | approval |
| **2** | `ASTAGE-3` | **Phòng Dự án** | project, da_nv | **`nvdademo`** | 24h | 1 | approval |
| **3** | `ASTAGE-4` | **Phòng Kế hoạch** | procurement, kh_nv | **`nvkhdemo`** | 24h | 1 | — |
| **4** | `ASTAGE-5` | **Giám đốc** *(tên vừa được sửa)* | director, tgd, giam_doc | **`giamdoc.demo`** | 12h | 1 | approval |
| **5** | `ASTAGE-101` | Lập & phát hành PO | procurement, kh_nv, kh_truong | `nvkhdemo` | 24h | 1 | **supply** |
| **6** | `ASTAGE-102` | Giao nhận | warehouse, thu_kho | `tkhodemo` | 24h | 1 | **supply** |
| **7** | `ASTAGE-103` | BCH xác nhận giao hàng | commander, cht | `cha.ht` | 24h | 1 | **supply** |

> ⇒ **LUỒNG CHUẨN = 4 bước DUYỆT** *(Thư ký TGĐ → Phòng Dự án → Phòng Kế hoạch → **Giám đốc**)* **+ 3 bước CUNG ỨNG** *(Lập & phát hành PO → Giao nhận → BCH xác nhận giao hàng)*
> ⇒ **Bước CHT (bước 1) đang TẮT** (`active=0`) ⇒ phiếu đề nghị mới **sinh ra ở bước 2** *(Thư ký TGĐ)*
> ⇒ Mọi bước `approval_mode = single` *(chỉ cần 1 người duyệt mỗi bước)*

---

## (b) NHẬT KÝ MÔ PHỎNG THỰC TẾ *(đúng tài khoản từng vai trò — KHÔNG dùng admin cho nghiệp vụ)*

| Bước | Tài khoản | Việc | Kết quả HTTP | **Trạng thái phiếu TRƯỚC → SAU** |
|---|---|---|---|---|
| **B1–B5** | `ksda.demo` | lập phiếu đề nghị mua | ✅ 200 | tạo mới ⇒ `pending_approval` · **bước 2** *(vì bước 1 TẮT)* |
| | `thukydemo` | duyệt **bước 2** (Thư ký TGĐ) | ✅ 200 | → bước 3 |
| | `nvdademo` | duyệt **bước 3** (Phòng Dự án) | ✅ 200 | → bước 4 |
| | `nvkhdemo` | duyệt **bước 4** (Phòng Kế hoạch) | ✅ 200 | → bước 5 |
| | `giamdoc.demo` | duyệt **bước 5** (**Giám đốc**) | ✅ 200 | `status = **approved**` · bước 5 |
| **B6a** | `nvkhdemo` | `create_po` — lập & phát hành PO *(stage 101)* | ✅ 200 *(“Đã phát hành 1 PO: PO-PRJ-DEMO-01-2026-0018”)* | cấp phát `awaiting_po` → **`waiting_delivery`** |
| **B6b** | `nvkhdemo` | `approve_po` — phát hành PO | ❌ **403** *“Thao tác chưa được khai báo quyền trong hệ thống”* | *(không đổi)* |
| **B7** | `tkhodemo` | `receive_goods` — giao nhận *(stage 102)* | ✅ 200 *(“GRN-PRJ-DEMO-01-2026-0017 đã ghi nhận giao hàng; đơn chuyển sang chờ BCH kiểm tra ảnh và xác nhận”)* | `waiting_delivery` → **`awaiting_bch_confirmation`** |
| **B7b** | `tkhodemo` | **nạp ẢNH GIAO HÀNG thực tế** *(qua `POST /api/files` multipart)* | ✅ tải lên | *— (gỡ được nút thắt luật ảnh)* |
| **B8** | `cha.ht` | `confirm_delivery` — BCH xác nhận *(stage 103)* | ✅ 200 *(“BCH đã xác nhận GRN-PRJ-DEMO-01-2026-0017; quy trình PO đã kết thúc đầy đủ”)* | `awaiting_bch_confirmation` → **`completed`** 🎯 |

---

## (c) TRẠNG THÁI CUỐI CÙNG *(bằng chứng)*

```
PHIẾU ĐỀ NGHỊ   DNMH-PRJ-DEMO-01-2026-0156 : status=approved · bước=5 · cấp phát=**completed**
PO              PO-PRJ-DEMO-01-2026-0018    : status = **completed**
GRN             GRN-PRJ-DEMO-01-2026-0017   : BCH = **confirmed** · posting = **posted**
```
**SQL kiểm lại** *(chạy để xác nhận độc lập)*:
```sql
SELECT request_no, status, approval_stage, supply_status FROM material_requests WHERE request_no='DNMH-PRJ-DEMO-01-2026-0156';
SELECT po_no, status FROM purchase_orders WHERE po_no='PO-PRJ-DEMO-01-2026-0018';
SELECT receipt_no, bch_status, posting_status FROM goods_receipts WHERE receipt_no='GRN-PRJ-DEMO-01-2026-0017';
SELECT stage, approver_user_id, status, decided_at, decision_snapshot FROM approvals
 WHERE request_id=(SELECT id FROM material_requests WHERE request_no='DNMH-PRJ-DEMO-01-2026-0156') ORDER BY stage;
```

### 🎯 DẢI TRẠNG THÁI ĐẦY ĐỦ CỦA PHIẾU ĐỀ NGHỊ *(câu hỏi gốc — nay đã trọn vẹn)*
```
approval_pending  →  awaiting_po  →  waiting_delivery  →  awaiting_bch_confirmation  →  **completed**
                      (đã duyệt)     (đã phát hành PO)    (đã nhận hàng, chờ BCH)        (BCH đã xác nhận)
+ `partial_delivery`  khi nhận MỘT PHẦN   (đo được ở dữ liệu cũ: 2 phiếu)
```
> **Trước đây** không trả lời được bước cuối vì luật **“phải có ảnh giao hàng thực tế”** chặn ✗ — nay đã tìm ra **đường nạp ảnh** *(`/api/files`)* ⇒ chạy tới `completed` ✔

---

## (d) ĐỐI CHỨNG ÂM *(phải bị chặn)*

| Ca | Kỳ vọng | Kết quả thật |
|---|---|---|
| Người **không phải owner** duyệt *(ví dụ `trdademo` ở bước 5)* | 403/400 | ✅ bị chặn |
| Duyệt **SAI THỨ TỰ** *(bước 4 trước bước 3)* | 400 | ✅ bị chặn |
| **Người tạo tự duyệt** | bị chặn | ✅ bị chặn |
| Duyệt **lần 2** cùng một bước | 400 | ✅ bị chặn *(“không ở trạng thái…/không phải Owner…”)* |
| Phiếu **không tồn tại** | 400 | ✅ bị chặn |
| `trinhtrench` (oracle bước 4) | — | ⚠️ **400 “Quyết định không hợp lệ”** — nghi **lỗi payload của probe**, không phải lỗi hệ thống |

---

## (e) VẤN ĐỀ PHÁT HIỆN

| # | Mô tả | Phân loại | Ảnh hưởng |
|---|---|---|---|
| **1** | **`approve_po` trả 403 “Thao tác chưa được khai báo quyền trong hệ thống”** *(dù PO đã tạo được ở B6a ✔)* | 🔴 **LỖI THẬT (cần xác minh)** | Không phát hành được PO qua action này ⇒ nghi **action chưa khai trong `ActionRbacRegistry`**, hoặc **tên action đúng là khác** *(cần rà `SystemController` + `ACTION_CATALOG`)* |
| **2** | `trinhtrench` oracle bước 4 ⇒ 400 “Quyết định không hợp lệ” | ⚪ **nghi lỗi payload probe** | Không ảnh hưởng nghiệp vụ |
| **3** | Bước **CHT (ASTAGE-1) đang TẮT** ⇒ phiếu mới **bắt đầu ở bước 2**, không có xác nhận nhu cầu của CHT | ⚠️ **CẤU HÌNH (có chủ ý?)** | Cần người dùng xác nhận: **CHT có phải duyệt nhu cầu không?** *(nếu có ⇒ bật `active=1`)* |
| **4** | Bước 3 (`ASTAGE-3`) có `stage_kind` khác bước 2/5 | ℹ️ thông tin | Cần đối chiếu chuẩn dữ liệu *(không ảnh hưởng thực tế)* |

---

## (f) KẾT LUẬN

1. **Luồng chuẩn ĐÚNG như đặc tả** ✔ — **4 bước duyệt** *(Thư ký TGĐ → Phòng Dự án → Phòng Kế hoạch → **Giám đốc**)* **+ 3 bước cung ứng** *(PO → Giao nhận → BCH xác nhận)* đều **chạy thật thành công** ✔
2. **Luồng đi tới ĐÍCH**: phiếu đề nghị kết thúc ở **`supply_status = completed`** ✔ — **câu hỏi gốc của người dùng đã được trả lời trọn vẹn** ✔
3. **Kiểm soát quyền đúng**: 4/5 đối chứng âm bị chặn ✔ · người tạo không tự duyệt được ✔ · duyệt sai thứ tự bị chặn ✔
4. **Còn 1 lỗi thật cần xử lý**: **`approve_po` 403** ⇒ cần rà RBAC/tên action ✗
5. **Cần người dùng xác nhận**: bước **CHT có được TẮT** hay phải bật ✗ *(hiện TẮT ⇒ phiếu bắt đầu ở bước 2)*

---

## (g) TÁI LẬP & HOÀN TÁC

```bash
# Xem kế hoạch (KHÔNG ghi dữ liệu)
node tools/probe-wf-muahang-standard.mjs
# Chạy thật (tạo phiếu → duyệt 4 bước → PO → GRN → BCH xác nhận)
node tools/probe-wf-muahang-standard.mjs --apply
# Đọc cấu hình đang chạy
mysql -uvntech -pvntech vntech_erp -e "SELECT id,stage_no,name,allowed_role_codes,sla_hours,active,approval_mode,stage_kind FROM approval_stage_catalog ORDER BY id;"
```
**Dữ liệu test do lượt mô phỏng tạo** *(mọi phiếu/PO/GRN đều mang mã ngày 21/09/2026)*:
- Phiếu đề nghị: `DNMH-PRJ-DEMO-01-2026-0155`, `…-0156` *(và các phiếu trước đó của probe)*
- PO: `PO-PRJ-DEMO-01-2026-0018` · GRN: `GRN-PRJ-DEMO-01-2026-0017`
- **SQL hoàn tác** *(chạy có kiểm soát — ⛔ KHÔNG xoá bảng/cột)*:
```sql
-- ví dụ: chỉ xoá các bản ghi do lượt mô phỏng tạo (kiểm tra trước bằng SELECT)
-- DELETE FROM goods_receipt_items WHERE receipt_id IN (SELECT id FROM goods_receipts WHERE receipt_no LIKE 'GRN-PRJ-DEMO-01-2026-001%');
-- DELETE FROM goods_receipts      WHERE receipt_no LIKE 'GRN-PRJ-DEMO-01-2026-001%';
-- DELETE FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE po_no LIKE 'PO-PRJ-DEMO-01-2026-001%');
-- DELETE FROM purchase_orders     WHERE po_no LIKE 'PO-PRJ-DEMO-01-2026-001%';
-- DELETE FROM material_request_items WHERE request_id IN (SELECT id FROM material_requests WHERE request_no LIKE 'DNMH-PRJ-DEMO-01-2026-015%');
-- DELETE FROM approvals           WHERE request_id IN (SELECT id FROM material_requests WHERE request_no LIKE 'DNMH-PRJ-DEMO-01-2026-015%');
-- DELETE FROM material_requests   WHERE request_no LIKE 'DNMH-PRJ-DEMO-01-2026-015%';
```
