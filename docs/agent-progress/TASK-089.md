# TASK-089 — BA QUYẾT ĐỊNH CỦA NGƯỜI DÙNG (KP #88 · hover · KP #89) + DỌN MÃ CHẾT "4 NHÓM CON PHÒNG BAN"

**Ngày:** 18/09/2026 · **Nguồn:** người dùng trả lời 4 việc chờ duyệt đã gửi qua Telegram:
*«1 dàn lại bề rộng cột, 2 giữ hover, 3 dkhn sạch, báo cáo qua tele»*.
**Loại việc:** dọn mã chết + chốt ảnh chuẩn (KHÔNG đổi nghiệp vụ, KHÔNG đổi schema).
**Bản chạy:** `VNTECH-FP-A8E02745C0D5C528` → **`VNTECH-FP-75F9244DC60F2FAD`**.

---

## 1. Ba quyết định và cách thực thi

| # | Người dùng quyết | Cách thực thi | Bằng chứng |
|---|---|---|---|
| (1) | **KP #88** — *chấp nhận* bề rộng cột bị **dàn lại** khi bảng `<table>` trần chuyển sang `DataTable` | Chụp lại ảnh chuẩn (`probe-visual-regression.mjs --update`) ⇒ cổng ảnh hết đỏ | §4 dòng 6 |
| (2) | **hover** bảng "Phiếu đề nghị" — **giữ** | Không đụng tới; ghi lại là hành vi **có chủ đích** | §4 dòng 7 |
| (3) | **KP #89** — **dọn sạch** mã chết "4 nhóm con phòng ban" | Dọn mã JS + CSS + đảo cổng; thêm cổng chống tái phát | §2 · §3 · §4 |

> ⚠️ **Đính chính phạm vi:** trong tin nhắn Telegram em viết *"dọn = xoá nhánh + CSS `nav-subgroup*`"*. **Đo lại thì KHÔNG được xoá cả họ `nav-subgroup*`**: các lớp `.nav-subgroup`, `.nav-subgroup-toggle`, `.nav-subgroup-title`, `.nav-subgroup-items`, `.dept-chevron`, `.mobile-nav-subgroup*` **vẫn sống** — chúng đang vẽ **cây THU GỘP / cây workspace theo dự án**. Chỉ các **biến thể nhóm con phòng ban** (`-plan`, `-project`, `-finance`, `-legal`, `.nav-child-dept-*`, `[data-nav-group="department_management"]`, `.mobile-nav-expanded`) mới chết. Nếu xoá cả họ thì đã phá giao diện menu đang chạy.

---

## 2. Tiền đề — đo LẠI, không tin ghi chú cũ

Cổng `tools/probe-kp89-dead-dept-branch.mjs` đọc **3 nguồn nhóm menu** thật:

| Nguồn | Số nhóm | Có `department_management`? | 37 module phòng ban trỏ vào |
|---|---|---|---|
| MySQL `menu_group_catalog` (đường phục vụ Java) | **12** | **KHÔNG** | 6 nhóm THẬT |
| SQLite `menu_group_catalog` (đường Node) | **12** | **KHÔNG** | 6 nhóm THẬT |
| Fallback trong mã `defaultMenuGroups` | **12** | **KHÔNG** | — |

`module_catalog`: **37** dòng `dept_*` ở **cả hai** CSDL, **0** dòng có `group_key='department_management'` —
phân bổ đúng 6 nhóm thật: purchasing 8 · mep 8 · finance 7 · hr_legal 6 · reports 4 · my_work 4.

⇒ Hàm dựng menu (`configuredMenuGroups`) chỉ ghép từ 3 nguồn trên ⇒ **không nhóm nào có khoá
`department_management`** ⇒ hai chuỗi tam phân `groupKey === "department_management" ? … : …`
(desktop + mobile) và nhánh trong `permissionMenuStructure` **không thể chạy** trên bất kỳ đường dữ liệu nào.

**Bẫy đã gặp khi đo:** lượt đo SQLite đầu tiên in *"QUẢN LÝ PHÒNG BAN = 37"* và em suýt kết luận
*"SQLite giữ TÊN nhóm trong cột `group_key`"* — thực ra **script đo của em tự chọn nhầm cột** (`group_name`
khớp mẫu trước `group_key`). Sửa script rồi đo lại: SQLite giữ **khoá** đúng như MySQL. *Ghi vào bài học §6.*

---

## 3. Phạm vi đã dọn + số đo

### 3.1. `app/page.tsx` — 3436 → **3415 dòng** (694.094 → 687.648 byte)

| Hạng mục | Chi tiết |
|---|---|
| Nhánh render **desktop** | gỡ **1.545 ký tự** (4 nhóm con `data-dept` plan/project/finance/legal) |
| Nhánh render **mobile** | gỡ **1.200 ký tự** |
| `permissionMenuStructure` | gỡ nhánh nhóm con — **857 ký tự** (nhánh `else` giữ nguyên văn) |
| Effect đồng bộ khi điều hướng từ màn con | gỡ **509 ký tự** (cả dòng `eslint-disable` đi kèm — nếu để lại thì eslint báo *"Unused eslint-disable directive"*) |
| State + lưu trữ | gỡ `openDeptSubgroups`, `mobileDepartmentExpanded`, `deptMenuStorageKey`, `mobileDepartmentStorageKey`, `toggleDeptSubgroup` |
| Luật đặc cách | `directChild` bỏ ngoại lệ dept · `opened` dùng luật chung · `onClick` nhóm mobile dùng `toggleGroup` |
| 37 literal | `groupKey: "department_management"` → **KHOÁ NHÓM THẬT lấy từ CSDL** (script đọc MySQL, không gõ tay; từ chối ghi nếu thiếu 1 khoá) |

### 3.2. `lib/ui-shared.tsx`

* Bỏ **6 khoá** trong `NAV_ICON_TYPE` / `NAV_ICON_TONE`: `department_management` + 4 tên phòng ban
  (`"phòng kế hoạch"`, `"phòng dự án"`, `"tài chính kế toán"`, `"hành chính pháp chế"`) — chỉ nhánh chết tra các khoá này.
* Sửa chú thích menu (bỏ viết tắt khoá cũ).

### 3.3. `app/globals.css` — 400.643 → **388.282 byte** · `!important` 4950 → **4849** · 2725 → **2645 dòng**

* Xoá **106 rule** + bỏ **19 selector** trong các rule trộn (**−12.361 byte**, **−101 `!important`**).
* Gồm 2 nguồn: (a) biến thể nhóm con phòng ban (KP #89); (b) **9 lớp chết tồn dư** mà **cổng CSS phát hiện**
  (`admin-overview-grid`, `admin-search`, `approved-module-head`, `delivery-timeline`, `inventory-approved-filter`,
  `request-filter-grid`, `staff-directory-head`, `staff-toolbar`, `supply-timeline`) — di chứng của `U-09`/`TASK-076`
  khi markup chuyển sang `ListToolbar`/`ActivityTimeline`.
* **Cổng nền R1.1.1 KHÔNG bị nới:** `!important` và dung lượng chỉ **giảm**, mốc BEGIN/END còn đúng 1 cặp,
  không có `@media` rỗng, không có nội dung sau mốc END.

### 3.4. Cổng bị ĐẢO (mạnh hơn, không nới lỏng)

`scripts/css-baseline-audit.mjs`:

1. **Phạm vi đọc: `app/` → HỢP NHẤT `app/` + `lib/`.** Cổng này **ĐANG ĐỎ trước khi em sửa**:
   `KHÔNG ĐẠT · dead CSS classes remain: …` **26 lớp** — vì `U-11` đã chuyển component dùng chung sang
   `lib/ui-shared.tsx` (`attachment-*`, `kpi-*`, `nav-glyph*`…) mà cổng chỉ quét `app/`. Đây **đúng cùng lớp
   lỗi KP #94** (test/preflight đọc cứng `app/page.tsx`) và vá theo cùng cách: đổi **phạm vi ĐỌC**, giữ **nguyên phép kiểm**.
2. **Đảo 2 phép kiểm cũ:** trước đây cổng **ĐÒI** có `.nav-subgroup-plan|project|finance|legal` và
   `.nav-child-dept-*`; nay cổng **CẤM** chúng quay lại (kèm `[data-nav-group="department_management"]`
   và `.mobile-nav-expanded`).

### 3.5. Cổng MỚI `tools/probe-kp89-dead-dept-branch.mjs` — **25/25 ĐẠT**

3 tầng: **(A) tiền đề** đọc 2 CSDL + fallback; **(B) đối chứng** dương (≥10 nhóm, ≥30 module mỗi CSDL) và
**âm** (bộ dò PHẢI phát hiện được mẫu cố ý, và PHẢI coi chuỗi sạch là sạch); **(C) đo đóng** (0 dấu vết ở
nguồn + CSS, cổng CSS cấm tái phát, và **chống xoá quá tay**: 2 nhánh còn sống, `subGroup` sống, 37 literal).

---

## 4. Bằng chứng kiểm chứng

| Phép kiểm | Kết quả |
|---|---|
| Cổng mới `probe-kp89-dead-dept-branch.mjs` | **25/25 ĐẠT** (tiền đề + đối chứng dương/âm + đo đóng) |
| `npx tsc --noEmit` | **EXIT 0** |
| `npx eslint app/page.tsx lib/ui-shared.tsx` | **0 error** · 80 warning (đúng nền cũ: page 78 + ui-shared 2) |
| `npm run verify:css-baseline` | **ĐẠT** · 2645 dòng · 388.282 byte · 4849 `!important` · **dead classes=0** · dead vars=0 · dynamic contracts=PASS · empty media=0 · historical markers=0 — *(trước khi sửa: **KHÔNG ĐẠT**, 26 lớp chết oan)* |
| `npm run verify:master-baseline` | **ĐẠT** · `!important=4849` · `css=388282B` |
| `npm run build` | **EXIT 0** + **BUILT ARTIFACT VALIDATION: ĐẠT** |
| `npm run test:regression` | **59/61 — ĐÚNG NỀN** (2 đỏ đã biết: TASK-032 `thuky` + KP #96 sentinel site_command) |
| **Cổng ảnh TRƯỚC/SAU** (`tools/so-sanh-cong-anh.mjs`) | **TẬP ẢNH LỆCH KHÔNG ĐỔI** ⇒ dọn mã chết **không gây lệch hình nào**. Trước **27/56** · sau **27/56**, danh sách y hệt: 01-dashboard 4 · 03-work 4 · 04-team 2 · 05-material 4 · 06-warehouse 4 · 07-admin 1 (19 ảnh do **đổi dữ liệu** KP #86) + 09-dept-assign-kh 4 · 10-dept-assign-da 4 (8 ảnh **chờ quyết định KP #88**) |
| **(1) Chốt ảnh chuẩn** `--update` | ghi lại **56 ảnh** ⇒ cổng ảnh hết đỏ (chấp nhận cả 19 ảnh dữ liệu có chủ đích + 8 ảnh 2 màn phòng ban) |
| **(2) hover** | **giữ** — không có thay đổi nào chạm tới bảng Phiếu đề nghị |
| Định danh bản chạy | MySQL + SQLite + manifest + build đều **`VNTECH-FP-75F9244DC60F2FAD`**; UI `:8787` **200** · proxy `:9000` **200** · Java `:18081` **200** · bundle phục vụ `page-BmUwcrHj.js` (bản build mới) |

**Cách chứng minh "không lệch hình":** `tools/so-sanh-cong-anh.mjs` so **TẬP ẢNH LỆCH** (màn × kích thước)
giữa 2 lần chạy cổng ảnh, **bỏ** ghi chú nhiễu `(lần đầu N px)` — đúng bài học KP #1.
*(Lỗi đã gặp: bản đầu của công cụ đọc log bằng UTF-8 trong khi PowerShell ghi log bằng `*>` = UTF-16LE
⇒ in ra "0 ảnh lệch / 0 màn" — con số VÔ NGHĨA. Đã vá: tự nhận dạng UTF-16/UTF-8.)*

---

## 5. Phát hiện kèm theo (ghi lại, KHÔNG tự ý xử lý)

| # | Phát hiện | Bằng chứng | Đề xuất |
|---|---|---|---|
| **KP #96** | **Cây "workspace theo dự án" (8 mục/dự án) KHÔNG render.** Hai nhánh render treo trên sentinel `groupKey==="__site_command_tree_disabled__"` — không nhóm nào có khoá này ⇒ **mã chết**. Kèm theo: `[data-nav-group="project_management"]` cũng không thể khớp (nhóm này bị `configuredMenuGroups` LỌC BỎ) và **1 test đỏ** của bộ hồi quy còn kỳ vọng cây này chạy | `tools/probe-modal-branch-coverage`-style đo chuỗi: sentinel có **2** chỗ, `activateProjectModule` chỉ được gọi từ 2 nhánh đó; sentinel xuất hiện từ commit `1c01f39` (16/09) | **CHỜ NGƯỜI DÙNG:** (a) bật lại cây workspace theo dự án, hay (b) dọn luôn cây đó + CSS `project-workspace-*` + sửa 2 test |
| **KP #97** | Cổng `verify:css-baseline` **đã đỏ từ trước** vòng này do `U-11` chuyển component sang `lib/` | §3.4 | **ĐÃ VÁ** (phạm vi đọc `app/`+`lib/`) — cần đưa cổng này vào chuỗi cổng bắt buộc mỗi vòng |
| — | 2 test đỏ **đã biết** được xác nhận lại: `FULL W2 migration chain` (tên vai trò `thuky` — chờ người dùng chốt 0045 vs 0079) · `Project management always expands to project workspace nodes` (KP #96) | `test:regression` 59/61 | chờ quyết định |

---

## 6. Bài học ghi vào sổ

1. **Công cụ dọn phải TỰ CHỐI — và nó đã cứu 2 sai lầm thật:**
   (a) `subGroup` **không phải mã chết** — cây PHÂN QUYỀN đang đọc để in nhãn *"nhóm › phòng ban"*;
   (b) `mobileDepartmentExpanded` **không hoàn toàn chết** — nó điều khiển lớp khung menu mobile
   (`.mobile-nav-root` / `.mobile-nav-expanded`). Lượt chạy khô **đầu tiên đã DỪNG, không ghi tệp**;
   chỉ sau khi kiểm CSS (2 lớp này nằm **cùng một nhóm selector** ⇒ trùng kiểu hoàn toàn) mới cố định lớp `root`.
2. **Một phép đo tự viết có thể in ra con số NGHE HỢP LÝ nhưng SAI** (bài học #21/#25 lặp lại lần thứ 4):
   script đo SQLite tự chọn nhầm cột `group_name` thay vì `group_key` ⇒ suýt kết luận sai về dữ liệu.
   *Quy tắc: khi script tự chọn cột/biến, phải in ra TÊN cột đã chọn.*
3. **"Dọn mã chết" bắt buộc dọn cả CSS — vì cổng CSS có phép kiểm "lớp chết".** Trước khi dọn, các selector
   chết được *cứu* bởi chính hai template literal trong nhánh chết (`nav-subgroup-${deptTone}` là "tiền tố động");
   xoá JS mà giữ CSS ⇒ **cổng HỎNG**. Đây là bằng chứng khách quan, không phải sở thích.
4. **Xoá CSS trong tệp ĐÓNG BĂNG phải làm theo RULE, không theo DÒNG:** công cụ bóc khối `{}`, phân loại
   selector chết/sống, xoá cả rule nếu toàn chết, chỉ bỏ selector chết trong rule trộn, và **xoá `@media` rỗng**
   sinh ra sau đó (nếu không, cổng nền chặn ngay).
5. **Khi một phép kiểm "ĐÒI sự tồn tại" của mã chết, hãy ĐẢO nó thành "CẤM quay lại"** — mạnh hơn phép kiểm cũ
   và không nới lỏng bộ kiểm thử (`mobile-menu-interaction.test.mjs`, `runtime-admin-boq-regression.test.mjs`).
6. **Log do PowerShell ghi bằng `*>` là UTF-16LE** — công cụ đọc bằng UTF-8 sẽ thấy rỗng và in "0 ảnh lệch".
   *Quy tắc: công cụ đọc log phải tự nhận dạng mã hoá.*

---

## 7. Việc kế tiếp

1. **KP #96** — chờ người dùng chọn (a) bật lại cây workspace theo dự án hay (b) dọn cây + sửa 2 test
   (làm chung với `[data-nav-group="project_management"]` chết cùng họ).
2. **`U-14`** — chuyển `drawer` chi tiết phiếu sang `EntityDetailModal` (công thức đã soạn ở `U14-U11-KHAO-SAT.md` §1.4).
3. **`U-11` bước 4** — 3 màn lớn còn lại: `WorkCenter` · `Requests` · `BoqControl`.
4. **`U-16`** — áp dụng `PermissionGuard` cho ~50 chỗ kiểm quyền rải rác.
5. **KP #90** — chờ người dùng xác nhận luồng 3 nút vật tư sau khi vá.
