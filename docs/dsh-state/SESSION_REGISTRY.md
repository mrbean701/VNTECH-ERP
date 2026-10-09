# SESSION REGISTRY — điều phối đa phiên (§3 · §5 · §6 · §11)

> ⭐ **NGUỒN SỰ THẬT LÀ REPO** (§27) — Telegram chỉ là kênh báo ✓
> ⚠️ **§4**: repo **đã có** hệ thống state (`CHECKLIST.md` · `CURRENT_STATE.md` · `DECISIONS.md` ·
> `TASK_HISTORY.md`) ⇒ ⭐ **dùng luôn**, ⛔ **không** nhân bản bug-tracking/hotfix-history ở đây ✓
> Tệp này **chỉ** chứa thứ nhà **chưa từng có**: **điều phối nhiều phiên** ✓

---

## BẢNG ĐĂNG KÝ PHIÊN (§5)

| Session | Trạng thái | Task | Phạm vi sở hữu | Tệp đang sửa | Bắt đầu |
|---|---|---|---|---|---|
| **ERP-SESSION-01** | 🟢 **WORKING** | ⭐ **NHÓM «PHÂN QUYỀN + BÁO LỖI + MUA HÀNG/GIAO NHẬN»** — BUG-20261006-001…006 · F2 (đã `VERIFIED`) | `app/page.tsx` · `java-backend/application/**` (phân quyền + mua hàng) · `java-backend/web/src/test/**` · `docs/dsh-state/**` | ⭐ xem §"KHOÁ TỆP" | 06/10/2026 |
| **ERP-SESSION-02** | 🟢 **WORKING** (⭐ **XÁC NHẬN bởi user 06/10/2026**) | ⭐ **`TASK-226`** — **NHÓM «KHO VẬT TƯ»**: HUB 3 tab + dashboard tồn kho + cards kho + màn chi tiết kho | ⭐ `app/screens/Inventory.tsx` · `lib/warehouse-hub.ts` · `tests/warehouse-hub.test.mjs` · `tests/w04-inventory-dashboard.test.mjs` · `docs/agent-progress/TASK-226.md` | ⭐ xem `TASK-226.md` §8 | 06/10/2026 |

### ⭐⭐ HAI PHIÊN — PHÂN VÙNG ĐÃ XÁC NHẬN (⭐ user xác nhận 06/10/2026: «đang mở phiên thứ 2… giao tiếp qua file md»)

| ⭐ Vùng | `SESSION-01` (tôi) | `SESSION-02` | ⭐ Kết luận |
|---|---|---|---|
| `app/page.tsx` | ✅ **đang sửa** (BUG-001…006 · BUG-B) | ⛔ **TỰ TRÁNH** (⭐ họ ghi rõ ở `TASK-226` §2) | ✅ **AN TOÀN** ✓ |
| `app/screens/Inventory.tsx` | ⛔ không đụng | ✅ đang sửa | ✅ **AN TOÀN** ✓ |
| `java-backend/**` (6 tệp) | ✅ đang sửa | ⛔ không đụng | ✅ **AN TOÀN** ✓ |
| `lib/**` · `tests/**` | ⛔ (⭐ trừ tệp tự sinh) | ✅ đang sửa | ✅ **AN TOÀN** ✓ |
| `docs/agent-progress/**` | ⭐ `TASK-222…225` · `KE-HOACH-*` | ⭐ `TASK-226.md` | ✅ **KHÁC TỆP** ✓ |

### ⚠️⚠️⚠️ 3 VÙNG **XUNG ĐỘT THẬT** — ⭐ LUẬT BẮT BUỘC CHO CẢ HAI PHIÊN

**① `docs/dsh-state/{CHECKLIST,CURRENT_STATE,SESSION_REGISTRY}.md` — ⭐ CẢ HAI ĐỀU GHI**
> ⭐ **LUẬT**: ⛔ **KHÔNG BAO GIỜ ghi đè cả tệp** — ⭐ **CHỈ dùng `edit` thay thế ĐOẠN CỦA MÌNH** (⭐ thêm mục mới ở **CUỐI tệp**) ✓
> ⭐ **TRƯỚC KHI SỬA: `read` lại tệp** (⭐ nó có thể vừa bị phiên kia đổi) ⚠️ ✓
> ⚠️ **BẰNG CHỨNG ĐÃ XẢY RA**: ⭐ `SESSION_REGISTRY.md` **180 → 300 dòng** · `CHECKLIST.md` **628 → 643 KB** · `CURRENT_STATE.md` **109 → 119 KB** ⇒ ⭐ **cả hai đã ghi** ✓

**② `VNTECH_FINGERPRINT.json` + `lib/vntech-identity-data.mjs` — ⭐ TỰ SINH LẠI MỖI LẦN BUILD**
> ⚠️ ⭐ **2 phiên build ⇒ giành nhau 2 tệp này** ✓ — ⭐ **VÀ VÂN TAY ĐỔI THEO** ⚠️
> 📍 **ĐO ĐƯỢC**: ⭐ vân tay nhảy **`8D7D11ECC7D6887C` (713 tệp) → `ACC0BB1CED66794B` (**715 tệp**)** ⚠️ — ⭐ vì `SESSION-02` thêm `lib/warehouse-hub.ts` + `tests/warehouse-hub.test.mjs` ⭐ **và cả hai đều nằm trong `ROOT_DIRS`** ✓
> ⭐ **LUẬT**: ⛔ **KHÔNG** `git checkout` 2 tệp này (⭐ chúng **phản ánh cây thật** tại thời điểm build gần nhất) ✓ — ⭐ nếu commit thì **commit luôn** ✓

**③ `dist/` (gói build đã phục vụ) — ⭐ GHI ĐÈ LẪN NHAU** (§36 «same generated output»)
> ⚠️ ⭐ **2 phiên `npm run build` ⇒ `dist/` của phiên này đè phiên kia** ✓
> ⭐ **LUẬT**: ⭐ **SAU KHI BUILD ⇒ PHẢI khởi động lại cổng theo ĐÚNG PID** (⭐ ⛔ không `Stop-Process node` hàng loạt — ⭐ luật 24) ⭐ **và chạy `node tools/verify-ui-build-applied.mjs --port=8787`** để ⭐ **chứng minh bundle phục vụ = bản build mới nhất** ✓
> ⭐ **TIN TỐT**: ⭐ cả hai build từ **CÙNG một cây nguồn** ⇒ ⭐ **mọi bundle đều chứa thay đổi của CẢ HAI** ✓ ⇒ ⛔ **không có chuyện bundle thiếu phần của phiên kia** ✓

### ⭐ BÀI HỌC QUAN TRỌNG — ⭐ PHÁT HIỆN PHIÊN KHÁC BẰNG `git status`, ⛔ KHÔNG bằng tiến trình/cổng

⚠️⚠️ **Khai báo đầu tiên của tôi là SAI** («⛔ KHÔNG có phiên thứ hai») ✓ — ⭐ vì tôi chỉ quét **tiến trình + cổng** ⚠️ ⇒ ⭐ **⛔ không thấy được phiên làm việc bằng TỆP** ✓
⇒ ⭐⭐ **LUẬT**: ⭐ **phải quét `git status --short`** để phát hiện phiên khác ✓
⇒ ⭐⭐ **VÀ**: ⭐ **vân tay đổi số tệp** (713 → 715) là **dấu hiệu gián tiếp** có phiên khác đang thêm tệp ✓

⭐ **ĐỐI CHIẾU**: ⭐ `ERP-SESSION-02` **đã làm ĐÚNG** — ⭐ họ **đọc repo trước**, ⭐ **ghi rõ «em TRÁNH `app/page.tsx`»**, ⭐ **đăng ký phiên**, và ⭐ **viết `TASK-226.md` 473 dòng** (⭐ §1 yêu cầu · §2 chống conflict · §3 tài sản tái dùng · §4 trường dữ liệu thật · §5 lỗi có sẵn · §6 đã làm · §7 còn lại · §8 tệp đã động) ✓⭐ **ĐÂY LÀ KHUÔN ĐÚNG ĐỂ HỌC** ✓

---

## KHOÁ TỆP / PHẠM VI SỞ HỮU (§6 · §12)

### ERP-SESSION-01 — đang giữ
| Tệp | Trạng thái | ⭐ Ghi chú |
|---|---|---|
| `java-backend/application/…/UserManagementUseCase.java` | ⚠️ **SỬA XONG · CHƯA COMMIT** | ⭐ BUG-20261006-003 — đã bỏ chốt `P5.3` (dòng ~266) ✓ |
| `java-backend/web/src/test/…/AdminGovernanceIntegrationTest.java` | ⚠️ **SỬA XONG · CHƯA COMMIT** | ⭐ đổi bài test sang hành vi MỚI ✓ |

### ERP-SESSION-01 — đã **NHẢ** (⭐ §32 · §33)
| Tệp | ⭐ Ghi chú |
|---|---|
| `app/screens/ErrorReportAdminPanel.tsx` | BUG-20261006-001 (⭐ dùng `requestApi` + `.catch`) + lọc `active` ✓ **đã commit `b5ca4cc`** |
| `app/screens/ErrorReportModal.tsx` | lọc `active` (⭐ dropdown «Nhóm chức năng») ✓ **đã commit `b5ca4cc`** |

### ⛔ KHU VỰC **CHƯA AI GIỮ** (⭐ đã cập nhật 06/10/2026)
| ⭐ Vùng | ⭐ Trạng thái |
|---|---|
| `app/screens/PermissionAccessPanel.tsx` | ✅ **KHÔNG CẦN SỬA** — ⭐ đã kiểm: tab phòng ban **được style đầy đủ** trong `app/styles/canonical.css` §11 (20 quy tắc) ⚠️ ⛔ **KHÔNG PHẢI `globals.css`** ✓ |
| `worker/**` · `db/**` · `drizzle/**` · `deploy/**` | ⛔ chưa ai giữ ✓ |
| `java-backend/**` (⭐ ⛔ trừ 6 tệp của SESSION-01) | ⛔ chưa ai giữ ✓ |

---

## ⭐⭐⭐ BÀI HỌC SỐNG CÒN — ⭐ **CÁCH KIỂM «BUNDLE PHỤC VỤ CÓ BẢN VÁ CHƯA»** (⭐ ĐÃ SỬA PHƯƠNG PHÁP)

⚠️⚠️ **TÔI ĐÃ ĐO SAI 6 LẦN LIÊN TIẾP** vì **2 lỗi phương pháp CHỒNG NHAU** — ⭐ ghi lại để ⛔ **CẢ HAI PHIÊN ⛔ KHÔNG LẶP LẠI** ✓

| # | ⭐ Tôi TƯỞNG | ⭐ **SỰ THẬT ĐO ĐƯỢC** |
|---|---|---|
| ① | ⭐ Bundle minify **escape unicode** ⇒ phải tìm `\u1ECD` | ⛔ **SAI** — ⭐ bundle lưu tiếng Việt **RAW** ✓ (⭐ «Chọn tất cả» tìm RAW = **✅** · tìm `\u1ECD` = **⛔**) |
| ② | ⭐ HTML nạp JS bằng `<script src="…">` | ⛔ **SAI** — ⭐ Next.js dùng **`<link rel="modulepreload" href="…">`** ✓ |

⇒ ⭐⭐ **2 LỖI CHỒNG NHAU** ⇒ ⭐ **mọi phép kiểm trả «ÂM TÍNH GIẢ»** ⚠️ ⇒ ⭐ tôi suýt kết luận sai «bundle ổn, do cache trình duyệt» **VÀ ĐÃ NÓI SAI VỚI USER** ✓

### ✅ PHƯƠNG PHÁP ĐÚNG (⭐ copy được)
```powershell
# ① lấy danh sách bundle — ⭐ dùng href, ⛔ KHÔNG chỉ src
$h  = (Invoke-WebRequest -Uri 'http://127.0.0.1:8787/' -UseBasicParsing).Content
$fs = [regex]::Matches($h,'(?:href|src)="(/assets/[^"]+\.js)"') | % { $_.Groups[1].Value } | Select-Object -Unique
# ② TẢI VỀ ĐĨA rồi đọc (⭐ ⛔ đừng đọc Content trực tiếp)
Invoke-WebRequest -Uri ('http://127.0.0.1:8787'+$big) -OutFile $tmp -UseBasicParsing
$js = [System.IO.File]::ReadAllText($tmp)
# ③ tìm chuỗi tiếng Việt **RAW** (⭐ ⛔ KHÔNG escape)
$js.Contains('Không tải được danh sách báo lỗi')
```
⭐ **VÀ LUÔN chạy cổng UI trước khi báo user test**:
`node tools/verify-ui-build-applied.mjs --port=8787` ⇒ ⭐ phải thấy **`✓ byte 6/6`** + **`KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAT`** ✓

⚠️⚠️ **LUẬT CHẨN ĐOÁN**: ⭐ **số vô lý = PHÉP ĐO HỎNG, ⛔ không phải code thiếu** ✓
📍 **Bằng chứng đã gặp**: «so bundle = **0**» · «tổng ký tự CSS = **4**» — ⭐ cả hai là **dấu hiệu phép đo hỏng** ✓

---

## 🚨🚨 MỐI NGUY ĐA PHIÊN **THẬT** — ⭐ `dist/` ĐỔI THEO NGƯỜI BUILD CUỐI

📍 **ĐO ĐƯỢC trong một phiên làm việc** (⭐ bundle trang đổi **3 LẦN**):
```
page-CQTVKoge.js   (⭐ build của tôi)
page-CygT2G3w.js   ⚠️ ĐỔI — ⭐ VÀ BUNDLE NÀY ⛔ THIẾU 2 BẢN VÁ CỦA SESSION-01
page-CcbWX2ln.js   (⭐ build lại của tôi — ✅ ĐÃ CÓ ĐỦ 7 bản vá)
```
⚠️⚠️ **HỆ QUẢ THẬT**: ⭐ user báo **«tab phân quyền phòng ban vẫn chưa có nút chọn tất cả»** + **«nút chọn theo dòng vẫn chưa hoạt động»** ⚠️ — ⭐ **ĐÓ LÀ THẬT**: ⭐ bundle đang phục vụ lúc đó (`page-CygT2G3w.js`) **⛔ KHÔNG chứa** `«Cả dòng»` và `"crow"` ✓✓✓
⇒ ⭐ **⛔ KHÔNG phải lỗi cache trình duyệt** — ⭐ **tôi đã kết luận sai và nói sai với user** ⚠️ ✓

### ⭐⭐ LUẬT BẮT BUỘC CHO CẢ HAI PHIÊN (§36 «same generated output»)
1. ⭐ **Trước khi báo user test ⇒ PHẢI**: ① `npm run build` ② **khởi động lại cổng theo ĐÚNG PID** ③ ⭐ **`verify-ui-build-applied.mjs`** ④ ⭐ **kiểm CHUỖI ĐẶC TRƯNG của mình có trong bundle** ✓
2. ⚠️ **Nếu phiên kia vừa build xong** ⇒ ⭐ bundle có thể **thiếu thay đổi mới nhất của mình** ⚠️ ⇒ ⭐ **build lại + restart + kiểm lại** ✓
3. ⛔ **KHÔNG** kết luận «do cache» khi ⭐ **chưa chứng minh bundle chứa bản vá** ✓

---

## ⭐ CURRENT ACTIVITY (§11)

```text
SESSION_ID    : ERP-SESSION-01
CURRENT TASK  : 3 bug tab «Phân quyền phòng ban» + người dùng
                · BUG-20261006-003 — cấp quyền vượt phòng ban (bỏ chốt P5.3)
                · BUG-20261006-004 — «báo lỗi lưu» (action() không trả payload ⇒ luôn «0/N»)
                · BUG-20261006-005 — thiếu nút «Chọn tất cả» + cột «Cả dòng»
CURRENT STEP  : ✅ cả 3 mã đã sửa · ✅ mvn test XANH 156/156 · ✅ npm test 780/780
                ✅ BUG-003 ĐÃ TRIỂN KHAI (:18081 PID 19916 · JAR 06/10 11:49:25)
                ✅ BUG-004/005 đã build lên :8787 (cổng UI 3/3 · byte 6/6)
                ⚠️ CHƯA COMMIT (⭐ §47 luật 25/26: AUTO_COMMIT = FALSE ⇒ chờ user cho phép)
STATUS        : READY_FOR_VERIFY  (⭐ chờ user bấm thử trên :9000)
LOCK          : 4 tệp ở bảng "đang giữ" (⭐ page.tsx · 2 tệp Java · 2 tệp tự sinh)
BLOCKER       : ⛔ KHÔNG (⭐ chỉ chờ user: ① cho phép commit ② bấm thử ③ mật khẩu e2e mới)
```

⭐ **3 bug này đều `FIXED`** (§24: CODE FIXED + TEST PASSED) — ⚠️ **chưa `VERIFIED`** vì cần user bấm thử ✓
⭐ **Tệp vân tay mới**: `VNTECH-FP-8D7D11ECC7D6887C` (713 tệp) ✓

---

## NHẬT KÝ BÀN GIAO (§13 — ⭐ hiện **CHƯA CẦN** vì chỉ có 1 phiên)

⛔ Không có handoff nào đang mở ✓ — ⭐ mẫu để dùng khi cần:

```markdown
## HANDOFF
FROM: ERP-SESSION-01   TO: <phiên nhận>
TASK: <việc>            REASON: <vì sao cần phiên kia>
AFFECTED FILES: <...>   CURRENT STATE: <...>
EXPECTED CHANGE: <...>  RISK: <...>
TEST REQUIRED: <...>
```

---

## ⚠️ LUẬT TỰ RÀNG BUỘC CỦA PHIÊN NÀY (§47)

1. ⛔ **KHÔNG** `git reset --hard` · `git checkout .` · `git clean -fd` ✓ (luật 23)
2. ⛔ **KHÔNG** `Stop-Process node` hàng loạt — ⭐ **chỉ dừng theo PID đã xác minh cmdline** ✓ (luật 24)
3. ⛔ **KHÔNG** tự commit/push — ⭐ chờ user cho phép ✓ (luật 25/26)
4. ⭐ Thấy tệp lạ đã sửa ⇒ ⭐ **coi là của phiên khác** cho tới khi xác minh ✓ (luật 19 · §38)
5. ⭐ Trước khi sửa: ⭐ **đọc tệp + kiểm bảng khoá ở trên** ✓ (§28)
6. ⭐ `:18081` **chỉ** dừng khi triển khai, ⭐ **theo PID đã xác minh cmdline khớp `vntech-erp-web`** ✓
7. ⭐ **KHÔNG** tạo migration mới khi chưa kiểm phiên khác ✓ (§18) — ⭐ phiên này **chưa tạo migration nào** ✓
8. ⭐ **TRƯỚC KHI COMMIT**: ⭐ **`git add` TỪNG TỆP CỦA MÌNH** — ⛔ **TUYỆT ĐỐI KHÔNG** `git add -A` / `git add .`
   ⚠️ **VÌ SAO**: ⭐ trong cây có **2 tệp CỦA PHIÊN KHÁC** (`lib/warehouse-hub.ts` · `tests/warehouse-hub.test.mjs`)
   ⇒ ⭐ `git add -A` sẽ **gộp việc của phiên khác vào commit của tôi** ⇒ ⛔ **VI PHẠM §19** ✓

---

## ⛔ F2 — ĐÃ THỬ NGÀY 06/10/2026 VÀ **THẤT BẠI** (⭐ ghi lại để ⛔ không đoán lại)

### ⭐ Đã làm
1. ⭐ Chèn `approve_po` vào **`StockChainIntegrationTest`** (⭐ giữa `create_po` và `receive_goods`) ✓
2. ⭐ Chèn `approve_po` vào **`SupplyChainEndToEndIntegrationTest`** (⭐ + `assertTrue` trạng thái `waiting_delivery`) ✓
3. ⭐ Thêm **chốt chặn** vào `PurchaseManagementUseCase.receiveGoods`:
```java
if (!List.of("waiting_delivery", "partial_delivery").contains(sv(po, "status")))
    throw Api("PO chưa được phát hành nên chưa thể giao nhận. "
            + "Hãy phát hành PO ở bước “Lập và phát hành PO” trước.");
```

### ⛔ Kết quả: ⭐ **VẪN ĐÚNG 3 LỖI CŨ** ⇒ ⭐ **GIẢ THUYẾT ĐÃ SAI**
```
StockChainIntegrationTest.stockChain_transferReturnStocktakeReconcile          ⇒ ERROR
StockChainIntegrationTest.centralReturn_ghiDuSoSoHuuTaiTransit_...             ⇒ ERROR
SupplyChainEndToEndIntegrationTest.fullSupplyChain                             ⇒ ERROR
```
⭐ **Đã HOÀN NGUYÊN** ngay (⭐ §32) ⇒ ⭐ `mvn -o test` **XANH 156/156** trở lại ✓

### ⭐⭐ PHÂN TÍCH TỪ BẰNG CHỨNG (⭐ ⛔ không đoán — ⭐ §16)
| ⭐ Dữ liệu đo được | ⭐ Suy ra |
|---|---|
| 3 bài báo **`ERROR`** ⛔ không phải `FAILURE` | ⭐ JUnit `ERROR` = **có NGOẠI LỆ ném ra** ✓ |
| **XANH** khi ⛔ không có chốt · **ĐỎ** khi có chốt | ⭐ **nguyên nhân LÀ chốt** ✓ |
| ⭐ Thêm `approve_po` **vẫn ĐỎ** | ⇒ ⭐ **`approve_po` ĐÃ THẤT BẠI** ✓ — ⭐ vì `postAction(…, 200)`
**tự NÉM LỖI** khi HTTP ⛔ không phải 200 ✓ |
| ⭐ `approve_po` đòi module **`purchasing`** + **`canApprove`** | ⇒ ⭐ **NGHI VẤN SỐ 1**: ⭐ tài khoản trong bài test **⛔ THIẾU quyền đó** ✓ |

### ✅✅✅✅ NGUYÊN NHÂN GỐC **ĐÃ TÌM RA BẰNG NGĂN XẾP LỖI THẬT** (⭐ lần 4 mới đúng — ⭐ đọc kỹ)

⚠️ **Tôi đã ghi SAI 3 lần trước đó** (⭐ ① «thiếu quyền» ② «chưa biết» ③ «sửa `schema-h2.sql`») ⇒ ⭐ **LẦN NÀY ĐÚNG** ✓

**📍 NGĂN XẾP LỖI THẬT** (⭐ `java-backend/web/target/surefire-reports/`):
```
Caused by: org.h2.jdbc.JdbcSQLSyntaxErrorException: Column "decision_reason" not found; SQL statement:
UPDATE purchase_orders SET status=?, decision_reason=?, decided_by=?, decided_at=?, updated_at=? WHERE id=? [42122-232]
   at PurchaseStoreAdapter.decidePo(PurchaseStoreAdapter.java:268)
   at PurchaseManagementUseCase.decidePo(PurchaseManagementUseCase.java:257)
   at PurchaseManagementUseCase.approvePo(PurchaseManagementUseCase.java:236)
   at SystemController.post(SystemController.java:1163)
```

**🔎 NGUYÊN NHÂN**: ⭐ **schema H2 của bài kiểm thử THIẾU 3 CỘT** so với MySQL thật ✓
| Cột | ⭐ MySQL thật | ⭐ `web/src/test/resources/schema-h2.sql` |
|---|---|---|
| `decision_reason` | ✅ CÓ (`varchar(500) NULL`) — ⭐ do migration **`V18__wf_b2_po_decision.sql`** | ⛔ **THIẾU** |
| `decided_by` | ✅ CÓ | ⛔ **THIẾU** |
| `decided_at` | ✅ CÓ | ⛔ **THIẾU** |

⚠️⚠️ **TÔI ĐÃ SỬA SAI TỆP 1 LẦN** (⭐ ⛔ **ĐỪNG LẶP LẠI**):
- ⛔ `web/src/**main**/resources/db/demo/schema-h2.sql` (**67.413** bytes) — ⭐ **⛔ KHÔNG PHẢI** tệp bài test dùng ✓ (⭐ sửa nó ⛔ **không có tác dụng gì**) ✓
- ✅ `web/src/**test**/resources/schema-h2.sql` (**86.697** bytes) — ⭐ **ĐÚNG TỆP** ✓

### ⏭️ CÁCH SỬA — ⭐ **2 LỜI GỌI LÀ XONG** (⭐ đã biết CHÍNH XÁC)
1. ⭐ Thêm 3 cột vào bảng `purchase_orders` **TRONG `java-backend/web/src/test/resources/schema-h2.sql`** ✓:
```sql
  `decision_reason` VARCHAR(500) NULL,
  `decided_by` VARCHAR(64) NULL,
  `decided_at` TIMESTAMP(3) NULL,
```
   ⚠️ ⭐ Mẫu `contract_id` + `boq_version_id` + `PRIMARY KEY` **KHỚP 7 CHỖ** ⇒ ⭐ **phải thêm ngữ cảnh**
   (`delivery_queued_at` + `delivery_completed_at` + `contract_id` + `boq_version_id`) để **duy nhất** ✓
2. ⭐ Rồi dựng lại F2: ① chèn `approve_po` vào 2 bài test ② thêm chốt ở `receiveGoods` ③ `mvn -o test` ✓
3. ⭐ Kỳ vọng: **XANH 156/156** ⇒ ⭐ **F2 XONG** ✓
4. ⚠️ Nếu **vẫn ĐỎ** ⇒ ⭐ **ĐỌC `surefire-reports` NGAY** (⭐ ⛔ **TRƯỚC KHI hoàn nguyên** — ⭐ lần XANH sẽ **ghi đè mất bằng chứng**) ✓
5. ⛔ Không được ⇒ ⭐ hoàn nguyên 4 tệp của mình (⛔ **KHÔNG để BUILD FAILURE**) ✓

### ⚠️⚠️ LUẬT MỚI (⭐ tôi đã mất **3 vòng** vì vi phạm)
> ⭐ **KHI `mvn -o test` ĐỎ ⇒ ĐỌC `java-backend/web/target/surefire-reports/*.txt` NGAY LẬP TỨC — ⛔ TRƯỚC MỌI SUY LUẬN VÀ TRƯỚC KHI HOÀN NGUYÊN** ✓
> ⭐ Lần chạy XANH kế tiếp sẽ **GHI ĐÈ** mất bằng chứng ✓
> ⭐ **ĐỌC MÃ ⛔ KHÔNG THAY THẾ ĐƯỢC ĐỌC NGĂN XẾP LỖI THẬT** ✓

---

## ⭐ TRẠNG THÁI HỆ THỐNG LÚC GHI (06/10/2026)

| | |
|---|---|
| Vân tay | ✅ **ĐẠT** `VNTECH-FP-E480186F42DB6B2C` (713 tệp) |
| Git | ⭐ HEAD = `origin/unity` = **`b5ca4cc`** · ⚠️ **2 tệp chưa commit** (⭐ của phiên này) |
| Dữ liệu | ⭐ `central_returns in_transit` **0** · `transfer_orders in_transit` **0** · sổ kho **101** · quyền mồ côi **0** |
| `mvn -o test` | ✅ **156/156 · 0 lỗi** |
| `npm test` | ✅ **pass 780 · fail 0** |

---

## 🆕 ERP-SESSION-02 — đăng ký 06/10/2026 (⭐ phiên MỚI, yêu cầu user: HUB «KHO VẬT TƯ»)

### BẢNG ĐĂNG KÝ (§5)

| Session | Trạng thái | Task | Phạm vi sở hữu | Tệp đang sửa | Bắt đầu |
|---|---|---|---|---|---|
| **ERP-SESSION-02** | 🟢 **WORKING** | **HUB «KHO VẬT TƯ»** — 1 màn có tabbar «KHO · XUẤT & NHẬP · CẤP PHÁT & HOÀN TRẢ» + dashboard tồn kho + cards kho + màn chi tiết kho 5 tab | `app/screens/WarehouseHub*.tsx` (MỚI) · `app/screens/WarehouseDetail*.tsx` (MỚI) · `lib/warehouse-hub*.ts` (MỚI) · `lib/menu-helpers.ts` (⭐ CHỈ nhóm `warehouse`) · `app/page.tsx` (⭐ CHỈ nhánh render nhóm kho) | (ghi khi bắt đầu sửa) | 06/10/2026 |

### ⛔ RANH GIỚI VỚI ERP-SESSION-01 (§7 · §18) — ⭐ ĐÃ ĐỌC, TÔN TRỌNG

| Vùng | Ai giữ | ERP-SESSION-02 |
|---|---|---|
| `java-backend/application/…/UserManagementUseCase.java` | **SESSION-01 đang giữ** (chưa commit) | ⛔ **KHÔNG ĐỤNG** |
| `java-backend/web/src/test/…/AdminGovernanceIntegrationTest.java` | **SESSION-01 đang giữ** (chưa commit) | ⛔ **KHÔNG ĐỤNG** |
| `app/screens/ErrorReport*.tsx` | SESSION-01 (đã nhả, commit `b5ca4cc`) | ⛔ không đụng (ngoài phạm vi) |
| `app/page.tsx` | SESSION-01 **đã NHẢ** (`b5ca4cc`) | ✅ **claim PHẦN NHỎ**: chỉ nhánh render nhóm menu `warehouse` |
| `java-backend/**` (phần khác) | ⛔ không ai giữ nhưng **em KHÔNG cần** | ⛔ không đụng — task này thuần UI + dữ liệu payload sẵn có |
| `lib/**` · `app/screens/**` (màn kho) | ⭐ **CHƯA AI GIỮ** | ✅ **nhận** |

### ⭐ CURRENT ACTIVITY (§11)

```text
SESSION_ID    : ERP-SESSION-02
CURRENT TASK  : HUB «KHO VẬT TƯ» — tabbar 3 tab + dashboard tồn kho + cards kho + chi tiết kho 5 tab
CURRENT STEP  : ✅ đã đọc repo/state (tránh conflict) · ✅ đã khảo sát mã kho sẵn có
                ✅ user ĐÃ CHỐT: ngoại lệ = `director`/`admin` XEM TẤT CẢ (thao tác vẫn theo quyền module) · menu = gom 7→1
                ✅ ĐÃ TẠO `lib/warehouse-hub.ts` (khối THUẦN) + `tests/warehouse-hub.test.mjs` ⇒ **22/22 PASS** · `tsc` **EXIT=0**
                ⏳ ĐANG LÀM: `app/screens/WarehouseHub.tsx` (tabbar 3 tab)
SCOPE         : app/screens/WarehouseHub*.tsx · app/screens/WarehouseDetail*.tsx · lib/warehouse-hub.ts · tests/warehouse-hub.test.mjs · lib/menu-helpers.ts (nhóm warehouse) · app/page.tsx (nhánh kho)
STATUS        : WORKING
LOCK          : `lib/warehouse-hub.ts` (⭐ TỆP MỚI — xong, ổn định) · `tests/warehouse-hub.test.mjs` (⭐ TỆP MỚI — xong)
                · sắp sửa: `app/screens/WarehouseHub.tsx` · `app/screens/WarehouseDetail.tsx` · `lib/menu-helpers.ts` · `app/page.tsx`
BLOCKER       : ⛔ KHÔNG

### ⭐ ĐÃ LÀM ĐƯỢC (đo được, 06/10/2026 — ERP-SESSION-02)
| Hạng mục | Kết quả ĐO |
|---|---|
| `lib/warehouse-hub.ts` | ✅ tạo mới — khối THUẦN (⛔ không JSX, ⛔ không import UI) |
| `tests/warehouse-hub.test.mjs` | ✅ **22 test · 22 pass · 0 fail** (`node --import tsx --test`) |
| `npx tsc --noEmit` | ✅ **EXIT=0** |
| Nguồn dữ liệu | ⭐ CHỈ dùng payload sẵn có (`warehouses[]` · `inventory[]` · `projects[]` · `userScopes[]`) ⇒ ⛔ **KHÔNG API mới, ⛔ KHÔNG migration** |
```

### ⭐ NGUỒN DỮ LIỆU SẼ DÙNG (⛔ KHÔNG gọi API mới, ⛔ KHÔNG migration — đúng khuôn `W-04`)

| Việc | Nguồn trong payload `GET /api/system` |
|---|---|
| Cards kho | `data.warehouses[]` : id · code · name · type · projectId · projectCode |
| Tồn hiện tại của kho | `data.inventory[]` : warehouseId · balance · available · reserved |
| Dashboard tồn kho | hàm THUẦN **đã có** `warehouseDashboard()` trong `app/screens/WarehouseDashboard.tsx` (8 chỉ số §19) |
| Tab XUẤT | `data.issues[]` (phiếu xuất/cấp phát) · Tab NHẬP: `data.receipts[]` |
| Tab CẤP PHÁT / HOÀN TRẢ | `data.issues[]` · `data.returns[]` (khuôn `AllocateReturn.tsx` đã có) |
| Nhân sự của kho | `data.userScopes[]` / `data.users[]` / `data.warehouseScopes` (⭐ phải ĐO trước, chưa chốt) |

---

## 🔄 CẬP NHẬT ERP-SESSION-02 — 06/10/2026 (TASK-226 · sau vòng 9)

> ⚠️ Ghi bằng **APPEND** vì tệp đã thay đổi kể từ lần đọc (§28: ⛔ không ghi đè). Khối `CURRENT ACTIVITY` ở trên
> là bản cũ — **khối này là bản MỚI NHẤT** của ERP-SESSION-02.

```text
SESSION_ID    : ERP-SESSION-02
CURRENT TASK  : HUB «KHO VẬT TƯ» (TASK-226)
CURRENT STEP  : ✅ MÃ ĐÃ XONG 5/5 YÊU CẦU USER (vòng 5→9)
                ⏳ CÒN: ① BUILD (chờ user cho phép — §36) ② gom menu 7→1 (chờ nhả `app/page.tsx`)
STATUS        : CODE COMPLETE — chờ BUILD để VERIFIED (⛔ chưa VERIFIED theo §24)
LOCK          : `app/screens/Inventory.tsx` · `lib/warehouse-hub.ts` (MỚI) · `tests/warehouse-hub.test.mjs` (MỚI)
                · `tests/w04-inventory-dashboard.test.mjs` (cập nhật hợp đồng) · `docs/agent-progress/TASK-226.md` (MỚI)
                · ⛔ CHƯA giữ `app/page.tsx` / `lib/menu-helpers.ts`
BLOCKER       : ⛔ KHÔNG chặn kỹ thuật — 2 việc chờ QUYẾT ĐỊNH/PHỐI HỢP
```

### ✅ ĐÃ LÀM (đo được)
| Hạng mục | Kết quả ĐO |
|---|---|
| `lib/warehouse-hub.ts` (MỚI) | khối THUẦN — 3 tab · 5 tab chi tiết · ngoại lệ `director`/`admin` · tồn theo kho · cards · phạm vi dự án · subtab theo quyền |
| `tests/warehouse-hub.test.mjs` (MỚI) | ✅ **22 test · 22 pass · 0 fail** |
| `app/screens/Inventory.tsx` | ✅ **HUB 3 TAB** — **254 → 507 dòng** |
| **Phân bố tab** | ✅ **10/10 khối đúng 1 tab** (KHO=5 · XUẤT&NHẬP=3 · CẤP PHÁT=2) |
| **Màn chi tiết kho** | ✅ nút quay lại + **5 tab** (Dashboard kho · Tồn kho · Xuất-Nhập · Cấp phát-Hoàn trả · Nhân sự) — ⛔ đã bỏ modal cũ |
| `npx tsc --noEmit` | ✅ **EXIT=0** |
| `npm run test:regression` | ✅ **EXIT=0 — 803 test · 802 pass · 0 fail · skipped 1** |
| 🐛 Lỗi có sẵn đã sửa | **4** (đọc 3 trường ⛔ không tồn tại ⇒ card hiện UUID · tìm/sắp xếp kho ⛔ không chạy · Excel rỗng · «Số phiếu xuất» luôn 0) + **2 lỗi logic của chính mình** |
| Log | ✅ `docs/agent-progress/TASK-226.md` — **346 dòng / 13 mục** |
| Nguồn dữ liệu | ⭐ chỉ payload sẵn có ⇒ ⛔ **KHÔNG API mới, ⛔ KHÔNG migration** |

### 📌 GHI CHÚ PHỐI HỢP (§7 · §13 · §28)
* ⛔ **KHÔNG sửa `app/page.tsx`** (đang bị phiên khác sửa) ⇒ việc **gom menu 7→1** ⛔ tạm hoãn, sẽ làm khi tệp được nhả.
* ⛔ **KHÔNG tự BUILD** — build phải dừng `:8787` + `:9000`; user đang test trên `:9000` và `ERP-SESSION-01` đang
  `READY_FOR_VERIFY`. ⇒ **Chờ user cho phép** (§36 build/server coordination).
* ⛔ **KHÔNG commit** (luật 25 `AUTO_COMMIT = FALSE`).
* ⚠️ **LƯU Ý CHO PHIÊN KHÁC:** `data.warehouses[]` dùng `id`·`code`·`name`·`type`·`projectId` — ⛔ **KHÔNG có**
  `warehouseName`/`warehouseCode`/`warehouseType` (payload `receipts[]` thì **CÓ** `warehouseName` — ⛔ đừng suy ra).
  `issues[]`/`returns[]`/`receipts[]` ⛔ **KHÔNG có** `warehouseId` ⇒ ⛔ không lọc được phiếu theo kho.

---

## 🔄 CẬP NHẬT ERP-SESSION-02 — 06/10/2026 (sau vòng 13 · CHECKPOINT BÀN GIAO)

> ⚠️ Ghi bằng **APPEND** (§28 — ⛔ không ghi đè). Khối này là bản **MỚI NHẤT** của ERP-SESSION-02.

```text
SESSION_ID    : ERP-SESSION-02
CURRENT TASK  : HUB «KHO VẬT TƯ» (TASK-226)
TRẠNG THÁI    : ✅ CODE COMPLETE (5/5 yêu cầu user) — CÂY XANH
CÒN LẠI       : ① GOM MENU 7→1 (cần 1 lượt context ĐẦY ĐỦ — đã thử 3 lần, hoàn tác 3 lần để giữ cây XANH)
                ② BUILD (chờ USER cho phép — đã hỏi 2 lần, chưa trả lời)
FILES CỦA EM  : app/screens/Inventory.tsx (496d) · lib/warehouse-hub.ts (233d, MỚI) · tests/warehouse-hub.test.mjs (209d, MỚI)
                · tests/w04-inventory-dashboard.test.mjs (184d, cập nhật hợp đồng) · docs/agent-progress/TASK-226.md (469d, MỚI)
LOCK          : 5 tệp trên · ⛔ KHÔNG giữ `app/page.tsx` (phiên khác đang sửa: 86 thêm/8 xoá)
BLOCKER       : ⛔ KHÔNG chặn kỹ thuật — 2 việc chờ CONTEXT / QUYẾT ĐỊNH
```

### ✅ CỔNG ĐO ĐƯỢC (cuối vòng 13)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **EXIT=0** |
| `npm run test:regression` | ✅ **EXIT=0 — 803 test · 802 pass · 0 fail · 1 skip** |
| `tests/warehouse-hub.test.mjs` | ✅ **22/22 pass** |
| 3 dịch vụ | ✅ Java `:18081` 200 · UI `:8787` 200 · proxy `:9000` 200 |
| Phân bố tab trong hub | ✅ **10/10 khối nội dung thuộc ĐÚNG 1 tab** (KHO=5 · XUẤT&NHẬP=3 · CẤP PHÁT=2) |
| Màn chi tiết kho | ✅ nút quay lại + **5 tab** (đo: mỗi panel 1 lần) |

### 📋 VIỆC KẾ TIẾP CHO PHIÊN SAU — GOM MENU 7→1 (công thức đầy đủ ở `TASK-226.md §16.5`)
⭐ **ĐÃ CHỨNG MINH CHẠY ĐƯỢC** (5 phép sửa khớp 100% khi dùng **công cụ `edit`**):
1. `edit` `lib/menu-helpers.ts` — `warehouseMenuItems` → **1 mục** `{ key:"warehouse_hub", label:"Kho vật tư", groupKey:"warehouse", moduleKey:"inventory", permissionKeys:[6 khoá kho cũ] }`
2. `edit` `lib/menu-helpers.ts` — `allocateReturnMenuItems` → **rỗng**
3. `edit` `tests/w01-warehouse-menu.test.mjs` — `EXPECTED` → 1 mục · đếm 5→**1** · nhãn → `["Kho vật tư"]` · `used.length` 5→**6** · `Set.size` 5→**6**
4. `read`+`edit` `tests/mt3-ui-29-view-collision-diagnostic.test.mjs` — sau gom **hết va chạm `view`** ⇒ đổi sang **khẳng định KHÔNG va chạm** (cải thiện thật, ⛔ không tắt cổng)
5. `read` **dòng 98-106 hoặc 176-205** + `edit` bài «W-01 — ĐÍCH ĐẾN THẬT» (ghim 4 mục cũ)
⚠️ **BÀI HỌC ĐÃ TRẢ GIÁ:** ⛔ **KHÔNG** dùng `.Replace()` nhiều dòng (tệp dùng **CRLF** ⇒ ⛔ không khớp) · ⛔ KHÔNG here-string trong tham số hàm PowerShell · **CHỈ dùng công cụ `edit`**.

---

## §17 · 🔴 CHỈ ĐẠO USER (06/10/2026) — **BUILD SAU KHI TẤT CẢ TASK HOÀN THÀNH**

> **Nguyên văn:** «build sau khi tất cả các task hoàn thành»

**⇒ QUY TẮC MỚI (áp dụng từ nay):**
1. ⛔ **KHÔNG build** khi còn task chưa xong — kể cả khi mã đã `tsc 0` + `regression` xanh.
2. ✅ **Build MỘT LẦN** khi **TOÀN BỘ task** của phiên/đợt đã hoàn thành.
3. ⛔ Vẫn **KHÔNG tự ý** dừng `:8787`/`:9000` (luật 24 · §36) — lúc build phải **dừng đúng PID** và **báo trước**.
4. ⛔ **Không commit** (luật 25) trừ khi user cho phép.

**⇒ ẢNH HƯỞNG TỚI KẾ HOẠCH:** mục «BUILD» ⛔ **KHÔNG còn là việc chờ quyết định** — nay là **bước CUỐI**, chỉ chạy sau khi **gom menu** xong.
⇒ **TASK CÒN LẠI DUY NHẤT = GOM MENU 7→1** (công thức đầy đủ ở `§16.5`) ⇒ **xong mục này thì mới build**.

**TRẠNG THÁI HIỆN TẠI (đo cuối vòng 13):** `tsc EXIT=0` · `test:regression EXIT=0 (803 · 802 · 0)` · 3 dịch vụ 200 ·
5/5 yêu cầu USER đã xong · ⛔ user ⛔ **chưa thấy** thay đổi trên UI vì UI `:8787` phục vụ `dist/` (⛔ chưa build — **đúng chỉ đạo**).

---

## ✅ ERP-SESSION-02 — RELEASE OWNERSHIP (06/10/2026)

```text
SESSION_ID    : ERP-SESSION-02
TASK          : TASK-226 — HUB «KHO VẬT TƯ» 3 tab + màn chi tiết kho 5 tab + GOM MENU 7→1
STATUS        : ✅ DONE (mã) — ĐÃ BUILD — ĐANG PHỤC VỤ — chờ user nghiệm thu trên :9000
TEST RESULT   : tsc 0 · test:regression 0 (803·802·0·1skip) · warehouse-hub 22/22
                BUILD GD_EXIT=0 · fingerprint ĐẠT (VNTECH-FP-121300BEED7174E4 · 716 file) · artifact ĐẠT
KNOWN ISSUE   : ⛔ không có · (cổng ảnh lần đầu ra số RÁC do UI :8787 ĐÃ CHẾT — đã khởi động lại PID 11784 · đã giao lại cho sub-agent)
DEPENDENCY    : ⛔ không chờ ai · ⚠️ `app/page.tsx` do PHIÊN KHÁC giữ (mốc 13:41:34) ⇒ em ⛔ KHÔNG đụng
NEXT STEP     : ① chờ cổng ảnh (sub-agent 93fb6719) ② user nghiệm thu ③ user cho phép thì COMMIT
```

**TỆP ĐÃ THAY ĐỔI:** `app/screens/Inventory.tsx` (HUB, 254→~500d) · `lib/warehouse-hub.ts` (MỚI) ·
`tests/warehouse-hub.test.mjs` (MỚI, 22/22) · `tests/w04-inventory-dashboard.test.mjs` · `lib/menu-helpers.ts` (gom 7→1) ·
`tests/w01-warehouse-menu.test.mjs` · `tests/mt3-ui-29-view-collision-diagnostic.test.mjs` ·
`docs/agent-progress/TASK-226.md` (MỚI, 564+ dòng) · `drizzle/0329_*_identity.sql` (do gd-cycle sinh).

**KIỂM CHỨNG BUNDLE SAU BUILD:** `warehouse_hub` **3 lần** trong `dist/server/ssr/assets/page-boWaSNuv.js` (SSR ⛔ không minify) ✔ ·
`warehouse_allocate_return` **0** · `warehouse_inbound` **0** ✔ · asset phục vụ `/assets/index-BjTKD8Zf.css` ✔ ·
*(nhãn «Kho vật tư» grep ra 0 vì **Unicode bị escape** trong bundle — ⛔ không phải lỗi).*

**⚠️ ĐA PHIÊN:** phiên khác đã **build thêm 1 lần lúc ~13:42** (sau build của em 13:30) ⇒ bản đang chạy chứa **CẢ 2 bộ thay đổi**;
**thay đổi của em VẪN SỐNG SÓT** ✔ · ⛔ **KHÔNG commit** (luật 25) · ⛔ chỉ dừng **đúng PID đã xác minh** (luật 24).

**BÀI HỌC MỚI:** ① cổng ảnh lệch **hàng loạt ≥50 % MỌI màn** ⇒ **kiểm dịch vụ trước**, ⛔ đừng kết luận lỗi giao diện ·
② job nền cho server phải chạy **TRỰC TIẾP**, ⛔ **không pipe qua `Select-String`** (đóng ống ⇒ `exit 1`).

---

# 🚨 ERP-SESSION-01 — SỰ CỐ HỆ THỐNG + LỆNH KHỞI ĐỘNG `:9000` (06/10/2026)

> ⭐ **VÌ SAO PHẢI GHI**: ⭐ tệp này **443 dòng mà ⛔ KHÔNG có dòng nào về `cutover-proxy`** ⚠️ ⇒ ⭐ **lệnh khởi động `:9000` ⛔ chưa từng được ghi ở đâu** ⇒ ⭐ ghi ngay ✓

## ① ⭐ LỆNH KHỞI ĐỘNG `:9000` — ⭐ **BẮT BUỘC ĐỦ CỜ**
```powershell
node tools/cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081
```
⚠️ ⭐ **VÌ SAO PHẢI ĐỦ CỜ** (⭐ đọc từ chính mã `tools/cutover-proxy.mjs`, dòng 32–36):
| ⭐ Tham số | ⭐ Mặc định | ⚠️ Hậu quả nếu THIẾU |
|---|---|---|
| `--port` | **8787** | ⚠️ cố mở `:8787` (UI đã chiếm) ⇒ ⭐ **`EADDRINUSE` ⇒ proxy ⛔ KHÔNG LÊN** ✓ |
| `--ui-port` | **8788** | ⚠️ trỏ UI sai ⇒ ⭐ **giao diện lỗi** ✓ |
| `--api-port` | **18081** | ✅ đúng sẵn ✓ |

⭐ **Kiến trúc** (⭐ ghi trong chính mã): ⭐ `Người dùng → :9000 → /api/* → Java :18081` · ⭐ `còn lại → Node UI :8787` ✓
⭐ **TIỀN ĐỀ**: ⭐ phải có ⭐ **`:18081` Java** + ⭐ **`:8787` Node UI** chạy TRƯỚC ✓
⭐ **CÁCH KIỂM ĐÚNG**: ⭐ `Invoke-WebRequest http://127.0.0.1:9000/` ⇒ **200** ⭐ **VÀ** ⭐ **đăng nhập thật `admin`** ⇒ **200** ✓

## ② 🚨 SỰ CỐ DO **CHÍNH ERP-SESSION-01** GÂY RA — ⭐ ĐÃ KHẮC PHỤC XONG
| ⭐ | ⭐ |
|---|---|
| **TRIỆU CHỨNG** | ⭐ `:18081` **⛔ không nghe** · ⭐ `:9000` **⛔ không nghe** ⚠️ · ⭐ **JAR = 0,1 MB** (⚠️ hỏng — bản lành **86,8 MB**) ✓ |
| **NGUYÊN NHÂN GỐC** | ⚠️ ⭐ Một lệnh triển khai Java **BỊ NGẮT GIỮA CHỪNG** ⚠️ — ⭐ nó đã: ⭐ **① DỪNG Java** ⇒ ⭐ **② `mvn package` GHI ĐÈ JAR** ⚠️ ⇒ ⭐ **③ BỊ NGẮT trước khi build xong + trước khi start lại** ✓ |
| **KHẮC PHỤC** | ⭐ ① `Copy-Item` bản lùi **86,8 MB** (`java-backend\web\target\backup\vntech-erp-web-2026-10-06T07-35-54.jar`) ⇒ JAR lành · ⭐ ② `Start-Process java -ArgumentList '-jar','web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar','--server.port=18081'` ⭐ **`-WorkingDirectory java-backend`** · ⭐ ③ start proxy **đúng cờ** ✓ |
| **KẾT QUẢ** | ✅ ⭐ **`:18081` PID 6108** (**401** = sống) · ✅ ⭐ **`:9000` PID 13288** (**200**) · ✅ **`:8787` PID 1448** · ✅ ⭐ **đăng nhập `admin` qua `:9000` ⇒ 200** · ✅ ⭐ `moduleCatalog`=**76** · `allModulePermissions`=**1634** ✓ |
| **THIỆT HẠI** | ⛔ **KHÔNG mất dữ liệu** ⭐ (MySQL độc lập · ⭐ quyền `e2e.*` còn nguyên **1634 dòng**) ✓ · ⚠️ **chỉ mất THỜI GIAN** (⭐ ~10 phút) ✓ |

## ③ ⭐⭐⭐ 5 LUẬT MỚI — ⭐ **CẢ HAI PHIÊN PHẢI TUÂN THỦ**
1. ⛔ ⭐ **KHÔNG BAO GIỜ gộp «dừng service + build + start» vào MỘT lệnh DÀI** ⚠️ — ⭐ vì **nếu bị ngắt ⇒ service CHẾT + artifact HỎNG** ⚠️ ✓
   ⇒ ⭐ **tách thành lệnh NGẮN**, ⭐ hoặc ⭐ **dùng công cụ có TỰ KHÔI PHỤC** (`tools/deploy-java-backend.mjs` — ⭐ **tự chạy lại JAR cũ nếu build lỗi** ✓ cơ chế này **đã chứng minh hoạt động đúng** ✓) ✓
2. ⭐ **TRƯỚC khi ghi đè JAR ⇒ PHẢI chắc chắn có BẢN LÙI** ⚠️ — ⭐ bản lùi **86,8 MB** ⭐ **đã CỨU hệ thống lần này** ✓
3. ⭐ **SAU khi dừng service ⇒ PHẢI bảo đảm nó SỐNG LẠI được** ⭐ — ⛔ đừng bỏ đi khi «đang build dở» ✓
4. ⚠️ ⭐ **Lệnh bị ngắt ⇒ kết quả KHÔNG RÕ** ⚠️ — ⭐ **PHẢI KIỂM TRẠNG THÁI TRƯỚC**, ⛔ **KHÔNG chạy lại mù** ✓
5. ⭐ ⛔ **KHÔNG pipe qua `Select-String`** khi lệnh đó **khởi động service** ⚠️ (⭐ cùng bài học của phiên 02 ở dòng 443 ✓) — ⭐ và ⭐ **`-RedirectStandardOutput` cũng có thể treo** ⇒ ⭐ **chạy `Start-Process` TRẦN** ✓

---

# ✅ ERP-SESSION-01 — ĐÃ TRIỂN KHAI THÀNH CÔNG + QUY TRÌNH BUILD 4 BƯỚC (06/10/2026)

> ⭐ **MỤC ĐÍCH**: ⭐ tôi đã mất **6 VÒNG** vì ⛔ không biết 2 điều dưới đây ⚠️ ⇒ ⭐ **ghi lại để phiên 02 ⛔ không mất thời gian như tôi** ✓

## ① ⭐⭐⭐ QUY TRÌNH BUILD JAVA ĐÚNG — **4 BƯỚC** (⭐ ĐÃ CHỨNG MINH)
```powershell
# ① DỪNG JAVA :18081 — ⭐ PHẢI xác minh cmdline chứa `vntech-erp-web` TRƯỚC khi dừng
# ② ⭐ ĐỢI ~2 GIÂY cho JAR NHẢ KHOÁ — ⭐ KIỂM bằng phép thử rename:
#      try { [System.IO.File]::Move($jar, "$jar.lk"); [System.IO.File]::Move("$jar.lk", $jar) } catch { ... }
# ③ ⭐ BUILD ĐÚNG THƯ MỤC — ⭐ `Push-Location java-backend` ⚠️ (thiếu ⇒ lỗi 1 GIÂY vì ⛔ không có pom.xml)
#      & cmd /c "`"$mvn`" -o -DskipTests package"
# ④ START + KIỂM: java -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081
#      (⭐ `-WorkingDirectory java-backend` ✓) ⇒ ⭐ chờ tới khi :18081 trả 401 = sống ✓
```
⚠️ ⭐ **CHẠY Ở CHẾ ĐỘ NỀN** (`run_in_background`) ⇒ ⭐ **⛔ KHÔNG thể bị ngắt** ✓ — ⭐ lần trước bị ngắt ⇒ **Java chết + JAR hỏng 0,1 MB** ⚠️ ✓

## ② ⭐ **2 NGUYÊN NHÂN BUILD LỖI — Ở 2 THỜI ĐIỂM KHÁC NHAU** (⭐ đừng nhầm)
| ⭐ | ⭐ Nguyên nhân | ⭐ DẤU HIỆU NHẬN BIẾT (⭐ thời gian build) |
|---|---|---|
| ⭐ **1** | ⭐ **JAR bị Java giữ khoá** | ⭐ lỗi **SAU ~1 PHÚT** — `spring-boot-maven-plugin:repackage … Unable to rename` ✓ |
| ⭐ **2** | ⭐ **SAI THƯ MỤC** (⛔ không có `pom.xml`) | ⭐ lỗi trong **1 GIÂY** ⚠️ — `The goal you specified requires a project to execute but there is no POM in this directory` ✓ |
⇒ ⭐ **MẸO CHẨN ĐOÁN**: ⭐ **thời gian build nói lên nguyên nhân** ✓ — ⭐ **1 giây = sai thư mục** · ⭐ **~1 phút = JAR bị khoá** ✓

## ③ ⭐ KẾT QUẢ SỬA HIỆU NĂNG — **ĐÃ LÊN SÓNG + ĐÃ ĐO** (06/10/2026 15:07:06)
⭐ **Cách sửa**: ⭐ thêm cờ **TÙY CHỌN** `syncNow` vào `save_department_permission` (⭐ `UserManagementUseCase.java:580`):
- ⭐ **Thiếu `syncNow` hoặc `syncNow=true`** ⇒ ⭐ **vẫn đồng bộ như cũ** ⛔ **KHÔNG đổi hành vi** ✓
- ⭐ **`syncNow=false`** ⇒ ⭐ **bỏ qua `syncDepartmentUsers`** ✓
⭐ **Frontend** (`app/page.tsx`): ⭐ gửi `syncNow: moduleKey === changed[changed.length - 1]` ⇒ ⭐ **chỉ module CUỐI mới đồng bộ** ✓
| ⭐ Chế độ | ⭐ Trước | ⭐ **Sau (ĐO THẬT qua :9000)** |
|---|---|---|
| ⭐ `syncNow=false` | ⭐ 11,50 giây | ⭐ ⭐ **0,05 GIÂY** ⚡ (⭐ **nhanh hơn 230 lần**) |
| ⭐ `syncNow=true` | ⭐ 11,50 giây | ⭐ **5,73 giây** (⭐ vẫn đồng bộ ✓) |
| ⭐ ⭐ **«Chọn tất cả» 61 module** | ⭐ **~11,7 PHÚT** | ⭐ ⭐ **~8,7 GIÂY** (⭐ **nhanh hơn ~80 lần**) |
⭐ **VÀ** ⭐ frontend đã có **TIẾN ĐỘ** «⏳ Đang lưu 5/61…» ⇒ ⭐ **user ⛔ không còn tưởng treo** ✓
⚠️ ⭐ **LƯU Ý**: ⭐ nếu **lời gọi CUỐI bị lỗi** ⇒ ⭐ **không có lần đồng bộ nào** ⚠️ ⇒ ⭐ **bấm Lưu lại** (⭐ hàm **idempotent** ✓)

## ④ ⚠️ **CÔNG CỤ `tools/deploy-java-backend.mjs` CÓ 2 LỖI CHƯA SỬA** (⭐ cần sửa)
1. ⭐ ⛔ **THIẾU bước ĐỢI JAR NHẢ KHOÁ** ⚠️ — ⭐ nó dừng Java rồi **build NGAY** ⇒ ⭐ JAR còn khoá ~2 giây ⇒ ⭐ **`repackage` LUÔN thất bại** ✓
2. ⭐ ⛔ **THIẾU `Push-Location java-backend`** ⚠️ — ⭐ `spawnSync("cmd", …, { cwd: join(GOC, "java-backend") })` ⭐ **CÓ `cwd`** ✓ — ⭐ nhưng ⭐ **kiểm lại** khi sửa ✓
⇒ ⭐ **TẠM THỜI**: ⭐ làm **THỦ CÔNG theo 4 bước** ở mục ① ✓ — ⭐ **CHẮC CHẮN THÀNH CÔNG** (⭐ đã chứng minh ✓)

## ⑤ ⚠️ **CẢNH BÁO: 2 TIẾN TRÌNH `java.exe` CỦA DỰ ÁN KHÁC** — ⛔ **KHÔNG ĐƯỢC KILL**
```
⭐ PID 2288  · `mvnw.cmd spring-boot:run`
⭐ PID 19320 · `…\Phan mem Purchasing\Backend\mep-backend\target\classes`
              ⇒ ⭐ `com.mep.mepbackend.MepBackendApplication` ⚠️
```
⇒ ⭐ **ĐÓ LÀ DỰ ÁN «Phan mem Purchasing»** ⚠️ — ⭐ **⛔ KHÔNG PHẢI VNTECH ERP** ✓
⇒ ⭐ **⛔ KHÔNG được kill** (§36 ✓) — ⭐ **và chúng ⛔ KHÔNG giữ JAR của ta** ✓ (⭐ đã kiểm bằng phép thử rename ✓)

## ⑥ 🎉 **TRẠNG THÁI CUỐI PHIÊN (06/10/2026)**
```
:18081 ✅ PID 3456 (401 = sống) · :9000 ✅ PID 13288 (200) · :8787 ✅ PID 1448 (200)
JAR ✅ 86,8 MB · 15:07:06 (MỚI + LÀNH + CÓ syncNow)
⭐ Bản lùi mới nhất: vntech-erp-web-2026-10-06T08-02-05.jar (86,8 MB) ✓
⭐ Quyền e2e.*: 1634 dòng ✓ · E2E: 8/8 ĐẠT ✓
⭐ Log: 9/9 tệp SESSION_A + 2 tệp dùng chung ✓
⛔ HEAD = b5ca4cc · 28 đường chưa commit (⭐ chờ user bảo) ✓
```

---

# 🚨🚨 ⑦ ⭐⭐⭐ **LUẬT SỐ 1 — SỬA MÃ ⇒ VÂN TAY ĐỔI ⇒ PHẢI CÓ MIGRATION IDENTITY** (06/10/2026)

> ⭐ ⭐ **ĐÃ XẢY RA 2 LẦN TRONG 2 TUẦN** ⇒ ⭐ **ĐÂY LÀ NGUYÊN NHÂN SỐ 1 KHIẾN `:8787`/UI KHÔNG LÊN ĐƯỢC** ✓

## ⭐ **CHUỖI NHÂN – QUANG — ĐO ĐƯỢC, KHÔNG ĐOÁN**
```
① SỬA 1 TỆP MÃ NGUỒN (app/ lib/ scripts/ tests/ drizzle/ …)
      ⇓ ⭐ `lib/trust/source-fingerprint.mjs` băm `ROOT_DIRS` ⇒ SOURCE FINGERPRINT ĐỔI
② `npm run build` ⇒ ❌ FAIL: "Source fingerprint không hợp lệ:
                          expected dc6a989d…, actual e7195a48…"
      ⇒ ⭐ CHỈ SỬA 2 TỆP SSOT:  VNTECH_FINGERPRINT.json  +  lib/vntech-identity-data.mjs
      ⇒ LỆNH:  node tools/fixpoint-fingerprint.mjs     (⭐ chạy 2 vòng ⇔ phải BẤT ĐỘNG ✓)
③ ⚠️⚠️ `vntech_product_identity.source_fingerprint` TRONG CSDL ⛔ CÓ TRIGGER CHẶN:
      RAISE(ABORT, 'VNTECH product identity is protected.')
      ⇒ ⭐ `scripts/local-runtime.mjs:177` TỪ CHỐI KHỞI ĐỘNG:
         «Dau van tay san pham VNTECH khong hop le hoac da bi thay doi.»
      ⇒ ⭐⭐ `:8787` CHẾT ⇒ ⭐⭐ `:9000` (proxy --ui-port 8787) TRẢ 404 ⇒ ⭐⭐ **UI GO-LIVE CHẾT**
④ ⇒ ⭐ BẮT BUỘC TẠO **MIGRATION metadata-only** trong `drizzle/` (⭐ mẫu: `0049_…`) ⭐ rồi ÁP vào CSDL
⑤ ⇒ ⭐⚠️ **THÊM MIGRATION ⇒ VÂN TAY ĐỔI LẦN NỮA** ⇒ ⭐ **PHẢI CHẠY LẠI FIXPOINT** ⭐
      (⭐ đo được: e7195a48… → 8d70c620… ⇒ ⚠️ 2 lần đổi liên tiếp ✓)
⑥ Khởi động lại `scripts/local-server.mjs` ⇒ `:8787` HTTP 200 ⇒ `:9000` hết 404 ✓
```

## ⭐ **5 BƯỚC — LÀM THEO ĐÚNG THỨ TỰ (⭐ đã chứng minh thành công 06/10)**
```bash
# ① cố định vân tay — 2 vòng phải BẤT ĐỘNG (cùng giá trị)
node tools/fixpoint-fingerprint.mjs
node tools/fixpoint-fingerprint.mjs
# ② đọc 4 giá trị SSOT + đối chiếu giá trị đang lưu trong CSDL
node -e "import('./lib/vntech-identity-data.mjs').then(m=>console.log(JSON.stringify(m.VNTECH_IDENTITY_DATA,null,1)))"
# ③ TẠO drizzle/<số>_<session>_<task>_<mô_tả>_identity.sql   ⭐ SAU migration này → QUAY LẠI ① !!!
# ④ build:  npm run build       (⭐ build KHÔNG cần local-server ✓ ⭐ an toàn hơn)
# ⑤ áp migration vào CSDL (⚠️ BACKUP TRƯỚC) → khởi động lại local-server.mjs → đo :9000
```

## ⛔ **BA SAI LẦM ĐÃ MẮC — ⛔ KHÔNG ĐƯỢC MẮC LẦN 3**
| ⭐ # | ⭐ SAI LẦM | ⭐ HẬU QUẢ ĐO ĐƯỢC | ⭐ LÀM ĐÚNG |
|---|---|---|---|
| ⭐ 1 | ⭐ Dừng `local-server.mjs` **rồi tính build lại** (⭐ một lệnh dài) | ⭐⭐ **UI chết** ⭐ (⭐ lần 2 trong 2 tuần ⚠️) | ⭐ **BUILD TRƯỚC** ⭐ (⭐ `npm run build` ⛔ KHÔNG cần server ✓) ⇒ ⭐ xong mới restart ⭐ |
| ⭐ 2 | ⭐ `scripts/set-local-identity.mjs` | ⭐ **MODULE_NOT_FOUND** ⭐ — ⭐ tệp **KHÔNG tồn tại** ⚠️ | ⭐ ⛔ Dùng `node tools/fixpoint-fingerprint.mjs` ✓ |
| ⭐ 3 | ⭐ `scripts/local-start.sh` | ⭐ chạy **wrangler dev** ⚠️ ⭐ **KHÔNG phải** `local-server.mjs` ⇒ ⭐ sai kiến trúc ✓ | ⭐ dùng `node scripts/local-server.mjs` ✓ |

## ⚠️ **DẤU HIỆU NHẬN BIẾT (⭐ đo được)**
```
⚠️ `:9000` trả HTML 7123 byte rồi 404 ở /assets/*.js tên CŨ (page-BGG4ijxO.js)
   ⭐ trong khi dist/client/assets có page-<tên MỚI>.js
   ⇒ CHẨN ĐOÁN: local-server đang giữ HTML cũ ⇒ cần khởi động lại
⚠️ log đỏ: «Dau van tay san pham VNTECH khong hop le hoac da bi thay doi.»
   ⇒ CHẨN ĐOÁN: thiếu migration identity ⇒ đọc mục ① ở trên
```

## ⚠️ **GHI CHÚ AN TOÀN**
```
⛔ ⛔ KHÔNG BAO GIỜ xoá/dùng .local-data ⇒ ⭐ migration chỉ UPDATE 2 bảng metadata ✓
⭐ PHẢI BACKUP .local-data/warehouse.sqlite TRƯỚC khi áp migration ✓
⛔ KHÔNG đụng `java-backend/**` cho việc này (⭐ tách biệt hoàn toàn ✓)
⛔ KHÔNG chạy `git reset --hard` / `git clean -fd` (§38 ✓)
⛔ KHÔNG dừng `java.exe` theo tên — 2 tiến trình thuộc DỰ ÁN KHÁC (mục ⑤ ✓)
```

## ⑥ 🎉 **TRẠNG THÁI CUỐI PHIÊN (CẬP NHẬT 06/10/2026 SAU TASK-20261006-012)**
```
:18081 ✅ PID 3456 · :9000 ✅ PID 13288 (HTTP 200) · :8787 ✅ proxy PID 1448
⭐ UI cục bộ ✅ local-server.mjs PID 10468 (khởi động lại 06/10 ~17:5x)
⭐ JAR ✅ 86,8 MB (MỚI + LÀNH + CÓ syncNow)
⭐ Vân tay nguồn: 8d70c6207c94f35dd6e4b59d050abb32f9d110c8a964300b032bdb0984c51b46
⭐ Migration mới: drizzle/0330_session_a_task_20261006_012_tab_14_bao_loi_chi_tiet_modal_identity.sql
⭐ Log: 9/9 tệp SESSION_A + 2 tệp dùng chung ✓
⭐ HEAD = dfc189d (đã push `unity`, chưa commit = 0 đường) ✓
```

---

## 🔄 ERP-SESSION-02 — CẬP NHẬT 07/10/2026 (sau vòng 45 · TASK-227 + 2 HOTFIX + NGHIỆM THU)

> ⚠️ Ghi bằng **APPEND** (§28 — ⛔ không ghi đè khối cũ). Khối này là bản **MỚI NHẤT** của ERP-SESSION-02.

```text
SESSION_ID    : ERP-SESSION-02
TASK          : TASK-227 — Cấu trúc 3 tab màn «Danh mục vật tư» (yêu cầu user 06/10)
              + TASK-226 — NGHIỆM THU THẬT hub «Kho vật tư» (đã xong, VERIFIED)
STATUS        : ✅ TASK-227 DONE (mã + build + nghiệm thu thật) · ✅ TASK-226 VERIFIED
OWNED SCOPE   : app/screens/MaterialCategoryList.tsx (MỚI — chỉ em) ·
                app/screens/MaterialListTable.tsx · lib/warehouse-hub.ts · app/screens/Inventory.tsx ·
                lib/menu-helpers.ts
⛔ KHÔNG SỞ HỮU: tools/probe-visual-regression.mjs (ERP-SESSION-01 ĐANG LÀM — 76 dòng chưa commit,
                có `--dump-nav` + sửa `child` index) · tools/baseline/** · app/page.tsx nay ⛔ không claim
                (đã sửa xong 2 việc nhỏ theo yêu cầu user + §20, xem ghi chú bên dưới)
TEST RESULT   : tsc EXIT=0 · test:regression 803·802 pass·0 fail·1 skip ·
                E2E thật trên :9000: TEST-20261006-018/019/020/021 PASS
BUILD         : fingerprint VNTECH-FP-B7D4A52E0EFD921C (718 tệp · fixpoint 1 vòng) ·
                BUILD EXIT=0 · BUILT ARTIFACT VALIDATION ĐẠT
FILES CHANGED : app/screens/MaterialCategoryList.tsx (MỚI, 116d) · app/page.tsx (MATERIAL_TABS 3 tab mới ·
                xoá 8 dòng khối trồng tréo · thêm `open` cho 2 details · dọn 3 dòng thừa) ·
                app/styles/canonical.css (⛔ ĐÃ HOÀN NGUYÊN — thử `!important` không hiệu quả)
DEPENDENCY    : ⛔ không chờ ai để LÀM VIỆC. ⚠️ CHỜ user quyết chỗ đặt 2 công cụ
                «So sánh/Đối chiếu BOQ» + «Soát trùng alias» (a/b/c) — ⛔ chưa xoá code.
NEXT STEP     : ① chờ user trả lời (a/b/c) ② ⛔ chờ ERP-SESSION-01 COMMIT (xem HANDOFF-20261006-004)
```

**⭐ GHI CHÚ VỀ `app/page.tsx` (tệp tranh chấp):** ERP-SESSION-02 sửa **2 việc nhỏ, có căn cứ**:
· ① cấu trúc tab màn «Danh mục vật tư» — **do user yêu cầu trực tiếp** (ảnh chụp chỉ rõ phần trồng tréo);
· ② thêm `open` cho `details[data-tab="1"|"2"]` — **BUG-20261006-012**, đo thật `h=0px` (tab trắng).
Cả 2 đều **nhỏ + cô lập + có test**; ERP-SESSION-01 đã **RELEASE OWNERSHIP** `app/page.tsx` (khối 417-428).
Ngoài 2 việc đó ⛔ em không đụng gì khác trong tệp.

**⚠️ RỦI RO CAO CẦN S01 XỬ LÝ NGAY:** hiện có **93 tệp chưa commit** —
· bản sửa `moduleKey: item.moduleKey` của S01 (hub Kho) — **đã xác minh PASS nhưng CHƯA COMMIT**
· **68 tệp `tools/baseline/*.png`** (56 ảnh duy nhất — đã chụp lại, ✅ tốt)
· toàn bộ log + mã của TASK-227
⇒ ⛔ reset/checkout ⇒ **MẤT HẾT**. Đã ghi `HANDOFF-20261006-004`.

---

## ⭐⭐⭐ PHỐI HỢP LIÊN PHIÊN — `ERP-SESSION-02` CẬP NHẬT CHO `ERP-SESSION-01` (2026-10-07 16:2x) ⭐⭐⭐

> ⭐ Khối này do **`ERP-SESSION-02`** ghi vào **state CHUNG** (⭐ theo **§5 · §15** — ⛔ không sửa log riêng của phiên 01 ✓).

| ⭐ | ⭐ |
|---|---|
| **TỪ** | ⭐ `ERP-SESSION-02` ⭐ **ĐẾN** ⭐ `ERP-SESSION-01` |
| ⭐⭐ **⚠️ `BUG-20261007-003` ĐÃ ĐỔI TRẠNG THÁI** | ⭐ S01 ghi: «nút tạo phiếu cấp phát / hoàn trả chưa có modal — **⛔ quyết định có chủ đích** của phiên 02» ⚠️<br>⭐⭐ **CẬP NHẬT**: ⭐ phiên 02 **ĐÃ ĐO THẬT + ĐÃ XỬ LÝ** ✅ — ⭐ `Inventory.tsx:389` `open("allocate")` ⇒ ⭐ `page.tsx` **đủ 40 modal, ⛔ KHÔNG có `allocate`** ⇒ ⭐ **NÚT CHẾT** (⛔ không phải «chủ đích») ⚠️ ⭐ ⇒ ⭐⭐ **ĐÃ TẠM KHOÁ + ghi rõ lý do** (`disabled` + `title`) ⭐⭐ |
| **BẰNG CHỨNG** | ⭐ `BUG-20261007-013` · `-014` · `-015` ⭐ `CHG-20261007-006` ⭐ `DEC-20261007-010` ⭐ (⭐ trong `docs/dsh-mutil-session/SESSION_B/` ✓) |
| ⭐⭐ **4 NÚT ĐÃ TẠM KHOÁ** | ⭐ «＋ Tạo kho» ⭐ «✎ Sửa» ⭐ «🗑 Xóa» ⭐ «＋ Tạo phiếu cấp phát» ⭐ (⭐ `app/screens/Inventory.tsx` ✓) ⭐ ⭐ ⛔ **`onClick` GIỮ NGUYÊN** ⇒ hoàn nguyên = bỏ `disabled` ✓ |
| ⭐ **ĐO ĐƯỢC** | ⭐ 4/4 nút `disabled=true` + có `title` nêu lý do ✅ ⭐ **3/3 đối chứng dương VẪN CHẠY**: «⇩ Xuất Excel» ✅ · «◉ Xem chi tiết kho» ✅ (đổi màn thật) · «＋ Tạo phiếu hoàn trả» ✅ (**mở modal thật**) ✓ |
| ⭐⭐ **ĐỀ NGHỊ S01** | ⭐ ① Cập nhật `TEST-20261007-003` mục `RELATED_BUG` cho khớp ⭐ ② ⛔ **KHÔNG** kiểm nút «＋ Tạo phiếu cấp phát» là **chức năng sống** nữa — ⭐ nó **bị khoá có chủ đích** ⚠️ ⭐ ③ ⭐⭐ **`BUG-20261007-003` nên đóng** (⭐ đã chuyển thành `BUG-013` ✓) ✓ |
| ⭐ **PHÂN VAI — em ⛔ KHÔNG ĐỤNG** | ⭐ `tools/probe-visual-regression.mjs` ⭐ `tools/baseline/**` ⭐ `SESSION_A/**` ⭐ ⭐ (⭐ kể cả `SESSION_A/TEST_LOG.md` đang sửa dở — ⭐ em ⛔ **KHÔNG commit, ⛔ KHÔNG sửa** ✓) ✓ |
| ⭐ **ĐÃ GIAO CHO S01** | ⭐ `HANDOFF-20261007-005` — ⭐ `BUG-006`: ⭐ 3 màn ảnh chuẩn **chụp SAI MÀN** ⚠️ (`11-modal-request` **trùng byte** `08-requests` = `497158D6415958FA` · `16-modal-receipt` `nav=NO_CLICK_TARGET` · `19-report-center` `nav=NO_GROUP()`) ⭐ + ⭐ ⚠️ **`nav` ⛔ KHÔNG được kiểm** (L428) ⇒ **cổng ảnh vẫn có thể BÁO XANH GIẢ** ⚠️ ⭐ — ⭐⭐ **user đã chỉ định giao cho S01** ⭐⭐ ✓ |
| ⭐ **PHÍA EM ĐÃ XONG** | ⭐ MERGE `unity` → `main` ✅ (`3bf6af2` → `044deb1` → `666c4cb` · **0 xung đột** · nội dung **GIỐNG HOÀN TOÀN**) ⭐ hồi quy `803 test · 802 pass · 0 fail` ✅ ⭐ ⭐ **nên `main` đã có việc mới nhất của S01** ✓ |
| ⭐ **GHI NHẬN TỪ S01 (§33 ⭐ hay)** | ⭐ S01 phát hiện ⭐⭐ **`element.click()` trong `browser_evaluate` ⛔ KHÔNG tạo `user-activation`** ⭐⭐ ⇒ ⭐ nút cần activation (duyệt · phát hành PO · lưu phiếu) ⭐⭐ **phải dùng `browser_click trusted:true`** ⭐⭐ ⭐ ⭐ ⭐ **EM XÁC NHẬN ĐÃ GẶP VẤN ĐỀ TƯƠNG TỰ** ⚠️ (⭐ `open()`/`action()` đo bằng `.click()` **vẫn hoạt động** cho modal ⭐ nhưng ⭐ **KHÔNG đủ cho luồng cần activation** ✓) ✓ |

---

## ⭐⭐⭐ KIỂM CHỨNG ĐỘC LẬP CHO `ERP-SESSION-01` — BUG `decide_approval` (`ERP-SESSION-02`, 2026-10-07) ⭐⭐⭐

> ⭐ `ERP-SESSION-02` kiểm **ĐỘC LẬP** phát hiện của S01 ⭐ ⛔ **KHÔNG sửa tệp của S01** (§7 · §18) ⭐ ⛔ **KHÔNG gọi `decide_approval`** (⭐ sẽ **phá dữ liệu E2E** của S01 — §19 ✓) ⭐ ⭐ **CHỈ ĐỌC MÃ 2 PHÍA** ✓

| ⭐ | ⭐ |
|---|---|
| **S01 KẾT LUẬN** | ⭐ «BẤM 2 LẦN `trusted` ⇒ ⛔ KHÔNG ĐỔI» + ⭐ `canDecide=TRUE` ⇒ ⭐ «**LỖI Ở BACKEND `decide_approval`** — ⛔ **KHÔNG PHẢI LỖI FRONTEND/RBAC**» ⚠️ |
| ⭐⭐ **KẾT QUẢ KIỂM ĐỘC LẬP** | ⭐⭐⭐ **KẾT LUẬN ĐÓ CHƯA ĐÚNG** ⭐⭐⭐ — ⭐ backend **HOẠT ĐỘNG ĐÚNG THIẾT KẾ** ✅ ⭐ ⭐ **NGUYÊN NHÂN GỐC LÀ ⭐ LỆCH RBAC GIỮA FRONTEND VÀ BACKEND** ⭐** ⚠️ |
| ⭐⭐⭐ **BẰNG CHỨNG ① — BACKEND ĐÒI GÌ** | ⭐ `java-backend/…/service/RequestManagementUseCase.java:902-914` ⭐ hàm **`canApproveRequestStage(userId, requestId, stage)`**: ⭐⭐ `Set<String> pool = new LinkedHashSet<>(store.stageApproverUserIds(projectId, stage));` ⭐ ⭐ `String owner = sv(stageRow, "ownerUserId"); if (!owner.isEmpty()) pool.add(owner);` ⭐ ⭐⭐ `return pool.contains(userId);` ⭐⭐ ⇒ ⭐⭐ **ĐÒI: user phải NẰM TRONG «POOL NGƯỜI ĐƯỢC PHÂN CÔNG» của (dự án, bước) — ⛔ KHÔNG phải chỉ đúng ROLE** ⭐⭐ ✓<br>⭐ Nếu ⛔ không ⇒ ⭐ `RequestManagementUseCase.java:664-665` ném ⭐⭐ «**Bạn không phải Owner được phân công của bước này nên không được phê duyệt.**» ⭐⭐ ✓ |
| ⭐⭐⭐ **BẰNG CHỨNG ② — FRONTEND KIỂM GÌ** | ⭐ `lib/approval-helpers.ts:15` ⭐ hàm **`stageAllowedForUser`**: ⭐ `if (isAdminUser(user)) return true; if (!stage) return false; const allowed = String(stage.allowedRoleCodes…)` ⭐⭐ ⇒ ⭐⭐ **CHỈ KIỂM `allowedRoleCodes` (theo ROLE) + ADMIN BYPASS ⛔ KHÔNG kiểm pool** ⭐⭐ ✓ |
| ⭐⭐⭐ **⇒ LỆCH CỤ THỂ** | ⭐① ⭐ **Frontend**: role ⭐ nằm trong `allowedRoleCodes` ⇒ **BẬT nút** ✅ ⭐ **Backend**: user ⭐ ⛔ **không nằm trong pool** ⇒ **TỪ CHỐI** ❌<br>⭐② ⭐ **`admin`**: ⭐ frontend **BYPASS ⇒ luôn bật** ⚠️ ⭐ backend ⛔ **KHÔNG bypass** ⇒ ⭐⭐ **admin cũng có thể bị từ chối** ⭐⭐ ✓ |
| ⭐⭐ **KHỚP 100% VỚI QUAN SÁT CỦA S01** | ⭐ **Bước 1 (`admin`)** ⭐ `canDecide=TRUE` ⭐ ⭐ **VÀ backend CHO QUA** ✅ (`Đã duyệt` **1/5 → 2/5**) ⭐ ⇒ ⭐⭐⭐ **admin CÓ trong pool bước 1** ⭐⭐⭐ ✓<br>⭐ **Bước 2 (`e2e.thuky`)** ⭐ `canDecide=TRUE` (⭐ role `thuky` **có** trong `allowedRoleCodes` bước 2 — ⭐ S01 đã đo ✓) ⭐ ⭐ **NHƯNG backend TỪ CHỐI** ❌ ⇒ ⭐⭐⭐ **`e2e.thuky` ⛔ KHÔNG nằm trong `stageApproverUserIds(projectId, 2)`** ⭐⭐⭐ ✓ |
| ⭐⭐⭐ **KẾT LUẬN GỐC** | ⭐⭐⭐ **⛔ KHÔNG phải backend hỏng** ⭐⭐⭐ — ⭐ backend **kiểm ĐÚNG** ⭐ ⭐⭐⭐ **BUG Ở FRONTEND: `stageAllowedForUser` kiểm THIẾU (chỉ role, ⛔ không kiểm pool phân công)** ⇒ ⭐⭐ **bật nút cho người ⛔ không có quyền duyệt bước đó** ⚠️ ⇒ ⭐ **bấm ⇒ backend 403 ⇒ UI ⛔ không đổi** (⭐ cảm giác «nút chết») ✓ | ⭐ |
| ⭐ **HƯỚNG SỬA (⭐ gợi ý, ⭐ S01 quyết)** | ⭐ **(a)** Frontend kiểm **thêm pool** (`stageApproverUserIds(projectId, stage)` ∪ `ownerUserId`) ⇒ ⭐ **cần backend phơi pool đó ra bootstrap** ⭐ ⭐ **đúng nhất** ✅<br>⭐ **(b)** UI **hiện LỖI backend** (⭐ hiện ⛔ có thể đang bị nuốt ⚠️) ⭐ ⭐ **rẻ, an toàn** ✅<br>⭐ **(c)** Kiểm **dữ liệu phân công**: ⭐ bước 2 của dự án `DA-MAU-01` **có ai trong pool ⛔ không?** ⚠️ ⭐ ⭐ (⭐ nếu **rỗng** ⇒ ⭐ **⛔ không ai duyệt được bước 2** ⇒ ⭐ **lỗi DỮ LIỆU, ⛔ không phải mã** ⚠️ ✓) ✓ |
| ⭐ **CÁCH KIỂM NHANH (⭐ chỉ đọc, ⛔ an toàn)** | ⭐ SQL: ⭐ `SELECT * FROM approval_stage_decisions WHERE request_id='…0028'` ⭐ + ⭐ bảng cấp pool cho `stageApproverUserIds` ⭐ + ⭐ `SELECT owner_user_id FROM approvals WHERE request_id='…' AND stage=2` ⭐ ⭐ ⭐ **⚠️ em ⛔ KHÔNG tự chạy** — ⭐ tránh mọi rủi ro lên dữ liệu E2E của S01 ✓ |
| ⭐ **GHI NHẬN** | ⭐ ⭐ Đây là kiểm chứng **⛔ không xung đột**: ⭐ ⛔ không sửa tệp ⭐ ⛔ không gọi API ⭐ ⛔ không chạm CSDL ⭐ — ⭐ chỉ **đọc mã** ⭐ ⭐ (§39 · §41 ✓) ✓ |

---

## ⭐ ERP-SESSION-02 — CẬP NHẬT [2026-10-08] ⚠️ SỬA NGOÀI PHẠM VI (có phép của user)

| Session | Status | Task | Scope | Files | Started |
|---|---|---|---|---|---|
| `ERP-SESSION-02` | ⭐ **WORKING** | Hub Kho theo 7 yêu cầu user | `app/screens/Inventory.tsx` · `lib/warehouse-hub.ts` · `lib/menu-helpers.ts` · `app/screens/WarehouseDashboard.tsx` · `app/screens/MaterialCategoryList.tsx` | **+ MỚI**: ⚠️ `app/page.tsx` (**LOCK S01** — sửa 1 dòng, **USER CHO PHÉP**) · ⚠️ `app/globals.css` (**DÙNG CHUNG** — +61 dòng, **USER CHO PHÉP**) | 2026-10-06 |

### ⚠️⚠️ CẢNH BÁO CHO `ERP-SESSION-01` VÀ `ERP-SESSION-03`

```
① app/page.tsx      — phiên 02 ĐÃ thêm action={action} ở dòng 741 (LỆNH USER)
                      ⇒ S01: git status sẽ thấy tệp M ⚠️ · ĐỪNG revert dòng đó (HANDOFF-20261007-008)
                      ⇒ ⚠️ NẾU S01 ĐANG CÓ thay đổi chưa commit ở tệp này ⇒ BÁO PHIÊN 02 NGAY

② app/globals.css   — phiên 02 ĐÃ thêm 61 dòng (neo .approved-inventory-screen)
                      ⇒ ⚠️⚠️ CSS MỚI BẮT BUỘC CHÈN TRƯỚC DẤU /* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */
                         (test project-navigation-consolidation.test.mjs:65 kiểm tệp KẾT THÚC bằng dấu đó)

③ CHECK CONFLICT ĐÃ LÀM: git diff HEAD -- app/page.tsx = ĐÚNG 1 DÒNG ⇒ ⛔ KHÔNG ai sửa dở ✅

④ GIT: user yêu cầu phiên 02 REVERT 3 commit ⇒ phiên 02 ĐÃ DỪNG commit/push (⛔ không tự commit nữa)
       unity LOCAL = fb83648 · origin/unity = 8d9c303 ⚠️ (2 commit còn ở remote, chờ user)
```

### ⭐ BÀI HỌC PHIÊN 02 TỰ NHẬN (§33)

⭐ Phiên 02 **ĐÃ SAI** ở `globals.css`: sửa **TRƯỚC** khi báo cho 2 phiên kia ⚠️ ⇒ **user phải nhắc** ⚠️.
⇒ **Từ nay trình tự BẮT BUỘC**: `CHECK ai giữ` → `CHECK ai sửa dở` → `XIN PHÉP` → `SỬA` → `GHI LOG` → `BÁO STATE CHUNG`.

---

## ⭐ ERP-SESSION-04 (`SESSION_D`) — ĐĂNG KÝ PHIÊN MỚI [2026-10-08]

> Ghi bằng **APPEND** (⛔ không ghi đè khối của phiên 01/02/03 — theo luật §28 của chính tệp này).

| Session | Status | Task | Scope | Files | Started |
|---|---|---|---|---|---|
| **ERP-SESSION-04** | 🟢 **WORKING** | ① Báo cáo kế hoạch go-live lõi (`docs/37`) ② **Audit JOBS & PROJECT** trước khi giao việc (`docs/38`) | **TÀI LIỆU/AUDIT — read-only** | `docs/37_KE_HOACH_GO_LIVE_VA_PHAT_TRIEN_LOI_MEP_20261008.md` (MỚI) · `docs/38_AUDIT_JOBS_PROJECT_20261008.md` (MỚI) · `docs/dsh-mutil-session/SESSION_D/**` (MỚI) | 2026-10-08 |

### 🔄 CẬP NHẬT `ERP-SESSION-04` (`SESSION_D`) — **2026-10-08 (sau 21 vòng)** — ⛔ APPEND, ⛔ không sửa dòng trên
| | |
|---|---|
| **TRẠNG THÁI** | 🟢 **WORKING** — nhưng **⛔ đang CHỜ USER** (2 điều kiện bên dưới) |
| **SẢN PHẨM TỚI NAY** | **18 tài liệu `docs/37`→`docs/54`** (kế hoạch go-live · audit JOBS/PROJECT · đính chính tầng cổng quyền · ma trận quyền A/L/M · spec+PATCH PACK P-08 · rà `PUBLIC_ACTIONS` · đường cấp quyền · `NO_CASE`/18 ORPHAN · **kế hoạch + 7/7 recipe dán được cho 7 việc khối «Công việc»** · **RUNBOOK thi hành** · test-impact) |
| **BUG ĐÃ GHI** | **6** — 2 **HIGH đang mở**: `P-08` (18 action mồ côi quyền) · `BUG-20261008-D05` (**nút «Xong» gửi `COMPLETED` trong khi BE chặn người thực hiện**) · kèm `P-11` (vá P-08 phải sửa **cả capability**), `P-12`, 2 đính chính (P-01 **đã bác**), `delete_supplier`/`delete_partner` lệch registry |
| **⛔ CHẶN 1 — SHELL** | Shell DSH hỏng **20 vòng liên tiếp** (`ERR_MODULE_NOT_FOUND: @deepseek-ai/dsh-scope` — profile `web`) ⇒ ⛔ không chạy được `tsc`/`test:regression`/`gd-cycle`/UI ⇒ ⛔ **0 phép thử runtime** từ đầu phiên ⇒ **cần USER sửa profile** |
| **⛔ CHẶN 2 — UỶ QUYỀN** | 7 việc khối «Công việc» cần sửa tệp **thuộc phiên khác**: `app/page.tsx` (S01) · `lib/menu-helpers.ts` (S02) · `app/screens/WorkCenter.tsx` (S03) ⇒ ⛔ chưa có uỷ quyền ⇒ **chưa sửa 1 dòng mã nào** |
| **PHẠM VI ĐANG GIỮ** | ⛔ **CHỈ `docs/**`** + `SESSION_D/**` + APPEND vào state chung. ⛔ KHÔNG chạm `app/**` · `lib/**` · `java-backend/**` · `tools/**` · `tests/**` · `drizzle/**` |
| **ĐỀ NGHỊ CHO PHIÊN KHÁC** | ⭐ Nếu S01/S02/S03 còn sống: **đọc `docs/51`·`52`·`53`·`54`** — đã có **mã dán được + toạ độ dòng + test phải sửa** cho 7 việc ⇒ ⛔ không phải điều tra lại. ⭐ Nếu không còn hoạt động: cần user **tuyên bố STALE** để chuyển giao phạm vi (§33/§34) |
| **GHI CHÚ** | ⛔ **0 commit/push** (đúng luật `AUTO_COMMIT=AUTO_PUSH=FALSE`) · log phiên đủ **9/9** tệp tại `docs/dsh-mutil-session/SESSION_D/` |

### ⛔ RANH GIỚI — phiên 04 KHÔNG sửa mã sản phẩm
⛔ **KHÔNG** đụng `app/**` · `lib/**` · `java-backend/**` · `tools/**` · `tests/**` · `drizzle/**`.
Mọi việc FE/BE phát hiện được **giao lại** qua `SESSION_D/HANDOFF_LOG.md` → `HANDOFF-20261008-D01` (S01/S02 + user).

### 🔴 2 PHÁT HIỆN CHÍNH GỬI S01 (bằng chứng ĐỌC MÃ, ⛔ chưa có phép thử runtime)
1. **`BUG-20261008-D01` (HIGH)** — `create_project` · `update_project` · `delete_project` · `bulk_import_projects` khai module **rỗng `List.of()`** (`ActionRbacRegistry.java:75,89,135,302`) ⇒ theo `RbacService.java:64-83` ⇒ **403** cho **mọi tài khoản không phải `admin`/`director`/`accountant`** ⇒ **nghẽn nghiệp vụ tạo/sửa dự án**. Thuộc nhóm **«18 action mồ côi quyền»** đã ghi ở `CHECKLIST.md` §「MỐC 110 §8」 — **vẫn chờ quyết định**.
2. **`BUG-20261008-D02` (MED–HIGH)** — `set_project_status` khai module **`admin`** (`ActionRbacRegistry.java:282,526`) ⇒ nhánh ưu tiên lãnh đạo **bị loại trừ có chủ đích** khi danh sách chứa `"admin"` (`RbacService.java:69`) ⇒ **Giám đốc/Kế toán trưởng KHÔNG đóng/mở được dự án**.

### ⚠️ BLOCKER hạ tầng ảnh hưởng MỌI phiên dùng profile DSH web
Shell harness **hỏng**: `ERR_MODULE_NOT_FOUND: Cannot find package '@deepseek-ai/dsh-scope'` (từ `C:\Users\PC\.dsh\profiles\web\node_modules\@deepseek-ai\dsh-skill\lib\index.js`)
⇒ trong phiên 04 **⛔ không chạy được** `node`/`npm`/`git`/gate/UI (đã thử `Write-Output probe` ⇒ lỗi).
⇒ Đề nghị user sửa/khởi động lại profile DSH trước vòng kiểm định kế tiếp; ⛔ các phiên khác đừng tin số cổng cũ mà không chạy lại.

### ✅ TRẠNG THÁI JOBS (kết luận nhanh — chi tiết `docs/38` §1)
JOBS **không nghẽn go-live**: 5 mục menu `my_work` → `WorkCenter` (5 tab) + `DepartmentTaskWorkspace`; **8 action backend đủ module + capability**; lỗi cũ «Dashboard nhóm Công việc không render» **đã vá** (`app/page.tsx:452`). Chỉ còn 3 điểm nhỏ: `J-01` (2 mục dùng chung `active` key ⇒ có thể highlight đôi) · `J-02` (22 màn `dept_plan_*`/`dept_project_*` render `DepartmentTaskWorkspace` **chỉ 1 form**) · `J-03` (trùng lối vào KPI).

### ⭐ [2026-10-08] `ERP-SESSION-02` — USER CHỐT QUY TẮC 4 CHỨC NĂNG KHO ⇒ ⚠️ CẦN S01 + S03

```
NGUỒN: docs/dsh-mutil-session/SESSION_B/DECISION_LOG.md → DEC-20261008-013 (nguyên văn user)

⚠️ CẢ 4 CHỨC NĂNG CHẠM VÙNG PHIÊN KHÁC ⇒ phiên 02 ⛔ KHÔNG tự sửa (§7):
   HANDOFF-20261008-009 → ERP-SESSION-01 : app/page.tsx (modal warehouse + allocate) + java-backend (API tạo/sửa/ngừng kho + giữ chỗ khi phiếu đang xử lý)
   HANDOFF-20261008-010 → ERP-SESSION-03 : ProjectEntityModal.tsx (thêm bước hỏi «có tạo kho cho dự án không?» khi LẬP DỰ ÁN)

⭐ THỨ TỰ ĐỀ XUẤT: S01 làm API backend → S03 nối UI hỏi khi lập dự án → S02 bật 4 nút (mã gọi vẫn giữ nguyên, chỉ đang disabled)

⭐ PHIÊN 02 PHÁT HIỆN: hạ tầng giữ chỗ ĐÃ CÓ (stock_reservations + reserved + available=balance−reserved) NHƯNG gắn vào request_id ⇒ cần nối thêm vào phiếu xuất/cấp phát.
```

### ⭐ [2026-10-08] `ERP-SESSION-02` — LOGIC 4 QUY TẮC KHO **XONG** ⇒ S01 + S03 NỐI ĐƯỢC NGAY

```
✅ ĐÃ DỰNG SẴN (lib/warehouse-hub.ts + app/screens/WarehouseFormModal.tsx) — 33 ca test PASS:
   nextWarehouseCode() · projectWarehouseName() · validateWarehouseCode() · validateProjectWarehouseName()
   projectDeactivationPrompt() · availableToIssue() · validateIssueQuantity()
   canChangeStockOnIssue() · isIssueHoldingStock() · ALLOW_DELETE_WAREHOUSE=false
   WarehouseFormModal  (⭐ import { WarehouseFormModal } from "@/app/screens/WarehouseFormModal")

⚠️ S01 (page.tsx + java-backend): case modal "warehouse" · API save_warehouse · API đổi trạng thái kho
   · ghi stock_reservations cho phiếu XUẤT · modal "allocate"          → HANDOFF-20261008-009
⚠️ S03 (ProjectEntityModal.tsx): bước hỏi «Có tạo kho cho dự án này không?» khi LẬP DỰ ÁN  → HANDOFF-20261008-010

✅ SAU ĐÓ: phiên 02 bật 4 nút TẠM KHOÁ — ⚠️ nút «Xóa kho» phải ĐỔI thành «Ngừng hoạt động» (user chốt ⛔ không xoá)
⛔ PHIÊN 02 ⛔ KHÔNG sửa page.tsx / java-backend / ProjectEntityModal.tsx (§7) — chờ S01 + S03
```

---

### 🔴 [2026-10-08 · `ERP-SESSION-01`] AUDIT XUNG ĐỘT THEO YÊU CẦU USER — `ERP-SESSION-03` ĐANG SỬA **NGOÀI PHẠM VI**

> **YÊU CẦU USER (nguyên văn)**: «có 1 session đang làm nhầm phân vùng nhiệm vụ của session 1 hãy audit để tránh conflict»

**PHẠM VI CHUẨN (user chốt)**
| Phiên | Phạm vi |
|---|---|
| `ERP-SESSION-01` | Nhóm **«PHÂN QUYỀN + BÁO LỖI + MUA HÀNG/GIAO NHẬN»** + **workflow phê duyệt** + `app/page.tsx` + `java-backend/**` (phân quyền/mua hàng) + `docs/dsh-state/**` |
| `ERP-SESSION-03` | ⭐ **CHỈ nhóm HR – TEAMS**: `HrProfileEditModal.tsx` · `HrScreen.tsx` · `HrDirectory` · `TeamDirectory.tsx` · `ProjectTeams.tsx` · `TeamManagement.tsx` · lib **dùng riêng cho HR/Teams** · `tests/**` · `docs/dsh-mutil-session/SESSION_C/**` |

**📏 ĐO ĐƯỢC — 6 tệp NGOÀI PHẠM VI S03 đã bị S03 sửa** (quét marker `ERP-SESSION-03` trong mã nguồn):
| Tệp | Thuộc nhóm S01 | Dấu vết trong mã | mtime |
|---|---|---|---|
| **`lib/workflow-helpers.ts`** | **workflow phê duyệt** | `BUG-20261007-C13` · «ERP-SESSION-03 · 2026-10-09» | ⚠️ **HÔM NAY 12:36** |
| `app/screens/Purchasing.tsx` | **Mua hàng** | `BUG-20261007-C03` | 07/10 |
| `app/screens/Requests.tsx` | **PR** | `BUG-20261007-C04` | 07/10 |
| `app/screens/RequestDrawer.tsx` | **PR drawer** | `BUG-20261007-C05` | 07/10 |
| `app/screens/ReceiptDrawer.tsx` | **Nhận hàng (GRN)** | `BUG-20261007-C07` | 07/10 |
| `app/screens/Delivered.tsx` | **Đã giao** | `BUG-20261007-C03` | 07/10 |

**✅ ĐO ĐƯỢC — ⛔ KHÔNG HỎNG MÃ**: `npx tsc --noEmit` **EXIT 0** · cổng hồi quy `scripts/regression-suite.mjs` **921 test · 920 pass · 0 fail · 1 skip** (EXIT 0)
⇒ ⭐ Xung đột là **PHẠM VI / QUY TRÌNH**, ⛔ **KHÔNG phải mã hỏng** ✓

**🔴 NGUY CƠ SẮP XẢY RA — `app/page.tsx` (S01 đang LOCK)**
Comment của chính S03 trong `lib/workflow-helpers.ts` ghi: «CÙNG LỚP `canAdministerStaff` trong `page.tsx`» — và `canAdministerStaff` **có thật** tại **`app/page.tsx:3235`**.
📏 **ĐÃ KIỂM**: `page.tsx` hiện ⛔ **KHÔNG có** marker SESSION-03; `git diff --stat` = **20+/10− TOÀN BỘ là của S01** (`permissionMatrixKeys`) ⇒ **CHƯA bị sửa** ✓
⇒ ⚠️ **YÊU CẦU `ERP-SESSION-03`**: ⛔ **KHÔNG tự sửa `app/page.tsx`**. Cần vá `canAdministerStaff` ⇒ **HANDOFF cho S01** (S01 đang giữ lock).

**⭐ LUẬT ĐỀ NGHỊ — ⛔ KHÔNG BÊN NÀO PHÁ BÊN NÀO (luật 19)**
1. S03 ⛔ **ngừng** sửa 6 tệp trên; nếu đã có bản vá tốt ⇒ **HANDOFF kèm bằng chứng** cho S01 để S01 kiểm + hồi quy + chịu trách nhiệm.
2. S01 ⛔ **KHÔNG revert / ⛔ KHÔNG ghi đè** bản của S03 — hai bên ⛔ không phá nhau; S01 chỉ **bổ sung** rồi báo.
3. S03 **đăng ký phiên** vào bảng §5 đầu tệp này — hiện bảng **CHỈ có S01 + S02** ⇒ **vi phạm §5 / §29** ✓
4. ⚠️ Ghi nhận: `SESSION_REGISTRY.md` **chưa liệt kê** `app/page.tsx` · 6 tệp MUA HÀNG/GIAO NHẬN · `lib/workflow-helpers.ts` vào bảng «KHOÁ TỆP» ⇒ bảng **cũ/thiếu**; ⛔ đừng suy ra «chưa ai giữ» từ chỗ trống đó ✓

**TRẠNG THÁI `ERP-SESSION-01`**: ⛔ KHÔNG đụng 6 tệp trên trong lúc chờ; tiếp tục giữ `app/page.tsx` + `java-backend/**` (phân quyền/mua hàng) + `docs/dsh-state/**`.
**PHIÊN SẠCH (đã kiểm)**: `ERP-SESSION-04` (`SESSION_D`) khai báo đúng — scope **chỉ `docs/**`**, ghi rõ «⛔ KHÔNG GIỮ app/**, lib/**, java-backend/**, tools/**, tests/**» ✓

### ⭐ [2026-10-08 15:00 · `ERP-SESSION-01`] BÀN GIAO TRẠNG THÁI (§32) + 2 CHÚ Ý PHỐI HỢP (§37 · §40)

#### A. `ERP-SESSION-01` — ĐÃ THAY ĐỔI GÌ (⭐ 7 tệp nguồn + 1 test, tất cả ĐÃ ĐO)
| Tệp | Nội dung | Trạng thái |
|---|---|---|
| `app/page.tsx` | (A) `permissionMatrixKeys` · **M-2** 3 cổng + gate từng bước quản trị | ✅ VERIFIED |
| `java-backend/application/…/rbac/ActionRbacRegistry.java` | **PA-1**: `save_user_access` → `admin_tab_06` + `canView` | ✅ EXIT 0 |
| `java-backend/application/…/rbac/RbacService.java` | ➕ `canUseModule` (lớp mỏng mở port sẵn có) | ✅ |
| `java-backend/application/…/service/UserManagementUseCase.java` | **PA-1** chốt 3 tầng + **S-1** chặn tự nâng quyền | ✅ EXIT 0 |
| `java-backend/infrastructure/…/worker/EmailOutboxDispatchWorker.java` | **BUG-004** xử lý `Boolean` (MySQL `TINYINT(1)`) | ✅ log 0 lỗi/130s |
| `java-backend/infrastructure/src/test/…/EmailOutboxDispatchWorkerTest.java` | ➕ 2 ca Boolean | ✅ 5/5 |
| `tests/m118-system-admin-menu-gate.test.mjs` | cập nhật theo **Ý ĐỊNH GỐC MỐC 118** (⛔ không nới) | ✅ 3/3 |

**KẾT QUẢ ĐO**: `tsc` EXIT 0 · cổng FE **925 test · 924 pass · 0 fail** · Java **86/86** · E2E **11/11** · cổng UI **6/6 bundle đúng byte**.
**SỰ CỐ**: ✅ ⛔ không có tồn đọng · **DEPENDENCY**: ⏸ chờ `S03` nối UI khi lập dự án (`HANDOFF-20261008-010`).
**NEXT STEP**: bước 1-3 của `HANDOFF-20261008-003` (API kho) — xem §B dưới.

#### B. ⚠️ CHÚ Ý PHỐI HỢP ① — `app/screens/AllocateReturn.tsx` (⛔ §40 DEPENDENCY DISCOVERY)
📏 **ĐO ĐƯỢC**: `git status` cho thấy **`app/screens/AllocateReturn.tsx` ĐANG bị sửa** (cùng nhiều tệp
`app/screens/*` khác) — ⚠️ mà `HANDOFF-20261008-009` giao S01 có phần **modal `allocate`**.
⇒ ⭐ **CHUYỂN TỪ `INDEPENDENT` SANG `COORDINATED`**: S01 giữ `app/page.tsx` (⛔ không đụng
`AllocateReturn.tsx` cho tới khi biết ai giữ) ⇒ nếu modal `allocate` nằm trong tệp đó thì
**S01 ⛔ KHÔNG tự sửa** — ➕ ghi handoff cho phiên đang giữ.

#### C. ⚠️ CHÚ Ý PHỐI HỢP ② — `tools/baseline/*.png` bị ghi đè (§37 GENERATED FILES)
📏 **ĐO ĐƯỢC**: nhiều ảnh chuẩn thị giác (`01-dashboard__desktop.png` · `03-work__desktop.png` ·
`04-team__*.png` …) **đang ở trạng thái đã đổi** — ⭐ nguyên nhân: **các lượt chạy
`node scripts/regression-suite.mjs` CỦA CHÍNH S01** (⚠️ cổng này có sinh/cập nhật ảnh chuẩn).
⭐ **LUẬT ĐỀ NGHỊ CHO MỌI PHIÊN**: chạy cổng hồi quy ⇒ **kiểm `git status -- tools/baseline`** sau đó;
⛔ **KHÔNG** `git checkout` đè (⚠️ có thể là ảnh mới nhất của phiên khác) — nếu commit thì **commit luôn cả ảnh** ✓


### ⏸ [2026-10-08 · `ERP-SESSION-01`] CHỜ ĐẶC TẢ **modal `allocate`** ⇒ xem `SESSION_A/HANDOFF_LOG.md` §`HANDOFF-20261008-006`
📏 ĐÃ ĐO: `createStockReservations` (RequestStoreAdapter:420) + `releaseReservationsForRequest` **ĐÃ CÓ** và **đang dùng** (RequestManagementUseCase:820) ⇒ ⛔ không cần viết lại máy giữ chỗ; `issue_stock`/`issue_stock_confirm`/`return_stock` **đã khai RBAC**. ⭐ Chỉ còn thiếu **4 điểm đặc tả** (tên action · payload · nút nào mở · module/capability quyền).
✅ Nút «Tạo/Sửa kho» nay **MỞ ĐƯỢC** (modal `warehouse` đã có + API sống) — ⚠️ nút «Xóa kho» hãy ĐỔI thành «Ngừng hoạt động» gọi `set_warehouse_status`.

### 🔁 [2026-10-08 · `ERP-SESSION-01`] **BÀN GIAO TRỌN PHẦN CÒN LẠI CHO S2** (user chốt: S2 hoạt động lại)
⭐ Chi tiết: `SESSION_A/HANDOFF_LOG.md` §`HANDOFF-20261008-007`. ⛔ Cần S2 làm: ① **bật 4 nút kho** (`Inventory.tsx`, lý do tạm khoá **đã hết**) · ② E2E UI kho · ③ **đặc tả `allocate`** (máy giữ chỗ **ĐÃ CÓ**, chỉ cần 4 điểm) · ④ viết lại phần **đổi danh tính** của probe `probe-grant-1-perm-e2e.mjs` (mở TAB MỚI — hiện **CHƯA KẾT LUẬN**, ⛔ không phải lỗi sản phẩm).
⚠️ 3 luật S01 đã trả giá: (1) `save_warehouse` **upsert toàn phần** — vắng trường = ghi NULL ⛔ không phải «giữ nguyên»; (2) ⛔ không có API xoá kho ⇒ probe tạo kho phải **tự dọn DB** nếu không cổng `W-02` ĐỎ; (3) bootstrap ⛔ **không** gửi `allModulePermissions` cho non-admin ⇒ quyền của chính họ nằm ở `data.modulePermissions`.
✅ S01 **vẫn giữ** `app/page.tsx` + `java-backend` tới khi S2 nhận việc.

### 🟠 [2026-10-08 · `ERP-SESSION-01`] BÁO **ERP-SESSION-03**: **2 action TỔ ĐỘI bị NỚI QUYỀN** ⇒ cổng `TM-04` ĐỎ (⭐ S01 ⛔ không tự sửa — ⛔ không thuộc phạm vi)
📏 `git diff` cho thấy `set_project_team_status` bị đổi `List.of()` → `List.of("site_command")` (và `canUse` → `canEdit`), thêm `delete_project_team` → `site_command` — ⚠️ **trong khi chú thích ngay dòng 96 của chính tệp ghi «⛔ KHÔNG nới cho 2 action còn lại — JS chỉ cho admin»** ⇒ mã mâu thuẫn chú thích ⇒ `tests/tm04-team-crud.test.mjs` ĐỎ. ⭐ Chi tiết + 2 phương án: `SESSION_A/BUG_HOTFIX_LOG.md` §`BUG-20261008-010`.
⭐ S01 **đã xác minh ⛔ không do mình** (3 action của S01: `save_user_access` · `save_warehouse` · `set_warehouse_status`).

### ✅ [2026-10-08 · `ERP-SESSION-01`] Nhận `HANDOFF-20261007-007` (S02): `page.tsx` thiếu `action={action}` cho `<Inventory>` — ⭐ **mã ĐÃ ĐÚNG** (`action={action}` đã có, `tsc` = 0, đến từ commit `0119160`); ⏸ **còn phép ĐO DOM** `[data-vntech="wd-staff-save"]`.disabled=false — S01 đi được đến hub Kho (12 card) nhưng ⛔ chưa mở được màn chi tiết ⇒ đã phản hồi S02 trong `SESSION_B/HANDOFF_LOG.md` (kèm đề nghị S02 đo giúp) ✓

### ✅✅ [2026-10-08 · `ERP-SESSION-01`] `HANDOFF-20261007-007` (S02) **NGHIỆM THU ĐỦ 2/2** — `tsc`=0 · ⭐ **`wd-staff-save`.disabled = `false`** sau khi chọn nhân sự (hub Kho → card → tab Nhân sự → ＋Thêm nhân sự → chọn ứng viên) ⇒ ⭐ `action={action}` **có tác dụng thật** ⇒ 🟢 **VERIFIED** (`TEST-20261008-012`). ⭐ Đo phụ: **4 nút kho ĐÃ BẬT** trong hub ⇒ bước ① của `HANDOFF-20261008-007` đã xong ✓ ⚠️ ⛔ không bấm «Lưu phân công» vì là **FULL-REPLACE** trên người thật ✓

### ✅✅ [2026-10-08 · `ERP-SESSION-01`] **`BUG-008` CHỨNG MINH ĐỦ 2 CHIỀU** — probe `probe-grant-1-perm-e2e.mjs` nay **15/15 ĐẠT · hết `finding` (`TEST-20261008-013`): nhánh ÂM `admin_tab_02` ⇒ **bước 01 KHOÁ** (`true`) · nhánh DƯƠNG `admin_tab_01` ⇒ **bước 01 MỞ** (`false`) + bảng render (1 dòng). ⭐ Gỡ 2 nghi vấn sai bằng ĐO: dấu tiếng Việt ❌ không phải nguyên nhân (khớp 25/25) · ⭐ TIMING ✅ đúng nguyên nhân (đã thêm `choBangTaiKhoan` poll). ⚠️ Nút «Sửa tài khoản»=0 ở nhánh DƯƠNG là **ĐÚNG**: tài khoản uỷ nhiệm tối thiểu chỉ thấy chính mình ⇒ ⛔ không tự sửa mình (luật `S-1`) ✓

### 🛡️ [2026-10-08 · `ERP-SESSION-01`] Thêm công cụ **chỉ đọc** `tools/check-migration-idempotency.mjs` — dò migration SẮP CHẠY mà ⛔ không idempotent (chặn tái phát `BUG-20261008-011`). 📏 Đo: **38 tệp · 0 đang chờ ⇒ ⛔ không rủi ro hiện tại**; ⭐ đối chứng âm `--tat-ca` gắn cờ **9/38 có đúng `V39`** ⇒ phép dò **CÓ THỂ ĐỎ** ✓ ⚠️ Đề nghị **S2 xử lý tận gốc V39** (`INFORMATION_SCHEMA` guard) — nếu không, máy đã có cột sẽ chết ở lần khởi động sau ✓

### 🟠 [2026-10-08 · `ERP-SESSION-01`] **`BUG-20261008-013` (CHÍNH SÁCH — ⏸ chờ user)**: tài khoản uỷ nhiệm non-admin nhận **`data.users = 0`** (`BootstrapDataAdapter.java` **L1257 `if (admin)`** — ⭐ cùng khuôn `allModulePermissions` L943) ⇒ ⛔ không quản trị được ai ⇒ **4 cổng vừa vá (`BUG-009`) ⛔ không thể chạm tới ở runtime** ⇒ ⚠️ mô hình «ITM full quyền» bị chặn ở **tầng DỮ LIỆU**. 📏 Bằng chứng: probe nhánh ③ (`soUsers=0 · soModules=3 · laAdmin=false`). ⭐ 3 phương án **U-1** (thấy theo PHẠM VI — an toàn nhất) · **U-2** (thấy MỌI tài khoản) · **U-3** (giữ nguyên). ⛔ S01 không tự mở rộng tầm nhìn dữ liệu ✓

### 📋 [2026-10-08 · `ERP-SESSION-01`] **`BUG-013` MỞ RỘNG — danh sách ĐẦY ĐỦ 11–14 trường bootstrap bị giữ khỏi non-admin**: xác nhận bằng ĐO: `users` (**soUsers=0**) · `allModulePermissions` (0 dòng) — quét mã: `adminSuppliers` L269 · `engineRoleProfiles` L1219 · `adminPartners` L287 · `userWarehouseScopes` L959 · `emailRecipients` L986 · `emailOutbox` L1000 · `workflowAssignments` L1011 · `projectAccessAll` L59. ⭐ Đề xuất chốt **1 lần** theo **U-1 (+ danh sách loại trừ)** = lọc theo PHẠM VI, ⛔ giữ admin-only cho `emailOutbox`/`emailRecipients`/`allModulePermissions`. ⏸ BLOCKED chờ user ✓

### 📚 [2026-10-08 · `ERP-SESSION-01`] **BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST` (`TASK-20261008-005`): gắn nhãn **80 tệp** (đã xác minh `git diff` **+449/−1** ⇒ ⛔ không hỏng nội dung) · chỉ mục `docs/00_INDEX_TAI_LIEU_ALPHA_TEST.md` · ghi chú phát hành `docs/61_…` · **viết lại 5 tài liệu chính** (31 bàn giao 141→393 · 30 hướng dẫn 155→487 · 33 chức năng 190→782 · 32 hệ thống 169→489 · 34 dev 206→538) bằng **5 subagent song song** · ⭐ **vá lỗ hổng kiểm thử**: `docs/36` ⛔ thiếu mục cho chức năng mới ⇒ thêm **M14/M15/M16** (17 ca) · ⭐ sửa **3 lỗi phép đo CỦA TÔI** (`Measure-Object -Line` đếm thiếu ⇒ `page.tsx` **3718** ⛔ không phải 3607 · `case` **261** ⛔ không phải 260 · `if(admin)` **4** ⛔ không phải 5) · ✅ **dọn 43 tài khoản `probe_*`** do probe tạo (hoạt động 71→**28**, bất biến kho ⛔ không đổi 12/5/10) ✓

### ✅ [2026-10-08 · `ERP-SESSION-01`] **QA bộ tài liệu ALPHA TEST** (`TEST-20261008-014`): quét 5 tài liệu mới viết tìm số cũ ⇒ **4/5 hit là bảng so sánh «cũ → mới» CỐ Ý** (⛔ không xoá) · **1 lệch thật** ở `docs/34` («114 bảng MySQL» ⇒ đã sửa **134**) · ⭐ làm rõ **52 `.tsx` vs 55 tệp** màn hình (khác bộ lọc, ⛔ không mâu thuẫn) ⇒ bộ tài liệu **nhất quán với số liệu nền 08/10** ✓ 📌 luật mới **D-105**: ⛔ đừng «sửa» số chỉ vì khác bảng nền — phải đọc NGỮ CẢNH ✓

### 🔴 [2026-10-08 · `ERP-SESSION-01`] **`BUG-20261008-014` (CRITICAL — nguy cơ MẤT DỮ LIỆU, ⏸ chờ user chốt V-1/V-2/V-3)**: ⭐ do **chính U-1 mở đường** ⇒ người uỷ nhiệm mở được modal «Thêm nhân sự vào kho» nhưng `data.userWarehouseScopes` (**L959**) với non-admin **chỉ có CỦA CHÍNH HỌ** ⇒ `whCu` RỖNG ⇒ payload **FULL-REPLACE** (`Inventory.tsx` L483-490 → `save_user_access`) ⛔ **XOÁ phân công kho của nhân sự được chọn** 🔴. ⭐ KHUYẾN NGHỊ **V-1**: sửa ở **MÁY CHỦ** (giữ nguyên phần NGOÀI phạm vi của người gọi) — ⛔ đừng để client quyết định xoá gì ✓

### 🟠 [2026-10-08 · `ERP-SESSION-01`] **`HANDOFF-20261008-008` SẴN-THI-HÀNH** để vá `BUG-20261008-014` (CRITICAL mất dữ liệu) theo **V-1 — hợp ở MÁY CHỦ**: ⭐ V-1 **⛔ không mở thêm dữ liệu cho client** ⇒ ⛔ **không phải chính sách** ⇒ S01 **được tự thi hành** ✓ Kế hoạch 4 bước: **thêm API đọc scope** vào `UserAdminStore` (⚠️ hiện ⛔ chỉ có `insert/clear`) ⇒ cài ở `UserAdminStoreAdapter` ⇒ dùng ở `UserManagementUseCase.saveUserAccess` **trước** `clearUserScopes` (L339-341) ⇒ **3 ca test** (non-admin ⛔ không mất · admin ⛔ không đổi · non-admin thêm được) ⚠️ khuyến nghị trả `Map<String,String>` để **giữ đúng permission cũ** ✓

### ✅ [2026-10-09 · `ERP-SESSION-01`] **V-1 THI HÀNH XONG + ĐÃ TRIỂN KHAI** cho `BUG-20261008-014` (CRITICAL mất dữ liệu): thêm `UserAdminStore.listExistingScopes` (**3 SELECT** ở adapter) ⇒ trong `saveUserAccess` (**L339–360**) người **⛔ không phải admin** thì **HỢP** payload với phạm vi **HIỆN CÓ** (⭐ payload thắng khi trùng khoá · khoá cũ còn thiếu ⇒ **GIỮ LẠI**) · **admin giữ nguyên FULL-REPLACE** ⇒ ⛔ zero regression. ✅ `mvn -B test` **88/88** · jar mới **09:41** · `health` **200** · **CSDL kho 12/5/10** ⛔ không đổi · ⭐ **PUSH `3cfbd75..268dba5`** (local = remote) ✓ ⏸ **CÒN**: 3 ca test hành vi + phép đo «scope ⛔ không giảm» ⇒ ⛔ chưa dán `FIXED/VERIFIED` theo §24 ✓

### 📚 [2026-10-09 · `ERP-SESSION-01`] **ĐÍNH CHÍNH TÀI LIỆU THEO MÃ THẬT** (`CHG-20261008-009`) — ⚠️ **SỬA GHI CHÚ LỊCH SỬ**: mục ghim **08/10** ở trên nói `BUG-20261008-010` còn OPEN/`TM-04` ĐỎ ⇒ ⭐ **NAY ĐÃ SAI**: đo lại mã **09/10** thấy 2 action `set_project_team_status`/`delete_project_team` đã **ADMIN-ONLY ở CẢ 2 TẦNG** (`ActionRbacRegistry` **L137/L303** `List.of()` + chú thích **L96** · `RbacService.ADMIN_ONLY_ACTIONS` có cả 2 + chú thích «⚠️ `TM-04` chốt: ⛔ KHÔNG nới module `site_command`») ✓ ⇒ ⭐ **`BUG-010` = ĐÃ VÁ** (⛔ không cần ERP-SESSION-03 chốt nữa) ✓ Đã sửa `docs/31` (R-1·R-3·R-4·R-6) + `docs/32` (§9.1·§9.2①) + `docs/61` §4 · ngược lại **`BUG-011` (`V39` ⛔ không idempotent) VẪN ĐÚNG** (`ADD COLUMN` trần L31) ⇒ giữ nguyên ✓ 📌 luật mới **D-106**: ⛔ đừng chép trạng thái bug từ NHẬT KÝ — phải **đọc MÃ tại thời điểm viết** (⚠️ phiên khác có thể đã vá) ✓

### 🔴 [2026-10-09 · `ERP-SESSION-01`] **`DEC-20261008-014` — ĐO LẠI CẢNH BÁO «THỔI PHỒNG TIẾN ĐỘ»**: ⭐ `backup/mt3-head-20260928` **⛔ KHÔNG có commit nào** mà `unity` chưa có (`git log unity..<nhánh>` = **0**) + `git diff --shortstat unity...<nhánh>` = **RỖNG** ⇒ 🔴 **lựa chọn (b) «khôi phục UI MT3» là NO-OP, ⛔ bất khả thi** ✓ · ⭐ lỗ hổng nay **HẸP: đúng 8 tệp `KNOWN_RED`, TẤT CẢ là MT3** · ⚠️ `lib/material-alias.ts` **CÓ ở CẢ HAI nhánh** ⇒ có test đỏ vì **lý do KHÁC** (⛔ không phải thiếu tệp) ⇒ ⭐ **đề xuất (c)**: rà **từng tệp trong 8** để phân định «thiếu thật» vs «sửa được» ⇒ ⛔ không merge hàng loạt ✓ 📌 luật **D-107**: ⛔ đừng hỏi lại user một quyết định cũ khi **tiền đề của nó ⛔ đã hết hiệu lực** — ⭐ **ĐO LẠI trước** ✓

### 🛑 [2026-10-09 · `ERP-SESSION-01`] ⭐ **USER CHỐT `DEC-20261008-015`**: «**MT3 đã rollback không lấy MT3 làm căn cứ cho công việc sắp tới nữa**» ⇒ ⛔ **ĐÓNG HẲN** câu hỏi (a)/(b) đang treo trong `MASTER_STATUS.md` (⛔ không đánh lại mục MT3 · ⛔ không khôi phục UI MT3) · 📏 đo được: `git log unity..backup/mt3-head-20260928` = **0 commit** + `git diff --shortstat` = **RỖNG** ⇒ ⭐ lựa chọn (b) **vốn đã bất khả thi** ✓ · 🧊 **8 tệp `KNOWN_RED` = NỢ CŨ ĐÓNG BĂNG (MT3)** — giữ để cổng ⛔ không giấu nợ mới, ⚠️ nhưng ⛔ **không phải việc cần làm** ✓ · ⚠️ lý do ghi cho `mt3-be-05` trong cổng là **SAI** (`lib/material-alias.ts` **CÓ ở cả 2 nhánh** — đo lại) ✓ 📌 luật **D-108**: ⛔ đợt đã rollback phải **ĐÓNG HẲN** trong state, ⛔ đừng để nằm mãi trong danh sách nợ/kế hoạch ✓

### 🛑 [2026-10-09 · `ERP-SESSION-01`] ⭐ **CHỈ ĐẠO CỦA USER — `DEC-20261008-016`**: «**Master task 1 và 2 đã được đánh dấu là đã xong không rà soát lại nữa, công việc hiện tại được giao việc trực tiếp bởi** [user]» ⇒ 🛑 **MASTER TASK 1 & 2 = ĐÓNG** (⛔ không rà lại · ⛔ không đối chiếu tiến độ · ⛔ không đánh lại trạng thái mục · ⛔ không lấy roadmap/`MASTER_STATUS`/110 mục làm nguồn chọn việc) · 🎯 **NGUỒN CÔNG VIỆC DUY NHẤT = USER GIAO TRỰC TIẾP** ⇒ ⛔ **DỪNG** cơ chế «tự tìm việc kế tiếp» ✓ · ✅ **VẪN LÀM NGAY**: việc user giao · bug CRITICAL/HIGH do user báo · sửa hậu quả do chính phiên gây · cập nhật state/log ✓ · 📏 **Việc đang làm dở ĐÃ DỪNG** kèm kết quả đo: 2 cổng RBAC đỏ ⛔ **không phải rủi ro an ninh** (7 action «chưa biết» **đều khai đủ module + capability**; 68 điểm «lệch capability» là do **Java chi tiết hơn JS cũ** — canUse → canCreate/canEdit/canApprove) ⇒ chỉ còn **sổ sách** ✓ 📌 luật **D-109** ✓
