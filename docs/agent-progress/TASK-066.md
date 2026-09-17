# TASK-066 — Cổng đo "HỢP ĐỒNG KHOÁ BOOTSTRAP ↔ UI" theo từng vai trò + vá 3 lỗi thật

**Trạng thái:** ✅ DONE — mã đã vá, kiểm chứng lúc chạy **11/11 ĐẠT** (trước khi vá: **1/17**), đã commit
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Cổng:** `tools/probe-task066-role-shape.mjs` (mới)

---

## 1. Vì sao có task này — vùng mù đã được ĐO ĐÚNG KÍCH THƯỚC

Hai cổng TĨNH đều xanh (tập cột 71 khoá · mệnh đề 71 khoá), nhưng khi liệt kê phần **không so được** thì lộ ra:

* **JS có SQL: 271 khoá** (phần lớn là biến CỤC BỘ trong các action handler, không phải khoá bootstrap);
* **Java có SQL: 84 khoá** ⇒ **13 khoá Java-only** — trong đó có `businessRoleEngineProfiles`,
  `businessRoleGroups`, `workflowSteps`, `staffDirectory`, `formFieldConfigs`… tức **đúng những khoá đã
  từng gây lỗi** (lệch tên trường ⇒ UI trắng) và **đúng Known Problems #50**.

⇒ Cần một cổng **ĐO LÚC CHẠY THEO TỪNG VAI TRÒ** dựa trên **nguồn sự thật độc lập**.

## 2. Nguồn sự thật độc lập: khối CHUẨN HOÁ của chính UI

`app/page.tsx` có khối chuẩn hoá đọc từng khoá qua `result.data?.<khoá>`:

```ts
engineRoleProfiles: Array.isArray(result.data?.engineRoleProfiles) ? result.data.engineRoleProfiles : [],
businessScopes:     Array.isArray(result.data?.businessScopes)     ? result.data.businessScopes     : [],
…
} as AppData; setData(normalizedData);
```

Khối này chính là **hợp đồng thật**: danh sách khoá UI tiêu thụ + **kiểu mong đợi**. Nếu API **thiếu** khoá thì
UI **âm thầm** thay bằng `[]`/null ⇒ màn hình trống/trắng mà **không có lỗi nào nổi lên** — đúng lớp lỗi
đã gây sự cố trước đây. Cổng trích **38 khoá** từ khối này và tự cảnh báo nếu số khoá tụt (< 30).

## 3. Kết quả lượt đo ĐẦU TIÊN: **1/17 ĐẠT** — 3 lỗi thật

| # | Lỗi đo được | Vì sao |
|---|---|---|
| 1 | **`engineRoleProfiles` = `null` cho MỌI tài khoản, kể cả admin** | Java gán `data.put("engineRoleProfiles", data.get("businessRoleEngineProfiles"))` **TRƯỚC** khi khoá nguồn được đặt (nguồn nằm trong `if (admin)` ở cuối hàm) ⇒ luôn đọc ra `null`. Đây là **Known Problems #50 xác nhận bằng thực nghiệm** |
| 2 | **`businessScopes` + `businessRoleGroups` MẤT HẲN** với **5/5** tài khoản không phải admin | Cả hai bị đặt **trong `if (admin)`**, nhưng JS `:672`/`:674` trả chúng cho **mọi vai trò** (chỉ khác `WHERE active=1` khi không phải admin) ⇒ UI nhận `[]` âm thầm |
| 3 | **`businessRoleGroups[].scopeIds`/`scopes` = 0/11 dòng** | JS `:675` **làm giàu** từng nhóm bằng 2 trường dẫn xuất từ `businessRoleGroupScopes`; bản Java chưa port phép làm giàu ⇒ 2 nhóm **CÓ** phạm vi trong DB (`BRG-engineer`, `BRG-hcpc`) hiển thị rỗng |

## 4. Đã vá (port nguyên văn JS `:671-675` + object `:727`)

* **Chuyển 3 khoá ra khối TOÀN CỤC** (không phải admin-only) kèm bộ lọc `admin ? "" : "WHERE active=1"`.
* **Gán nguồn TRƯỚC rồi dùng lại cùng danh sách**: `engineRoleProfiles` và `businessRoleEngineProfiles`
  nay trỏ **cùng một list** (khoá sau là Java-only, giữ để không phá hợp đồng cũ).
* **Port phép LÀM GIÀU** `scopeIds` (mảng ID phạm vi) + `scopes` (các dòng phạm vi) theo `businessGroupId`,
  dùng lại đúng danh sách đã đặt cho `businessRoleGroupScopes` (không truy vấn hai lần).
* `businessRoleGroupScopes` nay giữ trong biến để tái sử dụng cho phép làm giàu.

## 5. Kiểm chứng lúc chạy — `tools/probe-task066-role-shape.mjs` **11/11 ĐẠT**

* **6 tài khoản THẬT** (admin · `nvkhdemo` · `trinhtrench` · `nvdademo` · `tkhodemo` · `thukydemo`)
  × **38 khoá hợp đồng**: tất cả **CÓ** trong payload và **đúng kiểu mảng**;
* `engineRoleProfiles` nay là **mảng 9 dòng** (trước là `null`) và **bằng** `businessRoleEngineProfiles`;
* **11/11** dòng `businessRoleGroups` có `scopeIds` + `scopes`; **nhóm có phạm vi trong DB thì `scopeIds` KHÔNG rỗng** (khớp);
* kèm **cảnh báo độ phủ**: nếu khối chuẩn hoá của UI được viết lại khiến số khoá trích được tụt dưới 30, cổng
  **in cảnh báo** và không cho kết luận (bài học #103).

## 6. Giới hạn đã biết (không giấu)

* Cổng đo **SỰ HIỆN DIỆN + KIỂU**; **KHÔNG phán nội dung nghiệp vụ** — dữ liệu rỗng theo vai trò là **hợp lệ**.
* Hợp đồng trích **từ văn bản** `page.tsx`; nếu khối chuẩn hoá đổi cách viết thì độ phủ giảm (có cảnh báo).
* Chỉ đo **38 khoá** mà UI đọc qua `result.data?.`; UI còn đọc **92 khoá** qua `data.X` sau chuẩn hoá —
  nhóm đó lấy từ `normalizedData` nên luôn tồn tại ⇒ vô nghĩa nếu kiểm sự hiện diện.
* **Còn lại của vùng mù:** `workflowSteps`/`workflowDefinitions`/`workflowStepApprovers`/`staffDirectory`/
  `formFieldConfigs`/`departmentModulePermissions`/`teamMembers`/`systemLevelCatalog`/`supplySteps`/
  `boqMappingCandidates`/`workItemEvents` — **chưa** đối chiếu từng trường; cần rà tiếp ở task sau.
* **Phát hiện phụ (CHƯA vá, ghi lại):** `data.put("approvalStages", data.get("approvalStageCatalog"))` cũng là
  **cùng dạng gán-phụ-thuộc-thứ-tự**; hiện `approvalStageCatalog` được đặt TRƯỚC nên `approvalStages` vẫn đúng
  (cổng xác nhận là mảng trên cả 6 tài khoản) — nhưng đây là **bẫy thứ tự** sẽ vỡ nếu ai đó di chuyển khối.

## 7. Hồi quy sau khi build lại jar (90.911.803 B)

`probe-task050-bootstrap` **100/100** · `probe-task058-work-items` **18/18** · `probe-task048` **18/18** ·
`probe-task049` **10/10** · `probe-task054-all-roles` **20/20** · `probe-task062-boq` **19/19** ·
`probe-task063-clauses` **7/7** · `probe-task065-caneditcentral` **10/10** · `probe-task066-role-shape` **11/11** ·
cổng tập cột **71 khoá / 0 thiếu / 0 mất độ phủ** · cổng mệnh đề **0 lệch** ·
`probe-java-sql-live` 8 (không phát sinh mới, chạy **TRƯỚC** khi build theo đúng quy tắc).

## 8. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `java-backend/…/BootstrapDataAdapter.java` | 3 khoá toàn cục ra khỏi `if (admin)` + bộ lọc `active=1` · sửa lỗi gán `engineRoleProfiles` sai thứ tự · port phép làm giàu `scopeIds`/`scopes` |
| `tools/probe-task066-role-shape.mjs` | **mới** — cổng hợp đồng khoá theo vai trò (6 tài khoản × 38 khoá + lớp dẫn xuất #50) |
