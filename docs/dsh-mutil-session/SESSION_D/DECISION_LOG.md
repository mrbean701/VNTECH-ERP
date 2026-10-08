# DECISION_LOG — SESSION_D (ERP-SESSION-04)

## DEC-20261008-D01 — Phiên này là **audit read-only**, ⛔ không sửa mã sản phẩm
| | |
|---|---|
| **BỐI CẢNH** | User yêu cầu «audit lại phần JOBS và PROJECT **trước khi tôi giao việc**», đồng thời dặn **tránh conflict** và **ưu tiên FE → BE → DB** |
| **QUYẾT ĐỊNH** | Chỉ **đọc** mã + tài liệu; **ghi** `docs/37`, `docs/38`, `SESSION_D/**`. ⛔ Không sửa `app/**`, `lib/**`, `java-backend/**`, `tools/**`, `tests/**` |
| **LÝ DO** | 2 tệp chứa gần hết việc FE của JOBS/PROJECT (`app/page.tsx`, `lib/menu-helpers.ts`) **đang bị S01/S02 giữ** ⇒ sửa vào là vi phạm §7/§19 của Goal |
| **HỆ QUẢ** | Mọi việc sửa được giao qua bảng **T-01…T-08** (`docs/38` §5) + `HANDOFF-20261008-D01` |

## DEC-20261008-D02 — Dùng **SESSION_D** trong cấu trúc log sẵn có (⛔ không tạo hệ state thứ hai)
| | |
|---|---|
| **BỐI CẢNH** | Goal §4 nói rõ: repo **đã có** `docs/dsh-state/**` + `docs/dsh-mutil-session/**` ⇒ phải **dùng luôn** |
| **QUYẾT ĐỊNH** | Tạo phiên **mới** `ERP-SESSION-04` = thư mục `SESSION_D/` (9 loại log + README) **theo đúng khuôn 3 phiên trước**; đăng ký vào 2 sổ chung bằng **APPEND** (⛔ không ghi đè) |
| **LÝ DO** | Tránh giẫm log của S01/S02/S03; giữ nguyên tắc «mỗi session 1 thư mục» của Goal §3 |

## DEC-20261008-D03 — ⛔ KHÔNG dùng 4 cổng probe làm bằng chứng
| | |
|---|---|
| **BỐI CẢNH** | `SHARED_STATE` §33/§40 ghi: `probe-responsive-5widths` **xanh rỗng** (chưa từng đo mà vẫn kết luận ĐẠT) · `probe-toolbar-vertical` **8 báo động giả** · `probe-task075` D2 **đỏ oan** · `probe-action-registry-coverage` **6 "mù quyền" là giả** |
| **QUYẾT ĐỊNH** | Audit này **chỉ dùng**: (a) **mã đang chạy**, (b) test hợp đồng `tests/*.test.mjs`, (c) log có **ngày + phép đo**. ⛔ Không trích 4 cổng trên |
| **LÝ DO** | §16 Goal: nguồn sự thật = actual code; §31: một con số đỏ ⛔ không phải một lỗi (và xanh cũng ⛔ không phải bằng chứng) |

## DEC-20261008-D04 — Đề xuất giữ thứ tự **FE → BE → DB** cho mọi việc JOBS/PROJECT
| | |
|---|---|
| **BỐI CẢNH** | User: *«giai đoạn golive nên ưu tiên chỉnh sửa frontend trước, sửa backend và database sau»* |
| **QUYẾT ĐỊNH** | Với **P-01** (RBAC dự án): **FE trước** = disable nút + tooltip nêu **đúng** lý do quyền (để user không tưởng hệ thống hỏng) ⇒ **sau đó** mới sửa `ActionRbacRegistry` (BE). ⛔ Không đụng DB (2 bug này **không cần** migration) |
| **LÝ DO** | Đúng chỉ đạo; và FE-only đủ để người dùng hiểu & không mất niềm tin trong lúc chờ quyết định nghiệp vụ |

## DEC-20261008-D05 — **TỰ ĐÍNH CHÍNH** kết luận P-01/P-02 thay vì để user quyết trên số liệu sai
| | |
|---|---|
| **BỐI CẢNH** | `docs/38` (viết trong cùng phiên) kết luận 403 của CRUD dự án là do **khai module rỗng**. Đọc tiếp `SystemController.java:281-302` phát hiện **`requireRequireAdmin`** mới là tầng chặn chính (chủ ý thiết kế) |
| **QUYẾT ĐỊNH** | Viết `docs/39_DINH_CHINH_AUDIT_TANG_CONG_QUYEN_20261008.md`; **sửa lại `docs/38` §10**; sửa `BUG_HOTFIX_LOG` (D01/D02) và **hỏi lại câu 1–2** theo bản chất («có muốn dự án CHỈ `admin` quản lý không?») |
| **LÝ DO** | ⛔ Không để user quyết trên nguyên nhân sai; đúng văn hoá tự đính chính đã có trong `SESSION_C`/`CURRENT_STATE`; Goal §16 «actual code = nguồn sự thật» |
| **HỆ QUẢ** | Thêm **quy tắc mới Đ-04-01…03** (đọc `docs/39` §7): *một 403 có thể do 2–3 tầng; thông điệp lỗi là dấu vân tay của tầng* |

## DEC-20261008-D06 — ⛔ Không kết luận «mồ côi» khi chưa loại trừ guard trong use case
| | |
|---|---|
| **BỐI CẢNH** | **P-08** (12 action rỗng, không admin-gate) suy ra 403 — nhưng khối material catalog dùng `asMaterialCatalogPrincipal(cu)` ⇒ **có thể** use case tự guard |
| **QUYẾT ĐỊNH** | Ghi P-08 ở mức **nghi vấn CAO**, ⛔ không ghi `FIXED`/`CONFIRMED`; bắt buộc **4 phép thử + đối chứng âm** (`docs/39` §5) trước khi ai đó sửa |
| **LÝ DO** | Goal §24/§32: ⛔ không claim khi chưa test/verify; bài học `SESSION_C` «chỉ số suy diễn ⛔ không thay được việc tái hiện» |

## DEC-20261008-D07 — **User ĐỔI thiết kế khối «Công việc»** ⇒ 6 tệp test khoá cấu trúc cũ **phải cập nhật cùng lượt**
| | |
|---|---|
| **BỐI CẢNH** | User giao 7 việc (08/10): gom 5 mục menu thành **1 hub «Công việc»** + **Dashboard lên đầu** + thêm tab **«Được giao»** + đổi tên tab + **nhập %** thay nút Thao tác + **modal «Tạo công việc»** + **«Phòng ban/ Tổ đội» 2 sub-tab** |
| **XUNG ĐỘT ĐÃ ĐO** | **6 tệp test** đang **khoá cứng** cấu trúc MT3 §A.2: `t01:98` · `t01:24-28` · `p5-01:25` · `t07:157` · `t08:144` · `t09:163` — nguyên văn *«Board không được đổi dải 6 tab (MT3 §A.2)»* |
| **QUYẾT ĐỊNH** | ⭐ **Thiết kế MT3 §A.2 được THAY THẾ theo yêu cầu user**; cập nhật **mã + test trong CÙNG một lượt**, ⛔ **không** để test đỏ, ⛔ **không** sửa test trước mã; ⚠️ **việc 1 xếp làm CUỐI** (`docs/50` §3) |
| **LÝ DO** | Goal §24/§25/§41: `FIXED` = mã + test cùng xanh; giữ **thay đổi nhỏ · cô lập · lùi được**. ⛔ Không coi test cũ là «sai» — nó đang bảo vệ một thiết kế **do user chủ động đổi** |

## DEC-20261008-D08 — Port BE `add_work_item_comment` là **điều kiện** của việc 5; ⛔ **không** tạo migration
| | |
|---|---|
| **BỐI CẢNH** | User yêu cầu **nút «Nhận xét» cho mọi công việc** (việc 5). Action đã có trong RBAC nhưng **⛔ chưa có `case`** ở Java ⇒ gọi vào trả **400** *«chưa được triển khai trên backend Java (Strangler Fig)»* |
| **QUYẾT ĐỊNH** | ① **Port 3 điểm**: `case` trong `SystemController` + method trong `OpsTaskManagementUseCase` (khuôn `scripts/system-route.mjs:1286-1296`) + **guard `requireWorkItemAccess`** (Java **chưa có** — chỉ JS `:501`; 3 nhánh: người được giao · trưởng phòng · **người tham gia**) ② ⛔ **KHÔNG tạo migration** (bảng đã có) ③ ⛔ **KHÔNG sửa `ActionRbacRegistry`** (đã khai đúng 4 module · `canUse`) ④ *(tuỳ chọn)* port luôn `set_work_item_participant` để bật lại 「hỗ trợ liên phòng» |
| **LÝ DO** | Goal §18/§19 (database là vùng nguy hiểm — ⛔ không tạo migration khi bảng đã tồn tại); `tests/work-item-comment-participant.test.ts:54-57` tự dựng lược đồ từ `drizzle/` và assert 2 bảng ⇒ **bằng chứng bảng đã có**; ✅ **đường ĐỌC đã sẵn** (`BootstrapDataAdapter:1628/1634`) ⇒ ⛔ không phải làm lại phần bootstrap |

## DEC-20261008-D09 — **TÁCH việc 1 thành 2 lượt** (dải tab **trước**, hub menu **cuối**) vì **chỉ số tab phụ thuộc nhau**
| | |
|---|---|
| **BỐI CẢNH** | Recipe việc 7 (`docs/53` §2 — `{tab === 3}`) và việc 6 (`docs/53` §3.1 — `{tab === 2}`) viết theo **layout 7 tab**; nhưng runbook bản đầu xếp 2 việc đó **trước** bước đổi dải tab (`docs/51` Bước 4) ⇒ nếu thi hành đúng thứ tự cũ thì `{tab === 2}` rơi vào **«Phòng ban» (layout cũ)** và `{tab === 3}` rơi vào **«Giao việc»** ⇒ **chèn nhầm tab** (phát hiện ở `TASK-20261008-D25`, khi đọc `WorkCenter.tsx:86-98`) |
| **QUYẾT ĐỊNH** | ① **L4 = dải tab** (`WORK_TABS` + `WORK_TAB_OF_VIEW` + **6 nhánh `{tab === n}`**) — **CHỈ `WorkCenter.tsx`**, kèm cập nhật **4 tệp test** khoá chuỗi 6 tab · ② **L5/L6** (việc 7 và 5·6) chạy **sau L4** với chỉ số **layout mới** · ③ **L7 = hub menu** (`menu-helpers.ts` + `page.tsx` + bước 6 `workCenterViewFor`) giữ **CUỐI** để 5 việc kia xong xanh trước |
| **LÝ DO** | ⛔ Không thể để recipe tham chiếu **chỉ số tab của một layout chưa tồn tại**. ⚠️ Đánh đổi: **L4 phá 4 tệp test** ⇒ phải sửa test **cùng lượt** (Goal §24/§25) — nhưng **đổi được tính đúng đắn** của cả L5/L6 |
| **HỆ QUẢ KÈM** | ✅ Loại **1 phụ thuộc giả**: tab «Được giao» (việc 6) **⛔ KHÔNG cần khoá `view` mới** ⇒ ⛔ không phải sửa `WorkMenuView` ở `menu-helpers.ts` ⇒ **việc 6 vẫn chỉ 1 tệp** |

---

## DEC-20261008-D10 — Dải **7 TAB** + **thứ tự** do user chốt; giữ alias `kpi` để ⛔ không phá tương thích ngược
| | |
|---|---|
| **BỐI CẢNH** | User chốt qua **thẻ quyết định**: `Dashboard · Danh sách công việc · Được giao · Phòng ban/ Tổ đội · Giao việc · Dự án · Báo cáo`; `WorkMenuView` vẫn còn khoá `"kpi"` (từ MT2 trước đây) |
| **QUYẾT ĐỊNH** | ① `WORK_TABS` = **7 tab, `Dashboard` = index 0** ② `WORK_TAB_OF_VIEW = { personal:1, department:3, assign:4, kpi:0, dashboard:0, reports:6 }` — ⭐ **GIỮ `kpi: 0`** trỏ cùng tab Dashboard ③ **7 nhánh `{tab === n}`** (thứ tự TRONG NGUỒN ⛔ không bắt buộc trùng thứ tự tab — mỗi nhánh độc lập) |
| **LÝ DO** | GIỮ `kpi` để ⛔ không phá `WorkMenuView`/deep-link cũ; ⭐ **bài học ghi vào test**: *«THỨ TỰ TAB ⇎ THỨ TỰ NHÁNH TRONG NGUỒN»* ⇒ `t01` nay khoá **bất biến mạnh hơn**: đủ **7 nhánh 0..6, mỗi số một lần** + nội dung ĐÚNG từng tab |

## DEC-20261008-D11 — Kanban/Cây ⇒ **«CHẾ ĐỘ XEM»** (user chốt), ⛔ **không xoá**; giữ **nguyên nhãn** sub-tab cũ
| | |
|---|---|
| **BỐI CẢNH** | Việc 7 yêu cầu tab «Phòng ban/ Tổ đội» có **2 sub-tab**; tab này đang chứa thêm **WorkKanban** (`T-07`) và **WorkHierarchy** (`T-09`) |
| **QUYẾT ĐỊNH** | ① **2 sub-tab** cho việc phòng ban / việc tổ đội (**kèm bộ đếm**) ② Kanban + Cây chuyển vào **nhóm nút «Chế độ xem»: Bảng · Kanban · Cây** (mặc định **Bảng**) ③ ⭐ **GIỮ NGUYÊN 2 nhãn cũ** («Việc phòng ban của tôi» · «Việc của tổ đội tôi tham gia») |
| **LÝ DO** | ⛔ Không mất chức năng (Goal §7) và ⛔ **không phá test** `t06`/`t07`/`t09` — đã đo: hồi quy **⛔ 0 lỗi mới** sau L5 |

## DEC-20261008-D12 — ⭐ «NHẬN XÉT» **TẠM ẨN** ⇒ **THAY THẾ kết luận của `DEC-20261008-D08`**
| | |
|---|---|
| **BỐI CẢNH** | `DEC-D08` kết luận: **port BE `add_work_item_comment` là ĐIỀU KIỆN** của việc 5 (vì gọi vào Java trả **400**). Nhưng `java-backend/**` ⛔ **KHÔNG nằm trong uỷ quyền B1+B2** của phiên này |
| **QUYẾT ĐỊNH** | ⭐ User chốt qua **thẻ quyết định**: **TẠM ẨN** nút «Nhận xét» — modal chi tiết hiện **DÒNG THÔNG BÁO** (`data-vntech="work-comment-pending"`) ⛔ **KHÔNG hiện nút chết** |
| **LÝ DO** | Goal §24: ⛔ không được để nút bấm vào là lỗi; ⛔ không được sửa vùng ngoài uỷ quyền ⇒ ⭐ **ghi lại rõ: quyết định NÀY SUPERSEDE `DEC-D08`** (D08 vẫn đúng về mặt kỹ thuật, chỉ **bị hoãn** cho tới khi có uỷ quyền `java-backend`) |
| **HỆ QUẢ** | ⛔ nút «Nhận xét» **chưa có** trên UI ⇒ ⚠️ việc 5 của user **mới đạt phần «click ⇒ modal chi tiết»**; phần «nhận xét» **⏳ chờ port BE** (đã ghi ở `docs/58` §4) |

## DEC-20261008-D13 — Hub «Công việc»: `permissionKeys` = **HỢP 8 khoá**; **rút `my_work`** khỏi nhóm hub; **ĐẢO 2 NHÁNH** `workCenterViewFor`
| | |
|---|---|
| **BỐI CẢNH** | Việc 1: gom 5 mục rời thành 1 hub. `WorkCenterViewFor` **trước đây** xét `dept_plan_*_tasks` **TRƯỚC** `view === "dashboard"` ⇒ mục hub (`moduleKey` = **khoá quyền đầu xem được** = `dept_plan_kpi`) sẽ rơi vào nhánh `personal` |
| **QUYẾT ĐỊNH** | ① 1 mục `work_hub` (**label «Công việc»**, `view:"dashboard"`) với `permissionKeys` = **HỢP 8 khoá** của 5 mục cũ ② ⛔ **KHÔNG** khai `moduleKey` (page.tsx vẫn ưu tiên `viewable`) ③ **RÚT `"my_work"`** khỏi `HUB_TAB_GROUP_KEYS` (nhóm còn **1 mục** ⇒ theo luật «≥2 mục mới là hub» thì ⛔ không còn là nhóm hub) ④ ⭐ **ĐẢO 2 NHÁNH** trong `workCenterViewFor`: `if (view === "dashboard")` **ĐỨNG TRƯỚC** `if (active === "dept_plan_tasks" \|\| …)` |
| **LÝ DO** | ⚠️ Thiếu **HỢP** khoá quyền ⇒ người chỉ có **1** khoá trong 8 sẽ **MẤT mục menu** (`page.tsx` lọc `permissionKeys.find(canView)`); thiếu **đảo nhánh** ⇒ **bấm «Công việc» mở nhầm tab «Danh sách công việc»**. ⭐ Đã **đo trên UI thật**: bấm «Công việc» ⇒ **`active = "Dashboard"`** ⇒ **đảo nhánh là ĐÚNG** |

## DEC-20261008-D14 — `title` phải là **`let`** + **GHI ĐÈ** khi `workCenterView !== null` (fix `BUG-D09`)
| | |
|---|---|
| **BỐI CẢNH** | Sau khi gộp hub, `<h1>` **luôn** là «KPI & hiệu suất nhân viên» (vì tiêu đề lấy theo `titles[active]`/`moduleMeta.label` với `active = dept_plan_kpi`) ⚠️ **nhầm ngữ cảnh mọi tab** — chính là `BUG-D09` |
| **QUYẾT ĐỊNH** | ⛔ **KHÔNG** sửa bảng `titles` (dùng chung cho cả hệ) ⇒ ① đổi `const title` → **`let title`** ② **ghi đè** ngay sau `const workCenterView = workCenterViewFor(...)`: `if (workCenterView !== null) title = ["Công việc", …]` |
| **LÝ DO** | ⚠️ **BẮT BUỘC `let`**: `workCenterView` khai **SAU** dòng `title` ⇒ dùng `const` + tham chiếu sớm sẽ **lỗi TDZ**; ⭐ mọi chỗ đọc `title[...]` (topbar + `<h1>`) **tự nhận** giá trị mới ⇒ sửa **ít nhất** mà đúng. Đã khoá bằng **test** trong `t13` (⛔ không chỉ sửa mã) |

## DEC-20261008-D15 — ⛔ **KHÔNG chạy `gd-cycle` lẻ**; gộp **MỘT LẦN khi MỌI phiên dừng sửa**
| | |
|---|---|
| **BỐI CẢNH** | `gd-cycle` ⛔ **không tự khởi động lại** dịch vụ và **mỗi lần chạy lại SINH THÊM 1 migration identity** (phiên này đã sinh `0351` + `0352`) ⇒ ⚠️ **làm `BUG-D06` (40 nhóm trùng số migration) nặng thêm** |
| **QUYẾT ĐỊNH** | ⛔ **KHÔNG** chạy `gd-cycle` chỉ để đưa `BUG-D09`/`BUG-D10` lên UI; ⏳ **chờ user/S01 chốt** và **chạy gộp 1 lần** khi mọi phiên dừng sửa |
| **LÝ DO** | Goal §18/§37: ⛔ không tự tạo thêm migration khi ⛔ không cần; ⚠️ build giữa lúc phiên khác đang sửa còn **gói cả mã dở** của họ vào bundle ⇒ ⭐ **thà chậm 1 nhịp còn hơn làm hỏng cổng phát hành** |

---

## 🆕 QUYẾT ĐỊNH CỦA USER 08/10/2026 (vòng 67) — 5 điểm, đã ghi để ⛔ không hỏi lại

| # | User chốt (nguyên văn) | Việc đã làm / sẽ làm |
|---|---|---|
| 1 | **«ủy quyền»** | ✅ **ĐƯỢC UỶ QUYỀN** sửa `scripts/**` + `java-backend/**` ⇒ thi hành **`BUG-D12`** (báo người giao khi việc hoàn thành) + **`P-08`** (18 action mồ côi quyền, theo spec của chính dự án `docs/42`/`docs/47`) |
| 2 | **«chưa cần thêm filter»** | ✅ **GIỮ NGUYÊN**: filter «Chọn dự án» **tiếp tục ẨN** trong module «Công việc» (⛔ không làm gì thêm) |
| 3 | **«tạm thời ẩn Kanban / cây ghi vào log nếu sau này cần thì dùng lại»** | ✅ **ĐÃ ẨN** Kanban + Cây trong tab «Phòng ban/ Tổ đội» — ⭐ **GIỮ NGUYÊN MÃ** (⛔ không xoá) · ⭐ **BẬT LẠI = đổi ĐÚNG 1 CHỖ**: `WORK_VIEW_MODES_HIDDEN = false` (`WorkCenter.tsx`, cạnh `WORK_TAB_OF_VIEW`) · 📌 **LÝ DO ẨN đã ghi trong mã**: tab này trước đây hiện **3 cách nhìn CÙNG 1 tập việc** (2 bảng + Kanban + Cây) và `WorkHierarchy` phụ thuộc `teamMembers` (**Java-only**) nên hay ghi «chưa có nguồn» · ✅ **có test khoá** (`t13`: cờ phải `true` · ⛔ cấm xoá import/khối · bảng phải luôn hiện) |
| 4 | **«đợi session 1 làm xong thì build»** | ✅ **CHỜ** — ⛔ **KHÔNG** chạy `gd-cycle`/build bây giờ (đúng `DEC-D15`: tránh sinh thêm migration + tránh gói mã dở của phiên khác) |
| 5 | **«vào 1 tài khoản nhân viên khác để test»** | ⏳ **ĐANG LÀM**: tìm tài khoản **nhân viên** có sẵn (⛔ **KHÔNG đoán mật khẩu**) để kiểm **ô NHẬP %** — điểm `VERIFIED` cuối cùng của việc 3 |
