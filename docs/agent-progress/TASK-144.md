# TASK-144 — NHÓM PR 2.1–2.7: LÀM LẠI MÀN «PHIẾU ĐỀ NGHỊ MUA HÀNG» (vòng 216)

**Trạng thái:** ✅ **XONG** · `npm test` **693 pass · 0 fail · skipped 1** EXIT=0 · vân tay nguồn `VNTECH-FP-500939DF111D533C` (700 tệp) `verify` ĐẠT EXIT=0 · **chưa commit theo chỉ đạo của người dùng**.
**Ngày:** 02/10/2026 · **Người giao:** yêu cầu vòng 211 (nhóm PR, mục 2.1 → 2.7).
**Phạm vi ghi tệp:** `app/screens/Requests.tsx` · `app/page.tsx` · `lib/labels.ts` · `lib/ui-shared.tsx` · `tests/v215-phieu-de-nghi-muc-2-1-den-2-7.test.mjs` (mới) · `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json` · `docs/dsh-state/*` · `testlog.md`.
⛔ **DATABASE:** không đụng · **API:** không đụng · **Java:** không sửa (máy này không có Maven — D-044).

---

## ① YÊU CẦU (mục 2.1 → 2.7 của nhóm PR)

Làm lại màn `app/screens/Requests.tsx` cho đúng nghiệp vụ và đúng cách phân quyền: bỏ nhãn thừa · gom nút CRUD · tìm kiếm và lọc · sắp xếp · nút xem/tạo phiếu · nút phát hành PO · dịch nhãn trạng thái.

---

## ② ĐO TRƯỚC KHI CODE (⛔ không bịa cột)

Đo trên `GET /api/system` ngày 02/10/2026 — `material_requests` = `data.requests`, **84 dòng**, 26 khoá:

`approvalStage, approvals, area, boqVersionCode, boqVersionId, contractId, contractNo, id, issuedQty, itemCount, items, neededAt, priority, projectCode, projectId, projectName, purpose, receivedQty, requestNo, requestedAt, requestedBy, status, supplyStatus, teamId, teamName, totalEstimatedValue, totalQty`

| Phép đo | Kết quả | Hệ quả cho mã |
|---|---|---|
| `createdBy` | **0/84** | ⛔ cột này **không tồn tại** ⇒ «người tạo» phải là `requestedBy` (**84/84**, 9 tên hiển thị khác nhau) |
| `totalEstimatedValue` | null **0/84** | ép `Number()` khi sắp xếp |
| `status` | `approved` 37 · `pending_approval` 7 · `returned_to_requester` 40 | 3 nhãn trạng thái cần dịch |
| `supplyStatus` | 9 giá trị, gồm `returned` 40 · `issued` 1 · `partial_issued` 1 | ⛔ 40/84 phiếu đang hiện **RAW** `returned` |
| `approvalStage` | `0`:40 · `1`:2 · `2`:5 · `5`:37 | bộ lọc «Bước duyệt», `0` = «Chưa vào duyệt» |
| `approved` **+** `awaiting_po` | **17/84**, và **17/17** không còn bước duyệt pending | điều kiện bật nút «＋ Phát hành PO» khớp đúng luật `PoModal` |

Kiểm tra an toàn cho mục 2.7: `returned` / `issued` / `partial_issued` chỉ xuất hiện làm giá trị của `material_requests` (`scripts/system-route.mjs:1227` và `:1726`) ⇒ **không đụng nhãn của thực thể khác**.

---

## ③ HAI LỖI IM LẶNG ĐÃ TÌM RA

### 3.1 · D-093 — Ba nút phân quyền chưa từng hiện ra

`Requests` khai prop `permission?: Row` và đọc:

```ts
const canCreate = Boolean(permission?.canCreate);
const canExport = Boolean(permission?.canExport);
```

Nhưng nơi gọi ở `app/page.tsx` **không hề truyền prop đó**:

```tsx
<Requests rows={…} projects={…} … />   // ❌ thiếu permission
```

⇒ `permission` là `undefined` ⇒ hai biến trên **vĩnh viễn `false`** ⇒ «＋ Lập phiếu đề nghị», «⇧ Nhập Excel», «⇩ Xuất Excel» **không bao giờ được vẽ ra**, và ai đọc code cũngnghĩ chúng đang chạy.

Đã vá: `permission={activePermission}` (biến đã có sẵn ở `page.tsx:605`).

### 3.2 · D-094 — Không thể xoá/huỷ phiếu nếu không phải admin

`RequestModal` ghi `requestedBy: data.user.fullName` ⇒ cột `material_requests.requested_by` lưu **TÊN HIỂN THỊ**.
Bốn cổng phía máy chủ lại so với **`user.id` (UUID)**: `delete_request` · `cancel_request` · `resubmit_request` · `update_returned_request`.

⇒ Không tài khoản nào khác `admin` thoát được, trong khi **40/84** phiếu đang ở `returned` — đúng loại phiếu người dùng cần gửi lại.

**Quyết định:** ⛔ **không đặt nút «Xoá phiếu» / «Huỷ phiếu» lên UI.** Một nút mà gần như ai cũng bấm vô nghĩa thì tệ hơn không có nút. Sửa gốc cần thêm cột `requested_by_id` (hoặc tra `full_name → user.id`) ⇒ **migration** ⇒ **TYPE 3, chờ USER quyết**.

---

## ④ SÁU LỖI §15 — TÀI LIỆU/NGOÃN LƯỜ KHÔNG ĐƯỢC MÔ TẢ SAI MÀN HÌNH

Cột `key:"sla"` mang tiêu đề **«SLA»** nhưng render `neededAt` ⇒ tên cột mô tả sai dữ liệu. Đã đổi thành `key:"neededAt"` / **«Ngày cần»** — đúng cách gọi đã dùng ở `RequestModal` và bản in (kiểm chứng bởi `tests/task136-request-form-optional-fields.test.mjs`).

Ngoài ra: bỏ `note` thừa của `ListToolbar`, bỏ `note` của 4 KPI mặc định, bỏ dòng `functional-summary`. Vì `Kpi.note` đã là tuỳ chọn nên `<p>{note}</p>` phải thành `{note && <p>{note}</p>}`.

---

## ⑤ CỔNG KIỂM CHỨNG

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit --incremental false` | ✅ **0 lỗi** EXIT=0 |
| `tests/v215-phieu-de-nghi-muc-2-1-den-2-7.test.mjs` (mới) | ✅ **20 vệ** · `pass 20 · fail 0` EXIT=0 |
| **Đối chứng âm × 3** | ✅ cài 3 lỗi (`canIssuePo` đọc `canUse` · nhãn `returned` đổi lại RAW · `Kpi.note` thành bắt buộc) ⇒ **đúng 3 vệ đỏ**, EXIT=1; khôi phục **byte-identical** cả 3 tệp |
| `npm test` | ✅ **693 pass · 0 fail · skipped 1** EXIT=0 (nền 673 + 20 vệ) |
| `node scripts/verify-vntech-fingerprint.mjs` | ✅ `VNTECH-FP-500939DF111D533C` · 700 tệp · EXIT=0 (`brandFingerprint` đổi theo source; `releaseFingerprint` **KHÔNG** đổi) |
| Màn hình + API sống | ✅ UI HTTP 200 · API `ok=true` · 84 phiếu · **17** phiếu bật được nút Phát hành PO |

ⓘ Một vệ test trong đối chứng âm **phải sửa mới đỏ**: ban đầu vệ khẳng định `note?: string` trong `ui-shared.tsx` vẫn **xanh** sau khi đã đổi thành `note: string`, vì tệp đó còn nhiều prop khác cũng khai `note?: string`. Đã khoá theo **chữ ký `function Kpi(`**.

---

## ⑥ BA LỖI CỦA CHÍNH TÔI TRONG VÒNG NÀY (đã ghi D-095 · D-096)

1. **`FindLine` trả chỉ số 0-based** ⇒ `RemoveRange($i - 1, 3)` xoá **dòng trước khối** (chính là nút cần giữ) thay vì 3 dòng của khối ⇒ mất nút + còn 1 dòng mồ côi. **Không báo lỗi nào.** Mốc gỡ CHÍNH LÀ `$i`.
2. **Probe kiểm tra phải là khối nhiều dòng liền nhau**, không phải một dòng đơn lẻ — một dòng đơn lẻ không chứng minh được khối còn liền mạch.
3. **`Substring(1, len-2)` trên chuỗi `'…',` giữ lại dấu `'` đóng** ⇒ dòng JSX kết thúc bằng `</button>'`. `tsc` **vẫn xanh** (dấu `'` chỉ là text node) nhưng màn hình hiện rác; chỉ `eslint` mới bắt. Đã thêm vệ test chặn đúng hình dạng này.

---

## ⑦ CHƯA LÀM (cố ý) VÀ CÒN LẠI

- ⛔ **Nút Xoá/Huỷ phiếu** — xem `D-094`.
- ⛔ **Chưa commit, chưa push** (anh bảo «Chưa commit, để tôi xem trước»). Nhánh `unity`, không merge `main`.
- **Còn lại yêu cầu vòng 211:** menu **1.2** (code xong, `V35` đã viết nhưng **CHƯA CHẠY** ⇒ TYPE 3) · **PO 3.2** (đưa «← Quay lại» sang bên phải + làm nổi bật, `app/screens/PurchaseOrderDrawer.tsx:31`) · **PO 3.3** (bỏ dòng rác/«Mã khoá thuật (request_id)») · **4.1** (tài liệu điều hướng NCC ↔ PO ↔ vật tư — 1 `.md` + 1 `.docx` theo form chuẩn của dự án).