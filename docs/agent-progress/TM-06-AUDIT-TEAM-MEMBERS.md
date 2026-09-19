# AUDIT `team_members` — PHASE 6 (`TM-06`)

- **Nguyên văn yêu cầu** (`docs/25_TODO_ROADMAP.md` dòng `TM-06`): «Audit `team_members` (hiện **0 dòng**) — xác định cách nạp dữ liệu».
- **Ngày đo:** 20/09/2026 · **CSDL:** MySQL 8.0.46 `vntech_erp` · **Người đo:** TASK-101 (PHASE 6).
- **Cổng sinh bằng chứng:** `tools/audit-team-members.mjs` → `docs/agent-progress/TM-06-TEAM-MEMBERS-AUDIT.csv` (25 dòng).
- **Hợp đồng kiểm lại:** `tests/tm06-team-members-audit.test.mjs`.

---

## 1. ⚠️ ĐÍNH CHÍNH TIỀN ĐỀ — roadmap ghi SAI

| Nguồn | Nội dung | Kết luận |
|---|---|---|
| `docs/25_TODO_ROADMAP.md` dòng `TM-06` | «hiện **0 dòng**» | ❌ **SAI** |
| `docs/agent-progress/TASK-073.md` · `TASK-070.md` · `TASK-071.md` | «`team_members` = **0 dòng** ⇒ không đo được trường» | ❌ **ĐÃ CŨ** (đúng ở thời điểm 17–18/09) |
| `docs/agent-progress/TASK-080.md` | bảng «Thành viên tổ đội: `team_members` **0 → 4**» | ✅ đúng, nhưng chỉ ghi phần **tăng thêm** |
| **CSDL THẬT (đo 20/09/2026)** | `SELECT COUNT(*) FROM team_members` = **6** · `WHERE active=1` = **5** · `WHERE active=1 AND left_at IS NULL` = **5** | ✅ **NGUỒN SỰ THẬT** |

> **ĐÍNH CHÍNH:** `team_members` hiện có **6 dòng**, trong đó **5 dòng `active=1`** — **KHÔNG phải 0 dòng**.
> Tiền đề của `TM-06` (và của `TASK-070/071/073`) đã lỗi thời kể từ lượt `TASK-080` (18/09/2026 01:00:36).
> Câu hỏi *"xác định cách nạp dữ liệu"* vì vậy **có câu trả lời đo được**, không còn là "chưa có dữ liệu để đo".

### 1.1 Bóc tách 6 dòng theo NGUỒN GỐC (không trộn)

| Nhóm | Số dòng | Tiền tố `id` | `created_at` | Nguồn THẬT |
|---|---|---|---|---|
| Thành viên THẬT | **4** | `TMB_T080_…` | `2026-09-18 01:00:36.122` | `tools/task080-seed-real-data.sql:75-83` (`INSERT … SELECT` từ `users` THẬT) |
| Tàn dư FIXTURE | **2** | `PRB073-A` · `PRB073-B` | `2026-01-01` · `2026-01-02` | `tools/probe-task073-team-members.mjs:80-82` (fixture của cổng TASK-073) |
| **Tổng** | **6** | | | **0 dòng do sản phẩm nạp** |

- 4 dòng `TMB_T080_` lấy `role_in_team` từ `role_catalog.name` (**Kỹ sư dự án** ×2 · **Thủ kho dự án** · **Chỉ huy trưởng**) — đúng 4 username `cha.ht` · `tkhodemo` · `engineer.demo` · `ksda.demo`.
- 2 dòng `PRB073-` là **tàn dư** của cổng TASK-073: `PRB073-B` trỏ tới `user_id = 'PRB073-NOUSER'` (**không tồn tại trong `users`**) để đo nhánh `LEFT JOIN`, và nhánh dọn `DELETE` của cổng đó chỉ chạy khi `inserted = true` trong `finally` — lượt chạy sau đã `exit(2)` sớm (bảng `teams` khi đó còn rỗng) nên **2 dòng ở lại**.
- ⚠️ Vì vậy **«5 active» KHÔNG đồng nghĩa «5 thành viên thật»**: đúng **4 thành viên thật + 1 fixture** (`PRB073-A` có `active=1`).

---

## 2. CÁCH NẠP DỮ LIỆU — KẾT LUẬN **CONFIRMED** (SQL ngoài sản phẩm)

Câu hỏi trọng tâm: *sản phẩm có đường GHI nào vào `team_members` không?* Đo trên **cả hai route** (JS + Java):

| Tầng | ĐỌC | GHI | Bằng chứng |
|---|---|---|---|
| `scripts/system-route.mjs` (bootstrap JS) | **KHÔNG** | **KHÔNG** | `grep` `team_members\|teamMembers` = **0** lần |
| `java-backend/…/BootstrapDataAdapter.java` | **CÓ** (1 tệp) | **KHÔNG** | dòng **1197–1210**: `data.put("teamMembers", query("SELECT tm.id,tm.team_id AS teamId,… FROM team_members tm LEFT JOIN users u ON u.id=tm.user_id LEFT JOIN role_catalog rc ON rc.code=u.role ORDER BY tm.team_id,tm.joined_at"))` |
| `java-backend/**/*.java` (toàn bộ) | 1 tệp | **0 tệp** | cổng audit đếm được: `java_write_files = 0` |
| Action nghiệp vụ (`action === "…team_member…"`) | — | **KHÔNG tồn tại** | 0 nhánh trong `system-route.mjs`, 0 `case` trong `SystemController.java` |

### 2.1 ⇒ Kết luận

**CONFIRMED.** Toàn bộ 6 dòng hiện có đến từ **SQL chạy ngoài sản phẩm**:

1. `tools/task080-seed-real-data.sql` (seed có kiểm soát của TASK-080) → **4 dòng**;
2. `tools/probe-task073-team-members.mjs` (fixture của cổng đo) → **2 dòng tàn dư**.

**KHÔNG có** bất kỳ luồng nào của sản phẩm (UI → `action` → route JS/Java) ghi được bảng này.

### 2.2 Mâu thuẫn đã phát hiện (ghi rõ, không giấu)

`java-backend/infrastructure/src/main/resources/db/migration/V14__project_membership_and_team_members.sql:47` khai:

> «Không seed dữ liệu giả: tổ đội hiện có chưa có thành viên, **sẽ bổ sung qua giao diện**.»

Nhưng **giao diện/đường ghi đó CHƯA BAO GIỜ ĐƯỢC XÂY** — không có action nào ở cả 2 route. ⇒ Mọi dòng
`team_members` trong CSDL hiện nay đều là **dữ liệu nạp tay**, không có đường nạp chính thức.

### 2.3 Nghĩa của `active` / `left_at`

| Cột | Kiểu THẬT | Nghĩa đang dùng trong mã | Ghi chú |
|---|---|---|---|
| `active` | `tinyint(1) NOT NULL DEFAULT 1` | `1 = đang trong tổ đội` · `0 = đã rời` | Màn Tổ đội lọc `Number(m.active ?? 1) === 1 && !m.leftAt` (`app/screens/TeamDirectory.tsx`) |
| `left_at` | `datetime(3) NULL` | mốc RỜI tổ đội | `NULL` = chưa rời |
| `joined_at` | `datetime(3) NOT NULL` | mốc THAM GIA | khoá `UNIQUE (team_id,user_id,joined_at)` ⇒ **một người có thể vào lại cùng tổ đội ở mốc mới** (lịch sử được giữ) |
| `role_in_team` | `varchar(255) NULL` | chức danh trong tổ đội | Dữ liệu thật lấy từ `role_catalog.name`, không phải chữ tự đặt |

**Bất biến cần giữ:** *"đã rời"* là `active = 0` **hoặc** `left_at IS NOT NULL` — không được chỉ kiểm một cột.

---

## 3. HỆ QUẢ ĐỐI VỚI STACK ĐANG PHỤC VỤ — «TỔ ĐỘI CÓ THỂ THIẾU DỮ LIỆU THÀNH VIÊN»

`teamMembers` là khoá **Java-only** (phát hiện đầu tiên ở `T-09`, ghi trong `TASK-099.md`):

- Cổng người dùng mở là **proxy `:9000` → Java `18081`** ⇒ **có** `teamMembers` ⇒ tab Nhân sự đọc được.
- Nếu chạy thuần Node (`:8787`) ⇒ **KHÔNG có** `teamMembers` ⇒ tab Nhân sự / cột Thành viên **không có nguồn**.
- Vì vậy màn Tổ đội (`app/screens/TeamDirectory.tsx`) **bắt buộc**:
  - khai `teamMembers?: Row[]` là **tuỳ chọn** (đã có ở `lib/ui-shared.tsx:199`);
  - đọc `data.teamMembers` → vắng ⇒ hiện **«chưa có nguồn»** kèm lý do, **KHÔNG hiện `0 người`** (số 0 đó là "không biết", không phải "không có ai");
  - thêm/sửa thành viên **không thể làm** trên UI (không có action) ⇒ **không dựng nút giả**.

---

## 4. CẦU NỐI VỚI `TM-01` / `TM-03` / `TM-06`

| Mục | Ảnh hưởng của audit này |
|---|---|
| `TM-01` cột «Thành viên» | Có `teamMembers` ⇒ số THẬT; vắng ⇒ «chưa có nguồn» + lý do Java-only |
| `TM-03` tab «Nhân sự» | `available = Array.isArray(data.teamMembers)` — không suy diễn sĩ số |
| `TM-06` | Chính báo cáo này; **không** cần bảng/cột mới, **không** migration |

---

## 5. ⛔ CẦN NGƯỜI DÙNG QUYẾT (3 câu)

1. **Có xây đường nạp thành viên tổ đội không?** Hiện `V14` hứa «bổ sung qua giao diện» nhưng không có action nào.
   Chọn: **(A)** bổ sung 1 action `save_team_member` (JS + Java, ~migration 0 vì bảng đã có) — **ngoài phạm vi PHASE 6**
   vì phải sửa `scripts/**` (bị CẤM); **(B)** giữ chỉ-đọc và chấp nhận nạp bằng SQL; **(C)** hoãn.
   *Mặc định tôi giữ nguyên hiện trạng (B) và ghi rõ đây là **khuyết điểm đã biết**, không phải tính năng.*
2. **Xử lý 2 dòng tàn dư `PRB073-A` / `PRB073-B`?** Chúng là rác đo lường của TASK-073 (`PRB073-B` trỏ tới
   `user_id` không tồn tại ⇒ dòng **mồ côi**). Chọn: **(A)** xoá 2 dòng rác (1 câu `DELETE`, cần anh cho phép vì
   là sửa DỮ LIỆU); **(B)** giữ nguyên và coi là fixture có chủ đích; **(C)** đổi `active=0` để không tính vào sĩ số.
   *Mặc định tôi KHÔNG tự xoá dữ liệu.*
3. **`teamMembers` có nên có trên đường Node (`:8787`)?** Nếu cần dùng độc lập JS thì phải bổ sung SELECT vào
   `scripts/system-route.mjs` — **bị CẤM trong đợt này**. Chọn: **(A)** mở phạm vi cho `scripts/**` ở đợt sau;
   **(B)** chấp nhận Java-only (hiện trạng).

---

## 6. ĐỐI CHỨNG ÂM (chứng minh báo cáo này CÓ THỂ SAI ĐƯỢC)

`tests/tm06-team-members-audit.test.mjs` chạy hàm kết luận trên 3 tình huống giả lập và **bắt buộc** kết quả phải đổi:

| Tình huống giả lập | Kết luận mong đợi | Ý nghĩa |
|---|---|---|
| Thêm `INSERT INTO team_members` vào route | `UNKNOWN` | Nếu sản phẩm **có** đường ghi thì "SQL ngoài sản phẩm" SAI |
| Java có 1 tệp ghi `team_members` | `UNKNOWN` | Idem, ở tầng Java |
| Bảng **0 dòng** (tiền đề CŨ của roadmap) | `UNKNOWN` | Không thể kết luận "cách nạp" khi chưa từng có dòng nào |
| **Hiện trạng** (6 dòng, 0 đường ghi) | `CONFIRMED` | Đúng phép đo ở §1–§2 |

---

## 7. GIỚI HẠN CỦA BÁO CÁO

- Số đo là **ảnh chụp 20/09/2026**; `team_members` là bảng **không có đường ghi trong sản phẩm** nên số dòng
  chỉ đổi khi có người chạy SQL tay.
- Phép đo **không** kết luận được *ai* đã chạy `tools/task080-seed-real-data.sql` (không có audit trail cho
  thao tác ngoài sản phẩm — chính `audit_logs` **không có** bản ghi `entity_type='team'`, đã đối chiếu).
- `active` là `tinyint(1)`; JDBC có thể trả `boolean` (lớp lỗi `TASK-052`) ⇒ mã UI đã đọc bằng `Number(m.active ?? 1) === 1`,
  không so `=== true`.
