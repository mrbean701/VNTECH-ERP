# 📐 KẾ HOẠCH W4/W5 — **DẢI TAB ĐỌC 6 KHOÁ `work_*`** + **MA TRẬN: 6 DÒNG TAB · `work_others` · ẨN 4 KHOÁ CŨ**

- **Ngày đo:** 09/10/2026 (≈14:55) · **Phiên:** `ERP-SESSION-04` (`SESSION_D`) · **Trạng thái:** ✅ **USER ĐÃ CHỐT (09/10/2026)** → ⏳ **CHỜ BUILD CỦA S01 XONG RỒI THI HÀNH**
- **✅ QUYẾT ĐỊNH CỦA USER (trả lời thẻ hỏi 09/10/2026):** ① **W4 = PHƯƠNG ÁN `A` — LÙI AN TOÀN** (chỉ ẩn/hiện **từng tab** khi tài khoản **ĐÃ CÓ ≥1 khoá `work_*`**; ⛔ chưa có khoá nào ⇒ **giữ nguyên 7 tab như hiện tại**) ② **THỜI ĐIỂM = SAU KHI S01 BUILD XONG** (⛔ không sửa FE bây giờ) ⇒ ⭐ mục §2 «phương án lùi» nay **ĐÃ CÓ ĐÁP ÁN**, ⛔ **không còn chờ** ✓
- **Nguồn yêu cầu:** `HANDOFF-20261009-A10/A11/A12` (S01) mục ⏳«4 VIỆC CÒN LẠI CỦA BẠN» ② ③ · `SHARED_STATE` CẬP NHẬT 81 (S01 quyết **B1**) · `CẬP NHẬT 84` mục 7 (của tôi)

---

## 0. ⛔ VÌ SAO CHƯA LÀM NGAY (đo được, ⛔ không phải trì hoãn)

| Số đo | Giá trị |
|---|---|
| `app/screens/WorkCenter.tsx` | **`RELEASED — mtime cuối 14:51:12`** (đã ghi `HANDOFF-A13` cho S01) |
| `dist/` (bản build FE) | vẫn **10-09 13:34:24** · `:8787` = PID **17980** (bật 13:34:41) ⇒ ⛔ **chưa rebuild FE** |
| Tiến trình S01 lúc đo | PID **1884** (14:53:28): `mvn test -pl web -am -Dtest=ProjectCrudMatrixRbacTest` → full Java test → `package` → **restart `:18081`** ⇒ ⭐ S01 **đang chạy chuỗi build** |
| ⚠️ Kết luận | ⛔ **KHÔNG chạm `app/**` lúc này**: sửa thêm ⇒ **mã mới hơn bản build** ⇒ lặp lại đúng lỗi `13:36:26` mà chính tôi đã ghi vào `EVENT_LOG`/`HANDOFF` ⇒ ⭐ **đợi S01 build xong rồi thi hành** |

---

## 1. HIỆN TRẠNG ĐO ĐƯỢC (⭐ nguồn sự thật = mã + danh mục, ⛔ không suy đoán)

| # | Hạng mục | Số đo | Kết luận |
|---|---|---|---|
| 1 | 6 khoá tab + `work_others` trong `ModuleKey` | ✅ `lib/ui-shared.tsx:25` có đủ **7** (`work_dashboard`·`work_list`·`work_department`·`work_assign`·`work_project`·`work_reports`·`work_others`) | ✅ **có** (S01 thêm 14:44:59 — đã gỡ `tsc` đỏ) |
| 2 | **Nhãn** cho 7 khoá đó | ✅ `app/page.tsx:138-143` (6 nhãn `Công việc — …`) + `:149` (`work_others` = «Việc của NGƯỜI KHÁC (xem · sửa · duyệt)») | ✅ **có** (thuộc S01) |
| 3 | **Danh mục CSDL** (`module_catalog`) cho 6 khoá | ✅ S01 **đã cấp** (có script hoàn nguyên: `docs/dsh-mutil-session/SESSION_A/probes/rollback-work-grant-20261009.sql` — `module_key IN ('work_dashboard', … ,'work_reports')`) | ✅ **có** |
| 4 | **Dòng ma trận** trong `lib/menu-helpers.ts` cho 6 khoá `work_*` | 🔴 **⛔ KHÔNG có**: grep `work_dashboard\|work_list\|…\|work_reports` trong `menu-helpers.ts` = **chỉ 2 dòng CHÚ THÍCH** (`:134`·`:259`), ⛔ **0 dòng khai** | ⏳ **còn thiếu** |
| 5 | **Dải tab** `WORK_TABS` đọc 6 khoá | 🔴 **⛔ CHƯA**: `WORK_TABS` là **mảng nhãn tĩnh** + `WORK_TABS_HIDDEN = ["Được giao"]` (ẩn CỨNG 1 tab) ⇒ ⛔ **không** hề đọc khoá quyền nào | ⏳ **còn thiếu** |
| 6 | `work_others` có tác dụng gì ở FE? | 🔴 **⛔ CHƯA gate gì**: W2 «Theo người» hiện dựa **PHẠM VI MÁY CHỦ** (payload) — ⚠️ **⛔ chưa** đọc khoá `work_others` | ⏳ **cần quyết** |
| 7 | Ẩn 4 khoá CŨ khỏi ma trận | ✅ **ĐÃ XONG** (`CHG-D20`: `MATRIX_HIDDEN_MODULE_KEYS` = 4 khoá cũ, lọc ở tầng VẼ) | ✅ **xong** |
| 8 | Mục menu «Công việc» vẫn dùng khoá nào | ⚠️ `menu-helpers.ts:150-153` `work_hub.permissionKeys` = **hợp các khoá CŨ** (+`work`?) | ⏳ xem mục 3.1 |

---

## 2. VIỆC W4 — **DẢI TAB `WorkCenter` ĐỌC 6 KHOÁ `work_*`** (tệp của tôi: `app/screens/WorkCenter.tsx`)

**Ý định (⭐ khớp «Mô hình B» S01 đã đặt nhãn):** mỗi tab ánh xạ **1 khoá quyền**, ai ⛔ không được cấp thì **⛔ không thấy nút tab đó** (⛔ không để mở ra rồi trắng màn).

| Tab (`WORK_TABS[i]`) | Khoá đề xuất | Ghi chú |
|---|---|---|
| 0 «Dashboard» | `work_dashboard` | |
| 1 «Danh sách công việc» | `work_list` | ⚠️ **tab MẶC ĐỊNH** — cần luật khi người dùng ⛔ không có khoá nào |
| 2 «Được giao» | (đang ẩn cứng) | ⚠️ **giữ nguyên** — ⛔ không bỏ `WORK_TABS_HIDDEN` (5 test `t05`/`t13`/`t01` đang khoá) |
| 3 «Phòng ban/ Tổ đội» | `work_department` | |
| 4 «Giao việc» | `work_assign` | |
| 5 «Dự án» | `work_project` | |
| 6 «Báo cáo» | `work_reports` | |

**⭐ RÀNG BUỘC PHẢI GIỮ (⚠️ nếu ⛔ không sẽ tự làm đỏ 5 tệp test):**
1. ⛔ **KHÔNG xoá phần tử** khỏi `WORK_TABS` — nội dung tab chọn theo **CHỈ SỐ** (`tab === i`) ⇒ xoá ⇒ **lệch chỉ số** (bẫy im lặng đã ghi ở `WorkCenter.tsx:97-101`).
2. ⛔ **KHÔNG** thay `WORK_TABS_HIDDEN` ⇒ `t13-D` khoá `WORK_TABS_HIDDEN = ["Được giao"]` + `WORK_TABS` **đủ 7** + `WORK_TABS[2] === "Được giao"`.
3. `WORK_TAB_OF_VIEW` giữ nguyên **ánh xạ chỉ số**; ⚠️ nếu tab đến từ menu bị **ẩn vì thiếu quyền** ⇒ phải có **chốt rơi về** «Danh sách công việc» (⭐ đúng khuôn đã có cho tab ẩn cứng, `t13-D ③`).
4. ⛔ **KHÔNG dùng** `work_others` để ẩn/hiện tab (nó là khoá **dữ liệu người khác**, ⛔ không phải tab).
5. ⚠️ **Cấp ban đầu = 0** (ràng buộc §5.3) ⇒ ⭐ **hệ quả PHẢI chốt với user**: nếu admin ⛔ chưa tick 6 khoá mới thì người dùng **⛔ mất hết tab** ⇒ 🔴 **CẦN PHƯƠNG ÁN LÙI** (đề xuất: coi «có **bất kỳ** khoá `work*`/`work` nào» là điều kiện mở nhóm, còn ẩn/hiện **từng** tab chỉ khi tài khoản **có ít nhất 1 khoá `work_*`**) — ⚠️ **đây là QUYẾT ĐỊNH nghiệp vụ ⇒ PHẢI HỎI USER, ⛔ không tự chọn** (luật `DEC-*` + bài học 2 lần suy diễn sai ở `KE-HOACH-PHAN-QUYEN` §5b/§5c).

**Test phải thêm/sửa (tệp của tôi):** `t13` (mục `F`): ① bảng ánh xạ tab↔khoá **tồn tại** ② `WORK_TABS` vẫn **đủ 7** + `WORK_TABS_HIDDEN` ⛔ không đổi ③ nút tab **lọc theo khoá** ④ **chốt rơi về** khi tab bị ẩn vì quyền ⑤ **đối chứng âm**: tài khoản **⛔ không có khoá nào** ⇒ ⛔ không thấy nút tab nào (và ⛔ không trắng màn theo luật lùi đã chốt).

## 3. VIỆC W5 — **MA TRẬN: 6 DÒNG TAB + `work_others`** (⚠️ phần lớn **thuộc S01** — ⛔ tôi không tự chiếm)

### 3.1 Cần chốt với S01 (2 câu, ⛔ không tự quyết)
| # | Câu hỏi | Vì sao |
|---|---|---|
| 1 | `work_hub.permissionKeys` (`menu-helpers.ts:150-153`) có **thêm 6 khoá `work_*` + `work_others`** ⛔ không? | ⚠️ Nếu ⛔ không thêm mà ma trận vẫn chỉ cấp 6 khoá mới (⛔ không cấp khoá CŨ) thì người dùng **MẤT mục menu «Công việc»** (`app/page.tsx` lọc `permissionKeys.find(...canView)`) ⇒ 🔴 **lỗi im lặng** đúng lớp `D1` |
| 2 | 6 dòng `work_*` có cần **dòng ma trận** ở `menu-helpers.ts` (nhóm `my_work`) hay **đủ** vì đã có trong `module_catalog`? | ⭐ `SHARED_STATE` CẬP NHẬT 79 mục 2: `permissionMatrixKeys` = **`moduleCatalog` (active) ∪ khoá dòng ma trận** ⇒ nếu catalog đã có 6 khoá thì ma trận **có thể đã vẽ được** ⇒ ⛔ **đừng thêm dòng thừa** (⚠️ `docs/61` đã gặp: `kpi_summary` **trùng** vì đã có trong catalog) |

### 3.2 Nếu chốt là **cần dòng** (việc của tôi — `lib/menu-helpers.ts`, tệp LOCK của tôi)
- Thêm **6 dòng** (nhóm `my_work`) theo **đúng khuôn** dòng `work`/`project_admin` (`:47`, `:51`): `{ key, label, icon, groupKey: "my_work" }` + ⭐ **KHÔNG** thêm vào `legacyWorkMenuKeys` ⇒ ⛔ không thành mục menu (menu đã có `work_hub`) ✓
- ⛔ **KHÔNG** đụng `permissionKeys` của `work_hub` khi chưa có **xác nhận của S01** (⚠️ họ vừa sửa vùng đó; ⛔ tránh chồng lấn như lỗi `13:36:26`).
- Test: `t13` (mục `G`) ① 7 khoá có **dòng hoặc** trong danh mục ② 4 khoá cũ **vẫn ẩn** khỏi ma trận ③ ⛔ **không mất quyền**: `permissionMatrixKeys` ⛔ không giảm số khoá (⚠️ `v214` đã có **VỆ 8** cho việc này — ⛔ đừng làm yếu nó).

## 4. THỨ TỰ THI HÀNH ĐỀ NGHỊ (sau khi S01 build xong + trả lời 3.1)
1. S01 build xong ⇒ tôi **đo lại** `dist/` + `:8787` (⛔ chỉ tin số đo mới — luật §24) + xác nhận W2/W3 **đã hiện trên UI**.
2. **Chốt 3 câu hỏi** (mục 2 §5 «phương án lùi» + mục 3.1 ×2) ⇒ ⛔ **không tự quyết** (đã 2 lần suy diễn sai).
3. W4 (dải tab) → `tsc` + `eslint` + `t13` → **hồi quy đầy đủ** (⛔ không kết luận `FIXED` nếu FAIL ≠ 0).
4. W5 (ma trận) **chỉ khi** S01 xác nhận ⇒ sửa **nhỏ, 1 dòng/lần** + ghi `SHARED_STATE`.
5. Ghi `CHANGE_LOG` · `TEST_LOG` · `HANDOFF` **kèm mtime mới** để S01/phiên khác đối chiếu `FILES` ✓

## 5. ⛔ RÀNG BUỘC GIỮ NGUYÊN
1. ⭐ **Phạm vi vẫn do MÁY CHỦ quyết** — giao diện chỉ **hiện/ẩn** (⛔ không nới quyền).
2. ⛔ **Không** để action nào «mù quyền» ⇒ 4 cổng `tools/*` **PHẢI exit 0** sau mỗi lượt sửa.
3. ⭐ **Cấp ban đầu = 0** ⇒ ⚠️ phải có **phương án lùi** cho người chưa được tick (mục 2 §5) — 🔴 **chờ user**.
4. ⛔ **Không** sửa `java-backend/**` · ⛔ **không** sửa `scripts/**` · ⛔ **không** thêm CSS mới (ngân sách CSS vượt trần).
5. ⭐ Mọi tuyên bố trạng thái phải kèm **phép đo**; ⛔ không kết luận `VERIFIED` nếu ⛔ chưa thấy trên **kênh phục vụ** (`:8787`).

---

## 6. 🔬 BỔ SUNG 09/10/2026 (≈15:05) — **ĐÃ ĐO RA NGUỒN DỰNG DÒNG MA TRẬN** ⇒ W5 CHÍNH XÁC HƠN KẾ HOẠCH BAN ĐẦU

### 6.1 ⭐ PHÁT HIỆN QUYẾT ĐỊNH (đọc mã, ⛔ không suy đoán)
```text
lib/workflow-helpers.ts:56   configuredModules() { return modules.map((item) => { …catalog.find(moduleKey === item.key)… }) }
                             ⇒ ⭐ DUYỆT `modules[]` (mảng CỨNG trong lib/menu-helpers.ts:32) rồi MỚI GHÉP nhãn từ `module_catalog`
                             ⇒ ⚠️ khoá có trong `module_catalog` mà ⛔ KHÔNG có trong `modules[]` = **KHÔNG được vẽ**
```
⇒ ✅ **KẾT LUẬN ĐO ĐƯỢC**: 7 khoá `work_dashboard` · `work_list` · `work_department` · `work_assign` · `work_project` · `work_reports` · `work_others` ⛔ **KHÔNG dựng được DÒNG ma trận** (chúng có trong `ModuleKey` · nhãn `app/page.tsx:138-149` · `module_catalog`, nhưng ⛔ **thiếu dòng `modules[]`**)
⇒ ⚠️ **CẢNH BÁO CHO MỌI PHIÊN**: «đã có trong `module_catalog`» ⛔ **KHÔNG** đồng nghĩa «đã hiện trên ma trận» ✓

### 6.1b ⭐⭐ CHỨNG MINH BẰNG **HÀM THẬT + PAYLOAD THẬT** (09/10/2026 15:10 · `node --import tsx`, ⛔ không cần BUILD)
| Phép đo | Kết quả |
|---|---|
| Đăng nhập + payload thật (`:9000`) | HTTP **200** · `moduleCatalog` = **85 dòng** |
| 7 khoá mới trong `module_catalog` | ✅ **ĐỦ 7/7 · `active=true`** · `groupKey='my_work'` · `sortOrder` **91→97** · nhãn «Công việc — Dashboard / Danh sách công việc / Phòng ban/Tổ đội / Giao việc / Dự án / Báo cáo» + «Việc của NGƯỜI KHÁC (xem · sửa · duyệt)» ✓ (**S01 đã làm xong phần danh mục**) |
| ⭐ **`configuredModules(data)` — HÀM THẬT của dự án** | **64 dòng** · ⛔ **KHÔNG có dòng nào** cho **7/7 khoá mới** ⇒ ⭐ **CHỨNG MINH W5 còn thiếu** (⛔ không phải suy luận) |
| Nhóm `my_work` **đang** được vẽ | **7 dòng**: `work` · `project_admin` · `dept_plan_tasks` · `dept_project_tasks` · `dept_plan_assign` · `dept_project_assign` · `approvals` ⇒ ⚠️ **SAU W5** kỳ vọng **14 dòng** (7 cũ + 7 mới), trong đó **4 khoá cũ ⛔ vẫn ẨN** ở tầng VẼ ⇒ hiển thị thực = **3 + 7 = 10 dòng** ✓ |
| ⚠️ Ghi chú phương pháp | Lần đo đầu **`login HTTP 502`** (S01 đang restart API `:18081`) ⇒ số liệu ⛔ **KHÔNG hợp lệ**; đã đo lại khi 3 cổng trả **200** ⇒ ⭐ **bài học: 502/5xx ⇒ BỎ số đo, ⛔ không kết luận** (đúng luật §16/§24) |

### 6.2 W5 — **7 DÒNG CẦN THÊM** vào `lib/menu-helpers.ts` `modules[]` (⭐ thi hành SAU build)
| `key` | `label` (nhãn THẬT sẽ lấy từ `module_catalog`, đây là dự phòng) | `icon` | `groupKey` | Ghi chú |
|---|---|---|---|---|
| `work_dashboard` | Công việc — Dashboard | `CV` | `my_work` | ⚠️ **KHÔNG** thêm vào `legacyWorkMenuKeys` ⇒ ⛔ không thành mục menu |
| `work_list` | Công việc — Danh sách công việc | `CV` | `my_work` | |
| `work_department` | Công việc — Phòng ban/ Tổ đội | `CV` | `my_work` | |
| `work_assign` | Công việc — Giao việc | `GV` | `my_work` | |
| `work_project` | Công việc — Dự án | `DA` | `my_work` | |
| `work_reports` | Công việc — Báo cáo | `BC` | `my_work` | |
| `work_others` | Việc của NGƯỜI KHÁC (xem · sửa · duyệt) | `CV` | `my_work` | ⭐ dòng S01 quyết ở **B1** |

**⚠️ BẪY PHẢI KIỂM NGAY SAU KHI THÊM**: ① `HUB_TAB_GROUP_KEYS` (`menu-helpers.ts:393`) chứa `"my_work"` ⛔ **KHÔNG**? — nếu **CÓ** thì `modules[]` thêm dòng ⚠️ **có thể sinh TAB/mục menu mới** ⇒ ⛔ phải kiểm `permissionMenuStructure` **TRƯỚC & SAU** (`my_work` đã bị **RÚT** ở VIỆC 1 ⇒ kỳ vọng ⛔ không sinh tab) ② `docs/61` từng gặp **`kpi_summary` TRÙNG** vì đã có trong catalog ⇒ ⛔ chỉ thêm **ĐÚNG 7 dòng**, ⛔ không thêm gì khác ③ `permissionMatrixKeys` = `moduleCatalog(active) ∪ dòng ma trận` ⇒ thêm dòng **⛔ không làm mất khoá nào** (⚠️ vẫn phải chạy `tests/v214` + probe «không mất quyền»)

### 6.3 CỔNG/PROBE PHẢI CẬP NHẬT **SAU** W5 (⚠️ kỳ vọng cũ nay SAI)
- `docs/dsh-mutil-session/SESSION_D/probes/verify-ma-tran-dong.mjs` §⑤ hiện kỳ vọng **«HIỆN đúng 1 dòng *Công việc (mọi phòng ban)*»** ⚠️ **ĐÃ CŨ** so với **Mô hình B** (6 khoá tab + `work_others`) ⇒ ⭐ phải sửa kỳ vọng thành: **8 dòng nhóm `my_work` = `work` + 6 khoá tab + `work_others`** · **4 dòng cũ VẪN ẨN** ✓
- 📏 **ĐO LẠI LÚC 15:05** (`verify-ma-tran-dong.mjs` **EXIT 0** — phần dữ liệu): `user_module_permissions` = **2968 dòng** (trước 2775 ⇒ **+193** do S01 cấp 6 khoá) · khoá `work` cấp theo **11 đơn vị** · đúng **3 tài khoản** `canApprove=1` · **11** mã đơn vị thật ⇒ ✅ **dữ liệu/backend ĐẠT**, ⏳ chỉ còn **GIAO DIỆN chờ BUILD** ✓

### 6.3b 🔎 RÀ TRƯỚC RỦI RO «THÊM 7 DÒNG ⇒ ĐỔI SỐ DÒNG MA TRẬN» (đo 15:16, ⛔ chưa sửa)
| Nơi có con số «75 dòng = 14 `admin_tab_NN` + 61 module» | Loại | Ảnh hưởng khi W5 |
|---|---|---|
| `tests/v214-phan-quyen-luu-quyen.test.mjs:227` | **KHẲNG ĐỊNH** `lost.length === 16` (16 khoá = 14 `admin_tab_NN` + `admin` + `reports`) | ✅ **KỲ VỌNG ⛔ KHÔNG ĐỔI**: `panelKeys` (từ `moduleCatalog` ∪ dòng ma trận) **đã chứa** 7 khoá mới; `menuModuleKeys` cũng tăng **cùng 7** ⇒ hiệu số `lost` **vẫn 16** ⚠️ **vẫn PHẢI chạy `v214` sau W5 để chứng minh** (⛔ không suy luận) |
| `tools/probe-grant-1-perm-e2e.mjs:298-300` | **CHUỖI `finding(...)` (văn xuôi)**, ⛔ không phải khẳng định | ✅ ⛔ không đỏ, ⚠️ chỉ **CŨ CHỮ** («75 dòng … 61 module») ⇒ ⭐ nên báo chủ tệp cập nhật câu chữ (⚠️ ⛔ không tự sửa nếu ⛔ không phải tệp của phiên 04) |
| `tools/probe-module-permission-data.mjs:6` | **CHÚ THÍCH** | ✅ ⛔ không ảnh hưởng |
| `app/page.tsx:2014-2074` | **CHÚ THÍCH** (chi phí lưu quyền «61 module ⇒ 11,7 phút») | ⚠️ ⛔ vẫn đúng về **module nghiệp vụ đang hoạt động**, ⚠️ nhưng **chi phí lưu** sẽ tăng nhẹ khi ma trận có thêm 7 dòng ⇒ ⭐ cần **đo lại thời gian lưu** sau W5 nếu muốn con số chính xác |
| `docs/dsh-mutil-session/SESSION_D/probes/verify-ma-tran-dong.mjs` §⑤ | **HƯỚNG DẪN in ra** (⛔ không khẳng định) | ⚠️ cập nhật nội dung (mục 6.3 trên) |

### 6.4 W4 — CHỐT LUẬT THEO **PHƯƠNG ÁN `A`** (USER đã quyết 09/10)
```text
NẾU tài khoản ĐÃ CÓ ≥1 khoá trong 6 khoá `work_*`  ⇒ ẩn/hiện TỪNG TAB theo khoá tương ứng
NẾU tài khoản ⛔ CHƯA CÓ khoá `work_*` nào        ⇒ GIỮ NGUYÊN 7 tab như hiện tại (⛔ không trắng màn)
Tài khoản `admin`                                  ⇒ thấy ĐỦ tab (modulePermission đã bao nhánh admin)
```
⚠️ Vẫn giữ nguyên **3 bất biến** của mục 2: ⛔ không xoá phần tử `WORK_TABS` · ⛔ không đổi `WORK_TABS_HIDDEN` · ⛔ không dùng `work_others` để ẩn tab ✓

---

## 7. ✅ THI HÀNH (09/10/2026 ≈15:16–15:20) — **W4 + W5 ĐÃ XONG** (sau khi S01 build xong `dist` 15:13:36)

| Việc | Kết quả ĐO ĐƯỢC |
|---|---|
| **W4** — dải tab đọc 6 khoá `work_*` | ✅ `app/screens/WorkCenter.tsx` **15:16:03** — khối `W4-PURE` (`WORK_TAB_KEYS` + `visibleWorkTabs`) + dải tab vẽ theo `tabsHien[i]` + tab khởi tạo xét quyền + «chốt rơi về» ⚠️ **`tab` là biến SUY RA** nên ⛔ không đụng 7 nhánh `tab === i` (⛔ không phá `t05`/`t14`) |
| **W5** — 7 dòng ma trận | ✅ `lib/menu-helpers.ts` **15:17:31** — 7 dòng vào `modules[]` (`my_work`) + **KHÔNG** vào `legacyWorkMenuKeys` · ➕ 6 khoá tab vào `work_hub.permissionKeys` (⚠️ ĐO trước: **0** tài khoản chỉ có khoá mới ⇒ no-op) |
| Test | ✅ `tests/t13` **+`F`** (W4: chạy THẬT `visibleWorkTabs` — 0 khoá ⇒ 7 tab · chỉ `work_list` ⇒ 1 · đủ 6 ⇒ 6 · ⛔ «Được giao» luôn ẩn; + bất biến `WORK_TAB_KEYS` khớp 1-1 `WORK_TABS`) **+`G`** (W5: đủ 7 dòng + ⛔ không vào legacy + cổng menu đủ 6 khoá) |
| Cổng | ✅ `tsc` 0 · `eslint` 0 · `t13` **21/21** · 4 cổng `tools/*` **exit 0** · `verify-ma-tran-dong` **exit 0** · hồi quy **972 · 971 pass · FAIL 0** |
| ⭐ Chứng minh W5 bằng HÀM THẬT | ✅ `configuredModules(payload thật)`: **7/7 khoá mới CÓ dòng** · nhóm `my_work` **7 → 14 dòng** · ⚠️ hiển thị thực **10** (14 − 4 khoá cũ vẫn ẩn) |
| Còn lại | ⏳ **1 lượt build FE NỮA** (`RELEASED` mới, `HANDOFF-A16`) · ⏳ cập nhật §⑤ `verify-ma-tran-dong.mjs` (kỳ vọng cũ) · ⏳ `work_others` chưa cưỡng chế (`A14`) |
