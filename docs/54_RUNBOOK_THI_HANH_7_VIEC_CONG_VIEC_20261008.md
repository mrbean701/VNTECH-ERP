# 🔧 RUNBOOK THI HÀNH 7 VIỆC KHỐI «CÔNG VIỆC» — bản dùng để LÀM (không phải để đọc)

Người soạn: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026**
Nguồn: `docs/49` (kế hoạch) · `docs/50` (test-impact + spec port BE) · `docs/51` (việc 1) · `docs/52` (việc 2·3·4) · `docs/53` (việc 5·6·7)
⚠️ **Runbook này ⛔ chưa được thi hành** — mọi dòng mã dưới đây là **ĐỀ XUẤT đã kiểm toạ độ**, ⛔ **chưa** vào sản phẩm.

---

## 0. ĐIỀU KIỆN TIÊN QUYẾT (⛔ không bắt đầu nếu thiếu)

| # | Điều kiện | Cách kiểm | Nếu ⛔ chưa có |
|---|---|---|---|
| **P1** | **Shell DSH sống** | `node -v` in ra phiên bản (⛔ không có `ERR_MODULE_NOT_FOUND`) | ⛔ **KHÔNG sửa mã**: sửa mã ⇒ đổi **vân tay** ⇒ buộc `gd-cycle` ⇒ **cổng build cả cụm đỏ** |
| **P2** | **Uỷ quyền phạm vi** | User xác nhận cho nhận tệp | 3 việc **2·3·4** (+ 5·6·7 phần FE) chỉ cần **`app/screens/WorkCenter.tsx`**; **việc 1** cần thêm **`lib/menu-helpers.ts`** + **`app/page.tsx`** |
| **P3** | **Trạng thái sạch** | `git status` — ⛔ **không** `git reset/checkout/clean` (luật §38) | Nếu có thay đổi lạ của phiên khác ⇒ **dừng, hỏi user** (⛔ không ghi đè) |
| **P4** | **User chốt 3 điểm** | thứ tự 7 tab · Kanban/Cây · Nhận xét (`docs/49` §6) | Việc 1 và 7 **phụ thuộc** ⇒ làm các việc khác trước |

**Lệnh chuẩn sau MỖI lượt** (⛔ không gộp nhiều việc 1 lượt):
```bash
npx tsc --noEmit
npm run test:regression        # ⭐ MỐC THAM CHIẾU ĐÚNG (đo lại 08/10 vòng 37): 921 test · 920 pass · 0 fail · 0 cancelled · 1 skip
node tools/gd-cycle.mjs "WORKCENTER <mô tả ngắn>"
node tools/verify-ui-build-applied.mjs   # ⭐ BẮT BUỘC TRƯỚC KHI BẮT ĐẦU (luật §16): phải thấy ✓ do-moi · ✓ van-tay · ✓ byte
```
⚠️ **ĐÍNH CHÍNH SỐ LIỆU CŨ**: mốc `865 test · 864 pass · 0 fail · 1 skip` (và vân tay `d826dd0b33dbb3cd`) trong bản cũ của tài liệu này là **LỖI THỜI** — ⛔ **đừng dùng để đối chiếu**; các phiên khác đã thêm test. Số đúng đo được ngày 08/10 (vòng 37, `TASK-20261008-D35`): **`921 · 920 · 0 · 1`** · vân tay **`VNTECH-FP-830756713F67CAFF`** (source 760 files) · `audit:tests` = 158 tệp/976 case (**7 tệp đỏ ĐÃ BIẾT & cố ý ngoài cổng — `KNOWN_RED`**).
🔴 **TRẠNG THÁI ĐO ĐƯỢC LÚC SOẠN (vòng 40)**: `verify-ui-build-applied` ⇒ **`✗ do-moi: dist/ CŨ HƠN nguồn 180s · nguồn mới nhất: app\page.tsx`** (dù `✓ van-tay` khớp SSOT và `✓ byte 6/6`) ⇒ **bản đang phục vụ ⛔ chưa gồm sửa mới nhất** ⇒ ⛔ **KHÔNG bắt đầu L1 khi cổng này còn ✗**; phải để **TẤT CẢ phiên dừng sửa** rồi `npm run build` + khởi động lại `:8787` (**⚠️ `:8787`/`:9000` là máy chủ DÙNG CHUNG — ⛔ đừng tự ý kill/khởi động; xem cảnh báo §4 của `SESSION_C`**).
⚠️ **Ghi chú kỹ thuật**: cổng này khi thoát có in `Assertion failed: … uv async.c` (**rác teardown của Node trên Windows**) — ⛔ đừng đọc dòng đó thành «cổng hỏng»; đọc **3 dấu ✓/✗** và dòng `KET LUAN`.

---

## 1. THỨ TỰ THI HÀNH (⚠️ **ĐÃ SỬA 08/10 — vòng 22**: tách «dải tab» khỏi «hub menu» vì **chỉ số tab** phụ thuộc nhau)

| Lượt | Việc | Tệp | Recipe | Test sửa |
|---|---|---|---|---|
| **L1** | **4** — modal «Tạo công việc» | `WorkCenter.tsx` | `docs/52` §4 | ⛔ không |
| **L2** | **2** — search xuống + đổi tên «Danh sách công việc» | `WorkCenter.tsx` | `docs/52` §2 | ⛔ không |
| **L3** | **3** — nhập % thay nút Thao tác + sửa **`BUG-D05`** + Dashboard hiện việc của tôi | `WorkCenter.tsx` | `docs/52` §3 | ⛔ không (+ **thêm** test cho `SUBMITTED`) |
| **L4** | **1a — DẢI TAB** (7 tab, Dashboard đầu) ⚠️ **PHẢI LÀM TRƯỚC L5/L6** | `WorkCenter.tsx` (**chỉ 1 tệp**) | `docs/51` §2 **Bước 4** | 🔴 **4 tệp**: `t01:98` · `t07:157` · `t08:144` · `t09:163` (+ `t09:165` alias `kpi`) |
| **L5** | **7** — «Phòng ban/ Tổ đội» + 2 sub-tab (nay ở **tab 3**) | `WorkCenter.tsx` | `docs/53` §2 | ⛔ không (⚠️ nếu bỏ hẳn Kanban/Cây ⇒ `t07`/`t09`) |
| **L6** | **5·6** — modal chi tiết + tab «Được giao» (**tab 2**) + nút gửi/duyệt | `WorkCenter.tsx` (+ **BE port** nếu làm phần nhận xét) | `docs/53` §3 + `docs/50` §2 | ⛔ không (+ **thêm** test cho luồng duyệt) |
| **L7** | **1b — HUB MENU** + sửa **bẫy `workCenterViewFor`** ⚠️ **RỦI RO NHẤT** | `menu-helpers.ts` · `page.tsx` (+ `WorkCenter.tsx` default `view`) | `docs/51` §2 **Bước 1-3, 5-6** | 🔴 `t01:24-28`·`t01:111` · `p5-01:25`·`p5-01:42` · `mt3-ui-25` (`REAL_SOURCES.my_work`) |

⭐ **VÌ SAO PHẢI TÁCH (lỗi tự bắt ở vòng 22)**: recipe việc 7 (`docs/53` §2) và việc 6 (`docs/53` §3.1) viết theo **chỉ số tab của layout 7 tab**; nếu chạy chúng **trước** khi đổi dải tab thì `{tab === 2}` là **«Phòng ban»** (layout cũ) và `{tab === 3}` là **«Giao việc»** ⇒ **chèn nhầm tab**.
⇒ ⭐ **Quy tắc**: **L4 (đổi dải tab) TRƯỚC L5/L6**; L7 (menu hub) vẫn **CUỐI** để 5 việc kia xong và xanh trước.

### 1.1 🔢 BẢNG CHỈ SỐ TAB THEO TỪNG LAYOUT (⛔ đọc trước khi sửa `{tab === n}`)
| Tab | **Layout CŨ** (hiện tại — `WorkCenter.tsx:92`) | **Layout MỚI** (sau **L4**) |
|---|---|---|
| Dashboard | 4 | **0** |
| Danh sách công việc (cũ «Cá nhân») | 0 | **1** |
| Được giao (**mới — việc 6**) | — | **2** |
| Phòng ban/ Tổ đội (cũ «Phòng ban») | 2 | **3** |
| Giao việc | 3 | **4** |
| Dự án | 1 | **5** |
| Báo cáo | 5 | **6** |

📌 **`WORK_TABS` (`:92`)** hiện là `["Cá nhân", "Dự án", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"]` · **`WORK_TAB_OF_VIEW` (`:96`)** hiện là
`const WORK_TAB_OF_VIEW: Record<WorkMenuView, number> = { personal: 0, department: 2, assign: 3, kpi: 4, dashboard: 4, reports: 5 };`
⇒ ✅ **Kiểu là `Record<WorkMenuView, number>`** ⇒ ⭐ **tab «Được giao» (việc 6) ⛔ KHÔNG cần thêm khoá `view`** (nó chỉ được mở bằng **bấm tab bar**, ⛔ không đi qua `activateModule`) ⇒ ⛔ **không phải sửa `WorkMenuView` trong `menu-helpers.ts`** (nhờ vậy **việc 6 vẫn chỉ 1 tệp**).

⚠️ **6 nhánh `{tab === n}` trong `WorkCenter.tsx`** (`:304`=0 · `:341`=1 · `:361`=2 · `:378`=3 · `:402`=4 · `:422`=5) **PHẢI đổi cùng lượt L4** — đây là **chỗ dễ sót nhất**.

### 1.2 🆕 **5 VIỆC NHỎ PHÁT SINH** (vòng 27–29 — audit **phủ yêu cầu** + đọc mã) — ⛔ **PHẢI gộp vào các lượt dưới đây**
📌 Nguồn: `docs/57` (**bảng 16 điểm yêu cầu**) · §2 **GAP-1** · §4.2/§4.4 **GAP-2**. ⭐ Nếu ⛔ **không** gộp thì yêu cầu của user ở **việc 5b** và **việc 6c** ⛔ **CHƯA thoả** dù 7 việc chính đã xong.

| # | Việc nhỏ | Gắn vào lượt | Chi tiết | Ước lượng |
|---|---|---|---|---|
| **①** | (FE) nút **「💬 Nhận xét」 theo TỪNG DÒNG** + cổng `COMMENTS_READY` | **L6** (việc 5·6) | `docs/53` **§3.4** — tái dùng **cùng** modal chi tiết, ⛔ không thêm modal | 15 phút |
| **②** | (FE) **`onRowClick`** ⇒ click **CẢ DÒNG** mở chi tiết | **L6** | `docs/53` §3.2 — `DataTable` **đã có** prop (`DataTable.tsx:45/53/116/118`), ⛔ không cần bấm vào mã việc | 10 phút |
| **③** | (FE) **`stopPropagation()`** ở ô nhập % và các nút trong dòng | **L6** | `docs/53` §3.2 ⚠️ nếu ⛔ không: vừa nhập % vừa mở modal | 10 phút |
| **④** | (BE) **thông báo cho NGƯỜI GIAO khi việc hoàn thành** | **L7** (hoặc ngay sau L6) | `docs/57` **§4.4** — ⚠️ **~15 DÒNG, ⛔ không phải 1 dòng**: phải **dựng map CAMELCASE** vì `queueTaskNotice` đọc camelCase còn `findWorkItem` trả **snake_case** (`sv()` ở `:806` là tra thẳng) **VÀ** câu chữ phải là *«Công việc **đã hoàn thành**»* ⛔ không phải mẫu *«Công việc mới»* | 45 phút |
| **⑤** | (CFG) luật `notification_configs` `code='TASK_COMPLETED'` (kênh `email`) | **bước cấu hình go-live** (sau L7) | `docs/57` §4.2 — ⚠️ `NotificationRule:14`: *«⛔ không phát thông báo khi ⛔ không có cấu hình nào khớp»* ⇒ **không có luật = ⛔ không có email**; bảng **gác `admin`** | 10 phút (admin) |

⚠️ **Test phải cập nhật khi làm ①②③④**: `docs/55` `t11` **thêm khẳng định** cho ① (nút Nhận xét per-dòng **nằm sau** cổng `COMMENTS_READY`) · ② (`onRowClick` **có mặt** trên `TaskTable`) · ③ (`stopPropagation` trong `ProgressCell`) · ④ (**không** dùng lại `queueTaskNotice` với map snake_case ⇒ kiểm mã có dựng map camelCase).
⚠️ **UAT phải thêm**: `docs/56` **K7-bis** (giao việc → nhân viên gửi kiểm tra → trưởng phòng duyệt ⇒ **xem chuông của TRƯỞNG PHÒNG** có tin ⛔? + xem bảng `notification_configs` ⛔?) — nguồn `docs/57` §2 GAP-2.

---

## 2. CHI TIẾT TỪNG LƯỢT (do / verify / rollback)

### L1 — việc 4: form tự tạo việc → **modal «Tạo công việc»**
- **Do**: `docs/52` §4 (4.1 xoá card form `:319-334` · 4.2 nút trong `actions` · 4.3 `const [selfOpen, setSelfOpen] = useState(false)` · 4.4 modal `overlay`+`modal`).
- **Verify**: mở tab đầu → bấm **«＋ Tạo công việc»** ⇒ modal hiện; gửi ⇒ item mới xuất hiện, modal đóng; ⛔ payload ⛔ không đổi (`create_self_work_item` + 6 trường).
- **Rollback**: `git checkout -- app/screens/WorkCenter.tsx` (⚠️ **chỉ tệp này**).

### L2 — việc 2: search xuống ngay trên danh sách
- **Do**: `docs/52` §2 (bỏ `search` khỏi `ListToolbar` đầu màn `:266-296`; thêm `ListToolbar` **có search** ở `:335-338`; đổi tiêu đề **«Danh sách công việc»**).
- **Verify**: search **⛔ không còn** ở đầu màn; ở tab đầu có ô tìm **ngay trên bảng**; gõ ⇒ bảng lọc đúng (`find()` đã lọc theo `q` sẵn).
- **Rollback**: như L1.

### L3 — việc 3: **nhập %** + sửa **`BUG-D05`** + Dashboard
- **Do**: `docs/52` §3.1 (`ProgressCell` ở **cấp module** + `canApproveRow`) · §3.2 (thêm `TaskTable` vào tab Dashboard).
- **Verify (⭐ có đối chứng âm)**:
  1. Người **được giao** bấm **«Gửi kiểm tra»** ⇒ 200, trạng thái `SUBMITTED` (**⛔ không** còn nút gửi `COMPLETED` cho nhân viên).
  2. **Trưởng phòng** cùng phòng ⇒ thấy **«Duyệt xong»** ⇒ 200 `COMPLETED`.
  3. Nhập `%` ngoài khoảng ⇒ bị kẹp `0..100`; nhập ⇒ 200 + thanh tiến độ đổi.
  4. ⛔ **Đối chứng âm**: nhân viên ⛔ **không** được thấy nút «Duyệt xong».
- **Rollback**: như L1.

### L4 — việc 7: «Phòng ban/ Tổ đội» 2 sub-tab
- **Do**: `docs/53` §2 (state `deptSub` + dải sub-tab + `TaskTable` theo sub đang chọn).
- **Verify**: 2 sub-tab có **bộ đếm**; đổi sub ⇒ bảng đổi đúng tập (`deptWork`/`teamWork`); ⛔ logic `T06` **không đổi** (test `t06` xanh).
- ⚠️ **Kanban/Cây**: giữ + ẩn/hiện bằng nút (**phương án A**) ⇒ ⛔ `t07`/`t09` xanh. Nếu user chọn **bỏ hẳn** ⇒ **phải sửa `t07:151-152` + `t09:158-159` cùng lượt**.

### L5 — việc 5·6: modal chi tiết + tab «Được giao»
- **Do**: `docs/53` §3 (tab «Được giao» dùng `personalGroups[1].rows`; nút mở chi tiết ở cột c1; modal; nút gửi/duyệt; ô nhận xét sau `COMMENTS_READY`).
- **Verify**: bấm mã việc ⇒ modal có nội dung/hạn/dòng thời gian/bình luận; nút «Hoàn thành (gửi kiểm tra)» ⇒ `SUBMITTED`; trưởng phòng ⇒ duyệt/làm lại (làm lại **bắt buộc lý do**).
- **Phần nhận xét**: ⛔ **chỉ bật** `COMMENTS_READY = true` **sau khi** port BE (`docs/50` §2: `case` + method + guard `requireWorkItemAccess`) và **test API 200/400**.
- **Rollback**: như L1 (+ `git checkout --` 2 tệp Java nếu đã port).

### L6 — việc 1: hub «Công việc» (⚠️ **6 bước**, làm CUỐI)
- **Do**: `docs/51` §2 theo đúng thứ tự 1→6: ① 1 mục `work_hub` (**hợp đủ 6 khoá quyền**) ② **rút `"my_work"`** khỏi `HUB_TAB_GROUP_KEYS` + sửa chú thích ③ ⛔ không đổi `legacyWorkMenuKeys` ④ dải tab + **6 nhánh `tab === n`** ⑤ ✅ `activateModule` (đã xác minh) ⑥ 🔴 **đảo 2 nhánh trong `workCenterViewFor`**.
- **Verify (⭐ phải làm đủ 4 ca)**:
  1. **Nhân viên chỉ có `dept_plan_tasks`** ⇒ bấm «Công việc» ⇒ **vào tab Dashboard** (⭐ ca bắt đúng bẫy §Bước 6).
  2. Nhân viên ⛔ không có quyền công việc nào ⇒ **⛔ không thấy mục** (⛔ không lỗi màn).
  3. Sidebar: nhóm «Công việc» có **1 mục con** (⛔ không hiện tên trùng lặp nếu kiểm §3.1).
  4. Tab «Báo cáo» + «Dự án» vẫn vào đúng màn.
- **Test sửa cùng lượt**: `t01:98` + `t01:24-28` + `t01:111` · `p5-01:25` + `:42` · `t07:157` · `t08:144` · `t09:163` + `:165` · `mt3-ui-25` (`REAL_SOURCES.my_work`) — ⛔ **không sửa test trước mã**.
- **Rollback**: 3 tệp (`git checkout -- app/page.tsx lib/menu-helpers.ts app/screens/WorkCenter.tsx`).

---

## 3. DEFINITION OF DONE (⛔ không gọi «xong» nếu thiếu)

```text
[ ] tsc --noEmit          : 0 lỗi
[ ] test:regression       : ⛔ không fail mới (so mốc ĐÚNG **921·920·0·1** — ⛔ mốc cũ `865·864·0·1` đã LỖI THỜI)
[ ] verify-ui-build-applied: ✓ do-moi (dist/ MỚI HƠN nguồn) · ✓ van-tay khớp SSOT · ✓ 6/6 byte trên :9000
[ ] gd-cycle              : đã chạy + vân tay đồng bộ
[ ] 4 ca kiểm của L6      : đạt (đặc biệt ca ① — bẫy Dashboard)
[ ] BUG-20261008-D05      : đã sửa + có test (nhân viên ⇒ SUBMITTED)
[ ] P-08 (nếu làm)        : ORPHAN = 0 + 5 phép thử API có ĐỐI CHỨNG ÂM
[ ] ảnh/khối bằng chứng   : theo mẫu `SESSION_C/README.md` (bảng ⭐ có dấu)
[ ] cập nhật `docs/41` (ma trận) + log SESSION thi hành + Telegram
[ ] ⛔ gọi FIXED chỉ khi mã+test xanh; ⛔ VERIFIED chỉ khi user/đo lại xác nhận
```

---

## 4. NHÁNH ĐẶC BIỆT

| Tình huống | Cách xử |
|---|---|
| **Shell còn hỏng** (P1 ⛔) | ⛔ **không sửa mã nguồn**. Việc còn làm được: `docs/**` + chuẩn bị test (⛔ **không** tạo tệp mới trong `tests/` vì thêm tệp ⇒ buộc `gd-cycle`) |
| **Chỉ được cấp 1 tệp** (`WorkCenter.tsx`) | Làm **L1→L5** (5 việc), **hoãn L6** + hoãn phần BE nhận xét ⇒ vẫn đạt gần trọn yêu cầu user, ⛔ rủi ro test = 0 |
| **User chọn bỏ hẳn Kanban/Cây** | Làm L4 + **sửa `t07`/`t09`** cùng lượt (⛔ không để test đỏ) |
| **Muốn làm P-08 trước** | Dùng `docs/47` (patch pack) + `docs/50` §2 (nhận xét) — ⛔ **không** quên **capability** (P-11) |
| **Phiên khác đang giữ tệp** | ⛔ Dừng, ghi HANDOFF (`SESSION_D/HANDOFF_LOG.md`), chờ release — luật §7/§18 |

---

## 5. GHI CHÚ CHO PHIÊN THI HÀNH
- Đọc trước: `docs/49` §2 (toạ độ) → recipe tương ứng → **mở mã xác nhận lại dòng** (mã có thể đã đổi từ 08/10).
- ⭐ **Nguyên tắc vàng của bộ spec này**: mọi dòng `file:line` đều **đo được**, nhưng vẫn **phải đọc lại trước khi sửa** — bài học «state vs actual code» (§16).
- ⚠️ **Nhắc lại 3 bẫy đã bắt được** (⛔ đừng mắc lại): ① `workCenterViewFor` kiểm `active` trước `view` ② mục hub phải **hợp đủ khoá quyền** nếu không nhân viên **mất menu** ③ `add_work_item_comment` **đăng ký mà chưa cài** ⇒ 400.
