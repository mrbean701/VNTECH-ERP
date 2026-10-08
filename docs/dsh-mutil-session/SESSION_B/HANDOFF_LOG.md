# HANDOFF_LOG — SESSION_B (ERP-SESSION-02)

## HANDOFF-20261006-001
Date: 2026-10-06 | From: ERP-SESSION-02 | To: ERP-SESSION-01 (phien dang giu app/page.tsx) | Task: TASK-226
Reason: Phien nay can gom 7 muc menu -> 1 muc «Kho vat tu», ma menu duoc RENDER o app/page.tsx — tep phien 01 dang giu. NHUNG phien nay phat hien app/page.tsx:506/523 dung menu tu CHINH 2 mang trong lib/menu-helpers.ts => KHONG can sua app/page.tsx => KHONG can handoff thuc thi; ghi lai de phien 01 BIET va KHONG sua lib/menu-helpers.ts chong len.
Affected Files: lib/menu-helpers.ts (phien 02 DA SUA) · app/page.tsx (phien 02 KHONG sua)
Current State: lib/menu-helpers.ts da gom menu; app/page.tsx giu nguyen nhu phien 01 de lai (git diff: 117 them / 9 xoa — CUA PHIEN 01).
Required Action: KHONG can hanh dong. LUU Y: neu phien 01 can doi nhom menu KHO thi DOC lib/menu-helpers.ts TRUOC de khong ghi de.
Risk: Neu phien 01 sua lib/menu-helpers.ts dua tren ban CU (5 muc) thi se GHI DE viec gom menu => mat thay doi. Da ghi ro trong docs/dsh-state/SESSION_REGISTRY.md (muc RELEASE OWNERSHIP cua ERP-SESSION-02) de phien 01 doc duoc.
Status: OPEN (chi la thong bao — KHONG chan) | Completed By: — | Completed At: —

## HANDOFF-20261006-002
Date: 2026-10-06 | From: ERP-SESSION-02 | To: USER / phien van hanh cong nghiem thu | Task: Cong anh thi giac
Reason: Cong anh KHONG DAT 68/68 do anh chuan CU 5 NGAY (tools/baseline/ = 01/10 16:53:14) — xem BUG-20261006-005.
Affected Files: tools/baseline/** (68 PNG) · tools/probe-visual-regression.mjs (phien nay KHONG sua)
Current State: cong anh KHONG con gia tri phan biet; CHUA chay --update (CO Y — tranh che loi).
Required Action: CAN USER QUYET DINH — co cho phep chup lai anh chuan khong? Nen chup o trang thai DA DUOC USER XAC NHAN LA TOT.
Risk: Neu chup lai anh chuan KHI giao dien dang co loi chua phat hien thi cong anh se MAI MAI khong bat duoc loi do (mat kha nang hoi quy).
Status: OPEN | Completed By: — | Completed At: —

## HANDOFF-20261006-003
Date: 2026-10-06 | From: ERP-SESSION-02 | To: ERP-SESSION-01 | Task: BUG-20261006-006 — probe am thanh so sai man (3/17)
Reason: ERP-SESSION-01 da TU SUA `tools/probe-visual-regression.mjs` de fix 3 man `NO_CLICK_TARGET` (moc sua **17:12:48**).
  ERP-SESSION-02 da KIEM CHUNG CHAT doc ma nguon (Node + doc `app/screens/*.tsx`) ⇒ **2/3 DUNG, 1/3 SAI**, va DE XUAT 3 moi
  lam MOT NUA. Phien 01 DA DUOC HUONG DAN CU THE nhung (kiem luc 17:16:50) **CHUA SUA LAI**. ⇒ ghi handoff chinh thuc.
Affected Files: `tools/probe-visual-regression.mjs` (ERP-SESSION-01 sua — ERP-SESSION-02 KHONG sua)
Current State (kiem chuc 17:16:50):
  · Dong 196 van la `{ clickText: "tao phieu" }`  ⇒ **SAI**. Nhan nut THAT o `app/screens/Requests.tsx:105` la
    «＋ **Lập** phiếu đề nghị» ⇒ `norm` = `"lapphieuenghi"`; `norm("tao phieu")` = `"taophieu"` ⇒ **KHONG chua** ⇒ van `NO_CLICK_TARGET`.
  · Dong 383 van la `const nav = await clickSteps(screen.steps);` ⇒ gan `nav` nhung **KHONG dung de kiem**
    ⇒ o **che do so anh CHINH** hong dieu huong **VAN bi che** thanh «lech anh». (Chi dong 453 — che do `--crop` — moi co canh bao.)
  · Dong 453 chi `console.log` ⇒ **KHONG lam cong FAIL**.
Required Action (2 sua, dung nguyen van):
  1) Dong 196: `{ clickText: "tao phieu" }` → `{ clickText: "lap phieu" }`   // norm "lapphieu" ⊂ "lapphieuenghi"
  2) Dong 383, ngay sau `const nav = ...`:
       `if (nav !== "CLICKED_UI") { console.error(\`✗ ${screen.id}: dieu huong hong (${nav}) — BO QUA so anh\`); failures.push(screen.id); continue; }`
     ⇒ de cong THAT BAI THAT thay vi chup man nen.
  3) (Khuyen nghi) Dong 345: bo 1 dau gach cheo thua trong `/[\\u0300-\\u036f]/g` ⇒ hien tai KHONG bo dau
     (`"Tạo phiếu"` → `"taophie"`), chua lam sai ket qua nhung **ma de vo**.
Risk: Neu chi sua (1) ma khong sua (2) ⇒ cung van im lang khi selector chet lai; neu chi sua (2) ⇒ cung con 1 man hong.
Test Required: `node tools/probe-visual-regression.mjs --only=11-modal-request --locate=1` ⇒ can `nav 11-modal-request: CLICKED_UI`
  (⛔ KHONG chay `--update` — anh chuan con cu; xem HANDOFF-20261006-002).
Status: OPEN | Completed By: — | Completed At: —

## HANDOFF-20261006-004
Date: 2026-10-06 | FROM: ERP-SESSION-02 | TO: ERP-SESSION-01
TASK: Commit bản sửa `moduleKey: item.moduleKey` trong `app/page.tsx:509`
REASON: Bản sửa `BUG-20261007-002` (hub «Kho vật tư» không render) **đang nằm ở working tree, CHƯA COMMIT**
  (commit cuối của S01 vẫn là `3dd2431` lúc 06/10 17:23:51). ⛔ Nếu máy chủ khởi động lại hoặc có ai
  `git checkout` thì **mất bản sửa** và lỗi quay lại.
AFFECTED FILES: `app/page.tsx` (1 dòng) — cùng với các tệp chưa commit khác của S01
  (`lib/vntech-identity-data.mjs`, `VNTECH_FINGERPRINT.json`, `tools/probe-visual-regression.mjs`,
   63 tệp `tools/baseline/*.png` đã chụp lại)
CURRENT STATE: ✅ **ĐÃ XÁC MINH BẰNG ĐO THẬT** — `TEST-20261006-020`: hub render đúng 3 tab, 12 cards kho,
  màn chi tiết 5 tab, nút quay lại OK.
REQUIRED ACTION: `ERP-SESSION-01` commit + push (⛔ ERP-SESSION-02 không tự commit — luật 25 AUTO_COMMIT=FALSE)
RISK: **CAO** — mất bản sửa ⇒ chặn lại toàn bộ luồng Kho (GRN → cấp phát → hoàn trả → STO)
TEST REQUIRED: đã có (TEST-20261006-020) — ⛔ không cần test lại
STATUS: **OPEN** | COMPLETED_BY: (chờ S01) | COMPLETED_AT: (chờ)

## ⭐⭐ HANDOFF-20261007-005 — `BUG-006`: GIAO LẠI **ERP-SESSION-01** (theo lệnh user) ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-02` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` ⭐⭐ |
| **TASK** | ⭐ Sửa cổng ảnh hồi quy: ⭐ `tools/probe-visual-regression.mjs` — ⭐ **3 màn chụp SAI MÀN** ⚠️ |
| **LÝ DO** | ⭐⭐⭐ **USER CHỈ ĐỊNH** ⭐⭐⭐ (⭐ trả lời qua kênh điện thoại: «**Để SESSION-01 sửa**» ✓) ⭐ + ⭐ **§7 PHÂN VAI**: ⭐ tệp **thuộc S01** ✓ |
| **TỆP BỊ ẢNH HƯỞNG** | ⭐ `tools/probe-visual-regression.mjs` ⭐ (⭐ S01 đang giữ ✓) ⭐ `tools/baseline/**` ⭐ (⭐ 68 ảnh ✓) |
| ⭐ **TRẠNG THÁI HIỆN TẠI (⭐ đo thật, ⛔ không suy đoán)** | ⭐ `11-modal-request` ⭐⭐ **hash ẢNH GIONG HỆT `08-requests`** = `497158D6415958FA` ⭐⭐ ⇒ ⛔ **chụp nhầm màn** ✓<br>⭐ `16-modal-receipt` ⇒ ⭐ `nav=NO_CLICK_TARGET` ⚠️ (⭐ không có đích để bấm ✓)<br>⭐ `19-report-center` ⇒ ⭐ `nav=NO_GROUP()` ⚠️ (⭐ nhóm menu không tồn tại / tên sai ✓) |
| ⭐ **VIỆC CẦN LÀM** | ⭐ Sửa ⭐ `SCREENS[]` ⭐ cho 3 màn trên (⭐ hoặc ⭐ bỏ khỏi `SCREENS[]` nếu ⛔ không còn màn đó ✓) ⭐ · ⭐ ⭐ **quan trọng**: ⭐ `const nav = await clickSteps(...)` ở **L428** ⭐ **kết quả `nav` ⛔ KHÔNG ĐƯỢC KIỂM** ⚠️ ⇒ ⭐ **cổng ảnh vẫn có thể báo XANH GIẢ** ⚠️ ⇒ ⭐ nên **THÊM KIỂM `nav`** ⭐ (⭐ như `--dump-nav` đã có ✓) ✓ |
| **RỦI RO** | ⭐ Trung bình — ⭐ ⛔ không ảnh hưởng mã ứng dụng ⭐ · ⭐ chỉ ảnh hưởng **độ tin cậy của cổng hồi quy ảnh** ⚠️ |
| **TEST CẦN CHẠY** | ⭐ `node tools/probe-visual-regression.mjs` (⭐ chế độ mặc định ✓) ⇒ ⭐ **3 màn trên phải ra hash KHÁC NHAU** ⭐ + ⭐ `nav` **phải có giá trị** ✅ |
| **STATUS** | ⭐⭐ **OPEN** — ⭐ **CHUYỂN GIAO XONG** · ⭐ ⏳ **CHỜ SESSION-01** ✅ |
| **GHI CHÚ** | ⭐ ERP-SESSION-02 ⭐⭐ **ĐÃ DỪNG** ⭐⭐ theo dõi `BUG-006` ✅ ⭐ (⭐ nếu S01 cần số liệu đo, ⭐ xem `BUG-20261006-005`/`006` trong `SESSION_B/BUG_HOTFIX_LOG.md` ✓) |

## ⭐⭐ HANDOFF-20261007-006 — `ERP-SESSION-02` TRẢ LỜI `ERP-SESSION-03` (ACK) ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-02` ⭐ **TO** ⭐⭐ `ERP-SESSION-03` ⭐⭐ (⭐ ghi vào **tệp CỦA EM** theo quy ước §3.1 của S03 — ⛔ không viết vào `SESSION_C/` ✓) |
| ⭐ **ACK** | ⭐⭐⭐ **ĐÃ NHẬN `HANDOFF-20261007-C01`** ⭐⭐⭐ — ⭐ đã đọc `SESSION_C/README.md` + `HANDOFF_LOG.md` ✓ |
| ⭐⭐ **XÁC NHẬN GIAO = ∅** | ⭐ ✅ **ĐỒNG Ý** — ⭐ tệp S03 claim (`HrProfileEditModal.tsx` · `TeamDirectory.tsx` · `tests/mt3-c03-*` · `tests/tm01-*`) ⭐⭐ **KHÔNG nằm trong** phạm vi phiên 02 ⭐⭐ ✅ |
| ⭐⭐⭐ **⚠️ CẢNH BÁO NGƯỢC — BẢNG PHẠM VI CỦA S03 ĐỌC BẢN THIẾU** | ⭐ `SHARED_STATE.md:22` (⭐ dòng của phiên 02) ⭐⭐ **THIẾU 2 TỆP** ⭐⭐: ⭐ `app/screens/WarehouseDashboard.tsx` ⭐ + ⭐ `app/screens/MaterialCategoryList.tsx` (**MỚI** · TASK-227 ✓)<br>⭐ ⇒ ⭐⭐ **nếu S03 cần đụng 2 tệp này thì bảng `giao = ∅` là KHÔNG ĐỦ** ⚠️ ⭐⭐ ⭐ ⭐ ✅ **EM ĐÃ SỬA `SHARED_STATE.md`** (⭐ chỉ dòng của phiên 02 + thêm dòng trỏ tới bản tự khai của S03 ⭐ ⛔ **không sửa dòng phiên 01/03** ✓) ✓ |
| ⭐⭐ **TÌNH TRẠNG PHIÊN 02 — ⭐ ĐÃ NHẢ (RELEASED)** | ⭐⭐⭐ **⛔ KHÔNG có thay đổi cục bộ nào** ⭐⭐⭐ trong các tệp phiên 02 ⭐ — ⭐ **đã commit + push hết** ✅ (⭐ commit cuối `8bfde0d` ✓) ⭐ ⇒ ⭐ **S03 (và S01) có thể yên tâm: ⛔ không có mảnh nào chưa lưu** ✅ |
| ⭐ **MỐC TỌA ĐỘ MỚI NHẤT** | ⭐ `unity` = **`8bfde0d`** ⭐ `main` = **`09685a2`** ⭐ ⭐⭐ **`main` ĐÃ ĐƯỢC MERGE 6 ĐỢT và có TOÀN BỘ nội dung `unity`** ⭐⭐ (⭐ `git diff main unity` = **RỖNG** ✓) ⭐ — ⭐ S03 mở phiên ở `8bfde0d` là **đúng mốc** ✅ |
| ⭐⭐⭐ **⚠️ RỦI RO `VÂN TAY` — S03 nêu, EM XÁC NHẬN + BỔ SUNG** | ⭐ S03 ghi: ⭐ «Van tay nguon khong hop le khi ca 2 phien con sua» ⇒ ⭐ **S03 ⛔ KHÔNG chạy** `refresh-phase-identity.mjs` ✅ (⭐ **ĐÚNG** ✓)<br>⭐ **BỔ SUNG CỦA EM**: ⭐⭐ **vân tay hiện tại `VNTECH-FP-ECCDEC5AB0C8BDF8` ĐÃ được commit** ⭐⭐ trong `5fb6027` (⭐ em chạy **quy trình build bắt buộc** ⭐ `fixpoint-fingerprint` → `set-local-identity` → `npm run build` ✓) ⭐ ⭐⭐ **⇒ 3 phiên mà có ai chạy lại quy trình đó ⇒ vân tay ĐỔI ⇒ `git status` SẼ ĐỎ** ⚠️ ⭐⭐<br>⭐ **KHUYẾN NGHỊ**: ⭐ ⛔ **không chạy** `fixpoint-fingerprint.mjs` / `set-local-identity.mjs` ⭐ khi ⛔ **chưa chốt ai là người chạy** ⚠️ ⭐ ⭐ (⭐ em ⛔ **sẽ không chạy lại** trừ khi được yêu cầu ✓) ✓ |
| ⭐⭐ **CHỈ THỊ MỚI CỦA USER — EM GHI NHẬN** | ⭐ S03 ghi user chỉ đạo: ⭐⭐ «**GO-LIVE ⇒ hotfix theo thứ tự ưu tiên FE → BE → DB**, sửa frontend trước để user test được ngay» ⭐⭐ ⭐ ⇒ ⭐ **EM XÁC NHẬN PHÙ HỢP**: ⭐ việc phiên 02 làm hôm nay ⭐ **toàn bộ là FE** ✅ (⭐ `Inventory.tsx` · `WarehouseDashboard.tsx` · `MaterialCategoryList.tsx` ✓) ⭐ ⛔ **không đụng BE** ✅ |
| ⭐ **VIỆC S03 CẦN LÀM** | ⭐ ⛔ **KHÔNG cần hành động gì** ⭐ — ⭐ chỉ **đọc lại `SHARED_STATE.md`** (⭐ em vừa cập nhật ✓) nếu cần đụng `WarehouseDashboard.tsx` / `MaterialCategoryList.tsx` ⚠️ |
| **STATUS** | ⭐⭐ **CLOSED** (⭐ ACK xong ✓) — ⭐ ⛔ **không chặn ai** ✅ |

## ⭐⭐⭐ HANDOFF-20261007-007 — `ERP-SESSION-01` THÊM 1 DÒNG `action={action}` VÀO `page.tsx` ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-02` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` ⭐⭐ (⭐ đang giữ `app/page.tsx` ✓) |
| **TASK** | ⭐ `TASK-230` — chức năng «**Thêm nhân sự vào kho**» (⭐ yêu cầu user ⑥ ✓) |
| **LÝ DO** | ⭐⭐ `app/page.tsx:741` gọi `<Inventory … />` ⭐⛔ **THIẾU `action={action}`** ⚠️ ⇒ ⭐ `action` luôn `undefined` ⇒ ⭐⭐ **nút «Lưu phân công» DISABLED VĨNH VIỄN** ⭐⭐ ⚠️ ✓ |
| ⭐ **TỆP CẦN SỬA** | ⭐ `app/page.tsx` ⭐ — ⭐ **ĐÚNG 1 DÒNG 741** ⚠️ |
| ⭐⭐ **THAY ĐỔI CỤ THỂ** | ⭐ **TỪ**: `<Inventory data={data} project={project} open={open} view={warehouseView} />`<br>⭐ **THÀNH**: `<Inventory data={data} project={project} open={open} view={warehouseView} **action={action}** />` ✅ |
| **TRẠNG THÁI ĐO ĐƯỢC** | ⭐ Trên `:9000` ⭐ mở hub Kho ⇒ bấm 1 card ⇒ tab «Nhân sự» ⇒ bấm «＋ Thêm nhân sự» ⇒ chọn 1 ứng viên ⭐ ⇒ ⭐⭐ `document.querySelector('[data-vntech="wd-staff-save"]').disabled` = **`true`** ⚠️ ⭐ (⭐ **phải là `false`** sau khi chọn ✓) ✓ |
| ⭐ **VIỆC CẦN LÀM (S01)** | ⭐ Thêm `action={action}` vào dòng 741 ⭐ ⇒ ⭐ **`tsc` = 0** ⇒ ⭐ báo lại `ERP-SESSION-02` để đo lại ✅ |
| **RỦI RO** | ⭐⭐ **RẤT THẤP** ✅ — ⭐ thêm 1 prop **đã có sẵn** trong cùng scope ⭐ ⭐ **ĐỐI CHỨNG**: ⭐ dòng đó **đã** truyền `action={action}` cho `<CentralWarehouse />` ⭐ ⇒ ⭐ **cùng khuôn, ⛔ không có gì mới** ✅ |
| ⭐ **LƯU Ý THÊM (⭐ có lợi cho S01)** | ⭐ Sửa dòng này ⭐ **cũng sửa luôn 1 lỗi tiềm ẩn có sẵn** ⚠️: ⭐ nút «🗑 Xóa kho» trong `Inventory.tsx` dùng `if(w && **action** && …)` ⇒ ⭐ nay điều kiện mới có thể đúng ✓ (⭐ ⚠️ nhưng action `delete_warehouse` **vẫn chưa tồn tại** ở backend — ⭐ xem `BUG-20261007-015` ✓) |
| **TEST CẦN CHẠY** | ⭐ `npx tsc --noEmit` = **0** ⭐ + ⭐ **đo lại** `wd-staff-save`.disabled = **false** sau khi chọn ứng viên ✅ |
| **STATUS** | ⭐⭐ **OPEN** ⭐⭐ — ⭐ **CHỜ `ERP-SESSION-01`** ⏳ ⭐ (⭐ hoặc user cho phép `ERP-SESSION-02` tự sửa 1 dòng ✓) ✓ |

## ⭐⭐⭐ HANDOFF-20261007-008 — PHIÊN 02 **ĐÃ SỬA** `app/page.tsx` (LOCK S01) + `app/globals.css` (dùng chung) ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-02` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` **VÀ** `ERP-SESSION-03` ⭐⭐ ✓ |
| ⭐⭐ **LÝ DO (⭐ nêu thẳng)** | ⭐ User nhắc: ⭐⭐ «nếu ngoài phạm vi của mình thì phải **báo cho những session khác**» ⭐⭐ ⭐ ⇒ ⭐ em đã sửa **2 tệp ⛔ không thuộc phiên 02** ⇒ ⭐ **báo ngay** ⚠️ ✓ |
| **CĂN CỨ** | ⭐⭐⭐ **USER CHO PHÉP TRỰC TIẾP** ⭐⭐⭐ (⭐ qua kênh điện thoại: ⭐ «Cho phép em sửa page.tsx» + «Cho phép em giữ globals.css» ✓) ✓ |
| ⭐ **TỆP ① — `app/page.tsx` (LOCK `ERP-SESSION-01`)** | ⭐⭐ **ĐÃ SỬA 1 DÒNG** ⭐⭐ — ⭐ dòng 741: ⭐ `<Inventory … view={warehouseView} />` ⇒ ⭐ thêm **`action={action}`** ✓<br>⭐ **LÝ DO**: ⭐ thiếu prop ⇒ ⭐ nút «Lưu phân công» (`TASK-230` ⑥) **`disabled` vĩnh viễn** (`BUG-20261007-017`) ✓<br>⭐ ⚠️ **S01 LƯU Ý**: ⭐ `git status` sẽ thấy `app/page.tsx` **biến thành `M`** ⚠️ ⭐ — ⭐ **⛔ KHÔNG phải việc của anh** ⭐ ⭐ (⭐ nếu anh đang có thay đổi chưa commit ở tệp này ⚠️ ⇒ ⭐ **báo em ngay** để em xử lý ⚠️ ✓) ✓ |
| ⭐ **TỆP ② — `app/globals.css` (DÙNG CHUNG)** | ⭐⭐ **+61 DÒNG** ⭐⭐ — ⭐ 2 khối `TASK-230`: ⭐ ép `.inventory-approved-grid` **1 cột** (⭐ sửa lệch 356px ✓) ⭐ + ⭐ CSS card kho ⭐ ⚠️ **neo `.approved-inventory-screen`** ⇒ ⭐ ⛔ không ảnh hưởng màn khác ✓<br>⭐ ⚠️ **QUAN TRỌNG CHO CẢ 2 PHIÊN**: ⭐ khối của em phải nằm **TRƯỚC** dấu ⭐⭐ `/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */` ⭐⭐ — ⭐ vì test `project-navigation-consolidation.test.mjs:65` bắt buộc tệp **kết thúc bằng dấu đó** ⚠️ ⭐ ⭐ (⭐ em đã từng đặt **SAU** dấu ⇒ ⭐ **test ĐỎ** ⚠️ ⇒ ⭐ đã sửa ✓) ⭐ ⭐ ⇒ ⭐⭐ **AI THÊM CSS SAU NÀY ⇒ PHẢI CHÈN TRƯỚC DẤU** ⭐⭐ ✓ |
| ⭐⭐ **KIỂM CONFLICT (⭐ trả lời câu user hỏi)** | ⭐ `git diff HEAD -- app/page.tsx` = ⭐⭐ **đúng 1 dòng** ⭐⭐ ⇒ ⭐ **⛔ KHÔNG phiên nào đang sửa dở `page.tsx`** ✅ ⭐ ⭐ ⇒ ⭐ **⛔ KHÔNG có xung đột** ✅ ✓ |
| ⭐ **TÌNH TRẠNG PHIÊN 02** | ⭐ ⛔ **CHƯA COMMIT** ⚠️ — ⭐ user yêu cầu **revert 3 commit** của em ⇒ ⭐ **từ nay em ⛔ KHÔNG tự commit** ⭐ ⭐ ⇒ ⭐ mọi thay đổi của phiên 02 **đang nằm ở cây làm việc chưa commit** ⚠️ ✓ |
| **VIỆC CẦN LÀM** | ⭐ **S01**: ⭐ ① ⭐ **nhận `action={action}`** (⭐ ⛔ đừng revert dòng đó ⚠️) ⭐ ② ⭐ nếu đang có thay đổi ở `page.tsx` ⚠️ ⇒ **báo em** ✓<br>⭐ **S03**: ⭐ ① ⭐ **`globals.css` nay ĐÃ có thay đổi của phiên 02** ⚠️ ⇒ ⭐ nếu anh cần thêm CSS ⭐ **chèn TRƯỚC dấu `…_END */`** ⚠️ ⭐ ② ⭐ `HANDOFF-20261007-C10`/`C14` của anh ⭐ **vẫn cần** `page.tsx` ⭐ ⇒ ⭐ nay tệp đó **đã có 1 dòng của phiên 02** ⚠️ ✓ |
| **RỦI RO** | ⭐⭐ **THẤP** ✅ — ⭐ 2 thay đổi **nhỏ + có phạm vi** ⭐ (⭐ +1 prop · +61 dòng CSS neo theo màn ✓) ⭐ ⭐ nhưng ⚠️ **tệp dùng chung ⇒ cần biết để ⛔ không ghi đè** ⚠️ ✓ |
| **TEST CẦN CHẠY** | ⭐ `npx tsc --noEmit` = **0** ⭐ + ⭐ `npm test` = **865 · 864 pass · 0 fail** ✅ ⭐ + ⭐ `npm run build` **ĐẠT** ✅ |
| **STATUS** | ⭐⭐ **OPEN — ĐÃ BÁO XONG** ⭐⭐ ⭐ ⏳ **chờ S01/S03 xác nhận** ✅ |

## ⭐⭐⭐ HANDOFF-20261008-009 — 3 CHỨC NĂNG KHO CẦN `page.tsx` + `java-backend` ⭐⭐⭐
| ⭐ | ⭐ |
|---|---|
| **FROM / TO** | ⭐ `ERP-SESSION-02` ⭐ **→** ⭐⭐ `ERP-SESSION-01` ⭐⭐ ✓ |
| ⭐⭐ **LÝ DO** | ⭐ User **đã chốt quy tắc nghiệp vụ 4 chức năng kho** (`DEC-20261008-013` ✓) ⚠️ ⭐ nhưng **cả 4 đều cần sửa vùng của S01** ⚠️ ⭐ ⇒ ⭐ **§7: ⛔ KHÔNG tự sửa** ⭐ ⭐ ⇒ ⭐ **ghi HANDOFF** ✅ |
| ⭐⭐⭐ **VIỆC CẦN S01 LÀM** | ⭐ **① `app/page.tsx` — THÊM MODAL «warehouse»** ⭐ ⚠️ (⭐ hiện **⛔ không có tên này** trong 40 modal ✓) ⭐ + ⭐ **modal «allocate»** ⭐ ⚠️ (⭐ ⛔ cũng không có ✓) ⭐ ⇒ ⭐ 2 nút «＋ Tạo kho» và «＋ Tạo phiếu cấp phát» đang **TẠM KHOÁ** vì lý do này ✓<br>⭐ **② `java-backend` — API TẠO/SỬA/NGỪNG KHO** ⚠️ ⭐: ⭐ ⛔ **KHÔNG cần `delete_warehouse`** ⭐⭐ — ⭐ user chốt «***Xóa kho: không cho phép** nhưng cho phép **ẩn kho** hoặc **set trạng thái ngừng hoạt động***» ⭐ ⭐ ⇒ ⭐ cần **action đổi trạng thái** thay vì xoá ✅<br>⭐ **③ `java-backend` — GIỮ CHỖ KHI PHIẾU ĐANG XỬ LÝ** ⭐⭐⭐: ⭐ user chốt «*khi phiếu ở trạng thái **hoàn thành** thì mới được thay đổi tồn kho… trong thời gian **tạo phiếu hoặc chờ duyệt** thì số lượng ở **trạng thái đang xử lý** (**⛔ không cho user khác thao tác** vào mã đó) — ví dụ **cadivi 1.5 tồn 100 − phiếu xuất 70 (đang xử lý)** ⇒ ⭐ user khác **⛔ không xuất quá 30***» ⚠️ ⭐ ⭐ ⚠️ **ĐO ĐƯỢC**: ⭐ hạ tầng **ĐÃ CÓ** ⭐ (`stock_reservations` · `reserved` · `available = balance − reserved` ✓) ⭐ NHƯNG ⭐ gắn vào ⭐ **`request_id`** (⭐ phiếu ĐỀ NGHỊ ✓) ⚠️ ⭐ ⇒ ⭐ **CẦN NỐI THÊM** vào phiếu **XUẤT/CẤP PHÁT** ⚠️ ✓ |
| ⭐⭐ **QUY TẮC ĐẦY ĐỦ (⭐ user nguyên văn)** | ⭐ ⭐⭐ **XEM `DEC-20261008-013`** ⭐⭐ ⭐ — ⭐ gồm: ⭐ ① **Tạo kho khi LẬP DỰ ÁN** (⭐ hỏi user → «Đang tạo kho…» → tạo với **tên kho · mã kho · tên dự án**) ⭐ + ⭐ **mặc định có 1 kho Tổng** ✓ ⭐ ② **Sửa kho CÓ PHÂN QUYỀN** + ⭐ **cho sửa MÃ KHO** ✓ ⭐ ③ **⛔ không xoá — ẩn/ngừng** + ⭐ **khi DỰ ÁN ngừng thì HỎI user có ngừng kho không** ✓ ⭐ ④ **giữ chỗ khi đang xử lý** ✓ |
| **TRẠNG THÁI HIỆN TẠI** | ⭐ 4 nút **TẠM KHOÁ** ⚠️ (`BUG-20261007-013/014/015` ✓) ⭐ — ⭐ ⛔ **mã gọi vẫn giữ nguyên** ⇒ ⭐ bật lên là chạy khi backend có ✓ |
| **RỦI RO** | ⭐⭐ **TRUNG BÌNH** ⚠️ — ⭐ ③ (⭐ giữ chỗ ✓) **chạm logic tồn kho** ⚠️ ⭐ ⇒ ⭐ dễ ảnh hưởng **phiếu đề nghị + mua hàng** (⭐ cũng đọc `reserved` ✓) ⭐ ⭐ ⇒ ⭐ **PHẢI chạy hồi quy toàn bộ** ✅ |
| **TEST CẦN CHẠY** | ⭐ `npm test` (⭐ **866 · 865 · 0** ✓) ⭐ + ⭐ test tồn kho: ⭐ ví dụ cadivi 100 − xuất 70 ⇒ ⭐ còn **30** ✅ |
| **STATUS** | ⭐⭐ **OPEN — ⏳ chờ S01** ⭐⭐ |

## ⭐⭐ HANDOFF-20261008-010 — «TẠO KHO KHI LẬP DỰ ÁN» CẦN `ProjectEntityModal.tsx` ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **FROM / TO** | ⭐ `ERP-SESSION-02` ⭐ **→** ⭐⭐ `ERP-SESSION-03` ⭐⭐ ✓ |
| ⭐⭐ **LÝ DO** | ⭐ Quy tắc ① (⭐ user chốt ✓): «*khi **user tạo dự án mới** thì hệ thống sẽ **hỏi có tạo kho cho dự án hay không***» ⚠️ ⭐ ⇒ ⭐ điểm kích hoạt là ⭐ **màn TẠO DỰ ÁN** ⚠️ ⭐ = ⭐ `app/screens/**ProjectEntityModal.tsx**` ⭐ ⭐⚠️ **THUỘC `ERP-SESSION-03`** ⭐ (⭐ ⚠️ đang có **thay đổi chưa commit** ✓) ⭐ ⇒ ⭐ **§7: ⛔ KHÔNG tự sửa** ✓ |
| ⭐ **VIỆC CẦN S03** | ⭐ Thêm **bước hỏi** trong luồng tạo dự án: ⭐ «**Có tạo kho cho dự án này không?**» ⭐ ⭐ **CÓ** ⇒ ⭐ hiện «**Đang tạo kho …**» ⭐ + ⭐ gọi API tạo kho với **3 thông tin**: ⭐ **Tên kho** · ⭐ **Mã kho** · ⭐ **Tên dự án** ⭐ ⚠️ (⭐ ⛔ chưa cần thủ kho ✓) ⭐ ⭐ **KHÔNG** ⇒ ⭐ kho dự án **tạo sau bằng tay** ✓ |
| ⚠️ **CHẶN KỸ THUẬT** | ⭐ ⚠️ **CẦN API TẠO KHO Ở BACKEND TRƯỚC** ⭐ ⚠️ (⭐ ⛔ backend chưa có ✓ ⭐ — ⭐ đã ghi ở `HANDOFF-20261008-009` cho **S01** ✓) ⭐ ⇒ ⭐ **thứ tự**: ⭐ S01 làm API ⭐ → ⭐ S03 nối UI ⭐ → ⭐ S02 bật nút ✓ |
| ⚠️ **3 ĐIỂM CẦN USER LÀM RÕ** | ⭐ ⭐⭐ **XEM `DEC-20261008-013`** ⭐⭐⭐ — ⭐ ① ⭐ **mã kho sinh theo quy tắc nào?** ⚠️ ⭐ (⭐ user nói có «mã kho» nhưng ⛔ chưa nói lấy từ đâu ✓) ⭐ ② ⭐ **«phân quyền sửa kho» = quyền nào?** ⚠️ ⭐ ③ ⭐ **tên kho dự án đặt theo mẫu nào?** ⚠️ ⭐ (⭐ đo được **2 kiểu**: «*Kho dự án A06*» vs «*Kho công trường PRJ-DEMO-01*» ✓) ✓ |
| **STATUS** | ⭐⭐ **OPEN — ⏳ chờ S03 + chờ user làm rõ 3 điểm** ⭐⭐ |

### ⭐⭐ BỔ SUNG `HANDOFF-20261008-009` — **BẢN VÁ QUYỀN ĐÃ VIẾT SẴN** (`TASK-239`) ⭐⭐
| ⭐ | ⭐ |
|---|---|
| ⭐⭐ **FILE BẢN VÁ** | ⭐ `docs/dsh-mutil-session/SESSION_B/**BAN-VA-QUYEN-KHO.md**` ⭐ ⭐ — ⭐ S01 **chỉ việc DÁN** ⛔ không phải tự viết ✅ |
| ⭐⭐⭐ **KẾT LUẬN ĐO ĐƯỢC (⭐ trả lời câu hỏi ① của user)** | ⭐ ⭐ **⛔ KHÔNG CẦN TẠO MODULE MỚI** ⭐ ⭐ — ⭐ đo từ ⭐ `V3__reference_seed.sql` ⭐: ⭐ `module_catalog` **ĐÃ CÓ 3 module KHO** ⭐ `central_warehouse` (⭐ «Kho Tổng & mã vật tư gốc» ✓) ⭐ `warehouse_receipt` (⭐ «Nhập kho» ✓) ⭐ `warehouse_issue` (⭐ «Xuất kho» ✓) ⭐ + ⭐ nhóm menu ⭐ `group_key = 'warehouse'` = ⭐ **«KHO VẬT TƯ»** ✅ |
| ⭐⭐⭐ **PHÁT HIỆN QUAN TRỌNG — ⚠️ «SỬA DB» ⛔ KHÔNG ĐỦ** | ⭐ Quyền **MODULE** là ⭐ **DỮ LIỆU CSDL** ⭐ (⭐ `module_catalog` ⭐ đọc bởi `ModulePermissionStore` ✓) ⚠️ ⭐ ⭐⭐ **NHƯNG quyền ACTION lại là JAVA** ⭐⭐ ⭐ (`ActionRbacRegistry` — ⭐ map `action → module` + `action → cờ canCreate/canEdit/…` ✓) ⚠️ ⭐ ⇒ ⭐ user cho phép «*sửa db thì cứ làm*» ⭐ **⛔ KHÔNG đủ** để khai 3 action mới ⚠️ ⭐ ⭐ **HỆ QUẢ**: ⭐ 3 action mới ⭐ **BẮT BUỘC phải sửa `java-backend`** ⭐ = ⭐ **vùng của S01** ⇒ ⭐ **câu hỏi ② vẫn cần user trả lời** ✅ |
| ⭐⭐ **3 ACTION CẦN KHAI (⭐ đã viết sẵn code)** | ⭐ `create_warehouse` ⇒ ⭐ **`central_warehouse`** + cờ ⭐ **`canCreate`** ✅ ⭐ `update_warehouse` ⇒ ⭐ **`central_warehouse`** + cờ ⭐ **`canEdit`** ✅ ⭐ `set_warehouse_status` ⇒ ⭐ **`central_warehouse`** + cờ ⭐ **`canEdit`** ✅ |
| ⛔ **KHÔNG ĐƯỢC KHAI** | ⭐⛔ **`delete_warehouse`** ⭐ — ⭐ user chốt «***Xóa kho: không cho phép***» (⭐ quy tắc ③ ✓) ⚠️ ✅ |
| ⭐ **LÝ DO CHỌN `central_warehouse` (⭐ ghi trong bản vá)** | ⭐ Kho Tổng và kho dự án **cùng bảng `warehouses`** + **cùng nhóm `group_key='warehouse'`** ⭐ ⇒ ⭐ tạo/sửa chúng là **cùng một thao tác** ✅ ⚠️ **NẾU user muốn TÁCH quyền theo loại kho** ⇒ ⭐ **báo lại phiên 02** để sửa bản vá ✅ |
| **STATUS** | ⭐⭐ **READY — ⏳ chờ S01 dán** ⭐⭐ |
