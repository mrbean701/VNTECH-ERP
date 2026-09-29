// USER 28/09/2026 — TẠO LẠI ĐỦ BỘ HỒ SƠ §15 (goal yêu cầu 4 tệp).
// ⚠️ `CURRENT_TASK.md` + 11 tệp `TASK-MT3-*.md` là file CHƯA COMMIT của phiên MT3 trước
//    ⇒ đã bị `git reset --hard 4d1c129` XOÁ lúc rollback ⇒ phải tạo lại từ số đo thật.
import { writeFileSync, existsSync, readFileSync } from "node:fs";

const DIR = "docs/agent-progress/";
const STAMP = "28/09/2026";

// ── 1. CURRENT_TASK.md ───────────────────────────────────────────────────────
const CURRENT = `# CURRENT TASK — VNTECH ERP V5.3.0 (MASTER BASELINE R1.1.1)

> ⚠️ Tệp này được TẠO LẠI ngày ${STAMP}. Bản trước (788 dòng) là file **chưa commit** của phiên
> MASTER TASK 3 trước đó ⇒ đã bị \`git reset --hard 4d1c129\` xoá lúc rollback. Nội dung bên dưới
> viết lại từ **số đo thật** chứ không phải từ trí nhớ.

## TRẠNG THÁI HIỆN TẠI
| Mục | Giá trị |
|---|---|
| Commit | \`4d1c129\` · 2026-09-26 · «[MT2] Chốt MASTER TASK 2 — 79/81 = 97,5 %» |
| Nhánh | \`unity-p2-full-20260920\` |
| Build | **\`VNTECH-FP-671794A688DA1F77\`** · BUILT ARTIFACT VALIDATION **ĐẠT** |
| Migration head | \`0224_phase_gd_mt2_ui_duoi_phe_duyet_ngang_o_che_o\` (0 Flyway migration mới ⇒ DB không lệch) |
| Service | \`:18081\` Java · \`:8787\` UI · \`:9000\` proxy — **đều chạy** |
| Tunnel | https://riding-witnesses-spas-teaches.trycloudflare.com (HTTP 200) |

## CỔNG KIỂM (đo ngày ${STAMP})
| Cổng | Kết quả |
|---|---|
| \`npx tsc --noEmit\` | **EXIT=0** |
| \`node --import tsx --test tests/*.test.mjs\` | **579 test · 578 pass · 0 fail · 1 skip** |
| \`npm run test:regression\` | **69/69 · 0 fail** |
| \`npm run verify:css-baseline\` | **ĐẠT** · 2680 dòng · 0 lớp chết · 0 biến chết · dynamic contracts PASS |

## VIỆC ĐÃ LÀM NGÀY ${STAMP} (tất cả đều ĐO THẬT trên Edge headless 1605×761)
### ① ROLLBACK về MT2 (theo yêu cầu user)
- Sao lưu trước khi xoá: \`backup/mt3-head-20260928\` (= 7fdf71d) · \`backup/mt3-worktree-20260928\` (= 73ff69d) · tag \`backup-mt3-worktree-20260928\`
- \`git reset --hard 4d1c129\` · bỏ 6 commit · quy mô 220 file · 9554 dòng thêm
- **Bắt buộc build lại cả 2 vùng** (\`dist/\` + \`web/target/*.jar\` KHÔNG nằm trong git) + \`node tools/set-local-identity.mjs\`

### ② RÚT GỌN DẢI «QUY TRÌNH PHÊ DUYỆT»
- Bỏ \`<span>{stage.description}\` (mô tả dài) · bỏ 2 dòng «chưa có nguồn (giải thích dài)»
- Bước **đã duyệt** → \`Đã xử lý · <phòng ban> · duyệt lúc <thời gian>\` · bước **chưa duyệt** → \`Người/nhóm đang xử lý\` / \`Chưa tới bước này\`
- Giữ nguyên 15 điều kiện hợp đồng (\`p2-d4\`, \`p6-04\`) — lý do thiếu nguồn chuyển sang \`title\` tooltip

### ③ KHUNG NHẬP BÌNH LUẬN + 3 KHUNG BẰNG NHAU
- \`.approval-comment{display:grid}\` (mặc định \`<label>\` là \`display:inline\` ⇒ ô nhập chồng lên label)
- ĐO: span y=1113 · textarea y=1131 (DƯỚI) · cùng rộng 495 · \`CHỒNG LẤN: ✅ không\`
- \`align-items:start\` → \`stretch\` + \`.card{height:100%}\` ⇒ **786 / 786 / 786**

### ④ NHÓM NÚT NẰM NGANG + LABEL Ở TRÊN TOOLBAR
- **ĐO TRƯỚC**: \`.row-actions\` × **112** chỗ \`flex-wrap:wrap\` ⇒ 2 hàng · \`.material-list-filters\` 6 nút 2 hàng \`1190×88\` · \`.supplier-admin-row\` 12 nút 3 hàng \`1182×85\`
- **ĐO SAU**: \`.row-actions\` × **0** · \`.material-list-filters\` \`1190×44\` (1 hàng) · \`.supplier-admin-row\` \`1182×59\`
- **2 tầng**: \`.list-toolbar{flex-direction:column}\` (label trên) + \`.list-toolbar-controls{row/nowrap/overflow-x:auto}\` (nút ngang)
- **ĐO 4 màn**: Nhà cung cấp / Phiếu đề nghị mua hàng / Mua hàng & PO / Đơn hàng đã giao — đều \`✅ LABEL Ở TRÊN · ✅ TOOLBAR 1 HÀNG\`, cách nhau ~8px

## LỖI TÔI TỰ GÂY RA VÀ ĐÃ SỬA (5 lỗi — tất cả do cổng/probe bắt được)
1. **CSS ghi chú bằng \`//\`** ⇒ postcss lỗi ⇒ **build hỏng, \`dist/\` giữ bản cũ** ⇒ sửa thành \`/* */\`
2. **Bộ dò lọc bỏ mọi lớp chứa chữ «list»** ⇒ bỏ qua \`.list-toolbar\` ⇒ báo «0 nhóm dọc» **SAI**
3. **Đổi «Đã xử lý» → «Đã duyệt»** ⇒ \`P6-04\` FAIL — **và bộ tự kiểm cũng dùng chính chữ mới ⇒ báo ĐẠT SAI**
4. **Ép cả \`.list-toolbar\` nằm ngang** ⇒ ô «Tìm» chen giữa label + mô tả ⇒ sửa thành 2 tầng
5. **Backtick trong ghi chú JS bên trong template literal** ⇒ \`SyntaxError\`

> 📌 **Bài học #43**: bộ tự kiểm phải copy **NGUYÊN VĂN** điều kiện trong tệp test, ⛔ không tự đặt lại kỳ vọng theo cái mình vừa viết.

## CÒN LẠI / BLOCKED
| # | Việc | Trạng thái |
|---|---|---|
| 1 | \`§12\` (Mua hàng) + \`§27\` toàn văn | 🔴 **BLOCKED — thiếu trong repo** ⇒ chặn \`P5\`–\`P13\` (5/13 phase) |
| 2 | 3 màn + 2 tab chưa đo tới được (Quản lý dự án · Nhập · Cấp phát cho tổ đội · tab Tài khoản · tab Thông báo) | ⚠️ probe khớp nhãn sidebar không hoàn hảo — **cần user xác nhận bằng ảnh** |
| 3 | \`§21\` Final Audit lại sau rollback | ⛔ chưa chạy lại |

## FILES CHANGED (chưa commit — theo §18)
- \`app/globals.css\` — thêm khối CSS toolbar nằm ngang + khối bình luận/3 khung
- \`app/page.tsx\` — rút gọn dải phê duyệt + \`value={approvalComment ?? ""}\`
- \`tools/*\` — 12 probe/script mới
- ⛔ **\`0\` commit** — chờ user yêu cầu
`;

// ── 2. TASK-*.md ─────────────────────────────────────────────────────────────
const TASK = `# TASK-MT3-UI-0928 — CHỈNH SỬA GIAO DIỆN THEO YÊU CẦU USER

- **Task**: TASK-MT3-UI-0928
- **Requirement**: (a) toolbar & nhóm nút nằm ngang (b) dải phê duyệt rút gọn, bước đã duyệt hiện tên + thời gian (c) khung nhập bình luận xuống dưới label (d) 3 khung bằng nhau (e) label nằm trên toolbar
- **Current state**: Hoàn tất, đo thật trên Edge headless, 4 cổng xanh
- **Implementation**:
  - \`app/globals.css\` — khối CSS mới (2 tầng label/toolbar + nhóm nút ngang + 3 khung bằng nhau + bình luận grid)
  - \`app/page.tsx\` — bỏ mô tả bước dài, ưu tiên bước đã duyệt, gộp thời gian duyệt vào dòng phụ, phòng thủ \`?? ""\`
  - \`tools/toolbar-horizontal-20260928.css\` — khối CSS gốc (nguồn sự thật để tái tạo)
- **Backend changes**: ⛔ KHÔNG
- **Database changes**: ⛔ KHÔNG (0 Flyway migration mới)
- **Testing**: \`tsc\` EXIT=0 · contract 579/578/**0 fail** · regression 69/69 · css-baseline ĐẠT · đo thật 4 màn
- **Known issue**: 3 màn + 2 tab chưa đo tới được bằng probe (khớp nhãn sidebar) — **cần user gửi ảnh nếu còn lỗi**
- **Remaining**: xác nhận bằng mắt của user trên tunnel
- **Next task**: \`§21\` Final Audit lại + \`§12\` khi có toàn văn
`;

// ── 3. Ghi MASTER_STATUS.md + TASK_INDEX.md ───────────────────────────────────
const APPEND_STATUS = `

---

# 📌 CHỈNH SỬA GIAO DIỆN 28/09/2026 (sau khi ROLLBACK về 4d1c129)

## ROLLBACK
- \`HEAD\` = **\`4d1c129\`** (26/09, «[MT2] Chốt MASTER TASK 2 — 79/81 = 97,5 %»)
- Sao lưu: \`backup/mt3-head-20260928\` (=7fdf71d) · \`backup/mt3-worktree-20260928\` (=73ff69d) · tag tương ứng
- ⚠️ **\`dist/\` + \`web/target/*.jar\` KHÔNG nằm trong git** ⇒ phải \`gd-cycle\` + build Java + \`node tools/set-local-identity.mjs\`

## 4 CỔNG (đều xanh)
| Cổng | Kết quả |
|---|---|
| \`tsc\` | EXIT=0 |
| contract | 579 test · 578 pass · **0 fail** · 1 skip |
| regression | 69/69 · 0 fail |
| css-baseline | ĐẠT · 2680 dòng · 0 lớp chết · 0 biến chết |

## SỬA GIAO DIỆN — đều có SỐ ĐO
| # | Sửa | Trước | Sau |
|---|---|---|---|
| 1 | Khung nhập BÌNH LUẬN | \`display:inline\` ⇒ ô nhập **chồng lên** label | \`display:grid\` ⇒ textarea **ở dưới** (y=1113→1131, cùng rộng 495) |
| 2 | 3 khung phê duyệt | \`align-items:start\` ⇒ 770/590/786 | \`stretch\` ⇒ **786/786/786** |
| 3 | Dải phê duyệt | mô tả dài + 2 dòng «chưa có nguồn (giải thích dài)» | rút gọn; bước đã duyệt → tên + thời gian; chưa duyệt → trạng thái |
| 4 | Nhóm nút | \`.row-actions\` × **112** chỗ vỡ 2 hàng | × **0** |
| 5 | Thanh lọc | \`.material-list-filters\` \`1190×88\` (2 hàng) | \`1190×44\` (1 hàng) |
| 6 | Dòng NCC | \`.supplier-admin-row\` \`1182×85\` (3 hàng) | \`1182×59\` |
| 7 | Label vs toolbar | toolbar **chen giữa** label + mô tả | **2 tầng**: label trên · toolbar dưới (cách ~8px) |

## ⛔ CHƯA COMMIT — theo \`§18\`
`;
const APPEND_INDEX = `

---

## 28/09/2026 — TASK-MT3-UI-0928 (chỉnh sửa giao diện sau rollback)
| Hồ sơ | Tệp |
|---|---|
| Task | \`docs/agent-progress/TASK-MT3-UI-0928.md\` |
| Trạng thái hiện tại | \`docs/agent-progress/CURRENT_TASK.md\` |
| Commit | **\`0\`** (theo §18) · HEAD \`4d1c129\` · Build \`VNTECH-FP-671794A688DA1F77\` |
| Cổng | tsc 0 · contract 578/0 fail · regression 69/69 · css ĐẠT |
| Tunnel | https://riding-witnesses-spas-teaches.trycloudflare.com |
`;

const writes = [
  [DIR + "CURRENT_TASK.md", CURRENT],
  [DIR + "TASK-MT3-UI-0928.md", TASK],
];
for (const [f, c] of writes) { writeFileSync(f, c, "utf8"); console.log("  ✅ ghi " + f + " · " + c.split("\n").length + " dong"); }

for (const [f, block] of [[DIR + "MASTER_STATUS.md", APPEND_STATUS], [DIR + "TASK_INDEX.md", APPEND_INDEX]]) {
  const cur = existsSync(f) ? readFileSync(f, "utf8") : "";
  if (cur.includes("TASK-MT3-UI-0928")) { console.log("  (đã có trong " + f + ")"); continue; }
  writeFileSync(f, cur + block, "utf8");
  console.log("  ✅ bổ sung " + f);
}
