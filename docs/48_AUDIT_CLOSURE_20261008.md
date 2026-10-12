> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# AUDIT CLOSURE — KẾT THÚC ĐỢT AUDIT JOBS/PROJECT & RBAC (11 vòng)

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · **read-only** suốt đợt (⛔ 0 dòng mã sản phẩm)
Mục đích: chốt lại **cái gì đã hoàn tất**, **cái gì còn lại**, và **vì sao ⛔ không thể làm tiếp bằng vòng lặp tài liệu** nữa.

---

## 1. ✅ ĐÃ HOÀN TẤT (yêu cầu gốc của user: *«audit JOBS và PROJECT trước khi tôi giao việc»*)

| Vùng | Kết quả | Tài liệu |
|---|---|---|
| **JOBS** (`my_work`) | ✅ menu 5 mục → `WorkCenter` 5 tab · 8 action đủ module+capability · lỗi cũ đã vá · 3 điểm nhỏ (J-01/J-02/J-03) | `docs/38` |
| **PROJECT** | ✅ RBAC dự án **đã xác định đúng tầng** (`requireRequireAdmin`, là **chủ ý**) · 4 tệp mồ côi · nợ FE ngày ISO (2 chỗ, `page.tsx:1024`) | `docs/38`·`39`·`40` |
| **Chuỗi mua hàng lõi** | ✅ **SẠCH** (mua hàng 13 · kho 12 · tài chính 3 action **module-gated đúng**) | `docs/40`·`41` |
| **Ma trận quyền go-live** | ✅ bảng **A/L/M** cho 5 nhóm + gợi ý module cho 4 phòng (dùng cho **GĐ A3/A4**) | `docs/41` |
| **Nhóm mồ côi quyền (P-08)** | ✅ **18 action chốt chính xác** (khớp 100% lịch sử 30/09) ⇒ **spec** (`docs/42`) + **patch pack** (`docs/47`) + **2 cổng tĩnh sẵn dán** (`docs/43`) + **script phân loại** (`docs/44`) | `docs/42`·`43`·`44`·`46`·`47` |
| **Chiều bảo mật** | ✅ `PUBLIC_ACTIONS` **SẠCH** (⛔ không bypass · `setup` 409 · `login` 429) | `docs/43` |
| **Đường cấp quyền** | ✅ FE↔BE **nhất quán** (⛔ không "nút chết") · **chốt mô hình**: cấp quyền **tập trung ở admin** | `docs/44` |
| **NO_CASE** | ✅ **0** — registry ↔ controller khớp tên đầy đủ | `docs/46` |
| **Bảng tổng hợp quyết định** | ✅ 1 trang: 7 câu hỏi + kế hoạch 8 bước | `docs/45` |

**Tổng**: **12 task** · **12 tài liệu** (`docs/37`→`48`) · **5 bug phát hiện** · **0 dòng mã sản phẩm bị sửa** · ⛔ **0 commit/push**.

---

## 2. 🆕 CHỐT NỐT: `BUG-20261008-D04` (P-09) — **2 action**, và **NGUYÊN NHÂN GỐC đã lộ ra trong mã**

| Action | Dòng | Tầng ① (registry) | Tầng ② (controller) | Ai chạy |
|---|---|---|---|---|
| `delete_supplier` | `:1444` | `supplier_catalog` · `canEdit` (**M được**) | 🔴 **`requireRequireAdmin`** (`:1445`) | **A** |
| `delete_partner` | `:1462` | `supplier_catalog` · `canEdit` | 🔴 **`requireRequireAdmin`** (`:1464`) | **A** |
| `save_partner` · `set_partner_status` | `:1452` · `:1457` | `supplier_catalog` | ✅ `requireCurrentUser` | L · M |

### 2.1 ⭐ NGUYÊN NHÂN GỐC — **chính mã nói ra** (⛔ không phải suy đoán)
`SystemController.java:1463` ghi nguyên văn:
> `// Khuôn `delete_supplier`: chỉ admin (Java chưa có helper isDepartmentApprover("KH")).`

⇒ **Bản JS monolith CÓ helper `isDepartmentApprover(<phòng>)`; bản Java CHƯA port helper đó** ⇒ khi chuyển sang Java, hai action này **tạm gác về admin** thay vì cho **Trưởng phòng Kế hoạch** xoá.
⇒ **Hệ quả cho quyết định B5** (`docs/45` §B): hai lựa chọn **rõ ràng** hơn trước —
| Lựa chọn | Việc phải làm | Công sức |
|---|---|---|
| **(a) Giữ admin-only** (khuyến nghị cho go-live) | Sửa **registry** cho khớp (`delete_supplier`/`delete_partner` → `List.of("admin")` **+** dùng nhánh `ADMIN_ONLY_ACTIONS` ở `docs/47` §D để **thông điệp đúng**) | **1–2 dòng** |
| **(b) Cho Trưởng phòng Kế hoạch xoá** | **Port helper `isDepartmentApprover`** sang Java (tìm bản JS trong lịch sử), thay cổng ở 2 `case`, thêm test | **≥ nửa ngày** + rủi ro |

⇒ ⭐ **Đề xuất mạnh: chọn (a)** cho go-live; (b) để sau, ghi thành **nợ kỹ thuật có tên** (*«port `isDepartmentApprover`»*).

---

## 3. ⛔ RÀNG BUỘC ĐÃ PHÁT HIỆN — **vì sao phiên này ⛔ không được tạo tệp mới**

⚠️ **Bất kỳ tệp mới nào trong thư mục thuộc phạm vi vân tay** (`app/` · `lib/` · `scripts/` · `tests/` · `tools/` · `java-backend/` · `drizzle/` · `public/` …) đều **đổi vân tay nguồn** ⇒ **bắt buộc chạy `node tools/gd-cycle.mjs "<NHÃN>"`** để đồng bộ SSOT, nếu không **mọi cổng build của cả cụm sẽ đỏ**.
Mà **shell đang hỏng** ⇒ ⛔ **không chạy được `gd-cycle`** ⇒ **quyết định đúng đắn: ⛔ KHÔNG tạo 2 tệp test** (`tests/golive-rbac-orphans.test.mjs` …) dù nội dung đã viết xong.
⇒ ⭐ 2 tệp đó **giữ nguyên ở dạng "sẵn dán"** trong `docs/43` §2 (nội dung hoàn chỉnh, ⛔ không cần sửa gì khi dán).
✅ **Ngược lại**: sửa `docs/**` **KHÔNG** cần `gd-cycle` (đã có tiền lệ trong `SHARED_STATE`) ⇒ ⭐ **11 tài liệu của đợt này ⛔ không làm hỏng vân tay**.

---

## 4. 📌 CÒN LẠI — **tất cả đều cần USER hoặc SHELL** (⛔ không còn việc tài liệu giá trị)

| # | Việc | Chặn bởi | Ai |
|---|---|---|---|
| 1 | **Sửa profile DSH `web`** (thiếu `@deepseek-ai/dsh-scope`) | — | **USER** |
| 2 | 6 phép đo runtime (`docs/39` §5) + script (`docs/44` §2) | 1 | S01/S04 |
| 3 | Chốt **7 quyết định** (`docs/45` §B) + bảng **capability** (`docs/47` §B) | — | **USER** |
| 4 | Áp **patch P-08** (`docs/47` §A-§D) — 2 tệp Java, ⛔ không migration | 1 + 3 | S01 |
| 5 | Dán **2 cổng tĩnh** + `SNAPSHOT_EMPTY_COUNT` 65→53 | 1 | S01 |
| 6 | FE: 2 chỗ ngày ISO (`page.tsx:1024`) · ẩn 22 màn mỏng (`lib/menu-helpers.ts`) | 3 (B6/B7) | S01/S02 |
| 7 | Hợp nhất commit theo danh sách tệp từng phiên (⛔ không `git add -A`) | **USER** | user + 3 phiên |
| 8 | (Nợ mới) **Port `isDepartmentApprover`** sang Java — chỉ nếu chọn B5=(b) | 3 | S01 |

⇒ ⭐ **Đợt audit đã đạt mục tiêu**: user có **đủ dữ kiện** để giao việc (1 bảng quyết định + 1 patch pack + 2 cổng + 1 script). ⛔ **Các vòng tiếp theo chỉ có thể lặp lại thông tin** nếu chưa có shell/user ⇒ đây là lý do **báo BLOCKED**.

---

## 5. BÀI HỌC GIỮ LẠI CHO DỰ ÁN (đã ghi vào log)

| Mã | Bài học |
|---|---|
| **Đ-04-01** | Một `403` có thể do **2–3 tầng**; **thông điệp lỗi là dấu vân tay của tầng** ⇒ ⛔ đừng kết luận từ registry |
| **Đ-04-02** | `List.of()` ở registry **không phải** nguyên nhân duy nhất (có thể chết ở tầng ②) |
| **Đ-04-03** | ⛔ **không tái sử dụng số liệu cũ** khi mã đã đổi — phải **đo lại** (65 rỗng hôm nay vs 19 mồ côi 30/09) |
| **Đ-04-04** | «UI có nút» ≠ «user bấm được» — phải kiểm **cả FE (menu + `accessDenied`)** **và** BE |
| **Đ-04-05** | ⛔ **không kế thừa mô tả từ tài liệu cũ** — phải **đếm trong mã** (mô tả «1 form» của `docs/09` sai) |
| **Đ-04-06** | **Tự xác minh lại phát hiện của chính mình là bước bắt buộc**: 11 vòng đã **bác 1, đính chính 3, rút 1 việc** — nếu user giao việc sớm thì đó là **việc giả** |
| **Đ-04-07** | ⛔ **không tạo tệp mới trong thư mục thuộc vân tay khi chưa chạy được `gd-cycle`** |
| **Đ-04-08** | ⭐ **Sửa quyền phải sửa CẢ capability** (`capabilityFor` mặc định `canUse`) — ⛔ chỉ thêm module là **cấp quyền quá rộng** |
