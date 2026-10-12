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
| 6 | **«Trong ma trận hiện tại thì lại chia ra 2 phòng ban … ⛔ không được hardcode mà phải thiết kế động»** + chốt **PHƯƠNG ÁN A** (1 khoá «Công việc» chung + phạm vi động) | ✅ **ĐÃ THI HÀNH** (`CHG-D17`): khoá `work` ở **5 tầng** + phạm vi tra ĐỘNG theo `organization_units` ⇒ **11 đơn vị** dùng được (trước: 2 phòng). ⭐ Bằng chứng đo trước/sửa: `MA_TRAN_WORK_DONG_20261008.md §1` |
| 7 | **«Cho phép thay đổi database nếu cần»** | ✅ **ĐÃ DÙNG** đúng 1 lần, có đo trước/sau + **idempotent** (`V40`): `module_catalog` 76→77 · `department_module_permissions` 481→**489** · `user_module_permissions` 2772→**2775** · ⛔ **KHÔNG cấp thêm quyền** cho ai (kế thừa `MAX()` năng lực đang có) |
| 8 | ⚠️ **QUYẾT ĐỊNH KỸ THUẬT của phiên 04** (ghi để truy vết, ⛔ không tự ý đổi): ① **⛔ KHÔNG dùng `isCompanyLeadership`** cho phạm vi xem việc — ĐO ĐƯỢC `thuky`(3)+`hr`(2) có `base_role='director'` ⇒ sẽ **mở oan** việc của 73 nhân sự cho thư ký/HR ② **⛔ KHÔNG dùng luật cấp bậc thuần** — ĐO ĐƯỢC **62/73** tài khoản `system_level_code=NULL` ⇒ trưởng phòng KH sẽ **MẤT quyền** (hồi quy) ③ **⛔ KHÔNG thêm mã drizzle `0353`** — cổng `verify-full-release` buộc `MIGRATION_HEAD` trong `VNTECH_PACKAGE_ID.txt` trỏ tệp mới ⇒ đổi fingerprint gói là việc của **bước BUILD** ④ **⛔ CHƯA ẩn 4 dòng khoá cũ khỏi ma trận** — ẩn được (đã chứng minh ⛔ không mất quyền) NHƯNG 2 nút hàng loạt `setAll`/`setColumnAll` sẽ **ghi 0 ÂM THẦM** ⇒ phải sửa kèm, **chờ user quyết** | ✅ Ghi tại `MA_TRAN_WORK_DONG_20261008.md §2.2 + §5 + §6` |
| 9 | **«Admin sẽ quyết định ai là trưởng phòng»** (user, 08/10/2026) | ✅ **ĐÃ THI HÀNH**: luật phạm vi nhận tư cách quản lý phòng từ **HAI** nguồn — chức danh `%_truong` (giữ hành vi cũ) **HOẶC** ⭐ **quyền `work.canApprove` do ADMIN CẤP** (`user_module_permissions`). ⇒ Admin tick «Duyệt» ở dòng «Công việc (mọi phòng ban)» trong ma trận là **đủ** (⛔ không cần tạo chức danh, ⛔ không cần sửa mã) · ⚠️ **vì sao phải thêm vế này**: nếu chỉ giữ mẫu `%_truong` thì quyết định của admin **chỉ mở nút Duyệt mà ⛔ không mở phạm vi XEM** ⇒ vô hiệu một nửa · ✅ khoá bằng test (`t13`) ở **CẢ 2 đường** · ⏱ **KHÔNG gán ai** (đúng phạm vi: ⛔ không tự đoán) |
| 10 | **«Session 1 đang hoạt động trở lại hãy chú ý phối hợp tránh conflict»** (user, 08/10/2026) | ✅ **ĐÃ PHỐI HỢP**: ghi mục **`SHARED_STATE.md` → CẬP NHẬT 69** nêu rõ **6 tệp `java-backend/**`** + **`lib/**`** + **`app/page.tsx`** phiên 04 đã sửa (kèm delta), **CSDL đã đổi** (3 bảng), và ⭐ **xác nhận chốt chặn bộ sinh ⛔ KHÔNG làm gãy build** (đã kiểm: ⛔ không build script/`package.json` nào gọi `generate-rbac-registry.mjs`) · ⛔ **ĐÓNG BĂNG**: từ đây phiên 04 ⛔ không sửa thêm tệp của phiên 01/02 (chờ user quyết mục §6-1 thì phối hợp trước với S02 vì chạm `PermissionAccessPanel`/`PermissionMatrix`) |
| 11 | **«ẩn»** (user trả lời câu hỏi «có ẩn 4 dòng khoá cũ khỏi ma trận không?») | ✅ **ĐÃ THI HÀNH** (`CHG-D20`): ẩn **Ở TẦNG VẼ** (`PermissionMatrix` → `visibleEntries`) ⇒ ma trận còn **1 dòng «Công việc (mọi phòng ban)»**; ⛔ **KHÔNG** đụng `entries`/`permissionMatrixKeys` ⇒ ⭐ **quyền hiện có ⛔ KHÔNG mất** (payload FULL-REPLACE vẫn gửi đủ 4 khoá) · ⭐ **KÈM THEO BẮT BUỘC** (nếu không là **ghi 0 âm thầm**): tách `bulkKeys` cho `setAll`/`setColumnAll`/`columnState` (`BUG-D19`) · ✅ khoá bằng test `v214` **VỆ 8** (4 bất biến) · ⚠️ 4 khoá **VẪN SỐNG** (cổng tab `WorkCenter`, tiêu đề màn, tìm kiếm) ⇒ ⛔ **tuyệt đối không xoá** khỏi `module_catalog`/`modules[]` |

---

## ⏳ QUYẾT ĐỊNH ĐANG CHỜ USER — `Q-W4` (09/10/2026 · `ERP-SESSION-04`)

**Bối cảnh (đo được):** S01 đã tạo **6 khoá tab** `work_dashboard`·`work_list`·`work_department`·`work_assign`·`work_project`·`work_reports` (+ `work_others`) ở **3 tầng** (`ModuleKey` · nhãn `app/page.tsx:138-149` · danh mục CSDL). ⚠️ **Cấp ban đầu = 0** (đúng ràng buộc §5.3 «⛔ không tick sẵn cho ai»).

**Việc cần làm (W4):** dải tab của màn «Công việc» (`app/screens/WorkCenter.tsx`) **đọc 6 khoá** ⇒ ai ⛔ không được cấp thì **⛔ không thấy nút tab đó**.

**🔴 CÂU HỎI (⛔ phiên 04 KHÔNG tự quyết — luật `DEC-*` + đã 2 lần suy diễn sai ở `KE-HOACH-PHAN-QUYEN` §5b/§5c):**

> Khi admin ⛔ **chưa tick** khoá nào cho một tài khoản thì màn «Công việc» của tài khoản đó sẽ **trắng tab** (vì cấp ban đầu = 0). Chọn cách nào?

| | Phương án | Hệ quả |
|---|---|---|
| **A** ⭐ *(đề xuất của phiên 04)* | **LÙI AN TOÀN**: chỉ ẩn/hiện **từng tab** khi tài khoản **ĐÃ CÓ ít nhất 1 khoá `work_*`**; nếu **⛔ chưa có khoá `work_*` nào** thì giữ **nguyên hành vi hiện tại** (đủ 7 tab như hôm nay) | ✅ ⛔ **0 thay đổi hành vi** cho tới khi admin chủ động tick · ✅ ⛔ không trắng màn · ✅ an toàn go-live |
| **B** | **SIẾT NGAY**: đọc khoá **tuyệt đối** — ⛔ không có khoá ⇒ ⛔ không có tab nào | 🔴 **Mọi tài khoản mất hết tab ngay** cho tới khi admin tick 6 khoá ⇒ ⚠️ cần cấu hình lại **73 tài khoản** trước khi dùng |
| **C** | ⛔ **Chưa làm W4** — giữ dải tab như hiện tại (ai có mục menu «Công việc» thì thấy đủ tab) | ⚠️ 6 khoá `work_*` chỉ có tác dụng ở **ma trận** (cấp quyền) mà ⛔ chưa chặn gì ở màn |

**➕ 2 câu hỏi phụ (⚠️ thuộc S01, đã ghi ở kế hoạch §3.1):** ① `work_hub.permissionKeys` có thêm **6 khoá `work_*` + `work_others`** ⛔ không? (nếu ⛔ không: người **chỉ** được cấp khoá mới sẽ **mất mục menu «Công việc»** — lỗi im lặng lớp `D1`) ② 6 khoá đó có cần **dòng ma trận** ở `lib/menu-helpers.ts` hay **đủ** nhờ đã có trong `module_catalog`?

**📌 Trạng thái:** ⏳ **CHỜ USER** — ⛔ **chưa thi hành** (⚠️ thêm lý do kỹ thuật: S01 **đang chạy chuỗi build** lúc 14:53 ⇒ ⛔ chạm FE lúc này sẽ làm mã mới hơn bản build, lặp lại lỗi `13:36:26`).
**📄 Kế hoạch đầy đủ (đã đo từng dòng):** `docs/dsh-mutil-session/SESSION_D/probes/KE-HOACH-W45-TAB-6-KHOA-VA-MA-TRAN.md`

### ✅ USER ĐÃ QUYẾT `Q-W4` (09/10/2026 — trả lời thẻ hỏi)
- ① **W4 = PHƯƠNG ÁN `A` — LÙI AN TOÀN**: chỉ ẩn/hiện **từng tab** khi tài khoản **ĐÃ CÓ ≥1 khoá `work_*`**; ⛔ **chưa có khoá nào ⇒ giữ NGUYÊN 7 tab như hiện tại** ⇒ ✅ ⛔ 0 thay đổi hành vi cho tới khi admin chủ động tick (⛔ không trắng màn) ✓
- ② **THỜI ĐIỂM = SAU KHI `ERP-SESSION-01` BUILD XONG** (⛔ không sửa `app/**` bây giờ — ⚠️ S01 đang chạy chuỗi build từ 14:53) ✓
- 📌 **HỆ QUẢ**: ⛔ **KHÔNG còn quyết định nào đang chờ user** cho W4; ⚠️ **còn 2 câu hỏi kỹ thuật thuộc S01** (`work_hub.permissionKeys` có thêm 6 khoá mới ⛔ không? · 6 khoá có cần dòng ma trận ⛔ không?) — đã ghi ở `HANDOFF-20261009-A13` §⑥ + kế hoạch §3.1 ✓
- 📄 Kế hoạch (đã đo từng dòng): `SESSION_D/probes/KE-HOACH-W45-TAB-6-KHOA-VA-MA-TRAN.md`

---

## DEC-20261009-D16 — ⛔ **W2 KHÔNG gate theo `work_others`** (giữ phạm vi do MÁY CHỦ quyết) — đo được 09/10/2026
**Bối cảnh**: S01 quyết `B1` (mục `A10`): thêm **1 dòng ma trận** `work_others` = «Việc của NGƯỜI KHÁC (xem · sửa · duyệt)». Câu hỏi nảy sinh khi làm **W2**: có nên **ẩn/hiện** cách xem «Theo người» theo khoá `work_others` không?
**📏 ĐO ĐƯỢC (grep toàn repo + SQL chỉ đọc)**:
| Phép đo | Kết quả |
|---|---|
| `work_others` xuất hiện ở đâu | **CHỈ 3 chỗ**: ① nhãn `app/page.tsx:149` ② `ModuleKey` (`lib/ui-shared.tsx:25`) ③ **1 dòng CHÚ THÍCH** trong `ActionRbacRegistry.java:368` («⛔ KHÔNG gắn `work_others`») |
| Có nơi nào CƯỠNG CHẾ không? | ⛔ **KHÔNG** — ⛔ không use-case Java · ⛔ không route JS · ⛔ không cổng FE |
| Đã cấp cho ai chưa? | **0 tài khoản · 0 đơn vị** (`user_module_permissions` / `department_module_permissions`) |
| Trong khi đó máy chủ CÓ cho xem việc người khác | ✅ CÓ (đo trước: `trdademo` **17** việc · `giamdoc.demo` **19** = admin) — theo **`work_scope` + `isDepartmentManager`** |
**⭐ QUYẾT ĐỊNH**: ⛔ **KHÔNG gate W2 theo `work_others`** ⇒ giữ nguyên luật «**phạm vi do MÁY CHỦ quyết**» (payload đã lọc); FE chỉ **hiện đúng** dòng đã trả về.
**LÝ DO (nếu gate thì SAI)**: `work_others` **cấp ban đầu = 0** ⇒ gate FE sẽ **ẨN OAN** tính năng mà **máy chủ vẫn đang cho phép** (trưởng phòng/giám đốc) ⇒ ⚠️ **hồi quy hành vi đang chạy**; ➕ trái hợp đồng 2 tầng của S01 (`A09`): khoá TAB = *vào/không vào tab* · `work` + 6 năng lực = *được THAO TÁC gì* — `work_others` là **năng lực/khả năng ở máy chủ**, ⛔ không phải cổng tab.
**⚠️ HỆ QUẢ PHẢI NÓI RÕ (⛔ không giấu)**: sau **W5** admin sẽ **THẤY** dòng `work_others` trong ma trận và **tick được**, ⚠️ **nhưng tick ⛔ CHƯA có tác dụng gì** cho tới khi **S01 cưỡng chế** khoá này ở use-case (đúng trạng thái «dòng có mà chưa nối» như `project_admin` trước đây) ⇒ 📤 **đã báo S01** (`HANDOFF-20261009-A14`) ✓
**TRẠNG THÁI**: ✅ **CHỐT** (phiên 04 tự quyết — thuộc phạm vi chức năng FE của tôi; ⛔ không đụng quyền của S01)

---

## DEC-20261009-D17 — ⭐ **GATE ô chọn «Xem việc của» theo khoá `work_others`** (USER yêu cầu) — **GHI ĐÈ `DEC-20261009-D16`**
**Nguyên văn USER (09/10/2026, kèm ảnh màn)**: «*filter **Xem việc của**: cần có **logic check perm**, user ⛔ không có perm thì sẽ **không chọn được hoặc không hiển thị***»
**⭐ QUYẾT ĐỊNH**: ô chọn «Xem việc của» **CHỈ render khi `modulePermission(data,"work_others").canView` = true**; ⛔ thiếu quyền ⇒ **ẨN HẲN** + **ÉP về «Nhóm của tôi»** bằng biến dẫn xuất **`ownerViewEff`** (dùng cho `personalViewRows` · `ownerViewEditable` · ghi chú toolbar) ⇒ ⛔ không lộ việc người khác ⚠️ **kể cả khi state `ownerView` còn là `"owner"` từ trước** (ví dụ admin vừa thu quyền giữa phiên) ✓
**⬆️ THAY THẾ `DEC-20261009-D16`** (cùng ngày, tôi quyết **⛔ KHÔNG gate** vì khi đó: `work_others` = **0 cấp** + **chưa cưỡng chế ở tầng nào**) — lý do thay: ⭐ **USER yêu cầu trực tiếp** ⇒ quyền quyết thuộc user (Goal §16: yêu cầu user > suy luận của phiên) ✓
**⚠️ HỆ QUẢ PHẢI NÓI RÕ (⛔ không giấu)**:
1. 🔴 Vì `work_others` hiện **cấp cho 0 tài khoản** (đo 09/10/2026) ⇒ ⭐ **chỉ `admin` thấy ô chọn** (nhánh `modulePermission` cho `admin` = mọi năng lực `true`) — ⚠️ **trưởng phòng/giám đốc sẽ ⛔ KHÔNG thấy ô chọn** cho tới khi **admin tick `work_others` cho họ trong ma trận** ⇒ 📤 **đã báo S01** (`HANDOFF-A20`) để họ biết cổng phía máy chủ (`work_others` trong use-case) ⛔ **vẫn chưa cưỡng chế** ⇒ hiện tại quyền này **chỉ được gác ở GIAO DIỆN** ✓
2. ⚠️ Đây là **hành vi MỚI** (trước đây ai cũng thấy ô chọn) ⇒ đã ghi `CHANGE_LOG` + test khoá (`t14`) ✓

---

## ⏳ QUYẾT ĐỊNH ĐANG CHỜ USER — `Q-UI-01` (09/10/2026 16:05 · `ERP-SESSION-04`)

**Bối cảnh (đã giao 3 việc UI — xem ảnh bằng chứng `SESSION_D/uat-batch-D-tab-danh-sach-cong-viec.png`)**: nút «＋ Tạo công việc» nay nằm trong `actions` của `ListToolbar` ⇒ **cùng HÀNG** với ô tìm kiếm nhưng ở **phía TRÁI** (⚠️ theo **chuẩn nhà** `ListToolbar.tsx:89-90` — MT3 §IV.4: *«hành động CHÍNH (Tạo · Sửa · Xóa) đứng TRƯỚC bộ điều khiển»*).

**❓ CÂU HỎI (thẻ hỏi 16:03 — ⏳ HẾT THỜI GIAN, user ⛔ chưa trả lời)**:
> Nút «＋ Tạo công việc»: **giữ như ảnh** (cùng hàng, phía trái) **HAY** đổi sang **SÁT NGAY ô tìm kiếm (phía phải)**?

**⭐ PHƯƠNG ÁN ĐANG ÁP (mặc định — ⛔ không tự đổi)**: **GIỮ NGUYÊN** vị trí hiện tại (⚠️ đúng chuẩn nhà + ⛔ không phá khoá test/probe về thứ tự toolbar) ✓
**🔧 NẾU USER MUỐN ĐỔI**: chỉ cần chuyển khối nút từ `actions` → `secondaryActions` (`WorkCenter.tsx`, **1 chỗ**) ⇒ nút nằm **ngay sau** ô tìm kiếm; ⚠️ phải kiểm lại `probe-two-tier-toolbar`/`mt3-*` trước khi chốt (⚠️ hiện ⛔ chưa đổi vì chờ user) ✓
**📌 TRẠNG THÁI**: ⏳ **CHỜ USER** — ⛔ không tự đổi (luật: thay đổi vị trí UI theo ý user phải do user chốt) ✓

---

## ⏸️ TRẠNG THÁI TẠM DỪNG — `Q-PERM-01` + `Q-UI-01` (09/10/2026 16:22 · `ERP-SESSION-04`)

**⭐ LÝ DO TẠM DỪNG (theo LUẬT USER đã chốt 09/10/2026 · memory `#3`)**: «khi công việc chạm **QUYẾT ĐỊNH CỦA USER** ⇒ DSH phải **DỪNG vòng lặp goal và CHỜ user quyết**, ⛔ không tự chạy tiếp vòng khác và ⛔ không tự áp phương án mặc định».
📏 **ĐO ĐƯỢC**: **mọi việc trong phạm vi S04 đã XONG + được nghiệm thu** (`WorkCenter.tsx` 15:59:37 — 3 việc UI batch D đã VERIFIED trên UI thật; hồi quy **979·978 pass·FAIL 0**) ⇒ ⛔ **không còn việc nào S04 tự làm được**; các việc còn lại **đều cần USER quyết** hoặc **thuộc S01** (⛔ ngoài phạm vi) ✓

### ❓ 3 VIỆC CẦN USER QUYẾT (⛔ S04 không tự quyết)

| # | Câu hỏi | Đã hỏi lúc | Phương án S04 đang áp (⚠️ mặc định, ⛔ không tự đổi) | Ai thi hành khi user chốt |
|---|---|---|---|---|
| `Q-UI-01` | Nút **«＋ Tạo công việc»** giữ **cùng hàng bên TRÁI** ô tìm kiếm (như ảnh) **hay** đổi **sát ngay ô tìm kiếm (phía phải)**? | 16:03 (thẻ hỏi — ⏳ **hết hạn, chưa trả lời**) | ⭐ **GIỮ NGUYÊN** (⚠️ đúng chuẩn nhà `ListToolbar` MT3 §IV.4) | **S04** (đổi **1 chỗ**: `actions`→`secondaryActions`) |
| `Q-PERM-01` | **CẤP `work_others.canView`** cho **trưởng phòng/giám đốc** để họ thấy ô chọn «Xem việc của»? (📏 hiện **0 cấp** ⇒ ⭐ **chỉ `admin`** thấy ô chọn) | Telegram 15:44 + `A20` | ⭐ ⛔ **KHÔNG tự cấp** (⚠️ cấp quyền = **thay đổi dữ liệu**, ⛔ không tự làm) | **S01** (⚠️ vùng ADMIN theo `CN92`; S01 đã đo `work_others` cấp/mở/đóng **đúng 2 chiều** ở `CN93`) |
| `Q-PERM-02` | Chốt **đề xuất sub-tab** + **phạm vi khoá `work_others`** (`DEC-20261009-022` của S01: «Của tôi»/«Đã giao» ⛔ khoá riêng · «Theo người» ⇒ `work_others` · 6 khoá TAB + 1 = **7 khoá**) | S01 hỏi | — | **S01** (giao diện sub-tab: nếu user giao ⇒ **S04** làm) |

### ⏳ 2 VIỆC CHỜ `ERP-SESSION-01` (⛔ không phải quyết định của user — S04 ⛔ không tự làm được)

| # | Việc | Bằng chứng/đo được | Phép kiểm S04 đã chuẩn bị |
|---|---|---|---|
| `W-D27` | 🔴 **Vá `BUG-20261009-D27`** — nút «Xoá» (W3) xoá MỀM nhưng dòng ⛔ **vẫn hiện** | 📏 **CỔNG S04 `exit 1` lúc 16:21**: thiếu **`AND wi.active=1`** ở **CẢ 2 đường** (Java `BootstrapDataAdapter` · JS `scripts/system-route.mjs`) · payload còn **7/21 dòng `active=0`** (`CV-DA-260917-6690/6847/7918/8934` · `CV-DA-260925-3305` · `CV-DA-261009-3020/9740`) | ⭐ **1 LỆNH**: `node tools/probe-workitems-active.mjs` ⇒ kỳ vọng **exit 0** (`HANDOFF-A25`) |
| `W-W5` | Xác nhận **GIỮ hay TỰ QUẢN 7 dòng `modules[]`** của `W5` trong `lib/menu-helpers.ts` | 📏 tệp vẫn nguyên **15:30:21** (⛔ chưa ai chạm) | — (⚠️ xoá 7 dòng ⇒ ma trận **mất 6 dòng TAB**) |

### ✅ TRẠNG THÁI VÙNG S04 LÚC TẠM DỪNG (⛔ không có gì dở dang)
- ⭐ **ĐÃ `RELEASED` + ĐÃ NGHIỆM THU**: `app/screens/WorkCenter.tsx` **15:59:37** (build **16:14:45** đã chứa nó — 📏 **DOM THẬT 3/3 ĐẠT** + **ảnh chứng cứ** `SESSION_D/uat-batch-D-tab-danh-sach-cong-viec.png`) ✓
- ⭐ **Cổng xanh toàn bộ**: `tsc` 0 · `eslint` 0 · **4/4 probe S04 exit 0** · hồi quy **979 test · 978 pass · FAIL 0 · 1 skip** ✓
- ⛔ **S04 ⛔ DỪNG SỬA MÃ** (⚠️ để S01 build sạch) — chỉ ghi `docs/**` ✓
- 🔎 **Ma trận phân quyền**: ⛔ **ngoài phạm vi S04** (chốt của user + `CN92`) — S04 chỉ **ĐỌC** + đưa **bằng chứng** (⚠️ bằng chứng đó đã giúp S01 vá `BUG-D31`) ✓

### ✅ `Q-PERM-01` = **VERIFIED (dữ liệu → payload)** (09/10/2026 16:33 · `ERP-SESSION-04`)

| Phép đo | Kết quả |
|---|---|
| SQL sau khi cấp | bảng quyền **2968 → 2973** · đúng **5 tài khoản** `work_others can_view=1` ✓ |
| **Payload THẬT** (`:9000`, `admin`) | ⭐ `allModulePermissions` = **2973** · dòng `work_others` của **5 tài khoản vừa cấp** = **5/5** với `canView=1` ✓ |
| Ý nghĩa | ⭐ Hàm FE `modulePermission(data,'work_others').canView` đọc chính payload này ⇒ ⭐ **ô chọn «Xem việc của» SẼ HIỆN cho trưởng phòng/giám đốc** ✓ |
| ⏳ Chưa đo được | ⚠️ **render trên UI của 1 tài khoản trưởng phòng** (⚠️ cần đăng nhập tài khoản đó — S04 ⛔ **không đăng nhập tài khoản khác trong phiên trình duyệt của user**) ⇒ 🧪 **cách đo**: đăng nhập `trdademo` ⇒ vào **Công việc → Danh sách công việc** ⇒ phải **thấy ô «Xem việc của»** ✓ |
| ⭐ ROLLBACK | `docs/dsh-mutil-session/SESSION_D/probes/ROLLBACK-cap-work_others.sql` (1 lệnh, xoá đúng 5 id) ✓ |

### ✅✅ `Q-PERM-01` — **NÂNG MỨC NGHIỆM THU: ĐÃ CHỨNG MINH BẰNG HÀM FE THẬT** (09/10/2026 16:33 · `ERP-SESSION-04`)
> 📏 **`node --import tsx docs/dsh-mutil-session/SESSION_D/probes/verify-cong-work_others.mjs`** ⇒ ⭐ **`exit 0`**
- 5/5 tài khoản (`trdademo` · `e2e.kh` · `trinhtrench` · `e2e.bgd` · `giamdoc.demo`) ⇒ **`modulePermission(data,"work_others").canView = true`** ✓
- **ĐỐI CHỨNG ÂM 5/5** (bỏ dòng `work_others` = trạng thái TRƯỚC khi cấp) ⇒ **`canView = false`** ✓ ⇒ ⭐ chứng minh **chính việc cấp** là thứ mở cổng (⛔ không phải admin-bypass hay trùng hợp)
⇒ ⭐ **KẾT LUẬN**: ô chọn **«Xem việc của» SẼ HIỆN** cho trưởng phòng/giám đốc ⇒ ⏳ **phần DUY NHẤT còn lại**: **render DOM thật** trên phiên của 1 tài khoản TP (⚠️ cần đăng nhập — ⛔ S04 không tự đăng nhập tài khoản khác trong phiên của user) ✓

---

## ✅ `Q-MANIFEST-01` — **USER CHỐT PHƯƠNG ÁN `A`** (09/10/2026 17:03) — GIỮ tên `tests/t17-…` + **S01 sinh lại manifest & build 1 lượt**

**BỐI CẢNH**: `SHARED_STATE CN105` của S04 nêu **cổng phát hành ĐỎ** (`verify-full-release` **EXIT 1**: «Manifest tham chiếu file thiếu: `tests/t16-work-filter-sort-assign.test.mjs`») — ⚠️ hệ quả của việc S04 **đổi tên test `t16` → `t17`** (theo đúng khuyến nghị `CN100` của S01 để ⛔ hết trùng số). S04 đưa **2 phương án**:
- **A** ⭐: **giữ `t17`** + **S01 sinh lại `MANIFEST_SHA256.txt` rồi build 1 lượt** ⇒ giữ đúng quy ước «ai tạo trước giữ số».
- **B**: S04 **đổi tên lại về `t16`** (⚠️ chấp nhận trùng số) ⇒ manifest **khớp ngay**, ⛔ không cần build.

> 📌 **NGUYÊN VĂN USER (17:03)**: «**A**» ⇒ ⭐ **CHỌN A** ✓

| Trường | Nội dung |
|---|---|
| **QUYẾT ĐỊNH** | ⭐ **A** — GIỮ `tests/t17-work-filter-sort-assign.test.mjs` · ⛔ **KHÔNG hoàn nguyên tên** ✓ |
| **AI THI HÀNH** | **`ERP-SESSION-01`** (S04 ⛔ **KHÔNG chạm** `MANIFEST_SHA256.txt` — ⚠️ đó là **sản phẩm của chuỗi build của S01**) ✓ |
| **📏 ĐO ĐƯỢC — NGUỒN SINH MANIFEST** | `scripts/generate-release-manifest.mjs` (dòng 7: `const out = join(root, 'MANIFEST_SHA256.txt')`) · được gọi trong chuỗi **`npm run build` = `scripts/build-cross-platform.mjs`** ✓ |
| **📏 DÒNG SAI HIỆN TẠI** | `MANIFEST_SHA256.txt` **dòng 6968**: `ffbe83af…  ./tests/t16-work-filter-sort-assign.test.mjs` ⇒ ⚠️ tệp **⛔ không còn tồn tại** ✓ |
| **⭐ LỆNH GỢI Ý CHO S01** | chạy **đúng chuỗi phát hành thường lệ** (⚠️ sinh manifest **LẦN CUỐI** sau khi mã đã đóng băng) ⇒ `dist` mới sẽ chứa **`t17`**; ⛔ S04 **không sửa mã** nữa ✓ |
| **TRẠNG THÁI S04** | ✅ `RELEASED` mốc cuối: `WorkCenter.tsx` **16:50:52** · `tests/t17-…` **16:58:54** · ⛔ **đóng băng mã từ 16:50:52** ✓ Cổng vùng S04: `tsc` 0 · `eslint` 0 · hồi quy **985·984 pass·FAIL 0** · 7/7 probe **exit 0** ✓ |
| **GIAO DIỆN** | ⛔ **KHÔNG bị ảnh hưởng** — 3 việc user giao **đang chạy đúng** trên `dist` **16:54:44** (⚠️ đã nghiệm thu `TEST-D81`) ✓ |

### 📏 THEO DÕI `Q-MANIFEST-01` (phương án A) — ĐO LÚC **17:04**: ⏳ **CHƯA BUILD LẠI** (⚠️ chờ S01)

| Phép đo (17:04:28) | Kết quả |
|---|---|
| `MANIFEST_SHA256.txt` mtime | **16:54:34** ⇒ ⚠️ **CHƯA sinh lại** |
| `dist` mtime | **16:54:44** ⇒ ⚠️ **CHƯA build lại** |
| Dòng trỏ tên CŨ (`t16-work-filter-sort-assign`) | **1** (dòng **6968**) — ⚠️ vẫn còn ✓ |
| Dòng trỏ tên MỚI (`t17-work-filter-sort-assign`) | **0** ✓ |
| `node scripts/verify-full-release.mjs` | 🔴 **EXIT 1** — «Manifest tham chiếu file thiếu: `tests/t16-work-filter-sort-assign.test.mjs`» (⚠️ **đúng như dự kiến**, ⛔ chưa phải lỗi mới) ✓ |

**⇒ KẾT LUẬN**: ⏳ **đang chờ S01 chạy chuỗi build theo phương án `A`** (⚠️ user đã chốt `A` lúc 17:03 · S04 đã gửi nguồn sinh manifest + dòng sai ở `CN106`) ⇒ ⭐ S04 **sẽ tự chạy lại cổng này** ngay khi `manifest`/`dist` có mtime mới để **xác nhận `EXIT 0`** ✓
**ℹ️ S04 ⛔ KHÔNG chạm** `MANIFEST_SHA256.txt` (⚠️ sản phẩm build của S01) — ⛔ không tự sinh để ⛔ tránh hai phiên ghi chồng ✓
