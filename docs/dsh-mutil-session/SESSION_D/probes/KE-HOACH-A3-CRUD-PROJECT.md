# 🎯 KẾ HOẠCH `A3` — THÊM **QUYỀN CRUD CỦA PROJECT** VÀO MA TRẬN PHÂN QUYỀN

- **Ngày chốt:** 08/10/2026 · **Người chốt:** USER (nguyên văn): «*Nếu như là quyền crud của Project thì nên thêm vào ma trận. Nếu phải chỉnh sửa PROJECT thì cứ làm nhưng nhớ phải đúng phạm vi để tránh conflict*»
- **Phiên thi hành:** `ERP-SESSION-04` (`SESSION_D`) · **Trạng thái:** ⏳ **KẾ HOẠCH — chưa thi hành**
- ➡️ Điều này **ĐÓNG `Q1`** trong `docs/61` §3 theo hướng **`A3`** (⛔ **KHÔNG** dùng `A2`).

---

## 1. VÌ SAO `A3` (⛔ không `A2`) — theo đúng chữ của user

User cho phép **sửa PROJECT** để **thêm quyền CRUD vào ma trận** ⇒ cần **3 action trở thành cấp được qua ma trận**. Có 2 cách:

| | Cách | ⚠️ Hệ quả ĐO ĐƯỢC |
|---|---|---|
| `A2` | Dùng lại khoá **có sẵn** `dept_project_plan` | 🔴 **NỚI QUYỀN RẤT LỚN**: khoá này đang `can_create=1` ở **8/8 đơn vị** + **42 TÀI KHOẢN** ⇒ 42 người **tự nhiên** tạo được dự án (⚠️ ⛔ không phải «chỉ Phòng Dự án» như tên khoá gợi ý) |
| **`A3`** ⭐ | Tạo **khoá module MỚI** `project_admin` + **1 dòng ma trận** | ✅ **Chỉ ai được TICK mới có quyền** ⇒ ⛔ **0 tài khoản** bị ảnh hưởng ngoài ý muốn · ⭐ đúng cách đã làm cho **WORK** |

⇒ ⭐ **`A3` = «thêm vào ma trận» đúng nghĩa** (admin tick từng người), ⛔ **không** kèm hệ quả phụ 42 tài khoản.

## 2. VIỆC PHẢI LÀM (4 mục) + **CHỦ SỞ HỮU** (⚠️ để ⛔ không conflict)

| # | Việc | Tệp / đối tượng | **Chủ** | Ghi chú phạm vi |
|---|---|---|---|---|
| 1 | **Gắn module + capability** cho 3 action: `create_project` → `project_admin`+`canCreate` · `update_project` → `+canEdit` · `delete_project` → `+canEdit` | `java-backend/**/ActionRbacRegistry.java` | ⚠️ **`ERP-SESSION-01`** | 🔴 **⛔ KHÔNG tự sửa** (đã `RELEASED`; họ vừa BUILD) ⇒ **gửi handoff kèm bản vá** |
| 2 | **Thêm dòng ma trận** «Quản trị dự án (tạo/sửa/xoá)» cho khoá `project_admin` | `lib/menu-helpers.ts` (+ `legacyWorkMenuKeys`? ⛔ không) | `SESSION_D` (đã từng sửa tệp này cho khoá `work` — ✅ **có tiền lệ + đã ghi phối hợp**) | ⚠️ kiểm lại chủ sở hữu trước khi sửa (`SESSION_REGISTRY`) |
| 3 | **Ghi danh mục** `project_admin` vào `module_catalog` | CSDL MySQL (+ bản đối SQLite `drizzle/0353`) | `SESSION_D` cho **SQL cấp danh mục**; ⚠️ **drizzle** ⇒ **BUILD/`S01`** (đổi vân tay gói) | ⚠️ §18: **không** tạo migration song song với phiên khác |
| 4 | **Test khoá lại + đo LIVE** | `tests/**` (của `SESSION_D`) + probe live | `SESSION_D` | ⭐ xem §4 |

## 3. ĐIỀU KIỆN AN TOÀN (⛔ không được bỏ)

1. ⛔ **KHÔNG** để 3 action rơi vào trạng thái **«mù quyền»** lần nữa (`P-08`/`BUG-D22`): sau khi gắn module, `probe-action-registry-coverage` **PHẢI exit 0** («MÙ QUYỀN: 0»).
2. ✅ **Cấp ban đầu**: chỉ **admin** (⛔ **0 tài khoản** khác được tick sẵn) ⇒ ⭐ **hành vi hiện tại ⛔ không đổi** cho tới khi admin chủ động tick ⇒ **an toàn go-live**.
3. ⚠️ **Giữ cổng cấp bậc (leadership) ⛔ không lọt**: đã ĐO live (vòng 99): `giamdoc.demo` + `delete_project` = **403** ✅ ⇒ sau khi đổi sang module, ⭐ **đo LẠI y hệt** để chắc ⛔ không nới cho `director`/`accountant`.
4. ⛔ **Không** dùng `A2` ⇒ ⛔ không đụng **42 tài khoản** / **8 đơn vị**.

## 4. KIỂM THỬ / NGHIỆM THU (bắt buộc trước khi gọi `VERIFIED`)

| Phép kiểm | Kỳ vọng |
|---|---|
| `probe-action-registry-coverage` | **exit 0** · «⛔ MÙ QUYỀN: **0**» · «THIẾU capability: 0» |
| `probe-catalog-drift` | **exit 0** (⚠️ nếu 3 tên này thành Java-only mới ⇒ **bổ sung danh sách trắng kèm điều kiện đã đo**) |
| `probe-action-parity` | **exit 0** (JS ↔ Java ⛔ không lệch) |
| **LIVE**: `giamdoc.demo` gọi `delete_project` / `update_project` | ⭐ **403** (⛔ vẫn bị chặn) |
| **LIVE**: tài khoản **chưa tick** gọi `create_project` | **403** |
| **LIVE**: tài khoản **đã tick** (`e2e.kh` hoặc tài khoản thử) gọi `create_project` | **200/400-nghiệp-vụ** (⛔ **không phải 403**) ⇒ ⭐ chứng minh **cấp được qua ma trận** |
| Ma trận UI | Dòng «Quản trị dự án» **hiện** cho admin tick · ⛔ không phá 4 dòng đã ẩn |
| Hồi quy | `tsc` 0 · test nhóm WORK/PROJECT xanh · ⛔ FAIL 0 |

## 5. ⚠️ RỦI RO & CÁCH ⛔ TRÁNH CONFLICT

| Rủi ro | Cách xử lý (theo luật §7/§18/§28) |
|---|---|
| Sửa `java-backend/**` (phiên 01) | ⛔ **KHÔNG tự sửa** ⇒ **HANDOFF kèm bản vá** để họ áp trong **lượt rebuild kế tiếp** |
| Sửa `lib/menu-helpers.ts` (nhiều phiên từng chạm) | ⭐ **ĐO chủ sở hữu trước** (`SESSION_REGISTRY` + mtime + marker) → **CLAIM** → sửa **nhỏ, 1 dòng** → test → **ghi phối hợp `SHARED_STATE`** |
| CSDL (`module_catalog` + cấp quyền) | ⚠️ **Chỉ INSERT 1 dòng danh mục** + **0 cấp quyền** cho ai ⇒ ⛔ không sửa hàng loạt · ⛔ không đụng `drizzle` (BUILD-owned) |
| Build/vân tay gói | ⛔ không tự build · 📤 báo `S01` (2 sửa FE đang chờ rebuild) |

## 6. THỨ TỰ THI HÀNH ĐỀ NGHỊ

1. `SESSION_D`: ghi `DECISION_LOG` (`Q1` ✅ ĐÓNG theo `A3`) + cập nhật `docs/61` §3.
2. `SESSION_D`: đo chủ sở hữu `lib/menu-helpers.ts` → CLAIM → thêm dòng `project_admin` (**1 dòng**) + test khoá.
3. `SESSION_D`: `INSERT` 1 dòng `project_admin` vào `module_catalog` (MySQL) + probe kiểm.
4. 📤 HANDOFF `S01`: bản vá `ActionRbacRegistry` (3 dòng) — **họ áp trong lượt rebuild cùng 2 sửa FE đang chờ**.
5. Sau rebuild: **đo LIVE 3 phép kiểm ở §4** ⇒ ⭐ mới chuyển `VERIFIED` + trả lời user.

---

## 7. ✅ ĐÃ THI HÀNH (08/10/2026 · `ERP-SESSION-04`) — 2/4 VIỆC + ⛔ **0 CẤP QUYỀN**

| # | Việc | Trạng thái đo được |
|---|---|---|
| 1 | Dòng ma trận `project_admin` «Quản trị dự án (tạo / sửa / xoá)» | ✅ `lib/menu-helpers.ts` (nhóm `my_work` — ⚠️ nhóm `du_an` **⛔ không tồn tại** trong danh mục nên ⛔ không dùng) |
| 2 | Dòng danh mục `module_catalog` | ✅ đã `INSERT` ⇒ tổng **78** khoá (trước **77**) |
| 3 | 2 bản đồ kiểu TS phải mở rộng (**⛔ thiếu là ĐỎ build** — tôi phát hiện qua `tsc` và sửa ngay) | ✅ `ModuleKey` (`lib/ui-shared.tsx:25`) + `titles` (`app/page.tsx:129`) |
| 4 | ⭐ **AN TOÀN**: cấp cho ai chưa? | ✅ **`0` tài khoản · `0` đơn vị** ⇒ **hành vi hiện tại ⛔ KHÔNG đổi** |

**Kiểm:** `tsc` **0 lỗi** · `t13` **17/17** · `t07` **8/8** · hồi quy **960 · 959 pass · FAIL 0** · `probe-catalog-drift` **exit 0** · `probe-action-registry-coverage` **exit 0** («MÙ QUYỀN: 0»).

## 8. 📤 BẢN VÁ SẴN SÀNG ÁP — GỬI `ERP-SESSION-01` (⛔ phiên 04 KHÔNG tự sửa `java-backend/**`)

**Tệp:** `java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java`

**Việc:** thêm **3 mục** vào registry, **theo ĐÚNG khuôn của mục `approve_work_item`** (đã có, dùng khoá `work` + `canApprove`) — chỉ đổi tên action / khoá module / capability:

| Action | Module | Capability | Ghi chú |
|---|---|---|---|
| `create_project` | `project_admin` | `canCreate` | ⛔ **BỎ** rơi vào nhánh cấp bậc ⇒ ⛔ hết `List.of()` |
| `update_project` | `project_admin` | `canEdit` | |
| `delete_project` | `project_admin` | `canEdit` | ⭐ dùng `canEdit` (xoá = quyền sửa) |

⚠️ **ĐIỀU KIỆN BẮT BUỘC khi áp** (⛔ không được bỏ, để ⛔ không lặp lớp lỗi `P-08`/`BUG-D22`):
1. ⛔ **KHÔNG** để action nào rơi vào «⛔ MÙ QUYỀN» ⇒ `probe-action-registry-coverage` **PHẢI exit 0** sau khi sửa.
2. ⭐ **Cấp ban đầu = 0** (⛔ không tick sẵn cho ai) ⇒ hành vi hiện tại ⛔ **KHÔNG đổi** cho tới khi admin tick trong ma trận.
3. ⚠️ `probe-catalog-drift`: nếu 3 tên này thành **Java-only MỚI** ⇒ ⭐ **bổ sung vào danh sách trắng `tools/probe-catalog-drift.mjs`** **kèm điều kiện đã đo** (① có `Map.entry` thật ② **0 lần** trong `scripts/system-route.mjs`) — ⚠️ **tệp này là của phiên 04**, cứ **báo** để tôi đồng bộ (đúng cách đã làm cho 6 tên của phiên 01).

**Sau khi áp + build, 3 phép kiểm LIVE (phiên 04 sẽ chạy):**
| Phép kiểm | Kỳ vọng |
|---|---|
| `giamdoc.demo` + `delete_project` / `update_project` (mã việc ⛔ không tồn tại) | ⭐ **403** (⛔ vẫn bị chặn — ⭐ đối chiếu với phép đo vòng 99) |
| tài khoản **CHƯA tick** + `create_project` | **403** |
| tài khoản **ĐÃ tick** + `create_project` | **400** (nghiệp vụ) — ⛔ **KHÔNG phải 403** ⇒ ⭐ chứng minh **cấp được qua ma trận** |

## 9. ⚠️ TRẠNG THÁI HIỆN TẠI (nói rõ để ⛔ không hiểu nhầm)

- Dòng ma trận **ĐÃ CÓ** trong mã + danh mục, ⚠️ nhưng **CHƯA có tác dụng cấp quyền** vì 3 action **vẫn admin-only** trên đường chạy hiện tại.
- ⇒ ⛔ **KHÔNG có trạng thái nửa vời gây hại**: ⭐ admin **thấy** dòng mới trong ma trận, nhưng **tick hay không ⛔ chưa ảnh hưởng gì** cho tới khi bản Java mới được build ⇒ ⭐ **an toàn**.
- ⚠️ Cần **BUILD lại** (cùng lượt với 2 sửa FE đang chờ: bật lại Bình luận + khoá `work` ở tab).

