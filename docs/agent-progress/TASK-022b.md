# TASK-022b — `ACTION_CATALOG` "chưa ghi 12 action chỉ có ở Java"

**Trạng thái:** **DONE — KHÔNG cần sửa danh mục.** Tiền đề của task là **SAI**; đã chứng minh bằng bằng chứng.
**Ngày:** 18/09/2026 · **Commit:** #41
**Cổng mới:** `tools/probe-catalog-drift.mjs` (exit 0)

---

## 1. Tiền đề ban đầu (ghi trong `MASTER_STATUS`)

> *"TASK-022b — `ACTION_CATALOG` chưa ghi 12 action chỉ có ở Java (ưu tiên thấp; TASK-018 đã đính chính
> cáo buộc 'lệch ~50 action' là SAI)."*

⇒ Ngụ ý: danh mục **thiếu** 12 mục và cần **bổ sung**.

## 2. Giả thuyết rủi ro tôi kiểm tra TRƯỚC (và nó KHÔNG đúng)

Tôi nghi rằng nếu có bộ sinh tự động ghi lại `ActionRbacRegistry.java` từ danh mục (174 mục), thì chạy lại
sẽ **âm thầm xoá 12 mục** ⇒ 12 action rơi vào nhánh **mặc định TỪ CHỐI** của `requireActionModule`.

**Kết quả kiểm tra: KHÔNG có đường rủi ro đó.**

| Điều cần kiểm | Kết quả |
|---|---|
| Tệp nào **GHI** `ACTION_CATALOG.json`? | **KHÔNG CÓ** (không script nào `writeFileSync` vào nó) |
| `tools/patch-rbac-registry.mjs` có xoá mục không? | **Không** — chỉ `replace` `List.of()` → `List.of("module", …)`, không bao giờ xoá |

## 3. Đo trôi dạt thật (`tools/probe-catalog-drift.mjs`)

| Nguồn | Số mục |
|---|---|
| `java-backend/ACTION_CATALOG.json` (kiểm kê) | **174** |
| `ActionRbacRegistry.java` (bản **THI HÀNH**) | **186** |

| Chiều lệch | Số lượng |
|---|---|
| Bản thi hành có, danh mục thiếu | **12** |
| Danh mục có, bản thi hành thiếu | **0** |

12 mục đó: `create_self_work_item` · `delete_department_permission` · `delete_system_level` ·
`delete_workflow` · `rebuild_department_permissions` · `save_department_permission` · `save_system_level` ·
`save_workflow` · `set_system_level_status` · `set_user_system_level` · `set_workflow_status` ·
`system_level_impact`.

## 4. 🔎 VÌ SAO "BỔ SUNG VÀO DANH MỤC" LÀ **SAI** — 3 lý do có bằng chứng

### 4.1 Danh mục có HỢP ĐỒNG là "sinh từ nguồn JS" — và nó ĐANG đúng hợp đồng
`node tools/probe-action-parity.mjs` → **exit 0**:
```
Số mục trong catalog : 174
Có ở JS nhưng KHÔNG có trong catalog : 0
Có trong catalog nhưng KHÔNG có ở JS : 0
⇒ Catalog KHỚP HOÀN TOÀN với nguồn JS.
Action của JS mà Java THIẾU : 0 (không thiếu action nào)
```

### 4.2 Thêm 12 mục sẽ **TẠO SAI LỆCH GIẢ** và **phá một cổng đang xanh**
`probe-action-parity.mjs` so **tên** action giữa danh mục và JS. Thêm 12 mục Java-only vào sẽ đổi
`"Có trong catalog nhưng KHÔNG có ở JS: 0"` thành **12** ⇒ cổng parity đang xanh chuyển đỏ **vì một
thay đổi tài liệu sai ngữ nghĩa**. Đây là hành vi không được phép: sửa tài liệu để rồi phá cổng kiểm.

### 4.3 Chúng **KHÔNG** bị bỏ sót về mặt thi hành
Cả 12 mục **đã được khai đầy đủ** module + capability trong `ActionRbacRegistry.java` — **chính là nguồn**
mà `RbacService.requireActionModule` dùng để chặn. Không có action nào "không được khai quyền".

## 5. Phát hiện phụ — củng cố TASK-035

Trong 12 mục Java-only có **`save_workflow` · `set_workflow_status` · `delete_workflow`** (module `admin`).
Điều này **khớp hoàn toàn** với TASK-035: `scripts/system-route.mjs` có **0 tham chiếu** tới ba bảng
workflow P4 ⇒ **tính năng quản trị workflow là Java-only**. Hai phép đo độc lập xác nhận nhau.

## 6. KẾT LUẬN

> **Danh mục `ACTION_CATALOG.json` KHÔNG thiếu sót. 12 action Java-only ĐÚNG LÀ không thuộc danh mục
> "sinh từ JS". KHÔNG sửa gì.**

Tiền đề "cần bổ sung 12 mục" xuất phát từ việc **coi danh mục là bản kiểm kê toàn bộ action của hệ thống**,
trong khi hợp đồng thật của nó là **bản kiểm kê action phía JS**.

## 7. Giá trị để lại — cổng kiểm thường trực

`tools/probe-catalog-drift.mjs` nay là **cổng** (không chỉ là báo cáo):

* **ĐẠT** khi: danh mục **không** chứa tên nào ngoài JS **VÀ** phần dư của bản thi hành nằm trong
  **tập 12 Java-only ĐÃ BIẾT**.
* **HỎNG** khi có tên **CHƯA BIẾT** xuất hiện ở bất kỳ chiều nào ⇒ buộc rà lại thay vì bỏ qua.

Chạy hiện tại:
```
Danh mục có tên NGOÀI nguồn JS : 0 (đúng hợp đồng)
Bản thi hành có thêm, ĐÃ BIẾT  : 12/12 (Java-only, KHÔNG phải lỗi)
Bản thi hành có thêm, CHƯA BIẾT: 0
```
**exit 0**

## 8. Files Changed

* `tools/probe-catalog-drift.mjs` (mới) — đo trôi dạt + **cổng** với tập Java-only đã biết
* `docs/agent-progress/TASK-022b.md` (mới, tệp này), `TASK_INDEX.md`, `MASTER_STATUS.md`
* **Không sửa** `ACTION_CATALOG.json` (cố ý — xem mục 4)

## 9. Testing / Validation

| Phép kiểm | Kết quả |
|---|---|
| `node tools/probe-catalog-drift.mjs` | **exit 0** — 0 tên lạ, 12/12 Java-only đã biết |
| `node tools/probe-action-parity.mjs` | **exit 0** — "Catalog KHỚP HOÀN TOÀN với nguồn JS"; Java không thiếu action nào |
| Tìm tệp ghi `ACTION_CATALOG.json` | **không có** ⇒ không có đường tự động xoá mục |
| Đọc `patch-rbac-registry.mjs` | chỉ `replace`, **không xoá** |

## 10. Next Task

* Không còn việc cho TASK-022b. Cổng `probe-catalog-drift.mjs` nên được chạy mỗi khi thêm action mới.

## 11. Continuation Notes

1. **Đừng "bổ sung 12 mục vào ACTION_CATALOG.json"** — đó là việc SAI đã được phân tích ở mục 4;
   làm vậy sẽ phá `probe-action-parity.mjs`.
2. Khi thêm action Java-only mới: khai vào `ActionRbacRegistry.java`, rồi cập nhật tập
   `KNOWN_JAVA_ONLY` trong `probe-catalog-drift.mjs` — **có chủ ý**, vì cổng sẽ báo CHƯA BIẾT cho tới khi cập nhật.
3. Bài học phương pháp: **kiểm hợp đồng của tài liệu trước khi "sửa cho đủ"**. Một tài liệu "thiếu" có thể
   đang đúng vì phạm vi của nó hẹp hơn ta tưởng.
