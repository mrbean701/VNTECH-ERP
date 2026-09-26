# TASK-124 — `W-03`: «Khi tạo dự án: hỏi *"Tạo kho dự án?"* → **Có** thì tạo kho»

- **Ngày**: 21/09/2026 · **Nhánh**: `unity-p2-full-20260920`
- **Trạng thái**: **DONE** — **GỠ BLOCKED** (người dùng đã cho phép sửa `scripts/system-route.mjs`)
- **Phạm vi đã sửa**:
  - `scripts/system-route.mjs` (action `create_project` — thêm cờ + bọc câu INSERT kho)
  - `app/page.tsx` (`ProjectModal` — bỏ chặn, truyền cờ, bỏ `required` 2 ô kho khi chọn «Không»)
  - `tests/w03-project-warehouse-flag.test.mjs` (**MỚI** — hợp đồng 5 ca)
  - `docs/25_TODO_ROADMAP.md` (ô TT của `W-03`) · `docs/agent-progress/MASTER_STATUS.md` (2 ô số) · tệp hồ sơ này
- **Commit**: `7e93543` (máy chủ) · `bb5ac0e` (giao diện + test hợp đồng) · `972b070` (ô TT + MASTER_STATUS)

## 1. Yêu cầu (NGUYÊN VĂN) + hiện trạng trước khi làm

> `W-03` | Dự án | Khi tạo dự án: hỏi *"Tạo kho dự án?"* → Có thì tạo kho

| Hạng mục | Trước khi làm | Sau khi làm |
|---|---|---|
| Câu hỏi Có/Không trên UI | ✅ ĐÃ CÓ | ✅ giữ nguyên (nhánh «Không» nay **thi hành được**) |
| Nhánh «Có» | ✅ chạy đúng | ✅ không đổi |
| Nhánh «Không» | 🔴 **KHÔNG chạy được** — `create_project` **LUÔN** `INSERT` kho, **không đọc cờ nào**; không có action xoá/ngưng kho ⇒ UI **chặn có giải thích** + khoá nút lưu ⇒ mục bị đánh **BLOCKED** | ✅ chạy được: chọn «Không» ⇒ dự án tạo ra **KHÔNG có kho công trường** |
| Mặc định cho call site cũ | (không có cờ) | ✅ **VẪN TẠO KHO** (cờ vắng ⇒ `createWarehouse = true`) — tương thích ngược tuyệt đối |

## 2. Máy chủ — `scripts/system-route.mjs`, action `create_project`

**TRƯỚC** (một `env.DB.batch([...])` cố định 3 câu, câu INSERT kho **không có điều kiện**):

```js
await env.DB.batch([
    env.DB.prepare(`INSERT INTO projects (...) ...`).bind(...),
    env.DB.prepare(`INSERT INTO warehouses (...) ...`).bind(warehouseId, ...),   // ← LUÔN chạy
    env.DB.prepare(`INSERT OR IGNORE INTO user_project_scopes (...) ...`).bind(...),
]);
await audit(user.id, "CREATE", "project", projectId, null, { code, name, warehouseCode, warehouseName }, request);
return { message: `Đã tạo dự án ${code} và kho công trường riêng.` };
```

**SAU** (`scripts/system-route.mjs:2499-2515` — đọc cờ rồi bọc câu INSERT kho):

```js
const rawCreateWarehouse = payload.createWarehouse;                                 // :2502
const createWarehouse = rawCreateWarehouse === undefined || ... ? true             // :2503-2505
    : ![false, 0, "0", "false", "no"].includes(<chuỗi đã trim+lower>);             //         ⇒ MẶC ĐỊNH true
const statements = [ env.DB.prepare(`INSERT INTO projects ...`).bind(...) ];
if (createWarehouse !== false) {                                                   // :2509
    statements.push(env.DB.prepare(`INSERT INTO warehouses ...`).bind(warehouseId, ...));
}
statements.push(env.DB.prepare(`INSERT OR IGNORE INTO user_project_scopes ...`).bind(...));
await env.DB.batch(statements);
await audit(user.id, "CREATE", "project", projectId, null, { code, name, warehouseCode, warehouseName, createWarehouse }, request);
return { message: createWarehouse !== false ? `... và kho công trường riêng.` : `... (không tạo kho công trường theo lựa chọn «Không»).` };
```

- **Bao nhiêu dòng**: commit `7e93543` = **+16 / −6** trong **duy nhất** `scripts/system-route.mjs` (không sửa gì khác).
- **Tương thích ngược**: cờ **vắng/`undefined`/`null`/`""`/`true`/`"yes"`** ⇒ `createWarehouse = true` ⇒ **VẪN tạo kho như trước**;
  chỉ `false` / `0` / `"0"` / `"false"` / `"no"` (đã trim + lower) mới bỏ kho.
- Cả 3 câu ghi **vẫn nằm trong MỘT `env.DB.batch`** ⇒ vẫn nguyên tử; dự án **luôn** được tạo kể cả khi bỏ kho.
- **Không** thêm action/API mới, **không** thêm `DELETE`/`DROP`/`TRUNCATE`/`ALTER`, **không** thêm khoá `module_catalog`.

## 3. Giao diện — `app/page.tsx` (`ProjectModal`)

| Việc | Dòng | Nội dung |
|---|---|---|
| Bỏ chặn | `:2461-2462` | `warehouseBlocked` **đã xoá hẳn**; thay bằng `const skipWarehouse = !editing && createWarehouse === "no";` |
| **Truyền cờ** | `:2468` | `const body = editing ? {...payload, projectId: row?.id} : { ...payload, projectId: row?.id, createWarehouse: createWarehouse === "yes" };` — đặt **SAU** `...payload` để **thắng** chuỗi `"yes"/"no"` của ô radio trong `FormData` |
| Bỏ khoá nút lưu | `:2496` | `disabled={warehouseBlocked}` **đã xoá**; nhãn nút rẽ theo `skipWarehouse`: «Tạo dự án (không kèm kho) →» |
| Khối cảnh báo đỏ BLOCKED | `:2480` | thay bằng khối thông tin `data-project-warehouse-skipped="true"` nói **RÕ hệ quả** (không tạo kho + có thể bổ sung sau) |
| 2 ô Mã/Tên kho | `:2488-2489` | `required={!skipWarehouse} disabled={skipWarehouse}` — chọn «Không» thì **không bắt buộc** và **không gửi** `warehouseCode`/`warehouseName` |
| Ô radio «Không» | `:2476` | bỏ chữ «CHƯA THI HÀNH ĐƯỢC»; ghi «Dự án tạo ra KHÔNG có kho công trường» |

Vẫn đi qua **ĐÚNG 2 action thật** (`create_project` khi tạo mới / `update_project` khi sửa) — **không** gọi API mới (`fetch(` = 0 lần).

## 4. Hợp đồng chạy được `tests/w03-project-warehouse-flag.test.mjs` (MỚI, 5 ca) — ĐỎ → XANH

| Ca | Nội dung | ĐỎ (route = `8613982`, trước khi sửa) | XANH (route = `HEAD`) |
|---|---|---|---|
| (1) | `create_project` ĐỌC cờ + BỌC câu INSERT kho trong `if (createWarehouse !== false)`; dự án/scope **ngoài** điều kiện; đúng 1 câu INSERT kho; vẫn 1 `batch` | ✖ | ✔ |
| (2) | **MẶC ĐỊNH = TẠO KHO** — trích **nguyên văn** biểu thức đọc cờ từ mã nguồn rồi **chạy thật** với 13 payload (vắng/`undefined`/`null`/`""`/`true`/`"yes"`/`"YES"` ⇒ `true`; `false`/`"false"`/`"no"`/`" NO "`/`0`/`"0"` ⇒ `false`) | ✖ | ✔ |
| (3) | Giao diện TRUYỀN cờ (`createWarehouse: createWarehouse === "yes"`), đã **bỏ chặn** (`warehouseBlocked`/`data-project-warehouse-blocked` = 0 lần), 2 ô kho `required={!skipWarehouse}` + `disabled={skipWarehouse}` | ✔ | ✔ |
| (4) | ĐỐI CHỨNG ÂM: **0** câu `DELETE`/`DROP`/`TRUNCATE`/`ALTER` trong nhánh; đúng **3** câu ghi | ✔ | ✔ |
| (5) | ĐỐI CHỨNG ÂM: **không** thêm khoá `module_catalog` (`MODULE_KEYS` = **61** như baseline; 3 khoá chứa `warehouse` giữ nguyên) | ✔ | ✔ |
| | **TỔNG** | **3/5 (2 ĐỎ)** | **5/5 XANH** |

Lệnh dựng lại bằng chứng ĐỎ (chạy được, không cần sửa mã):

```bash
git checkout 8613982 -- scripts/system-route.mjs
node --test tests/w03-project-warehouse-flag.test.mjs   # → pass 3 · fail 2
git checkout HEAD -- scripts/system-route.mjs
node --test tests/w03-project-warehouse-flag.test.mjs   # → pass 5 · fail 0
```

## 5. CHỨNG MINH HÀNH VI THẬT — chạy THẬT, kết quả **quan trọng**

Kịch bản thật (Edge headless + CDP + `fetch` **trong trang** tới `/api/system`, đúng cách các probe của dự án đang làm;
script chạy **ngoài repo**: `C:\Users\PC\AppData\Local\Temp\w03-live-proof-browser.mjs`):

```
login HTTP 200 ok=true
A POST HTTP 200 · Đã tạo dự án W03TMP-A và kho công trường riêng.     ← {createWarehouse:false}
B POST HTTP 200 · Đã tạo dự án W03TMP-B và kho công trường riêng.     ← KHÔNG truyền cờ
```

Đọc **MySQL THẬT** (chỉ đọc, `mysql.exe -uvntech -pvntech vntech_erp`):

```
TONG_KHO   6        TONG_DU_AN  4
KHO_TEST   KHO-W03A  PRJ_51436b1f-…  site 1     ← cờ false NHƯNG kho VẪN được tạo
KHO_TEST   KHO-W03B  PRJ_348f68a2-…  site 1
DU_AN_TEST W03TMP-A  W03 TMP A ? createWarehouse:false    active
DU_AN_TEST W03TMP-B  W03 TMP B ? KHONG truyen co (mac dinh) active
```

⇒ **Kết luận trung thực: dịch vụ JS đang PHỤC VỤ (cổng `9000`/`8787`) đang chạy MÃ CŨ** — bằng chứng kép:
(1) thông điệp trả về của ca cờ `false` là câu **CŨ** («…và kho công trường riêng.»), không phải câu mới rẽ theo cờ;
(2) **`KHO-W03A` vẫn được tạo dù đã gửi `createWarehouse:false`** ⇒ đúng **lỗi cũ** mà `W-03` sửa, và đúng là mã mới **chưa nạp**.
⇒ Muốn đo được hành vi MỚI ở mức runtime thì phải **dựng lại gói + khởi động lại dịch vụ JS** — việc này thuộc quyền
**captain** (đề bài cấm tôi build/start/stop dịch vụ) ⇒ **tôi DỪNG đúng ràng buộc, không tự làm**.
⚠️ Ca `bootstrap` trả **HTTP 400** nên **không** đọc được số đếm `warehouses` từ payload — số ở trên lấy trực tiếp từ MySQL.

### 5.1 Dữ liệu test ĐÃ TẠO (phải nêu rõ) + **câu SQL dọn ĐỀ XUẤT** (KHÔNG tự chạy)

Đã tạo: 2 dự án `W03TMP-A`, `W03TMP-B` + 2 kho `KHO-W03A`, `KHO-W03B` + 2 dòng `user_project_scopes`
(tổng hiện tại: `projects` = 4 · `warehouses` = 6 ⇒ phần tăng là của lượt chứng minh này).

```sql
-- DỌN DỮ LIỆU TEST W-03 (CHỈ ĐỀ XUẤT — chờ user/captain chạy)
DELETE FROM user_project_scopes WHERE project_id IN (SELECT id FROM projects WHERE code IN ('W03TMP-A','W03TMP-B'));
DELETE FROM warehouses WHERE code IN ('KHO-W03A','KHO-W03B');
DELETE FROM projects   WHERE code IN ('W03TMP-A','W03TMP-B');
-- (tuỳ chọn) dọn nhật ký kiểm toán của lượt test: hành động CREATE trên 2 dòng project nói trên
```

## 6. Các cổng (chạy & dán)

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit --incremental false` | **exit 0** ✅ |
| `npm run lint` | **0 error** (188 warning = nền) ✅ |
| `npm run test:regression` | **69/69 · 0 fail** ✅ |
| `npm run test:workflow` | **ĐẠT** (`Workflow VNTECH ERP V5.3.0 FULL W2 passed`) ✅ |
| `node --test tests/w03-project-warehouse-flag.test.mjs` (mới) | **5/5 ĐẠT** (ĐỎ 3/5 trước khi sửa) ✅ |
| `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** ✅ |
| `node tools/probe-project-screen.mjs` | **ĐẠT ✅** (6 tab · toolbar cân đối) |
| `node tools/probe-p2-ui-dom.mjs` | **ĐẠT ✅ — 5/5 dấu** trên bundle đang phục vụ |

## 7. Tiến độ lộ trình (`node tools/probe-roadmap-progress.mjs`)

| | DONE | BLOCKED | TODO | PHASE 5 |
|---|---|---|---|---|
| **TRƯỚC** (roadmap `380ee64`) | 107 / 110 (97,3 %) | 2 | 1 | 3/4 |
| **SAU** (roadmap `HEAD`) | **108 / 110 (98,2 %)** | **1** | 1 | **4/4** |

- `docs/25_TODO_ROADMAP.md` ô TT `W-03` = **`**DONE**`** (nguyên văn, giữ đúng 12 ô; lý do ở cột «Việc» index 8).
- `docs/agent-progress/MASTER_STATUS.md`: **DONE 108** · **BỊ CHẶN 1** (`= F-01`) · **TODO 1** ⇒ 108+1+1 = **110** ✅ · PHASE 5 = **4/4** ✅.

## 8. Việc còn lại / rủi ro (cần captain hoặc user quyết)

1. **Dịch vụ JS đang chạy mã CŨ** (mục 5) ⇒ hành vi MỚI chưa quan sát được ở runtime. Cần **build lại gói + khởi động lại**
   dịch vụ (quyền captain) rồi chạy lại `w03-live-proof-browser.mjs` — khi đó kỳ vọng: `createWarehouse:false` ⇒ **kho tăng 0**,
   cờ vắng ⇒ **kho tăng 1**.
2. **Dữ liệu test** ở mục 5.1 — chờ user/captain chạy câu SQL dọn (tôi **không** tự xoá theo ràng buộc).
3. **Tệp test CŨ `tests/w03-project-warehouse.test.mjs`** (hồ sơ trạng thái BLOCKED của TASK-100) **mâu thuẫn với mã mới**:
   **chạy hiện tại = 2 ĐẠT / 3 HỎNG** — ca (1) khẳng định «3 câu ghi phải nằm trong MỘT `env.DB.batch([`» (nay là
   `batch(statements)`), ca (3) khẳng định «nhánh Không BỊ CHẶN» (`warehouseBlocked` + `data-project-warehouse-blocked`),
   ca (4) khẳng định «`create_project` KHÔNG đọc cờ» — chính chú thích của nó
   (`:98-99`) ghi *«Nếu `create_project` BẮT ĐẦU đọc cờ bỏ kho thì … phải gỡ cảnh báo BLOCKED và cập nhật tài liệu»*.
   Tệp này **cố ý không nằm trong `package.json`** (`:19`) nên **không** ảnh hưởng `test:regression` 69/69;
   theo ràng buộc phạm vi của lượt này (**chỉ được tạo test MỚI**) tôi **KHÔNG** sửa tệp cũ ⇒ đề nghị captain quyết:
   **thay thế** tệp cũ bằng `tests/w03-project-warehouse-flag.test.mjs` (hoặc cập nhật 2 ca (3)/(4)).
4. `MASTER_STATUS.md` dòng PHASE 5 — phần **văn xuôi** trong cột «Ghi chú» vẫn còn câu cũ `**W-03` BLOCKED** (…)
   (ô **số** đã đúng **4/4**). Lượt này chỉ được phép sửa **ô số** nên tôi để nguyên ⇒ đề nghị captain cập nhật câu đó.

## 9. Bài học

- **Cổng hợp đồng phải chạy được, không chỉ đọc chuỗi**: ca (2) **trích nguyên văn** biểu thức đọc cờ từ mã nguồn rồi
  **thực thi** với 13 payload ⇒ bắt được cả các dạng chuỗi `"no"`/`"0"` mà UI/`FormData` có thể gửi.
- **Đo runtime phải kiểm cả "mã đang phục vụ"**: cùng một repo mà mã đã commit vẫn có thể **chưa được nạp**;
  thông điệp trả về + hàng trong CSDL là hai chứng cứ độc lập để phát hiện điều đó (đã bắt được ở đây).
- **Không im lặng**: chọn «Không» mà hệ thống vẫn tạo kho là lỗi im lặng — bản này chặn hẳn bằng cờ boolean truyền thật.
