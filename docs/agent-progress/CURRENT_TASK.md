# CURRENT_TASK.md — TRẠNG THÁI BÀN GIAO (MT3 §9)

> ⚠️ **Phiên sau ĐỌC TỆP NÀY TRƯỚC KHI LÀM BẤT CỨ GÌ.** Cập nhật: 27/09/2026 *(sau khi user gỡ toàn bộ điểm chặn + yêu cầu «tất cả menu → tab»)*.
> ⛔ **KHÔNG COMMIT · KHÔNG PUSH · KHÔNG TẠO MIGRATION.**

## 🖥️ TRẠNG THÁI PHỤC VỤ *(user đang kiểm)*
| Cổng | Vai trò | Trạng thái |
|---|---|---|
| **`:9000`** | **CỔNG VÀO CHUẨN** *(proxy → UI `:3000` + API `:18081`)* | ✅ **HTTP 200** · `/api/system` **HTTP 200** |
| `:3000` | UI MỚI *(`npm run start` = `vinext start`, phục vụ `dist/server/index.js`)* | ✅ MỞ |
| `:18081` | Java API | ✅ MỞ |
| `:8787` | UI Node/JS **CŨ** *(`scripts/local-server.mjs`)* — ⛔ **KHÔNG chứa mã Next.js** | ⚠️ **tự khởi động lại (watchdog)** |

### ⚠️⚠️ QUY TRÌNH BẮT BUỘC SAU MỌI THAY ĐỔI `app/**`/`lib/**` — **bài học lớn nhất của phiên**
> 🔴 **User từng báo «giao diện gần như chẳng có thay đổi nào đáng kể» — vì tôi ⛔ BỎ QUA 3 bước này.**
1. **Dừng ĐÚNG tiến trình đang giữ `.local-data`** *(kiểm dòng lệnh = `scripts/local-server.mjs` TRƯỚC khi `Stop-Process`)*
   ⚠️ Nó **tự khởi động lại** ⇒ phải dừng rồi **chạy build NGAY**.
2. `node tools/gd-cycle.mjs "<nhãn>"` ⇒ **`dist/` mới có thay đổi**. *(⛔ `npm run build` trần báo `Source fingerprint không hợp lệ`)*
3. **Khởi động lại**: `npm run start` *(UI `:3000`)* + `node tools/cutover-proxy.mjs --port 9000 --ui-port 3000 --api-port 18081`
⚠️ **`cutover-proxy.mjs:34` mặc định `--ui-port 8788`** *(mà `:8788` ⛔ không chạy)* ⇒ **PHẢI truyền `--ui-port 3000`**.

## ✅ ĐÃ HOÀN TẤT *(vòng 27/09/2026 — sau khi user gỡ toàn bộ điểm chặn)*
| # | Việc | Bằng chứng |
|---|---|---|
| 🎯 | **«TẤT CẢ MENU ITEM → TAB»** *(yêu cầu trực tiếp, **QUAN TRỌNG NHẤT**)* — **thanh tab 8/8 nhóm** *(cơ chế dùng chung `hubTabsFor(active)`)*. ⚠️ **thanh menu GIỮ NGUYÊN mục con** *(xem «SỐT SÁT» bên dưới)* | **7 test ĐẠT** |
| **#9** | `Requests.tsx` dùng `PermissionGuard` theo **khuôn có sẵn** *(15/40 màn đã có prop `permission`)* | **6 test ĐẠT** |
| **#4** | `<aside>` màn Kho → **hộp thoại** *(⛔ KHÔNG viết lại dòng 1000 ký tự — chèn **2 mốc ngắn**)* | `tsc` 0 |
| **#3** | ✅ **XONG** — 8 tệp nghi ngờ đều là **component con/modal/hộp trượt** do **màn cha** gọi ⇒ ⛔ **không sửa mù** | đọc từng tệp |
| **#5 · #8 · #11** | đối chiếu mã thật — **0** mã trạng thái thô · có quy tắc ẩn ở ≥1024px · nút thừa đã bỏ | đo thật |
| **A2** | Tìm vật tư theo **TÊN PHỤ (alias)** | **10 test** |
| **A1②** | **TỰ TỪ CHỐI khi quá SLA 72h** — `rejectOverdueApprovals` + móc ở `director_pending_approvals` | **7 test biên** |
| **A1① · A5 · A7 · A3 · A6 · C2** | sắp xếp SLA · kho không xoá · xoá probe · ghi hồ sơ · nút tự ẩn | ✅ |
| 🔧 | **Sửa vận hành**: build + UI mới + proxy | ✅ |

## 📍 CURRENT
| | |
|---|---|
| **CURRENT PHASE** | **GĐ1 (FRONTEND)** — khép kín |
| **CURRENT TASK** | ⛔ **CHƯA BẮT ĐẦU** — xem REMAINING |
| **CURRENT STEP** | — |
| **NEXT ACTION** | Chờ user xác nhận giao diện; nếu có chỗ lệch thì sửa tiếp |

## ⏳ REMAINING — **3 VIỆC**
1. 🛑 **CHỜ USER CHỐT** *(lượt 27/09)*: thanh menu
   - **(a)** ⛔ **giữ mục con** *(nhóm cha bấm để mở ra — mẫu **đang chạy ổn**)* — **đang áp dụng**
   - **(b)** bỏ mục con, chỉ còn nhóm cha ⇒ bấm là mở thẳng màn có thanh tab
   ⛔ Tôi **đã thử (b) và SAI NHẦM CHỖ** (xem mục «SỐT SÁT LẦN 2» bên dưới) ⇒ **đã hoàn tác**. ⛔ Không tự quyết vì đổi cả điều hướng hệ thống.
2. 👁️ **Chờ USER xác nhận bằng mắt** tại `http://127.0.0.1:9000` — ⛔ **KHÔNG tự tuyên bố `MT3 = COMPLETE`**.
3. 🛑 **QUYẾT ĐỊNH CẦN USER** — xem 🔴 bên dưới.

## 🔴 **LỖI CÓ SẴN PHÁT HIỆN KHI LÀM THANH TAB** (⛔ KHÔNG PHẢI DO TÔI TẠO RA)
| | |
|---|---|
| **Hiện tượng** | `view="dashboard"` bị **DÙNG TRÙNG 2 LẦN**: `workMenuItems.work_dashboard` **VÀ** `warehouseMenuItems.warehouse_dashboard` *(đo: `view=dashboard x2`)* |
| **Vì sao lỗi** | `app/page.tsx:521-525` set **CẢ HAI** biến khi nhận `"dashboard"`:<br>`setWorkView(... \|\| view==="dashboard" ? view : null)` **và** `setWarehouseMenuView(view==="dashboard" ? view : null)` |
| **Hậu quả** | bấm *Dashboard* của một nhóm ⇒ **bật luôn màn Dashboard của nhóm kia** ⇒ view **dính chéo** và **TỒN ĐỌNG** khi chuyển nhóm *(vì `activateModule` chỉ set `null` cho các view khác)* |
| ⚠️ **Phạm vi** | **LỖI CÓ SẴN trong MENU HIỆN TẠI** — ⛔ **KHÔNG** do thanh tab. Sửa `activateModule` = **đụng điều hướng lõi** ⇒ cần user quyết |
| **Vì sao 3 nhóm tab còn lại vẫn TẮT** | bấm tab `my_work`/`warehouse` lúc này sẽ **mở 2 màn cùng lúc** ⇒ **tab sai nguy hiểm hơn không có tab** |

### 🛠️ **ĐỀ XUẤT SỬA (CHỜ USER DUYỆT — ⛔ chưa thực hiện)**
**Sửa tối thiểu, KHÔNG đổi hành vi có chủ đích** — chỉ chặn **rò trạng thái qua nhóm**:
```js
// app/page.tsx — trong activateModule, SAU khi set các view (ngay trước setActive):
const nextGroup = modules.find((m) => String(m.key) === String(next))?.groupKey;
if (nextGroup !== "my_work")        setWorkView(null);            // ⛔ rò sang nhóm khác
if (nextGroup !== "warehouse")      setWarehouseMenuView(null);
if (nextGroup !== "purchasing")     setSupplierPartnerView(null);
```
**Tác dụng**:
1. ✅ Mỗi nhóm vẫn giữ **đúng** màn con như cũ *(bấm Công việc › Dashboard **vẫn** ra Dashboard Công việc)*.
2. ✅ `dashboard` hết dính chéo ⇒ **bật lại được tab** cho `my_work` + `warehouse` (bỏ chú thích trong `HUB_TAB_GROUP_KEYS`).
3. ⛔ **Không** chạm backend, **không** đổi lược đồ, **không** đổi quyền.
⚠️ **Rủi ro còn lại**: `reports` vẫn phải TẮT (nhãn trùng 2 cặp trong `modules` — đo được) ⇒ cần `reportsMenuChildren` như `my_work`.
🧪 **Kèm sẵn**: `tests/mt3-ui-29-view-collision-diagnostic.test.mjs` (3 ca) — **GHI NHẬN** va chạm hiện tại + **CẢNH BÁO** nếu hết va chạm thì xoá bài + mở lại tab.

## 🔴🔴 SỐT SÁT LẦN THỨ 2 — **SUỐT SÁT NHẤT CỦA PHIÊN NÀY**
| | |
|---|---|
| **Tôi làm gì** | Hiểu thêm 1 bước: **gom mục con khỏi thanh menu** *(chỉ giữ nhóm cha)* |
| **⛔ Sai ở đâu** | ① **SUY ĐOÁN** — user **chưa từng yêu cầu** bỏ mục con · ② **SỬA NHẦM CHỖ** |
| **Sai chỗ thế nào** | Tôi sửa hàm `permissionMenuStructure` — nhưng hàm đó dùng cho **BẢNG PHÂN QUYỀN** (`page.tsx:3175` + `:3209`), **⛔ KHÔNG phải thanh menu** *(thanh menu là `app/page.tsx:614-621`)* |
| **Hậu quả** | gom mỗi nhóm thành 1 hàng ⇒ **quản trị viên KHÔNG còn cấp/tước quyền cho mục con** ⇒ **phá RBAC** *(vi phạm RULE 13)* |
| **Đã làm gì** | ✅ **hoàn tác** + **ghi chú trong mã chặn sửa lại** + dựng lại bản đúng `VNTECH-FP-E75918D7574EAD55` · 567 tệp · `tsc` 0 · contract **659 = 658/0/1** · `:9000` HTTP 200 + đăng nhập 200 |
| **Bài học** | 🔴 **ĐỪNG TIN MÃ «CÓ MẶT» LÀ ĐỦ** — phải **truy đường đi chức năng** tới nơi hàm **THẬT SỰ** được dùng. Hàm này dùng ở **3 nơi**; nếu chỉ nhìn nơi đầu tiên thì tôi đã giao bản **phá hệ thống phân quyền**. |

## 🧪 TEST STATUS — **TẤT CẢ XANH**
| Cổng | Kết quả |
|---|---|
| **`mvn -f java-backend/pom.xml test`** | ✅ **`Tests run: 74 · Failures: 0 · Errors: 0`** · **BUILD SUCCESS** |
| `tools/verify-java-compile.ps1` | ✅ **115 tệp · 0 lỗi** |
| `npx tsc --noEmit` | ✅ **`EXIT=0`** |
| contract | ✅ **`tests 659 · pass 658 · fail 0 · skipped 1`** *(653 + **6 test #9** mới)* |
| `npm run test:regression` | ✅ **`pass 69 · fail 0`** |
| `npm run verify:css-baseline` | ✅ **ĐẠT** · `dead classes=0 · dead vars=0` |
| `npm run verify:master-baseline` | ✅ **ĐẠT** |
| **`gd-cycle`** | ✅ **ĐẠT** · `VNTECH-FP-0240EC6549A3B58F` · **566 tệp** · `BUILT ARTIFACT VALIDATION: ĐẠT` |
| Dịch vụ `:9000` | ✅ **HTTP 200** · **đăng nhập HTTP 200** |

## 🗄️ DATABASE STATUS
⛔ **KHÔNG đổi lược đồ** · ⛔ **0 migration**. MySQL `vntech_erp` ⛔ không bị đụng.

## 🔴🔴 BÀI HỌC LỚN NHẤT PHIÊN — **«50/74 bài test đổ khi thêm 1 lớp test mới»**
| | |
|---|---|
| **Triệu chứng** | Thêm `ApprovalSlaAutoRejectTest` ⇒ **50/74 bài** của **lớp KHÁC** đổ với **`409`** ở `setup` |
| ✅ **Bằng chứng tách bạch** | Chạy bộ test **⛔ không có** lớp đó ⇒ **67/67 ĐẠT** ⇒ **mã ⛔ KHÔNG gây lỗi** |
| ⛔ **2 cách sửa SAI đã thử** | ① `DELETE` ở `@AfterEach` *(tưởng dữ liệu sót)* · ② `@Transactional` rollback — **⛔ CẢ HAI KHÔNG HIỆU QUẢ** |
| 🔍 **GỐC THẬT** | Lớp test **thiếu `@AutoConfigureMockMvc`** *(mọi lớp khác đều có)* ⇒ `@AutoConfigureMockMvc` **đổi KHOÁ CACHE CONTEXT** của Spring ⇒ sinh **biến thể context THỨ HAI** ⇒ **H2 in-memory dùng chung sống lâu hơn** ⇒ lớp sau thấy `users` đã có dòng ⇒ `AuthUseCase:83` `isSetupComplete()=true` ⇒ `setup` **409** |
| ✅ **CÁCH SỬA ĐÚNG** | Cho lớp test dùng **ĐÚNG cấu hình context** như mọi lớp khác ⇒ **74/74 ĐẠT** |
📌 **⇒ QUY TẮC**: lớp test mới **PHẢI** dùng đúng bộ annotation context của dự án *(`@SpringBootTest` + `@AutoConfigureMockMvc` + `@ActiveProfiles("test")` + `@DirtiesContext(BEFORE_EACH_TEST_METHOD)`)*. ⛔ Thiếu 1 cái là **phá cả bộ test**.

## 🧠 BÀI HỌC CHỐNG KẾT LUẬN SAI *(⛔ phiên sau BẮT BUỘC tuân)*
1. ⛔ **Không kết luận từ `grep` khi dòng siêu dài** — đọc bằng `IndexOf`/`Substring`. *(Từng sai: «không có chuông thông báo».)*
2. ⛔ **Khi kết luận «có/không được gọi»**: tìm **cả `*.ts` LẪN `*.tsx`** và **cả `app/` LẪN `lib/`**. *(Từng sai: «duyệt trong modal chưa nối».)*
3. ⛔ **Không kết luận «thiếu» từ MỘT token** — thử nhiều từ đồng nghĩa + **đọc mã thật**.
4. ⛔ **Không lấy LỚP CSS / CHUỖI VĂN BẢN làm bằng chứng chức năng** — phải chứng minh **đường đi chức năng** *(import → gọi hàm → hoặc props)*. *(ĐÃ sai ở ma trận #6.)*
5. ⛔ **Không cộng dồn `target/surefire-reports` mà bỏ qua THỜI GIAN** *(giữ báo cáo của test đã xoá)*.
6. ⛔ **`tests/*.test.mjs` là JavaScript THUẦN** — ⛔ không viết chú thích kiểu TS.
7. ⛔ **Không dùng hàm «trông có vẻ sẵn có» mà chưa grep xác nhận**.
8. ⛔ **KHÔNG tuyên bố «xong» khi CHƯA build lại + chưa khởi động lại server** — **user ⛔ không thấy gì đâu**. *(Bài học đắt nhất phiên này.)*
9. ⛔ **`groupKey` ≠ `key` của module** — `my_work` là **tên NHÓM**, ⛔ không phải tên màn.
10. ⛔ **`hubTabsFor(active)`** trả `null` cho nhóm 1 mục — **đúng thiết kế**, ⛔ không phải lỗi.
11. 🔴🔴 **`Get-ChildItem -Include` KHÔNG có đường dẫn ⇒ TRẢ VỀ RỖNG.** Dùng `-Path 'dir\*'` hoặc `-Recurse`.
    ⇒ Lỗi này khiến tôi tưởng `PermissionGuard` **không tồn tại** (thực tế **CÓ**: `app/components/ui/PermissionGuard.tsx`)
    ⇒ và suýt **bỏ sót hạng mục #9**. **ĐÃ SỬA #9.** ⛔ Đừng bao giờ kết luận «không có» từ `-Include` rỗng.
12. 🔴 **Mẫu `grep` quá hẹp ⇒ kết luận sai.** Tôi đã nói *«0/40 màn có prop `permission`»* bằng mẫu `permission\??:\s*\(`;
    thực tế **15/40** màn khai kiểu **`permission: Row`** (không có dấu `(`) ⇒ **đã đính chính**.
    ⇒ Khi kết luận «không có X», **thử nhiều cách khai báo khác nhau** (có/không `?`, có/không dấu ngoặc, có/không kiểu).
13. ⚠️ PowerShell: `$f:` trong chuỗi ⇒ bị hiểu là **tham chiếu ổ đĩa** ⇒ dùng `${f}:`. Và `for { } | Select` ⇒ lỗi *"empty pipe element"*.
14. 🔴🔴 **ĐỪNG TIN MÃ «CÓ MẶT» LÀ ĐỦ** — phải **truy đường đi chức năng** tới nơi hàm **THẬT SỰ** được dùng, và **đếm SỐ NƠI dùng**.
    `permissionMenuStructure` dùng ở **3 chỗ**; tôi chỉ nhìn chỗ đầu ⇒ sửa nhầm vào **bảng phân quyền** ⇒ suýt **phá RBAC** *(đã hoàn tác)*.
    ⛔ Đừng **suy đoán** ý user rồi hành động khi thay đổi đó **đụng hệ thống phân quyền / nghiệp vụ**.

## 📁 HỒ SƠ PHIÊN NÀY
`TASK-MT3-UI-26.md` *(«tất cả menu → tab» + sửa vận hành)* · `TASK-MT3-UI-27.md` *(rà 12 hàng ma trận + #9)* · `TASK-MT3-BE-22.md` *(A2/A3/A5/A6/A7)* · `TASK-MT3-BE-23.md` *(A1 kế hoạch + thi hành)* · `TASK-MT3-UI-24.md` *(C2 + A1①)* · `TASK-MT3-UI-20.md` *(đối chiếu 12 hàng ma trận + đính chính #6)* · `TASK-MT3-DB-02.md` *(báo cáo nghiệm thu + 16 tiêu chí)* · `docs/dsh/MT3-UI-MATRIX.md` *(ma trận chính thức, **đã cập nhật 27/09**)* · `docs/dsh/MT3_USER_DECISIONS.md` *(11 quyết định user, nguyên văn)*
