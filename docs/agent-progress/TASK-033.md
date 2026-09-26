# TASK-033 — MASTER TASK §8.1: dải phê duyệt phiếu thiếu PHÒNG BAN của người duyệt

**Trạng thái:** IN PROGRESS (chờ dựng lại bundle để chứng minh render)
**Nguồn yêu cầu:** MASTER TASK §8.1 · `docs/24_SYSTEM_AUDIT_REPORT.md` mục 15 dòng #3 ("Phiếu: phần duyệt thiếu thông tin (người duyệt/phòng ban/thời gian) → cần **Approval Timeline**")
**Ngày:** 18/09/2026

---

## 1. Đối chiếu yêu cầu với mã hiện tại (KHÔNG đoán — đọc mã trước khi sửa)

§8.1 yêu cầu mỗi bước phê duyệt hiển thị đủ **6 thông tin**. Đã đối chiếu khối
`"Tiến trình phê duyệt & thời gian xử lý"` trong `RequestDrawer` (`app/page.tsx`):

| # | Yêu cầu §8.1 | Hiện trạng | Kết luận |
|---|---|---|---|
| 1 | SỐ BƯỚC | `Bước {item}` | ✅ đã có |
| 2 | NGƯỜI DUYỆT | `approval.approverName` | ✅ đã có |
| 3 | **PHÒNG BAN** | *không có* | ❌ **THIẾU** |
| 4 | THỜI GIAN | `queuedAt` / `dueAt` / `decidedAt` + `approvalTiming` | ✅ đã có |
| 5 | TRẠNG THÁI | class theo `approval.status` + ký hiệu ✓ / × / – | ✅ đã có |
| 6 | Ý KIẾN | `{approval.comment && <p>Ý kiến: {approval.comment}</p>}` | ✅ **đã có sẵn** |

⇒ §8.1 chỉ còn **ĐÚNG MỘT** điểm thiếu: **PHÒNG BAN của người duyệt**.

**Ghi chú trung thực về suýt-sai:** ban đầu tôi định "thêm cả ý kiến", nhưng khi in **nguyên văn**
dòng mã thì thấy `Ý kiến` **đã được render từ trước**. Nếu không đọc kỹ, tôi đã "sửa" một thứ vốn
đã đúng (trái §4) và có thể tạo hiển thị trùng. Đây là lý do §3/§4 bắt buộc **in nguyên văn khối
định sửa trước khi sửa**.

## 2. Bản vá

Trường dữ liệu **đo từ payload thật** (không đoán tên trường), bằng công cụ mới
`tools/show-bootstrap-array.mjs`:

```
requests[].approvals[0]:
  requestId · stage (number) · department (thực chất là TÊN BƯỚC) · status · approverUserId
  · approverName · queuedAt · dueAt · notifiedAt · reminderSentAt · decidedAt · comment

staffDirectory[0]:
  id · employeeCode · fullName · role · roleName · department = "Ban chỉ huy công trường"
  · organizationCode = "BCH" · organizationName
```

Bản vá gồm 2 phần, trong callback `.map()` của dải phê duyệt:

```tsx
// 1) suy phòng ban của người duyệt từ staffDirectory
const approverDept = data.staffDirectory?.find((u: Row) => u.id === approval.approverUserId)?.department || "";

// 2) hiển thị ngay cạnh tên người duyệt
${approval.approverName || "Chưa rõ người duyệt"}${approverDept ? ` · Phòng ban: ${approverDept}` : ""} · ${timing.text}
```

* `staffDirectory[].department` là **TÊN người đọc được** ("Ban chỉ huy công trường"), không phải mã
  ⇒ không cần ánh xạ, không tự đặt chữ mới.
* Nhãn **"Phòng ban:"** lấy **nguyên văn** từ component dùng chung `ApprovalTimeline`
  (`app/components/ui/Timeline.tsx:93`) — không phải chữ do tôi nghĩ ra.

## 3. Quyết định: KHÔNG thay cả khối bằng `<ApprovalTimeline>` (dù §8.1 gợi ý "cần Approval Timeline")

Component dùng chung `ApprovalTimeline` **đã tồn tại** (đúng §5), CSS `.vt-timeline` **đã có đủ**
(22 dòng trong `canonical.css:836+`). Nhưng component này **KHÔNG** hiển thị:

* "Nhận hồ sơ" (`queuedAt`)
* trạng thái email (`notifiedAt`)
* cảnh báo quá hạn (`timing.late` + `red-text`)

— là những thứ markup hiện tại **ĐANG có**. Thay ngay sẽ **MẤT THÔNG TIN** (trái §4 "cải thiện, không
viết lại vô lý" và §9 "không cắt nội dung").

⇒ Chọn **vá bổ sung** để đóng §8.1 **không hồi quy**. Việc áp dụng component dùng chung cần
**mở rộng component trước** (bổ sung `queuedAt`/`notifiedAt`/`late`) ⇒ ghi vào **TASK-013**.

## 4. Kiểm chứng

| Phép kiểm | Kết quả |
|---|---|
| `tools/patch-u06-approval-department.mjs` — khẳng định ANCHOR/TARGET **duy nhất** trước khi sửa | ANCHOR=1 · TARGET=1 |
| Hậu kiểm sau khi ghi (5 mục) | **5/5 ĐẠT** (có `approverDept`; có `Phòng ban:`; `approvalTiming` nguyên vẹn; `Ý kiến` còn; tên người duyệt còn) |
| `npx tsc --noEmit --incremental false` | **exit 0** |
| `npx eslint app/page.tsx` | **0 error · 74 warning** — đúng bằng mốc nền, **không phát sinh cảnh báo mới** |
| Cổng ảnh 28 ảnh × 4 kích thước | **ĐẠT — 0 px** (dự đoán nêu TRƯỚC khi chạy: drawer không nằm trong ảnh chuẩn ⇒ phải 0 px; **dự đoán ĐÚNG**) |

### 4.1 Phép kiểm MỚI thêm vào `probe-request-page.mjs` — và nó bắt được một sự thật quan trọng

Thêm mục **"Khối phê duyệt (§8.1)"**: mở chi tiết phiếu rồi kiểm **theo TỪNG bước** rằng mọi bước
**đã có người duyệt quyết định** đều phải hiển thị `Phòng ban:`. Cách kiểm theo từng bước nên
**không phụ thuộc việc probe mở phiếu nào**.

> Theo đúng tiền lệ của dự án (`docs/27` mục 12): *"cập nhật phép kiểm theo thiết kế mới và làm nó
> CHẶT HƠN"* — không bỏ qua, không nới lỏng.

**Lần chạy đầu: KHÔNG ĐẠT** — 5/5 bước đã duyệt nhưng **không bước nào** hiện `Phòng ban:`.

## 5. 🔴 NGUYÊN NHÂN: BUNDLE UI ĐANG CHẠY ĐÃ CŨ — không phải lỗi mã

Đo mốc thời gian, bằng chứng quyết định:

| Đối tượng | Thời điểm |
|---|---|
| `app/page.tsx` (nguồn vừa vá) | **17/09 12:41:51** |
| `dist` (bản dựng mà SSR đang phục vụ) | **17/09 09:35:52** |

⇒ Bản dựng **cũ hơn nguồn ~3 giờ**, nên mã vừa vá **chưa có hiệu lực lúc chạy**. Đây chính là mục
todo *"Đóng gói lại UI bundle (bundle đang chạy đã cũ)"* — nay trở thành **ĐIỀU KIỆN BẮT BUỘC** để
kiểm chứng **mọi** thay đổi giao diện, không còn là việc dọn dẹp cuối cùng.

**Bài học quy trình (quan trọng cho các phiên sau):**
> Một phép kiểm giao diện **KHÔNG ĐẠT** ngay sau khi sửa nguồn phải được đọc cùng mốc thời gian
> `dist` vs nguồn **TRƯỚC KHI** kết luận là lỗi mã. Nếu không, sẽ đi tìm lỗi trong mã đúng.

## 5. 🔴 CHUỖI CHẶN DỰNG BUNDLE — hai tầng, đã gỡ tầng 1, còn tầng 2

### 5.1 TẦNG 1 — ĐÃ GỠ: bộ tiền kiểm nguồn chặn cứng `npm run build`

Lần dựng đầu **thất bại**:

```
Error: Phát hiện file khóa bí mật: ...\.local-data\email-secret.key
  at scripts/preflight-source.mjs:212
```

`scripts/preflight-source.mjs:205` khai báo danh sách bỏ qua `["node_modules","dist",".next",".wrangler",".sites-runtime"]`
— **THIẾU `.local-data`**, vốn là **thư mục DỮ LIỆU RUNTIME do chính ứng dụng tạo** và **đã bị gitignore**
(`.gitignore:43`; `git ls-files .local-data` **rỗng**). Ứng dụng tự sinh `.local-data/email-secret.key`
để mã hoá cấu hình email ⇒ bộ quét chặn cứng việc dựng giao diện.

**Bản vá:** thêm `.local-data` vào danh sách bỏ qua — ở **cả hai** nơi có cùng khuyết điểm
(**một gốc, hai triệu chứng**: `tests/trust-lock-foundation.test.mjs:19` dùng danh sách y hệt).
Mục đích của bộ quét **giữ nguyên**: không có khoá bí mật trong **KHO MÃ**. Xoá tệp runtime không phải
giải pháp vì ứng dụng tạo lại ngay lần chạy sau.

**Bằng chứng tầng 1 đã gỡ:** lần dựng thứ hai in ra `FULL W2 SOURCE PREFLIGHT: ĐẠT` (trước đó dừng ngay
tại đây). Đồng thời việc này **giải quyết luôn** test đỏ F2c của TASK-008 — hoá ra nó **không** chỉ là
"dương tính giả vô hại": nó chặn cả đường dựng sản phẩm.

### 5.2 TẦNG 2 — CÒN CHẶN: dấu vân tay nguồn (source fingerprint)

Lần dựng thứ hai vượt được tiền kiểm nhưng dừng ở cổng định danh:

```
Error: Source fingerprint không hợp lệ:
  expected 0c5e9c0a6b887d58cfdceacc6c055b71908b32444f51cbedf009618e86a836a7
  actual   d8e907269e9455e743262980350eb079d8dfab79c1ee982526ed709bf2a3efb5
  at scripts/verify-vntech-fingerprint.mjs:29
```

Cơ chế (`lib/trust/source-fingerprint.mjs`) — **đã đọc mã, không đoán**:

| Hạng mục | Giá trị |
|---|---|
| Phạm vi phủ | tệp gốc + các thư mục `app` `db` `deploy` `drizzle` `lib` `public` `scripts` `tests` `worker` |
| **Không** phủ | `docs/`, `tools/` |
| Loại trừ | duy nhất `lib/vntech-identity-data.mjs` |
| Giá trị kỳ vọng lưu ở | `lib/vntech-identity-data.mjs` (`sourceFingerprint`, `sourceFingerprintShort`) + đồng bộ `VNTECH_FINGERPRINT.json` |
| **Script GHI lại giá trị** | **KHÔNG CÓ** (chỉ có bộ kiểm tra đọc: `npm run verify:fingerprint`) |

⇒ Vì **30 commit đã vào kho mà chưa lần nào dựng lại**, dấu vân tay đã lệch từ lâu. Nghĩa là
**UI KHÔNG THỂ được dựng lại** cho tới khi cập nhật lại dấu vân tay — và mọi phép kiểm UI sẽ mãi chạy
trên bundle cũ (`dist` 09:35 so với nguồn 12:41). Điều này cũng có nghĩa **bạn sẽ test thủ công trên
bundle cũ** nếu không xử lý.

**Việc cần làm (chờ quyết định):** cập nhật `sourceFingerprint` + `sourceFingerprintShort` trong
`lib/vntech-identity-data.mjs` cho khớp nguồn hiện tại rồi đồng bộ `VNTECH_FINGERPRINT.json`, sau đó mới
`npm run build`. Đây là bước **tái lập định danh** mà mỗi đợt trước đều làm (`docs/27` ghi định danh mới
theo từng đợt, kèm số tệp manifest). **Chưa tự làm trong phiên này** vì đây là hành động tái lập định danh
sản phẩm, cần người dùng xác nhận; và vì `verify:fingerprint` còn kiểm cả `brand`/`release` fingerprint.

## 6. Files Changed

* `app/page.tsx` — suy + hiển thị phòng ban người duyệt trong dải phê duyệt
* `tools/patch-u06-approval-department.mjs` (mới) — bản vá idempotent, có khẳng định duy nhất + hậu kiểm
* `tools/show-bootstrap-array.mjs` (mới) — in cấu trúc một mảng bootstrap để **không đoán tên trường**
* `tools/show-page-lines.mjs` (mới) — tra cứu tệp lớn theo mẫu, tránh vấn đề trích dẫn của PowerShell
* `tools/probe-request-page.mjs` — thêm mục kiểm "Khối phê duyệt (§8.1)" (**làm chặt hơn**)

## 7. Database / API / Permission / Workflow Changes

**Không có.** Bản vá chỉ đọc thêm `staffDirectory` đã có trong payload bootstrap; không thêm API,
không đổi quyền, không đổi workflow, không đụng dữ liệu.

## 7b. CHỨNG MINH Ở MỨC DỮ LIỆU (bổ sung — vì cổng ảnh không thấy được drawer)

Cổng ảnh **không** kiểm được khối phê duyệt (drawer đóng trong ảnh chuẩn), và bản dựng UI đang bị chặn
(TASK-034) nên chưa thể chứng minh bằng render. Đã bù bằng một phép kiểm **chứng minh ĐẦU VÀO của phép
ánh xạ** — `tools/check-approval-dept-mapping.mjs`:

Bản vá suy phòng ban bằng `data.staffDirectory?.find(u => u.id === approval.approverUserId)?.department || ""`
và chỉ hiển thị khi giá trị khác rỗng. ⇒ Điều kiện để bản vá **hiện được** là: mọi bước đã có người quyết
định phải tra ra một dòng `staffDirectory` có `department` **khác rỗng**.

Kết quả trên dữ liệu thật:

```
Phiếu: 17 · staffDirectory: 12
Bước ĐÃ có người quyết định : 50
  → tra được phòng ban       : 50
  → approverUserId rỗng      : 0
  → không có trong danh bạ   : 0
  → có trong danh bạ nhưng department TRỐNG: 0
KẾT LUẬN: toàn bộ 50 bước đã quyết đều tra được phòng ban KHÁC RỖNG
⇒ bản vá §8.1 sẽ HIỂN THỊ "Phòng ban: …".     exit 0
```

**Lỗi công cụ đã tự phát hiện và sửa:** lần chạy đầu in ra kết luận ĐẠT nhưng **mã thoát khác 0** —
Node trên Windows sập với `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), src\win\async.c` khi
`process.exit()` được gọi lúc handle `fetch` còn đang đóng. Một cổng **"đạt" mà báo lỗi** rất dễ dẫn tới
kết luận sai, nên đã đổi sang `process.exitCode` (để Node tự thoát êm). Chạy lại: **exit 0**.

## 8. Limitations

* **Chứng minh render chưa hoàn tất** ở thời điểm ghi hồ sơ: cần `npm run build` + khởi động lại SSR
  trên `:8787` (chỉ dừng **đúng PID** đang giữ cổng) rồi chạy lại `probe-request-page.mjs`.
* Chưa áp dụng component dùng chung `ApprovalTimeline` (xem mục 3 — lý do và việc cần làm ở TASK-013).

## 9. Next Task

* Dựng lại bundle → chạy lại `probe-request-page.mjs` để chuyển mục 8 thành **ĐẠT có bằng chứng**.
* **TASK-013** — mở rộng `ApprovalTimeline` (thêm `queuedAt` / trạng thái email / cảnh báo quá hạn)
  rồi mới áp dụng thay markup tự viết.

## 10. Continuation Notes

1. **Trước mọi phép kiểm giao diện: kiểm `dist` vs nguồn.** Nếu `dist` cũ hơn → `npm run build` trước.
2. Bản vá **idempotent**: chạy lại sẽ tự bỏ qua (kiểm `approverDept` trước).
3. Khi sửa `app/page.tsx`, dùng `tools/show-page-lines.mjs` để tra cứu — **đừng** dùng `node -e` với
   regex chứa nháy kép (PowerShell phá) và **đừng** `read` cả dòng (dòng dài hàng trăm nghìn ký tự).
4. §8.2 (**modal "Tổng hợp giao nhận về phiếu đề nghị gốc"**) và §8.3 (**ảnh/hồ sơ vật tư đặc thù**)
   đã có nội dung trong `RequestDrawer` (`CardHead` tương ứng) nhưng **bị ép vào layout chi tiết**
   — đúng như audit mô tả; cần tách thành modal / chỉnh responsive.
