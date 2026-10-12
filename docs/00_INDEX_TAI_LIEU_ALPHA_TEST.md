> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# 00 — CHỈ MỤC TÀI LIỆU (BẢN `ALPHA TEST`)

> ⭐ **Đây là điểm vào của toàn bộ tài liệu dự án.** Mọi tài liệu trong bộ này đều mang nhãn
> `DOC-ALPHA-TEST-2026.10` ở đầu tệp (⚠️ trừ nhật ký phiên — xem §6).

## 1. BỐN TÀI LIỆU CHÍNH (⭐ đọc theo thứ tự này)

| # | Tài liệu | Dùng cho ai | Nội dung |
|---|---|---|---|
| 1 | [`31_TAI_LIEU_BAN_GIAO.md`](31_TAI_LIEU_BAN_GIAO.md) | ⭐ **người nhận bàn giao** | thông tin sản phẩm · kiến trúc đang vận hành · tài khoản · quy trình build/deploy · git · cổng kiểm chứng · bất biến CSDL · việc còn tồn |
| 2 | [`30_HUONG_DAN_NGUOI_DUNG.md`](30_HUONG_DAN_NGUOI_DUNG.md) | **người dùng cuối** | đăng nhập · điều hướng menu · quy trình nghiệp vụ · 4 chức năng kho · phân quyền · thủ thuật · xử lý tình huống |
| 3 | [`33_MO_TA_CHUC_NANG_VA_HE_THONG.md`](33_MO_TA_CHUC_NANG_VA_HE_THONG.md) | **nghiệp vụ + BA** | cấu trúc menu · danh mục màn hình · danh mục action backend · **RBAC 3 tầng** · luồng nghiệp vụ · chức năng quản trị |
| 4 | [`32_TAI_LIEU_PHAN_TICH_HE_THONG.md`](32_TAI_LIEU_PHAN_TICH_HE_THONG.md) | **kỹ thuật + kiến trúc** | kiến trúc tổng thể · Clean Architecture · mô hình dữ liệu · an toàn & toàn vẹn · worker nền · hạn chế đã biết |

## 2. TÀI LIỆU KỸ THUẬT & VẬN HÀNH

| Tài liệu | Nội dung |
|---|---|
| [`34_TAI_LIEU_DEV.md`](34_TAI_LIEU_DEV.md) | môi trường · cấu trúc mã · build & chạy · test/gate · **quy tắc vàng** |
| [`29_RUNBOOK_BUILD_VA_CHAY_JAVA_BACKEND.md`](29_RUNBOOK_BUILD_VA_CHAY_JAVA_BACKEND.md) | runbook build + chạy backend Java |
| [`60_RUNBOOK_SAU_BUILD_20261008.md`](60_RUNBOOK_SAU_BUILD_20261008.md) | runbook các bước NGAY SAU khi build |
| [`11_RUNBOOK_VAN_HANH_BACKEND_JAVA.md`](11_RUNBOOK_VAN_HANH_BACKEND_JAVA.md) | vận hành backend Java |
| [`10_KẾ_HOẠCH_CUTOVER_BACKEND_JAVA.md`](10_KẾ_HOẠCH_CUTOVER_BACKEND_JAVA.md) · [`14_KE_HOACH_CUTOVER_THUC_THI_JAVA_MYSQL.md`](14_KE_HOACH_CUTOVER_THUC_THI_JAVA_MYSQL.md) | kế hoạch cutover |
| [`MIGRATION_UPGRADE_ROLLBACK.md`](../MIGRATION_UPGRADE_ROLLBACK.md) | nâng cấp & hoàn nguyên |
| [`16_HUONG_DAN_SEED_DEMO_VA_TAI_KHOAN_MO_RA.md`](16_HUONG_DAN_SEED_DEMO_VA_TAI_KHOAN_MO_RA.md) | seed dữ liệu demo |

## 3. KIỂM THỬ & NGHIỆM THU

| Tài liệu | Nội dung |
|---|---|
| [`36_KIEM_THU_ALPHA_THEO_BO_PHAN_CHUYEN_MON.md`](36_KIEM_THU_ALPHA_THEO_BO_PHAN_CHUYEN_MON.md) | ⭐ **kế hoạch kiểm thử ALPHA theo bộ phận chuyên môn** |
| [`56_KICH_BAN_KIEM_THU_CONG_UAT_7_VIEC_20261008.md`](56_KICH_BAN_KIEM_THU_CONG_UAT_7_VIEC_20261008.md) | kịch bản kiểm thử công/UAT |
| [`58_BIEN_BAN_NGHIEM_THU_7_VIEC_CONG_VIEC_20261008.md`](58_BIEN_BAN_NGHIEM_THU_7_VIEC_CONG_VIEC_20261008.md) | biên bản nghiệm thu |
| [`55_TEST_SAN_DAN_CHO_7_VIEC_20261008.md`](55_TEST_SAN_DAN_CHO_7_VIEC_20261008.md) | test sẵn dàn |
| [`19_CHECKLIST_DEBUG_THU_CONG.md`](19_CHECKLIST_DEBUG_THU_CONG.md) | checklist debug thủ công |
| `docs/KiemThuE2E/` | bộ kiểm thử E2E |

## 4. TRẠNG THÁI & ĐIỀU PHỐI ĐA PHIÊN

| Tài liệu | Nội dung |
|---|---|
| [`docs/dsh-state/SESSION_REGISTRY.md`](dsh-state/SESSION_REGISTRY.md) | ⭐ **sổ đăng ký phiên + ghim điều phối** (nguồn sự thật khi nhiều phiên chạy song song) |
| [`docs/agent-progress/MASTER_STATUS.md`](agent-progress/MASTER_STATUS.md) | ⭐ **trạng thái master task 110 mục** |
| [`docs/agent-progress/TASK_INDEX.md`](agent-progress/TASK_INDEX.md) | chỉ mục nhật ký từng task |
| [`45_BANG_TONG_HOP_GO_LIVE_20261008.md`](45_BANG_TONG_HOP_GO_LIVE_20261008.md) | bảng tổng hợp go-live |
| [`48_AUDIT_CLOSURE_20261008.md`](48_AUDIT_CLOSURE_20261008.md) · [`41_MA_TRAN_QUYEN_GO_LIVE_20261008.md`](41_MA_TRAN_QUYEN_GO_LIVE_20261008.md) | audit closure · ma trận quyền |

## 5. CHUẨN NHÃN PHIÊN BẢN (⭐ áp cho MỌI tài liệu trong bộ)

```text
DOC-ALPHA-TEST-2026.10   ← nhãn bộ tài liệu (dòng đầu mỗi tệp)
Sản phẩm                 V5.3.0-MASTER-BASELINE-R1.1.1
```
⚠️ **Phân biệt 2 loại phiên bản — ⛔ đừng lẫn:**
| Loại | Giá trị | Ghi chú |
|---|---|---|
| **Phiên bản SẢN PHẨM** (mã + vân tay) | `V5.3.0-MASTER-BASELINE-R1.1.1` · vân tay `VNTECH-FP-BB706F1202490077` | ⚠️ ⛔ **KHÔNG đổi** khi chỉ cập nhật tài liệu — vân tay gắn với bản build đang chạy (cổng `verify-ui-build-applied` kiểm `byte 6/6`) |
| **Phiên bản TÀI LIỆU** | `DOC-ALPHA-TEST-2026.10` | ⭐ đổi được tự do, ⛔ không ảnh hưởng mã/vân tay |

## 6. NHẬT KÝ PHIÊN (⚠️ nhãn riêng — ⛔ không gắn nhãn tài liệu)

`docs/dsh-mutil-session/SESSION_A|B|C|D/*.md` là **nhật ký append-only** của từng phiên
(`EVENT_LOG` · `TASK_LOG` · `DEV_LOG` · `CHANGE_LOG` · `TEST_LOG` · `BUG_HOTFIX_LOG` ·
`DECISION_LOG` · `HANDOFF_LOG` · `WEEKLY_REPORT_DATA`).
⛔ **Không sửa/không gắn nhãn** các tệp này (⚠️ quy tắc đa phiên: ⛔ không ghi đè state của phiên khác).

## 7. CỔNG KIỂM CHỨNG (⭐ chạy trước khi tin bất kỳ tài liệu nào)

| Cổng | Lệnh |
|---|---|
| Cổng hồi quy FE | `node scripts/regression-suite.mjs` |
| Kiểu TypeScript | `npx tsc --noEmit --incremental false` |
| Test Java | `cd java-backend && mvn -B test` |
| Bản chạy khớp bản build | `node tools/verify-ui-build-applied.mjs --port=8787` |
| Probe phân quyền E2E | `node tools/probe-grant-1-perm-e2e.mjs` |
| Dò migration sắp chạy | `node tools/check-migration-idempotency.mjs` |

## 8. SỐ LIỆU NỀN (⭐ đo ngày 08/10/2026 — dùng để ĐỐI CHIẾU mọi tài liệu)

| Hạng mục | Số đo | Cách đo |
|---|---|---|
| Màn hình `app/screens` | ⭐ **55 tệp** (trong đó **52** tệp `.tsx`) | `Get-ChildItem app/screens -File` (55) lọc `-Filter *.tsx` (52) — ⚠️ **2 số KHÁC BỘ LỌC, ⛔ không mâu thuẫn** |
| Action backend | **261** | `Select-String -Pattern 'case\s+"' -AllMatches` **trừ** dòng COMMENT (L415) ⚠️ `^\s*case "` **sót** `L1200: }case "close_po_line" -> {` (case chung dòng) |
| Mục khai RBAC (`Map.entry("` trong `ActionRbacRegistry.java`) | **431** | `Select-String -Pattern 'Map\.entry\("'` |
| Tệp migration `.sql` | **38** | `Get-ChildItem java-backend/infrastructure/src/main/resources/db/migration` |
| Tệp test FE `tests/*.test.mjs` | **158** | `Get-ChildItem tests -Filter *.test.mjs` |
| Tệp `.java` (⛔ trừ `target/`) | **166** | `Get-ChildItem java-backend -Recurse -Filter *.java` |
| Tệp `.tsx/.ts` trong `app/` + `lib/` | **100** | `Get-ChildItem app,lib -Recurse -Include *.tsx,*.ts` |
| Dòng `app/page.tsx` | **3718** | `(Get-Content app/page.tsx).Count` ⚠️ **⛔ KHÔNG dùng `Measure-Object -Line`** (đếm thiếu 111 dòng!) |
| Bảng trong CSDL `vntech_erp` | **134** | `information_schema.tables` |
| Migration đã áp dụng thành công | **38** | `flyway_schema_history WHERE success=1` |
| Tài khoản (`users`) | **73** | `SELECT COUNT(*) FROM users` |
| **Bất biến kho** `warehouses` / `projects` / kho có `project_id` | **12 / 5 / 10** | ⭐ khớp `docs/agent-progress/W-02-AUDIT-PROJECT-WAREHOUSE.md` |
| Module backend | `domain` · `application` · `infrastructure` · `web` (+ `contract-tests`, `data`, `tools`) | `Get-ChildItem java-backend -Directory` |
| Commit đang chạy | `3cfbd75` (nhánh `unity`) | `git log -1 --oneline` |
| Vân tay bản chạy | `VNTECH-FP-BB706F1202490077` · bundle `bb706f1202490077` | `node tools/verify-ui-build-applied.mjs --port=8787` |

⚠️ **Lưu ý kiểm chứng**: nếu một tài liệu ghi số KHÁC bảng này mà không nêu cách đo riêng ⇒
⭐ **coi là số cũ**, phải đo lại. ⛔ Đừng tin số chép tay.
