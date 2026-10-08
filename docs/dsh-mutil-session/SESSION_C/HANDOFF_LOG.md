# HANDOFF_LOG — SESSION_C (ERP-SESSION-03)

> Kênh giao tiếp chính thức giữa các phiên (theo `docs/dsh-state/00_GOAL_S4_MAPPING.md` §3).
> ⛔ Phiên 03 chỉ ghi vào **file của mình**; tệp SHARED ghi theo READ → MODIFY CAREFULLY → PRESERVE → WRITE → VERIFY.
> Mọi mục phải có: FROM · TO · TASK · LÝ DO · TỆP · TRẠNG THÁI ĐO ĐƯỢC · VIỆC CẦN LÀM · RỦI RO · STATUS.

---

## HANDOFF-20261007-C01 — THÔNG BÁO MỞ PHIÊN 03 + CHỐT RANH GIỚI TỆP (gửi cả 2 phiên)

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` (phiên 03 — mới mở 2026-10-07 16:54:34) |
| **TO** | ⭐⭐ `ERP-SESSION-01` + `ERP-SESSION-02` ⭐⭐ |
| **TASK** | `TASK-20261007-C01` (hotfix CCCD) · `TASK-20261007-C02` (audit Tổ đội) |
| **LÝ DO** | User mở phiên thứ 3 và chỉ đạo: **hotfix GO-LIVE theo thứ tự FE → BE → DB**, ưu tiên sửa frontend trước để user test được ngay. Phiên 03 cần **khai báo LOCK** để 2 phiên còn lại ⛔ không sửa chồng. |
| **TỆP PHIÊN 03 GIỮ (LOCK)** | `app/screens/HrProfileEditModal.tsx` · `app/screens/TeamDirectory.tsx` · `tests/mt3-c03-hr-profile-edit.test.mjs` (**mới**) · `tests/tm01-team-list.test.mjs` |
| **⛔ TỆP PHIÊN 03 KHÔNG ĐỤNG** | `app/page.tsx` (của S01) · `java-backend/**` (của S01) · `lib/menu-helpers.ts` · `lib/warehouse-hub.ts` · `app/screens/Inventory.tsx` (của S02) |
| **KIỂM CHỨNG GIAO = ∅** | Đối chiếu `SHARED_STATE.md` §«Đang giữ» ngày 2026-10-06: tệp phiên 03 claim **KHÔNG** nằm trong danh sách của S01/S02 ⇒ **giao rỗng** ✅ |
| **VIỆC CẦN LÀM (S02)** | Không cần hành động. Chỉ lưu ý: phiên 03 sửa **phần RENDER** của `app/screens/TeamDirectory.tsx` — nếu S02 cần đổi menu/nhóm chứa màn Tổ đội thì sửa `lib/menu-helpers.ts` như cũ, **không chồng** lên file của phiên 03. |
| **VIỆC CẦN LÀM (S01)** | ⚠️ **CÓ 1 VIỆC**: xem `HANDOFF-20261007-C02` (nợ kỹ thuật BE). |
| **RỦI RO** | ⚠️ **Vẫn treo cảnh báo cũ của S01**: «Van tay nguon khong hop le khi ca 2 phien con sua» ⇒ phiên 03 **⛔ KHÔNG chạy** `refresh-phase-identity.mjs` / `fixpoint-fingerprint.mjs`. Phiên 03 chỉ chạy `tsc` + `node --test` (không đụng fingerprint). |
| **STATUS** | `OPEN` (thông báo — ⛔ không chặn ai) |

---

## HANDOFF-20261007-C02 — NỢ KỸ THUẬT BE: `update_user` bất đối xứng validate `fullName`

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` (đang giữ `java-backend/**`) ⭐⭐ |
| **TASK** | Liên quan `BUG-20261007-C01` — chưa làm, **cố ý để lại** theo luật FE-first của user |
| **LÝ DO** | Phiên 03 đã vá **FE** (đủ để user test ngay). Nhưng **gốc BE vẫn còn**: `updateUser` validate **bất đối xứng**. |
| **TRẠNG THÁI ĐO ĐƯỢC (đọc mã, có dòng)** | `java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java`<br>• `:109-110` `employeeCode` — **CÓ** fallback `sv(target,"employeeCode")` khi payload rỗng<br>• `:113-114` `username` — **CÓ** fallback `sv(target,"username")`<br>• ⭐ `:115-116` `fullName` — ⛔ **KHÔNG có fallback** ⇒ rỗng là **400** ngay<br>• `:124-125` gộp 5 điều kiện vào **MỘT** thông điệp chung «Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc.» ⇒ client ⛔ **không biết trường nào thiếu** |
| **VIỆC CẦN LÀM (đề xuất, ⛔ chưa được phép làm)** | ① Cho `fullName` fallback `sv(target,"fullName")` như 2 trường kia (nhất quán); **HOẶC** ② tách validate theo từng trường để thông điệp **nêu đích danh** trường thiếu. Chọn ① hay ② là **quyết định nghiệp vụ** ⇒ chờ user chốt. |
| **RỦI RO** | Trung bình. Hiện tượng user thấy **đã hết** nhờ bản vá FE, nhưng nếu có client khác (probe/E2E/route JS `scripts/system-route.mjs:3099-3113` — **cùng dạng thiếu fallback `fullName`**) gửi payload thiếu `fullName` thì **lỗi tái diễn y nguyên**. |
| **TEST REQUIRED** | Nếu S01 làm: test HTTP thật `update_user` với `{userId, employeeCode}` (thiếu `fullName`) ⇒ kỳ vọng **200 giữ nguyên tên cũ** (phương án ①) hoặc **400 nêu đích danh «Họ tên»** (phương án ②). |
| **STATUS** | `OPEN` (chờ user chốt phương án + chờ S01 nhận việc) |

---

## HANDOFF-20261007-C03 — ⚠️ PHỐI HỢP BUILD/DỊCH VỤ + VÂN TAY NGUỒN (gửi cả 2 phiên)

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` + `ERP-SESSION-02` ⭐⭐ |
| **TASK** | `TASK-20261007-C03` (audit UTF-8 → phải build lại vì tệp mẫu nằm trong artifact) |
| **LÝ DO** | Sửa `public/templates/*.csv` ⇒ **bản phục vụ vẫn là tệp CŨ** (`dist/client/templates/*` = 241 B/1175 B, ⛔ không BOM) ⇒ buộc phải `gd-cycle` + **dừng/khởi động lại** 2 dịch vụ (thao tác **dùng chung**). |
| **ĐÃ LÀM (đo được)** | ① dừng **đúng PID**: Node UI `14952` + proxy `18520` — ⛔ **không** dừng Java `:18081`, ⛔ **không** dùng `Stop-Process node`. ② `gd-cycle` «SESSION 03 UTF8 CSV TEMPLATE BOM» → migration `drizzle/0331_…`, **PREFLIGHT · FINGERPRINT · ARTIFACT ĐẠT**, exit 0. ③ khởi động lại: `:8787` (job `pwsh-72`) + `:9000` (job `pwsh-73`) → **HTTP 200 / 200**. |
| ⭐ **VÂN TAY NGUỒN MỚI (dùng số này)** | ⭐ **`VNTECH-FP-B28418CE305E837E`** · source **722 files** · HEAD lúc build `8bfde0d` |
| ⛔ **TỰ NHẬN SAI LẦM (ghi để phiên khác ⛔ không lặp)** | Tôi chạy `node tools/fixpoint-fingerprint.mjs` **để KIỂM TRA** — ⛔ nhưng tệp này **GHI** định danh ⇒ tạm thời đổi vân tay sang `VNTECH-FP-6D015E959F55D73A`, **lệch** với artifact đang phục vụ. **Đã khắc phục** bằng `gd-cycle` lần 2 (nay khớp: `B28418CE…`). ⇒ ⭐ **LUẬT ĐỀ XUẤT**: ⛔ không chạy `fixpoint-fingerprint.mjs` như lệnh chỉ-đọc; muốn refresh định danh thì **luôn** đi qua `gd-cycle`. |
| **VIỆC CẦN LÀM (S01/S02)** | ⛔ **Không cần hành động.** Lưu ý 2 điều: ① nếu các phiên **còn tệp sửa dở**, vân tay sẽ **lệch lại** ⇒ build lại khi tất cả đã dừng (đúng cảnh báo cũ của S01). ② `:8787`/`:9000` nay do **tiến trình của phiên 03** phục vụ (job `pwsh-72`/`pwsh-73`); nếu phiên khác cần build, xin **dừng đúng PID** như trên. |
| **RỦI RO** | Trung bình — có **~2 phút gián đoạn** 2 cổng trong lúc build (⚠️ đã ghi rõ, ⛔ không che). |
| **ĐỀ XUẤT CHƯA LÀM (cần user quyết)** | Thêm **cảnh báo ở đầu `tools/fixpoint-fingerprint.mjs`** (và/hoặc đổi tên) để người sau ⛔ không tưởng là lệnh chỉ-đọc. `tools/**` là mã **dùng chung** ⇒ ⛔ phiên 03 không tự sửa. |
| **STATUS** | `OPEN` (thông báo — ⛔ không chặn ai) |

---

## HANDOFF-20261007-C04 — NỢ FE trong `app/page.tsx`: LOẠI HỢP ĐỒNG DỰ ÁN còn in mã thô

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` (đang giữ `app/page.tsx`) ⭐⭐ |
| **TASK** | Nối tiếp `TASK-20261007-C05` / `BUG-20261007-C04` |
| **LÝ DO** | Phiên 03 đã hợp nhất bảng nhãn về **MỘT nguồn** (`lib/status-labels.ts`) và vá hết chỗ rò mã thô **trong `app/screens/**`**. ⛔ Còn **1 chỗ trong `app/page.tsx`** — tệp **S01 đang giữ** ⇒ phiên 03 ⛔ **không tự sửa**, chỉ ghi handoff. |
| **TRẠNG THÁI ĐO ĐƯỢC** | `app/page.tsx:3110` — ô chọn ghi xuống CSDL **MÃ ANH**: `main` · `addendum` · `other` (nhãn trong `<option>` là «Hợp đồng chính» · «Phụ lục hợp đồng» · «Hợp đồng khác»). ⇒ chỗ nào trong `page.tsx` in thẳng `row.contractType` sẽ hiện **`main`/`addendum`** ra UI. |
| **VIỆC CẦN LÀM (ngắn, ⛔ chỉ đổi CHỮ HIỂN THỊ)** | ① `grep -n "contractType" app/page.tsx` → chỗ nào **in ra UI** thì đổi sang bảng nhãn dùng chung; ② Thêm domain vào `lib/status-labels.ts` — **phiên 03 ⛔ CHƯA thêm** (vì thêm sau khi build sẽ làm **lệch vân tay nguồn**; ⛔ đã cố ý hoàn tác):<br>`contract_type: { main: "Hợp đồng chính", addendum: "Phụ lục hợp đồng", other: "Hợp đồng khác" }`<br>rồi nối `"contract_type"` vào `DOMAIN_LOOKUP_ORDER`; ③ gọi `statusLabel(row.contractType, "contract_type")`; ④ chạy `node --test tests/mt3-c04-status-vi.test.mjs`. |
| **RỦI RO** | Thấp — ⛔ không đổi giá trị lưu CSDL, ⛔ không đổi `<option value>`. |
| **LƯU Ý PHỐI HỢP** | `app/page.tsx` ⛔ **không** được sửa bởi phiên 03. Nếu S01 cần phiên 03 làm cùng thì ghi `HANDOFF` ngược lại. |
| **STATUS** | `OPEN` (chờ S01 nhận việc) |

---

## HANDOFF-20261007-C05 — NỢ FE trong `app/page.tsx`: ƯU TIÊN còn in mã thô (bản dịch thứ 6)

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` (đang giữ `app/page.tsx`) ⭐⭐ |
| **TASK** | Nối tiếp `TASK-20261007-C06` / `BUG-20261007-C05` |
| **LÝ DO** | Khi **mở rộng phạm vi cổng sang `lib/**`**, cổng C04 bắt được **3 chỗ** dùng ternary tự dịch Ưu tiên. Phiên 03 đã vá **2 chỗ trong quyền của mình**; ⛔ chỗ còn lại nằm trong `app/page.tsx` — ⛔ **tệp S01 giữ** ⇒ ghi handoff, ⛔ không tự sửa. |
| **TRẠNG THÁI ĐO ĐƯỢC** | `app/page.tsx` còn ternary kiểu `x === "urgent" ? "Khẩn" : x === "high" ? "Cao" : …` cho Ưu tiên ⇒ mã lạ (`critical` · `low`) rơi về **in MÃ THÔ** hoặc về nhãn SAI. Cổng hiện **in ra mỗi lần chạy**:<br>`⚠️ NỢ ĐÃ GIAO: app/page.tsx — HANDOFF-20261007-C05 — in Ưu tiên bằng ternary (tệp của ERP-SESSION-01)` |
| **VIỆC CẦN LÀM (ngắn)** | ① `grep -n '"urgent"' app/page.tsx` → chỗ nào **hiển thị** Ưu tiên thì đổi sang `statusLabel(x, "priority")` (**domain `priority` đã có sẵn** trong `lib/status-labels.ts`, ⛔ không cần thêm bảng); ② `npm run test:regression` để xác nhận `tests/v217` vẫn xanh (⚠️ **phải build** sau khi sửa — xem cảnh báo dưới); ③ Xoá dòng khỏi `KNOWN_DEBT` trong `tests/mt3-c04-status-vi.test.mjs` (⛔ để lại là **nợ ẩn**). |
| ⚠️ **CẢNH BÁO CHUNG (đã trả giá 2 lần)** | Sửa `lib/**` · `app/**` · `public/**` mà ⛔ **không chạy `gd-cycle`** ⇒ cổng của chính dự án (`tools/verify-ui-build-applied.mjs` qua `tests/v217`) báo **«dist/ CŨ HƠN nguồn»** và `test:regression` **ĐỎ 2 ca**. ⇒ ⭐ **`gd-cycle` là BẮT BUỘC**, ⛔ không phải tuỳ chọn. |
| **RỦI RO** | Thấp — chỉ đổi CHỮ HIỂN THỊ, ⛔ không đổi giá trị lưu CSDL. |
| **STATUS** | `OPEN` (chờ S01 nhận việc) |

---

## HANDOFF-20261007-C06 — `WEEKLY_REPORT_DATA` của SESSION_A **thiếu 6/17 mục §14** (⚠️ chặn gộp báo cáo tuần)

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` ⭐⭐ |
| **TASK** | Phần **LOGGING** của Goal (§14 «Mỗi `WEEKLY_REPORT_DATA.md` phải có section tương ứng» + §15 gộp báo cáo tuần) |
| **LÝ DO** | Goal §15: khi user nói «Tổng hợp báo cáo tuần» thì phải hợp nhất dữ liệu **cả 3 phiên** vào **MỘT** báo cáo. Một phiên thiếu mục thì bước hợp nhất ⛔ **không đối chiếu được chuẩn**. Phiên 03 ⛔ **không được sửa tệp log của phiên khác** (Goal §13) ⇒ **ghi handoff**. |
| **TRẠNG THÁI ĐO ĐƯỢC (07/10/2026 17:34)** | Quét 17 mục bắt buộc trên 3 tệp `docs/dsh-mutil-session/<SESSION>/WEEKLY_REPORT_DATA.md`:<br>⭐ `SESSION_B` — **thiếu 0/17** ✅ · ⭐ `SESSION_C` — **thiếu 0/17** ✅ (phiên 03 vừa chuẩn hoá lại)<br>⛔ `SESSION_A` — **THIẾU 6/17**: `## Completed Tasks` · `## In Progress` · `## UI/UX` · `## RBAC/Workflow` · `## Hotfixes` · `## Important Changes` |
| **VIỆC CẦN LÀM (S01, chỉ sửa TỆP CỦA MÌNH)** | Bổ sung 6 mục còn thiếu vào `SESSION_A/WEEKLY_REPORT_DATA.md` — ⛔ **KHÔNG xoá nội dung đang có**, chỉ **thêm mục** (đúng cách phiên 03 vừa làm: dựng **«PHẦN A — dữ liệu chuẩn hoá»** ở đầu, giữ nguyên nhật ký cũ thành **PHẦN B phụ lục**). ⭐ Có thể chép khuôn từ `SESSION_C/WEEKLY_REPORT_DATA.md` (PHẦN A đủ 17 mục, mỗi mục đều ghi **số ĐO ĐƯỢC**). |
| **RỦI RO** | Thấp — chỉ là **tài liệu**, ⛔ không ảnh hưởng mã sản phẩm, ⛔ **không cần `gd-cycle`**. |
| **GHI CHÚ PHỐI HỢP** | ⛔ Phiên 03 **không** sửa `SESSION_A/**`; ⛔ không đánh dấu task của phiên 01 là DONE. |
| **STATUS** | `OPEN` (chờ S01 nhận việc) |

---

## HANDOFF-20261007-C07 — Cổng `probe-toolbar-vertical.mjs` sinh **8 BÁO ĐỘNG GIẢ** trên hàng DỮ LIỆU nhà cung cấp

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` + `ERP-SESSION-02` ⭐⭐ (⚠️ hoặc **user quyết**) |
| **TASK** | Nối tiếp `TASK-20261007-C10` — yêu cầu user «các nút chức năng CRUD … 1 hàng ngang» |
| **LÝ DO** | Cổng `node tools/probe-toolbar-vertical.mjs` báo **«TỔNG: 8 khối nhiều HÀNG»** ⇒ nếu phiên sau đọc con số đó mà ⛔ không đo lại thì sẽ **"sửa" một thứ ĐANG ĐÚNG** — đúng bẫy tài liệu dự án đã ghi «lần thứ 7 suýt sửa thứ đang đúng». Phiên 03 đã **đo trực tiếp** và chứng minh đó là **báo động giả**. |
| **TRẠNG THÁI ĐO ĐƯỢC** | · Cổng: **14/16 màn = 0 khối**; 2 màn «Nhà cung cấp» + «Danh mục Nhà cung cấp» báo 8 khối — **cả 8 là CÙNG MỘT họ** `.supplier-admin-row` (4 dòng NCC × 2 màn = 8) ⇒ ⛔ không phải 8 khuyết điểm.<br>· Đo trực tiếp `node tools/measure-supplier-row.mjs`: `beCao 44` · `display: grid` · **`autoFlow: column`** · `soCon 12` · mọi ô mẫu **cùng `@603`** ⇒ **12 ô trên MỘT DÒNG THẬT**.<br>· Bối cảnh: `MT2` **đã sửa** họ này `1182×85 (3 hàng) → 1182×59`; nay **44px** ⇒ **tốt hơn**, ⛔ không hồi quy. |
| **VIỆC CẦN LÀM (ngắn, ⛔ thuộc `tools/**` — mã DÙNG CHUNG)** | Trong `tools/probe-toolbar-vertical.mjs`: **bỏ qua khối có `getComputedStyle(el).gridAutoFlow` chứa `column`** (hoặc có > 8 con **cùng `offsetTop`**) — vì đó là **hàng DỮ LIỆU dạng lưới**, ⛔ không phải thanh nút. ⇒ Cổng sẽ hết sinh **báo động giả** cho `.supplier-admin-row`. ⛔ **Phiên 03 KHÔNG tự sửa** (Goal §8: `tools/**` là tệp dùng chung; §41: ⛔ không refactor ngoài phạm vi). |
| **RỦI RO** | Thấp — chỉ là công cụ ĐO, ⛔ không ảnh hưởng sản phẩm. ⚠️ Nếu ⛔ không sửa: mỗi lần chạy cổng sẽ tiếp tục hiện **8 dòng đỏ GIẢ** ⇒ dễ khiến người sau "sửa" CSS đang đúng. |
| **TEST REQUIRED** | Chạy lại `node tools/probe-toolbar-vertical.mjs` ⇒ kỳ vọng **«TỔNG: 0 khối nhiều HÀNG»** (⛔ không được giảm độ phủ màn: phải còn đo đủ số màn như hiện tại). |
| **STATUS** | `OPEN` (chờ S01/S02 hoặc user quyết) |

---

## HANDOFF-20261007-C08 — ⛔ Cổng `probe-responsive-5widths.mjs` **XANH RỖNG** (đo 0 phần tử mà vẫn kết luận ĐẠT)

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` + `ERP-SESSION-02` ⭐⭐ (⚠️ hoặc **user quyết**) |
| **TASK** | Yêu cầu user **«Đảm bảo responsive … nhiều kích thước màn hình»** (MT3 §IV.2) — cổng là bằng chứng duy nhất cho yêu cầu này |
| **LÝ DO** | Cổng in **«✅ ĐẠT … tab cuộn ngang · modal vừa khung · toolbar không vỡ cột dọc»** trong khi **3 phép kiểm đó CHƯA HỀ ĐƯỢC CHẠY**. Đây là **cổng XANH GIẢ** — đúng lớp lỗi dự án đã ghi: *«CỔNG XANH KHÔNG CÓ NGHĨA LÀ KHÔNG CÓ LỖI — cổng chỉ kiểm chiều nó được viết để kiểm»* (`docs/dsh-state/CHECKLIST.md`). |
| **BẰNG CHỨNG ĐO ĐƯỢC** | ① Chạy cổng **3 lần**: không tham số · nhãn «Phiếu đề nghị mua hàng» · nhãn «Quản lý dự án» ⇒ **kết quả Y HỆT NHAU** (cùng `scrollW=329/375/753/1009/1425`, `toolbar 0 nút/0 hàng`, `tab cuộn=null`, `modal=—`) ⇒ tham số nhãn menu **⛔ KHÔNG có tác dụng**.<br>② Mọi dòng đều `toolbar 0 nút/0 hàng` + `tab cuộn=null` + `modal=—` ⇒ **không có phần tử nào được đo**.<br>③ Nhưng kết luận (dòng 164) vẫn khẳng định ĐẠT **cả 4 tiêu chí**. |
| **ROOT CAUSE (đọc mã, có dòng)** | ① **Các phép kiểm là CÓ ĐIỀU KIỆN** — `tools/probe-responsive-5widths.mjs:159-161`: `if (r.hasModal …)`, `if (r.hasTabbar …)`, `if (r.hasToolbar …)` ⇒ khi **không tìm thấy** phần tử thì **không có vấn đề nào được ghi** ⇒ `problems` rỗng ⇒ **ĐẠT**.<br>② **Nhánh chọn menu THẤT BẠI IM LẶNG** — dòng `126-139`: vòng lặp 8 lần, không tìm thấy mục thì **`break`/kết thúc mà ⛔ không báo**; ⛔ không có bước **kiểm chứng đã tới đúng màn**.<br>③ **Câu kết luận không gắn với số đo** — dòng `164` in cứng 4 tiêu chí, ⛔ không nói tiêu chí nào **đã thực sự được kiểm**. |
| **VIỆC CẦN LÀM (ngắn)** | ① Trong `MEASURE`/vòng kiểm: **coi «thiếu mục tiêu» là KẾT QUẢ RIÊNG** — ghi `SKIP`/`KHÔNG ĐO ĐƯỢC` (⛔ không tính là ĐẠT); nếu **mọi** mức rộng đều `!hasTabbar && !hasModal && !hasToolbar` thì **exit 2 (BLOCKED)** thay vì ĐẠT.<br>② Sau khi bấm menu: **kiểm chứng đã tới màn** (so tiêu đề/nội dung chính đổi) ⇒ ⛔ không click im lặng rồi đo màn cũ.<br>③ Câu kết luận chỉ in **các tiêu chí ĐÃ CÓ SỐ ĐO** (vd «đã kiểm: không tràn · bảng cuộn — CHƯA kiểm: tab/modal/toolbar vì không tìm thấy mục tiêu»).<br>④ Đảo `tools/probe-responsive-5widths.mjs` **PHẢI chạy trên ≥1 màn CÓ toolbar + ≥1 màn CÓ dải tab** (vd mở chi tiết 1 phiếu để có `.edm-tabs`) rồi mới kết luận. |
| **RỦI RO** | ⚠️ **TRUNG BÌNH–CAO (trong phạm vi công cụ)**: yêu cầu responsive đang được coi là «đã có cổng» nhưng thực tế **2/4 tiêu chí chưa từng được đo** ở bất kỳ lần chạy nào ⇒ ⛔ **không được dùng cổng này làm bằng chứng «responsive ĐẠT»** cho tới khi sửa. |
| ⭐ **PHIÊN 03 ĐÃ BÙ SỐ LIỆU (tạm)** | Đo THẬT ở **375px** bằng script tạm (đã xoá) trên **10 mục menu đầu**: ✅ **`tràn = 0px` ở MỌI màn** · ✅ **modal chi tiết = 375×900 ĐÚNG KHUNG** (⛔ không vượt `vw`/`vh`) · ✅ toolbar trong modal **1 nút / 1 hàng**. ⚠️ **CÒN CHƯA ĐO ĐƯỢC: dải `.edm-tabs` bên trong modal** (`tab=—` ở mọi lần đo) — ⛔ **không được coi là đã đạt**. |
| **STATUS** | `OPEN` (chờ S01/S02 hoặc user quyết) |

---

## HANDOFF-20261007-C09 — Cổng `probe-task075-attachments.mjs` ca **D2 ĐỎ OAN** (khớp chuỗi quá cứng)

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` + `ERP-SESSION-02` ⭐⭐ (⚠️ hoặc **user quyết**) |
| **TASK** | Nối tiếp `TASK-20261007-C13` — khu vực **«Ảnh và hồ sơ giao hàng»** (lỗi user báo `BUG-20261007-C07`) |
| **LÝ DO** | Chạy cổng: **21/22 ĐẠT · HỎNG `D2`** ⇒ nếu phiên sau tin con số đó thì sẽ **"sửa" mã ĐANG ĐÚNG** (đúng bẫy dự án đã ghi «lần thứ 7 suýt sửa thứ đang đúng»). Phiên 03 đã **đo lại bằng phép đếm dung sai** và chứng minh **D2 đỏ OAN**. |
| **TRẠNG THÁI ĐO ĐƯỢC** | `tools/probe-task075-attachments.mjs:163` đòi khớp **NGUYÊN VĂN**: `src={`/api/files?id=${encodeURIComponent(file.id)}`}` ≥ 2 lần.<br>⭐ Đo trong `lib/ui-shared.tsx`: chuỗi nguyên văn đó **0 lần**; nhưng `/api/files?id=${encodeURIComponent(` xuất hiện **6 lần**, trong đó **3 là thẻ `<img>`**:<br>① dải ảnh `…encodeURIComponent(id)` · ② ô thu nhỏ `…encodeURIComponent(String(file.id))` · ③ xem trước `…encodeURIComponent(String(preview.id))`<br>(3 lần còn lại: 1 `fetch(DELETE)` + 2 thẻ `<a href>` — ⛔ không phải `<img>`)<br>⇒ Ý NGHĨA của ca («≥2 ảnh trỏ đúng endpoint») **ĐÃ THOẢ**; chỉ **cách khớp chuỗi** sai. |
| **VIỆC CẦN LÀM (ngắn, ⛔ thuộc `tools/**` — mã dùng chung)** | Đổi ca D2 từ **so khớp 1 chuỗi nguyên văn** sang **đếm DUNG SAI**: lấy mọi `<img …>` rồi lọc theo `/\/api\/files\?id=\$\{encodeURIComponent\(/` ⇒ `imgs.length >= 2`. ⭐ Phiên 03 đã viết sẵn bộ khớp đúng ở `tests/mt3-c07-attachment-imgs.test.mjs` (ca `C07-1`) để tham chiếu. |
| **RỦI RO** | ⚠️ **TRUNG BÌNH**: cổng đang **ĐỎ** trên khu vực **KHÔNG hỏng** ⇒ (a) gây nhiễu khi GO-LIVE, (b) dễ khiến người sau **sửa mã đang đúng** cho vừa chuỗi. ⚠️ Ngược lại, ⛔ **không** được coi việc này là «đã sửa lỗi ảnh/hồ sơ của user» — chính cổng ghi rõ **GIỚI HẠN: KHÔNG đo phần render của UI**. |
| **TEST REQUIRED** | Chạy lại `node tools/probe-task075-attachments.mjs` ⇒ kỳ vọng **22/22 ĐẠT** (⛔ không giảm độ phủ: vẫn kiểm A1–A4 · B1–B4 · C0–C3 · D1–D6). |
| **STATUS** | `OPEN` (chờ S01/S02 hoặc user quyết) |

---

## HANDOFF-20261007-C10 — Thẻ **KPI** (dashboard): hộp CAO CỐ ĐỊNH + `overflow:hidden` ⇒ **CẮT chữ mô tả** khi nội dung xuống dòng dài

> # ⛔⛔ THU HỒI / HẠ MỨC (vòng 23 · `TASK-20261007-C23` · `TEST_LOG.md §C24`) — ⛔ **ĐỪNG SỬA `.kpi` THEO HANDOFF NÀY**
> **KẾT LUẬN CŨ CỦA TÔI («CẮT chữ mô tả») LÀ ⛔ SAI** — đó là **SUY DIỄN**, ⛔ chưa từng đo **phần tử nào** vượt đáy.
> ⭐ **ĐO LẠI (đo TỪNG CON trong thẻ)**: phần tử **DUY NHẤT** vượt đáy thẻ là **`<i>` RỖNG**, `txt=""`, **cao 4px**, `position: static`,
> vượt **8px / 5px / 5px** — ⭐ chính là **cột của biểu đồ mini TRANG TRÍ**:
> `.kpi-mini-columns i { width:5px; min-height:4px; border-radius:2px 2px 0 0; background:currentColor; opacity:.88 }`
> ⇒ ⛔ **KHÔNG có CHỮ nào bị cắt.** Hiện tượng chỉ là **vài px cuối của hoạ tiết trang trí** bị `overflow:hidden` cắt — **gần như CHẮC CHẮN LÀ CỐ Ý**.
> ⇒ ⛔ **KHÔNG thêm quy tắc `.kpi-grid .kpi .kpi-content p`**, ⛔ **KHÔNG đặt `grid-auto-rows: max-content`**, ⛔ **KHÔNG đụng `.kpi`/`.kpi-grid`**
> vì **⛔ không có lợi ích cho người dùng** mà **có rủi ro đổi bố cục** (Goal §12/§41: ⛔ không sửa thứ ⛔ không hỏng).
> ⚠️ **NGOẠI LỆ DUY NHẤT**: nếu **USER tự nhìn** và nói thấy **chữ** bị hụt ở thẻ KPI ⇒ mở lại handoff này kèm ảnh chụp.
> ⭐ **BÀI HỌC (lần 7 của phiên, đã ghi `SHARED_STATE` §73)**: **`scrollHeight > clientHeight` ⛔ KHÔNG chứng minh «nội dung bị cắt»** —
> phải **đo PHẦN TỬ NÀO vượt** và **phần tử đó có CHỮ hay ⛔ không**.

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` ⭐⭐ (⚠️ vì **`app/page.tsx`** là `LOCK` của S01 — thẻ KPI do tệp đó render) + người giữ **`app/globals.css`/`canonical.css`** |
| **TASK** | Nối tiếp `TASK-20261007-C16` — **máy dò «nội dung bị cắt trong khối»** quét **22 màn** (tìm lớp lỗi của `BUG-20261007-C07`) |
| **PHÁT HIỆN** | Máy dò tìm thấy **25 khối** bị cắt và **TẤT CẢ đều là `<article class="kpi …">`** — ⭐ **⛔ KHÔNG còn loại khối nào khác** trên 22 màn đã quét. |
| **SỐ ĐO ĐƯỢC** | · Trạng thái A (lần quét): `h=203` · **`clientHeight=201` / `scrollHeight=210` ⇒ CẮT 9px** (`kpi-blue`) · 7px (`kpi-green`) · 7px (`kpi-violet`)<br>· Trạng thái B (đo riêng cùng máy, 1440×900 qua `setDeviceMetricsOverride`): `h=200` · **`clientHeight=198 == scrollHeight=198` ⇒ ⛔ KHÔNG cắt**<br>⇒ ⭐ **KẾT LUẬN ĐO ĐƯỢC**: hiện tượng **phụ thuộc BỀ RỘNG/thời điểm** — thẻ KPI **cao cố định** nên khi dòng mô tả **xuống thêm 1 dòng** thì phần cuối **bị CẮT**; khi không xuống dòng thì vừa khít. |
| **CƠ CHẾ** | `.kpi` = `display:flex` · `padding:16px` · **`overflow:hidden`** · chiều cao **cố định** (đo `h=200–203px`, gồm `.kpi-pictogram` 42px + `.kpi-content` 153px) ⇒ ⚠️ **cùng LỚP LỖI với `BUG-20261007-C07`** (nội dung vượt khối bị `overflow:hidden` cắt, ⛔ không có thanh cuộn riêng). |
| ⚠️ **TÔI CHƯA NHÌN ĐƯỢC ẢNH — NÓI THẲNG** | Phiên 03 **không đọc được ảnh** (model hiện tại không nhận đầu vào ảnh) ⇒ tôi **đã chụp** ảnh thẻ KPI nhưng **⛔ không có xác nhận bằng mắt**. Cách phân loại đúng: **RỦI RO CÓ THẬT + ĐÃ ĐO ĐƯỢC MỘT LẦN XẢY RA**, ⛔ **không** khẳng định «chắc chắn thấy chữ bị cắt» khi chưa nhìn. ⚠️ Ai có mắt/ảnh hãy **kiểm 1 phút**: mở dashboard, xem **dòng mô tả cuối** trong thẻ KPI. |
| **VIỆC CẦN LÀM (ngắn)** | ⛔ **KHÔNG** sửa `app/globals.css` / `canonical.css` trong phiên này (⭐ theo **cảnh báo conflict** của user). Chọn **1** trong 2 hướng: ① **Cho thẻ KPI tự cao theo nội dung** (`height:auto` + `min-height:<giá trị hiện tại>`) ⇒ hết cắt mà ⛔ không đổi bố cục khi nội dung ngắn; hoặc ② **Giới hạn số dòng nhưng có chủ ý** (`-webkit-line-clamp` + `title`/tooltip để xem đủ) ⇒ cắt là **CỐ Ý** và ⛔ không mất dữ liệu. ⚠️ Nếu là ② thì phải ghi rõ trong CSS là cố ý (nếu không, máy dò tương lai sẽ báo lại). |
| **RỦI RO** | **THẤP–TRUNG BÌNH**: ⛔ không mất dữ liệu (chỉ là chữ mô tả ở thẻ KPI), nhưng là **màn đầu tiên user nhìn thấy** ⇒ ảnh hưởng cảm nhận chất lượng khi GO-LIVE; và ⚠️ mỗi lần chạy máy dò sẽ **báo lại 25 khối** ⇒ gây nhiễu nếu ⛔ không xử lý hoặc ⛔ không ghi rõ là cố ý. |
| **TEST REQUIRED** | Máy dò của phiên 03 (đã ghi cách chạy trong `TEST_LOG.md §C16`): quét lại 22 màn ⇒ kỳ vọng **⛔ 0 khối bị cắt** (hoặc: các khối bị cắt phải **có ghi chú «cố ý»** trong CSS). |
| ⭐ **BỔ SUNG BẰNG CHỨNG TÁI LẬP (vòng 20, `TEST_LOG.md §C21.3`)** | Quét lại lần 2 (cách đo đúng: mở nhóm bằng `button.nav-parent` + xác nhận tiêu đề màn) ⇒ **SỐ Y HỆT lần 1**: `kpi-blue 201/210` · `kpi-green 201/207` · `kpi-violet 201/207` · (Trung tâm phê duyệt) `171/179` ×4 ⇒ ⭐ **⛔ không phải nhiễu tạm thời** — **rủi ro THẬT và ỔN ĐỊNH**, đáng xử lý trước GO-LIVE. |
| ⭐⭐ **NÂNG MỨC (vòng 21, `TEST_LOG.md §C22.1`) — LỖI HỆ THỐNG, ⛔ KHÔNG PHẢI TỪNG MÀN** | Đo được **MÀN THỨ 3** cùng họ lỗi: «**KPI & hiệu suất nhân viên**» ⇒ `kpi-green 156/164` · `kpi-red 156/164` (**cắt 8px**).<br>⇒ Họ thẻ `.kpi` bị cắt ở **≥ 3 màn**: `Tổng quan điều hành` · `Trung tâm phê duyệt` · `KPI & hiệu suất nhân viên`<br>⭐ **SỬA 1 CHỖ LÀ HẾT CHO CẢ 3+ MÀN**: quy tắc `.kpi` (chiều cao cố định + `overflow:hidden`) — ⛔ **KHÔNG** sửa từng màn riêng lẻ. ⭐ Ưu tiên **cao** vì đây là **các màn có KPI** (màn đầu tiên user nhìn). |
| **STATUS** | `OPEN` (chờ S01 hoặc user quyết) |

### ⭐⭐ CHỐT ROOT CAUSE + CHỖ SỬA + TIỀN LỆ (vòng 22 · `TASK-20261007-C22` · `TEST_LOG.md §C23`)
| ⭐ | ⭐ |
|---|---|
| **ĐO CHUỖI CHA của thẻ `.kpi`** (1440×900, màn Tổng quan điều hành) | dải KPI: **`h=203` · `display:grid` · `gridTemplateRows` GIẢI RA = `203.203px`** (1 hàng) · `kids=4` · **`overflow-y=hidden`**<br>thẻ `.kpi`: **`clientHeight=201` / `scrollHeight=210` ⇒ CẮT 9px** · `min-height` cấu hình 112/122/124/156px · **`overflow:hidden`**<br>cha: `.dashboard-main-column` `display:grid` rows `203.203px 776.922px 311.75px` |
| **ROOT CAUSE (đo được, ⛔ không suy đoán)** | `.kpi` có **`overflow:hidden`** ⇒ theo chuẩn CSS **kích thước tối thiểu tự động = 0** ⇒ hàng của **`.kpi-grid`** (grid) **co xuống vừa khung** thay vì giãn theo nội dung ⇒ **cắt ~8–9px** đáy thẻ.<br>⚠️ **CÙNG CƠ CHẾ** với `BUG-20261007-C07` (modal GRN) — ⭐ **đã có cách vá đã kiểm chứng** (xem dưới). |
| ⭐⭐ **TIỀN LỆ TRONG CHÍNH REPO (⛔ đừng phát minh cách mới)** | Repo **ĐÃ sửa đúng lỗi này cho `.approved-kpi-grid`** (`app/globals.css`):<br>`.approved-kpi-grid .kpi .kpi-content p { white-space:normal!important; overflow:visible!important; text-overflow:clip!important; display:block!important; line-height:1.35!important; min-height:2.7em!important }`<br>⇒ ⭐ **TÁI DÙNG CHÍNH CÁCH ĐÓ cho `.kpi-grid` (mặc định)**: cho mô tả **xuống dòng** + chừa `min-height` ⇒ thẻ đủ chỗ, ⛔ không cắt. |
| **HAI HƯỚNG SỬA (chọn 1 — ⛔ KHÔNG làm cả hai)** | **A. Theo tiền lệ (khuyến nghị)**: thêm quy tắc cho **`.kpi-grid .kpi .kpi-content p`** giống `.approved-kpi-grid` (xuống dòng + `min-height`) ⇒ hết cắt, ⛔ không đổi bố cục lưới.<br>**B. Theo cách phiên 03 đã kiểm chứng ở modal GRN**: đặt **`grid-auto-rows: max-content`** cho **`.kpi-grid`** ⇒ hàng giãn theo nội dung (⚠️ có thể làm dải KPI **cao hơn vài px** ở màn có mô tả dài — cần kiểm 3 màn). |
| ⛔ **CHỖ SỬA ⛔ KHÔNG THUỘC PHIÊN 03** | CSS quy tắc `.kpi`/`.kpi-grid` nằm ở **`app/globals.css`** (CSS **dùng chung**) — và markup dải KPI nằm ở **`app/page.tsx`** (**LOCK của S01**) ⇒ ⛔ phiên 03 **không tự sửa** (theo cảnh báo conflict của user). |
| **TEST REQUIRED (đo được, ⛔ không cảm tính)** | Mở 3 màn và đọc `clientHeight` vs `scrollHeight` của từng `article.kpi` ⇒ kỳ vọng **⛔ 0 thẻ có `scrollHeight > clientHeight + 4`**:<br>· Tổng quan điều hành (`201/210` · `201/207`) · Trung tâm phê duyệt (`171/179` ×4) · KPI & hiệu suất nhân viên (`156/164` ×2) |
| **RỦI RO** | **TRUNG BÌNH**: ⛔ không mất dữ liệu (chỉ cắt **chữ mô tả**) nhưng **3 màn có KPI** — trong đó **Tổng quan điều hành là màn ĐẦU TIÊN** người dùng thấy ⇒ ảnh hưởng cảm nhận chất lượng khi GO-LIVE. | — Cổng `probe-action-registry-coverage.mjs` **ĐỎ do BÁO ĐỘNG GIẢ** (6 action «MÙ QUYỀN» — ⛔ KHÔNG có lỗ hổng phân quyền)

## HANDOFF-20261007-C11 — Cổng `probe-action-registry-coverage.mjs` **ĐỎ do BÁO ĐỘNG GIẢ** (6 action «MÙ QUYỀN» — ⛔ KHÔNG có lỗ hổng phân quyền)

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` + `ERP-SESSION-02` ⭐⭐ (⚠️ hoặc **user quyết**) — ⛔ **KHÔNG gửi cảnh báo CRITICAL** vì đã **bác bỏ bằng mã** (xem §bằng chứng) |
| **TASK** | Nối tiếp `TASK-20261007-C17` — phiên 03 rà lớp «nút chết» ⇒ mở rộng sang lớp **tên `action(...)` gọi backend** ⇒ gặp cổng RBAC **ĐỎ** |
| **PHÁT HIỆN** | `node tools/probe-action-registry-coverage.mjs` → **exit 1** · **«④ ⛔ MÙ QUYỀN (không public · không module · không admin-gated): 6»** = `delete_contract_review` · `list_contract_review` · `log_contract_review` · `open_contract_review` · `save_contract_review` · `work_scope` · kết luận **«CÒN ACTION MÙ QUYỀN … ⇒ phải vá ✗»** ⚠️ ⇒ nếu tin ngay sẽ **báo động BẢO MẬT** (đúng lớp **CRITICAL — AUTHORIZATION BYPASS**). |
| ⭐⛔ **BẰNG CHỨNG BÁC BỎ (đo trong MÃ ĐANG CHẠY, ⛔ không tin tài liệu)** | **① 5 action `*_contract_review` — ĐÃ CÓ CỔNG RBAC** (chỉ ⛔ không khai ở tầng controller):<br>`java-backend/.../ContractReviewUseCase.java` có **5 lần `guard(principal);`** và thân hàm:<br>`private void guard(Principal principal) { rbac.requireActionModule(currentUser(principal), ACTION); }` với `ACTION = "manage_contract_review"` ⇒ ⭐ **cổng dùng chung, chặn Ở SERVER** ✅<br>**② `work_scope` — CHỈ ĐỌC + TỰ GIỚI HẠN**: `SystemController` `case "work_scope"` → `requireCurrentUser(request)` → `opsTaskManagementUseCase.workScope(asOpsTaskPrincipal(cu))`; trong `OpsTaskManagementUseCase`:<br>`WorkScopeService.Scope scope = workScope.scopeOf(cu.id(), cu.role());` ⇒ **chỉ tính phạm vi của CHÍNH người gọi**, ⛔ **không có tham số đích** (⛔ không nhận `departmentId`/`userId` nào) ⇒ **không có gì để phân quyền ngoài việc đã đăng nhập** ✅ |
| **KẾT LUẬN** | ⭐ **⛔ KHÔNG có lỗ hổng phân quyền** ⇒ ⛔ **KHÔNG được sửa `java-backend/**`** (⭐ `LOCK` của S01) và ⛔ **KHÔNG cần cảnh báo CRITICAL**. |
| **VIỆC CẦN LÀM (ngắn, ⛔ thuộc `tools/**` — mã dùng chung)** | Thêm **2 LOẠI HỢP LỆ** vào cổng để ⛔ hết báo động giả:<br>**④ Cổng ở tầng UseCase**: action mà controller `case` gọi một UseCase có `guard(...)`/`rbac.requireActionModule(...)`/`requireRole(...)` trong thân ⇒ **coi là ĐÃ KHAI** (đọc `*UseCase.java` theo tên lớp được gọi trong `case`).<br>**⑤ Đọc CHỈ-ĐỌC TỰ-GIỚI-HẠN**: action chỉ trả dữ liệu **của chính người gọi** (tính từ `cu.id()`/`cu.role()`, ⛔ không có tham số đích) và đã qua `requireCurrentUser` ⇒ **coi là HỢP LỆ** (ghi rõ là loại riêng, ⛔ không gộp vào «public»).<br>⚠️ Giữ nguyên các loại ①②③ và ca ⑤ «thiếu capability» (đang **0** ✅). |
| **RỦI RO** | ⚠️ **TRUNG BÌNH–CAO (trong phạm vi công cụ)**: cổng **ĐỎ** trên một khu vực **KHÔNG hỏng** ⇒ (a) gây nhiễu/hoảng khi GO-LIVE, (b) đúng lớp bẫy dự án đã ghi — sẽ có người **"vá"** thứ đang đúng (thêm khai báo thừa) hoặc **tưởng đã có lỗ hổng**. ⭐ Lần thứ **5** trong phiên 03 gặp «cổng hẹp hơn thực tế». |
| **TEST REQUIRED** | Chạy lại `node tools/probe-action-registry-coverage.mjs` ⇒ kỳ vọng **exit 0** với **④ = 0** (hoặc ④ chỉ còn action **thật sự** không có cổng nào) · ⛔ **không được giảm độ phủ**: vẫn phải in đủ ① ② ③ ④ ⑤ và tổng **220 action**. |
| **STATUS** | `OPEN` (chờ S01/S02 hoặc user quyết) |

---

## HANDOFF-20261007-C12 — Cổng `tools/verify-ui-build-applied.mjs`: **MÃ THOÁT KHÔNG ỔN ĐỊNH** (lúc `0`, lúc CRASH) — ⛔ đừng chỉ tin `$LASTEXITCODE`

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` + `ERP-SESSION-02` ⭐⭐ (⚠️ hoặc **user quyết**) |
| **PHÁT HIỆN (đo được, vòng 23 · `TEST_LOG.md §C25`)** | Chạy cổng **2 LẦN LIỀN NHAU**, cùng trạng thái mã nguồn:<br>· **LẦN 1**: cả **3 dấu ✓** + `KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAAT` ⇒ **`EXIT=0`**<br>· **LẦN 2**: cả **3 dấu ✓** + **cùng KẾT LUẬN** ⇒ **`EXIT=-1073740791`** (= `0xC0000409`, **process CRASH**) |
| **THÔNG ĐIỆP KHI CRASH** | `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 94` (⚠️ **libuv teardown khi thoát**) |
| ⭐ **KẾT LUẬN ĐO ĐƯỢC** | **NỘI DUNG KIỂM** (3 ✓ + KẾT LUẬN) **ổn định và đáng tin** ✅ · **MÃ THOÁT** ⛔ **KHÔNG ổn định** ⇒ ⛔ **không được dùng mã thoát làm bằng chứng duy nhất** |
| ⚠️ **HỆ QUẢ THỰC TẾ** | Ai chạy CI/script mà chỉ đọc `$LASTEXITCODE` sẽ gặp **ĐỎ OAN ngẫu nhiên** (2 lần chạy liền đã khác nhau) ⇒ có thể **chặn oan** build/deploy hoặc khiến người sau "sửa" thứ đang đúng. |
| **VIỆC CẦN LÀM (ngắn, ⛔ thuộc `tools/**` — mã dùng chung)** | ① Trong `tools/verify-ui-build-applied.mjs`: **thoát TƯỜNG MINH** khi kết thúc (`process.exit(0)` ở nhánh ĐẠT, `process.exit(1)` ở nhánh HỎNG) **sau khi đã in kết luận** ⇒ ⛔ tránh libuv assertion khi teardown.<br>② (tuỳ chọn) đóng/`unref()` các handle còn treo trước khi thoát. |
| ⭐ **CÁCH DÙNG AN TOÀN NGAY BÂY GIỜ (⛔ không cần chờ sửa cổng)** | Đọc **DÒNG KẾT LUẬN** `KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAAT` (và **đủ 3 dấu ✓**) ⇒ **coi là ĐẠT**, ⛔ **đừng** chỉ dựa vào `$LASTEXITCODE`. |
| ⚠️ **ĐÍNH CHÍNH GHI CHÉP CŨ CỦA TÔI** | Ở vòng 8 tôi ghi «dòng `Assertion failed … uv async.c` chỉ là **noise teardown**, **exit code vẫn 0**» ⇒ ⭐ **CHƯA ĐỦ**: hiện tượng này **có thể làm CRASH (mã thoát khác 0)** ⇒ nay ghi lại đúng: **nội dung tin được, mã thoát thì không**. |
| **RỦI RO** | **THẤP–TRUNG BÌNH** (⛔ không ảnh hưởng sản phẩm — chỉ là **công cụ đo**), nhưng ⚠️ gây **ĐỎ OAN** và **mất lòng tin vào cổng**. |
| **TEST REQUIRED** | Chạy cổng **5 lần liên tiếp** ⇒ kỳ vọng **5/5 lần `EXIT=0`** (⛔ không còn assertion khi thoát) **và** vẫn in đủ **3 dấu ✓ + KẾT LUẬN**. |
| **STATUS** | `OPEN` (chờ S01/S02 hoặc user quyết) |
---

## HANDOFF-20261007-C13 — `Inventory.tsx` (⚠️ tệp **phiên 02**): nhãn **BCH xác nhận** vẫn phơi mã thô

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-02` ⭐⭐ (⚠️ hoặc **user quyết**) |
| **TASK** | Đưa nhãn **BCH xác nhận** qua **chốt chặn dùng chung** (như 6 màn phiên 03 vừa vá — `CHG-20261007-C20`) |
| **PHÁT HIỆN (đo được)** | `app/screens/Inventory.tsx`, cột «**BCH xác nhận**»:<br>`StatusBadge value={row.bchConfirmationStatus === "confirmed" ? "Đã xác nhận" : row.bchConfirmationStatus === "pending" ? "Chờ xác nhận" : **String(row.bchConfirmationStatus \|\| "—")**}` |
| **VẤN ĐỀ** | Nhánh cuối **phơi MÃ THÔ** ⇒ trạng thái khác (`rejected`, hoặc giá trị **mới trong tương lai**) hiện **«rejected» (tiếng Anh)** thay vì «BCH từ chối» ⇒ ⚠️ **trái bảng nhãn dùng chung** |
| **BẰNG CHỨNG BẢNG NHÃN ĐÃ SẴN SÀNG** | `lib/status-labels.ts` miền **`bch_confirmation`**: `pending → «Chờ BCH xác nhận»` · `confirmed → «BCH đã xác nhận»` · `rejected → «BCH từ chối»` ✅ |
| **REQUIRED ACTION (1 dòng)** | thay nhánh cuối bằng **`statusLabel(row.bchConfirmationStatus, "bch_confirmation")`** (thêm `import { statusLabel } from "@/lib/status-labels"` — tệp **đã** import `statusLabel` sẵn) |
| **⚠️ VÌ SAO ⛔ PHIÊN 03 KHÔNG TỰ SỬA** | `app/screens/Inventory.tsx` nằm trong **phạm vi phiên 02** (Goal §18/§21) ⇒ ⛔ **không tự ý sửa tệp phiên khác**; ⭐ phiên 03 **đã vá 6 màn khác** cùng lớp lỗi và **đã thêm cổng chặn tái phát** |
| **⚠️ CÒN 1 CHỖ NGOÀI `app/screens`** | `app/page.tsx` (**LOCK phiên 01**) cũng có mẫu `PROJECT_STATUS_LABELS[…] \|\| String(row.status \|\| "—")` ⇒ ⭐ **cùng cách sửa** khi phiên 01 có dịp |
| **TEST REQUIRED** | `node --test tests/mt3-c11-status-no-raw.test.mjs` ⇒ sau khi sửa, xoá `app/screens/Inventory.tsx` khỏi danh sách `KNOWN` trong cổng ⇒ ⭐ kỳ vọng **vẫn 4/4 ĐẠT** và **`KNOWN` rỗng** |
| **RỦI RO** | **THẤP** (1 dòng, chỉ đổi **nhánh dự phòng** vốn đang hiện sai) |
| **STATUS** | `OPEN` |
### ⭐ CẬP NHẬT `HANDOFF-20261007-C13` (vòng 31) — **thêm phần NGÀY ISO** (ngoài phần nhãn BCH)
| Nội dung | Chi tiết |
|---|---|
| **Thêm vào `Inventory.tsx` (⚠️ tệp phiên 02)** | ⛔ **6+ chỗ HIỂN THỊ ngày ISO** dạng `{row.issuedAt ? String(row.issuedAt).slice(0,10) : "—"}` (cột «Ngày» ×3 · «Ngày xuất» · «Ngày trả» · «Ngày nhập») ⇒ ✅ **cách sửa: thay bằng `{date(row.<trường>)}`** (`date` **đã** được import sẵn trong tệp) |
| **⚠️ LƯU Ý PHÂN BIỆT (⛔ tránh sửa oan — đo được 2 lần ĐỎ OAN)** | `.slice(0,10)` là **ĐÚNG** khi dùng cho ① ô nhập `type="date"` (HTML **bắt buộc** ISO) ② **so sánh/lọc** ③ **tên tệp xuất** ⇒ ⛔ **CHỈ SỬA chỗ là GIÁ TRỊ HIỂN THỊ** |
| **⚠️ CÒN LẠI TOÀN HỆ THỐNG** | ⛔ **chưa truy ra nguồn** ngày ISO hiện trên «**Tiến độ dự án**» (`2026-01-01`) và «**Giao việc & Kiểm soát hoàn thành**» (`2026-10-07`) ⇒ ⭐ ai có thời gian: **dò theo giá trị đó trong DOM** (`title=`/chú thích/KPI) rồi truy ngược tệp render |
| **⭐ GỢI Ý KỸ THUẬT** | muốn **quét rộng** mà ⛔ không ĐỎ OAN thì phải **phân tích cú pháp (AST)** — ⛔ **regex không đủ** (đã đo: bắt nhầm ô nhập/so sánh/tên tệp/**dòng định nghĩa hàm**) |
---

## HANDOFF-20261007-C14 — `app/page.tsx` (**LOCK phiên 01**): ngày ISO **hiện thô** ở màn «Tiến độ dự án» (+ vài ô ngày thô khác)

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` ⭐⭐ (⚠️ hoặc **user quyết**) |
| **TASK** | Đưa các chỗ **HIỂN THỊ NGÀY** trong `app/page.tsx` qua hàm `date()` **DÙNG CHUNG** (⇒ `dd/mm/yyyy`) |
| ⭐ **BẰNG CHỨNG ĐO ĐƯỢC (DOM thật `:9000`)** | màn «**Tiến độ dự án**» (module `project_progress`) hiện **ISO THÔ**: `2026-01-01` · `2026-09-23`<br>· chuỗi DOM: **`td < tr < tbody < table.baseline-table`** (⇒ là **ô bảng**, ⛔ không phải chú thích) |
| **VÌ SAO KHÔNG TỰ SỬA** | component `ProjectProgress` (render màn này) **định nghĩa NGAY TRONG `app/page.tsx`** ⇒ **LOCK của phiên 01** (Goal §18/§21) |
| ⭐ **MANH MỐI TRONG MÃ (grep `page.tsx`)** | ⛔ các chỗ **in ngày THÔ** đã đo được: `{row.startDate\|\|"—"}` · `{row?.startDate \|\| ""}` · `{row?.plannedEndDate \|\| ""}` và chỗ **xuất CSV** `String(project.startDate \|\| "")` ⇒ ⭐ **cách sửa: bọc `date(...)`** cho các ô **HIỂN THỊ** (⛔ giữ nguyên giá trị xuất CSV/ô nhập) |
| ⚠️ **LƯU Ý (⛔ tránh sửa oan)** | `.slice(0,10)` / ISO là **ĐÚNG** cho ① ô nhập `type="date"` ② **so sánh/lọc** ③ **tên tệp xuất** ④ **dữ liệu xuất CSV** ⇒ ⛔ **CHỈ SỬA chỗ HIỂN THỊ trên màn hình** |
| **TEST REQUIRED** | `node --test tests/mt3-c10-date-format.test.mjs` ⇒ kỳ vọng **7/7 ĐẠT** · và **quét lại màn «Tiến độ dự án»** ⇒ kỳ vọng **⛔ 0 ngày ISO** (⭐ công thức quét: `TEST_LOG.md §C33`/`§C35`) |
| **RỦI RO** | **THẤP** (chỉ đổi **chuỗi hiển thị**) — ⚠️ nhưng `page.tsx` là tệp lớn ⇒ nên sửa **từng chỗ một** và chạy `tsc` sau mỗi lượt |
| **STATUS** | `OPEN` |
---

## HANDOFF-20261007-C15 — **4 TỆP MÀN MÔ CÔI** (code chết): nối lại **hoặc** xoá — ⚠️ cần người có quyền quyết

| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ `ERP-SESSION-03` ⭐ **TO** ⭐⭐ `ERP-SESSION-01` ⭐⭐ (⚠️ hoặc **user quyết**) |
| **PHÁT HIỆN (đo được, có ĐỐI CHỨNG phương pháp)** | tìm **tên tệp trần** trong mọi tệp khác ⇒ **4 tệp màn ⛔ không được dùng ở đâu**:<br>· `app/screens/ProjectAggregateTabs.tsx` (⛔ **0** tham chiếu)<br>· `app/screens/SiteCommandCreateModal.tsx` (⛔ **0**)<br>· `app/screens/WarehouseCreateModal.tsx` (⛔ **0**)<br>· `app/screens/TeamManagement.tsx` (⚠️ **chỉ 2 tệp TEST**, ⛔ **0 import trong `app/**`**) |
| ⭐ **ĐỐI CHỨNG (⛔ chống kết luận sai)** | màn **chắc chắn đang dùng** `WorkCenter` ⇒ **được tham chiếu ở 2 tệp khác** ⇒ ✅ **phép kiểm ĐÚNG** |
| **VÌ SAO QUAN TRỌNG** | ① ⚠️ **bản vá thẻ trạng thái** của phiên 03 trong `TeamManagement.tsx` **⛔ không tới được** (⚠️ vô hại, đúng nếu nối lại) · ② ⚠️ `ProjectAggregateTabs.tsx` **từng nằm trong bản kiểm kê modal** (khoá `teamCreate`) mà ⛔ **không dùng** ⇒ dễ **tưởng nhầm là đã phủ** · ③ ⚠️ code chết **gây nhiễu bảo trì** khi GO-LIVE |
| **REQUIRED ACTION (chọn 1)** | **A.** **Nối lại** màn vào menu (⚠️ nếu nghiệp vụ còn cần) · **B.** **Xoá** tệp + test liên quan (⚠️ **hành động phá huỷ** ⇒ ⛔ **phiên 03 ⛔ không tự làm**) · **C.** Giữ nguyên + **ghi chú** trong mã là «chưa dùng» |
| ⚠️ **CÁI PHIÊN 03 ĐÃ LÀM (⛔ không phải sửa mã người khác)** | ⛔ **không xoá, không sửa** — chỉ **báo cáo** + ⭐ **ghi rõ hệ quả** để người sau ⛔ không DOM-verify vô ích |
| **TEST REQUIRED** | sau khi chọn: nếu **A** ⇒ mở màn + quét (công thức `TEST_LOG.md §C33`) · nếu **B** ⇒ `npm run test:regression` phải **vẫn xanh** (⚠️ `tm04-team-crud.test.mjs` có thể phải xoá kèm) |
| **RỦI RO** | **THẤP** (⛔ không ảnh hưởng người dùng hiện tại — ⚠️ vì các màn này ⛔ không hiển thị) |
| **STATUS** | `OPEN` |
---

# ⭐ CẬP NHẬT TRẠNG THÁI HANDOFF (2026-10-08 · **vòng 42** — phiên 03 **KIỂM LẠI TÍNH CÒN-ĐÚNG** của từng handoff)

> ⭐ Phiên 03 rà lại **mọi handoff đang mở** để ⛔ không để sổ sách sai gây **việc thừa** cho phiên khác.

## ✅ `HANDOFF-20261007-C12` — **ĐÓNG (`DONE`)** ⭐ **ĐÃ ĐƯỢC SỬA & ĐO LẠI**
| | |
|---|---|
| **NỘI DUNG CŨ** | mã thoát `tools/verify-ui-build-applied.mjs` **không ổn định** (lúc `0`, lúc **crash** `-1073740791` do libuv assertion khi teardown) |
| ⭐ **BẰNG CHỨNG ĐÓNG (đo lại vòng 42)** | chạy cổng **3 LẦN LIÊN TIẾP** ⇒ ⭐ **3/3 `EXIT=0`** · mỗi lần đủ **3 dấu ✓** + dòng `KET LUAN` · ⛔ **0 dòng `Assertion failed`** ✅ |
| ⭐ **XÁC NHẬN TRONG MÃ (đọc, ⛔ không sửa)** | tệp **`tools/verify-ui-build-applied.mjs`** nay có **THOÁT TƯỜNG MINH**: dòng **162 `process.exit(1)`** và dòng **165 `process.exit(0)`** ⇒ ⭐ **đúng khuyến nghị của handoff** |
| **KẾT LUẬN** | ✅ **`DONE`** — ⭐ **cảm ơn phiên đã sửa** (⚠️ phiên 03 ⛔ không sửa `tools/**`) |
| ⚠️ **LƯU Ý CÒN GIỮ** | ⭐ luật dùng cổng vẫn nên **đọc DÒNG KẾT LUẬN + 3 dấu ✓** (⛔ đừng chỉ tin mã thoát) — ⚠️ thói quen an toàn, ⛔ không phải vì cổng còn lỗi |

## ⚠️ `HANDOFF-20261007-C13` — **CÒN ĐÚNG** + ⭐ **SỬA SỐ LIỆU CHO CHÍNH XÁC**
| | |
|---|---|
| ⭐ **ĐÍNH CHÍNH SỐ LIỆU** | handoff cũ ghi «**6 chỗ** ngày ISO hiển thị» trong `Inventory.tsx` ⇒ ⭐ **ĐO LẠI (vòng 42) = `8` chỗ** (`String(row.issuedAt\|receivedAt\|returnedAt).slice(0, 10)`) ⇒ ✅ **đã sửa con số** |
| **CÒN LẠI VẪN ĐÚNG** | ① ⛔ **8 chỗ** ngày ISO **vẫn còn** · ② nhãn **BCH xác nhận** **vẫn rơi xuống giá trị thô** (`String(row.bchConfirmationStatus \|\| "—")`) · ③ **chưa** gọi `statusLabel(…, "bch_confirmation")` |
| **STATUS** | ⚠️ **`OPEN`** (⚠️ tệp **phiên 02** — ⛔ phiên 03 không tự sửa) |

## ⚠️ `HANDOFF-20261007-C14` — **CÒN ĐÚNG**
`app/page.tsx` vẫn còn **ngày in THÔ**: `{row.startDate||"—"}` (**1**) · `{row?.startDate \|\| ""}` (**1**) · module `project_progress` («Tiến độ dự án») **vẫn tồn tại** ⇒ ⚠️ **`OPEN`** (⛔ **LOCK phiên 01**).

## ⚠️ `HANDOFF-20261007-C15` — **CÒN ĐÚNG**
⭐ ** đo lại: cả **4 tệp màn** (`TeamManagement` · `ProjectAggregateTabs` · `SiteCommandCreateModal` · `WarehouseCreateModal`) **vẫn ⛔ 0 tham chiếu trong `app/**` + `lib/**`** ⇒ ⚠️ **vẫn MÔ CÔI** ⇒ ⚠️ **`OPEN`** (⚠️ quyết định **nối lại / xoá / ghi chú** thuộc **S01 hoặc USER**).
---

## HANDOFF-20261007-C16 — **LỚP «SỐ TIỀN HIỂN THỊ» ⛔ CHƯA ĐO ĐƯỢC** vì **CSDL fixture TRỐNG SỐ** (⚠️ cần dữ liệu để phân xử)

| ⭐ | ⭐ |
|---|---|
| **FROM → TO** | `ERP-SESSION-03` → ⭐ **USER** (⚠️ hoặc phiên có quyền ghi **dữ liệu mẫu**) |
| ⭐ **ĐÃ ĐO ĐƯỢC (bằng DOM, build `0344`)** | quét **19 màn** tìm ô **số tiền KHÔNG phân cách** ⇒ ⚠️ **0 cột · 0 số thô** ⚠️ **NHƯNG KHÔNG KẾT LUẬN "SẠCH"** |
| ⭐ **ROOT CAUSE (đo được)** | **CỘT tiền CÓ THẬT** — «**Tiền thực thu**» · «**Hóa đơn**» · «**Công nợ**» (màn «Thu hồi vốn») · «**Kế hoạch**» · «**Thực tế báo cáo**» · «**Được duyệt**» (màn «Sản lượng») — ⚠️ **nhưng MỌI Ô TRỐNG** ⇒ ⚠️ **CSDL fixture ⛔ không có số liệu** ⇒ ⭐ **không có dữ liệu để đo** |
| ⚠️ **VÌ SAO QUAN TRỌNG** | ⭐ **số tiền là dữ liệu user NHÌN NHIỀU NHẤT** trong ERP; ⚠️ nếu có chỗ in `15000000` (⛔ không phân cách) thì **khó đọc và dễ nhầm bậc độ lớn** ⇒ ⚠️ **cần kiểm khi có dữ liệu thật** |
| **REQUIRED ACTION (chọn 1)** | **A.** ⭐ **Nạp vài bản ghi mẫu có số tiền** (⚠️ user/phiên có quyền) ⇒ ⭐ phiên 03 **quét lại ngay** (máy dò đã có, ⚠️ `TEST_LOG.md §C48`) · **B.** ⭐ **user tự xem 1–2 màn có tiền** và báo lại nếu thấy số khó đọc · **C.** ⭐ **chấp nhận chưa đo** + ghi vào báo cáo là **"chưa kiểm chứng"** |
| ⚠️ **⛔ PHIÊN 03 ⛔ KHÔNG TỰ LÀM** | ⛔ **không tạo dữ liệu nghiệp vụ** (⚠️ có thể làm bẩn CSDL thật/ảnh hưởng phiên khác) ⇒ ⭐ chỉ **báo cáo + chờ** |
| **RỦI RO** | **THẤP–TRUNG BÌNH** (⚠️ chỉ là **định dạng hiển thị**, ⛔ không phải mất dữ liệu) |
| **STATUS** | `OPEN` |
---

## HANDOFF-20261007-C17 — ⚠️ **NỢ KỸ THUẬT BE**: `saveHrRecord` ghi **NULL cho khoá VẮNG MẶT** ⇒ mọi client gửi thiếu trường đều **MẤT DỮ LIỆU**

| ⭐ | ⭐ |
|---|---|
| **FROM → TO** | `ERP-SESSION-03` → ⭐ **`ERP-SESSION-01`** (giữ `java-backend/**`) |
| **BẰNG CHỨNG (đo được)** | `java-backend/application/…/HrManagementUseCase.java` dòng **35–45**: `store.updateHrRecord(sv(existing,"id"), fullName, nvl(payload.get("identityNo")), …, nvl(payload.get("position")), …)` — ⚠️ `nvl(o)` = `trim(o)` ⇒ **rỗng ⇒ `null`** ⇒ **GHI ĐÈ bằng NULL**.<br>⭐ Tái hiện: gửi `save_hr_record` với `position:""` ⇒ `hr_records.position` **⇒ NULL** (HTTP 200, ⛔ không cảnh báo). |
| ⚠️ **VÌ SAO QUAN TRỌNG** | ⚠️ **FE đã vá** (`BUG-20261007-C12` — gửi kèm giá trị hiện có) ⚠️ **nhưng BE vẫn nguy hiểm**: **mọi client khác** (script seed `java-backend/tools/seed-demo.mjs` · công cụ E2E · tích hợp tương lai) gửi **thiếu trường** ⇒ **vẫn mất dữ liệu** ⇒ ⭐ **hợp đồng API nên là «khoá VẮNG = KHÔNG ĐỔI»** (PATCH semantics) |
| **REQUIRED ACTION** | ⭐ đổi `saveHrRecord`: với mỗi trường, **chỉ ghi khi payload CÓ khoá đó** (`payload.containsKey("position")`); khoá vắng ⇒ **giữ giá trị cũ** — ⚠️ vẫn cho phép **xoá tường minh** bằng `""`/`null` có chủ đích (⚠️ cần chốt quy ước: `""` = xoá, `null`/vắng = giữ) |
| **TEST REQUIRED** | ① gửi payload thiếu `position` ⇒ `position` **GIỮ NGUYÊN** · ② gửi `position:""` ⇒ **xoá** (nếu chốt `""` = xoá) · ③ hồi quy `FinanceHrChainIntegrationTest` |
| **RỦI RO** | ⚠️ **TRUNG BÌNH** — ⚠️ đổi ngữ nghĩa ghi có thể ảnh hưởng client cũ (⭐ cần rà `tools/e2e/*` + `seed-demo.mjs`) — ⭐ **phiên 03 ⛔ không tự sửa `java-backend/**`** |
| **STATUS** | `OPEN` |
---

## HANDOFF-20261007-C18 — ⚠️ `app/page.tsx`: **8 chỗ** còn mẫu **`String(fd.get(…) || "")`** + **CÓ TAB** ⇒ ⚠️ **NGUY CƠ CÙNG LỚP `BUG-C12`** (mất dữ liệu khi lưu ở tab không chứa ô)

| ⭐ | ⭐ |
|---|---|
| **FROM → TO** | `ERP-SESSION-03` → ⭐ **`ERP-SESSION-01`** (giữ `app/page.tsx`) |
| **BẰNG CHỨNG (đo được, vòng 49)** | quét **toàn bộ `app/**`** theo **luật 17** ⇒ **21 chỗ** còn mẫu `String(fd.get("x") \|\| "")`; trong đó **`app/page.tsx` có 8 chỗ** ⚠️ **VÀ tệp này CÓ TAB** (`role="tab"`/`aria-selected`) ⇒ ⚠️ **đúng điều kiện gây mất dữ liệu** của `BUG-C12` (ô của tab không mở ⇒ **vắng DOM** ⇒ gửi `""` ⇒ BE ghi **NULL/ghi đè**) |
| ⚠️ **VÌ SAO NGUY HIỂM** | `page.tsx` chứa **rất nhiều action GHI** (`save_user_access` · `update_user` · `save_organization_unit` · `save_payment_plan` · `save_boq_item` · `update_boq_contract_prices`…) ⇒ ⚠️ nếu có **form sửa** nằm trong nhánh tab/điều kiện thì **mất dữ liệu y như `BUG-C12`** |
| **REQUIRED ACTION** | ⭐ **①** xác định **8 chỗ** đó thuộc form **TẠO MỚI** (✅ an toàn) hay **SỬA bản ghi có sẵn** (🔴 phải vá) · ⭐ **②** nếu là **SỬA**: áp **cùng cách vá** của phiên 03 — ô **vắng DOM ⇒ gửi GIÁ TRỊ HIỆN CÓ** (⛔ không gửi rỗng) · ⭐ **③** và nếu form có **tab**: gắn **`key={tab}`** (⭐ luật 18) |
| **MẪU VÁ ĐÃ CHỨNG MINH** | `app/screens/HrProfileEditModal.tsx` — `hrVal(name, fallback)` + `key={tab}` · ⭐ cổng `tests/mt3-c13-hr-modal-no-wipe.test.mjs` (**5 ca**, có **đối chứng âm**) ⇒ ⭐ có thể **chép mẫu** |
| **TEST REQUIRED** | ① form SỬA trên tab A ⇒ lưu ⇒ **trường của tab B GIỮ NGUYÊN** · ② đổi tab ⇒ ô hiện **giá trị THẬT** (⛔ không giữ giá trị tab kia) · ③ hồi quy |
| **RỦI RO** | ⚠️ **CAO nếu có form sửa trong tab** (🔴 **mất dữ liệu thật**) · ⚠️ phiên 03 ⛔ **không tự sửa** (`page.tsx` = **LOCK phiên 01**) |
| **STATUS** | `OPEN` |
---

## BỔ SUNG cho HANDOFF-20261007-C18 — ⭐ **NÂNG MỨC LÊN `HIGH`**: 3 chỗ nghi vấn thuộc **action CÓ NHÁNH UPDATE (UPSERT)** ⇒ ⚠️ **đúng điều kiện gây MẤT DỮ LIỆU**

| ⭐ | ⭐ |
|---|---|
| **BẰNG CHỨNG MỚI (đo được, vòng 50)** | Phân tích **6 chỗ** mẫu cũ trong `app/page.tsx` ⇒ ⭐ **3 chỗ có DẤU HIỆU RENDER CÓ ĐIỀU KIỆN**:<br>· dòng **1536** `projectId` — action **`save_payment_plan`**<br>· dòng **1549** `projectId` — action **`save_material_norm`**<br>· dòng **1569** `recoveryRecordId` — action **`save_contract_payment`** |
| ⭐ **VÌ SAO LÀ `HIGH` (không còn là «nghi ngờ»)** | ⚠️ Cả **3 action** đều **đọc ID bản ghi để UPDATE**:<br>· `scripts/system-route.mjs:1396` `save_contract_payment` → **`paymentId`** · `recoveryRecordId=clean(payload.recoveryRecordId)`**`\|\|null`** ⇒ ⚠️ **ghi NULL** khi ô vắng<br>· `:2149` `save_material_norm` → **`normId`** · `:2164` `save_payment_plan` → **`planId`**<br>· Java xác nhận cùng ngữ nghĩa: `ProductionManagementUseCase.saveContractPayment` · `MaterialCatalogManagementUseCase.saveMaterialNorm` · `FinanceManagementUseCase.savePaymentPlan`<br>⇒ ⭐ **nếu người dùng đang SỬA một bản ghi cũ** mà ô đó **không có trong DOM** ⇒ payload gửi `""` ⇒ ⚠️ **rơi vào ĐÚNG lớp `BUG-C12`** (mất/đổi dữ liệu) |
| **REQUIRED ACTION (ưu tiên `HIGH`)** | ⭐ **①** với mỗi chỗ: xác định đó là **TẠO MỚI** hay **SỬA bản ghi cũ** (⚠️ nếu **TẠO MỚI** ⇒ ✅ **an toàn**, ⛔ dừng) · ⭐ **②** nếu **SỬA**: áp **cùng cách vá** (`hrVal`-style: ô **vắng DOM ⇒ gửi giá trị HIỆN CÓ**; ⚠️ **`recoveryRecordId` ⛔ không được gửi rỗng ⇒ NULL**) · ⭐ **③** nếu form **có tab**: thêm **`key={tab}`** |
| **MẪU VÁ + CỔNG** | `app/screens/HrProfileEditModal.tsx` (`hrVal` + `key={tab}`) · cổng `tests/mt3-c13-hr-modal-no-wipe.test.mjs` (**5 ca**, có **đối chứng âm**) ⇒ ⭐ **chép được mẫu** |
| ⚠️ **GHI CHÚ KỸ THUẬT THÊM** | ⚠️ một số form dùng **`{...Object.fromEntries(new FormData(f))}`** (vd `app/screens/Payments.tsx`) ⇒ ô **vắng DOM thì KHOÁ BỊ BỎ HẲN** (⛔ không gửi `""`) — ⚠️ **nhưng backend vẫn `clean(payload.x)` ⇒ `""`/`NULL`** ⇒ ⭐ **nguy cơ TƯƠNG ĐƯƠNG** nếu form đó là **SỬA** (⚠️ `Payments` hiện là **TẠO MỚI** ⇒ ✅ an toàn) |
| **STATUS** | `OPEN` — ⚠️ **mức `HIGH`** (⚠️ trước đó ghi chung chung) |
---

## BỔ SUNG (2) cho HANDOFF-20261007-C18 — ⭐ **GÓC LUẬT 18**: `page.tsx` có **1 ô nhập nằm trong nhánh ternary**

| ⭐ | ⭐ |
|---|---|
| **BẰNG CHỨNG (đo được, vòng 51)** | quét **mọi component** có **tab + ô nhập** trong `app/**` (**7 tệp**) ⇒ ⚠️ `app/page.tsx`: **ô nhập TRONG nhánh ternary = 1** ⚠️ (⚠️ 5 tệp khác = **0**; ⭐ `HrProfileEditModal` = 1 ⭐ **đã vá**) |
| **MỨC NGUY CƠ (⚠️ nói đúng)** | ⚠️ **THẤP hơn** 6 chỗ mẫu `String(fd.get \|\| "")` đã báo: vì `page.tsx` **⛔ KHÔNG có 2 nhánh tab render CÙNG loại thẻ bao ngoài** (`ternary-the-section/div = 0`) ⇒ ⚠️ **React khó tái dùng ô theo đúng cơ chế đã đo ở `BUG-C12`** — ⚠️ **nhưng chưa loại trừ được** (⚠️ có thể tái dùng qua **map theo index** / **fragment đổi thứ tự**) |
| **REQUIRED ACTION** | ⭐ **①** xác định ô nhập đó nằm ở **tab/nhánh nào** và **đổi tab** có làm **giá trị ô sai** không (⭐ **kiểm ĐỘNG**: mở form → đổi tab → đọc lại `input.value`) · ⭐ **②** nếu **sai**: gắn **`key`** cho nhánh (⭐ mẫu: `key={tab}`) hoặc **`key` theo khối** |
| **MẪU + CỔNG ĐÃ CÓ** | `app/screens/HrProfileEditModal.tsx` (dòng **175** + **191**) · cổng `tests/mt3-c13-hr-modal-no-wipe.test.mjs` (**5 ca**) |
| **STATUS** | `OPEN` (⚠️ mức `HIGH` cho **6 chỗ mẫu `String(fd.get \|\| "")`** · ⚠️ mức **THẤP** cho **góc luật 18** này) |
---

## HANDOFF-20261007-C19 — ⚠️ **5 TEST QUÉT THƯ MỤC THIẾU «CHỐT VÙNG PHỦ»** ⇒ ⚠️ **có thể «XANH RỖNG»** (⭐ đo được, ⛔ phiên 03 không sửa test của phiên khác)

| ⭐ | ⭐ |
|---|---|
| **FROM → TO** | `ERP-SESSION-03` → ⭐ **`ERP-SESSION-01`** (và **`ERP-SESSION-02`** nếu trúng tệp của họ) |
| **BỐI CẢNH (⭐ vì sao phiên 03 phát hiện)** | phiên 03 vừa **tự vá 6 khuyết điểm** trong **12 cổng của mình** (⭐ thiếu **đối chứng âm** / thiếu **chốt vùng phủ**) và tạo **meta-gate** `tests/mt3-c15-gate-hygiene.test.mjs` ⇒ ⭐ áp **cùng thước đo** ra **toàn bộ `tests/**`** (⚠️ **chỉ ĐỌC**) |
| ⭐ **KẾT QUẢ QUÉT (đo được, vòng 53)** | **150** test · **14** của phiên 03 (`mt3-c*`) · **136** khác<br>⭐ **~24 tệp đã có «ĐỐI CHỨNG ÂM»** (⭐ họ **`ad01…ad16`** của phiên 01 làm rất tốt ✅)<br>⚠️ **5 tệp QUÉT THƯ MỤC mà THIẾU «CHỐT VÙNG PHỦ»** (⭐ **nguy cơ thật**):<br>· `tests/d105-jsx-comment-textnode.test.mjs`<br>· `tests/golive-tablist-co-css.test.mjs`<br>· `tests/mt3-ui-02-status-labels.test.mjs`<br>· `tests/p07-supplier-partner-split.test.mjs`<br>· `tests/p12-05-user-identity-model.test.mjs` |
| ⭐ **VÌ SAO NGUY HIỂM (⭐ bài học `§C53` + `§C41`)** | cổng **quét thư mục** rồi khẳng định «**0 vi phạm**» ⚠️ **sẽ XANH kể cả khi bộ quét đọc được 0 tệp** (⚠️ đường dẫn sai · đổi cấu trúc thư mục · lỗi `walk`) ⇒ ⭐ **cổng VÔ NGHĨA mà ⛔ không ai biết** |
| **REQUIRED ACTION (⭐ 1 DÒNG mỗi tệp)** | thêm ngay **sau** lời gọi `walk(...)` (hoặc sau khi dựng xong danh sách tệp):<br>``assert.ok(files.length >= 20, `⛔ CHỐT VÙNG PHỦ: chỉ quét được ${files.length} tệp ⇒ bộ quét HỎNG, kết quả VÔ NGHĨA`);``<br>⚠️ (⚠️ đổi `20` cho phù hợp phạm vi từng cổng — ⚠️ **phải là số LỚN HƠN 0 đáng kể**) |
| ⭐ **TÙY CHỌN (⭐ nếu muốn tự động hoá)** | ⭐ có thể **mở rộng** meta-gate `tests/mt3-c15-gate-hygiene.test.mjs` để **phủ cả `tests/**`** — ⚠️ **phiên 03 ⛔ KHÔNG tự làm** (⚠️ sẽ biến cổng của phiên 03 thành **cổng chấm điểm test của phiên khác** ⇒ ⛔ cần **phiên sở hữu đồng ý**) |
| ⚠️ **GHI CHÚ (⛔ không phải yêu cầu)** | ⚠️ **~112 tệp** khác ⛔ không có «đối chứng âm» — ⭐ **KHÔNG** có nghĩa là chúng sai: ⚠️ nhiều test **khẳng định một hằng số/chuỗi cụ thể** (⭐ sai thì **ĐỎ** ngay) ⇒ ⛔ **không cần** đối chứng âm. ⭐ Chỉ những cổng **quét rộng rồi khẳng định «0 vi phạm»** mới **cần** |
| **RỦI RO** | ⚠️ **TRUNG BÌNH** (⚠️ không phải lỗi sản phẩm, ⚠️ nhưng là **lỗ hổng của lưới an toàn** ⇒ ⚠️ GO-LIVE có thể tưởng «đã kiểm» mà thực ra **chưa**) |
| **STATUS** | `OPEN` |
---

## ĐÍNH CHÍNH cho HANDOFF-20261007-C19 — ⚠️ **DANH SÁCH CŨ SAI: 2/5 tệp đã bị BÁO OAN** (⭐ đã đọc lại từng tệp) — cập nhật mức `THẤP` + danh sách ĐÚNG

| ⭐ | ⭐ |
|---|---|
| ⚠️ **TÔI ĐÃ SAI Ở ĐÂU** | Bản đầu tôi liệt kê **5 tệp** «quét thư mục mà thiếu chốt vùng phủ» ⇒ ⭐ **ĐỌC LẠI TỪNG TỆP** thì: ⛔ **2 tệp TRONG DANH SÁCH ĐÓ ⛔ KHÔNG THIẾU GÌ**:<br>· ✅ `tests/golive-tablist-co-css.test.mjs` — **CÓ chốt**: dòng **55** `assert.ok(ds.length >= 10, "phải quét được ≥10 dải tab … nếu ít hơn thì phép quét HỎNG")` ⚠️ (⚠️ biến tên **`ds`** ⛔ không phải `files` ⇒ bộ dò của tôi **bỏ sót**)<br>· ✅ `tests/partners-separate-table.test.mjs` — **CÓ chốt**: dòng **77** `assert.ok(sqlFiles.length > 100, …)` ⚠️ (⚠️ dùng **`>`** ⛔ không phải `>=` ⇒ bộ dò của tôi **bỏ sót**) |
| ⚠️ **ROOT CAUSE CỦA SAI SÓT** | bộ dò «chốt vùng phủ» của tôi đòi **đúng 2 điều kiện** (`.length >= N` **VÀ** `includes(`) + ⚠️ ngầm giả định **biến tên `files`** ⇒ ⚠️ **quá khắt khe** khi áp lên **tệp của phiên khác** (⚠️ mỗi phiên đặt tên khác nhau) |
| ⭐ **DANH SÁCH ĐÚNG (đã ĐỌC từng tệp, vòng 53)** | **11** tệp trong `tests/**` (⛔ không phải `mt3-c*`) có **quét thư mục**: ⭐ **8 tệp CÓ chốt vùng phủ** ✅ (`golive-tablist-co-css` · `partners-separate-table` · `d107-…` · `f03-…` · `f04-f05-…` · `mt3-ui-16b-…` · `mt3-ui-25-…` · `p01-p02-p03-…`) · ⚠️ **3 tệp CẦN XEM**:<br>**① `tests/d105-jsx-comment-textnode.test.mjs`** — ⚠️ **rõ nhất**: `readdirSync(dir)` (dòng **31**) ⛔ **không có assert nào về SỐ LƯỢNG** ⇒ ⚠️ nếu thư mục rỗng/đường dẫn sai thì `assert.deepEqual(loi, [], …)` (dòng **117**) **vẫn XANH** ⇒ cần **1 dòng chốt**<br>**② `tests/p12-05-user-identity-model.test.mjs`** — ⚠️ `readdirSync(dir).filter(/ProbeIdentity/i)` (dòng **83**) ⛔ không có assert số lượng ⇒ ⚠️ **biên**: đây có thể là **phép kiểm «VẮNG MẶT» hợp lệ** (⚠️ cần phiên sở hữu xác nhận ý định)<br>**③ `tests/t10-approval-center.test.mjs`** — ⚠️ quét `drizzle/**` + `java-backend/**/db/migration/**` (dòng **29–30**) ⛔ không có assert số lượng trên **các tệp .sql đã quét** ⇒ ⚠️ **biên** |
| ⭐ **REQUIRED ACTION (⭐ vẫn rất nhẹ)** | ⭐ với **①** (và **②**/**③** nếu phiên sở hữu thấy đúng): thêm **1 dòng** ngay sau lời gọi quét:<br>``assert.ok(<biếnDanhSách>.length >= <N hợp lý>, `⛔ CHỐT VÙNG PHỦ: chỉ quét được ${<biếnDanhSách>.length} … ⇒ bộ quét HỎNG`);`` |
| ⭐ **BÀI HỌC (23) — ⭐ QUAN TRỌNG NHẤT CỦA VÒNG NÀY** | ⛔ **KHÔNG BAO GIỜ** gửi cho phiên khác một **danh sách lỗi sinh từ BỘ DÒ THÔ** — ⭐ **phải ĐỌC TỪNG MỤC** trước khi bàn giao.<br>⚠️ Ở đây bộ dò của tôi **báo oan 2/5** (⚠️ vì **tên biến khác** + dùng **`>`** thay `>=`) ⇒ ⚠️ nếu gửi nguyên ⇒ ⭐ **phiên khác đi «sửa» thứ đang ĐÚNG** (⚠️ đúng loại sai lầm repo đã trả giá nhiều lần: «lần thứ 7 suýt sửa thứ đang đúng»).<br>⭐ **CÁCH LÀM ĐÚNG**: ⭐ **quét để TÌM ỨNG VIÊN** → ⭐ **đọc từng ứng viên** → ⭐ **chỉ bàn giao cái đã kiểm** → ⭐ **ghi rõ mức độ chắc chắn** (rõ / biên) → ⭐ và **nêu cả phần ĐÃ ĐÚNG** của phiên khác (⭐ ở đây: **8/11 tệp có chốt** ✅, họ `ad01…ad16` có **đối chứng âm** ✅) |
| **STATUS** | `OPEN` — ⚠️ mức **THẤP** (⚠️ hạ từ `TRUNG BÌNH`: **1 tệp rõ** + **2 biên**, ⚠️ và **8/11 tệp đã có chốt**) |
---

## ĐÍNH CHÍNH (2) cho HANDOFF-20261007-C18 — ⚠️ **SỐ LIỆU ĐÚNG: `6 DÒNG` = `8 LƯỢT`** (⛔ không phải «8 chỗ»)

| ⭐ | ⭐ |
|---|---|
| ⚠️ **SỐ CŨ (vòng 49)** | «**8 chỗ** mẫu `String(fd.get(…) \|\| "")` trong `app/page.tsx`» ⇒ ⚠️ **DỄ GÂY HIỂU SAI** |
| ✅ **SỐ ĐÚNG (đo lại vòng 54)** | ⭐ **`6 DÒNG`** (⚠️ trong đó **2 dòng có 2 LƯỢT** mỗi dòng) ⇒ ⭐ **`8 LƯỢT`** tổng cộng<br>① dòng **1536** `projectId` — `save_payment_plan` ⚠️ *(dấu hiệu render có điều kiện)*<br>② dòng **1549** `projectId` — `save_material_norm` ⚠️ *(có điều kiện)*<br>③ dòng **1569** `recoveryRecordId` — `save_contract_payment` ⚠️ *(có điều kiện)*<br>④ dòng **1605** `unitCode` — `save_contract_payment`<br>⑤ dòng **1608** `unitDescription` — `save_organization_unit`<br>⑥ dòng **1619** `userId` — `set_organization_unit_status` |
| ⭐ **VÌ SAO PHẢI ĐÍNH CHÍNH (luật 23)** | ⚠️ nếu phiên 01 đọc «**8 chỗ**» rồi **tìm đủ 8 dòng** mà chỉ thấy **6** ⇒ ⚠️ **tưởng còn sót 2 chỗ chưa tìm ra** ⇒ ⭐ **mất thời gian vô ích** — ⚠️ đúng loại lỗi «handoff gây việc thừa» |
| **TRẠNG THÁI ĐO LẠI (vòng 54)** | ⚠️ **VẪN CÒN**: **6 dòng · 8 lượt** ⛔ không đổi so với vòng 49 ⇒ ⚠️ **handoff vẫn `OPEN`** (`HIGH` cho 6 dòng này · `THẤP` cho góc luật 18) |
| ⭐ **GHI NHẬN** | ⚠️ `app/page.tsx` **có thay đổi chưa commit** (20+/10−) ⇒ ⭐ **phiên 01 đang làm** ⇒ ⛔ phiên 03 **không đụng**; ⭐ và **hồi quy vẫn XANH** (`901/900/0`) sau các thay đổi đó |
---

## HANDOFF-20261007-C20 — 🔴 **HIGH**: nút «Sửa hồ sơ» **BỊ ẨN OAN** ⇒ vá **1 DÒNG** bằng helper quyền hiệu lực đã có sẵn

| ⭐ | ⭐ |
|---|---|
| **FROM → TO** | `ERP-SESSION-03` → ⭐ **`ERP-SESSION-01`** (giữ `app/page.tsx`) |
| ⭐ **VẤN ĐỀ (đo được)** | `canAdministerStaff` trong `app/page.tsx` **CHỈ** xét **`allModulePermissions` lọc theo `p.userId`** + danh sách mã `HR_EDIT_MODULES` ⚠️ **có mã BỊ ĐẢO** ⇒ ⚠️ user **CÓ quyền** vẫn **⛔ không thấy nút «Sửa hồ sơ»** |
| ⭐ **BẰNG CHỨNG (3 phép đo độc lập)** | ① **DB**: `e2e.ns` có `department_module_permissions(ORG-HCPC, dept_legal_hr, can_edit=1)` ✅<br>② **API** (`GET /api/system` bằng chính `e2e.ns`): `data.modulePermissions` = **76** dòng, có ⭐ **`dept_legal_hr view=1 create=1 edit=1`** (`source=company_leadership`)<br>③ **UI** (đăng nhập thật `e2e.ns`, ảnh `evidence/BUG-C12-10-role-hr-danh-sach.png`): màn «Hồ sơ nhân sự» **mở được** ⚠️ **nhưng ⛔ KHÔNG có nút «Sửa hồ sơ»**<br>④ ⭐ `allModulePermissions` của user = **0 dòng** ⇒ điều kiện **⛔ không bao giờ đúng** với người được cấp theo **phòng ban** |
| ⭐ **VÁ ĐỀ XUẤT (1 DÒNG)** | ⭐ thay điều kiện tự chế bằng **helper quyền hiệu lực**:<br>``const canAdministerStaff = modulePermission(data, "dept_legal_hr").canEdit;``<br>⭐ (`lib/permissions.ts` → `modulePermission` đọc **`data.modulePermissions`** = quyền **đã gộp** người dùng + phòng ban + vai trò; ⭐ `admin` ⇒ **toàn quyền**; ⭐ **tệp này thuộc phiên 03 và ĐÃ ĐÚNG**, ⛔ không cần sửa)<br>⚠️ (⚠️ nếu muốn giữ nhiều module: ``["dept_legal_hr","dept_legal_labor"].some(k => modulePermission(data, k).canEdit)`` — ⚠️ **sửa luôn mã đảo `dept_hr_legal`**) |
| **TEST ĐỀ XUẤT** | ⭐ cổng: **data giả** `modulePermissions` có `dept_legal_hr.canEdit=1` ⇒ **nút PHẢI hiện** · ⚠️ **đối chứng âm**: `canEdit=0` ⇒ **nút PHẢI ẩn** · ⭐ và ca cho **admin** ⇒ **luôn hiện** |
| **RỦI RO** | ⚠️ **THẤP** khi vá (1 dòng, dùng helper có sẵn) — ⚠️ **CAO** nếu ⛔ **không** vá (⚠️ nghiệp vụ HR bị chặn cho mọi user cấp theo phòng ban) |
| **STATUS** | `OPEN` |
---

## BỔ SUNG (3) cho HANDOFF-20261007-C20 — ⭐ **TINH CHỈNH MỨC ẢNH HƯỞNG: 4 cổng nhưng CHỈ 1 THẬT SỰ LỖI** (⭐ đo bằng CSDL)

| ⭐ | ⭐ |
|---|---|
| ⭐ **4 CỔNG DÙNG MODULE NÀO (đọc mã)** | · `canViewAudit` (dòng **3230**) → **`admin_tab_11`** · `canAdministerStaff` (**3235**) → **`HR_EDIT_MODULES`** + `admin_tab_01` · `canManageRole` (**3376**) → `admin_tab_01` · `canManageUserPermissions` (**3437**) → `admin_tab_06` |
| ⭐ **ĐO CSDL (quyết định)** | ⛔ **`admin_tab_*` ⛔ KHÔNG có dòng quyền CẤP PHÒNG BAN nào** (`SELECT … WHERE module_key LIKE 'admin_tab%'` ⇒ **0 dòng**) ⇒ ⭐ **3 cổng sau là ĐÚNG THIẾT KẾ** (tab quản trị chỉ cấp theo NGƯỜI DÙNG) ✅ |
| ⭐ **⇒ CHỈ CÒN 1 CHỖ PHẢI VÁ** | ⭐ **`canAdministerStaff` (dòng 3235)** — vì nó gộp **`HR_EDIT_MODULES`** = các module **NGHIỆP VỤ** (`dept_legal_hr` · `dept_legal_labor` · …) ⚠️ **có** quyền cấp phòng ban (**`dept_legal_hr`: 2 phòng `can_edit=1`**) ⇒ ⚠️ **mù quyền phòng ban** + ⚠️ **mã ĐẢO `dept_hr_legal`** |
| ✅ **VIỆC PHẢI LÀM (⭐ NHỎ HƠN BÁO CÁO TRƯỚC)** | ⭐ **1 DÒNG**: ``const canAdministerStaff = modulePermission(data, "dept_legal_hr").canEdit;`` — ⚠️ (`admin_tab_01` vẫn dùng cho **`canManageRole`** ✅ giữ nguyên; ⛔ **đừng** đụng 3 cổng còn lại) |
| ⚠️ **SỬA LẠI NỘI DUNG BÁO CÁO TRƯỚC** | ⚠️ Bản đầu tôi ghi «**4 chỗ cùng khuôn ⇒ ảnh hưởng rộng**» ⇒ ⭐ **CHÍNH XÁC**: **4 chỗ cùng khuôn, nhưng chỉ 1 chỗ THẬT SỰ LỖI** (⭐ luật 23: ⛔ không để phiên khác đi vá thứ **đang đúng**) |
| ⭐ **ĐÃ ĐO THÊM** | ⭐ `ActionRbacRegistry:277` khai `save_user_access` = **`admin_tab_06`** + **`canView`** (`:526`) và `UserManagementUseCase:275-276` (`if (!isAdmin) requireActionModule(...)`) ⇒ ✅ **BE và UI (`page.tsx:3437`) KHỚP** ⇒ ⛔ **không phải sửa** |
| **STATUS** | `OPEN` — ⭐ **chỉ 1 dòng**, mức `HIGH` (⚠️ chặn nghiệp vụ HR cho tài khoản cấp theo PHÒNG BAN) |
---

## HANDOFF-20261007-C21 — ⚠️ `Inventory.tsx` (phiên 02): nút «＋ Thêm nhân sự» **CHỈ hiện với `role === admin`** ⇒ ⚠️ **chặn OAN** người có quyền cấu hình **`admin_tab_06`** (⭐ cùng lớp `BUG-20261007-C13`)

| ⭐ | ⭐ |
|---|---|
| **FROM → TO** | `ERP-SESSION-03` → ⭐ **`ERP-SESSION-02`** (`app/screens/Inventory.tsx`) |
| ⭐ **BẰNG CHỨNG — MÃ (đọc trực tiếp)** | · `Inventory.tsx` dòng **261**: ``const isAdmin = String(data.user?.role ‖ "") === "admin";``<br>· dòng **430**: ``actions={isAdmin ? <button … data-vntech="wd-staff-add" …>＋ Thêm nhân sự</button> : …}`` ⇒ ⚠️ **nút BỊ ẨN** với ⛔ không phải admin |
| ⭐ **BẰNG CHỨNG — BACKEND (⭐ đo được, vòng 58)** | · `ActionRbacRegistry` dòng **277**: ``Map.entry("save_user_access", List.of("admin_tab_06"))`` · dòng **526**: quyền cần = **`canView`**<br>· `UserManagementUseCase.saveUserAccess` dòng **275–276**: ``if (!rbac.isAdmin(…)) rbac.requireActionModule(…, "save_user_access");`` ⇒ ⭐ **PA-1 (`DEC-20261008-001`, user 08/10/2026)**: ⛔ **KHÔNG còn** `requireRole(List.of("admin"))` |
| ⚠️ **VÌ SAO LÀ LỖI (⭐ theo CHỦ TRƯƠNG CỦA USER)** | ⭐ USER chốt: *«việc thường ngày dùng tài khoản THƯỜNG (vd ITM) **được cấp quyền QUA CẤU HÌNH**»* (`role=admin` = **break-glass**) ⇒ ⚠️ UI ⛔ **không được** đòi `role === admin` khi **backend đã cho `admin_tab_06`** đi qua |
| ⚠️ **CHÚ THÍCH TRONG TỆP ĐÃ CŨ** | `Inventory.tsx` (đoạn gần dòng **470**): «backend **`requireRole(…, List.of("admin"))`** ⇒ ⭐ **ADMIN-ONLY** ⇒ UI ẩn nút…» ⚠️ **không còn đúng** (⚠️ viết TRƯỚC PA-1) ⇒ ⭐ **nên sửa cả chú thích** để ⛔ không ai trích dẫn lại |
| ⭐ **VÁ ĐỀ XUẤT (1 DÒNG + chú thích)** | ⭐ ``const isAdmin = isAdminUser(data.user) ‖ modulePermission(data, "admin_tab_06").canView;`` — ⭐ **`modulePermission`** có sẵn trong `lib/permissions.ts` (⭐ đọc **quyền HIỆU LỰC**; `admin` ⇒ toàn quyền) · ⚠️ và sửa lại chú thích ở đoạn **470** cho khớp |
| **TEST ĐỀ XUẤT** | ⭐ cổng: user có `admin_tab_06 + canView` ⇒ nút **PHẢI hiện** · ⚠️ **đối chứng âm**: user ⛔ không có ⇒ nút **PHẢI ẩn** (⚠️ nhưng ⛔ đừng để nút CHẾT: bấm vào gọi action mà BE 403) |
| **RỦI RO** | ⚠️ **TRUNG BÌNH** (⚠️ nghiệp vụ gán nhân sự vào kho bị chặn với tài khoản cấu hình; ⚠️ hiện phải dùng `admin` ⇒ ⚠️ **trái chủ trương** dùng tài khoản thường) |
| **GHI CHÚ** | ⭐ Nút này mở modal gán nhân sự + gửi `save_user_access` với **FULL-REPLACE** (`clearUserScopes()` + chèn lại) — ⚠️ `Inventory.tsx` **ĐÃ** gửi **đủ** 3 nhóm (`projectScopes` · `warehouseScopes` · `modulePermissions` của user đó) ✅ ⇒ ⛔ **không phải sửa payload**, ⭐ **chỉ sửa ĐIỀU KIỆN HIỆN NÚT** |
| **STATUS** | `OPEN` |
---

## HANDOFF-20261007-C22 — 🔴 **HIGH**: màn «DANH MỤC & PHÂN QUYỀN» **CHẶN OAN** tài khoản cấu hình ⇒ vá **1 DÒNG** ở `page.tsx:625` (⭐ theo đúng khuôn **cùng tệp**)

| ⭐ | ⭐ |
|---|---|
| **FROM → TO** | `ERP-SESSION-03` → ⭐ **`ERP-SESSION-01`** (`app/page.tsx`) |
| ⭐ **HIỆN TƯỢNG (📸 bằng chứng)** | `giamdoc.demo` (**role `director`**, ⭐ **CÓ `admin` 1/1/1 + toàn bộ `admin_tab_01…14` 1/1/1** — đo bằng API) mở «DANH MỤC & PHÂN QUYỀN» ⇒ ⚠️ **CHỈ hiện panel «CHƯA ĐƯỢC PHÂN QUYỀN»**, **0 tab**, **0 dòng bảng** (⚠️ `admin` mở cùng màn: **40 tab** + bảng) |
| ⭐ **NGUYÊN NHÂN (1 DÒNG MÃ)** | `app/page.tsx:625`: ``const accessDenied = active!=="admin" ? (permissionConfigured && !activePermission.canView) : !isAdminUser(data.user);``<br>⇒ ⚠️ nhánh **`active === "admin"`** chỉ nhận **`role === "admin"`** ⇒ ⛔ **bỏ qua quyền cấu hình** |
| ⭐ **MÂU THUẪN TRONG CÙNG TỆP (⭐ lý lẽ mạnh nhất)** | `page.tsx:491` (menu) **đã** dùng ``hasAnyCapability(modulePermission(data, item.key))`` cho nhóm quản trị ⇒ ⭐ **menu cho vào, màn chặn** |
| ⚠️ **MÂU THUẪN VỚI BE** | `ActionRbacRegistry` + `UserManagementUseCase:275-276` (**PA-1**) **cho** người có `admin_tab_06 + canView` đi qua ⇒ ⚠️ **BE mở, UI khoá** |
| 🔴 **HỆ QUẢ** | ⭐ **PA-1 KHÔNG DÙNG ĐƯỢC TỪ GIAO DIỆN** (⚠️ người cấu hình ⛔ không mở nổi màn để bấm Lưu) ⇒ ⚠️ **triệu chứng user báo còn nguyên ở tầng màn** · ⚠️ **10+** tài khoản bị ảnh hưởng |
| ⭐ **VÁ ĐỀ XUẤT (1 DÒNG)** | ⭐ ``: !(isAdminUser(data.user) ‖ hasAnyCapability(modulePermission(data, "admin")));`` — ⭐ `hasAnyCapability` **và** `modulePermission` **đã import sẵn** trong `page.tsx` ✅ · ⭐ `role=admin` vẫn **toàn quyền** (`modulePermission` trả full cho admin) ⇒ ⛔ **không mất đường nào** |
| **TEST ĐỀ XUẤT** | ⭐ **có đối chứng âm**: (a) `role=director` + `admin` `canView=1` ⇒ **PHẢI render tab** · (b) ⛔ không có `admin` + ⛔ không phải admin ⇒ **PHẢI** hiện panel từ chối ✅ |
| **CÁCH ĐO LẠI (⭐ cho phiên sau)** | ⭐ `tools/probe-s03-pa1-save.mjs` (⭐ đăng nhập `giamdoc.demo` / `Vntech@2026` ⇒ in **số tab HIỂN THỊ** + **số dòng bảng hiển thị**) — ⚠️ **ĐỌC ẢNH** để chốt (⛔ đừng chỉ đọc DOM — ⚠️ **luật 26**) |
| **RỦI RO** | ⚠️ **THẤP** khi vá (1 dòng, dùng helper **cùng tệp**) — ⚠️ **CAO** nếu ⛔ không vá (⚠️ chủ trương «cấp quyền qua cấu hình» **không thực thi được**) |
| **STATUS** | `OPEN` |
---

## BỔ SUNG cho HANDOFF-20261007-C22 — ⭐ **BẢN VÁ ĐỀ XUẤT ĐÃ ĐƯỢC KIỂM CHỨNG TRƯỚC** trên **DỮ LIỆU THẬT** (2 dương + **2 đối chứng âm**)

| ⭐ | ⭐ |
|---|---|
| ⭐ **PHƯƠNG PHÁP** | ⭐ đăng nhập **thật** 5 tài khoản ⇒ đọc **`data.modulePermissions`** ⇒ ⭐ **mô phỏng predicate HIỆN TẠI** (`page.tsx:625`) và **predicate ĐỀ XUẤT** ⇒ so với **kỳ vọng** |
| ⭐ **KẾT QUẢ (đo được)** | · **`giamdoc.demo`** (role `director`, **15** dòng `admin*`) ⇒ HIỆN TẠI **BI CHAN (⚠️ LỖI C14)** → ĐỀ XUẤT ⭐ **DUOC VAO** ✅<br>· **`e2e.thuky`** (role `thuky`, **15** dòng `admin*`) ⇒ HIỆN TẠI **BI CHAN** → ĐỀ XUẤT ⭐ **DUOC VAO** ✅ (⭐ **khớp quyền thật của tài khoản**)<br>· ✅ **ĐỐI CHỨNG ÂM 1**: **`e2e.ksda`** (role `ksda`, **0** dòng `admin*`) ⇒ HIỆN TẠI **BI CHAN** → ĐỀ XUẤT ⭐ **BI CHAN** ✅ (⛔ **không mở thêm ai**)<br>· ✅ **ĐỐI CHỨNG ÂM 2**: **`e2e.kt`** (role `accountant`, **0** dòng `admin*`) ⇒ HIỆN TẠI **BI CHAN** → ĐỀ XUẤT ⭐ **BI CHAN** ✅<br>· ⭐ `admin` (role `admin`) ⇒ **DUOC VAO** ở **cả hai** ✅ (⛔ không mất đường nào) |
| ⭐ **KẾT LUẬN** | ⭐ bản vá **MỞ ĐÚNG** cho tài khoản **CÓ quyền cấu hình** và **GIỮ CHẶN** tài khoản **⛔ không có** ⇒ ✅ **an toàn để áp** (⭐ **kiểm chứng TRƯỚC khi giao** — ⛔ không để phiên khác tự mò) |
| ⚠️ **CẢNH BÁO KÈM THEO (⭐ nói thẳng — ⛔ không giấu)** | ⚠️ tài khoản **`e2e.ns`** (**nhãn role `hr`**) **CŨNG có 15 dòng `admin*`** (nguồn `company_leadership`) ⇒ ⚠️ bản vá **cũng mở cho nó** — ⭐ điều này **KHỚP DỮ LIỆU QUYỀN** (⛔ **không phải lỗ hổng do bản vá**), ⚠️ **NHƯNG** nó là **DỊ THƯỜNG DỮ LIỆU ĐÃ BIẾT (lỗi `L-14`)**: `e2e.ns` mang **phạm vi cấp director** dù nhãn là `hr` (⭐ ghi trong `tools/viet-bao-cao-gd3-9.mjs`: «e2e.ns đang mang mã vai trò director thay vì hr … Xem mục lỗi L-14») ⇒ ⭐ **`L-14` nên được xử lý RIÊNG** (⚠️ ⛔ đừng lấy nó làm cớ giữ `BUG-C14`) |
| **STATUS** | `OPEN` — ⭐ **bản vá đã được tiền kiểm chứng**, ⚠️ chỉ chờ phiên 01 áp (⛔ `page.tsx` = LOCK) |
---

## HANDOFF-20261007-C23 — ⚠️ **NGOÀI PHẠM VI PHIÊN 03 (HR–TEAMS)** ⇒ giao **`ERP-SESSION-01`** (**PR&PO – ADMIN**): 🔴 **`hasAdminTab` LUÔN TRẢ `FALSE`** (đo trên 4 tài khoản thật) ⇒ **mọi cổng dựa vào nó bị KHOÁ VĨNH VIỄN**

| ⭐ | ⭐ |
|---|---|
| **FROM → TO** | `ERP-SESSION-03` (**HR–TEAMS**) → ⭐ **`ERP-SESSION-01`** (**PR&PO – ADMIN**) |
| ⭐ **LÝ DO GIAO (⭐ user chốt 10/10/2026)** | USER: «việc của session 3 là nhóm **HR - TEAMS** còn session 1 là **PR&PO - ADMIN** ⛔ đừng có vượt quyền chỉ làm việc của mình thôi» ⇒ ⭐ tệp liên quan thuộc **ADMIN** ⇒ ⛔ phiên 03 **KHÔNG sửa**, ⭐ **chỉ ĐỌC + giao việc** |
| ⭐ **PHÁT HIỆN (⭐ đo trên DỮ LIỆU THẬT)** | ⭐ Mô phỏng **CHÍNH XÁC** `hasAdminTab` (đọc `allModulePermissions` lọc theo `userId` của người đăng nhập) trên **4 tài khoản**:<br>· `giamdoc.demo` ⇒ **0 dòng** cho chính họ ⇒ `hasAdminTab(admin_tab_01/06)` = **FALSE** (⚠️ trong khi **quyền HIỆU LỰC có** `admin_tab_06` = **TRUE**)<br>· `e2e.ns` ⇒ **0 dòng** ⇒ **FALSE** (⚠️ quyền hiệu lực **CÓ**)<br>· **`admin`** ⇒ **0 dòng** ⇒ ⭐ **FALSE** (❗ **ngay cả admin cũng FALSE**)<br>· `e2e.ksda` ⇒ 0 dòng ⇒ FALSE (✅ đúng — không có quyền) |
| ⭐ **NGUYÊN NHÂN** | `app/screens/AdminUserModalTabs.tsx:18-24`: ``export function hasAdminTab(data, moduleKey) { … (data.allModulePermissions ‖ []).some(p => String(p.userId) === me && String(p.moduleKey) === moduleKey && Number(p.canView) === 1) }``<br>⚠️ `allModulePermissions` = **quyền cấp TAY theo từng người** — ⭐ **KHÔNG chứa dòng của chính người đang đăng nhập** trong dữ liệu hiện tại ⇒ ⭐ hàm **gần như luôn FALSE** |
| 🔴 **HỆ QUẢ (⚠️ đã có dấu vết trong mã)** | ⚠️ `app/page.tsx` có chú thích cũ: «⚠️ Bản vá lần 1 chỉ dùng `hasAdminTab(data,"admin")` — … **chính admin = 0**) ⇒ ⭐ `hasAdminTab` trả **FALSE** ⇒ ⭐ **NÚT BƯỚC 14 BỊ KHOÁ VĨNH VIỄN**» ⇒ ⭐ **cùng kết luận, ⛔ chưa được sửa tận gốc**<br>⚠️ Mọi cổng **CHỈ** dựa `hasAdminTab` (không OR với `role === "admin"`) ⇒ ⛔ **vĩnh viễn ẩn/khoá**: nút «Sửa tài khoản» · `coQuyenBaoLoi` · `canAccount`/`canAccess` của **2 thẻ trong modal Sửa tài khoản** (`AdminUserModalTabs`) |
| ⭐ **HƯỚNG VÁ ĐỀ XUẤT (⭐ cho PHIÊN 01 — ⛔ phiên 03 không sửa)** | ⭐ đọc **QUYỀN HIỆU LỰC** thay vì quyền cấp tay:<br>``const row = (data.modulePermissions ‖ []).find(p => String(p.moduleKey) === moduleKey); return Number(row?.canView) === 1;``<br>⭐ (⭐ nên **bao gồm cả `admin`** cho nhất quán với `modulePermission()` trong `lib/permissions.ts` — ⭐ helper đó **đã đúng** và đọc `data.modulePermissions`) |
| **TEST ĐỀ XUẤT** | ⭐ **có đối chứng âm**: (a) user có `admin_tab_06` **trong `modulePermissions`** + ⛔ không có trong `allModulePermissions` ⇒ `hasAdminTab` **PHẢI trả TRUE** · (b) user ⛔ không có quyền ⇒ **FALSE** · ⭐ (c) `admin` ⇒ **TRUE** |
| **RỦI RO** | ⚠️ **TRUNG BÌNH–CAO**: ⚠️ sửa helper này **mở nhiều cổng cùng lúc** (⚠️ **đúng ý định** — nhưng phiên 01 phải **kiểm lại từng cổng** sau khi sửa, ⛔ không chỉ sửa hàm) |
| **STATUS** | `OPEN` — ⭐ **⛔ phiên 03 KHÔNG sửa** (⚠️ chỉ ĐỌC tệp ADMIN + giao việc) |
---

## HANDOFF-20261007-C24 — ⚠️ **TỰ KHAI BÁO VƯỢT PHẠM VI**: phiên 03 **ĐÃ SỬA** `lib/workflow-helpers.ts` (vòng 56) — **thuộc WORKFLOW/ADMIN** ⇒ giao phiên 01 quyết định **GIỮ hay HOÀN**

| ⭐ | ⭐ |
|---|---|
| **FROM → TO** | `ERP-SESSION-03` (HR–TEAMS) → ⭐ **`ERP-SESSION-01`** (PR&PO – ADMIN) |
| ⚠️ **TÔI ĐÃ LÀM GÌ NGOÀI PHẠM VI** | ⭐ vòng 56 phiên 03 sửa **`lib/workflow-helpers.ts`** (**15 thêm / 1 bớt**) — hàm `workflowApproverCandidates`: ⭐ thêm nhánh xét **quyền DUYỆT cấp PHÒNG BAN** (`departmentModulePermissions` + `canApprove`) |
| ⭐ **VÌ SAO TÔI TƯỞNG TRONG PHẠM VI** | ⚠️ lúc đó phiên 03 hiểu phạm vi là `app/screens/**` (trừ tệp của phiên 02) + `lib/**` ⇒ ⚠️ **hiểu SAI**; ⭐ **nay user chốt**: phiên 03 = **HR–TEAMS**, phiên 01 = **PR&PO – ADMIN** ⇒ ⚠️ **workflow/phê duyệt thuộc PHIÊN 01** |
| ✅ **CHẤT LƯỢNG CỦA THAY ĐỔI (⭐ để phiên 01 quyết định)** | ⭐ đã **kiểm chứng**: cổng `mt3-c16` (**4/4**, có **đối chứng âm** + **chốt vùng phủ**) · ⭐ **đo tác động thật**: module `approvals` **26 → 61** người duyệt hợp lệ (**+35**) · ⭐ **xác minh trên GIAO DIỆN THẬT** (📸 `evidence/BUG-C13-3-badge-NHAPKHO-073196.png`: người duyệt theo **phòng ban** hiện **«Có quyền duyệt»**) · ✅ `tsc`/`eslint` 0 · ✅ hồi quy **xanh** |
| ⭐ **VIỆC PHIÊN 01 CẦN LÀM (⭐ 1 trong 2)** | ⭐ **(a) GIỮ**: ⭐ coi đây là bản vá **đã có bằng chứng** cho lớp «UI bỏ qua quyền PHÒNG BAN» (⭐ cùng họ `BUG-C13`/`C14`) và **nhận quyền sở hữu** tệp · ⭐ **(b) HOÀN**: ``git checkout -- lib/workflow-helpers.ts`` ⚠️ (⚠️ khi đó `tests/mt3-c16` sẽ **ĐỎ** ⇒ ⚠️ phải xoá/gỡ cổng tương ứng, ⭐ và ⚠️ **lỗi ẩn người duyệt theo phòng ban quay lại**) |
| ⚠️ **CAM KẾT CỦA PHIÊN 03** | ⛔ từ nay **KHÔNG sửa** bất kỳ tệp nào ngoài **HR–TEAMS** (⚠️ `lib/workflow-helpers.ts` · `WorkflowModal.tsx` · `AdminUserModalTabs.tsx` · `page.tsx` · PR/PO · ADMIN …) — ⭐ **chỉ ĐỌC + GHI HANDOFF** |
| **STATUS** | `OPEN` — ⭐ chờ phiên 01 chọn **(a) hay (b)** |
---

## HANDOFF-20261007-C25 — ⚠️ **SỰ CỐ DỊCH VỤ TẠM THỜI** do **đổi dấu vân tay** ⇒ giao **`ERP-SESSION-01`** (⚠️ tệp định danh thuộc LOCK phiên 01) — ⭐ **KHÔNG sửa gì, chỉ báo cáo + 1 khuyến nghị**

| ⭐ | ⭐ |
|---|---|
| **FROM → TO** | `ERP-SESSION-03` (HR–TEAMS) → ⭐ **`ERP-SESSION-01`** (sở hữu `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json`) |
| ⭐ **HIỆN TƯỢNG (đo được)** | ⚠️ **13:39:08** `lib/vntech-identity-data.mjs` + `VNTECH_FINGERPRINT.json` **bị sửa** (⭐ `git diff --numstat`: **5+/5−** và **4+/4−**) ⇒ ⚠️ phiên 03 khởi động lại dịch vụ lúc đó ⇒ **`scripts/local-runtime.mjs:177` TỪ CHỐI KHỞI ĐỘNG**:<br>``Error: Dau van tay san pham VNTECH khong hop le hoac da bi thay doi.``<br>⇒ 🔴 **GUI DOWN** (⚠️ `:8787` DOWN · `:9000` nghe nhưng ⛔ không trả lời) trong **~4 phút** |
| ✅ **ĐÃ TỰ KHẮC PHỤC (⭐ không sửa mã nguồn)** | ① ⭐ chẩn đoán **chỉ đọc** ⇒ xác định **mốc thời gian** (định danh sửa **sau** build `0350` 13:27:12 ✅) ⇒ ⭐ **kết luận: KHÔNG phải lỗi của phiên 03** ✅<br>② ⭐ dùng **công cụ chuẩn của dự án**: ``node tools/set-local-identity.mjs`` ⇒ trả về «**Đã khớp — không cần sửa**» ⇒ ⭐ **hoá ra SSOT và `.local-data` ĐÃ KHỚP** ⇒ ⚠️ sự cố chỉ là **TẠM THỜI trong lúc phiên 01 đang đổi dấu vân tay** ✅<br>③ ⭐ **dịch vụ tự lên lại** (PID 13120) ⇒ ✅ `:8787` **HTTP 200** · `:9000` **HTTP 200** · **cổng dự án ĐẠT** (`✓ van-tay HTML mang 191a8e0ca3f6c363 · khop SSOT`) |
| ⭐ **KHUYẾN NGHỊ CHO PHIÊN 01 (⭐ 1 việc nhỏ)** | ⚠️ khi **đổi dấu vân tay**: ⭐ nên **chạy `node tools/set-local-identity.mjs` NGAY** sau khi sửa SSOT (⭐ ⛔ không chờ) ⇒ ⚠️ tránh cửa sổ **vài phút** mà **mọi phiên khác** không khởi động được dịch vụ (⚠️ và ⚠️ mọi **ảnh chụp/kiểm thử** trong cửa sổ đó **hỏng**); ⭐ và nếu dấu vân tay mới cần áp cho **môi trường khác** ⇒ ⭐ **phải có migration tương ứng** (⚠️ phiên 03 ⛔ không tạo migration — ⛔ thuộc phiên 01) |
| ⚠️ **BÀI HỌC CỦA PHIÊN 03 (⭐ 2 điều, đã ghi `DEV_LOG`)** | ① ⛔ **KHÔNG pipe output server dài hạn** — ⚠️ ``… ‖ Select-Object -Last 2`` **đóng pipe ⇒ GIẾT tiến trình** (⚠️ đã xảy ra thật ở vòng 64!) → ⭐ chạy **job nền KHÔNG pipe** ✅<br>② ⚠️ **TRƯỚC KHI khởi động lại dịch vụ dùng chung** ⇒ ⭐ **kiểm cổng đã có ai phục vụ chưa** (`EADDRINUSE` = ⚠️ **phiên khác đã lên** ⇒ ⛔ đừng khởi động lại) |
| **STATUS** | ✅ `RESOLVED` (⚠️ dịch vụ đã lên · ⛔ không mất dữ liệu · ⛔ không sửa mã) — ⭐ chỉ còn **1 khuyến nghị** cho phiên 01 |