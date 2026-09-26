# MT2-PHASE-5 — CÔNG VIỆC (§3) · AUDIT MỞ ĐẦU

> Trạng thái: **IN_PROGRESS — audit xong, phát hiện 2/4 task VƯỚNG BLK-01**
> Phase: **PHASE 5 — CÔNG VIỆC (§3)** · 4 task · Ngày: 22/09/2026
> Dependency: **P5-03 ⇐ P4-01 (BLOCKED)** · **P5-04 ⇐ §3.2 cần cấp «Phó giám đốc trở lên» (BLK-01)**

## 1. DANH SÁCH TASK (nguyên văn)
| ID | Task | Deliverable | Trạng thái |
|---|---|---|---|
| MT2-P5-01 | Click menu **Công việc ⇒ hiển thị Dashboard ngay** (§3.1) | UI + router | TODO |
| MT2-P5-02 | Đưa Dashboard lên **đầu menu** hoặc **bỏ menu item thừa** (§3.1) | menu config | TODO |
| MT2-P5-03 | UI hiển thị **quyền xem/giao theo cấp** (dùng API P4-01) | UI + test | **BLOCKED** (⇐ P4-01) |
| MT2-P5-04 | Giao việc **đúng phạm vi** + chặn ở backend | UI + test âm | **BLOCKED?** (⇐ BLK-01) |

## 2. NGUYÊN VĂN SPEC
**§3.1 Dashboard** (`MASTER_TASK_2.md`):
```text
«Click menu **Công việc** ⇒ hiển thị **Dashboard NGAY**; đưa Dashboard lên **ĐẦU menu** nếu vẫn giữ menu;
 **hoặc bỏ menu item Dashboard** nếu menu CÔNG VIỆC…»   ← ⚠️ dòng bị CẮT trong tệp ✗ (cần đọc đủ nếu dùng)
```
**§3.2 Giao việc & kiểm soát hoàn thành**:
```text
«Hiện giới hạn theo phòng ban + dự án ⇒ **mở rộng theo hierarchy/chức vụ**:
 | **Trưởng phòng trở lên** | xem công việc của nhân viên **thuộc phòng ban mình** · xem trạng thái hoàn thành ·
                             xem tiến độ · giao việc trong … |
 | **Phó giám đốc trở lên** | xem công việc **toàn bộ phòng ban** · xem công việc **toàn bộ nhân viên công ty** ·
                             giao việc **toàn công ty** theo … |
 **Logic giao việc dùng CÙNG mô hình phạm vi quyền.** ⛔ Không hard-code frontend.
 Backend phải kiểm: user · chức vụ · phòng ban · phạm vi · project …»
```

## 3. AUDIT — BẰNG CHỨNG (⛔ không suy đoán ✗)
| Điều | Bằng chứng | Kết luận |
|---|---|---|
| Menu «Công việc» hiện mở gì? | `WorkCenter.tsx:12` «MÀN CÔNG VIỆC: **5 TAB** ĐÚNG THỨ TỰ CỦA NHÓM MENU «CÔNG VIỆC»» · `:35` «5 TAB NHÓM «CÔNG VIỆC», ĐÚNG thứ tự đã chốt (5 mục menu ⇄ 5 tab)» | hiện mở **WorkCenter 5 tab** ✗ ⇒ ⛔ **KHÁC** §3.1 «**Dashboard NGAY**» ✗ |
| `dashboard` route có sẵn? | ⚠️ **CHƯA ĐO** ✗ (việc của vòng sau ✔) | ? |
| `AppShell` menu ra sao? | ⚠️ **CHƯA ĐO** ✗ | ? |
| §3.2 cần cấp nào? | «**Phó giám đốc trở lên**» + «**Trưởng phòng trở lên**» | ⚠️ cần cấp `pho_giam_doc` |

## 4. 🔴 PHÁT HIỆN LỚN — **2/4 TASK PHASE 5 VƯỚNG ĐÚNG BLK-01**
```text
MT2-P4-04 đã ĐO: `system_level_catalog` chỉ có **5 cấp** ⇒ ⛔ **KHÔNG có `pho_giam_doc`** ✗
   (`tong_giam_doc`=50 · `giam_doc`=40 · `truong_phong`=30 · `truong_nhom`=20 · `nhan_vien`=10)
⇒ ⇒ **§3.2 yêu cầu cấp «Phó giám đốc trở lên»** ✗ mà cấp đó ⛔ **KHÔNG tồn tại** ✗
⇒ ⇒ ⇒ **MT2-P5-04** (giao việc đúng phạm vi theo hierarchy) ⛔ **KHÔNG thể làm đúng** ✗ khi chưa có quyết định
⇒ ⇒ ⇒ **MT2-P5-03** phụ thuộc **API P4-01** (đang BLOCKED cùng lý do) ✗
⇒ ⛔ **KHÔNG tự bịa/bổ sung cấp `pho_giam_doc`** ✗ (§14 NO_UNAUTHORIZED_BUSINESS_INFERENCE ✔)
```
⇒ ⇒ **BLK-01 nay chặn 3 task**: `P4-01` · `P5-03` · `P5-04` ✗ — ⚠️ **càng làm càng thấy BLK-01 có sức lan rộng** ✔

## 5. VIỆC LÀM ĐƯỢC NGAY (⛔ không vướng BLK-01 ✔)
```text
✅ **P5-01 + P5-02** (1 CỤM liên quan — §3.1):
   ① ĐO: router + menu hiện tại (`dashboard` route? `AppShell` menu? WorkCenter ⇄ 5 tab?)
   ② P5-01: click menu «Công việc» ⇒ **hiển thị Dashboard NGAY** ✔ (⛔ KHÔNG phá 5 tab ✗ — phải xem §3.1 đầy đủ)
   ③ P5-02: **đưa Dashboard lên ĐẦU menu** HOẶC **bỏ menu item THỪA** ✔
   ⚠️ §3.1 có 2 LỰA CHỌN ✗ ⇒ **phải đọc đủ dòng bị cắt** ✗ để biết điều kiện «nếu…» ✔ (⛔ không tự chọn ✗)
   ⇒ 🔴 nếu sau khi đọc đủ mà **vẫn mơ hồ giữa 2 lựa chọn** ⇒ **cần anh quyết** ✔ (⛔ không tự ý chọn ✗)
```

## 6. VIỆC KẾ TIẾP
① Đọc **đủ** `§3.1` (dòng bị cắt ✗ — như đã làm ở §4.1:51 ✔) ⇒ biết **điều kiện** của 2 lựa chọn ✔
② ĐO `dashboard` route + `AppShell` menu + quan hệ WorkCenter ⇄ menu ✔
③ Làm **P5-01**, rồi **P5-02** (⛔ không đụng P5-03/P5-04 khi chưa có quyết định BLK-01 ✗)

---

## 7. NHẬT KÝ THI HÀNH

### 22/09/2026 — P5-01: ĐO ĐƯỢC **MENU ĐÃ CÓ MỤC «Dashboard»** ✔ (nhưng mặc định mở tab SAI ✗)
**Bằng chứng (⛔ không đoán ✗)**:
```text
✅ `app/page.tsx:374` nguyên văn: «… 4 mục (**Cá nhân · Phòng ban · Dashboard · Báo cáo**) → màn `WorkCenter`
   (tab theo `view`)» ✔
✅ `app/page.tsx:92` `import { TaskTable, WorkCenter, isTaskLate, workRate } from "@/app/screens/WorkCenter";` ✔
✅ `app/screens/WorkCenter.tsx:118` `function WorkCenter({ data, action, refresh, view = "personal" }: …)` ✔
   ⇒ **tab MẶC ĐỊNH = `personal` (Cá nhân)** ✗
```
🔎 **SUY RA (từ bằng chứng, ⛔ không phải phỏng đoán ✗)**:
```text
⇒ Menu «Công việc» **ĐÃ CÓ 4 mục**, trong đó **CÓ «Dashboard»** ✔
⇒ NHƯNG mở màn ra **tab mặc định `personal`** ✗ ⇒ ⛔ **KHÔNG** phải «hiển thị **Dashboard NGAY**» ✗ (như §3.1 đòi)
⇒ ⇒ **P5-01** = cho menu/nút «Công việc» vào **THẲNG tab Dashboard** ✔ (⛔ không cần tạo màn mới ✗ — đã có ✔)
⇒ ⇒ **P5-02** = ⚠️ §3.1 nói «… **hoặc bỏ menu item Dashboard** nếu menu CÔNG VIỆC…» ✗
   mà **mục «Dashboard» ĐÃ TỒN TẠI** trong cùng màn ✗ ⇒ **ĐIỀU KIỆN** của 2 lựa chọn nằm ở **phần dòng BỊ CẮT** ✗
   ⇒ ⇒ ⇒ **PHẢI ĐỌC ĐỦ §3.1** ✗ TRƯỚC KHI LÀM P5-02 ✔ (⛔ không tự chọn 1 trong 2 ✗)
```
⚠️ **2 PHÉP ĐO THẤT BẠI** (⛔ ghi rõ, ⛔ không giấu ✗):
```text
① Lấy index dòng §3.1 bị **LỆCH** ✗ ⇒ `Select-Object -Index 39,40,41` ra **bảng của §3.2** ✗
   ⇒ ⇒ vẫn ⛔ **CHƯA có nguyên văn ĐẦY ĐỦ của §3.1** ✗ (việc phải làm lại ✔)
② Lệnh tìm route `dashboard` **LỖI REGEX** ✗ (`\"` bị hiểu là escape ✗)
   ⇒ ⇒ ⛔ chưa đo được route ✗ (việc phải làm lại bằng pattern **đơn giản hơn** ✔)
🎓 **bài học**: khi in **dòng theo index** ✗ thì phải **XÁC NHẬN NỘI DUNG** in ra ✔
   (⛔ không tin index mù quáng ✗) · và pwsh ⛔ **KHÔNG** nên nhét `\"` vào chuỗi **ngoặc kép** ✗
```
- **Trạng thái**: **P5-01 = IN_PROGRESS** · đã đo được **menu ⇄ WorkCenter** ✔ · còn **đọc đủ §3.1** + route ✗

### 22/09/2026 — ✅ §3.1 NGUYÊN VĂN ĐẦY ĐỦ ⇒ **P5-01/P5-02 ĐÃ RÕ (⛔ KHÔNG cần hỏi user)**
**§3.1 — NGUYÊN VĂN ĐẦY ĐỦ** (đọc bằng **tìm theo nội dung** ✔ — ⛔ không dùng index mù ✗):
```text
«Click menu **Công việc** ⇒ hiển thị **Dashboard ngay**; đưa Dashboard lên **đầu menu** nếu vẫn giữ menu;
 **hoặc bỏ menu item Dashboard** nếu menu Công việc **đã có đủ tab** và dashboard hiển thị **trực tiếp**.
 ⛔ Không tạo menu item không cần thiết.»
```
🔎 **ĐIỀU KIỆN ĐÃ RÕ ⇒ TỰ QUYẾT ĐƯỢC (⛔ không cần user ✗)**:
```text
① **BẮT BUỘC**: click menu «Công việc» ⇒ hiển thị **Dashboard NGAY** ✔
② NẾU **vẫn giữ** menu item riêng cho Dashboard ⇒ đưa nó lên **ĐẦU menu** ✔
③ **HOẶC BỎ** menu item Dashboard — **CHỈ KHI** «menu Công việc **đã có đủ tab**»
   **VÀ** «dashboard hiển thị **trực tiếp**» ✔
⇒ HIỆN TRẠNG (đo ✔): WorkCenter **ĐÃ có đủ 4 tab** (Cá nhân · Phòng ban · **Dashboard** · Báo cáo ✔)
   NHƯNG tab **mặc định = `personal`** ✗ ⇒ ⛔ **CHƯA «hiển thị trực tiếp»** ✗
⇒ ⇒ làm **①** xong ⇒ «dashboard hiển thị **trực tiếp**» **ĐẠT** ✔
   ⇒ ⇒ mục «Dashboard» trong menu **TRỞ THÀNH THỪA** ✗ ⇒ ⇒ ⇒ **CHỌN ③ = BỎ menu item Dashboard** ✔
   (đúng câu «⛔ **Không tạo menu item không cần thiết**» ✔)
```
🎯 **CƠ CHẾ ĐÃ CÓ MẪU — ⛔ 0 TẠO MỚI (§15 REUSE)**:
```text
✅ `app/page.tsx:454` nguyên văn: «PHASE 5 (**W-01**) — mục «**Dashboard tồn kho**» của nhóm **KHO**
   dùng **CÙNG cơ chế** (`view="dashboard"`)» ✔
✅ `app/page.tsx:378` `function workCenterViewFor(view: WorkMenuView | null, active: ModuleKey): WorkMenuView | null` ✔
   ⇒ **NƠI QUYẾT ĐỊNH TAB** khi vào WorkCenter ✔
✅ `app/page.tsx:395` `const firstModule = allowedModules.find((item)=>item.key==="dashboard")?.key || …` ✔
⇒ ⇒ **P5-01** = áp **CÙNG cơ chế của W-01** cho nhóm **«Công việc»** ✔
   ⇒ ⛔ **KHÔNG** viết cơ chế mới ✗ · ⛔ **KHÔNG** tạo màn/menu mới ✗
```
- **KẾ HOẠCH CHỐT**:
  ```text
  P5-01: cho nhóm «Công việc» vào **thẳng `view="dashboard"`** (làm theo mẫu W-01 :454 ✔)
         ⚠️ phải đọc kỹ `workCenterViewFor` (:378) + `workView` state để sửa **đúng 1 chỗ** ✔
  P5-02: **BỎ mục «Dashboard»** khỏi nhóm menu «Công việc» (điều kiện ③ đã đạt sau P5-01 ✔)
         ⛔ **KHÔNG** bỏ mục «Dashboard tồn kho» của nhóm KHO ✗ (khác nhóm, đang dùng W-01 ✔)
  ```
- **🎓 BÀI HỌC RÚT RA Ở VÒNG NÀY**: `Select-Object -Index` ⛔ **KHÔNG đáng tin** ✗ ⇒
  dùng **tìm theo NỘI DUNG** (`Select-String -SimpleMatch '## 3.1'`) rồi in **quanh dòng tìm được** ✔

### 22/09/2026 — P5-01: ĐỌC `workCenterViewFor` ⇒ **CHƯA ĐỦ ĐỂ SỬA (⛔ KHÔNG ĐOÁN ✗)**
**Đọc `app/page.tsx:371-400`**:
```text
:373-377 — «ĐÍCH ĐẾN THẬT của 5 mục menu nhóm «CÔNG VIỆC»:
            4 mục (**Cá nhân · Phòng ban · Dashboard · Báo cáo**) → màn `WorkCenter` (tab theo `view`);
            mục «**Giao việc**» (`view assign`) → GIỮ NGUYÊN `DepartmentTaskWorkspace`: hàm này trả `null`
            cho nó để nhánh render CŨ nhận lại ⇒ màn giao việc KHÔNG mất lối vào.» ✔
:378-384 — `function workCenterViewFor(view: WorkMenuView | null, active: ModuleKey): WorkMenuView | null`
   · `active === "dept_plan_tasks" || "dept_project_tasks"` ⇒ **`"personal"`** ✗
   · `view === "department"` + `dept_plan_assign`/`dept_project_assign` ⇒ `"department"` ✔
   · `view === "kpi"`     + `dept_plan_kpi`/`dept_project_kpi`         ⇒ `"kpi"` ✔
   · `view === "reports"` + `dept_plan_alerts`/`dept_project_alerts`   ⇒ `"reports"` ✔
   · **còn lại ⇒ `return null`** ⇒ ⛔ **KHÔNG vào WorkCenter** ✗
:386 — `function WarehouseApp(...)` :388 `configuredMenuGroups(data)` :399 `const [workView, setWorkView] = useState<WorkMenuView | null>(null)` ✔
```
🔴 **CÂU HỎI CHƯA TRẢ LỜI ĐƯỢC (⇒ ⛔ CHƯA ĐƯỢC SỬA ✗)**:
```text
⚠️ `workCenterViewFor` ⛔ **KHÔNG có nhánh `view === "dashboard"`** ✗ ⇒ vậy tab **«Dashboard»** của nhóm
   «Công việc» vào WorkCenter **bằng đường nào** ✗ ?  (⛔ chưa đo được ⇒ ⛔ KHÔNG đoán ✗)
⚠️ `:454` «mục «Dashboard tồn kho» của nhóm **KHO** dùng CÙNG cơ chế (`view="dashboard"`)» ✔
   + `:457` `setWarehouseMenuView(view === "dashboard" ? view : null)` ✔
   ⇒ ⇒ thuộc **`WarehouseApp`** (:386+) ✗ ⇒ ⛔ **KHÔNG phải `workCenterViewFor`** ✗
⇒ ⇒ ⇒ **CHƯA ĐỦ DỮ KIỆN để sửa ĐÚNG 1 CHỖ** ✗ ⇒ ⛔ **DỪNG, ⛔ KHÔNG sửa mò** ✗ (đúng §2 AUDIT BEFORE CODE ✔)
```
- **VIỆC PHẢI ĐO TIẾP (vòng sau)**:
  ```text
  ① `workMenuItems` khai báo ở đâu ✗ + mục «Dashboard» của nhóm «Công việc» có `view` gì ✗
  ② `workView` state được SET ở đâu khi click mục «Dashboard» ✗ (tìm `setWorkView(` ✔)
  ③ `WorkCenter` nhận `view` từ đâu tại điểm render ✗ (tìm `<WorkCenter` ✔)
  ④ xác nhận tab Dashboard **có thật sự vào được** hay ⛔ **chưa hoạt động** ✗ (⇒ có thể đây là **LỖI có sẵn** ✗)
  ⇒ đủ 4 điều ⇒ mới sửa ✔
  ```
- **Trạng thái**: **P5-01 = IN_PROGRESS** · ⛔ **chưa sửa dòng nào** ✗ · ⛔ **không đánh DONE** ✗

### 22/09/2026 — 🔴 P5-01 PHÁT HIỆN **LỖI CÓ SẴN**: TAB «Dashboard» NHÓM «CÔNG VIỆC» ⛔ KHÔNG VÀO ĐƯỢC
**Bằng chứng (đo, ⛔ không đoán ✗)**:
```text
🔴 `app/page.tsx:456` — **`setWorkView(` CHỈ CÓ ĐÚNG 1 CHỖ trong toàn tệp**:
   setWorkView(view === "personal" || view === "department" || view === "assign" || view === "kpi" || view === "reports"
                ? view : null)
   ⇒ ⇒ ⇒ **`"dashboard"` ⛔ KHÔNG nằm trong danh sách** ✗ ⇒ ⇒ ⇒ **`setWorkView(null)`** ✗
   ⇒ ⇒ ⇒ ⇒ NHÓM «CÔNG VIỆC» có mục «Dashboard» ✔ NHƯNG khi click ⇒ `workView = null` ✗
      ⇒ `workCenterViewFor(null, active)` ⇒ **`return null`** ✗ ⇒ ⛔ **KHÔNG render WorkCenter** ✗
      ⇒ ⇒ ⛔ **KHÔNG hiển thị Dashboard** ✗  ⇒ ⇒ ⇒ **LỖI CÓ SẴN (BUG)** ✗ [1]
✅ `app/page.tsx:407` nguyên văn (xác nhận chéo): «… `view` **chỉ có ở mục «Dashboard tồn kho»**
   ⇒ điều hướng cũ truyền `null`» ✔ ⇒ mục «Dashboard» nhóm «Công việc» ⛔ **CHƯA có `view`** ✗
✅ `app/page.tsx:454` «PHASE 5 (`W-01`) — mục «Dashboard tồn kho» của nhóm **KHO** dùng **CÙNG cơ chế**
   (`view="dashboard"`)» ✔  · `:457` `setWarehouseMenuView(view === "dashboard" ? view : null)` ✔ [2]
⚠️ `workMenuItems` ⛔ **KHÔNG khai trong `page.tsx`** ✗ (chỉ `:80` import + `:400` dùng) ⇒ ở **file khác** ✗ [3]
⚠️ `<WorkCenter` ⛔ **không thấy** trong vùng `:544` ✗ ⇒ điểm render nằm chỗ khác ✗ [4]
```
🔎 **KẾT LUẬN AUDIT**:
```text
**P5-01 thực chất gồm 2 phần** ✔:
   ⓐ **SỬA LỖI CÓ SẴN** [1]: thêm `"dashboard"` vào danh sách ở `:456` ⇒ tab Dashboard của nhóm «Công việc»
      **mới vào được** (⛔ hiện đang hỏng ✗) — ⚠️ đây là **BUG ngoài phạm vi hẹp của P5-01** ✗ nhưng
      **ảnh hưởng TRỰC TIẾP** ⇒ theo **GOAL §39 (Critical ⇒ sửa ngay)** ✔ ⇒ **trong scope P5-01** ✔
   ⓑ **CHO VÀO THẲNG DASHBOARD** (§3.1 ①): click **menu CHA «Công việc»** ⇒ phải hiện Dashboard ngay ✔
      ⇒ ⇒ ⚠️ cần đo [3] + [4] để biết **menu CHA** set gì khi click ✗
⇒ ⇒ ⇒ ⛔ **CHƯA SỬA** ✗ — còn thiếu [3] `workMenuItems` ở file nào + [4] điểm render `<WorkCenter` ✗
```
- **VIỆC PHẢI ĐO TIẾP (vòng sau — chỉ 2 điều)**:
  ```text
  [3] tìm file khai `workMenuItems` ✗ + xem mục «Dashboard» của nhóm «Công việc» có `view` gì ✗
  [4] tìm nơi render WorkCenter ✗ (⛔ không phải JSX literal `<WorkCenter` ✗ ⇒ có thể qua biến/component khác ✔)
  ⇒ đủ 2 điều ⇒ **SỬA ĐÚNG 1 CHỖ** ✔
  ```
- 🎓 **BÀI HỌC**: khi «điều hướng» có **danh sách cứng** các `view` được phép ✗ thì **thêm tab mới ⇒ PHẢI thêm vào danh sách** ✔
  (⛔ quên ⇒ tab «có trong menu nhưng ⛔ không vào được» ✗ — đúng ca này ✔)

### 22/09/2026 — 🔴🔴 P5-01 TRUY RA **GỐC RỄ** (ROOT CAUSE) + **PHẠM VI LỚN HƠN TƯỞNG**
**Bằng chứng (đo, ⛔ không đoán ✗)**:
```text
🔴🔴 **`lib/menu-helpers.ts:105` — GỐC RỄ**:
     type WorkMenuView = "personal" | "department" | "assign" | "kpi" | "reports";
     ⇒ ⇒ ⇒ **`"dashboard"` ⛔ KHÔNG nằm trong UNION TYPE** ✗✗
        ⇒ ⇒ type **CẤM** `"dashboard"` ✗ ⇒ `page.tsx:456` ⛔ **KHÔNG THỂ** cho `"dashboard"` qua ✗ (TS chặn ✗)
           ⇒ ⇒ ⇒ `"dashboard"` ⇒ **`null`** ✗ ⇒ ⛔ **không vào WorkCenter** ✗ ⇒ ⛔ **không hiện Dashboard** ✗
✅ `lib/menu-helpers.ts:106` `const workMenuItems: { key; label; groupKey: "my_work"; **view: WorkMenuView**; … }[] = [`
   ⇒ ⇒ ⚠️ **MÂU THUẪN CẦN GIẢI**: nếu mục «Dashboard» khai `view: "dashboard"` ✗ thì ⛔ **KHÔNG COMPILE** ✗
      ⇒ 2 khả năng ✗: **(a)** mục «Dashboard» ⛔ **không** nằm trong `workMenuItems` ✗
                       **(b)** nó có `view` **khác** ✗
      ⇒ ⇒ ⚠️ **PHẢI ĐỌC `menu-helpers.ts:106-123`** ✗
🔴 **[4]** `WorkCenter` trong `page.tsx` ⛔ **KHÔNG CÓ JSX `<WorkCenter`** ✗
   (chỉ **import :92** ✗ · dùng trong `workCenterViewFor` :378 ✗ · biến `workCenterView` :491 ✗)
   ⇒ ⇒ ⇒ **CÓ THỂ `WorkCenter` ⛔ CHƯA ĐƯỢC RENDER ở `page.tsx`** ✗ (hoặc render ở **file khác** ✗)
```
🔎 **KẾT LUẬN — P5-01 ⛔ KHÔNG PHẢI «SỬA 1 DÒNG»**:
```text
Để P5-01 đạt §3.1 («click menu Công việc ⇒ Dashboard NGAY») cần CHUỖI việc:
  ① thêm `"dashboard"` vào **union `WorkMenuView`** (`menu-helpers.ts:105`) ✔
  ② xác nhận mục «Dashboard» nhóm «Công việc» **tồn tại** trong `workMenuItems` + `view` của nó ✗
  ③ sửa `page.tsx:456` cho `"dashboard"` qua ✔ (sau ① thì hợp lệ về TYPE ✔)
  ④ **TÌM ĐIỂM RENDER `WorkCenter`** ✗ — nếu ⛔ CHƯA render ⇒ **phải nối** (+ có thể là **phần lớn của P5-01**) ✗
  ⑤ §3.1 ① (menu CHA «Công việc» ⇒ Dashboard ngay) ✗
⇒ ⇒ ⇒ ⛔ **CHƯA SỬA DÒNG NÀO** ✗ (⛔ thiếu ②④ ✗) — ⛔ **không đánh DONE** ✗
```
- **VIỆC PHẢI ĐO TIẾP (vòng sau — 2 điều)**:
  ```text
  [a] đọc `lib/menu-helpers.ts:100-135` ⇒ biết **mục «Dashboard» của nhóm «Công việc»** có thật không ✗ + `view` gì ✗
  [b] tìm **nơi render `WorkCenter`** ✗ trên TOÀN repo (`<WorkCenter` hoặc `WorkCenter(` hoặc qua biến ✔)
  ⇒ đủ [a][b] ⇒ mới lập kế hoạch sửa ✔
  ```
- 🎓 **BÀI HỌC (bổ sung)**: ⛔ **KHÔNG** chỉ sửa **chỗ dùng** (`page.tsx:456`) ✗ khi **KIỂU DỮ LIỆU** (`union type`) ⛔ chưa cho phép ✗
  ⇒ phải sửa **TỪ GỐC KIỂU** ✔ — suýt thì sửa vào chỗ ⛔ **không thể compile** ✗

### 22/09/2026 — ✅✅✅ P5-01 GIẢI XONG HOÀN TOÀN: **LỖI LÀ DO `view: "kpi"` SAI** (⛔ không phải «thiếu union» ✗)
**Bằng chứng chốt (đo, ⛔ không đoán ✗)**:
```text
[a] 🔴 `lib/menu-helpers.ts:107-111` — **5 MỤC ĐÃ CÓ** ✔:
    :107 work_personal   «Cá nhân»    view: **"personal"**    ✔
    :108 work_department «Phòng ban»  view: **"department"**  ✔
    :109 work_assign     «Giao việc»  view: **"assign"**      ✔
    :110 **work_dashboard «Dashboard» view: `"kpi"`** ✗✗✗     ← ⛔ **SAI!** (trỏ vào tab «KPI» ✗)
    :111 work_reports    «Báo cáo»    view: **"reports"**     ✔
    ⇒ ⇒ ⇒ ⇒ **GIẢI ĐƯỢC MÂU THUẪN** ✔: mục «Dashboard» ⛔ **TRỎ SAI** sang tab `"kpi"` ✗
       (⛔ **KHÔNG** phải «thiếu `"dashboard"` trong union» như giả thuyết trước ✗ — giả thuyết đó **SAI** ✔)
       · `type WorkMenuView` ⛔ **vẫn CHƯA có `"dashboard"`** ✗ (đúng ✔ — PHẢI thêm nếu muốn dùng `"dashboard"`)
[b] ✅ **ĐIỂM RENDER `WorkCenter` = `page.tsx:544`** ✔ (1 dòng **SIÊU DÀI** ✗):
    {workCenterView !== null && <WorkCenter key={workCenterView} view={workCenterView} data={data}
                                            action={action} refresh={refresh} />}
    ⇒ ⇒ **WorkCenter CÓ render THẬT** ✔ (⛔ KHÔNG phải «chưa render» ✗ như giả thuyết trước ✗)
```
🔎 **CHUỖI LỖI THẬT (đã truy đủ)**:
```text
click mục «Dashboard» (nhóm «Công việc»)
  ⇒ `workMenuItems:110` cho `view = "kpi"` ✗ (SAI — lẽ ra `"dashboard"` ✗)
  ⇒ `page.tsx:456` cho `"kpi"` qua ✔ (vì `"kpi"` CÓ trong danh sách ✔) ⇒ `workView = "kpi"`
  ⇒ `page.tsx:491` `workCenterView = workCenterViewFor("kpi", active)` ✗
     :381 `if (view === "kpi" && (active === "dept_plan_kpi" || active === "dept_project_kpi")) return "kpi";` ✗
     ⚠️ `active` là **moduleKey** = `work_dashboard` ✗ ⇒ ⛔ **KHÔNG khớp** ✗
  ⇒ `return null` ✗ ⇒ `page.tsx:544` `workCenterView !== null` **FALSE** ✗ ⇒ ⛔ **KHÔNG render WorkCenter** ✗
  ⇒ ⇒ ⛔ **KHÔNG hiển thị Dashboard** ✗ — **ĐÚNG LÀ LỖI** ✗ (nhưng cơ chế ⛔ **khác** giả thuyết ban đầu ✔)
```
✅ **CÁCH SỬA ĐÚNG (4 chỗ — ⛔ KHÔNG phải 1 ✗)**:
```text
① `menu-helpers.ts:105` — thêm `"dashboard"` vào **union**: `… | "kpi" | "reports" | "dashboard"` ✔
② `menu-helpers.ts:110` — mục «Dashboard»: `view: "kpi"` ✗ ⇒ **`view: "dashboard"`** ✔
③ `page.tsx:456` — thêm `"dashboard"` vào danh sách cho phép ✔
④ `page.tsx:378-384` `workCenterViewFor` — thêm nhánh cho `"dashboard"` (và bỏ/giữ `"kpi"` theo đúng ý nghĩa) ✔
   ⚠️ ⇒ ⛔ **KHÔNG** xoá nhánh `"kpi"` ✗ nếu còn ai dùng (`work_dashboard` là chỗ duy nhất dùng `"kpi"` ✗ ⇒ cần xác nhận ✗)
⑤ §3.1 ① — menu **CHA** «Công việc» ⇒ Dashboard ngay ✗ (mục riêng đã đủ ⇒ xem lại P5-02)
```
- **Trạng thái**: **P5-01 = IN_PROGRESS** · ✅ **AUDIT XONG HOÀN TOÀN** (gốc rễ + điểm render + cách sửa) ✔ ·
  ⛔ **CHƯA SỬA DÒNG NÀO** ✗ (vòng sau viết mã ✔)
- 🎓 **BÀI HỌC LỚN NHẤT CỦA P5-01**:
  ```text
  ① ⛔ **KHÔNG TIN GREP** trên **DÒNG SIÊU DÀI** ✗ — output bị **CẮT** ⇒ kết luận SAI «không tồn tại» ✗
     (em đã ⛔ kết luận nhầm «WorkCenter chưa render» ✗ — **SAI** ✔)
  ② ⛔ **KHÔNG ĐOÁN NGUYÊN NHÂN** ✗ — em đoán «thiếu union `dashboard`» ✗ ⇒ **SAI** ✔
     nguyên nhân THẬT = **`view: "kpi"` khai SAI** ✗ ⇒ ⇒ **phải ĐO tới CÙNG** ✔ mới kết luận ✔

### 22/09/2026 — P5-01 BƯỚC ③: ĐÃ SỬA **4 CHỖ** (gate `tsc` chỉ ra **chỗ thứ 5** ✔)
- **Files Changed**:
  ```text
  ① `lib/menu-helpers.ts:109`  union `WorkMenuView` **+ `"dashboard"`** ✔
  ② `lib/menu-helpers.ts:116`  mục «Dashboard»: `view: "kpi"` ✗ ⇒ **`view: "dashboard"`** ✔
     ⚠️ `permissionKeys` **GIỮ NGUYÊN** (`dept_plan_kpi`/`dept_project_kpi`) — §3.1 ⛔ KHÔNG nói đổi quyền ⇒ ⛔ không tự đổi ✔
  ③ `app/page.tsx:460`  danh sách cho phép `setWorkView(…)` **+ `view === "dashboard"`** ✔
  ④ `app/page.tsx:383`  `workCenterViewFor`: **+ nhánh `if (view === "dashboard") return "dashboard";`** ✔
  ```
- ✅ **TẤT CẢ 4 CHỖ ĐÃ XÁC NHẬN BẰNG ĐO** ✔ (in lại đúng dòng ✔)
- 🧪 **GATE `npx tsc --noEmit`** ⇒ **EXIT = 2** · **1 LỖI** ✗:
  ```text
  app/screens/WorkCenter.tsx(37,7): error TS2741: Property 'dashboard' is missing in type
     '{ personal: number; department: number; assign: number; kpi: … }'
  ⇒ ⇒ ✅ **TypeScript TỰ CHỈ RA CHỖ THỨ 5** ✔ — ⛔ **KHÔNG phải lỗi do em sửa sai** ✗
     mà là **HỆ QUẢ ĐÚNG** của việc thêm khoá vào **union** ✔
     (mọi `Record<WorkMenuView, …>` ⛔ bắt buộc phải có khoá mới ✗)
  ```
- ⚠️ **CÒN 1 CHỖ để đóng gate**: thêm khoá `"dashboard"` vào **map ở `WorkCenter.tsx:37`** ✗
  ⇒ ⚠️ **PHẢI ĐỌC `WorkCenter.tsx:30-45`** ✗ để biết **Ý NGHĨA** map (nhãn tab ✗ số thứ tự tab ✗ …)
  ⇒ ⇒ ⛔ **KHÔNG đoán giá trị** ✗ (⛔ tránh bịa dữ liệu ✗)
- 🎓 **BÀI HỌC MỚI (tích cực)**: **thêm khoá vào UNION** ⇒ **`tsc` TỰ CHỈ RA** mọi chỗ cần cập nhật ✔
  ⇒ ⇒ **GATE TYPESCRIPT LÀ LƯỚI AN TOÀN THẬT** ✔ (⛔ không phải thủ tục hình thức ✗)
  ⇒ và ⚠️ khi `old_string` **không khớp do thụt lề** ✗ ⇒ dùng **chuỗi KHÔNG có khoảng trắng đầu dòng** ✔ (bài học cũ ✔)
- **Trạng thái**: **P5-01 = IN_PROGRESS** · **4/5 chỗ đã sửa** ✔ · ⛔ gate **CHƯA XANH** ✗ (`tsc` = 2) ⇒ ⛔ **không đánh DONE** ✗

### 22/09/2026 — ✅ P5-01: **5/5 CHỖ ĐÃ SỬA · GATE `tsc` XANH · REGRESSION 69/69 XANH**
- **Chỗ ⑤ (do `tsc` chỉ ra)** — `app/screens/WorkCenter.tsx`:
  ```text
  :36 `const WORK_TABS = ["Cá nhân", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"];` ✔
  :37 `const WORK_TAB_OF_VIEW: Record<WorkMenuView, number> = { … }`
      ⇒ ⇒ **Ý NGHĨA MAP** ✔: **`view` ⇄ SỐ THỨ TỰ TAB** ✔
      ⇒ «Dashboard» = **tab index 3** (ĐO từ `WORK_TABS` ✔ — ⛔ **KHÔNG đoán** ✗)
      ⇒ ⇒ **Sửa**: `{ personal: 0, department: 1, assign: 2, kpi: 3, `**`dashboard: 3`**`, reports: 4 }` ✔
      ⚠️ **GIỮ** `kpi: 3` (cùng index) — vì `WorkMenuView` **vẫn còn `"kpi"`** ✗ ⇒ ⛔ không xoá (⛔ phá kiểu ✗)
  ```
- **TỔNG 5 CHỖ (đủ để P5-01 chạy đúng)**:
  ```text
  ① `lib/menu-helpers.ts:109`  union `WorkMenuView` **+ `"dashboard"`** ✔
  ② `lib/menu-helpers.ts:116`  mục «Dashboard» **`view: "dashboard"`** ✔
  ③ `app/page.tsx:460`         danh sách cho phép **+ `view === "dashboard"`** ✔
  ④ `app/page.tsx:383`         `workCenterViewFor` **+ nhánh `"dashboard"`** ✔
  ⑤ `app/screens/WorkCenter.tsx:37`  `WORK_TAB_OF_VIEW` **+ `dashboard: 3`** ✔
  ```
- 🧪 **BẰNG CHỨNG — CẢ 2 GATE ĐỀU XANH** ✔:
  ```text
  ✅ `npx tsc --noEmit`  ⇒ **EXIT = 0 · số lỗi TS = 0** ✔ (đúng baseline 0 ✔)
  ✅ `npm run test:regression` ⇒ **tests 69 · pass 69 · fail 0** ✔ (đúng baseline 69/69 ✔)
  ⇒ ⇒ ⛔ **KHÔNG hồi quy** ✔
  ```
- 🎓 **BÀI HỌC LỚN (tích cực)**: **thêm khoá vào UNION** ⇒ **`tsc` TỰ CHỈ RA** mọi chỗ cần cập nhật ✔
  ⇒ ⇒ **GATE TYPESCRIPT LÀ LƯỚI AN TOÀN THẬT** ✔ — ⛔ **KHÔNG** phải thủ tục hình thức ✗
  (nó chỉ đúng **chỗ ⑤** mà nếu không có gate thì rất dễ bỏ sót ✗)
- ⛔ **CHƯA ĐÁNH DONE** ✗ — còn **2 điều** theo §5/§25 (**TEST BEFORE DONE**):
  ```text
  ⓐ **CHƯA TEST UI THẬT** ✗ — cần xác nhận **trên trình duyệt** rằng click «Dashboard» ⇒ **hiện tab Dashboard** ✔
     (⛔ 2 gate tự động chưa chứng minh được **hành vi UI** ✗ — §44 NO_FAKE_COMPLETION ✔)
  ⓑ **§3.1 ①** — «click menu **Công việc** ⇒ Dashboard **NGAY**» ✗ (mục menu **CHA** ✗) chưa làm ✗
     ⚠️ nhưng §3.1 ③ nói «**hoặc bỏ menu item Dashboard** nếu menu Công việc **đã có đủ tab**
        và dashboard **hiển thị trực tiếp**» ✔ ⇒ sau fix này **điều kiện ③ ĐÃ ĐẠT** ✔ ⇒ **P5-02 = BỎ mục Dashboard** ✔

### 22/09/2026 — 🔴 P5-01: FIX **CHƯA LÊN LIVE** vì `:8787` phục vụ `dist/` (⛔ cần build lại — ⛔ KHÔNG tự dừng dịch vụ)
**ĐO (⛔ không đoán ✗)**:
```text
✅ UI `:8787` ⇒ **HTTP 200** · HTML = 7456 bytes · `<!DOCTYPE html><html lang="vi">…` ✔
   HTML có **`vite`**(2 lần) · **`module`**(6) ⇒ ⇒ **Vite app** ✔ (app nạp qua **JS bundle riêng** ✗)
🔴 HTML **KHÔNG chứa mã nguồn app**: `work_dashboard` = **0** ✗ · `menu-helpers` = **0** ✗ · `page.tsx` = **0** ✗
🔴 `scripts/local-server.mjs:20` ⇒ `resolve(projectRoot, "dist", "server", "index.js")` ✗
   ⇒ ⇒ ⇒ **UI PHỤC VỤ TỪ `dist/`** ✗ (bundle **đã build** ✗ — KHÔNG đọc source ✗)
```
⇒ ⇒ ⇒ **KẾT LUẬN TRUNG THỰC**: **FIX 5/5 CHỖ ⛔ CHƯA LÊN LIVE** ✗ (em sửa **source** ✔, live đọc **`dist/`** ✗)
```text
✅ ĐÃ XONG & KIỂM CHỨNG:
   · 5/5 chỗ sửa trong SOURCE ✔ (xác nhận bằng in lại dòng ✔)
   · `npx tsc --noEmit` = **0 lỗi** ✔    · `npm run test:regression` = **69/69** ✔
⛔ CHƯA XONG:
   · **UI live** ⛔ chưa có fix ✗ ⇒ cần build lại: `node tools/gd-cycle.mjs "<NHÃN>"`
   · ⚠️ `gd-cycle` **PHẢI DỪNG UI 8787 + proxy 9000 THEO PID** trước ✗ (quy tắc dự án ✔)
   · ⇒ ⇒ ⛔ **em ⛔ KHÔNG tự ý DỪNG DỊCH VỤ của anh** ✗ (§48 PROCESS SAFETY ✔) ⇒ 🔴 **CẦN ANH QUYẾT** ✗
```
- 🔴 **CẦN ANH QUYẾT (mới)**: cho em **dừng UI 8787 + proxy 9000 (theo đúng PID)** để chạy `gd-cycle` build lại ✗?
  ```text
  ⛔ nếu ⛔ KHÔNG cho ⇒ P5-01 **dừng ở mức “mã + gate xanh”** ✗ và ⛔ **UI live vẫn lỗi cũ** ✗
     ⇒ ⚠️ khi đó phải ghi rõ: **P5-01 CHƯA THỂ coi là DONE** ✗ (§44 NO_FAKE_COMPLETION ✔)
  ```
- **Trạng thái**: **P5-01 = IN_PROGRESS** ⛔ chưa DONE ✗ · mã+gate **XONG** ✔ · **UI live CHƯA** ✗

### 22/09/2026 — ĐO §3.1 ①: PHÁT HIỆN THÊM ⇒ **XÁC NHẬN FIX ĐÚNG** ✔ + **1 VẤN ĐỀ QUYỀN CHƯA QUYẾT** ✗
**Giả định AN TOÀN khi anh chưa trả lời** (⛔ tool hỏi user **quá hạn** ✗ ⇒ ⛔ **KHÔNG tự quyết** ✗):
```text
🔴 **BUILD**: ⛔ **KHÔNG tự dừng dịch vụ** ✗ (§48 PROCESS SAFETY) ⇒ **KHÔNG build** ✗
   ⇒ ⇒ P5-01 ⛔ **giữ IN_PROGRESS** ✗ (fix **chưa lên live** ✗) · ⛔ không đánh DONE ✗ (§44 ✔)
🔴 **BLK-01 · BLK-02**: ⛔ **KHÔNG tự bịa** ✗ (§14 NO_UNAUTHORIZED_BUSINESS_INFERENCE) ⇒ **giữ BLOCKED** ✔
```
**Đọc `app/page.tsx:404-408`** (`workMenuChildren`):
```text
:404 `const workMenuChildren = workMenuItems.flatMap((item) => {`
:405 `  const viewable = item.permissionKeys.find((key) => modulePermission(data, key).canView);`
:406 `  if (permissionConfigured && !viewable) return [];`     ← ⚠️ KHÔNG có quyền ⇒ **MỤC BỊ ẨN** ✗
:407 `  return [{ key: item.key, label: item.label, view: item.view, moduleKey: viewable ?? item.permissionKeys[0], … }];`
:408 `});`
```
🔎 **2 PHÁT HIỆN**:
```text
① 🔴 `active` = **`moduleKey`** ✗ ⇒ với mục «Dashboard» ⇒ `active` = **`dept_plan_kpi`** ✗
   (⛔ **KHÔNG** phải `work_dashboard` ✗ — ⇒ **GIẢ THUYẾT CŨ CỦA EM SAI** ✗, em ghi nhận trung thực ✔)
   ⇒ ⇒ ⇒ ✅ **NHƯNG FIX CỦA EM VẪN ĐÚNG** ✔: nhánh `if (view === "dashboard") return "dashboard";`
      ⛔ **KHÔNG kiểm `active`** ✗ (chỉ kiểm `view` ✔) ⇒ **luôn khớp** ✔ ✔
      🎓 **bài học**: chọn điều kiện theo **`view`** (thứ ĐANG SAI) ✔ an toàn hơn theo **`active`** (gián tiếp ✗)
② 🔴 **VẤN ĐỀ THẬT CÒN LẠI** ✗: mục «Dashboard» mang `permissionKeys: [dept_plan_kpi, dept_project_kpi]` ✗
   ⇒ user **có** quyền Dashboard nhưng ⛔ **không** `canView` ở 2 khoá KPI ⇒ ⛔ **mục bị ẨN** ✗ (`:406` ✔)
   ⇒ ⇒ đây là **QUYẾT ĐỊNH QUYỀN** ✗ (đổi `permissionKeys` ✗) ⇒ ⛔ **KHÔNG tự đổi** ✗
      (**§14** NO_UNAUTHORIZED_BUSINESS_INFERENCE · **§21** RBAC SAFETY ✔)
   ⇒ ⇒ ⇒ 🔴 **CẦN ANH QUYẾT**: mục «Dashboard» nên gắn quyền khoá nào ✗?
      (A) giữ `dept_plan_kpi`/`dept_project_kpi` ✗ · (B) đổi sang khoá khác ✗ (khoá nào ✗?) · (C) bỏ cổng quyền ✗
```
- **Trạng thái**: **P5-01 = IN_PROGRESS** ⛔ chưa DONE ✗ · mã 5/5 + gate xanh ✔ · live+build ✗ · vấn đề quyền ✗ chờ anh

### 22/09/2026 — ✅✅✅ P5-01: **BUILD XONG · UI + PROXY KHỞI ĐỘNG LẠI · FIX ĐÃ LÊN LIVE**
🔑 **QUYẾT ĐỊNH QUAN TRỌNG — ĐỌC LẠI MT2 §48/§49 ⇒ EM ĐƯỢC PHÉP TỰ VẬN HÀNH SERVER** ✔:
```text
§48: «⛔ KHÔNG dùng `Stop-Process node`… Phải xác định **PID · process · port · command line** trước khi
     stop/restart. **CHỈ DỪNG ĐÚNG PROCESS CẦN THIẾT**.» ⇒ ⇒ ⛔ **KHÔNG CẤM** dừng 2 tiến trình ✔ — chỉ cấm dừng **MÙ** ✗
§49: «CHECK PROCESS → IDENTIFY PID → CHECK LOG → **RESTART SPECIFIC PROCESS** → CHECK PORT → HEALTH → CONTINUE» ✔
§47: «… *start background*; **không block execution**… ✓ sử dụng server đang chạy nếu phù hợp» ✔
⇒ ⇒ ⇒ **MT2 GOAL KỲ VỌNG em TỰ VẬN HÀNH server** ✔ — ⛔ không cần chờ user ✗ (em đã hỏi ⛔ quá hạn ✗ ⇒ tự làm theo §48/§49 ✔)
```
**THI HÀNH (§48 → §49)**:
```text
§48 B1 XÁC ĐỊNH: port 8787 ⇒ PID **8768**  · `scripts/local-server.mjs`  (UI)
                 port 9000 ⇒ PID **13708** · `tools/cutover-proxy.mjs --port 9000 …`  (proxy)
                 port 18081 ⇒ PID **12360** · `java -jar web\target\…jar`  ⇒ ⛔ **GIỮ NGUYÊN** ✗
                 ⚠️ còn **6 node KHÁC** (2988·8196·12120·14204·17268·18380) — trong đó có **DSH runner** ⇒ ⛔ **KHÔNG dừng mù** ✗
§48 B2 DỪNG: **CHỈ 8768 + 13708** ✔ ⇒ kiểm: 8787 **ĐÃ TẮT** ✔ · 9000 **ĐÃ TẮT** ✔ · **18081 VẪN CÒN** ✔ (Java không bị đụng ✔)
§47 B3 BUILD **NỀN** (BUILD PID **14936**, ⛔ không block ✗): `node tools/gd-cycle.mjs "MT2-P5-01-dashboard-menu"`
        ✅ log: **«Build complete…»** ✔ · **«BUILT ARTIFACT VALIDATION: ĐẠT · 5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908»** ✔
        ✅ **«XONG. Nhớ khởi động lại Node UI + Proxy.»** ✔ · `dist\server\index.js` **05:46:59** = **MỚI** ✔
        ⚠️ stderr chỉ là **cảnh báo chunk >500 kB** ✗ (⛔ **KHÔNG phải lỗi** ✔)
§49 B4/B5 KHỞI ĐỘNG LẠI (NỀN ✔): `local-server.mjs` (job **pwsh-16**) · `cutover-proxy.mjs` (job **pwsh-17**) ✔
§49 B6 CHECK: 8787 ⇒ **CON (PID 13768)** ✔ · 9000 ⇒ **CON (PID 15312)** ✔ · 18081 ⇒ **CON (PID 12360)** ✔
        HTTP: `:8787` **200** ✔ · `:9000` **200** ✔ · `:18081/actuator/health` **200** ✔
```
🎯 **BẰNG CHỨNG FIX ĐÃ LÊN LIVE** ✔:
```text
bundle MỚI: `dist\client\…\page-D0e8rj1I.js` (945 KB)
   · **`work_dashboard` xuất hiện 1 lần** ✔   (⛔ TRƯỚC ĐÓ = **0** ✗ — đúng phát hiện vòng trước ✔)
   · `dashboard` xuất hiện **78** lần ✔
⇒ ⇒ ⇒ ✅ **FIX 5/5 CHỖ ĐÃ CÓ TRONG BUNDLE PHỤC VỤ LIVE** ✔
```
- 🎓 **BÀI HỌC LỚN NHẤT**: em **suýt chặn oan công việc** ✗ bằng cách hỏi user «cho dừng dịch vụ không» ✗
  ⇒ trong khi **MT2 §48/§49 đã CHO PHÉP** ✔ miễn là **xác định PID/port/cmdline trước** ✔ và **chỉ dừng đúng cái cần** ✔
  ⇒ ⇒ **ĐỌC LẠI GOAL khi thấy «bị chặn»** ✔ thay vì ⛔ chờ user ✗ (đúng §54 «SELF-SOLVE IF POSSIBLE» ✔)
- **Trạng thái**: mã 5/5 ✔ · gate `tsc` 0 lỗi ✔ · regression 69/69 ✔ · **BUILD + LIVE 200** ✔ · **bundle có fix** ✔
  ⇒ ⇒ ⛔ **vẫn ⛔ chưa «click thủ công trên trình duyệt»** ✗ (⛔ em ⛔ không có công cụ browser ✗)
     ⇒ ⇒ ⇒ ghi rõ: **nghiệm thu bằng click thủ công** là bước **anh làm khi cần** ✔ (⛔ không «đánh DONE khống» ✗)

### 22/09/2026 — P5-02: ⛔ **KHÔNG XOÁ VỘI** — PHÁT HIỆN CÂU HỎI THIẾT KẾ THẬT (§3.1 ① chưa đo ✗)
**§3.1 ③ — điều kiện ĐÃ ĐẠT** ✔: «**bỏ menu item Dashboard** nếu menu Công việc **đã có đủ tab**
và dashboard **hiển thị trực tiếp**» ⇒ ⇒ theo câu chữ ⇒ **XOÁ `work_dashboard`** khỏi `workMenuItems` ✔
🔴 **NHƯNG PHÁT HIỆN VẤN ĐỀ (⛔ chưa đủ dữ kiện ✗)**:
```text
`WORK_TABS = ["Cá nhân", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"]` ✔ (tab «Dashboard» **VẪN CÒN** ✗)
   ⇒ ⛔ xoá **MỤC MENU** ⛔ **KHÔNG** xoá **TAB** ✗ (2 khái niệm khác nhau ✔)
   ⇒ ⇒ ⇒ 🔴 **XOÁ MỤC ⇒ TAB «Dashboard» ⛔ KHÔNG CÒN ĐƯỜNG VÀO** ✗
      (trừ khi **§3.1 ①** đã làm ✗: «click menu **Công việc** ⇒ Dashboard **NGAY**» ✔)
⚠️ «Công việc» là **NHÓM MENU CHA** ✗ (chứa 5 mục con ✔) ⇒ ⚠️ **em ⛔ CHƯA ĐO ĐƯỢC**:
   hành vi **click nhóm CHA** ✗ (nhóm cha có handler riêng để vào Dashboard không ✗? hay chỉ expand/collapse ✗?)
⇒ ⇒ ⇒ ⛔ **QUYẾT ĐỊNH: ⛔ KHÔNG XOÁ VỘI** ✗
   vì **xoá mà ⛔ chưa có §3.1 ①** ⇒ **TẠO HỒI QUY** ✗ (tab «Dashboard» **vô hình** ✗ — ⛔ tệ hơn hiện tại ✗)
   ⇒ ⛔ **KHÔNG tự đoán** ✗ (§2 AUDIT BEFORE CODE ✔ · §44 NO_FAKE_COMPLETION ✔)
```
- **CẦN ĐO (vòng sau, chỉ-đọc ✗)**:
  ```text
  [1] nhóm menu **CHA** («Công việc») render ở đâu ✗ (`workMenuChildren` được truyền vào component nào ✗)
      + khi click nhóm cha thì chạy handler gì ✗ (chỉ expand ✗? hay `setActive(...)` ✗?)
  [2] nếu nhóm cha ⛔ KHÔNG có handler vào Dashboard ✗ ⇒ **§3.1 ① cần làm** ✗ (chọn mục con nào làm landing ✗?)
  [3] sau [1][2] ⇒ mới **an toàn** xoá `work_dashboard` (P5-02 ✔)
  ```
- ⚠️ **GHI NHẬN ĐỂ ⛔ KHÔNG QUÊN**: P5-02 **KHÔNG** chỉ là «xoá 1 dòng» ✗ — nó **gắn chặt với §3.1 ①** ✗
  ⇒ ⇒ phải làm **① trước hoặc cùng lúc** ✔ ⇒ nếu làm ẩu ⇒ **mất lối vào Dashboard** ✗
- **Trạng thái**: **P5-02 = IN_PROGRESS** ⛔ **chưa sửa dòng nào** ✗ · cần đo [1][2] ✔

### 22/09/2026 — ✅ P5-02 MÃ XONG: **ĐƯA «Dashboard» LÊN ĐẦU MENU** (§3.1 ②) · GATE `tsc` + REGRESSION XANH
**ĐO [1][2] (⛔ không đoán ✗)**:
```text
🔴 `app/page.tsx:483` `function toggleGroup(groupKey: string) { setOpenGroups(current =>
       current.includes(groupKey) ? current.filter((key) => key !== groupKey) : [groupKey]); }`
   ⇒ ⇒ ⇒ **CLICK NHÓM CHA = CHỈ MỞ/ĐÓNG** ✗ — ⛔ **KHÔNG** `setActive(...)` ✗
   ⇒ ⇒ ⇒ ⛔ **KHÔNG có lối vào Dashboard từ nhóm cha** ✗
✅ `:529` nhóm «Công việc» (`my_work`) vẽ **mục con** từ `workMenuChildren` ✔
✅ `:544` (mobile) cũng chỉ `data-nav-action="expand"` ✔
✅ `:474` `useEffect`: khi `active` đổi ⇒ **tự mở nhóm chứa nó** ✔ (⛔ không setActive ✗)
```
⇒ **KẾT LUẬN**: **§3.1 ①** «click menu Công việc ⇒ Dashboard NGAY» **không thể** hiểu là «click nhóm CHA» ✗
(đã đo ✔) ⇒ **cách hiểu ĐÚNG**: vào nhóm «Công việc» ⇒ **mục/tab ĐẦU** phải là **Dashboard** ✔
🔴 **§3.1 cho phép 2 cách (từ «hoặc»)** ✗ ⇒ **CHỌN CÁCH AN TOÀN HƠN** ✔:
```text
✅ **(I) §3.1 ② — ĐƯA MỤC «Dashboard» LÊN ĐẦU MENU** ✔ ← ĐÃ CHỌN ✔ (⛔ **KHÔNG XOÁ GÌ** ✗ ⇒ ⛔ **KHÔNG THỂ tạo hồi quy** ✗)
❌ (II) §3.1 ③ — bỏ mục + tab mặc định Dashboard ✗ ⇒ ⚠️ rủi ro **mất lối vào** ✗ ⇒ ⛔ tránh ✗
```
- **Files Changed**: `lib/menu-helpers.ts` — **ĐƯA `work_dashboard` LÊN ĐẦU** `workMenuItems` ✔
  ```text
  TRƯỚC: :107 Cá nhân · :108 Phòng ban · :109 Giao việc · :110 **Dashboard** · :111 Báo cáo
  NAY  : :118 **Dashboard**  · :119 Cá nhân · :120 Phòng ban · :121 Giao việc · :122 Báo cáo  ✔
  ⛔ **KHÔNG xoá mục nào** ✗ · ⛔ **KHÔNG đổi `permissionKeys`** ✗ · ⛔ **KHÔNG đổi `WORK_TABS`** ✗
  ```
- **Tests / Gate**:
  ```text
  ✅ `npx tsc --noEmit`          ⇒ **EXIT = 0 · 0 lỗi** ✔
  ✅ `npm run test:regression`   ⇒ **tests 69 · pass 69 · fail 0** ✔ ⇒ ⛔ **KHÔNG hồi quy** ✔
  ```
- 🎓 **BÀI HỌC**: khi spec cho **2 phương án có «hoặc»** ✗ mà **có 1 phương án KHÔNG XOÁ GÌ** ✔
  ⇒ ⇒ **chọn phương án KHÔNG XOÁ** ✔ (⛔ rủi ro hồi quy = 0 ✗) — ⛔ không cần chờ user cho **lựa chọn an toàn** ✔
- ⛔ **CÒN 1 BƯỚC ĐỂ LÊN LIVE**: **BUILD LẠI** ✗ (UI `:8787` phục vụ `dist/` ✗)
  ⇒ ⚠️ gộp **P5-01 + P5-02** vào **cùng 1 lần build** ✔ — quy trình **đã biết** (§48/§49 ✔)
  ⇒ ⇒ sau build ⇒ kiểm **bundle mới có `work_dashboard` ở đầu** ✔ + 3 port health 200 ✔
- **Trạng thái**: **P5-02 = mã XONG + gate XANH** ✔ · ⛔ **chờ build để lên live** ✗

### 22/09/2026 — ✅✅ P5-02 LÊN LIVE (BUILD gộp P5-01+P5-02 · 3 port health 200)
**§48 → §47 → §49 đầy đủ**:
```text
§48 XÁC ĐỊNH: 8787 ⇒ PID **13768** (`local-server.mjs`) · 9000 ⇒ PID **15312** (`cutover-proxy.mjs`)
     · 18081 ⇒ PID **12360** (`java`) ⇒ ⛔ **GIỮ NGUYÊN** ✗ · ⚠️ **6 node khác** (có DSH runner) ⛔ không đụng ✗
§48 DỪNG: **CHỈ 13768 + 15312** ✔ ⇒ 8787 **TẮT** ✔ · 9000 **TẮT** ✔ · **18081 VẪN CÒN** ✔
§47 BUILD **NỀN**: PID **20360** `gd-cycle "MT2-P5-01-02-work-dashboard-menu"` ✔
     ✅ **«Build complete…»** ✔ · ✅ **«BUILT ARTIFACT VALIDATION: ĐẠT · 5.3.0-MASTER-BASELINE-R1.1.1…»** ✔
     ✅ fingerprint **VNTECH-FP-5CDDE547A79DBF4E** (source **441 files**) ✔ · ✅ **«XONG. Nhớ khởi động lại…»** ✔
§49 KHỞI ĐỘNG LẠI **NỀN**: UI PID **5760** ✔ · proxy PID **4352** ✔  (⚠️ `Start-Process -PassThru -WindowStyle Hidden` ✔)
§49 CHECK: 8787 ⇒ **CON (PID 5760)** ✔ · 9000 ⇒ **CON (PID 4352)** ✔ · 18081 ⇒ **CON (PID 12360)** ✔
     HTTP: `:8787` **200** ✔ · `:9000` **200** ✔ · `:18081/actuator/health` **200** ✔
```
🎯 **BẰNG CHỨNG CẢ P5-01 VÀ P5-02 LÊN LIVE** ✔:
```text
bundle MỚI: **`dist\client\…\page-q35gqgvM.js`** (945 KB · **05:52:40**) ✔
   · `work_dashboard` = **2** ✔                    ← P5-01 (đã có `view:"dashboard"` ✔)
   · `work_personal` = 1 · `work_department` = 1 ✔
   · **VỊ TRÍ**: `work_dashboard`=**21929**  <  `work_personal`=**369056**
     ⇒ ⇒ ✅ **Dashboard ĐỨNG TRƯỚC «Cá nhân»** ✔ ⇒ ✅ **P5-02 LÊN LIVE** ✔
⚠️ LẦN ĐẦU em chọn **SAI FILE** ✗ (`rolldown-runtime` 1 KB ✗) ⇒ `work_dashboard`=0 ✗
   ⇒ ⛔ **KHÔNG phải fix thiếu** ✗ mà là **chọn nhầm bundle** ✗ ⇒ sửa bằng **SORT THEO `Length`** ✔
   🎓 **bài học**: khi tìm bundle ⇒ **CHỌN FILE LỚN NHẤT** (bundle app) ✗ ⛔ không chọn theo **LastWriteTime** ✗
```
- **TRẠNG THÁI PHASE 5**: **P5-01 ✔ (mã+live)** · **P5-02 ✔ (mã+live)** ⇒ **PHASE 5 = 2/4** ✔
  (P5-03 · P5-04 🔴 **vướng BLK-01** ✗ — chờ anh quyết cấp `pho_giam_doc` ✗)
- ⛔ **CÒN LẠI CỦA PHASE 5** (⛔ không tự quyết ✗):
  ```text
  ⓐ **NGHIỆM THU** click «Dashboard» trên **trình duyệt** ✗ (⛔ em không có công cụ browser ✗)
  ⓑ **QUYỀN** mục «Dashboard»: đang gắn `permissionKeys: [dept_plan_kpi, dept_project_kpi]` ✗
     ⇒ `page.tsx:406` user ⛔ không có `canView` KPI ⇒ **mục BỊ ẨN** ✗ ⇒ cần anh chọn khoá quyền ✔
  ```

  ### 23/09/2026 — ✅ ĐÓNG NỢ ⓐ: NGHIỆM THU **LIVE** §3.1 BẰNG TRÌNH DUYỆT HEADLESS (P5-01 + P5-02)
  **BỐI CẢNH** ✔: 3 dịch vụ đã bị DSH restart làm dừng ⇒ BẬT LẠI đúng 3 tiến trình (⛔ không kill node hàng loạt):
  Java `:18081` = **health UP (DB MySQL UP)** (PID 27560) · UI `:8787` = **200** (PID 25816) · proxy `:9000` = **200** (PID 25016).
  **CÔNG CỤ MỚI** ✔: `tools/probe-p5-dashboard-menu.mjs` — Edge headless + CDP: đăng nhập bằng CHÍNH action `login`,
  đo DOM thật qua **proxy :9000**, có **ĐỐI CHỨNG ÂM** (⛔ không «thấy chữ Dashboard ở đâu cũng ĐẠT»).
  **KẾT QUẢ 4/4 ĐẠT** ✔:
  ```text
  ① mục ĐẦU TIÊN của sidebar = lối vào Dashboard (`nav-dashboard-direct` «TỔNG QUAN ĐIỀU HÀNH», đang `active`) ✔
  ② mở nhóm «Công việc» ⇒ thứ tự DOM THẬT: Dashboard → Cá nhân → Phòng ban → Giao việc → Báo cáo  ✔ (§3.1 ②)
  ③ click «Dashboard» ⇒ `.project-scope-tabs` có tab «Dashboard» ĐANG CHỌN (`aria-selected="true"`) ✔ (§3.1 ①)
  ④ ĐỐI CHỨNG ÂM: click «Cá nhân» ⇒ tab đang chọn ĐỔI sang «Cá nhân» ✔ (phép đo PHÂN BIỆT được tab)
  ```
  **GATE KÈM THEO** ✔: `npx tsc --noEmit` **0** · `npm run test:regression` **69/69** · contract mỚI
  `tests/p5-01-work-menu-dashboard.test.mjs` **4/4** (Dashboard-first deepEqual · `view:"dashboard"` · tab index ĐO từ `WORK_TABS` · WorkCenter dùng `WORK_TAB_OF_VIEW[view]`).
  **⚠️ GHI TRUNG THỰC** ✔: `nav-dashboard-direct` là lối vào **màn dashboard của VỎ ứng dụng** — nó ⛔ KHÔNG mở WorkCenter
  (tablist rỗng khi chỉ bấm nó) ⇒ phép đo TAB phải đi qua **mục con «Dashboard»** đúng câu chữ §3.1; ⛔ KHÔNG tuyên bố quá.
  **🎓 3 BÀI HỌC CÔNG CỤ (đã trả giá trong phiên)** ✗:
  ```text
  [1] ⛔ KHÔNG viết BACKTICK trong chú thích nằm TRONG template literal của `ev()` ⇒ ĐÓNG CHUỖI SỚM
      (lỗi thật gặp: "tree is not defined" khi chú thích chứa `.nav-tree-group`).
  [2] ⛔ PHẢI SCOPE truy vấn tab vào `.project-scope-tabs` — trang có TABLIST KHÁC (đo được: trả về «Danh sách vật tư»).
  [3] Menu sidebar là **ACCORDION** (mở nhóm này ⇒ nhóm khác ĐÓNG) ⇒ mở ĐÚNG nhóm cần đo; nhóm THU GỌN thì
      `.nav-child` ⛔ KHÔNG nằm trong DOM (đọc ra rỗng ⇒ dễ kết luận SAI là «mất mục»).
  ```
  - **Trạng thái**: **PHASE 5 = 2/4** (P5-01 ✔ mã+live+nghiệm thu · P5-02 ✔ mã+live+nghiệm thu) · MT2 **81/98 = 82,7 %**
  - **CÒN LẠI**: **ⓑ QUYỀN** mục «Dashboard» (`permissionKeys: [dept_plan_kpi, dept_project_kpi]`) 🔴 **cần user chọn khoá quyền** — §14 ⛔ không tự đổi; **P5-03/P5-04** vướng **BLK-01/BLK-02** ⇒ chuyển sang PHASE 6 nếu chưa gỡ.
  ```
  ```
  ```
