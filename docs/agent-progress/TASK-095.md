# TASK-095 — PHASE 4 (`PR-01`): "DANH SÁCH DỰ ÁN" THÀNH TAB RIÊNG + TOOLBAR CÂN ĐỐI

- **Mã:** TASK-095 · **Ngày:** 20/09/2026 · **Roadmap:** `PR-01` (`docs/25_TODO_ROADMAP.md` §PHASE 4 — QUẢN LÝ DỰ ÁN)
- **Nguồn yêu cầu:** `docs/24_SYSTEM_AUDIT_REPORT.md` §15 mục 8 — *"Danh sách dự án + Ban chỉ huy dự án chưa tách tab"*; roadmap `PR-01` (UI=`NEW`, DB=`-`, API=`-`, QUYỀN=`CHECK`, phụ thuộc `U-03` **đã DONE / AP-DUNG 10**).
- **Trạng thái:** **`DOING / CODE-XONG — CHỜ BUILD ĐỂ ĐO RUNTIME`** ⚠️ **CHƯA đóng `PR-01`** (lý do ở §5).
- **Tệp đặc tả chi tiết:** `docs/agent-progress/PR01-TAB-SPEC.md` (trace 7 lớp + bằng chứng thật).

## 1. Vì sao chọn `PR-01` làm mục đầu tiên của PHASE 4

6 mục `PR-` của PHASE 4 (đọc nguyên văn `docs/25` dòng 138–143):

| ID | Việc | Ưu tiên | Phụ thuộc | Chặn? |
|---|---|---|---|---|
| `PR-01` | Danh sách dự án thành tab riêng + toolbar cân đối | P2 | `U-03` | **KHÔNG** — `U-03` đã `DONE / AP-DUNG 10` |
| `PR-02` | Lọc: Trạng thái · Quản lý dự án · Phòng ban · Ngày | P2 | `PR-01` | **BỊ CHẶN** bởi `PR-01` |
| `PR-03` | Chi tiết dự án thành tab/modal: chung · nhân sự · tổ đội · kho · **lịch sử** | P2 | `U-01` | KHÔNG (nhưng xếp sau theo ID; thiếu tab "lịch sử") |
| `PR-04` | Bấm Project/User/Warehouse/Team → mở `EntityDetailModal` | P2 | `U-01` | KHÔNG (xếp sau) |
| `PR-05` | **Ban chỉ huy dự án** thành tab riêng (§14) | P2 | `PR-01` | **BỊ CHẶN** bởi `PR-01` |
| `PR-06` | BCH: thêm/sửa/xoá theo quyền + link entity mở modal | P2 | `PR-05` | **BỊ CHẶN** bởi `PR-05` |

⇒ Mục **đầu tiên không bị chặn** = **`PR-01`** (và nó còn **mở khoá `PR-02` + `PR-05` → `PR-06`**).
`U-01` (`EntityDetailModal`) **đã DONE / AP-DUNG 1** ⇒ `PR-03`/`PR-04` cũng không bị chặn, nhưng theo thứ tự ID thì `PR-01` làm trước.

## 2. Phát hiện quan trọng khi trace (`docs/24 §15` mục 8 đã CŨ một phần)

- Tab **"Ban chỉ huy"** trong chi tiết dự án **ĐÃ TỒN TẠI** (`app/page.tsx` `tab === 4` → `SiteCommandScreen`), và **`tools/probe-project-screen.mjs` đang đòi đúng 5 tab** — nên phần *"Ban chỉ huy dự án chưa tách tab"* của audit **không còn đúng ở bản hiện tại** ⇒ `PR-05` cần rà lại trước khi làm (phạm vi thật có thể hẹp hơn câu chữ).
- Cái **THẬT SỰ** còn thiếu cho `PR-01`: danh sách là một **CHẾ ĐỘ XEM** (`view: "list" | "detail"`), không phải **TAB**; ở màn danh sách **không có dải tab nào**; và nhóm **HÀNH ĐỘNG** của toolbar danh sách **TRỐNG** (toolbar chỉ có tiêu đề + tìm/lọc/sắp xếp ⇒ đúng mô tả *"mất cân đối"* của `docs/24 §15` mục 1).
- `projects` **KHÔNG có cột tiến độ** trong MySQL ⇒ màn `ProjectProgress` đọc `progressPlan/actualProgress/progress` **luôn ra 0** (đây là **UNKNOWN nghiệp vụ của `R-04`/`PR-03`**, không thuộc phạm vi `PR-01` — ghi lại để không tự chọn nguồn % tiến độ).

## 3. Việc đã làm (chỉ 2 tệp mã nguồn + 1 tệp kiểm thử + 1 cổng)

- `app/page.tsx` — **chỉ trong `ProjectManagement`** + **1 dòng call-site** (`:441` truyền `permission={activePermission}`):
  1. một nguồn nhãn tab: `LIST_TAB` · `DETAIL_TABS` · `TAB_LABELS`;
  2. bỏ state `view` ⇒ `view` **suy ra** từ tab; dải tab dùng chung render ở **cả** danh sách và chi tiết;
  3. chỉ số tab chi tiết dịch **1..5**; nút "Chi tiết ›" mở tab 1; "← Quay lại danh sách" và nhánh `!detail` về tab 0;
  4. toolbar danh sách theo khuôn §5: `count`/`total`/`unit` (trái) ‖ `search` + `filters` + `sort` + `actions` (phải), thêm nút **`⇩ XUẤT`** (CSV của đúng danh sách đang lọc);
  5. `QUYỀN=CHECK`: nút XUẤT `disabled={!canExport}`; tab chi tiết `disabled` khi chưa chọn dự án.
- `tests/pr01-project-tabs.test.mjs` (mới) — hợp đồng nguồn, **7 ca**; **ĐỎ 7/7 trước khi sửa → XANH 7/7 sau khi sửa**. Cố ý **không** thêm vào `package.json` để `test:regression` giữ nguyên **61** ca.
- `tools/probe-project-screen.mjs` — cập nhật hợp đồng mới: **6 tab** (tab 0 = `Danh sách dự án`), vòng bấm tab chi tiết dùng chỉ số **1..5**, thêm 3 kiểm mới (quay về danh sách **bằng chính tab 0**; dải tab còn 6 mục ở màn danh sách; toolbar có số lượng + tìm + hành động).

**KHÔNG đổi:** DB · migration · action/API · workflow · `app/globals.css` · dữ liệu.

## 4. Kết quả cổng tĩnh

| Cổng | Kết quả |
|---|---|
| `node --test tests/pr01-project-tabs.test.mjs` | **7/7 PASS** (đỏ trước khi sửa) |
| `npx tsc --noEmit` | **exit 0** |
| `npm test` | **61/61 PASS** + `test:workflow` **ĐẠT**<br>⚠️ Xem §8: lúc chốt hồ sơ, `npm test` bị đỏ bởi **1 tệp chưa được commit của nhánh PHASE 3** (không phải tệp của task này) |
| `tools/probe-project-screen.mjs` | **5 mục KHÔNG ĐẠT** trên bản build đang phục vụ ⇒ bằng chứng bundle cũ hơn nguồn (§5) |

## 5. ⚠️ VÌ SAO CHƯA ĐÓNG `PR-01` (giới hạn đo được — §45)

Ứng dụng `:8787` + proxy `:9000` **đang phục vụ bản build cũ**. Đo DOM lúc chạy (20/09/2026) cho thấy dải tab trả về **5 mục** `["Tổng quan","Nhân sự","Tổ đội","Kho","Ban chỉ huy"]`, `list-toolbar-count = 0`, **không có nút XUẤT** ⇒ **bản build chưa chứa thay đổi này**. `npm run build` **không thuộc quyền của nhánh PHASE 4** (quy ước: build do captain làm tuần tự).

**Việc còn lại để đóng `PR-01`:**
1. captain **build lại**;
2. chạy lại `tools/probe-project-screen.mjs` — **kỳ vọng ĐẠT** (6 tab + tab 0 quay về danh sách + toolbar có hành động);
3. chạy `tools/probe-visual-regression.mjs` — **ảnh `02-project` SẼ LỆCH CÓ CHỦ Ý** (màn danh sách nay có thêm dải tab); nếu lệch đúng ở `02-project` thì cập nhật ảnh chuẩn kèm lý do;
4. sau đó mới đổi cột `TT` của `PR-01` từ `DOING` → `DONE` trong `docs/25_TODO_ROADMAP.md` (nguồn sự thật của cổng tiến độ).

## 6. UNKNOWN / cần người dùng quyết

1. **Ngữ nghĩa "thành tab riêng"** — nhãn **LIKELY**, không phải CONFIRMED: tài liệu duy nhất là `docs/24 §15` mục 8 + tiền lệ `P-01` (*"tách MR·PR·PO thành 3 tab riêng"* = dải tab **trong màn**). **Không** có tài liệu nào nói "Danh sách dự án phải là một **module menu** riêng" (hướng đó còn cần ghi `module_catalog` ⇒ trái với DB=`-` của roadmap). Nếu người dùng muốn **menu riêng** thay vì tab, đây là **quyết định đổi hướng** — báo trước khi build.
2. **Nguồn % TIẾN ĐỘ dự án** (thuộc `PR-03`/`R-04`, ghi lại để không tự chọn): `projects` **không có cột tiến độ**; UI đang suy từ `progressPlan`/`actualProgress`/`progress` (đều rỗng) ⇒ luôn 0. Cần người dùng chốt tiến độ lấy từ **BOQ/sản lượng/nhật ký thi công** hay **nhập tay** — **KHÔNG tự chọn**.
3. **`PR-05`**: audit nói "BCH chưa tách tab" nhưng **tab đã có** ⇒ cần chốt phạm vi thật của `PR-05` trước khi làm.

## 7. Ghi chú hồ sơ

- Tệp hồ sơ này là **TASK-095** (không phải TASK-094): `TASK-094.md` là **hồ sơ workflow phê duyệt động** đang **mở** (263 KB, `KHUNG-XONG / CHO-CHOT-NGHIEP-VU`, được `MASTER_STATUS` trỏ tới) ⇒ **không được ghi đè**. Mục **70** của `TASK-094.md` đã được ghi thêm đúng theo yêu cầu (nhật ký tích hợp của captain).

## 8. ⚠️ Phát hiện lúc chốt: `npm test` bị đỏ bởi TỆP CỦA NHÁNH KHÁC (không phải của task này)

Lúc 20/09 chạy lại toàn bộ `npm test`, bước `lint` **ĐỎ 2 lỗi**:

```
tests/work-item-comment-participant.test.ts
   73:5  error  'projectCodeHasUser' is never reassigned. Use 'const' instead  prefer-const
  176:5  error  'data' is never reassigned. Use 'const' instead                prefer-const
```

- Tệp đó là **tệp chưa commit của nhánh PHASE 3** (`git status` = `?? tests/work-item-comment-participant.test.ts`) — có trong ghi chú §69 của `TASK-094.md`.
- **KHÔNG sửa** tệp này: không thuộc phân vùng PHASE 4, và sửa vào tệp nhánh khác đang viết sẽ gây tranh chấp hợp nhất.
- **Bằng chứng tách bạch (đã chạy):** `npx eslint app/page.tsx tests/pr01-project-tabs.test.mjs tools/probe-project-screen.mjs tools/probe-roadmap-progress.mjs` → **0 error** (102 cảnh báo có sẵn trong `page.tsx`), **exit 0**; và `npm run typecheck` **exit 0** · `npm run test:regression` **61/61** · `npm run test:workflow` **ĐẠT** ⇒ cổng của `PR-01` sạch.
