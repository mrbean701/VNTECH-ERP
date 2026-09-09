# BÁO CÁO DỰ ÁN VNTECH ERP — TỪ KHI NHẬN → HIỆN TẠI → ĐỀ XUẤT TƯƠNG LAI

Ngày báo cáo: 09/09/2026 · Build `5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908` · Fingerprint `VNTECH-FP-CAF2D1963CAA3B5B`
Người thực hiện: Agent phát triển VNTECH ERP · Phạm vi: codebase `VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1_PROJECT_NAV_FINAL_FP_FIXED_20260908`

---

## 1. MÔ TẢ DỰ ÁN TỪ KHI ĐƯỢC NHẬN

### 1.1 Điểm xuất phát (lúc nhận)
- **Sản phẩm**: VNTECH ERP V5.3.0 — nền tảng quản trị & điều hành nội bộ của VNTECH, trọng tâm nghiệp vụ **Kho vật tư + M&E (Cơ – Điện)**: từ bản vẽ → bóc khối lượng BOQ → chuẩn hóa mã vật tư → đề nghị mua (MR) → phê duyệt 5 bậc → PO → nhận hàng → tồn kho theo hợp đồng → xuất/trả/lắp đặt → nghiệp thu → thu hồi vốn.
- **Kiến trúc lúc nhận** (được xây nhanh nhất có thể, cố ý): monolith — React SPA 1 file (`app/page.tsx`, ~570 KB) + backend 1 file (`scripts/system-route.mjs`, ~553 KB, dispatcher if-chain ~200 action) + DB qua adapter D1-like (chạy 3 chế độ: SQLite local / D1 Workerd / PostgreSQL).
- **Hệ thống integrity rất ngặt**: 187 file nguồn bị hash → `verify-vntech-fingerprint.mjs` chặn build/cài nếu fingerprint lệch; migration chỉ append; cấm format code bằng prettier; CSS khóa dưới 400.653 B / 4.950 `!important`; Trust Lock ở development mode.
- **Trạng thái lúc nhận**: 15 màn nghiệp vụ đang là placeholder "ĐANG PHÁT TRIỂN" (3 màn lớn: site_command, construction, material_norms + 6 màn tài chính + 6 màn pháp chế/hành chính).

### 1.2 Những gì đã làm được từ khi nhận

**A. Vận hành & môi trường**
- Cài đặt dependencies, build thành công, thiết lập quy trình chạy local (`node scripts/local-server.mjs` — port 8787, node:sqlite, tự migrate).
- Ghi nhận và xử lý đặc thù Windows/sandbox: `spawn EPERM` → cần full-access khi build/test; test `trust-lock-foundation` fail khi server đang chạy vì `email-secret.key` (runtime state) — hành vi đúng thiết kế.
- Xây dựng công cụ chuẩn hoá **`tools/refresh-phase-identity.mjs`**: sau mỗi vòng đổi source, 1 lệnh cập nhật đủ 5 file identity (SSOT mjs, JSON, product txt, package/full W2) + migration head + brand/release fingerprint.

**B. Phase 1 — Hoàn thiện 15 màn placeholder (toàn bộ đã triển khai, gates ĐẠT)**
| Vòng | Màn | Migration |
|---|---|---|
| A | site_command (BCH dự án: thành viên, nhiệm vụ) | 0050 |
| B | dept_finance_recovery (công nợ tổng hợp) | 0051 |
| C | construction (nhật ký thi công + hạng mục) | 0052 (schema) |
| D | material_norms (định mức + ước lượng) | 0053 (schema) |
| E1–E5 | payment_plan, advance, site_cost, cashbank, documents | 0054–0058 (schema) |
| F1–F2 | legal hr, labor, correspondence, documents, seal, benefits | 0059–0061 (schema) |
> Kèm ~40 action backend mới, bootstrap data, phân quyền module, migration schema nghiệp vụ thật.

**C. Phase 2 — Chiều sâu nghiệp vụ & báo cáo (đã triển khai, gates ĐẠT)**
- 2A: màn `reports` nâng cấp — giá trị HĐ theo dự án (BOQ × đơn giá), công nợ NCC theo PO mở, tồn kho theo hợp đồng, cảnh báo tồn dưới min, xuất CSV/XLSX/In-PDF từng báo cáo.
- 2B: "Sổ kế toán tổng hợp" trên dept_finance_recovery — gộp 6 nguồn tài chính thành bút toán chuẩn Nợ/Có, xuất CSV/XLSX/JSON (chuẩn nạp MISA).
- 2C: action `check_material_alias_conflicts` + UI soát trùng alias; báo cáo đối chiếu 3 luồng hoàn trả/điều chuyển.
- Migrations 0062–0064 (metadata identity-refresh).

**D. Kiến trúc mục tiêu (quyết định chiến lược, chưa code)**
- Đã ghi `docs/06_KIEN_TRUC_MUC_TIEU_JAVA_CLEAN_ARCH.md`: **không refactor monolith JS**; monolith = reference implementation; tương lai xây **Java Clean Architecture + MySQL** theo Strangler Fig (thay từng lát dọc, gateway action giữ UI). → **Theo quyết định mới nhất của người dùng, hướng này tạm hoãn; tiếp tục phát triển trên kiến trúc hiện tại.**

---

## 2. CHECKLIST HÔM NAY (09/09/2026) — TRẠNG THÁI TRƯỚC KHI BẮT ĐẦU KẾ HOẠCH MỚI

### 2.1 Kiểm tra code & gates — TẤT CẢ ĐẠT (trạng thái cuối)
| Hạng mục | Kết quả |
|---|---|
| `verify:fingerprint` | ✅ `VNTECH-FP-0C5B81E5CD38B19F` · 197 file · brand/release verified |
| `verify:release` | ✅ manifest 222 file · migrations `0000..0074` · private key absent |
| `master-baseline-gate` | ✅ CSS R1.1.1 canonical · !important=4950 · css=400643B |
| `css-baseline-audit` | ✅ 2725 dòng · dead classes=0 · dynamic contracts=PASS |
| `migrate-postgres --preflight` | ✅ 75 file / 619 statements |
| `npm run build` | ✅ exit 0 · artifact validation ĐẠT |
| `typecheck` | ✅ PASS |
| `eslint` (page.tsx + system-route.mjs) | ✅ 0 errors · 70 warnings (có sẵn, không phải lỗi mới) |
| `npm run test:workflow` | ✅ PASS (approvals 5 bậc/email/SLA → PO/delivery → material → permissions) |
| `npm run test:regression` | ✅ **61 pass / 0 fail** — đã fix test `mobile-menu-interaction` (Windows path bằng `fileURLToPath` + cập nhật assertion material_norms) |

### 2.2 Chạy dự án (server local, port 8787)
- Trang UI: **HTTP 200** — đúng title "VNTECH ERP – Quản trị & Điều hành".
- API `POST /api/system` (login thử): **HTTP 401** — route hoạt động (từ chối sai mật khẩu, không 500).
- Server tự migrate lên 0074, tạo `.local-data/warehouse.sqlite`, báo "ĐÃ SẴN SÀNG", fingerprint khớp identity.
- Sau kiểm tra: đã dừng server + dọn `.local-data` để cây nguồn sạch cho test.

### 2.3 Cập nhật tiến độ sau kiểm tra (cùng ngày)
- **Fix test `mobile-menu-interaction`** (vòng 3A, migration 0065): `fileURLToPath` thay `URL.pathname` (lỗi Windows `%20`), cập nhật test "Material norms" cho đúng hiện trạng màn đã thành thật. → Regression **61/61 pass**, workflow pass.
- **Thêm card "Cảnh báo tồn dưới mức tối thiểu" trên Dashboard** (vòng 3B, migration 0066): liệt kê mã/tên/kho/tồn/min/thiếu + nút "Lập đề nghị" → mua bù.
- **Vòng 3C (0067)**: báo cáo Dashboard quản lý KH↔TH↔Ngân sách trên reports. **3D (0068)**: màn Inventory lọc tồn thấp. **3E (0069)**: banner cảnh báo vật tư thiếu trên Requests. **3F (0070)**: nút ⇩ PDF tải file thật cho báo cáo + sổ kế toán.
- **Vòng UX-071 (0071)**: điều chỉnh UX/UI theo yêu cầu — nút `.primary/.secondary` nhỏ gọn; header bảng wrap; ô nhập `payment-entry-inline` cao hơn + grid tự co giãn (form nhiều trường hết bị cụt chữ); khôi phục encoding UTF-8 của `globals.css` (đã bị ghi sai qua PowerShell 5.1 ANSI). Fingerprint `VNTECH-FP-5D92A24A6855E900`.
- **Vòng 3G (0072)**: màn Kiểm kê & hoàn trả thêm card "Đối chiếu luồng vật tư rời" (điều chuyển + hoàn trả kho tổng) + xuất CSV/XLSX. **3H (0073)**: báo cáo "Dòng tiền theo dự án" trên dept_finance_recovery (Thu − Chi + tiền thực thu HĐ, xuất CSV/XLSX/PDF). **3I (0074)**: báo cáo "Cảnh báo quá hạn & sắp đến hạn" trên reports (PO trễ hẹn, nhiệm vụ quá hạn, hợp đồng sắp hết hiệu lực, mức Cao/TB/Thấp + xuất CSV/XLSX/PDF).
- Fingerprint hiện tại: `VNTECH-FP-0C5B81E5CD38B19F` (197 file, migrations 0000..0074).

### 2.4 Bug đã xử lý (không còn fail)
- ~~**`tests/mobile-menu-interaction.test.mjs`** fail trên Windows~~ → **đã sửa** (vòng 3A): dùng `fileURLToPath` thay `new URL(...).pathname` (lỗi `%20` không decode). Regression giờ **61/61 pass**.

### 2.5 Lưu ý vận hành đã xác nhận (quan trọng)
- Chạy server local tạo `.local-data/email-secret.key` làm test `trust-lock-foundation` fail → quy trình chuẩn: **dừng server + xóa `.local-data` (và `.server-data` nếu có) trước khi chạy test suite**.
- ⚠️ **KHÔNG dùng PowerShell `Get-Content`/`WriteAllText` mặc định để sửa file UTF-8 có ký tự tiếng Việt** (PS 5.1 đọc ANSI → mojibake + phình file). Mọi sửa file nguồn phải dùng **tool edit UTF-8 / Node `fs`** như thao tác trong dự án.

---

## 3. ĐỀ XUẤT TRIỂN KHAI TRONG TƯƠNG LAI

### 3.1 Nguyên tắc (theo yêu cầu mới)
- **Giữ nguyên kiến trúc monolith hiện tại** — không tách layered.
- **Ưu tiên "hoạt động mượt mà" hơn "hoàn hảo"**: fix bug cản trở dùng trước, tính năng giá trị cao, mỗi thay đổi vẫn qua gates + refresh identity (không phá fingerprint).

### 3.2 Đề xuất công nghệ (cho kiến trúc hiện tại — fingerprint-safe)
| Công nghệ | Dùng khi nào | An toàn fingerprint |
|---|---|---|
| Sửa test path bằng `fileURLToPath` | Ngay — sửa bug test mobile-menu | Phải refresh identity (1 vòng nhỏ) |
| Thêm test regression mới cho các tính năng Phase 1/2 | Liên tục — tăng độ tin cậy | Chỉ thêm file test → vẫn đổi fingerprint, chấp nhận khi release |
| Công cụ `tools/refresh-phase-identity.mjs` (đã có) | Mỗi vòng release | Chuẩn hoá sẵn |
| Giữ Node 24 / dependencies hiện tại | Không nâng bản vội | Ưu tiên ổn định |
| MySQL: **KHÔNG thực hiện lúc này** (ghi nhận chỉ trong `docs/06`) | Khi chốt Java/MySQL | Là dự án riêng, không đụng code này |

### 3.3 Đề xuất fix bug & cải tiến vận hành (ưu tiên cao, làm trước)
1. **Fix test `mobile-menu-interaction`** (`fileURLToPath`) → để `npm test` xanh 100% trên Windows (giá trị kiểm định ngay).
2. Rà soát lỗi runtime cản trở dùng: đã xác minh login/UI/API OK; **chưa thấy lỗi cản trở**. Tiếp tục theo dõi qua test khi thêm tính năng.
3. Ghi chú vận hành (đã có trong doc này + docs/05): quy trình dọn `.local-data` trước test.

### 3.4 Đề xuất tính năng tiếp theo (theo docs/04, giá trị cao → ưu tiên "mượt")
**Giai đoạn ngắn hạn (1–2 vòng):**
- Hoàn thiện luồng **cảnh báo chủ động**: cảnh báo tồn dưới min đưa vào Dashboard & Request (hiện mới ở màn reports).
- **Báo cáo dashboard quản lý** so kế hoạch ↔ thực hiện ↔ ngân sách (production planned vs actual vs approved; capital recovery chuỗi) — data có sẵn, chỉ dựng UI.
- **PDF đúng nghiệp vụ** cho báo cáo (hiện CSV/XLSX/In-browser; hoàn thiện xuất PDF qua `lib/request-export` pattern).

**Trung hạn (2–4 vòng):**
- Nâng cấp Material Catalog UX: batch đổi nhóm/hệ, alias import an toàn (đã có guard), hiện cảnh báo trùng theo real-time.
- Báo cáo tài chính theo dự án: dòng tiền gộp (thu/chi/tạm ứng/quỹ) — gắn với "Sổ kế toán tổng hợp" đã làm.
- Chuẩn hóa luồng kiểm kê/điều chuyển (giảm phân mảnh 3 luồng) — đã có báo cáo đối chiếu, làm tiếp bước hợp nhất nhẹ.

**Dài hạn (khi có quyết định):** hệ Java Clean Architecture + MySQL theo `docs/06` (chỉ khi chốt đầu tư; hiện tại không đụng).

### 3.5 Rủi ro cần quản lý
1. **Fingerprint**: mọi đổi source → refresh identity; không format code; migration chỉ append 0065+.
2. **Test mobile-menu**: sửa đúng chuẩn, không "chữa cháy" bằng bỏ test.
3. **Không gộp nhiều việc 1 vòng**: mỗi vòng 1 phạm vi, chạy đủ gates, giữ khả năng rollback.
4. **Tránh phạm vi trôi**: ưu tiên mượt mà → nếu tính năng phức tạp làm chậm, tách vòng sau.

---

## 4. KẾT LUẬN
Dự án đang ở trạng thái **vận hành tốt, gates xanh, build/test qua**; 15 màn placeholder đã thành màn thật và Phase 2 báo cáo/tài chính/chất lượng dữ liệu đã triển khai. Điểm yếu duy nhất đang biết là bug path của 1 file test cũ (không ảnh hưởng sản phẩm). Kế hoạch tiếp theo: **theo hướng "giữ monolith, làm mượt trước"** — fix test, bổ sung cảnh báo chủ động & dashboard quản lý, hoàn thiện PDF, rồi các báo cáo tài chính sâu; mỗi vòng đều qua gates + refresh identity đúng chuẩn.