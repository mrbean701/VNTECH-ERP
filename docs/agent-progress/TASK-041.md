# TASK-041 — `save_approval_stage` / `set_approval_stage_status`: SAI CẢ HỢP ĐỒNG PAYLOAD LẪN 3 QUY TẮC NGHIỆP VỤ

**Trạng thái:** CONFIRMED — đã xác định nguồn sự thật, **CHƯA sửa** (chờ lượt kế tiếp, không cần quyết định của người dùng)
**Nguồn phát hiện:** công cụ mới `tools/probe-write-map-drift.mjs` (so bản đồ GHI JS ↔ Java)
**Ngày:** 17/09/2026

---

## 1. Vì sao tìm ra

Sau **năm lần** gặp dạng lỗi *"ghi được mà đọc không ra"* và nhiều lần *"Java ghi thiếu cột"*, tôi viết một cổng
mới so **bản đồ GHI**: trích `INSERT INTO <bảng> (<cột>)` và `UPDATE <bảng> SET <cột>=…` ở **cả hai phía**, gom
theo bảng, rồi in hiệu đối xứng.

```
JS  : 108 bảng có câu lệnh GHI tĩnh · 1374 cặp (bảng,cột)
Java: 108 bảng · 1371 cặp  (bỏ qua 46 câu lệnh động)
⇒ 17 bảng có lệch cột
```

**Đối chứng dương có sẵn:** công cụ phải bắt được `vntech_license_installations` (ca lệch ĐÃ BIẾT ở nhóm 6) —
nó bắt đúng, nên phép đo có giá trị. Không có bước này thì "17 bảng lệch" không chứng minh được gì.

## 2. Ứng viên đáng nghi nhất về NGHIỆP VỤ: `approval_stage_catalog`

```
JS GHI mà Java KHÔNG ghi : approval_mode, auto_approve_on_submit, sla_hours, sort_order
```

Truy nguyên thì đây **không phải chỉ thiếu cột** — Java lệch cả **hợp đồng payload** lẫn **quy tắc nghiệp vụ**.

### 2.1 UI gửi gì

`ApprovalStageModal` (`app/page.tsx:3830-3834`) gửi:

| Trường | Nguồn |
|---|---|
| `stageNo` | input bắt buộc |
| `sortOrder` | input ẩn, mặc định `(stageNo)*10` |
| `name` | input bắt buộc |
| `description` | input "Nội dung / mô tả" |
| `slaHours` | input bắt buộc, "Thời hạn xử lý (giờ)" |
| `approvalMode` | select `single` / `all_roles` |
| `autoApproveOnSubmit` | checkbox |
| `allowedRoleCodes` | state từ checklist vai trò |
| `stageId` | `row?.id` (khi sửa) |

**UI KHÔNG gửi `code`.**

### 2.2 Java đọc gì — và hỏng ngay ở validate

`OpsTaskManagementUseCase.saveApprovalStage:317-348`:

```java
String code = trim(payload.get("code"));
if (code.isEmpty() || name.isEmpty() || stageNo <= 0)
    throw Api("Bước duyệt cần mã, tên và số thứ tự.");
```

⇒ Vì UI **không bao giờ gửi `code`**, action **luôn trả HTTP 400** trước khi chạm tới SQL.
**Cùng lớp lỗi với TASK-040 nhóm 3** (định mức vật tư): Java đòi một trường mà UI không có.

Thêm một quy tắc **không có trong JS**:

```java
if (stageNo < 100 && store.findApprovalStageCatalog(String.valueOf(stageNo)).isEmpty())
    throw Api("Bước duyệt hệ thống không tồn tại; chỉ được tạo bước HTML (≥100).");
```

JS cho phép `stageNo ≥ 1` và kiểm tra theo cách khác (xem §2.3).

### 2.3 JS làm gì — nguồn sự thật (`scripts/system-route.mjs:2158-2177`)

```js
if (!before) throw new Error("Không tìm thấy bước phê duyệt.");
if (Number(before.stage_no) !== stageNo) {
    const history = await first(`SELECT COUNT(*) AS count FROM approvals WHERE stage=?`, before.stage_no);
    if (Number(history?.count || 0) > 0)
        throw new Error("Bước đã có lịch sử phê duyệt nên không thể đổi số bước. Có thể đổi tên, vai trò, SLA hoặc thứ tự hiển thị.");
}
if (autoApprove)
    await UPDATE approval_stage_catalog SET auto_approve_on_submit=0,updated_at=? WHERE id<>?   // chỉ MỘT bước tự duyệt
await UPDATE approval_stage_catalog
      SET stage_no=?,name=?,description=?,allowed_role_codes=?,approval_mode=?,sla_hours=?,
          auto_approve_on_submit=?,sort_order=?,updated_at=? WHERE id=?
await UPDATE approvals SET department=?,updated_at=? WHERE stage=? AND status='pending' AND decided_at IS NULL
await audit(user.id, "UPDATE", "approval_stage_catalog", stageId, before, { stageNo, name, allowedRoles, slaHours, autoApprove, sortOrder }, request);
return { message: `Đã cập nhật bước phê duyệt ${name}.` };
```

Nhánh THÊM (`:2172-2177`): xoá `auto_approve_on_submit` của **mọi** bước trước khi chèn, INSERT đủ 12 cột,
thông điệp *"Đã thêm bước phê duyệt {name}. Phiếu mới sẽ áp dụng luồng mới; phiếu cũ giữ nguyên luồng đã tạo."*

### 2.4 Bảng khoảng trống

| Hạng mục | JS | Java |
|---|---|---|
| Trường bắt buộc | `name`, `stageNo ≥ 1`, `allowedRoleCodes` không rỗng | **`code`** (UI không gửi) ⇒ **400** |
| `description` | ghi | **bỏ** (`INSERT` truyền `null` cứng, `UPDATE` không có cột) |
| `sla_hours` | ghi | **bỏ** ⇒ **admin sửa SLA, hệ thống báo thành công nhưng SLA KHÔNG đổi** |
| `approval_mode` | ghi | **bỏ** |
| `auto_approve_on_submit` | ghi + **xoá ở mọi bước khác** | **bỏ** ⇒ quy tắc "chỉ một bước tự duyệt" không được thi hành |
| `sort_order` | ghi | **bỏ** |
| Đổi `stage_no` khi đã có lịch sử duyệt | **CHẶN** | không kiểm |
| Đồng bộ tên bước sang `approvals.department` của hồ sơ đang chờ | có | không |
| `audit` | có | không |
| Thông điệp | *"Đã cập nhật bước phê duyệt {name}."* | *"Đã cập nhật bước duyệt."* |

### 2.5 `set_approval_stage_status` cũng thiếu 2 chốt (`:2179-2196`)

```js
if (!active) {                       // JS CHẶN tắt bước đang có hồ sơ chờ
    const pending = ... COUNT(*) ... WHERE a.stage=? AND a.status='pending' AND mr.status='pending_approval' ...;
    if (Number(pending?.count || 0) > 0)
        throw new Error("Bước này đang có hồ sơ chờ xử lý. Hãy xử lý hết hồ sơ hoặc giữ bước hoạt động; phiếu đang chạy không được cắt ngang.");
}
...
if (activeCount === 0) {             // JS KHÔNG cho tắt bước CUỐI CÙNG
    await UPDATE approval_stage_catalog SET active=1,updated_at=? WHERE id=?;
    throw new Error("Hệ thống phải có ít nhất một bước phê duyệt đang hoạt động.");
}
```

Java `setApprovalStageStatus:350-356` chỉ có `findApprovalStage` + `UPDATE active=?` ⇒ **cả hai chốt đều thiếu**.
Hệ quả nghiệp vụ: admin có thể **tắt hết mọi bước** ⇒ phiếu không còn đường duyệt; hoặc tắt bước đang có
hồ sơ chờ ⇒ **hồ sơ kẹt** (đúng rủi ro `LIKELY` đã ghi ở TASK-035).

## 3. Vì sao KHÔNG tự sửa ngay trong lượt phát hiện

Đây **không phải** một câu lệnh SQL sai cột. Sửa đúng nghĩa là:
1. đổi hợp đồng payload (bỏ `code`, nhận `description`/`slaHours`/`approvalMode`/`autoApproveOnSubmit`/`sortOrder`),
2. thêm 4 câu lệnh phụ (`clearAutoApprove` ×2, `propagate department`, `countApprovalsByStage`),
3. port đúng 3 quy tắc chặn + nguyên văn 4 thông điệp,
4. thêm ~7 phương thức port và sửa 2 use-case,
5. build + probe lúc chạy **có tạo/sửa bước duyệt thật** ⇒ phải có kịch bản dựng–kiểm–dọn cẩn thận.

Gộp tất cả vào lượt đang làm sẽ là một thay đổi lớn không được kiểm chứng đầy đủ — trái GOAL §11. Vì vậy đăng ký
thành **TASK-041** và làm ở lượt kế tiếp với ngân sách riêng.

## 4. Việc phải làm ở lượt kế tiếp (đúng thứ tự)

1. `OpsTaskStore` (port): mở rộng `insertApprovalStage`/`updateApprovalStage` mang đủ 8 trường; thêm
   `clearAutoApproveExcept(String stageId, Instant now)`, `clearAutoApproveAll(Instant now)`,
   `countApprovalsByStage(int stageNo)`, `propagateStageNameToPending(int stageNo, String name, Instant now)`,
   `countActiveStages()`, `countPendingApprovalsForStage(int stageNo)`.
2. `OpsTaskStoreAdapter`: viết đủ cột; `INSERT` truyền `description` thật (bỏ `null` cứng).
3. `OpsTaskManagementUseCase`: port validate + 3 quy tắc + thông điệp; **bỏ** quy tắc `stageNo < 100` tự thêm.
4. Probe mới: tạo bước tạm (`stageNo ≥ 100`), sửa SLA, **đọc lại** để chứng minh SLA đã đổi; thử đổi `stage_no`
   khi có lịch sử; thử tắt bước cuối cùng; dọn sạch.
5. Cổng: `npm run test:regression` + `probe-java-sql-live` + log 0 ERROR.

## 5. Task-041 ảnh hưởng tới quyết định nào

* **TASK-035** (đổi workflow khi hồ sơ đang chạy): hai chốt của JS ở §2.5 chính là **hàng rào** cho rủi ro
  "tắt bước đang có hồ sơ chờ" mà TASK-035 ghi là `LIKELY`. Khi port TASK-041, rủi ro đó **giảm**, nhưng
  **không** giải quyết câu hỏi version pinning.
* **TASK-036** (`required_permission`/`allow_skip_level` không được thi hành): TASK-041 **không** đụng hai cột đó
  — chúng vẫn là mục chờ quyết định riêng.
