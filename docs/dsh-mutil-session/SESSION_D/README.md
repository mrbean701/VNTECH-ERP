# README — SESSION_D (ERP-SESSION-04)

```text
SESSION_ID : ERP-SESSION-04 (SESSION_D)
SCOPE      : docs/**  +  ⭐ (USER uỷ quyền B1+B2) app/screens/WorkCenter.tsx · lib/menu-helpers.ts · app/page.tsx · tests/**
STATUS     : 🟢 WORKING · bắt đầu 2026-10-08 · ⭐ ĐÃ THI HÀNH XONG **7/7 VIỆC «CÔNG VIỆC»** (xem mục «TRẠNG THÁI CUỐI» bên dưới)
LOCK       : docs/dsh-mutil-session/SESSION_D/**  ·  docs/37_*…docs/58_*  ·  app/screens/WorkCenter.tsx  ·  lib/menu-helpers.ts
KHÔNG GIỮ  : java-backend/**  ·  tools/**  ·  scripts/**  ·  app/globals.css  ·  drizzle/**  (thuộc S01/S02/S03)
⚠️ LƯU Ý  : README này TRƯỚC ĐÂY ghi «⛔ KHÔNG sửa mã sản phẩm» — **NAY ⛔ KHÔNG CÒN ĐÚNG**: từ 08/10/2026
            user uỷ quyền **B1+B2** ⇒ phiên này **ĐÃ SỬA MÃ SẢN PHẨM** (3 tệp + 9 tệp test) để thi hành 7 việc.
```

## ⭐ TRẠNG THÁI CUỐI (cập nhật vòng 61 · 08/10/2026) — ĐỌC MỤC NÀY TRƯỚC

```text
7/7 VIỆC «CÔNG VIỆC»: mã XONG · test XONG · ĐÃ LÊN BẢN CHẠY · 6/7 VERIFIED trên UI THẬT (2 ảnh)
Audit     : ĐỦ 7 TAB (1·2·3-dept·3-team·4·5·6 + Dashboard) — ⛔ không còn tab nào chưa soi
Cổng      : npx tsc --noEmit = 0 · tests/t13 = 6/6 PASS · hồi quy = 931 test · 930 pass · FAIL 0 · 1 skip ⭐ 0 LỖI
Bug của phiên: BUG-D05 FIXED · BUG-D09 FIXED · BUG-D10 FIXED   (BUG-D08 của phiên khác đã CLOSED)
ARTEFACT  : docs/58_BIEN_BAN_NGHIEM_THU_7_VIEC_CONG_VIEC_20261008.md  ← BIÊN BẢN NGHIỆM THU (đọc khi cần bàn giao)
⛔ commit/push: KHÔNG (AUTO_COMMIT=FALSE · AUTO_PUSH=FALSE — luật user)
⏳ CÒN 2 VIỆC CHỜ USER: ① build gộp MỘT LẦN khi mọi phiên dừng (đưa BUG-D09+D10 lên UI)
                        ② tài khoản nhân viên CÓ VIỆC (hoặc cho tạo việc thử) ⇒ kiểm nốt Ô NHẬP % (điểm VERIFIED cuối)
```

### Tệp mã ĐÃ SỬA (⚠️ phiên khác ĐỌC TRƯỚC KHI GHI)
| Tệp | Sửa gì |
|---|---|
| `app/screens/WorkCenter.tsx` | dải **7 tab** + 7 nhánh + tab «Được giao» riêng · **2 sub-tab** + «chế độ xem» Bảng/Kanban/Cây · **ô nhập %** + «Gửi kiểm tra»/«Duyệt xong»/«Yêu cầu làm lại» (**sửa `BUG-D05`**) · **modal «Tạo công việc»** · **modal chi tiết** + `onRowClick` + `stopPropagation` · **+ ô «Mô tả»** ở form giao việc (**sửa `BUG-D10`**) |
| `lib/menu-helpers.ts` | **1 MỤC HUB `work_hub`** (hợp **8 khoá quyền**) · **rút `"my_work"`** khỏi `HUB_TAB_GROUP_KEYS` |
| `app/page.tsx` | **3 đoạn nhỏ**: đảo 2 nhánh `workCenterViewFor` · `const title` → **`let title`** · **ghi đè tiêu đề «Công việc»** khi `workCenterView !== null` (**sửa `BUG-D09`**) |
| `tests/**` (9 tệp) | `t01`·`t05`·`t06`·`t07`·`t08`·`t09`·`p5-01`·`t10` cập nhật sang hợp đồng MỚI (⛔ không nới lỏng) · **`t13-work-progress-cell.test.mjs` MỚI (6 test)** |

### Sản phẩm bổ sung sau giai đoạn AUDIT (tiếp danh sách ở dưới)
| # | Tệp | Nội dung |
|---|---|---|
| 19 | `docs/55_TEST_SAN_DAN_CHO_7_VIEC_20261008.md` | 2 test TĨNH sẵn dán cho 7 việc |
| 20 | `docs/56_KICH_BAN_KIEM_THU_CONG_UAT_7_VIEC_20261008.md` | **KỊCH BẢN UAT** K1→K10 + 7 ca biên + bảng «dấu hiệu sai ⇒ tra tài liệu» |
| 21 | `docs/57_AUDIT_PHU_YEU_CAU_7_VIEC_20261008.md` | Audit phụ + §4.4 **mã port BE dán được** (việc «Nhận xét») |
| 22 | **`docs/58_BIEN_BAN_NGHIEM_THU_7_VIEC_CONG_VIEC_20261008.md`** | ⭐ **BIÊN BẢN NGHIỆM THU GO-LIVE**: §1 bảng 7/7 việc + bằng chứng · §2 số liệu chốt · §3 bằng chứng thô + ảnh · §4 việc còn lại CÓ CHỦ · §5 **5 bước UAT MỚI** · §6 lệnh tự kiểm · §7 cam kết phạm vi |
| — | `SESSION_D/uat-tab7-phongban-todoi.png` · `SESSION_D/uat-modal-tao-cong-viec.png` | **ẢNH BẰNG CHỨNG** UI thật (dùng được để nghiệm thu) |

### ⭐ BÀI HỌC VẬN HÀNH (⛔ đừng lặp lại)
1. **`gd-cycle` lỗi `EPERM` = KHÓA FILE Windows** (máy chủ đang mở `.local-data\warehouse.sqlite`) — ⛔ **không phải sandbox**. Cách đúng: xác định **ĐÚNG PID** (`scripts/local-server.mjs`) ⇒ dừng ⇒ chạy `gd-cycle` ⇒ ⚠️ **`gd-cycle` KHÔNG tự khởi động lại** ⇒ phải chạy lại `node scripts/local-server.mjs`.
2. ⚠️ **Mỗi lần `gd-cycle` SINH THÊM 1 migration identity** (đã sinh `0351`,`0352`) ⇒ **làm `BUG-D06` nặng thêm** ⇒ ⛔ **không chạy lẻ**, chỉ **gộp 1 lần khi mọi phiên dừng sửa** (`DEC-D15`).
3. ⚠️ **Heredoc PowerShell + tiếng Việt dễ VỠ** (từng làm 2 dòng log ⛔ không được ghi) ⇒ ⭐ **dùng tool `edit`** để ghi log, và **luôn kiểm lại tệp** sau khi ghi.
4. ⚠️ `browser_evaluate` dùng **cùng global context** ⇒ dùng **IIFE** tránh `SyntaxError: Identifier … has already been declared`.
5. ⚠️ Tài liệu ghi **số dòng cụ thể** của mã sẽ **cũ ngay** sau khi ai đó sửa (đó là gốc `BUG-D08`/`F-03`) ⇒ nên kiểm bằng **sự tồn tại của `case`**, ⛔ không bằng số dòng.


## Vì sao có phiên này
1. User yêu cầu **kế hoạch phát triển tiếp + báo cáo go-live tập trung chức năng lõi** (mua hàng · đơn hàng · quy trình mua · luồng duyệt đơn · phòng ban cho phân quyền workflow · quản lý dự án). Kế hoạch cũ `docs/09` lập 09/09/2026 khi hệ còn **monolith JS** ⇒ đã lỗi thời (nay là **Java backend + MySQL**).
2. User yêu cầu **audit lại 2 vùng JOBS và PROJECT trước khi giao việc**, dặn: ⛔ không commit/push · báo cáo thường xuyên qua Telegram · **ưu tiên FE → BE → DB**.

## Sản phẩm của phiên
| # | Tệp | Nội dung |
|---|---|---|
| 1 | `docs/37_KE_HOACH_GO_LIVE_VA_PHAT_TRIEN_LOI_MEP_20261008.md` | Kế hoạch go-live: mô tả hệ thống · 12 chức năng lõi sẵn sàng go-live · 4 vùng ⛔ không nên mở · kế hoạch GĐ0→GĐ4 · 7 đề xuất · 8 rủi ro · lộ trình tương lai |
| 2 | `docs/38_AUDIT_JOBS_PROJECT_20261008.md` | **Audit JOBS & PROJECT**: bản đồ menu→màn→action→RBAC→test · **11 phát hiện** (P-01…P-07 · J-01…J-03 · X-01/X-02) · bảng vùng LOCK · **8 việc sẵn sàng giao** (T-01…T-08) · 5 câu hỏi cho user |
| 3 | `docs/39_DINH_CHINH_AUDIT_TANG_CONG_QUYEN_20261008.md` | ⚠️ **ĐÍNH CHÍNH**: P-01/P-02 nêu **sai tầng nguyên nhân** (thật ra là `requireRequireAdmin` ở controller) · **bản đồ 2 tầng cổng quyền** · số liệu nền (65 rỗng · 10 public · 45 admin-gate) · 🆕 **P-08 — 12 action mồ côi THẬT** (danh mục vật tư · tổ đội · lịch trình duyệt) · kịch bản phép thử |
| 4 | `docs/40_XAC_MINH_LAI_PHAT_HIEN_JOBS_PROJECT_20261008.md` | ✅ **XÁC MINH LẠI** từng phát hiện: **bác P-01** (FE+BE cùng chặn ⇒ ⛔ **rút T-03**) · ✅ P-05 = **2 chỗ** (`page.tsx:1024`) · ⚠️ J-01 chưa đo được | 5 | `docs/41_MA_TRAN_QUYEN_GO_LIVE_20261008.md` | 🎯 **MA TRẬN QUYỀN GO-LIVE** (dùng để cấu hình phân quyền — GĐ A3/A4): bảng **action lõi × module/capability × tầng cổng × ai chạy (A/L/M)** cho **5 nhóm** (mua hàng · kho · tài chính · công việc/tổ đội · quản trị) · **3 bất nhất quán** đã định vị dòng · **tiền lệ vàng `update_user`** (MỐC 109) · gợi ý module cho **4 phòng** |
| 6 | `docs/42_SPEC_VA_P08_ACTION_MO_COI_QUYEN_20261008.md` | 📋 **SPEC SẴN SÀNG THI HÀNH vá P-08** (nhóm action mồ côi quyền): bảng quyết định **12 action mở + 6 action admin-only** · diff mẫu từng dòng · ⚠️ **phát hiện `List.of("admin")` vẫn là rỗng ⇒ vẫn 403** ⇒ cách đúng là **nhánh `ADMIN_ONLY_ACTIONS`** · 4 ca **cổng tĩnh** (⛔ không cần UI/DB) + 5 phép thử API (**đối chứng âm**) · rollback · DoD |
| 7 | `docs/43_RA_CHIEU_NGƯỢC_PUBLIC_ACTIONS_VA_CONG_TINH_20261008.md` | ✅ **RÀ CHIỀU NGƯỢC `PUBLIC_ACTIONS`** (chống **authorization bypass**): 10 action đã kiểm — **7/7 tự gác** `requireCurrentUser` + `cu.id()` · `setup` **chặn chạy lại 409** · `login` **lockout 429** ⇒ ⛔ **KHÔNG có bypass** · 📋 kèm **2 tệp test TĨNH HOÀN CHỈNH sẵn dán** (có **đối chứng âm**), ⛔ chạy **không cần** UI/DB |
| 8 | `docs/44_KIEM_DUONG_CAP_QUYEN_VA_SCRIPT_PHAN_LOAI_20261008.md` | ✅ **KIỂM 2 ĐƯỜNG CẤP QUYỀN** (lớp lỗi MỐC 109): **FE↔BE NHẤT QUÁN** — mọi đường cấp quyền **admin-only ở BE** và **FE ẩn nút** (chú thích sẵn trong `Inventory.tsx`) ⇒ ⛔ không có "nút chết" · ⭐ **CHỐT mô hình quyền: cấp quyền TẬP TRUNG ở admin** (trả lời GĐ A3/A4) · ⚠️ cảnh báo `save_user_access` = **FULL-REPLACE** (gửi thiếu ⇒ mất phạm vi) · 📋 **script `tools/rbac-classify-actions.mjs` hoàn chỉnh** (phân loại 65 action + tự chặn "cổng xanh rỗng") |
| 9 | `docs/45_BANG_TONG_HOP_GO_LIVE_20261008.md` | 🎯 **BẢNG TỔNG HỢP GO-LIVE — 1 TRANG**: **A** việc chặn · **B 7 quyết định** kèm **đề xuất + hệ quả** · **C** vùng đã kiểm SẠCH · **D** kế hoạch 8 bước **FE→BE→DB** (⛔ DB không cần migration) · **E** bằng chứng 8 tài liệu · **F** việc làm tiếp khi chưa có quyết định |
| 10 | `docs/46_F2_NO_CASE_VA_CHOT_18_ORPHAN_20261008.md` | ✅ **F2**: **`NO_CASE` = 0** (65/65 action registry đều có `case` thật) · ⭐ **CHỐT 18 ORPHAN chính xác theo dòng** ⇒ phân loại đủ 65 = **10 PUBLIC + 37 ADMIN_HARD + 18 ORPHAN** · **khớp 100%** với lịch sử `CHECKLIST` MỐC 110 §8 ⇒ **xác nhận `docs/42` đã đủ** (12+6=18) · giải thích được chênh lệch lịch sử (hoán đổi 1-1) |
| 11 | `docs/47_PATCH_PACK_VA_P08_20261008.md` | 📦 **PATCH PACK vá P-08 chính xác từng dòng** (dán là xong): **§A** 12 dòng module · **§B 9 dòng CAPABILITY** (⚠️ **phát hiện mới P-11**: `capabilityFor` mặc định `canUse` + 18/18 action đang `canUse` ⇒ ⛔ chỉ thêm module là **cấp quyền quá rộng**) · **§C** 6 action cấu hình → `ADMIN_ONLY_ACTIONS` · **§D** 2 khối mã `RbacService` · **§E** checklist 9 bước (cổng tĩnh 65→53) · **§F** đính chính `docs/42` · **§G** rollback |
| 12 | `docs/48_AUDIT_CLOSURE_20261008.md` | 🏁 **AUDIT CLOSURE**: bảng **đã-xong** (12 task · 12 tài liệu · 5 bug · **0 dòng mã sản phẩm**) · ⭐ **nguyên nhân gốc P-09 từ chính mã** (*Java chưa có helper `isDepartmentApprover("KH")`*) ⇒ B5 có **2 lựa chọn định lượng** · ⛔ **ràng buộc vân tay** (thêm tệp ⇒ phải `gd-cycle`) · §4 danh sách còn lại (đều cần USER) · **8 bài học Đ-04-01…08** |
| 13 | `docs/49_KE_HOACH_7_VIEC_CONG_VIEC_VA_AUDIT_TAB_PHONG_BAN_20261008.md` | 📋 **KẾ HOẠCH 7 VIỆC** khối «Công việc» (toạ độ dòng từng việc) + 🕵️ **AUDIT tab «Phòng ban»**: 4 khối, **3 khối là 3 cách nhìn CÙNG 1 tập việc** ⇒ trả lời câu «nhiều thông tin không hiểu tác dụng gì» + ⚠️ phần «hỗ trợ liên phòng» **chỉ XEM được** (action chưa cài ở Java) |
| 14 | `docs/50_TEST_IMPACT_VA_SPEC_PORT_BE_CONG_VIEC_20261008.md` | 🧪 **TEST-IMPACT**: **18 khẳng định** của 8 tệp test + 🔴 **6 tệp KHOÁ CỨNG** cấu trúc cũ · 📦 **SPEC PORT BE** cho nút «Nhận xét» + ⭐ **§2.4 guard `requireWorkItemAccess` ĐÚNG 5 NHÁNH** (bản đầu tôi ghi 3 ⇒ **đã tự sửa**) |
| 15 | `docs/51_RECIPE_VIEC_1_HUB_CONG_VIEC_20261008.md` | 🔧 **RECIPE VIỆC 1** (hub «Công việc») — **6 bước dán được** + 🔴 **BẪY `workCenterViewFor`** (kiểm `active` trước `view` ⇒ Dashboard ⛔ không mở) + tiền lệ **nhóm Kho đã gom 7→1** |
| 16 | `docs/52_RECIPE_VIEC_2_3_4_20261008.md` | 🔧 **RECIPE VIỆC 2·3·4**: search xuống + đổi tên · **nhập %** thay 4 nút preset (**kèm sửa `BUG-D05`**) · **modal «Tạo công việc»** · ✅ xác minh `send`/`action` |
| 17 | `docs/53_RECIPE_VIEC_7_VA_5_6_20261008.md` | 🔧 **RECIPE VIỆC 5·6·7**: modal chi tiết (**`.modal-head` + `aria-label="Đóng"`**) · tab «Được giao» (**dùng lại `personalGroups[1].rows`**) · «Phòng ban/ Tổ đội» 2 sub-tab · §5 **bảng kiểm CLASS CSS** (sửa class bịa `link-like`→`.link-cell`) |
| 18 | `docs/54_RUNBOOK_THI_HANH_7_VIEC_CONG_VIEC_20261008.md` | 📘 **RUNBOOK THI HÀNH**: §0 **4 điều kiện tiên quyết** + lệnh chuẩn mỗi lượt · §1 **7 lượt L1→L7** · **§1.1 BẢNG CHỈ SỐ TAB THEO 2 LAYOUT** · §2 Do/Verify/Rollback · §3 DoD · §4 5 nhánh đặc biệt |
| 19 | `docs/55_TEST_SAN_DAN_CHO_7_VIEC_20261008.md` | 🧪 **TEST SẴN DÁN** (`t11` tiến độ/duyệt có **ĐỐI CHỨNG ÂM** + `t12` khoá **dải 7 tab + bẫy `workCenterViewFor`**) · ⚠️ theo quy ước `tests/t08:11`: ⛔ **không thêm vào `package.json`** |
| 20 | `docs/56_KICH_BAN_KIEM_THU_CONG_UAT_7_VIEC_20261008.md` | 🧭 **KỊCH BẢN UAT THỦ CÔNG**: **K1→K10** (K2 bẫy điều hướng · K5 `BUG-D05` · K10 cổng Nhận xét) + **7 ca biên** + **bảng dấu hiệu SAI ⇒ tra đúng tài liệu** + mẫu ghi bằng chứng |

---

## ⭐ TRẠNG THÁI PHIÊN (cập nhật 08/10/2026 · sau 8 vòng)

```text
SESSION_ID    : ERP-SESSION-04 (SESSION_D)
SCOPE         : TÀI LIỆU / AUDIT (docs/**) — ⛔ 0 dòng mã sản phẩm
TASK          : D01→D10 (10 task, tất cả DONE ở mức tài liệu)
SẢN PHẨM      : docs/37 → docs/56 (**20 tài liệu**) + SESSION_D 9/9 log + APPEND 2 sổ đăng ký + SHARED_STATE (**CẬP NHẬT 24** §73′–76′ + **CẬP NHẬT 25** mục 77′–81′) + SHARED_TODO
PHÁT HIỆN     : 4 bug (D01/D02 RBAC dự án — đã đính chính tầng · D03 P-08 12 action mồ côi · D04 delete_supplier lệch) · 3 bất nhất quán · 1 việc RÚT (T-03)
ĐÃ KIỂM SẠCH  : chuỗi lõi (mua hàng 13 · kho 12 · tài chính 3) · PUBLIC_ACTIONS (10) · đường cấp quyền (7) · JOBS
BLOCKER       : 🚨 shell DSH hỏng 6 vòng (thiếu @deepseek-ai/dsh-scope) ⇒ ⛔ 0 phép thử runtime
CHỜ USER      : ① sửa **profile DSH** (`@deepseek-ai/dsh-scope`) ② chọn **(A)/(B)/(C)** + **3 xác nhận** (thứ tự 7 tab · Kanban/Cây · Nhận xét) ③ 7 quyết định `docs/45` §B (P-08 · PROJECT CRUD · luật L · cấp quyền · `delete_supplier` · tệp mồ côi · ẩn 22 màn)
STATUS        : READY_FOR_EXECUTE (bàn giao ĐỦ: kế hoạch · recipe · runbook · test · UAT) — ⛔ chưa sửa dòng mã nào, ⛔ chưa VERIFIED (chờ user/shell)
```

## Phát hiện đắt nhất (chi tiết ở `docs/38`)
- 🔴 **P-01**: `create_project` · `update_project` · `delete_project` · `bulk_import_projects` khai module **rỗng `List.of()`** ⇒ `RbacService` **ném 403** cho mọi tài khoản không phải admin/director/accountant ⇒ **nghẽn nghiệp vụ dự án**. (Thuộc nhóm «18 action mồ côi quyền» đã biết ở `CHECKLIST` MỐC 110 §8, **chưa được vá**.)
- 🟠 **P-02**: `set_project_status` module `admin` ⇒ **Ban lãnh đạo không đóng/mở được dự án**.
- 🟠 **P-05**: FE còn **ngày ISO thô** của dự án trong `app/page.tsx` (`HANDOFF-C14` còn `OPEN`).
- ✅ **JOBS** không nghẽn: 5 mục menu → `WorkCenter` 5 tab + `DepartmentTaskWorkspace`; 8 action backend **đủ module + capability**; lỗi cũ «Dashboard không render» **đã vá** (`page.tsx:452`).

## Ranh giới & luật tự ràng buộc
1. ⛔ KHÔNG sửa mã sản phẩm, ⛔ KHÔNG tạo migration, ⛔ KHÔNG build/khởi động lại dịch vụ (tránh giẫm S01/S02/S03).
2. Ghi tệp SHARED theo **READ → MODIFY CAREFULLY → PRESERVE OTHER SESSION DATA → WRITE → VERIFY** (chỉ **APPEND**).
3. ⛔ KHÔNG `git reset --hard` / `git clean -fd` · ⛔ KHÔNG commit/push (AUTO_COMMIT/PUSH = FALSE).
4. Số liệu phải **có nguồn + ngày**; phân định rõ **[ĐO]** (log phiên khác) vs **[ĐỌC MÃ]** (phiên này đọc).

## ⚠️ BLOCKER HẠ TẦNG (đã báo user)
Shell của harness hỏng trong phiên này:
`ERR_MODULE_NOT_FOUND: Cannot find package '@deepseek-ai/dsh-scope' imported from C:\Users\PC\.dsh\profiles\web\node_modules\@deepseek-ai\dsh-skill\lib\index.js`
⇒ ⛔ **không chạy được** `node`/`npm`/`git`/gate/UI. ⇒ Mọi số liệu cổng là **số của phiên khác, có ngày**; các phát hiện RBAC mới chỉ được **chứng minh bằng ĐỌC MÃ**, ⛔ chưa có phép thử runtime.

### 🔎 Chẩn đoán cụ thể (08/10/2026)
Đã liệt kê `C:\Users\PC\.dsh\profiles\web\node_modules\@deepseek-ai\` (**5.119 đường dẫn**) và grep tìm `dsh-scope` ⇒ **0 kết quả**.
⇒ Gói **`@deepseek-ai/dsh-scope` KHÔNG tồn tại** trong profile, trong khi `@deepseek-ai/dsh-skill/lib/index.js` **import nó** ⇒ mọi tiến trình `node` chết ngay khi nạp skill loader (⇒ shell của DSH cũng chết theo).
⇒ **Cách sửa (cần user làm, ⛔ phiên trong workspace không có quyền ghi ra ngoài)**: cài lại/khôi phục gói cho profile **`web`** (vd chạy lại bước cài plugin/skill của DSH, hoặc sao chép `@deepseek-ai/dsh-scope` từ profile khác nếu có). Sau khi sửa: chạy `node -v` để xác nhận shell sống lại **trước khi** tin bất kỳ số cổng nào.
