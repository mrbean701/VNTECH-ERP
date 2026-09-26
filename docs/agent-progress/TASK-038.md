# TASK-038 — GOAL §6: đối chiếu action UI GỌI với backend Java

**Trạng thái:** DONE (điều tra — **0 điểm lệch**; ghi rõ **giới hạn** của phép đo)
**Nguồn yêu cầu:** **GOAL §6** — *"UI ↓ API ↓ Backend/service ↓ Database ↓ Permission/Auth ↓ Workflow phải khớp"*
**Công cụ:** `tools/probe-ui-action-coverage.mjs` (exit 0)
**Ngày:** 18/09/2026 · **Commit:** #44

---

## 1. Vì sao chiều này chưa từng được kiểm

Các cổng hiện có so **JS ↔ Java ↔ danh mục** (`probe-action-parity`, `probe-action-module-parity`,
`probe-catalog-drift`) — tức chỉ so **hai backend** với nhau. **Chưa cổng nào so với chính mã GIAO DIỆN.**

Hệ quả nếu lệch: UI gọi một action không tồn tại ở backend ⇒ người dùng bấm nút ăn lỗi
(Java trả `400 "chưa được triển khai…"` hoặc `403` do thiếu khai báo quyền). Đây là rủi ro trực tiếp
với người dùng mà không phép kiểm nào bắt.

## 2. Cách đo

UI gọi API qua helper `requestApi(action, payload)` (`app/page.tsx:356`) và qua các hàm nhận tên rồi gọi nó
(`submit(...)`, `action(...)`, …), cùng các chỗ `fetch("/api/system", … { action: "…" })`.

Đối chiếu tập tên thu được với **186 action thật của Java** (đã loại 38 tên chỉ mục SQL `*_uidx`).

## 3. Kết quả

```
Backend Java (action thật, đã loại tên chỉ mục) : 186
Tệp giao diện đã quét                          : 12
Action UI GỌI (có bằng chứng lời gọi)          : 155
Chuỗi chỉ NHẮC TỚI tên action (không tính)     : 2

UI GỌI VÀ Java có                              : 155/155
UI GỌI, Java KHÔNG có nhưng JS có              : 0
UI GỌI mà KHÔNG backend nào có (⇒ bấm sẽ lỗi)  : 0
```

⇒ **Mọi action UI gọi đều có ở Java. Chiều UI ↓ API KHỚP.** `exit 0`.

## 4. 🔧 HAI LỖI TRONG CÔNG CỤ CỦA CHÍNH TÔI — đã tự phát hiện và sửa

Cả hai đều là loại lỗi **làm phép đo yếu đi mà vẫn báo ĐẠT** — nguy hiểm hơn lỗi báo HỎNG, vì nó tạo
cảm giác an toàn giả.

### 4.1 Bản đầu trộn "GỌI" với "chỉ NHẮC TỚI" ⇒ thổi phồng kết quả
Phiên bản đầu gom **mọi chuỗi** trùng tên action backend, nên báo **157 action "UI gọi"**. Nhưng khi đếm
lời gọi thật thì chỉ có **15 lời gọi `requestApi(`**. Tức **144/157 là suy đoán theo trùng chuỗi**, không
phải bằng chứng gọi (một cái tên có thể nằm trong chú thích hoặc nhãn hiển thị).

**Đã sửa:** tách hẳn hai tập — `called` (có bằng chứng lời gọi) và `mentioned` (chỉ nhắc tới, **không**
dùng để kết luận). Kết luận nay dựa **chỉ** trên tập `called`.

### 4.2 Bản hai bỏ sót lời gọi có đối số là **biểu thức**
Regex cũ đòi chuỗi nằm **ngay sau** dấu mở ngoặc: `submit\s*\(\s*["']`. Nhưng mã thật có:

```js
await submit(editing ? "update_project" : "create_project", { ...payload, projectId: row?.id });
```

⇒ **bỏ sót CẢ HAI** action. Phát hiện được vì danh sách "action Java không thấy UI gọi" chứa
`create_project` — một việc mà giao diện **chắc chắn** làm được (tạo dự án) ⇒ dấu hiệu phép đo sai,
không phải hệ thống sai.

**Đã sửa:** quét trọn **đối số thứ nhất** (tôn trọng ngoặc lồng và chuỗi), rồi lấy mọi chuỗi dạng tên
action bên trong. Số action phát hiện: **153 → 155**; cả `create_project` và `update_project` đã được bắt.

> **Bài học chung:** khi một phép kiểm cho kết quả "quá sạch", phải kiểm **cả độ nhạy của phép đo** —
> không chỉ kiểm kết luận. Một phép đo yếu vẫn có thể in ra "ĐẠT".

## 5. GIỚI HẠN — đây là **CẬN DƯỚI**, không phải chứng minh đầy đủ

Còn **31 action Java** chưa thấy UI gọi, trong đó **một số rõ ràng là có dùng** (ví dụ `cancel_request`,
`save_mar_approval`, `ship_transfer_order`, `approve_transfer_order`). Nghĩa là vẫn còn lời gọi mà phép
phân tích tĩnh **không** giải được (tên dựng lúc chạy, truyền qua prop nhiều tầng, hoặc nằm ngoài `app/**`).

⇒ Kết luận đúng phải phát biểu hẹp:
> **Không tìm thấy** lời gọi UI nào trỏ tới action không tồn tại, trên **155 lời gọi có bằng chứng**.
> **Không** khẳng định "mọi lời gọi trong UI đã được kiểm" và **không** khẳng định 31 action kia là chết.

## 6. Files Changed

* `tools/probe-ui-action-coverage.mjs` (mới) — cổng đối chiếu action UI gọi ↔ action backend
* `docs/agent-progress/TASK-038.md` (mới), `TASK_INDEX.md`, `MASTER_STATUS.md`
* **Không sửa mã nguồn.**

## 7. Testing / Validation

| Phép kiểm | Kết quả |
|---|---|
| `node tools/probe-ui-action-coverage.mjs` | **exit 0** — 155/155 action UI gọi đều có ở Java; 0 lệch |
| Đếm lời gọi thật `requestApi(` | 15 (13 literal, 2 tên động) — dùng để phát hiện lỗi 4.1 |

## 8. Dependencies

* Bổ sung chiều còn thiếu cho bộ cổng đã có: `probe-action-parity` (JS↔Java), `probe-action-module-parity`,
  `probe-action-scope-parity`, `probe-catalog-drift` (danh mục).
* Không phụ thuộc bản dựng UI (chạy được dù bundle cũ) ⇒ **dùng được ngay cả khi TASK-034 còn chặn**.

## 9. Limitations

* Cận dưới (xem mục 5).
* Phép kiểm "có ở Java" chỉ so **tên action trong `case`**; không kiểm chữ ký payload.
* Chưa kiểm chiều ngược "action backend không UI nào gọi" là lỗi — chúng có thể được gọi qua API trực tiếp
  hoặc bởi kịch bản tích hợp; **chỉ báo cáo, không kết tội**.

## 10. Next Task

* Giữ `probe-ui-action-coverage.mjs` trong bộ cổng hồi quy. Chạy lại mỗi khi thêm action mới ở UI hoặc backend.
* Nếu muốn siết: bổ sung phép kiểm chữ ký payload cho các action quan trọng (theo `form_field_config`).

## 11. Continuation Notes

1. **Đừng** kết luận "31 action Java là mã chết" từ danh sách này — xem mục 5.
2. Khi mở rộng phép đo, nhớ: đối số thứ nhất của helper **có thể là biểu thức** (ternary/biến/ghép chuỗi);
   chỉ khớp chuỗi ngay sau dấu ngoặc sẽ bỏ sót âm thầm.
3. Giữ nguyên tắc đã áp dụng: **tách "bằng chứng" khỏi "suy đoán"** trong mọi phép kiểm, và chỉ kết luận
   trên tập có bằng chứng.
