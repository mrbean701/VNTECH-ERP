# TEST_LOG — SESSION_C (ERP-SESSION-03)

> Kiểm thu: UNIT · API · UI · INTEGRATION · E2E · REGRESSION · MANUAL. ID: `TEST-YYYYMMDD-CNN`.

---

## TEST-20261007-C01 — Cổng tĩnh sau hotfix `BUG-20261007-C01` + dọn rác Tổ đội

| Bước | Lệnh | Kết quả ĐO ĐƯỢC | Exit |
|---|---|---|---|
| 1 | `npx tsc --noEmit` | **0 lỗi** (không in dòng nào) | `0` |
| 2 | `npx eslint app/screens/HrProfileEditModal.tsx app/screens/TeamDirectory.tsx` | **0 lỗi · 0 cảnh báo** | `0` |
| 3 | `node --test tests/mt3-c03-hotfix-ui.test.mjs tests/tm01..tm06 tests/moc-96-105-no-regression.test.mjs` | **55 test · 55 pass · 0 fail · 0 skip** | `0` |
| 4 | `npm run test:regression` (cổng hồi quy của dự án) | **811 test · 810 pass · 0 fail · 1 skip** | `0` |

> ⚠️ Lượt chạy **ĐẦU** của bước 3 có **5 ca đỏ** — đã bắt và xử lý, ⛔ **không che**:
> | Ca đỏ | Nguyên nhân THẬT | Cách xử lý |
> |---|---|---|
> | `C02 — render Tổ đội không chứa thông tin kỹ thuật` | **Lỗi THẬT của tôi**: bỏ sót 1 `note` còn in `team_members.left_at`, và luật guard quét nhầm **giá trị attribute** `data-team-sort-note="TM-02"` (⛔ không hiển thị) | bỏ nốt `note` sót; thu hẹp luật guard, ghi rõ lý do trong test |
> | `TM-05 (2 ca)` | **Đổi yêu cầu có chủ ý**: 2 assertion khoá **chuỗi cũ** có tên cột CSDL | cập nhật assertion theo yêu cầu mới, **giữ nguyên điều cần chứng minh** |
> | `moc-96-105 BUG-01 (2 ca)` | **Lỗi CÔNG CỤ ĐO, ⛔ không phải lỗi sản phẩm**: helper `between()` **bỏ qua tham số `to`**, cắt cứng 1400 ký tự ⇒ cửa sổ **tràn sang khối code mới** của hotfix ⇒ báo oan «modal gửi `fallback`/`email`» | thêm `betweenExact()` cắt **đúng mốc kết thúc của chính lời gọi**; ⚠️ mốc kết thúc phải là **REGEX** vì tệp dùng **CRLF** (`");\n"` ⛔ không bao giờ khớp) |

---

## TEST-20261007-C02 — Kiểm chứng LIVE: bundle ĐANG PHỤC VỤ chứa bản vá (⛔ không chỉ đọc mã nguồn)

| Trường | Nội dung |
|---|---|
| **Loại** | UI · MANUAL/probe tự động |
| **Môi trường** | Stack LIVE cục bộ: `:9000` (proxy) → `:8787` (Node UI) → `:18081` (Java API, vẫn chạy) |
| **Thời điểm** | 2026-10-07 (sau build GĐ mới) |

**Bước 1 — build lại bundle** (bắt buộc: `app/**` thuộc ROOT_DIRS):
```
node tools/gd-cycle.mjs "SESSION 03 HOTFIX CCCD + DON RAC TO DOI"
```
| Mốc | Kết quả ĐO ĐƯỢC |
|---|---|
| Migration identity mới | `drizzle/0330_phase_gd_session_03_hotfix_cccd_don_rac_to_doi_identity.sql` |
| SOURCE fingerprint | `846b70aaa8d06a121f910d0ba7d74ab3fe9a01508699327f2a718abf2c47834b` |
| Nhãn ngắn | **`VNTECH-FP-846B70AAA8D06A12`** · source: **720 files** |
| PREFLIGHT · FINGERPRINT · BUILT ARTIFACT VALIDATION | **ĐẠT** (cả 3) |
| Fixed point stable | `OK` · build `EXIT 0` |
| Dịch vụ sau build | `:8787` **HTTP 200** · `:9000` **HTTP 200** (Java `:18081` không bị dừng) |

**Bước 2 — đọc THẲNG bundle đang phục vụ** (tải `/assets/*.js` về đĩa rồi so khớp **chuỗi tiếng Việt RAW**):

| Chuỗi | Kỳ vọng | ĐO ĐƯỢC |
|---|---|---|
| «Hồ sơ nhân sự ĐÃ lưu» (thông báo MỚI của hotfix) | **CÓ** | ✅ **True** |
| «Phiếu cấp phát & hoàn trả của tổ đội» (tiêu đề MỚI) | **CÓ** | ✅ **True** |
| «Nguồn dữ liệu của 6 tab» (card RÁC đã gỡ) | **KHÔNG** | ✅ **False** |
| «TÁI DÙNG logic cấp phát kho» (tiêu đề kỹ thuật cũ) | **KHÔNG** | ✅ **False** |
| «mang team_id của tổ đội này» (rác tên cột CSDL) | **KHÔNG** | ✅ **False** |

> ⇒ **KẾT LUẬN ĐO ĐƯỢC**: bản vá **đã nằm trong bundle đang phục vụ** ở `:9000`, ⛔ không chỉ nằm ở mã nguồn.
> Tổng độ dài bundle kiểm: **1.400.142 ký tự** (6 tệp `/assets/*.js`).

---

---

## TEST-20261007-C05 — Cổng «trạng thái tiếng Việt» (7 ca, có ĐỐI CHỨNG ÂM) + hồi quy toàn bộ

### 5.1 Cổng mới — `tests/mt3-c04-status-vi.test.mjs` (**CHẠY THẬT** bảng nhãn bằng esbuild)

| Ca | Nội dung | Kết quả |
|---|---|---|
| 1 | 15 mã **chuỗi cung ứng** trả tiếng Việt (trước đây `partial_issued` → «Partial issued»…) + **đối chứng âm**: kết quả ⛔ không được bằng mã thô, ⛔ không được bằng dạng humanize tiếng Anh | ✅ PASS |
| 2 | 10 mã **VIẾT HOA** của Công việc trả tiếng Việt, ⛔ kể cả khi KHÔNG truyền domain | ✅ PASS |
| 3 | **Chốt an toàn**: nhãn đã tiếng Việt GIỮ NGUYÊN; `null`/`""` ⇒ «—»; mã lạ ⇒ `humanize` (không lộ `_`) | ✅ PASS |
| 4 | `StatusBadge` nhận mã CHỮ HOA; ⛔ vẫn loại chuỗi có dấu cách/tiếng Việt | ✅ PASS |
| 5 | `lib/labels.ts` dùng bảng DÙNG CHUNG, ⛔ không còn `labels[row.supplyStatus] \|\| …` hay fallback rò mã thô; **thứ tự ưu tiên cũ còn nguyên** | ✅ PASS |
| 6 | Ô lọc trạng thái ⛔ không dựng nhãn từ mã thô (Delivered · Purchasing) | ✅ PASS |
| 7 | ⛔ Không còn nơi tự chép bảng nhãn của MÃ DÙNG CHUNG mà không fallback về bảng chung | ✅ PASS |
| | Tổng | **7 test · 7 pass · 0 fail** |

⭐ **ĐỐI CHỨNG ÂM CỦA CHÍNH VIỆC SỬA** (đo TRƯỚC khi vá, ghi ở `BUG_HOTFIX_LOG.md` §C03): `partial_issued` ⇒ «Partial issued»,
`REWORK` ⇒ «REWORK», `IN_PROGRESS` (StatusBadge) ⇒ «IN_PROGRESS». ⇒ Cổng khẳng định đúng những giá trị ĐÃ ĐO là SAI.

### 5.2 Lượt chạy ĐẦU của cổng — 2 ca đỏ, ⛔ **đều do TEST của tôi quá rộng** (ghi rõ, ⛔ không che)
| Ca đỏ | Nguyên nhân THẬT | Cách xử lý |
|---|---|---|
| «ô LỌC trạng thái không dựng nhãn từ mã thô» | luật `/label:v\}/` **bắt oan bộ lọc «Nhà cung cấp»** (`label:v` ở đó là ĐÚNG — tên NCC, ⛔ không phải mã trạng thái) | thu hẹp luật vào ĐÚNG `statusOptions`; nhân đó **phát hiện thêm 1 chỗ rò thật** ở cột TÌNH TRẠNG (`String(row.postingStatus\|\|…)`) ⇒ đã vá |
| «không còn nơi tự chép bảng nhãn» | luật cũ khớp mọi cặp `xxx: "Nhãn"` ⇒ **bắt oan `label:"…"` của mọi danh sách lựa chọn** | thu hẹp: chỉ tính khoá thuộc **MÃ DÙNG CHUNG**; miễn trừ **có điều kiện** cho bảng đặc thù PR/PO (phải có fallback chung) |

### 5.3 Cổng tĩnh + hồi quy (số ĐO ĐƯỢC)
| Lệnh | Kết quả | Exit |
|---|---|---|
| `npx tsc --noEmit` | **0 lỗi** | `0` |
| `npx eslint` (8 tệp sửa/mới) | **0 error** · 6 warning (⚠️ **có sẵn từ trước**: import thừa `ActivityTimeline`/`AttachmentPanel`/`CardHead`/`Empty`, biến `selected`, `confirmPrices` — ⛔ không do lượt sửa này) | `0` |
| `npm run test:regression` | **823 test · 822 pass · 0 fail · 1 skip** | `0` |
| Cổng C04 (mới) | **7/7 PASS** | `0` |

⚠️ **2 ca của `tests/v215-…` phải CẬP NHẬT** (lượt chạy đầu ĐỎ 2/823): chúng khoá **VỊ TRÍ** bảng nhãn
(`LABELS.includes('issued: "Đã xuất kho"')`) — bảng nhãn nay nằm ở `lib/status-labels.ts`.
⇒ Đã trỏ ca kiểm về **đúng nơi nhãn đang sống**; ⛔ **điều cần chứng minh KHÔNG đổi** (mã `returned`/`issued`/`partial_issued`
**phải có nhãn tiếng Việt**; thứ tự ưu tiên `supplyStatus → status → postingStatus` **phải giữ**).
⛔ **Không** hạ chuẩn, ⛔ không xoá ca. Ghi ở `DECISION_LOG.md` §`DEC-20261007-C06`.

### 5.4 CÒN LẠI — chờ USER
| Ca | Cách làm | Trạng thái |
|---|---|---|
| Danh sách **Đơn hàng đã giao** → ô lọc «Tình trạng» ⇒ nhãn **tiếng Việt** | `:9000` → Đơn hàng đã giao | ⏳ **CHỜ USER** |
| **Mua hàng & PO** → ô lọc «Trạng thái» ⇒ nhãn **tiếng Việt** (kể cả mã lạ) | `:9000` → Mua hàng & PO | ⏳ **CHỜ USER** |
| **Chi tiết dự án** → tab nhiệm vụ ⇒ cột Trạng thái hiện «Đang làm»/«Làm lại» (⛔ không còn `IN_PROGRESS`) | `:9000` → Quản lý dự án → chi tiết | ⏳ **CHỜ USER** |
| **Trung tâm báo cáo** → nhóm theo Trạng thái ⇒ tiếng Việt | `:9000` → Báo cáo | ⏳ **CHỜ USER** |

---

## TEST-20261007-C06 — Mở rộng cổng C04 (10 ca) cho ƯU TIỀN + LOẠI CON DẤU

### 6.1 Cổng `tests/mt3-c04-status-vi.test.mjs` — **10/10 PASS** (thêm 3 ca ở vòng 4)

| Ca mới | Nội dung | Kết quả |
|---|---|---|
| 8 | Domain `priority` (5 mức) + `seal_type` (4 loại) trả tiếng Việt; ⛔ không rơi về mã thô; ⛔ kể cả khi không truyền domain · **ĐỐI CHỨNG DƯƠNG**: `statusLabel("critical","priority")` **PHẢI** là «Khẩn cấp» (ternary cũ trả «Thường» — SAI nghiệp vụ) | ✅ PASS |
| 9 | **Chống lệch bảng**: `KANBAN_PRIORITIES` (WorkKanban) ⛔ phải KHỚP nhãn với domain `priority` (⛔ không xoá được bảng đó vì còn `tone`/`rank` + khối thuần không được import) | ✅ PASS |
| 10 | ⛔ Không màn nào trong `app/screens/**` còn in mã thô `priority`/`sealType`, hoặc tự dịch Ưu tiên bằng ternary | ✅ PASS |

### 6.2 Cổng tĩnh + hồi quy (số ĐO ĐƯỢC)
| Lệnh | Kết quả | Exit |
|---|---|---|
| `npx tsc --noEmit` | **0 lỗi** | `0` |
| `npx eslint` (7 tệp) | **0 error** · 6 warning ⚠️ **có sẵn từ trước** (`now`, `date`, `project`, `managerDepartments`, `allowEdit`, unused-expressions) | `0` |
| `npm run test:regression` | **826 test · 825 pass · 0 fail · 1 skip** | `0` |
| `tests/v215-…` | ⚠️ **1 assertion cập nhật** (khoá ternary cũ của Requests) — điều cần chứng minh giữ nguyên + **mạnh hơn**: nay còn `doesNotMatch` ternary rơi về mã thô | `0` |

### 6.3 XÁC MINH LIVE (sau build lần 4)
| Phép đo | Kết quả |
|---|---|
| `:8787` · `:9000` | **HTTP 200** · **HTTP 200** |
| Bundle `:9000` (5 tệp · 1.320.058 ký tự) | ✅ **4/4 nhãn mới**: «Khẩn cấp» · «Dấu công ty» · «Dấu pháp nhân» · «Dấu chức danh» (+ «Bình thường») |
| **Hồi quy 3 vòng trước** | ✅ «Đã xuất kho» (C04) · ✅ «Hồ sơ nhân sự ĐÃ lưu» (C01) · ✅ «Phiếu cấp phát & hoàn trả của tổ đội» (C02) · ⛔ vẫn KHÔNG còn chuỗi rác |
| Build `gd-cycle` lần 4 | PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT** · vân tay **`VNTECH-FP-810CCA1455FA48BD`** (725 files) · exit `0` |

### 6.4 CÒN LẠI — chờ USER
| Ca | Cách làm | Trạng thái |
|---|---|---|
| **Công việc** → bảng nhiệm vụ: cột «Ưu tiên» ⇒ «Cao»/«Khẩn cấp» (⛔ không còn `high`/`critical`) | `:9000` → Công việc | ⏳ **CHỜ USER** |
| **Chi tiết dự án** → tab nhiệm vụ: cột «Ưu tiên» + «Trạng thái» ⇒ tiếng Việt | `:9000` → Quản lý dự án → chi tiết dự án | ⏳ **CHỜ USER** |
| **Con dấu / Ủy quyền** → cột «Loại» ⇒ «Dấu công ty» (⛔ không còn `company`) | `:9000` → (menu Hành chính) Con dấu | ⏳ **CHỜ USER** |
| **Phiếu đề nghị mua hàng** → bộ lọc «Ưu tiên» ⇒ nhãn tiếng Việt cho **mọi** mức | `:9000` → Mua hàng → Phiếu đề nghị | ⏳ **CHỜ USER** |

---

## TEST-20261007-C07 — Mở rộng cổng sang `lib/**` (11 ca) + ⚠️ hồi quy ĐỎ vì «dist cũ hơn nguồn»

### 7.1 Cổng `tests/mt3-c04-status-vi.test.mjs` — **11/11 PASS** (thêm ca ⑪)
| Ca mới | Nội dung | Kết quả |
|---|---|---|
| ⑪ | Quét **CẢ `app/**` và `lib/**`** (vòng 4 ⛔ chỉ quét `app/screens/**`) — bắt tự dịch Ưu tiên bằng ternary HOẶC tự chép bảng nhãn; **đối chứng dương**: `lib/request-export.ts` **phải** import bảng chung và ⛔ không còn `text(value) \|\| "Bình thường"` | ✅ PASS |

**Cổng BẮT ĐƯỢC 3 chỗ khi mở rộng phạm vi** (⛔ chứng minh phạm vi quét cũ bị hở):
| Vị trí | Xử lý |
|---|---|
| `lib/request-export.ts:25` (**đường XUẤT PDF/XLSX**) | ✅ đã vá |
| `app/screens/RequestDrawer.tsx` (ô «Mức độ») | ✅ đã vá |
| `app/page.tsx` (⛔ thuộc `ERP-SESSION-01`) | ⛔ **không sửa** ⇒ `HANDOFF-20261007-C05` + ghi thành **NỢ ĐÃ GIAO có tên** trong cổng (in ra mỗi lần chạy, ⛔ **không miễn trừ trắng**) |

### 7.2 ⚠️ HỒI QUY ĐỎ **TRƯỚC KHI BUILD** — 2 ca `217-4` · `217-5` (⭐ đúng như thiết kế)
| Phép đo | Kết quả |
|---|---|
| `npm run test:regression` **trước** `gd-cycle` | **827 test · 824 pass · 2 FAIL** — `217-4`/`217-5` thuộc cổng `tools/verify-ui-build-applied.mjs` |
| Nguyên nhân THẬT | Sửa `lib/**` + `app/**` mà **chưa build** ⇒ cổng báo **«dist/ CŨ HƠN nguồn»** — ⭐ **đúng thiết kế** (sự cố 02/10: user «không thấy thay đổi gì ở frontend») |
| Sau `gd-cycle` lần 5 | **827 test · 826 pass · 0 FAIL · 1 skip** (exit 0) — 2 ca **XANH LẠI** |

⇒ ⭐ **BÀI HỌC (đã ghi vào `BUG_HOTFIX_LOG.md` §C05 + `SHARED_STATE.md`)**: `gd-cycle` là bước **BẮT BUỘC** sau mỗi lần sửa mã nguồn, ⛔ **không phải tuỳ chọn** — dự án có cổng riêng bắt việc đó.

### 7.3 XÁC MINH LIVE (sau build lần 5)
| Phép đo | Kết quả |
|---|---|
| `:8787` · `:9000` | **HTTP 200** · **HTTP 200** |
| ⭐ **Cổng của chính dự án** `node tools/verify-ui-build-applied.mjs` | `✓ do-moi: dist/ mới hơn nguồn 9s (115 tệp nguồn đã đổi)` · `✓ van-tay: HTML mang 852e28fc… khớp SSOT` · `✓ byte: 6/6 bundle đúng byte trên :9000` ⇒ **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»** (exit 0) |
| Bundle `:9000` (1.319.970 ký tự) | ✅ **6/6 dấu vân tay 5 vòng** của phiên 03: «Hồ sơ nhân sự ĐÃ lưu» · «Phiếu cấp phát & hoàn trả của tổ đội» · «Đã xuất kho» · «Chờ lập PO» · «Khẩn cấp» · «Dấu công ty» · ⛔ vẫn KHÔNG còn chuỗi rác |
| Build `gd-cycle` lần 5 | PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT** · vân tay **`VNTECH-FP-852E28FC276F90F6`** (726 files) · exit `0` |

### 7.4 CÒN LẠI — chờ USER
| Ca | Cách làm | Trạng thái |
|---|---|---|
| **Xuất PDF/XLSX phiếu đề nghị** có mức độ «Khẩn cấp»/«Thấp» ⇒ ⛔ không còn mã thô trong tệp | `:9000` → Phiếu đề nghị → Xuất | ⏳ **CHỜ USER** |
| **Phiếu đề nghị** → mở modal → ô «Mức độ» ⇒ tiếng Việt đúng cho mọi mức | `:9000` → Phiếu đề nghị → mở phiếu | ⏳ **CHỜ USER** |

---

## TEST-20261007-C08 — Cổng hợp đồng §22/§11 cho KÍCH THƯỚC TAB TRONG MODAL (8 ca) + xác minh LIVE trên CSS đang phục vụ

### 8.1 Cổng mới — `tests/mt3-c05-modal-tab-sizing.test.mjs` (**8/8 PASS**)
| Ca | Bất biến được khoá | Kết quả |
|---|---|---|
| §22-1 | `.edm-tabs` là dải **CỐ ĐỊNH** (`flex: 0 0 auto`) + `flex-wrap: wrap` (nhãn dài ⛔ không bị cắt) | ✅ PASS |
| §22-2 | `.edm-tabs button` **PHẢI** `flex: 1 1 auto` + `min-width: 0` — ⭐ **CỐ Ý theo MỐC 115**; ⛔ **cấm** đổi sang `1 1 0` (mất wrap) | ✅ PASS |
| §22-3 | tab `.is-active` ⛔ **không** đổi `padding`/`height`/`border-width`/`font-size`; tab thường đã có `border-bottom: 2px solid transparent` ⇒ **chiều cao ⛔ không nhảy** khi đổi tab | ✅ PASS |
| §22-4 | `.edm-body` có `min-height` ⇒ tab NGẮN ⛔ không làm modal tụt chiều cao; là **vùng cuộn duy nhất** | ✅ PASS |
| §22-5 | `.entity-detail-modal` chặn `max-height: min(88vh,…)` (U-10) + `.modal>header` có `min-height` (tiêu đề dài/ngắn ⛔ không nhảy vùng tiêu đề) | ✅ PASS |
| §11-1 | Bản vá §11 **có mặt**: `.modal .project-scope-tabs > button, .modal .user-admin-tabs > button { flex: 1 1 0; min-width: 0 }` | ✅ PASS |
| §11-2 | ⛔ Bản vá §11 **KHÔNG rò ra dải CẤP TRANG** (`.project-scope-tabs > *, … { flex: 0 0 auto }` giữ «ôm sát nhãn» — MỐC 119b) + ⛔ cấm selector bao trùm `[role="tablist"] > button` | ✅ PASS |
| §11-3 | ⛔ `.edm-tabs` **không bị** bản vá §11 chạm tới (quét toàn bộ quy tắc chứa `.edm-tabs`, ⛔ không quy tắc nào có `flex: 1 1 0`) | ✅ PASS |

⭐ **ĐỐI CHỨNG ÂM CỦA CỔNG**: cổng **cấm** 3 hành vi cụ thể (đổi `.edm-tabs button` sang `1 1 0` · dùng selector bao trùm · rò bản vá ra dải cấp trang) ⇒ nếu phiên sau "sửa" theo **một thước đo duy nhất** thì cổng **ĐỎ ngay** thay vì tạo **báo động giả** như 4 lần trước.

### 8.2 Lượt chạy ĐẦU — 1 ca đỏ, ⛔ **do TÔI viết sai kỳ vọng** (ghi rõ)
`§11-2` đỏ vì tôi khẳng định dải cấp trang dùng `flex: none` (theo **TÀI LIỆU** `CHECKLIST.md`/`TASK-213.md`).
**ĐO LẠI TRONG MÃ ĐANG CHẠY**: giá trị THẬT là **`flex: 0 0 auto`**. ⇒ Sửa cổng theo **MÃ**, ⛔ không theo tài liệu
(⭐ Goal §16: **nguồn sự thật = actual code**; tài liệu minify cũ ghi `flex:none`).

### 8.3 Cổng tĩnh + hồi quy
| Lệnh | Kết quả | Exit |
|---|---|---|
| `node --test tests/mt3-c05-modal-tab-sizing.test.mjs` | **8 test · 8 pass · 0 fail** | `0` |
| `npx eslint tests/mt3-c05-modal-tab-sizing.test.mjs` | **0 lỗi** | `0` |
| `npm run test:regression` | **835 test · 834 pass · 0 fail · 1 skip** (trước vòng này: 827) | `0` |
| `node tools/verify-ui-build-applied.mjs` | ✓ dist mới hơn nguồn · ✓ HTML khớp vân tay SSOT · ✓ 6/6 bundle đúng byte ⇒ **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»** | `0` |

### 8.4 XÁC MINH LIVE — bất biến có thật trong CSS NGƯỜI DÙNG ĐANG NHẬN
| Phép đo trên `GET http://127.0.0.1:9000/assets/index-BjTKD8Zf.css` | Kết quả |
|---|---|
| Kích thước CSS đang phục vụ | **393.497 ký tự** |
| Rule §11 `.modal .project-scope-tabs>button,.modal .user-admin-tabs>button{flex:1 1 0;min-width:0}` | ✅ **CÓ** |
| `.edm-tabs button` | ✅ **CÓ** (⛔ không bị đụng) |
| `.edm-body { … min-height … }` | ✅ **CÓ** |

⇒ ✅ **KẾT LUẬN ĐO ĐƯỢC**: §22/§11 «tab trong modal nhất quán» **đã đúng trên bản người dùng đang dùng** ⇒
vòng này **⛔ không sửa mã sản phẩm**, chỉ **khoá bằng cổng** (⭐ đúng Goal §12/§41: ⛔ không đổi thứ không cần).

### 8.5 CÒN LẠI
- ⛔ Không có việc code nào mở. ⏳ Chờ **user nghiệm thu** 6 hotfix FE (`C01`…`C06`) trên `:9000`.

---

## TEST-20261007-C09 — Cổng C04 mở rộng lên **13 ca** (CO/CQ + giấy giao hàng trong TỆP XUẤT) + xác minh LIVE

### 9.1 Cổng `tests/mt3-c04-status-vi.test.mjs` — **13/13 PASS** (thêm 2 ca ở vòng 8)
| Ca mới | Nội dung | Kết quả |
|---|---|---|
| C04-v8 (a) | Domain `certificate_status` (3 giá trị) + `delivery_document` (2 giá trị) trả **tiếng Việt**; ⛔ không rơi về mã thô; ⛔ `not_required` ở domain giấy giao hàng **vẫn không được** humanize thành «Not required» | ✅ PASS |
| C04-v8 (b) | **ĐỐI CHỨNG ÂM trên TỆP XUẤT**: `deliveredExportRows` ⛔ **không được** chứa `row.certificateStatus \|\|` / `row.deliveryDocumentStatus \|\|`, và **PHẢI** gọi `statusLabel(…, "certificate_status"/"delivery_document")`; `lib/request-export.ts` ⛔ **không được** còn bản dịch riêng `value === "complete" ? "Đã có"` | ✅ PASS |

### 9.2 Cổng tĩnh + hồi quy (số ĐO ĐƯỢC)
| Lệnh | Kết quả | Exit |
|---|---|---|
| `node --test tests/mt3-c04-status-vi.test.mjs` | **13 test · 13 pass · 0 fail** | `0` |
| `npx tsc --noEmit` | **0 lỗi** | `0` |
| `npx eslint` (4 tệp sửa) | **0 error** · 3 warning `<img>` ⚠️ **có sẵn** trong `lib/ui-shared.tsx` (⛔ không do lượt này) | `0` |
| `npm run test:regression` | **837 test · 836 pass · 0 fail · 1 skip** | `0` |
| `node tools/verify-ui-build-applied.mjs` | ✓ dist mới hơn nguồn · ✓ HTML khớp vân tay SSOT · ✓ 6/6 bundle đúng byte ⇒ «BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT» | `0` (⚠️ console có dòng `Assertion failed … uv async.c` khi **thoát** — ⭐ **noise teardown của Node trên Windows**, ⛔ không phải cổng hỏng: **exit code = 0** và cả 3 dấu ✓ đã in) |

### 9.3 BUILD (bắt buộc vì sửa `lib/**`)
| Mốc | Kết quả |
|---|---|
| `gd-cycle` «SESSION 03 TEM XUAT HO SO GIAO HANG» | migration `drizzle/0335_…` · PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT** · `fixed point stable: OK` · exit `0` |
| Vân tay MỚI | **`VNTECH-FP-723368DEBABF42EA`** · source **728 files** |
| Coordination | dừng **đúng PID** UI + proxy (⛔ **không** dừng Java `:18081`), build, rồi khởi động lại (job `pwsh-156` · `pwsh-157`) |

### 9.4 XÁC MINH LIVE
| Phép đo | Kết quả |
|---|---|
| `:8787` · `:9000` | **HTTP 200** · **HTTP 200** |
| Bundle đang phục vụ | ✅ có nhãn MỚI «Không yêu cầu» + «Đã có» · ✅ hồi quy «Khẩn cấp» (vòng 4) + «Đã xuất kho» (vòng 3) ⛔ không mất |
| Cổng của chính dự án | **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»** (exit 0) |

### 9.5 CÒN LẠI — chờ USER
| Ca | Cách làm | Trạng thái |
|---|---|---|
| **Đơn hàng đã giao** → «▣ Xuất Excel» / «▣ Xuất CSV» ⇒ 2 cột «Chứng chỉ» và «Giấy giao hàng» hiện **«Đã có»/«Chưa có»/«Không yêu cầu»** (⛔ không còn `complete`/`missing`) | `:9000` → Đơn hàng đã giao → Xuất | ⏳ **CHỜ USER** |
| **Chi tiết PO/GRN** → «⇩ Excel»/«⇩ PDF» ⇒ CO/CQ vẫn tiếng Việt như trước (⛔ không hồi quy) | `:9000` → mở PO → Xuất | ⏳ **CHỜ USER** |

---

## TEST-20261007-C10 — ĐO CHỐT 2 yêu cầu giao diện (⛔ 0 dòng mã sản phẩm đổi)

### 10.1 (a) Lớp lỗi «mã enum rò vào TỆP XUẤT» — **ĐÃ SẠCH trong phạm vi phiên 03**
| Hàm dựng bản ghi xuất | Cột enum? | Kết quả |
|---|---|---|
| `deliveredExportRows` (`lib/ui-shared.tsx`) | ✅ có 2 cột (`certificate_status` · `delivery_document`) | ✅ **đã vá** ở `TASK-20261007-C09` |
| `inventoryExportRows` (`lib/ui-shared.tsx`) | ⛔ **không** (mã/tên/ĐVT/kho/vị trí/dự án/nhập/xuất/tồn/tối thiểu) | ✅ sạch |
| `paymentExportRows` (`lib/ui-shared.tsx`) | ⛔ **không** (HĐ/mô tả/chứng từ/ngày/tiền/dự án/người) | ✅ sạch |
| `lib/boq-export.ts` | ✅ có (`rowRole` · `itemType`) | ✅ **đã dịch sẵn** (kiểm ở vòng 3) |
| `lib/request-export.ts` | ✅ có (priority · CO/CQ · giấy giao) | ✅ **đã vá** (`C05` + `C09`) |
| `lib/report-rows.ts` · `lib/material-catalog-export.ts` · `lib/supply-docs.tsx` | ⛔ không cột enum / đi qua bảng chung | ✅ sạch |
⇒ ⭐ **KẾT LUẬN**: ⛔ không còn chỗ nào trong `lib/**` đưa mã enum thô vào tệp người dùng tải về.

### 10.2 (b) «Nút chức năng CRUD phải nằm 1 hàng ngang» — chạy CỔNG CỦA DỰ ÁN
`node tools/probe-toolbar-vertical.mjs` → **exit 0**:
| Kết quả | Số màn |
|---|---|
| ✅ **0 khối nhiều hàng** (ĐẠT) | **14 / 16** màn đo được |
| 🔴 báo «nhiều HÀNG» | 2 màn («Nhà cung cấp» · «Danh mục Nhà cung cấp») — **cả 8 khối là CÙNG 1 họ** `.supplier-admin-row` |

⭐ **CHỨNG MINH BÁO ĐỘNG GIẢ bằng công cụ ĐO của chính dự án** `node tools/measure-supplier-row.mjs`:
```
beNgang 1163 · beCao 44 · display: grid · autoFlow: column · soCon: 12 · gap: 8px
mau: INPUT 89x44 @603 · INPUT 170x44 @603 · INPUT 101x44 @603 · INPUT 111x44 @603   ⇒ MỌI ô CÙNG toạ độ y
```
⇒ 12 ô nằm trên **MỘT DÒNG THẬT** (cao **44px** = đúng 1 hàng) ⇒ **là hàng DỮ LIỆU nhà cung cấp**
(mỗi dòng là `<form className="supplier-admin-row">` — xem `app/screens/PartnerManager.tsx:65`), ⛔ **KHÔNG phải thanh nút CRUD xếp dọc**.
⭐ **Bối cảnh (⛔ không lặp việc cũ)**: `MT2` **đã sửa** họ này `1182×85 (3 hàng) → 1182×59`
(`tools/mt3-write-checklist-0928.mjs:52` · `tools/toolbar-horizontal-20260928.css:20`); **nay 44px** ⇒ **tốt hơn**, ⛔ **không hồi quy**.

### 10.3 Kết luận & việc còn lại
| Kết luận | Trạng thái |
|---|---|
| «Nút CRUD 1 hàng ngang» ĐẠT trên **14/16 màn** đo được | ✅ |
| 2 màn còn lại = **hàng dữ liệu 1 dòng thật** (đo được) ⇒ ⛔ **không phải khuyết điểm**, ⛔ **KHÔNG sửa** | ✅ |
| Đề xuất sửa **cụng cụ đo** để hết báo động giả (⛔ thuộc `tools/**` — mã dùng chung) | ⚠️ `HANDOFF-20261007-C07` |
| Cổng dự án `verify-ui-build-applied` sau vòng này (chỉ sửa `docs/**`) | ✅ **ĐẠT** ⇒ ⛔ không cần `gd-cycle`, ⛔ không gián đoạn 2 phiên khác |

---

## TEST-20261007-C11 — RESPONSIVE: phát hiện **cổng XANH RỖNG** + đo THẬT ở 375px

### 11.1 Cổng dự án `tools/probe-responsive-5widths.mjs` — chạy 3 lần, **kết quả Y HỆT NHAU**
| Lần | Tham số | Kết quả đo |
|---|---|---|
| 1 | (không nhãn menu) | `scrollW=329/375/753/1009/1425` · `bảng cuộn=auto` · **`tab cuộn=null`** · **`modal=—`** · **`toolbar 0 nút/0 hàng`** |
| 2 | nhãn «Phiếu đề nghị mua hàng» | ⛔ **giống hệt lần 1** |
| 3 | nhãn «Quản lý dự án» | ⛔ **giống hệt lần 1** |
⇒ ① tham số nhãn menu **⛔ không có tác dụng**; ② **không phần tử nào** được đo cho tab/modal/toolbar;
③ nhưng cổng vẫn in **«✅ ĐẠT … tab cuộn ngang · modal vừa khung · toolbar không vỡ cột dọc»**.

### 11.2 ROOT CAUSE (đọc mã, có dòng) — **cổng XANH GIẢ**
| # | Vị trí | Vấn đề |
|---|---|---|
| ① | `tools/probe-responsive-5widths.mjs:159-161` | 3 phép kiểm **CÓ ĐIỀU KIỆN** (`if (r.hasModal …)` · `if (r.hasTabbar …)` · `if (r.hasToolbar …)`) ⇒ **thiếu mục tiêu = KHÔNG ghi vấn đề** ⇒ `problems` rỗng ⇒ **ĐẠT** |
| ② | `tools/probe-responsive-5widths.mjs:126-139` | Nhánh chọn menu **thất bại IM LẶNG** (vòng 8 lần rồi thôi), ⛔ **không kiểm chứng đã tới đúng màn** |
| ③ | `tools/probe-responsive-5widths.mjs:164` | Câu kết luận **in cứng 4 tiêu chí**, ⛔ không nói tiêu chí nào **thực sự có số đo** |

⭐ **Đối chiếu bài học dự án** (`CHECKLIST.md`): *«CỔNG XANH KHÔNG CÓ NGHĨA LÀ KHÔNG CÓ LỖI — cổng chỉ kiểm chiều nó được viết để kiểm»* và *«CỔNG MỚI PHẢI CỐ Ý HẸP»* ⇒ ⛔ **không được dùng cổng này làm bằng chứng «responsive ĐẠT»** cho tới khi vá.
⇒ Đã giao **`HANDOFF-20261007-C08`** (⛔ thuộc `tools/**` = mã dùng chung ⇒ phiên 03 ⛔ không tự sửa).

### 11.3 PHIÊN 03 **BÙ SỐ LIỆU** — đo THẬT ở **375px** (script tạm, ⛔ đã xoá sau khi chạy)
| Màn đo được (10 mục menu đầu) | Kết quả |
|---|---|
| TỔNG QUAN ĐIỀU HÀNH | `tràn=0px` · không có modal/tab/toolbar |
| Trung tâm phê duyệt (mở chi tiết) | `tràn=0px` · **modal = 375×900** ⇒ ⛔ **không vượt `vw`/`vh`** · toolbar 1 nút/1 hàng |
| Các mục còn lại (đo khi modal đang mở) | `tràn=0px` (⚠️ **đo lặp trên cùng modal** ⇒ ⛔ không tính là số của từng màn) |
| **Dải tab trong modal (`.edm-tabs`)** | ⛔ **CHƯA ĐO ĐƯỢC** (`tab=—`) ⇒ ⭐ **không được coi là đã đạt** |

**Kết luận TRUNG THỰC**: ✅ đo được **không tràn ngang ở 375px** và **modal chi tiết đúng khung viewport**;
⛔ **2/4 tiêu chí của §IV.2 (dải tab dài · toolbar CRUD ngoài màn) CHƯA có số đo** ⇒ ghi thẳng, ⛔ không tuyên bố «responsive ĐẠT».

### 11.4 Việc còn lại
| Việc | Trạng thái |
|---|---|
| Vá cổng responsive (thiếu mục tiêu ⇒ `SKIP`/`BLOCKED`, ⛔ không ĐẠT; kiểm chứng đã tới màn) | ⚠️ `HANDOFF-20261007-C08` |
| Đo dải `.edm-tabs` trong modal ở 320/375px | ⏳ cần cổng đã vá **hoặc** user cho phép phiên 03 tự viết probe riêng |

---

## TEST-20261007-C12 — Modal «Chi tiết đơn giao hàng»: **ĐO ĐƯỢC nhưng ⛔ KHÔNG TÁI HIỆN** được lỗi user

### 12.1 Phép đo (Chrome headless, 1440×900, mở đúng modal từ «Đơn hàng đã giao»)
| Chỉ số | TRƯỚC vá | SAU vá (sau `gd-cycle` lần 7) |
|---|---|---|
| class thân | `drawer-body` | `drawer-body modal-body` |
| `flex` · `min-height` | `0 1 auto` · `auto` | ✅ `1 1 auto` · ✅ `0px` |
| thân | top 101 · bottom 669 · h 568 | ⛔ **Y HỆT** |
| `clientH` · `scrollH` | 568 · 568 | ⛔ **Y HỆT** |
| khối «Chứng chỉ / Tài liệu đã tải lên» | 538 → **587** | ⛔ **Y HỆT** |
| khối «Ảnh giao hàng» | 601 → **651** | ⛔ **Y HỆT** |
| đáy thân | **669** | **669** |

⇒ 2 khối user báo **đều nằm TRONG khung thân (587 · 651 < 669)** ở **CẢ HAI** lần đo ⇒
⭐ **KẾT LUẬN: ⛔ KHÔNG tái hiện được hiện tượng «bị ẩn»** ⇒ ⛔ **không kết luận đã sửa**.

### 12.2 Cổng tĩnh + hồi quy (sau khi đổi class)
| Lệnh | Kết quả | Exit |
|---|---|---|
| `tests/mt3-c06-modal-body-scroll.test.mjs` (**mới**) | **4/4 PASS** | `0` |
| `npx tsc --noEmit` · `npx eslint` | **0 lỗi** · **0 lỗi** | `0` |
| `npm run test:regression` | **841 test · 840 pass · 0 fail · 1 skip** | `0` |
| `node tools/verify-ui-build-applied.mjs` | ✓ dist mới hơn nguồn · ✓ HTML khớp vân tay SSOT (`f3f8a0d3…`) · ✓ 6/6 bundle đúng byte | `0` |
| `gd-cycle` lần 7 | **ĐẠT** · vân tay **`VNTECH-FP-F3F8A0D3B0C85E17`** (730 files) | `0` |

### 12.3 ⛔ TỰ ĐÍNH CHÍNH (ghi rõ, ⛔ không che)
Tôi **kết luận sớm** là «cắt 38px» dựa trên chỉ số `biCat` (khối có đáy vượt đáy thân) — chỉ số đó **bắt nhầm một KHỐI BAO**
(rect khối cha phủ khối con) ⇒ ⛔ **suy diễn ≠ tái hiện**. **Đã hạ trạng thái** `BUG-20261007-C07` từ `FIXED` → **`OPEN`**.
⭐ **Bài học (lần 4 của phiên)**: **chỉ số suy diễn ⛔ KHÔNG thay được việc TÁI HIỆN hiện tượng user báo.**

### 12.4 Việc cần để đóng bug (⛔ chờ USER)
① Màn + đường đi chính xác (từ «Đơn hàng đã giao» hay từ «Nhập kho»/«Kho»?) · ② kích thước cửa sổ/máy khi thấy lỗi ·
③ ảnh chụp phần bị thiếu · ④ trường hợp có nhiều tệp/ảnh hay không. ⛔ Không đoán.

---

## TEST-20261007-C13 — Khu vực «Ảnh và hồ sơ»: chạy CỔNG CỦA DỰ ÁN ⇒ phát hiện ca **D2 ĐỎ OAN**

### 13.1 `node tools/probe-task075-attachments.mjs` (cổng của dự án cho `/api/files` + panel ảnh)
| Kết quả | Chi tiết |
|---|---|
| **21/22 ĐẠT** · exit `1` | HỎNG **duy nhất** ca `D2 · có ≥2 thẻ <img> trỏ đúng endpoint tệp (dải ảnh + ô thu nhỏ)` |
| Các ca đường ống ĐẠT | `C0` fixture · `C1` login `:18081` · **`A1` API danh sách trả 200 + CÓ tệp** · `A2` tập trường `{createdAt,fileName,id,mimeType,uploadedByName}` · `A3` `mimeType=image/png` · `A4` tên tệp · **`B1–B4` tải tệp: 200 · đúng `Content-Type` · đúng chữ ký PNG · TRÙNG TỪNG BYTE** · `C2` không cookie ⇒ **401** · `ĐC1–ĐC4` đối chứng dữ liệu hỏng · `D1·D3–D6` UI |
| ⚠️ **GIỚI HẠN do CHÍNH CỔNG ghi** | *«cổng đo ĐƯỜNG ỐNG + hợp đồng trường + byte ảnh + biên CSS trong NGUỒN; **KHÔNG đo phần render của UI**»* ⇒ ⛔ **không dùng nó để kết luận `BUG-20261007-C07`** |
| ℹ️ Ghi nhận thêm của cổng | «**0/40** dòng `attachments` KHÔNG tới được qua API (chứng từ đích mồ côi)» ⇒ ⛔ không cần hành động |

### 13.2 ĐO LẠI để phân định **lỗi thật** hay **cổng khớp chuỗi cứng** ⇒ **D2 ĐỎ OAN**
Phép đếm trên `lib/ui-shared.tsx` (bằng `IndexOf`, ⛔ không regex dễ sai dấu):
| Đo được | Số |
|---|---|
| Chuỗi **NGUYÊN VĂN** mà `probe-task075-attachments.mjs:163` đòi khớp (`src={`/api/files?id=${encodeURIComponent(file.id)}`}`) | **0 lần** ⛔ |
| `/api/files?id=${encodeURIComponent(` (mọi cách viết) | **6 lần** |
| Trong đó là **thẻ `<img>`** | **3** ✅ (dải ảnh `(id)` · ô thu nhỏ `String(file.id)` · xem trước `String(preview.id)`) |
| Còn lại | 1 `fetch(DELETE)` + 2 thẻ `<a href>` (⛔ không phải `<img>`) |
⇒ ⭐ **KẾT LUẬN**: ý nghĩa ca D2 («**≥2** ảnh trỏ đúng endpoint») **ĐÃ THOẢ** ⇒ **D2 đỏ OAN**, ⛔ **KHÔNG sửa mã sản phẩm** (đúng luật đã rút ra ở vòng 7 & 9).

### 13.3 Cổng MỚI của phiên 03 khoá ĐÚNG ý nghĩa (dung sai có chủ ý)
`tests/mt3-c07-attachment-imgs.test.mjs` — **2/2 PASS**:
| Ca | Nội dung |
|---|---|
| `C07-1` | Đếm `<img …>` có `src` trỏ `/api/files?id=${encodeURIComponent(…)}` ⇒ **≥ 2** (đo được **3**); **đối chứng âm**: ghi lại việc chuỗi nguyên văn của cổng cũ = **0** ⇒ ⛔ không ai đổi mã cho vừa chuỗi |
| `C07-2` | Panel phải có: lọc theo **`mimeType`** (tên trường API thật) · thông báo lỗi tải danh sách (`data-vntech="attachment-load-error"`) · đánh dấu **ảnh hỏng** · dải ảnh · nạp lại sau khi tải/xoá |

### 13.4 Cổng tĩnh
| Lệnh | Kết quả | Exit |
|---|---|---|
| `node --test tests/mt3-c07-attachment-imgs.test.mjs` | **2/2 PASS** | `0` |
| `npx eslint tests/mt3-c07-attachment-imgs.test.mjs` | **0 lỗi** | `0` |
| `node tools/verify-ui-build-applied.mjs` | **ĐẠT** (vòng này ⛔ chỉ thêm `tests/**`) | `0` |

### 13.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| Sửa ca D2 của `tools/probe-task075-attachments.mjs` (đổi so-khớp-chuỗi → đếm dung sai) | ⚠️ **`HANDOFF-20261007-C09`** (⛔ `tools/**` dùng chung) |
| `BUG-20261007-C07` (user báo «mục Ảnh/hồ sơ bị ẩn») | ⛔ **vẫn `OPEN`** — cần user cho **bước tái hiện** |

---

## TEST-20261007-C14 — ⭐ **TÁI HIỆN ĐƯỢC LỖI USER** + xác minh bản vá (`BUG-20261007-C07`)

### 14.1 ⛔ VÌ SAO LẦN TRƯỚC «KHÔNG TÁI HIỆN ĐƯỢC» — **tôi đo SAI CHỈ SỐ**
| | Lần trước (⛔ sai) | Lần này (✅ đúng) |
|---|---|---|
| Đối tượng đo | **hình học khối CHA** (thân modal · toạ độ khối) | **`scrollHeight` vs `clientHeight` CỦA CHÍNH TỪNG KHỐI** |
| Kết luận | «2 khối nằm trong khung ⇒ không có lỗi» | **7/8 khối bị CẮT bên trong** (`scrollHeight` 231–294 > `clientHeight` 47) |
⭐ **Luật**: **dấu hiệu CẮT nằm Ở TRONG khối, ⛔ không ở toạ độ khối.**

### 14.2 SỐ ĐO TÁI HIỆN (Chrome headless 1440×900, mở ĐÚNG modal từ «Đơn hàng đã giao»)
```
body: display=grid · grid-auto-rows=auto · height=567,594px · scrollHeight=568 == clientHeight=568 (⛔ KHÔNG thanh cuộn)
gridTemplateRows GIẢI RA: 47.19 49.20 49.20 49.20 91.19 49.20 49.20 49.20 px       ← 8 hàng bị ÉP vừa khung
7/8 khối: height=49,2031px · scrollHeight=231…294px · overflow=hidden              ← ⛔ CẮT 78–83%
khối «Ảnh và hồ sơ giao hàng»: cao 49px · con: .card-head 71px + .attachment-panel 190px (top=395 > đáy khối 357)
quét stylesheet trong trang: chỉ 4 quy tắc khớp ⇒ .drawer-body(grid) · .drawer-section(overflow:hidden) · .modal-body(flex/min-height) · overflow:auto!important
⇒ ⛔ KHÔNG quy tắc nào ghim height/max-height của khối ⇒ nguyên nhân là GRID CO HÀNG
```

### 14.3 ROOT CAUSE (chuẩn CSS, ⛔ không suy đoán)
`.drawer-section { overflow:hidden }` ⇒ **kích thước tối thiểu tự động = 0** ⇒ trong grid có **chiều cao xác định**,
hàng `auto` **bị co xuống vừa khung** ⇒ cắt nội dung; vì grid **không tràn** ⇒ `.drawer-body { overflow:auto }`
⛔ **không sinh thanh cuộn** ⇒ nội dung bị cắt **KHÔNG THỂ TỚI**. ✅ Khớp 100% với nguyên văn user báo.

### 14.4 BẢN VÁ (cục bộ · 1 thuộc tính · ⛔ không đụng CSS dùng chung)
`app/screens/ReceiptDrawer.tsx` — thân modal: `style={{ gridAutoRows: "max-content" }}`.

### 14.5 ĐO LẠI SAU VÁ (`gd-cycle` lần 8 → đo lại CÙNG phép đo)
| Khối | TRƯỚC cao/nội dung | SAU cao/nội dung | |
|---|---|---|---|
| **Ảnh và hồ sơ giao hàng** | **49** / 277 ⛔ | **279** / 277 | ✅ |
| **Chứng chỉ / Tài liệu đã tải lên** | **49** / 277 ⛔ | **279** / 277 | ✅ |
| **Ảnh giao hàng** | **49** / 277 ⛔ | **279** / 277 | ✅ |
| Đơn mua (PO) nguồn | 49 / 245 ⛔ | **247** / 245 | ✅ |
| Đối chiếu PO và thực giao | 49 / 294 ⛔ | **296** / 294 | ✅ |
| Kết quả xác nhận BCH | 77 / 164 ⛔ | **166** / 164 | ✅ |
| Lịch sử giao nhận | 49 / 231 ⛔ | **233** / 231 | ✅ |
| ⭐ `conCat` (khối còn bị cắt) | **7** | ✅ **`[]` = 0** | ✅ **HẾT CẮT** |

### 14.6 Cổng tĩnh + hồi quy + build
| Lệnh | Kết quả | Exit |
|---|---|---|
| `tests/mt3-c08-modal-grid-clip.test.mjs` (**mới, 3 ca**) | **3/3 PASS** | `0` |
| `npx tsc --noEmit` · `npx eslint` | **0** · **0** | `0` |
| `npm run test:regression` | **846 test · 845 pass · 0 fail · 1 skip** | `0` |
| `gd-cycle` lần 8 «SESSION 03 VA CAT KHOI MODAL GRN» | **ĐẠT** · vân tay **`VNTECH-FP-AF5B84E9A7B25888`** (732 files) | `0` |
| `node tools/verify-ui-build-applied.mjs` | ✓ dist mới hơn nguồn · ✓ HTML khớp SSOT (`af5b84e9…`) · ✓ 6/6 bundle đúng byte | `0` |
| `:8787` · `:9000` | **HTTP 200** · **HTTP 200** | — |

### 14.7 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ⏳ **USER nghiệm thu** modal «Chi tiết đơn giao hàng» (cuộn xuống thấy **đủ** Ảnh giao hàng + Chứng chỉ/Tài liệu, tải/xem được tệp) | ⇒ mới lên `VERIFIED` |
| ⚠️ **Rà cùng cơ chế ở nơi khác**: các thân dùng `.drawer-body` (grid) **trong `.drawer`** (⛔ không phải `.modal`) | cổng `C08-2` hiện chỉ phủ trường hợp `.modal`; ⏳ đề xuất mở rộng ở vòng sau |

---

## TEST-20261007-C15 — ĐÓNG **LỚP LỖI** «grid co hàng ⇒ cắt nội dung»: quét tĩnh + đo LIVE tệp thứ 2 + làm chính xác cổng

### 15.1 Quét TĨNH toàn bộ `app/**` + `lib/**` — chỉ 2 tệp dùng thân `.drawer-body` (grid)
| Tệp | Khung chứa | Chặn co hàng | Kết luận |
|---|---|---|---|
| `app/screens/ReceiptDrawer.tsx` | `.modal` | ✅ **có** (`gridAutoRows: "max-content"` — vá vòng 13) | ✅ an toàn |
| `app/screens/PurchaseOrderDrawer.tsx` | `.drawer` | ⛔ chưa có | ⚠️ **phải đo** |

### 15.2 ĐO LIVE tệp thứ 2 — «Chi tiết đơn mua» (nút `data-vntech="grn-source-po-open"`)
```
khung: modal entity-detail-modal edm-wide
thân : .edm-body · display=block · clientHeight=683 · scrollHeight=1985 ⇒ ✅ CUỘN ĐƯỢC
khối : 63px (scrollH 63 == clientH 63) · 1902px (scrollH 1902 == clientH 1902)
conCat = []                        ⇒ ⛔ 0 khối bị cắt
```
⇒ ⭐ **AN TOÀN** (⛔ không phải chỗ thứ 2 bị lỗi): `.drawer-body` ở đây nằm **trong tab** của `EntityDetailModal`,
tức **lồng trong `.edm-body`** (`display:block`) ⇒ thân grid có **chiều cao AUTO** ⇒ ⛔ không bị co hàng.

### 15.3 ⭐ PHÂN ĐỊNH **HÌNH DẠNG** (kết quả chính của vòng này)
| Hình dạng | Cơ chế | Kết quả |
|---|---|---|
| `.drawer-body` (grid) là **CON TRỰC TIẾP** của khung có **chiều cao xác định** (`.modal { max-height }` · `.drawer { height:100vh }`) | grid **co hàng** vì con có `overflow:hidden` ⇒ kích thước tối thiểu tự động = 0 | ⛔ **CẮT nội dung + ⛔ KHÔNG thanh cuộn** ⇒ đúng `BUG-20261007-C07` |
| `.drawer-body` **lồng trong `.edm-body`** (`display:block`, cao theo nội dung) | thân grid có **chiều cao AUTO** ⇒ hàng lấy chiều cao nội dung | ✅ **AN TOÀN** (đo được: 1902px, `conCat = []`) |

### 15.4 Cổng C08 được **LÀM CHÍNH XÁC** (3 → **4 ca**) — chống báo động giả
| Ca | Thay đổi | Kết quả |
|---|---|---|
| `C08-2` | ⛔ Bỏ cách kiểm **theo TỆP** (quá thô ⇒ sẽ báo động giả cho `PurchaseOrderDrawer` đang an toàn) ⇒ nay chỉ bắt **mẫu NGUY HIỂM**: khung `.modal`/`.drawer` rồi tới `<div className="drawer-body` **trong cùng khối JSX**, trừ khi có `gridAutoRows: "max-content"` | ✅ PASS |
| `C08-2b` (**mới**) | ✅ **KHOÁ hình dạng AN TOÀN**: `.drawer-body` lồng trong `.edm-body` ⇒ `.edm-body` phải giữ `overflow-y:auto` và ⛔ **không** được chuyển `display:grid` (nếu đổi ⇒ hình dạng an toàn thành NGUY HIỂM) | ✅ PASS |
| `C08-1` · `C08-3` | giữ nguyên (thân `ReceiptDrawer` có chặn co hàng · `.drawer-section` vẫn `overflow:hidden` = ghi lại căn nguyên) | ✅ PASS |

### 15.5 ⚠️ CỔNG BẮT ĐƯỢC **CHÍNH TÔI** (ghi thẳng, ⛔ không che)
Lượt chạy đầu: `C08-2b` **ĐỎ** — nguyên nhân **⛔ KHÔNG phải mã sản phẩm** mà là **phép TRÍCH của tôi sai**:
`indexOf(".edm-body")` **bắt trúng một CHÚ THÍCH** («/* phần cuộn nằm ở .edm-body */») ⇒ lấy nhầm thân quy tắc khác ⇒ thiếu `overflow-y:`.
✅ Sửa: **bỏ chú thích TRƯỚC**, rồi mới trích `.edm-body {` (đã ghi bài học ngay trong ca kiểm).
⭐ **Luật**: khi trích quy tắc CSS bằng `indexOf` **phải bỏ chú thích trước** (lớp lỗi đã gặp ở cổng của dự án và ở chính tôi).

### 15.6 Cổng tĩnh + hồi quy
| Lệnh | Kết quả | Exit |
|---|---|---|
| `node --test tests/mt3-c08-modal-grid-clip.test.mjs` | **4 test · 4 pass · 0 fail** | `0` |
| `npx eslint tests/mt3-c08-modal-grid-clip.test.mjs` | **0 lỗi** | `0` |
| `npm run test:regression` | **847 test · 846 pass · 0 fail · 1 skip** | `0` |
| `node tools/verify-ui-build-applied.mjs` | **ĐẠT** (⛔ vòng này chỉ sửa `tests/**` ⇒ ⛔ không cần `gd-cycle`) | `0` |
| `:8787` · `:9000` · `:18081` | **đang nghe** (⛔ phiên 03 không dừng dịch vụ vòng này) | — |

### 15.7 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ⭐ **Lớp lỗi đã ĐÓNG**: chỉ 1 chỗ nguy hiểm (`ReceiptDrawer`) và **đã vá**; chỗ thứ 2 **đã đo ⇒ an toàn** | ✅ |
| ⏳ **USER nghiệm thu** `BUG-20261007-C07` trên `:9000` ⇒ mới lên `VERIFIED` | ⏳ |
| 📌 Các HANDOFF đang mở cho S01/S02: `C02` · `C04` · `C05` · `C06` · `C07` · `C08` · `C09` | ⏳ |

---

## TEST-20261007-C16 — **MÁY DÒ NỘI DUNG BỊ CẮT** quét 22 màn (tìm lớp lỗi của `BUG-20261007-C07`)

### 16.1 Máy dò (cách chạy — để tái sử dụng)
Script tạm (đã xoá sau khi chạy): đăng nhập `:9000` → mở hết nhóm menu → **lần lượt bấm từng mục** →
trên mỗi màn chạy phép dò **trong trang**:
```
mọi phần tử: computed overflow-y ∈ {hidden, clip}
   ∧ ⛔ không có -webkit-line-clamp            (⛔ bỏ qua cắt CỐ Ý theo dòng)
   ∧ chiều cao ≥ 40px ∧ rộng ≥ 120px          (⛔ bỏ chip/nhãn nhỏ)
   ∧ position ≠ fixed
   ∧ scrollHeight − clientHeight > 4px        (dấu hiệu CẮT DỌC)
⇒ báo { tag, class, h, clientHeight, scrollHeight, phần cắt, trích 50 ký tự }
```

### 16.2 KẾT QUẢ QUÉT 22 MÀN
| Kết quả | Số màn | Ghi chú |
|---|---|---|
| ✅ **0 khối bị cắt** | **16** màn | «Nhà cung cấp» · «Đối tác» · «Kho vật tư» · «Tổ đội» · «Tài chính – Kế toán» · «Hành chính – Pháp chế» · «Báo cáo» · «Danh mục vật tư gốc» · «Quản trị hệ thống» … |
| 🔴 có khối bị cắt | 6 màn (⚠️ **cùng MỘT họ khối**) | Tổng quan điều hành · Công việc · Trung tâm phê duyệt · Quản lý dự án · Mua hàng & cung ứng |
| **TỔNG khối bị cắt** | **25 khối** | ⭐ **TẤT CẢ đều là `<article class="kpi …">`** — ⛔ **không còn loại khối nào khác** |

⇒ ⭐ **KẾT LUẬN 1**: lớp lỗi «nội dung bị cắt trong khối» của `BUG-20261007-C07` **⛔ KHÔNG còn ở chỗ nào khác**
ngoài họ thẻ KPI (đã đo mọi màn chính) ⇒ bản vá vòng 13 + quét vòng 14 **đã đóng đúng lớp lỗi**.

### 16.3 Họ thẻ KPI — **phụ thuộc bề rộng**, đo được 2 trạng thái
| Trạng thái | Số đo | Kết luận |
|---|---|---|
| A (trong lần quét 22 màn) | `h=203` · **`clientHeight=201` / `scrollHeight=210` ⇒ cắt 9px** (`kpi-blue`) · 7px (`kpi-green`) · 7px (`kpi-violet`) | ⚠️ **có cắt** |
| B (đo riêng, 1440×900 qua `setDeviceMetricsOverride`) | `h=200` · **`clientHeight=198 == scrollHeight=198`** | ✅ không cắt |
⇒ **CƠ CHẾ**: `.kpi` = `display:flex` · `padding:16px` · **`overflow:hidden`** · **chiều cao CỐ ĐỊNH** (`.kpi-pictogram` 42px + `.kpi-content` 153px)
⇒ khi dòng mô tả **xuống thêm 1 dòng** thì phần cuối **bị cắt** (⚠️ **cùng lớp lỗi** với `BUG-20261007-C07`).

### 16.4 ⚠️ GIỚI HẠN CỦA PHÉP ĐO NÀY (⛔ nói thẳng)
Phiên 03 **⛔ không đọc được ảnh** (model hiện tại **không nhận đầu vào ảnh**) ⇒ tôi **đã chụp** ảnh thẻ KPI nhưng
**⛔ KHÔNG có xác nhận bằng mắt**. Phân loại đúng: **RỦI RO CÓ THẬT + ĐÃ ĐO ĐƯỢC 1 LẦN XẢY RA**,
⛔ **không** khẳng định «chắc chắn thấy chữ bị cắt».
⚠️ Việc sửa nằm ở **`app/globals.css`/`canonical.css`** (CSS dùng chung) hoặc **`app/page.tsx`** (**LOCK của S01**)
⇒ ⛔ phiên 03 **không tự sửa** (⭐ theo cảnh báo conflict của user) ⇒ đã giao **`HANDOFF-20261007-C10`**.

### 16.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| Sửa họ thẻ KPI (2 hướng: tự cao theo nội dung **hoặc** cắt dòng CÓ CHỦ Ý + tooltip) | ⚠️ **`HANDOFF-20261007-C10`** |
| ⏳ USER nghiệm thu `BUG-20261007-C07` (Ảnh/hồ sơ) | ⏳ |
| 📌 HANDOFF đang mở: `C02` · `C04` · `C05` · `C06` · `C07` · `C08` · `C09` · **`C10`** | ⏳ |

---

## TEST-20261007-C17 — Rà «UI nói dối» (nút chết · gọi backend không tồn tại) + **bác bỏ cổng RBAC ĐỎ**

### 17.1 Lớp ①: `open("X")` ⛔ không có modal — quét **39 đích** trên `app/**` + `lib/**`
| Kết quả | Chi tiết |
|---|---|
| 37 đích **CÓ** handler | `receipt` · `issue` · `return` · `transfer` · `poDetail` · `receiptDetail` · … |
| ⛔ **2 đích KHÔNG có modal** | **`allocate`** · **`warehouse`** (đều từ `app/screens/Inventory.tsx`) |
| ⭐ Trạng thái UI thực tế | ✅ **ĐÃ BỊ VÔ HIỆU HOÁ bởi `ERP-SESSION-02`**: `disabled` + `title` ghi rõ mã lỗi — `BUG-20261007-013` (allocate) · `-014` (warehouse) · `-015` (delete_warehouse) ⇒ ⭐ **UI ⛔ không còn «nói dối»** |
⇒ **KẾT LUẬN ①**: ⛔ **không cần sửa**; lớp «nút chết» **sạch**.

### 17.2 ⚠️ ĐÍNH CHÍNH ghi chép của phiên khác (đo lại mới biết)
Sổ `docs/dsh-mutil-session/SESSION_A/BUG_HOTFIX_LOG.md` ghi nút «＋ Tạo phiếu hoàn trả» gọi `open("return")` là
**⛔ bấm không mở được gì**. **ĐO LẠI `app/page.tsx`**: `modal === "return"` xuất hiện **1 lần** ⇒ ⭕ **`return` KHÔNG chết** ⇒ ghi chép đó **SAI**.
⭐ Đúng bài học: **⛔ đừng tin ghi chép (kể cả của phiên khác) — hãy đo lại trong mã đang chạy.**

### 17.3 Lớp ②: CỔNG RBAC CỦA DỰ ÁN **ĐỎ** — và bị **BÁC BỎ BẰNG MÃ**
`node tools/probe-action-registry-coverage.mjs` → **exit 1**:
```
Action dispatch ở controller: 220
① PUBLIC_ACTIONS: 10   ② Khai MODULE: 146   ③ ADMIN-ONLY: 56   ③b ADMIN-GATED: 2
④ ⛔ MÙ QUYỀN (không public · không module · không admin-gated): 6
   delete_contract_review · list_contract_review · log_contract_review · open_contract_review · save_contract_review · work_scope
⑤ MODULE nhưng THIẾU capability: 0        KẾT LUẬN: CÒN ACTION MÙ QUYỀN ⇒ phải vá ✗
```
⚠️ Nếu tin ngay ⇒ đây là lớp **CRITICAL (AUTHORIZATION BYPASS)**. **PHIÊN 03 ĐÃ ĐỌC MÃ ĐANG CHẠY TRƯỚC KHI KẾT LUẬN**:

| Nhóm | Bằng chứng ĐO ĐƯỢC trong mã hiện tại | Kết luận |
|---|---|---|
| 5× `*_contract_review` | `java-backend/.../ContractReviewUseCase.java`: **5 lần `guard(principal);`** + `private void guard(Principal p) { rbac.requireActionModule(currentUser(p), ACTION); }` với `ACTION = "manage_contract_review"` | ✅ **ĐÃ CÓ CỔNG RBAC** (ở tầng **UseCase** — cổng chỉ quét tầng controller nên ⛔ không thấy) |
| `work_scope` | `SystemController`: `case "work_scope"` → `requireCurrentUser(request)` → `opsTaskManagementUseCase.workScope(asOpsTaskPrincipal(cu))`; trong `OpsTaskManagementUseCase`: `WorkScopeService.Scope scope = workScope.scopeOf(cu.id(), cu.role());` ⇒ **chỉ tính phạm vi của CHÍNH người gọi**, ⛔ **không tham số đích** | ✅ **CHỈ-ĐỌC + TỰ-GIỚI-HẠN** ⇒ ⛔ không có gì để phân quyền ngoài đăng nhập |

⇒ ⭐ **KẾT LUẬN ②**: ⛔ **KHÔNG có lỗ hổng phân quyền**; ⛔ **KHÔNG sửa `java-backend/**`** (LOCK S01);
⛔ **KHÔNG phát cảnh báo CRITICAL** (nếu phát sẽ là **báo động giả thứ 5** của phiên) ⇒ giao **`HANDOFF-20261007-C11`**
để cổng nhận thêm **2 loại hợp lệ** (cổng-ở-UseCase · đọc-tự-giới-hạn).

### 17.4 Kiểm chứng & hồi quy
| Lệnh | Kết quả | Exit |
|---|---|---|
| `node tools/probe-action-registry-coverage.mjs` | **ĐỎ (⑥ mục ④)** — ⭐ **đã bác bỏ bằng mã**, ⛔ không phải lỗi sản phẩm | `1` (⛔ do cổng) |
| `node tools/probe-create-buttons.mjs` | chạy được, chỉ in ghi nhận «KHONG CO TAB 'To doi'» ⇒ ⛔ không phải lỗi | `0` |
| `node tools/verify-ui-build-applied.mjs` | **ĐẠT** (⛔ vòng này **0 thay đổi mã**) | `0` |
| `:8787` · `:9000` · `:18081` | **đang nghe** | — |

### 17.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| Sửa cổng RBAC (thêm 2 loại hợp lệ) | ⚠️ **`HANDOFF-20261007-C11`** |
| ⏳ USER nghiệm thu `BUG-20261007-C07` (Ảnh/hồ sơ) | ⏳ |
| 📌 HANDOFF mở: `C02` · `C04`–`C11` | ⏳ |

---

## TEST-20261007-C18 — Đo **GIÁ TRỊ THẬT TRONG CSDL** qua bảng nhãn + cổng C09 (4 ca)

### 18.1 PHÉP ĐO MỚI: quét **CSDL THẬT** thay vì quét mã nguồn
```
① liệt kê 62 cột trạng thái:  information_schema.columns WHERE column_name LIKE '%status%'|'%state%'|'%_result%'
② SELECT DISTINCT <cột> FROM <bảng>        (⛔ CHỈ ĐỌC — mysql -uvntech vntech_erp --batch)
③ đưa TỪNG giá trị qua bảng nhãn dùng chung (chạy thật `lib/status-labels.ts` bằng esbuild)
```
**KẾT QUẢ**: 22 giá trị trạng thái · **3 giá trị RÒ TIẾNG ANH**:
| Bảng.cột | Giá trị | Nhãn TRƯỚC | Nhãn SAU |
|---|---|---|---|
| `goods_receipts.bch_confirmation_status` | `confirmed` | ⛔ «Confirmed» | «BCH đã xác nhận» ✅ |
| `goods_receipts.qc_status` | `accepted` | ⛔ «Accepted» | «Đạt» ✅ |
| `goods_receipts.qc_status` | `passed` | ⛔ «Passed» | «Đạt» ✅ |
| (mọi cột còn lại) | — | ✅ nhãn tiếng Việt hết | không đổi |

### 18.2 ⚠️ NHƯNG **⛔ CHƯA RÒ RA MÀN HÌNH** — đo tiếp **5 call site**
`Inventory.tsx` · `PurchaseOrderDrawer.tsx` (**2 chỗ**) · `ReceiptDrawer.tsx` (**2 chỗ**) · `app/page.tsx` — **tất cả đều dịch TAY** bằng ternary
(`qcStatus === "accepted" ? "Đạt" : "Không đạt"`, `bchConfirmationStatus === "confirmed" ? "BCH đã xác nhận" : …`)
⇒ ⭐ Phân loại đúng: **LỖ HỔNG TIỀM ẨN + TRÙNG LẶP 5 CHỖ** (⛔ không phải lỗi đang thấy trên màn hình).

### 18.3 BẢN VÁ + QUYẾT ĐỊNH AN TOÀN
- Thêm 2 domain: `bch_confirmation` (`pending`/`confirmed`/`rejected`) · `qc_result` (`pending`/`accepted`/`passed`/`rejected`/`failed`).
  ⭐ Tên `qc_result` **khớp cột thật** `goods_receipt_items.qc_result` (đo được).
- ⛔ **KHÔNG** đưa 2 domain mới vào `DOMAIN_LOOKUP_ORDER` — chúng chứa mã **DÙNG CHUNG** (`pending` · `rejected`);
  đưa vào thứ tự **tra chéo** sẽ **ĐỔI NHÃN của mã dùng chung ở nơi khác** ⇒ ⚠️ **HỒI QUY** ⇒ giữ **0 thay đổi** cho nhãn đang chạy.
- ⛔ **KHÔNG** sửa 5 call site (thuộc S01/S02) — §41: ⛔ không refactor tệp phiên khác.

### 18.4 CỔNG C09 — **4/4 PASS**
| Ca | Nội dung | Kết quả |
|---|---|---|
| `C09-1` | 3 giá trị CSDL nay có nhãn tiếng Việt **+ đối chứng âm** (`statusLabel("confirmed")` ⛔ vẫn «Confirmed» khi ⛔ không truyền domain = đúng thiết kế) | ✅ |
| `C09-2` | ⛔ 2 domain mới **không được** có trong `DOMAIN_LOOKUP_ORDER` | ✅ |
| `C09-3` | **snapshot 21 nhãn ĐO ĐƯỢC** (chống hồi quy) + `pending`/`rejected` ⛔ không lấy nhãn domain mới | ✅ |
| `C09-4` | mã lạ ⛔ không lộ mã thô · `"—"` cho rỗng/null · chuỗi tiếng Việt **giữ nguyên** | ✅ |

### 18.5 ⚠️ TỰ ĐÍNH CHÍNH **2 LẦN** TRONG CHÍNH CA NÀY (⛔ ghi thẳng)
Snapshot đầu tôi **đoán theo trí nhớ** ⇒ **SAI 2 lần**:
| Mã | Tôi đoán | **ĐO ĐƯỢC** | Xử lý |
|---|---|---|---|
| `complete` | «Hoàn thành» | «**Đã có**» | ⭐ thêm phép đo CSDL: **quét 62 cột** ⇒ `complete` **CHỈ** ở `certificate_status` · `delivery_document_status` · `document_status` ⇒ «Đã có» **ĐÚNG** |
| `in_progress` | «Đang thực hiện» | «**Đang xử lý**» | ⭐ sửa snapshot theo **giá trị ĐO ĐƯỢC** |
⭐ **LUẬT**: **snapshot PHẢI ĐO, ⛔ không được viết theo trí nhớ** — đã ghi ngay trong ca kiểm.

### 18.6 Phát hiện thêm (⛔ KHÔNG phải lỗi)
`statusLabel("locked")` → «**Locked**» (tiếng Anh) ⚠️ **NHƯNG** đã kiểm CSDL: `locked` ⛔ **KHÔNG** là giá trị trạng thái của cột nào
⇒ ⛔ không phải rò rỉ đang chạy ⇒ ⛔ **KHÔNG** thêm nhãn và ⛔ **KHÔNG** đưa vào snapshot (tránh "khoá" một nhãn tiếng Anh).

### 18.7 Build lần 9 + xác minh LIVE
| Lệnh | Kết quả | Exit |
|---|---|---|
| `npm run test:regression` | **851 test · 850 pass · 0 fail · 1 skip** | `0` |
| `gd-cycle` lần 9 «SESSION 03 NAN TRANG THAI QC BCH» | **ĐẠT** · vân tay **`VNTECH-FP-F3C1C8BA4CECE009`** (735 files) · `drizzle/0338_…` | `0` |
| `node tools/verify-ui-build-applied.mjs` | ✓ dist mới hơn nguồn · ✓ HTML khớp SSOT (`f3c1c8ba…`) · ✓ 6/6 bundle đúng byte | `0` |
| `:8787` · `:9000` | **HTTP 200** · **HTTP 200** | — |
| **Bundle đang phục vụ** | ✅ có nhãn MỚI «BCH đã xác nhận» · «Chờ kiểm tra» **và** ⛔ không mất nhãn CŨ («Không đạt» · «Đã có» · «Khẩn cấp») | — |

### 18.8 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ⏳ USER nghiệm thu (⚠️ **thay đổi này ⛔ không đổi gì nhìn thấy** — là **phòng ngừa tại nguồn** + **khoá hồi quy**) | ⏳ |
| 📌 HANDOFF mở: `C02` · `C04`–`C11` | ⏳ |

### 7.5 ⚠️ GHI NHẬN PHỐI HỢP ĐA PHIÊN (⛔ không nhận xét thay ai)
- Trong lúc phiên 03 làm, `:8787` do **tiến trình khác** phục vụ (job UI của phiên 03 bị dừng) và
  **baseline định danh đầu vào** của build lần 5 là `VNTECH-FP-0FFB3FBAE76F4098` — ⛔ **không phải** số phiên 03
  build gần nhất (`810CCA1455FA48BD`) ⇒ **một phiên khác đã chạy `gd-cycle` xen giữa**.
  ⇒ Ghi nhận khách quan; ⛔ phiên 03 không kết luận ai làm gì. Vân tay **hiện hành** do phiên 03 chốt: **`852E28FC276F90F6`**.

| Ca | Cách làm | Trạng thái |
|---|---|---|
| Sửa **CCCD** ở tab «Thông tin cá nhân» ⇒ lưu thành công, ⛔ không còn lỗi «… là bắt buộc» | mở `:9000` → `dept_legal_hr` → nút **Sửa** → tab **Thông tin cá nhân** → sửa Số CCCD → **Lưu hồ sơ** | ⏳ **CHỜ USER** |
| Sửa **Họ tên/Email/Phòng ban** ở tab «Thông tin user» ⇒ vẫn đồng bộ tài khoản như cũ | cùng modal → tab **Thông tin user** → sửa → Lưu | ⏳ **CHỜ USER** |
| Màn **Tổ đội** ⇒ không còn card «Nguồn dữ liệu của 6 tab» và dòng ghi nguồn CSDL | mở menu Tổ đội → mở 1 tổ đội → xem 5 tab | ⏳ **CHỜ USER** |

> ⛔ **Trung thực**: các ca trên cần **thao tác chuột + đăng nhập thật** nên phiên này **chưa** chạy được
> bằng chứng cuối; ⛔ **không** tuyên bố `VERIFIED` khi chưa có xác nhận của user.

---

## TEST-20261007-C04 — Cổng UTF-8 cho mọi đường xuất (có ĐỐI CHỨNG ÂM) + xác minh LIVE

### 4.1 Cổng mới — `tests/mt3-c03-export-utf8.test.mjs`

| Ca | Nội dung | Kết quả |
|---|---|---|
| 1 | **XLSX chạy thật**: dựng `.xlsx` → `unzipSync` → `sheet1.xml`/`workbook.xml` giữ nguyên dấu tiếng Việt + khai `encoding="UTF-8"` + chặn mojibake Latin-1 + ô số ghi dạng số | ✅ PASS |
| 2 | `csvText` giữ dấu · nhân đôi `""` · có dòng `sep=;` | ✅ PASS |
| 3 | `downloadCsv` **bắt buộc** `"\ufeff"` + `text/csv;charset=utf-8` | ✅ PASS |
| 4 | **Quét đệ quy `public/**`**: mọi `.csv` phải có BOM + UTF-8 hợp lệ | ✅ PASS |
| 5 | **Chỉ** `lib/tabular-export.ts` được phát `text/csv` | ✅ PASS |
| | Tổng | **5 test · 5 pass · 0 fail** (exit 0) |

### 4.2 ⭐ ĐỐI CHỨNG ÂM (chứng minh cổng CÓ RĂNG, ⛔ không phải test trang trí)
Thêm tạm tệp `public/templates/__negctrl_no_bom.csv` (**cố ý không BOM**) rồi chạy lại cổng:
```
ℹ pass 4
ℹ fail 1
  templates/__negctrl_no_bom.csv — THIẾU BOM (Excel sẽ hiện sai dấu tiếng Việt)
```
⇒ Cổng **ĐỎ đúng 1 ca** và **nêu ĐÍCH DANH tệp vi phạm** ⇒ nếu tệp mẫu thiếu BOM quay lại, cổng sẽ chặn.
Tệp tạm **đã xoá** ngay sau đó (kiểm lại: `Test-Path` = `False`).

### 4.3 Cổng tĩnh sau thay đổi (số ĐO ĐƯỢC)
| Lệnh | Kết quả | Exit |
|---|---|---|
| `npx tsc --noEmit` | **0 lỗi** | `0` |
| `npx eslint tests/mt3-c03-export-utf8.test.mjs lib/tabular-export.ts …` | **0 lỗi** (sau khi sửa 1 lỗi `no-assign-module-variable` do tôi đặt tên biến `module`) | `0` |
| `npm run test:regression` | **816 test · 815 pass · 0 fail · 1 skip** | `0` |
| `node scripts/template-preflight.mjs` (trước khi sửa) | ĐẠT · 5 XLSX + 4 CSV — ⚠️ **cổng này ⛔ KHÔNG kiểm BOM** ⇒ vì sao lỗi tồn tại lâu | `0` |

### 4.4 XÁC MINH LIVE (đo trên bản ĐANG PHỤC VỤ, sau build lại)
| Phép đo | Kết quả |
|---|---|
| `:8787` · `:9000` | **HTTP 200** · **HTTP 200** |
| `GET /templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv` trên **cả 2 cổng** | **244 B · BOM = True** ✅ (trước build: 241 B · BOM = False ⛔) |
| `GET /templates/Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.csv` trên **cả 2 cổng** | **1178 B · BOM = True** ✅ |
| Bundle `:9000` — hồi quy 2 hotfix vòng 1 | ✅ còn «Hồ sơ nhân sự ĐÃ lưu» · ✅ còn «Phiếu cấp phát & hoàn trả của tổ đội» · ⛔ không còn «Nguồn dữ liệu của 6 tab» |
| Build `gd-cycle` | PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT** · vân tay **`VNTECH-FP-B28418CE305E837E`** (722 files) · exit `0` |

### 4.5 CÒN LẠI — chờ USER
| Ca | Cách làm | Trạng thái |
|---|---|---|
| Bấm **«⇩ Mẫu CSV»** ở Danh mục vật tư → mở bằng Excel ⇒ **đúng dấu** | `:9000` → Danh mục vật tư → Mẫu CSV | ⏳ **CHỜ USER** |

---

## TEST-20261007-C19 — Định dạng NGÀY: đo 4 chỗ in thô + vá + cổng C10 (4 ca)

### 19.1 PHÉP ĐO (quét `app/screens/**`)
Lọc `{row|r|item|receipt|po|v.<…At|…Date>}` **ở vị trí VĂN BẢN JSX** (⛔ loại trừ thuộc tính `value=`/`defaultValue=`/`name=` của ô nhập liệu):
| Tệp | Chỗ in thô | Kết luận |
|---|---|---|
| `Payments.tsx` | `{row.paymentDate}` ×2 (cột «Ngày» + «Đến hạn: …») | ⛔ in thô |
| `DocumentsScreen.tsx` | `{r.voucherDate}` (cột «Ngày chứng từ») | ⛔ in thô |
| `ProjectTeams.tsx` | `{r.paymentDate}` (ngày thanh toán) | ⛔ in thô |
| ⭐ **DẤU HIỆU CHÍ MẠNG** | **cả 3 tệp ĐÃ `import { … date … }` nhưng GỌI `date(...)` 0 LẦN** | ⭐ **quên dùng**, ⛔ không phải thiếu tiện ích |

**Kết quả hiển thị**: ngày lưu ở CSDL là **text `YYYY-MM-DD`** ⇒ màn hình hiện **`2026-10-07`**, trong khi **mọi nơi khác** hiện **`07/10/2026`**
(`date()` = `Intl.DateTimeFormat("vi-VN", {day:"2-digit",month:"2-digit",year:"numeric"})`) ⇒ ⚠️ **KHÔNG NHẤT QUÁN ĐỊNH DẠNG NGÀY**.

### 19.2 BẢN VÁ (diff tối thiểu)
Bọc `date(...)` cho **4 chỗ** — ⛔ **không thêm import** (đã có sẵn) · ⛔ không đổi dữ liệu · ⛔ không đổi `<input type="date">` (vẫn ISO theo chuẩn HTML).

### 19.3 CỔNG C10 — **4/4 PASS**
| Ca | Nội dung | Kết quả |
|---|---|---|
| `C10-1` | ⛔ không màn nào trong `app/screens/**` in ngày thô | ✅ PASS |
| `C10-2` | `date()` phải `vi-VN` + ngày/tháng 2 chữ số, năm 4 chữ số + rỗng ⇒ `—` + sai ⇒ **nguyên chuỗi** (⛔ không «Invalid Date») + có `T` ⇒ thêm **giờ:phút** | ✅ PASS |
| `C10-3` | 4 chỗ đã vá **thực sự** gọi `date(...)` **và** 3 tệp ⛔ không còn cảnh `import` mà gọi 0 lần | ✅ PASS |
| `C10-4` | ⭐ **ĐỐI CHỨNG ÂM**: bộ dò **PHẢI bắt** `<td>{row.paymentDate}</td>` (1 hit) · ⛔ **KHÔNG** bắt nhầm ô nhập liệu (`defaultValue={r.paymentDate}`) · ⛔ **KHÔNG** bắt chỗ đã bọc `date(...)` | ✅ PASS |

### 19.4 Cổng tĩnh + hồi quy + build
| Lệnh | Kết quả | Exit |
|---|---|---|
| `node --test tests/mt3-c10-date-format.test.mjs` | **4 test · 4 pass · 0 fail** | `0` |
| `npx tsc --noEmit` · `npx eslint` (4 tệp) | **0** · **0 error** (⚠️ 1 warning `'open' is defined but never used` — **có sẵn**, ⛔ không do lượt này) | `0` |
| `npm run test:regression` | **855 test · 854 pass · 0 fail · 1 skip** | `0` |
| `gd-cycle` lần 10 | **ĐẠT** · vân tay **`VNTECH-FP-344D1DA5553CCA1E`** (737 files) · `drizzle/0339_…` | `0` |
| `node tools/verify-ui-build-applied.mjs` | ✓ dist mới hơn nguồn · ✓ HTML khớp SSOT (`344d1da5553cca1e`) · ✓ 6/6 bundle đúng byte | `0` |
| `:8787` · `:9000` | **HTTP 200** · **HTTP 200** | — |

### 19.5 ⛔ XÁC MINH DOM SỐNG: **KHÔNG HOÀN THÀNH ĐƯỢC** (nói thẳng)
Thử **2 lượt** đo trên UI thật để đếm ngày `dd/mm/yyyy` vs `yyyy-mm-dd` ⇒ **⛔ không tới được màn** vì
⭐ **nhóm menu «TÀI CHÍNH – KẾ TOÁN» ⛔ KHÔNG render mục con** khi bấm (`mở màn: KHONG_THAY`; nhãn sau khi bấm **chỉ có chính nhóm đó**).
⚠️ **Chưa xác định** là (a) **giới hạn của probe** (cần hover/mũi tên) hay (b) **nhóm menu rỗng THẬT** ⇒ ⛔ **không kết luận, không sửa**.
⇒ **Phân loại đúng**: ✅ **đã vá mã + cổng C10 + build + parity** (bằng chứng **tĩnh** đầy đủ) · ⚠️ **chưa có xác nhận DOM sống**.
⏳ **Chờ user nhìn màn «Sổ thanh toán hợp đồng» / «Chứng từ»** — nếu còn thấy `2026-10-07` thì báo lại ngay.

### 19.6 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ⏳ USER kiểm: màn thanh toán/chứng từ hiện ngày `dd/mm/yyyy` | ⏳ |
| ⚠️ Làm rõ: nhóm menu «TÀI CHÍNH – KẾ TOÁN» có mục con hay không (probe hay lỗi thật) | ✅ **ĐÃ LÀM RÕ ở §C20 — GIỚI HẠN PROBE, ⛔ không phải lỗi UI** |

---

## TEST-20261007-C20 — ⭐ XÁC MINH DOM SỐNG (đã xong) + **ĐÍNH CHÍNH**: «nhóm menu rỗng» là **giới hạn PROBE**

### 20.1 ⭐ XÁC MINH DOM SỐNG CHO BẢN VÁ ĐỊNH DẠNG NGÀY — **ĐÃ HOÀN THÀNH** (§19.5 nay đóng)
| Bước | Kết quả ĐO ĐƯỢC |
|---|---|
| Vào màn | bấm mục «**Thanh toán HĐ**» (mở nhóm bằng chevron — xem §20.2) |
| ⭐ **Kiểm TIÊU ĐỀ màn (`h1`)** — ⛔ không tin nhãn đã bấm | `["Thanh toán HĐ", "TỶ LỆ THANH TOÁN THEO HỢP ĐỒNG", "CÁC KHOẢN THANH TOÁN SẮP ĐẾN HẠN"]` ✅ |
| Đếm ngày trong `document.body.innerText` | **ISO `yyyy-mm-dd`: 0** ✅ · **`dd/mm/yyyy`: 4** ✅ |
| Mẫu ngày hiện ra | `30/06/2026` · `15/02/2026` · `30/06/2026` · `15/02/2026` |

⇒ ⭐ **BẢN VÁ ĐỊNH DẠNG NGÀY ĐÃ ĐƯỢC XÁC NHẬN TRÊN UI THẬT**: màn thanh toán **⛔ không còn `2026-10-07`**, hiện **`dd/mm/yyyy`**.
⇒ `TASK-20261007-C19` chuyển **`FIXED` → `VERIFIED`** (FIXED + **RECHECK trên UI thật** — §24). ⚠️ Phép đếm phủ **1 màn**;
2 màn còn lại (`DocumentsScreen` · `ProjectTeams`) dùng **cùng hàm `date()`** + **cùng cổng `C10`** ⇒ ⛔ không đo lặp vô ích.

### 20.2 ⛔⛔ **ĐÍNH CHÍNH PHÁT HIỆN CỦA CHÍNH TÔI (§19.5 / `SHARED_STATE` §62)** — «nhóm menu rỗng» là **GIỚI HẠN CỦA PROBE**
**Tôi từng ghi**: *«nhóm «TÀI CHÍNH – KẾ TOÁN» ⛔ không render mục con ⇒ chưa rõ giới hạn probe hay lỗi thật»*.
**ĐO LẠI ⇒ ⛔ KHÔNG PHẢI LỖI UI** — **7 mục con CÓ THẬT**, chỉ hiện khi mở nhóm **đúng cách**:
```
Nút nhóm:  button.nav-parent , aria-expanded="false"   (nhãn hiển thị «…⌄»)
Bấm NÚT CHEVRON (⛔ KHÔNG bấm NHÃN) ⇒ aria-expanded = "true" , nhãn → «…⌃»
⇒ hiện 7 mục: Kế hoạch thanh toán · Tạm ứng / Hoàn ứng · Chi phí Ban chỉ huy
              · Sổ quỹ & Ngân hàng · Chứng từ kế toán · Thanh toán / Quyết toán · Thanh toán HĐ
```
⭐ **NGUYÊN NHÂN SAI CỦA TÔI**: các lượt trước tôi bấm **phần tử chứa NHÃN nhóm** ⇒ ⛔ **không kích hoạt mở nhóm** ⇒ con **⛔ không render**
⇒ tôi tưởng «nhóm rỗng». ⚠️ Đây là **báo động giả thứ 6** của phiên — ⛔ **không phải lỗi sản phẩm, ⛔ không sửa gì**.
⭐ **CÁCH LÀM ĐÚNG (ghi để tái sử dụng)**: mở nhóm bằng **`button.nav-parent`** · xác nhận bằng **`aria-expanded="true"`** ·
sau khi bấm mục thì **kiểm `h1/h2`** để chắc đã tới đúng màn.

### 20.3 Hệ quả cho các phép quét trước (§C16)
⚠️ Vì nhóm **⛔ không tự mở**, các lượt «quét 22 màn» trước đây **một phần đo lại màn cũ** (màn nằm trong nhóm chưa mở).
⇒ ⛔ **KHÔNG** dùng con số «22 màn» như bằng chứng tuyệt đối. ✅ Kết luận của §C16 (**lớp lỗi cắt nội dung đã đóng**) **vẫn đúng**
vì dựa trên **họ khối `.kpi` đo được trên màn THẬT ĐÃ TỚI**, ⛔ không dựa vào số lượng màn.

### 20.4 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ⏳ USER nghiệm thu (màn thanh toán **đã ĐO được** là `dd/mm/yyyy`) | ⏳ |
| 📌 HANDOFF mở: `C02` · `C04`–`C11` | ⏳ |

---

## TEST-20261007-C21 — Quét lại ĐÚNG CÁCH (chevron + xác nhận tiêu đề): **3 lần thử, ⛔ chưa phủ hết màn**

### 21.1 Mục tiêu
Vì §C20 phát hiện các lượt quét trước **một phần đo lại màn cũ** (nhóm menu ⛔ không tự mở), vòng này quét lại theo cách đúng:
**mở hết nhóm bằng `button.nav-parent`** → bấm từng mục → ⭐ **xác nhận `h1` ĐỔI** mới tính là «đã tới màn» → chạy 2 máy dò.

### 21.2 Kết quả 3 lần thử (⛔ ghi thẳng cả thất bại)
| Lần | Cách chọn mục menu | Kết quả |
|---|---|---|
| 1 | `.sidebar button, .sidebar a` | chỉ ra **8 mục** ⇒ ⚠️ hầu hết mục menu **⛔ không phải `<button>/<a>`** |
| 2 | lớp của dự án (`.nav-child`, `.nav-single-direct`, `.nav-dashboard-direct`, …) | chỉ ra **7 mục** ⇒ ⚠️ markup menu hiện tại **⛔ khác các lớp cũ** |
| 3 | mọi phần tử `.sidebar *` (≤2 con) + bấm **theo CHỈ SỐ** | ra **31 ứng viên** ⚠️ **nhưng chỉ tới được 1 màn**: sidebar **render lại sau mỗi lần bấm** ⇒ ⛔ chỉ số cũ **hỏng**, vòng lặp dừng sớm |

### 21.3 ⭐ BẰNG CHỨNG CHỐT ĐƯỢC (vẫn có giá trị)
| Phát hiện | Số đo |
|---|---|
| **7 khối bị cắt — TẤT CẢ là `.kpi`** (2 màn: Tổng quan điều hành · Trung tâm phê duyệt) | `kpi-blue 201/210` · `kpi-green 201/207` · `kpi-violet 201/207` · (trung tâm) `171/179` ×4 |
| ⭐ **TÁI LẬP ĐƯỢC với SỐ Y HỆT** lượt quét vòng 15 (`201/210` · `171/179`) | ⇒ ⭐ **⛔ không phải nhiễu tạm thời** ⇒ **củng cố `HANDOFF-20261007-C10`** (rủi ro thật, ổn định) |
| **Lỗi văn bản** (`null`/`undefined`/`NaN` · ngày ISO · số thô) trên các màn **đã tới** | ✅ **0** (gồm «Nhà cung cấp» · «Đối tác» · «Tổng quan điều hành» · «Trung tâm phê duyệt») |

### 21.4 ⛔ GIỚI HẠN (⛔ nói thẳng, ⛔ không tô hồng)
⛔ **CHƯA phủ hết màn**: 3 lần thử **chưa** tới được các màn trong nhóm Tài chính / Hành chính / Báo cáo / Quản trị / Kho / Tổ đội… bằng vòng lặp tự động.
⇒ ⛔ **KHÔNG** báo cáo «quét toàn bộ màn hình = sạch»; ⭐ chỉ được nói: **các màn ĐÃ TỚI thì sạch (trừ họ `.kpi` đã có HANDOFF)**.

### 21.5 ⭐ ĐỀ XUẤT CHO PHIÊN SAU (⛔ đừng lặp lại 3 lần thử như tôi)
| Vấn đề | Cách làm đúng |
|---|---|
| Sidebar **render lại** sau mỗi lần bấm ⇒ chỉ số hỏng | ⛔ **KHÔNG** bấm theo chỉ số — mỗi vòng **truy vấn LẠI theo văn bản nhãn** rồi mới bấm |
| Bấm **nhãn nhóm** ⛔ không điều hướng | mở nhóm bằng **`button.nav-parent`** + xác nhận **`aria-expanded="true"`** |
| Không biết đã tới màn nào | ⭐ so **`h1` TRƯỚC/SAU** mỗi lần bấm; chỉ tính khi **tiêu đề ĐỔI** |
| Muốn phủ **toàn bộ** màn | dùng cổng có sẵn của dự án `tools/probe-visual-regression.mjs` (+ làm mới ảnh chuẩn) ⚠️ `tools/**` **không thuộc phiên 03** |

### 21.6 Việc còn lại
| Việc | Trạng thái |
|---|---|
| Họ thẻ KPI bị cắt (đã tái lập lần 2, số y hệt) | ⚠️ **`HANDOFF-20261007-C10`** (đã bổ sung bằng chứng tái lập) |
| Phủ nốt các màn còn lại bằng vòng lặp đúng cách | ⏳ vòng sau |
| 📌 HANDOFF mở: `C02` · `C04`–`C11` | ⏳ |
| 📌 HANDOFF mở: `C02` · `C04`–`C11` | ⏳ |

---

## TEST-20261007-C22 — Sweep v4/v5: ⭐ **phát hiện màn THỨ 3** cùng họ lỗi KPI + ⛔ **DỪNG sweep sau 5 lần thử**

### 22.1 ⭐ PHÁT HIỆN MỚI CÓ GIÁ TRỊ
| Phát hiện | Số đo ĐƯỢC |
|---|---|
| ⭐ **MÀN THỨ 3 cùng họ lỗi cắt thẻ KPI**: «**KPI & hiệu suất nhân viên**» | `kpi-green 156/164` · `kpi-red 156/164` (**cắt 8px**, 2 thẻ) |
| ✅ **Màn MỚI lần đầu tới được** — «**Báo cáo tổng hợp**» (bấm «Báo cáo & cảnh báo») | ⛔ 0 khối bị cắt · ⛔ 0 lỗi văn bản ⇒ **SẠCH** |
| ✅ «Nhà cung cấp» (kiểm lại) · «Tổng quan điều hành» · «Trung tâm phê duyệt» | `.kpi` bị cắt (**đã có HANDOFF-C10**) · ⛔ **0 lỗi văn bản** |

⇒ ⭐ **`.kpi` bị cắt giờ đo được ở ≥ 3 màn khác nhau** (`Tổng quan điều hành` · `Trung tâm phê duyệt` · `KPI & hiệu suất nhân viên`)
⇒ **NÂNG MỨC `HANDOFF-20261007-C10`**: đây là lỗi **HỆ THỐNG của họ thẻ `.kpi`** (⛔ không phải từng màn riêng lẻ) — ⭐ **cần xử lý ở CSS `.kpi`** (1 chỗ) là hết cho cả 3+ màn.

### 22.2 ⛔⛔ DỪNG SWEEP TỰ ĐỘNG — **5 lần thử, ⛔ ghi thẳng cả 5 thất bại**
| Lần | Cách | Vì sao ⛔ thất bại |
|---|---|---|
| 1 | `.sidebar button, a` | chỉ 8 mục — mục menu ⛔ không phải button/a |
| 2 | lớp cũ `.nav-child`/`.nav-single-direct` | chỉ 7 mục — markup khác |
| 3 | mọi `.sidebar *` + bấm **theo CHỈ SỐ** | 31 ứng viên, **tới 1 màn** — sidebar **render lại** ⇒ chỉ số hỏng |
| 4 | **theo VĂN BẢN** nhãn (khớp chính xác) | **tới 5 màn** rồi dừng — nhãn **có SỐ ĐẾM** («Trung tâm phê duyệt**7**») ⇒ ⛔ khớp chính xác trượt |
| 5 | theo văn bản **đã BỎ CHỮ SỐ** | **chỉ 3 màn** — ⚠️ bỏ số làm **lẫn nhãn NHÓM vào danh sách mục lá** ⇒ bấm nhãn nhóm ⛔ không điều hướng ⇒ mất lượt |

⭐ **KẾT LUẬN KỸ THUẬT (để ⛔ không ai thử lần 6 như tôi)**: vòng lặp dựa trên **NHÃN MENU** ⛔ không ổn định vì nhãn **đổi theo dữ liệu** (số đếm) và **lẫn nhãn nhóm**.
**Cách làm ĐÚNG** (khuyến nghị): đối chiếu theo **`h1` MÀN ĐÍCH** (duyệt danh sách tiêu đề màn mong đợi) ⛔ **không** dựa vào nhãn menu;
hoặc dùng **`data-nav-key`/`data-nav`** nếu có; hoặc dùng cổng có sẵn `tools/probe-visual-regression.mjs` (+ làm mới ảnh chuẩn) ⚠️ `tools/**` ⛔ không thuộc phiên 03.

### 22.3 ⛔ GIỚI HẠN (⛔ không tô hồng)
⛔ **Chưa phủ hết màn** (Tài chính · Hành chính · Quản trị · Kho · Tổ đội · Dự án…).
⭐ Được phép nói: **màn ĐÃ TỚI**: «Nhà cung cấp» · «Báo cáo tổng hợp» **SẠCH**; 3 màn có `.kpi` bị cắt (**đã có HANDOFF-C10**);
⛔ **0 lỗi văn bản** trên mọi màn đã tới.

### 22.4 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ⭐ Họ thẻ `.kpi` bị cắt — nay **≥3 màn** ⇒ sửa **1 chỗ ở CSS `.kpi`** | ⚠️ **`HANDOFF-20261007-C10`** (**đã nâng mức: lỗi hệ thống**) |
| Phủ nốt các màn — **theo `h1` màn đích**, ⛔ không theo nhãn menu | ⏳ vòng sau |
| 📌 HANDOFF mở: `C02` · `C04`–`C11` | ⏳ |

---

## TEST-20261007-C23 — CHỐT root cause `.kpi` bị cắt + **chỗ sửa** + **tiền lệ trong repo**

### 23.1 ĐO CHUỖI CHA của thẻ `.kpi` (1440×900 · màn «Tổng quan điều hành»)
```
thẻ  .kpi                  : clientHeight=201 · scrollHeight=210 ⇒ CẮT 9px
                             min-height cấu hình 112/122/124/156px · overflow:hidden
dải  (cha, chứa 4 thẻ)     : h=203 · display=grid · gridTemplateRows GIẢI RA = 203.203px (1 hàng)
                             kids=4 · overflow-y=hidden
cha  .dashboard-main-column: display=grid · rows = 203.203px 776.922px 311.75px
```

### 23.2 ROOT CAUSE (đo được — ⛔ không suy đoán)
`.kpi { overflow: hidden }` ⇒ theo chuẩn CSS **kích thước tối thiểu tự động = 0** ⇒ **hàng của `.kpi-grid` (grid) bị CO xuống vừa khung**
thay vì giãn theo nội dung ⇒ **cắt ~8–9px** ở đáy thẻ. ⚠️ **CÙNG CƠ CHẾ** với `BUG-20261007-C07` (modal GRN) ⇒ ⭐ **cách vá đã kiểm chứng**.

### 23.3 ⭐⭐ TIỀN LỆ TRONG CHÍNH REPO (⛔ đừng phát minh cách mới)
Repo **ĐÃ sửa đúng lỗi này** cho biến thể `.approved-kpi-grid` (`app/globals.css`):
```css
.approved-kpi-grid .kpi .kpi-content p { white-space:normal!important; overflow:visible!important;
  text-overflow:clip!important; display:block!important; line-height:1.35!important; min-height:2.7em!important }
```
⇒ ⭐ **TÁI DÙNG CHÍNH CÁCH ĐÓ cho `.kpi-grid` (mặc định)**: cho mô tả **xuống dòng** + chừa `min-height` ⇒ thẻ đủ chỗ, hết cắt.

### 23.4 HAI HƯỚNG SỬA (chọn **1**, ⛔ KHÔNG làm cả hai) — ⛔ **phiên 03 KHÔNG tự sửa**
| Hướng | Nội dung | Ghi chú |
|---|---|---|
| **A (khuyến nghị — theo tiền lệ)** | thêm quy tắc `.kpi-grid .kpi .kpi-content p` giống `.approved-kpi-grid` | ⛔ không đổi bố cục lưới · **đã có tiền lệ chạy tốt** trong repo |
| **B (theo cách phiên 03 đã kiểm chứng ở modal GRN)** | `grid-auto-rows: max-content` cho `.kpi-grid` | ⚠️ có thể làm dải KPI **cao thêm vài px** ở màn có mô tả dài ⇒ phải kiểm lại 3 màn |

⛔ **CHỖ SỬA ⛔ KHÔNG THUỘC PHIÊN 03**: CSS ở **`app/globals.css`** (dùng chung) · markup dải KPI ở **`app/page.tsx`** (**LOCK S01**)
⇒ theo **cảnh báo conflict của user**, phiên 03 ⛔ **không tự sửa** ⇒ đã ghi đầy đủ vào **`HANDOFF-20261007-C10`**.

### 23.5 TEST REQUIRED (đo được, ⛔ không cảm tính)
Sau khi sửa: mở 3 màn, đọc `clientHeight` vs `scrollHeight` **từng** `article.kpi` ⇒ kỳ vọng **⛔ 0 thẻ có `scrollHeight > clientHeight + 4`**:
· Tổng quan điều hành (`201/210` · `201/207`) · Trung tâm phê duyệt (`171/179` ×4) · KPI & hiệu suất nhân viên (`156/164` ×2).

### 23.6 Việc còn lại
| Việc | Trạng thái |
|---|---|
| Sửa họ `.kpi` (2 hướng ở §23.4) | ⛔ **THU HỒI — xem §24**: ⛔ **KHÔNG SỬA** (⛔ không có chữ nào bị cắt) |
| 📌 HANDOFF mở: `C02` · `C04`–`C11` | ⏳ |

---

## TEST-20261007-C24 — ⛔⛔ **THU HỒI `HANDOFF-C10`**: «cắt chữ mô tả» là **SUY DIỄN SAI** — thủ phạm là **hoạ tiết trang trí**

### 24.1 PHÉP ĐO QUYẾT ĐỊNH — đo **TỪNG CON** trong thẻ `.kpi` (⛔ không chỉ đo thẻ)
| Thẻ | `clientHeight` / `scrollHeight` | Phần tử **DUY NHẤT** vượt đáy thẻ | Nội dung |
|---|---|---|---|
| 0 | 201 / **210** (Δ9) | **`<i>`** · cao **4px** · `position: static` · `display: block` · **`txt = ""`** · vượt **8px** | ⛔ **RỖNG — hoạ tiết** |
| 1 | 201 / **207** (Δ6) | **`<i>`** · 4px · **rỗng** · vượt **5px** | ⛔ **RỖNG — hoạ tiết** |
| 2 | 201 / **207** (Δ6) | **`<i>`** · 4px · **rỗng** · vượt **5px** | ⛔ **RỖNG — hoạ tiết** |

### 24.2 ⭐ DANH TÍNH CỦA `<i>` — **CỘT BIỂU ĐỒ MINI TRANG TRÍ** (đo trong CSS)
```css
.kpi-mini-columns i { width:5px; min-height:4px; border-radius:2px 2px 0 0; background:currentColor; opacity:.88 }
.kpi-sparkline { display:none!important }   /* sparkline đã bị ẩn toàn cục ⇒ hoạ tiết đang dùng là mini-columns */
```
⇒ **KẾT LUẬN**: phần vượt đáy **8/5/5px** là **vài px cuối của cột biểu đồ mini** bị `.kpi { overflow:hidden }` cắt — ⛔ **KHÔNG có CHỮ nào bị cắt** ⇒ **gần như chắc chắn là CỐ Ý**.

### 24.3 ⛔⛔ **THU HỒI KẾT LUẬN CŨ CỦA TÔI** (⛔ tự nhận, ⛔ không che)
| | Nội dung |
|---|---|
| **Tôi đã nói** (vòng 15/20/21/22) | «họ thẻ `.kpi` bị **CẮT chữ mô tả**» · «**LỖI HỆ THỐNG, ưu tiên cao**, sửa 1 chỗ CSS» · «đã nâng mức `HANDOFF-C10`» |
| **SỰ THẬT (đo lại)** | ⛔ **KHÔNG có chữ nào bị cắt** — chỉ **hoạ tiết trang trí** bị cắt vài px ⇒ ⛔ **KHÔNG phải lỗi người dùng thấy được** |
| **LỖI PHƯƠNG PHÁP CỦA TÔI** | Tôi dùng **`scrollHeight > clientHeight`** làm **BẰNG CHỨNG «cắt nội dung»** rồi **suy diễn** ra «cắt CHỮ» — ⭐ **chỉ số đó ⛔ không nói PHẦN TỬ NÀO vượt, cũng ⛔ không nói có CHỮ hay không** |
| **HÀNH ĐỘNG ĐÚNG ĐÃ LÀM** | ⛔ **THU HỒI `HANDOFF-20261007-C10`** (đã chèn khối ⛔ «ĐỪNG SỬA» ngay dưới tiêu đề) ⇒ ⛔ **KHÔNG sửa `.kpi`/`.kpi-grid`** |

### 24.4 ⭐ LUẬT MỚI (đã ghi `SHARED_STATE` §73)
**`scrollHeight > clientHeight` ⛔ KHÔNG chứng minh «nội dung bị cắt»** — ⭐ BẮT BUỘC phải:
① **đo TỪNG CON** xem **phần tử NÀO** vượt đáy; ② đọc **`textContent`** của phần tử đó ⇒ **có CHỮ** thì mới là lỗi người dùng;
⛔ nếu là **phần tử RỖNG/hoạ tiết** (`<i>`, `<svg>`, `<span>` không chữ) ⇒ **cắt là CỐ Ý**, ⛔ **không sửa**.

### 24.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| `.kpi` | ⛔ **THU HỒI** — ⛔ **không sửa**; ⚠️ chỉ mở lại nếu **USER nhìn thấy CHỮ bị hụt** (kèm ảnh chụp) |
| Xác minh TƯƠNG TỰ cho «Trung tâm phê duyệt» (`171/179`) và «KPI & hiệu suất nhân viên» (`156/164`) | ⏳ ⚠️ nhiều khả năng **cùng `<i>` trang trí** ⇒ ⛔ không kết luận «cắt chữ» khi chưa đo từng con |
| 📌 HANDOFF mở: `C02` · `C04` · `C05` · `C06` · `C07` · `C08` · `C09` · **`C10` (đã thu hồi)** · `C11` | ⏳ |

---

## TEST-20261007-C25 — ⭐ Phát hiện: cổng `verify-ui-build-applied.mjs` có **MÃ THOÁT KHÔNG ỔN ĐỊNH** (lúc 0, lúc CRASH)

### 25.1 PHÉP ĐO (cùng trạng thái mã nguồn, chạy liên tiếp)
| Lần | 3 dấu ✓ | Dòng KẾT LUẬN | `EXIT` |
|---|---|---|---|
| 1 | ✅ đủ | `KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAAT` | **`0`** ✅ |
| 2 | ✅ đủ | **cùng kết luận** | ⛔ **`-1073740791`** (= `0xC0000409`, **CRASH**) |
| (trước đó) | ✅ đủ | cùng kết luận | `0` (⚠️ kèm dòng `Assertion failed … uv async.c:94`) |

### 25.2 KẾT LUẬN ĐO ĐƯỢC
- ⭐ **NỘI DUNG KIỂM** (3 dấu ✓ + dòng KẾT LUẬN) **ỔN ĐỊNH** ⇒ **đáng tin** ✅
- ⛔ **MÃ THOÁT KHÔNG ỔN ĐỊNH** (dao động `0` ↔ **crash**) ⇒ ⛔ **không dùng mã thoát làm bằng chứng duy nhất**
- ⚠️ **Nguyên nhân**: libuv assertion khi **teardown** trên Windows (`!(handle->flags & UV_HANDLE_CLOSING)` · `src\win\async.c:94`)

### 25.3 ⚠️ ĐÍNH CHÍNH GHI CHÉP CŨ CỦA TÔI (vòng 8)
Tôi từng ghi: «dòng `Assertion failed …` chỉ là **noise teardown**, **exit code vẫn 0**» ⇒ ⭐ **CHƯA ĐỦ**:
hiện tượng này **có thể làm CRASH** (mã thoát khác 0) ⇒ nay ghi lại đúng: **nội dung tin được — mã thoát thì ⛔ không**.

### 25.4 HỆ QUẢ + CÁCH DÙNG AN TOÀN
| | |
|---|---|
| ⚠️ **Hệ quả** | ai chỉ đọc `$LASTEXITCODE` sẽ gặp **ĐỎ OAN ngẫu nhiên** ⇒ có thể **chặn oan** build/deploy hoặc khiến người sau «sửa» thứ đang đúng |
| ✅ **Cách dùng ngay** | đọc **dòng KẾT LUẬN** + **đủ 3 dấu ✓** ⇒ coi là **ĐẠT** (⛔ không chỉ dựa mã thoát) |
| ⚠️ **Việc cần làm** | `HANDOFF-20261007-C12`: thoát TƯỜNG MINH (`process.exit(0/1)`) sau khi in kết luận ⛔ để không chạm libuv teardown |

### 25.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| Sửa mã thoát cổng (1 dòng) | ⚠️ **`HANDOFF-20261007-C12`** (⛔ `tools/**` không thuộc phiên 03) |
| 📌 HANDOFF mở: `C02` · `C04`–`C09` · **`C10` (đã thu hồi)** · `C11` · **`C12`** | ⏳ |
---

## TEST-20261007-C26 — ĐÓNG lớp `.kpi`: đo TỪNG CON trên **màn thứ 2** ⇒ **⛔ không màn nào cắt CHỮ** (xác nhận thu hồi §C24)

### 26.1 KẾT QUẢ ĐO (màn «Trung tâm phê duyệt» — 6 thẻ `.kpi`)
| Thẻ | `cut` (scroll−client) | Con vượt đáy | Nội dung |
|---|---|---|---|
| 0 | **8px** | **`<i>`** · cao 4px · **`txt=""`** · vượt **7px** | ⛔ RỖNG — hoạ tiết |
| 1 | **0px** | ⛔ (không có) | ✅ không cắt |
| 2 | **8px** | **`<i>`** · 4px · **`txt=""`** · vượt **7px** | ⛔ RỖNG — hoạ tiết |
| 3 | **8px** | **`<i>`** · 4px · **`txt=""`** · vượt **7px** | ⛔ RỖNG — hoạ tiết |

⇒ ⭐ **GIỐNG HỆT màn «Tổng quan điều hành»** (`§C24`): con vượt đáy **duy nhất** là `<i>` **rỗng** = **cột biểu đồ mini TRANG TRÍ**
(`.kpi-mini-columns i`) ⇒ **⛔ KHÔNG có CHỮ nào bị cắt** trên **cả 2 màn đã đo** ⇒ ⭐ **XÁC NHẬN `HANDOFF-C10` ĐÚNG LÀ BÁO ĐỘNG GIẢ** (đã thu hồi ở §C24).
⭐ Chi tiết củng cố kết luận: **thẻ 1 có `cut = 0`** (không cắt) trong khi thẻ 0/2/3 cắt 8px ⇒ đúng dấu hiệu của **hoạ tiết có chiều cao thay đổi theo dữ liệu** (⛔ không phải chữ bị cắt — chữ giống nhau giữa các thẻ).

### 26.2 ⚠️ PHẦN ⛔ CHƯA ĐO ĐƯỢC (nói thẳng)
Màn «**KPI & hiệu suất nhân viên**» (`156/164`) ⛔ **không tới được** trong lượt này (`KHONG_THAY` — nhãn menu không khớp sau khi mở nhóm).
⚠️ Tuy vậy **chữ ký số** của nó (`Δ8px`) **trùng khớp** với 2 màn đã đo ⇒ ⭐ **dự đoán**: cùng `<i>` trang trí.
⇒ ⛔ **KHÔNG** khẳng định «đã đo hết 3 màn» — chỉ nói: **2/3 màn đã đo ⇒ ⛔ 0 chữ bị cắt**; màn thứ 3 ⛔ **chưa đo**.

### 26.3 KẾT LUẬN CHO LỚP «`.kpi` BỊ CẮT»
| | |
|---|---|
| ⛔ **Có lỗi người dùng thấy được?** | **⛔ KHÔNG** — ⛔ không có chữ nào bị cắt (2/3 màn đo trực tiếp) |
| ⛔ **Có nên sửa `.kpi`/`.kpi-grid`?** | **⛔ KHÔNG** (Goal §12/§41: ⛔ không sửa thứ ⛔ không hỏng) — ⭐ giữ nguyên khối «⛔ ĐỪNG SỬA» trong `HANDOFF-20261007-C10` |
| ⚠️ **Ngoại lệ** | nếu **USER nhìn thấy CHỮ bị hụt** ở thẻ KPI (kèm ảnh chụp) ⇒ mở lại handoff |

### 26.4 Việc còn lại
| Việc | Trạng thái |
|---|---|
| Lớp `.kpi` | ✅ **ĐÓNG** (⛔ không có lỗi; đã thu hồi handoff) |
| ⚠️ Màn «KPI & hiệu suất nhân viên» | ⏳ chưa đo (⚠️ chữ ký giống ⇒ nghi cùng hoạ tiết) |
| 📌 HANDOFF mở: `C02` · `C04`–`C09` · **`C10` (đã thu hồi)** · `C11` · `C12` | ⏳ |
---

## TEST-20261007-C27 — ⭐ XÁC MINH LIVE GOM: **CẢ 7 HOTFIX FE CÓ MẶT TRONG BUNDLE ĐANG PHỤC VỤ** (⇒ đủ điều kiện `VERIFIED`)

### 27.1 PHƯƠNG PHÁP (⛔ không cần điều hướng UI — ⭐ tránh được bẫy «probe nhiều bước hay hỏng»)
Đọc **bundle đang phục vụ** (`GET :9000/` → 5 tệp `/assets/*.js` ⇒ **1.320.389 ký tự**) và kiểm **dấu hiệu đặc trưng** của từng hotfix
+ tải **2 mẫu CSV qua HTTP** và kiểm **BOM UTF-8 theo BYTE**.

### 27.2 KẾT QUẢ — **10/10 ĐẠT** (vân tay đang chạy: `344d1da5553cca1e`)
| Hotfix | Dấu hiệu kiểm (chuỗi đặc trưng) | Mong đợi | Đo được |
|---|---|---|---|
| **C01** (CCCD) | `Hồ sơ nhân sự` (thông báo chẩn đoán của tôi) | **CÓ** | ✅ CÓ |
| **C01** (CCCD) | `update_user` (lời gọi lưu tài khoản) | **CÓ** | ✅ CÓ |
| **C02** (Tổ đội) | `data-team-source-notes` (rác đã dọn) | **⛔ KHÔNG** | ✅ **KHÔNG** |
| **C04** (trạng thái) | `Đã xuất kho` · `Chờ NCC` · `Làm lại` | **CÓ** | ✅ CÓ (3/3) |
| **C05** (ưu tiên) | `Khẩn cấp` | **CÓ** | ✅ CÓ |
| **C06/C09** (nhãn hồ sơ) | `Không yêu cầu` | **CÓ** | ✅ CÓ |
| **C07** (modal GRN) | `gridAutoRows` (chặn co hàng) | **CÓ** | ✅ CÓ |
| **C10** (định dạng ngày) | `vi-VN` | **CÓ** | ✅ CÓ |
| **C03** (BOM CSV) | `Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv` | **BOM** | ✅ **244 bytes · CÓ BOM** |
| **C03** (BOM CSV) | `Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.csv` | **BOM** | ✅ **1178 bytes · CÓ BOM** |

### 27.3 Ý NGHĨA (⛔ không tô hồng)
✅ Chứng minh **artifact NGƯỜI DÙNG ĐANG ĐƯỢC PHỤC VỤ** có đủ **7 hotfix FE của phiên 03** (⛔ không chỉ «có trong mã nguồn»).
⭐ Kết hợp với: **cổng hợp đồng từng hotfix** (`C03` 8 ca · `C04` 13 ca · `C06` 4 ca · `C07` 2 ca · `C08` 4 ca · `C09` 4 ca · `C10` 4 ca)
+ **đo DOM sống** cho `C10` (`dd/mm/yyyy` = 4 ngày, ISO = 0 — `§C20`)
⇒ ⭐ **đủ điều kiện chuyển `FIXED` → `VERIFIED`** theo **Goal §24** (`VERIFIED = FIXED + RECHECK`).
⚠️ **VẪN KHUYẾN KHÍCH user nghiệm thu bằng mắt** (⭐ phiên 03 ⛔ không đọc được ảnh) — nhưng ⛔ **không còn là điều kiện bắt buộc** cho `VERIFIED`.

### 27.4 ⚠️ GIỚI HẠN CỦA PHÉP ĐO (nói thẳng)
⛔ Đây là **bằng chứng ARTIFACT** (chuỗi có mặt trong bundle) — ⛔ **không** thay thế được **thao tác nghiệp vụ thật**
(ví dụ: lưu CCCD thành công). ⭐ Muốn chứng minh «bấm lưu không lỗi» thì phải đi **luồng UI nhiều bước**
(hồ sơ → tab 0 → «Sửa hồ sơ» → tab thông tin cá nhân → sửa CCCD → Lưu) ⚠️ **chưa làm** trong vòng này.

### 27.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| 7 hotfix FE | ✅ **`VERIFIED`** (cổng + artifact + DOM sống cho `C10`) |
| ⏳ Luồng UI nhiều bước «sửa CCCD → Lưu không lỗi» | ⏳ vòng sau (nếu còn ngân sách) hoặc **user nghiệm thu** |
| 📌 HANDOFF mở: `C02` · `C04`–`C09` · **`C10` (đã thu hồi)** · `C11` · `C12` | ⏳ |
---

## TEST-20261007-C28 — ⛔ KẾT QUẢ ÂM: **đường ĐỌC dữ liệu ứng dụng KHÔNG nằm ở `/api/system`** (chốt để ⛔ không mất thời gian lần nữa)

### 28.1 MỤC TIÊU (việc còn dở từ vòng 25)
Chứng minh **C01 ở tầng API**: payload **CŨ** (chỉ `userId` — như lỗi user báo) ⇒ **400**; payload **ĐÃ VÁ** (đủ `employeeCode/username/fullName/email/organizationUnitId`) ⇒ **200**.
⚠️ Muốn vậy phải **đọc 1 người dùng hiện có** ⇒ cần biết **đường đọc dữ liệu**.

### 28.2 ⛔ KẾT QUẢ ĐO (âm — ⛔ nói thẳng là ⛔ không làm được theo cách này)
| Phép thử | Kết quả |
|---|---|
| `POST /api/system {action:"login"}` | **HTTP 200** nhưng body **38 ký tự**, chỉ `{ok, mustChangePassword}` ⇒ ⛔ **⛔ KHÔNG kèm dữ liệu** |
| `POST /api/system {action:"bootstrap"}` | ⛔ **HTTP 400** |
| **11 tên action** thử tiếp: `load` · `get_data` · `snapshot` · `list_users` · `users` · `list_staff` · `get_users` · `dashboard` · `initial` · `app_init` (và `bootstrap`) | ⛔ **TẤT CẢ HTTP 400** (`{ok:false, error:…}`) |
| `app/api/**/route.ts` | chỉ có **2 route**: `api/files` · `api/system` (⚠️ `api/system/route.ts` chỉ **20 dòng** — không chứa danh sách action) |

### 28.3 ⭐ KẾT LUẬN + NƠI CẦN ĐỌC TIẾP (để ⛔ không lặp lại cuộc săn này)
⛔ **Dữ liệu ứng dụng ⛔ KHÔNG được tải qua `/api/system` bằng các tên action thông dụng** ⇒ ⭐ khả năng cao theo **1 trong 2 hướng**:
① **Node local server** (`scripts/local-server.mjs`) chèn dữ liệu vào trang (server-side props / `window.__…`) — ⭐ **đọc tệp đó trước**;
② hoặc một endpoint **khác** `/api/…` do **Java** phục vụ mà tên ⛔ không theo mẫu `action:"…"`.
⇒ ⚠️ Ai cần kiểm chứng ở tầng API: **đọc `scripts/local-server.mjs`** (nơi ráp `AppData`) ⛔ **đừng thử thêm tên action** (đã thử **11** tên, ⛔ đều 400).
⚠️ ⛔ **KHÔNG** kết luận «API hỏng» — chỉ là **⛔ tôi ⛔ chưa tìm đúng đường** ⇒ ⛔ không ghi vào sổ bug.

### 28.4 HỆ QUẢ CHO `BUG-20261007-C01`
✅ **Vẫn `VERIFIED`** theo 3 tầng bằng chứng đã có (cổng hợp đồng + **artifact đang phục vụ** + ⛔ *(chưa có DOM sống cho C01)*).
⏳ **Việc còn dở DUY NHẤT**: **luồng UI nhiều bước** «hồ sơ → tab 0 → «Sửa hồ sơ» → tab thông tin cá nhân → sửa CCCD → Lưu ⛔ không lỗi»
(⭐ đường vào đã ghi ở `SHARED_STATE` §79: nút chỉ hiện khi `canAdministerStaff`).

### 28.5 ⭐ CHỐT SỨC KHOẺ CÂY MÃ (cuối vòng 26)
| Lệnh | Kết quả |
|---|---|
| `npm run test:regression` | ⭐ **855 test · 854 pass · 0 fail · 1 skip** (`REG_EXIT=0`) |
| cổng dự án | **ĐẠT** (đọc **dòng KẾT LUẬN + 3 dấu ✓** theo `§76`) |
| 3 dịch vụ `:8787`/`:9000`/`:18081` | **đang nghe** |
| tệp tạm `_c*.mjs` | ⛔ **đã xoá hết** |
---

## TEST-20261007-C29 — ⭐ CHỨNG MINH `BUG-C01` **END-TO-END Ở TẦNG API** + TÌM RA **ĐƯỜNG ĐỌC DỮ LIỆU THẬT**

### 29.1 ⭐ ĐÍNH CHÍNH KẾT QUẢ ÂM CỦA `§C28` — **đường đọc LÀ `/api/system`, nhưng dùng `GET`**
§C28 kết luận «⛔ không ở `/api/system`» sau khi thử **11 tên action bằng POST** ⇒ ⛔ **SAI (do phương pháp)**.
⭐ **CÁCH TÌM RA (⛔ không đoán)**: **BẮT GÓI MẠNG THẬT** bằng CDP `Network.requestWillBeSent` khi tải app ⇒ app chỉ gọi **1** request dữ liệu:
```
GET /api/system  ⇒ HTTP 200
```
⇒ ⭐ **ĐƯỜNG ĐỌC DỮ LIỆU = `GET /api/system`** (⛔ **KHÔNG** phải `POST /api/system {action:"…"}`).

### 29.2 ⭐ KẾT QUẢ CHỨNG MINH (chạy thật qua proxy `:9000` — đúng đường user đi)
| Bước | Đo được |
|---|---|
| ① `login` | **HTTP 200** · có cookie |
| ② `GET /api/system` | ⭐ **HTTP 200 · 2.617.743 ký tự · 29 người dùng** |
| ③ người dùng đo | `e2e.diag` (fixture) — ⚠️ gửi lại **ĐÚNG giá trị hiện có** ⇒ ⛔ không đổi dữ liệu thực chất |
| ④ ⛔ **ĐỐI CHỨNG ÂM** — payload **CŨ** (`{action:"update_user", userId}` — như lỗi user báo) | ⛔ **HTTP 400** · `{"error":"Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc.","ok":false}` ⇒ ⭐ **TÁI HIỆN ĐÚNG lỗi user báo** |
| ⑤ ✅ **BẢN VÁ** — payload **ĐẦY ĐỦ** (`userId` + `employeeCode` + `username` + `fullName` + `email` + `organizationUnitId`, **đúng như FE đã vá gửi**) | ✅ **HTTP 200** · `{"message":"Đã cập nhật tài khoản e2e.diag.","ok":true}` |
| ⑥ kiểm dữ liệu sau khi gửi | ✅ **GIỮ NGUYÊN** (5 trường khớp) ⇒ ⭐ chứng minh thêm: **gửi lại giá trị hiện có là an toàn** |

### 29.3 ⭐ KẾT LUẬN — `BUG-20261007-C01` nay **ĐÓNG HOÀN TOÀN**
| | |
|---|---|
| **Trước** | payload thiếu trường ⇒ **400 «… là bắt buộc»** ⇒ ⭐ **tái hiện được** (đối chứng âm) |
| **Sau (bản vá)** | payload luôn đủ trường ⇒ **200** ⇒ ⭐ **lỗi ⛔ không còn xảy ra** |
| **Ý nghĩa** | ⭐ đây là **chứng minh END-TO-END mạnh nhất** đạt được **⛔ không cần thao tác UI nhiều bước** (vốn đã thất bại nhiều lần) — ⭐ và nó **vượt** mức «artifact có mặt» ở `§C27` |
| **Dữ liệu** | ⚠️ phép đo **có ghi** (`update_user` trên **1 user FIXTURE** `e2e.diag`) nhưng **gửi lại đúng giá trị hiện có** ⇒ ⛔ **không đổi dữ liệu thực chất** (đã kiểm ở bước ⑥) |

### 29.4 ⭐ BÀI HỌC (lần 8 của phiên — về PHƯƠNG PHÁP)
⛔ **SUY ĐOÁN TÊN API LÀ SAI CÁCH** — tôi đã thử **11** tên action (POST) rồi **kết luận âm** ⇒ ⛔ **kết luận đó sai**.
⭐ **CÁCH ĐÚNG**: **BẮT GÓI MẠNG** (CDP `Network`) khi tải app ⇒ ⭐ **1 lượt đo** là ra **đúng** phương thức + đường dẫn.
⇒ ⭐ **LUẬT**: khi cần biết «app gọi API nào» thì **ĐO LƯU LƯỢNG MẠNG**, ⛔ **đừng thử tên**.

### 29.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| `BUG-20261007-C01` | ✅ **ĐÓNG HOÀN TOÀN** (đối chứng âm 400 + bản vá 200 + dữ liệu không đổi) |
| ⏳ Thao tác UI nhiều bước cho `C01` | ⭐ **⛔ KHÔNG CÒN CẦN THIẾT** cho việc xác minh (đã có bằng chứng API mạnh hơn) |
| 📌 HANDOFF mở: `C02` · `C04`–`C09` · **`C10` (đã thu hồi)** · `C11` · `C12` | ⏳ |
---

## TEST-20261007-C30 — Cổng MỚI `C11` cho lỗi **«thẻ trạng thái phơi mã thô»** (`BUG-20261007-C08`) — **4/4 ĐẠT**

### 30.1 NGUỒN PHÁT HIỆN (⭐ phương pháp mới: quét TOÀN BỘ DỮ LIỆU THẬT rồi ĐỌC CHỖ RENDER)
`GET /api/system` (⭐ đường đọc tìm được ở `§C29`) trả **2,6 triệu ký tự** · **395** cặp `(trường, giá trị)` kiểu trạng thái/loại.
⚠️ Quét thô báo **247** cặp «còn mã» ⇒ ⭐ **ĐỌC TỪNG CHỖ RENDER** rồi **loại báo động giả**: phần lớn là trường **⛔ KHÔNG hiển thị**
(`result:"ok"` = vỏ API · `entityType:"save"` = log · `dataType:"number"` = metadata · `categoryCode:"E2E-…"` = mã định danh · `mappingStatus` **chỉ trong chú thích** · `systemLevel` tra **catalog** · `overdue` chỉ dùng **tính toán**, nhãn «Quá hạn» viết cứng)
⇒ ✅ **Kết luận lớn**: khiếu nại «hiện tiếng Anh» **phần lớn ĐÃ ĐƯỢC XỬ LÝ** (**148** cặp đã có nhãn tiếng Việt). ⛔ **Chỉ còn** đúng **1 lớp lỗi thật**: **thẻ trạng thái rơi xuống mã thô**.

### 30.2 LỚP LỖI THẬT + ĐỐI CHỨNG ÂM CỦA BỘ DÒ (⭐ bài học: **phải kiểm bộ dò**)
| Bộ dò | Kết quả |
|---|---|
| **Bản 1** (`\|\|\s*String\(`) | ⛔ **BÁO ĐỘNG GIẢ**: bắt nhầm `taskStatusLabel(String(row.status \|\| "todo"))` — `String(...)` ở đó là **ĐỐI SỐ** hàm nhãn (thô **được dịch tiếp**), ⛔ không phải giá trị cuối |
| **Bản 2** (chỉ khi `String(...)` là **giá trị CUỐI**) | ✅ bắt **đúng 6 chỗ thật** ở **6 tệp**: `AllocateReturn` · `WorkKanban` (×2) · `WorkCenter` · `TeamManagement` · `ProjectEntityModal` · `ProjectDetailTabs` · ⛔ **0 báo động giả** |

### 30.3 KẾT QUẢ CỔNG `tests/mt3-c11-status-no-raw.test.mjs`
| Ca | Nội dung | Kết quả |
|---|---|---|
| `C11-1` | ⛔ KHÔNG phát sinh **tệp MỚI** phơi mã thô | ✅ ĐẠT |
| `C11-2` | 2 tệp đã vá (`AllocateReturn`, `WorkKanban`) **SẠCH** + **thực sự gọi** `statusLabel` | ✅ ĐẠT |
| `C11-3` | Chốt chặn cuối có nhãn tiếng Việt: `work_item` **đủ 12/12** · `bch_confirmation` có `rejected → «BCH từ chối»` | ✅ ĐẠT |
| `C11-4` | ⛔ **ĐỐI CHỨNG ÂM**: bộ dò **PHẢI bắt** đúng **2 mẫu thật** đã đo · ⛔ **KHÔNG bắt nhầm** chỗ đã dùng `statusLabel`/nhãn hằng | ✅ ĐẠT |
⇒ **4/4 ĐẠT** (`node --test`) · ⛔ **0 fail**.

### 30.4 CÁC CỔNG KHÁC (sau khi vá 6 tệp)
| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **exit 0** |
| `npx eslint <6 tệp đã sửa>` | ✅ **0 lỗi** (⚠️ 3 **cảnh báo cũ**, ⛔ không do vá này) |
| `npm run test:regression` | ⏳ chạy sau build |

### 30.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| Build (`gd-cycle`) để bản vá tới user | ⏳ ⚠️ **ĐANG CHỜ**: phiên khác chạy `tools/probe-visual-regression.mjs --update` (PID 13504) **cần :8787 sống** ⇒ ⛔ **không dừng dịch vụ lúc này** (Goal §36/§37) |
| `Inventory.tsx` (nhãn BCH — ⚠️ tệp **phiên 02**) | ⚠️ **`HANDOFF-20261007-C13`** |
| 📌 HANDOFF mở: `C02` · `C04`–`C09` · **`C10` (đã thu hồi)** · `C11` · `C12` · **`C13`** | ⏳ |
---

## TEST-20261007-C31 — CHỐT vòng 28: build + hồi quy + vá **ĐỎ OAN do tranh chấp** (`BUG-20261007-C09`)

### 31.1 BUILD (⚠️ bắt buộc vì đã đổi `app/**`)
| Bước | Kết quả |
|---|---|
| Chờ phiên khác (Goal §36/§37) | ⚠️ phát hiện `tools/probe-visual-regression.mjs --update` (**PID 13504**) đang chạy ⇒ ⭐ **CHỜ tới khi xong** mới dừng dịch vụ (⛔ không phá ảnh chuẩn của phiên khác) |
| Dừng dịch vụ | ✅ **đúng PID**: `:8787`=13084 · `:9000`=1804 (⛔ **KHÔNG** `Stop-Process node` hàng loạt) |
| `node tools/gd-cycle.mjs "MT3-S03 dot 2 the trang thai khong phoi ma tho"` | ✅ **`GD_EXIT=0`** · migration mới **`0340_phase_gd_mt3_s03_dot_2_the_trang_thai_khong_phoi__identity.sql`** · `BUILT ARTIFACT VALIDATION: ĐẠT` |
| Khởi động lại | ✅ `scripts/local-server.mjs` + `tools/cutover-proxy.mjs` ⇒ `:8787`/`:9000`/`:18081` **đang nghe** · `:9000` **HTTP 200** |
| Vân tay | ⭐ **`920bb0c5f11fd64a`** (đổi từ `344d1da5553cca1e` — ⚠️ **đúng**, vì `app/**` đã đổi) |
| Cổng dự án | ✅ **ĐẠT** — `✓ do-moi` · `✓ van-tay` (**khớp SSOT**) · `✓ byte 6/6` + `KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAAT` (đọc theo luật `§76`: ⛔ **không** chỉ tin mã thoát) |

### 31.2 ⚠️ HỒI QUY LẦN 1 **ĐỎ 1 CA** ⇒ TRUY NGUYÊN NHÂN (⛔ không đoán, ⛔ không bỏ qua)
| | |
|---|---|
| Ca đỏ | «**Không có private key hoặc file khóa bí mật trong source**» (`tests/trust-lock-foundation.test.mjs`) |
| Lỗi | `Error: ENOENT: no such file or directory, stat '…\probe-err.txt'` |
| **ROOT CAUSE** | `walk()` = `readdir(".")` rồi **`stat()` từng tệp** ⇒ **cửa sổ TOCTOU**; ⚠️ **phiên KHÁC đang ghi/xoá tệp tạm ở GỐC REPO** (`probe-err-full.txt` · `probe-out-full.txt` **tạo lúc 19:35**) ⇒ tệp biến mất giữa 2 bước ⇒ **ĐỎ OAN** |
| ⭐ **Chứng minh (⛔ không suy đoán)** | ① chạy lại **RIÊNG** ⇒ **5/5 ĐẠT** · ② **tạo tệp `probe-err.txt` giả** ⇒ **vẫn 5/5 ĐẠT** · ③ sau khi vá ⇒ **hồi quy xanh** |

### 31.3 VÁ + HỒI QUY CHỐT
| Bước | Kết quả |
|---|---|
| Vá (`BUG-20261007-C09`) | bọc `stat()` trong `try/catch`: **`ENOENT` ⇒ bỏ qua** · ⛔ lỗi khác vẫn ném ⇒ ⛔ không che lỗi thật |
| `npm run test:regression` | ⭐ **859 test · 858 pass · 0 fail · 1 skip** · **`REG_EXIT=0`** ✅ |
| `node --test tests/mt3-c11-status-no-raw.test.mjs` | ✅ **4/4 ĐẠT** |
| `npx tsc --noEmit` | ✅ **exit 0** |

### 31.4 ⭐ BÀI HỌC (lần 9 của phiên)
⚠️ **ĐỎ không phải lúc nào cũng là lỗi của mình**: 2 lần đỏ trong 2 vòng liên tiếp (`§C28` mã thoát cổng · `§C31` ca kiểm thử)
⭐ **đều do NHIỀU PHIÊN CHẠY SONG SONG TRÊN MỘT CÂY MÃ** ⇒ ⭐ **quy trình đúng**: ① đọc **thông báo lỗi thật** ·
② **chạy lại RIÊNG** ca đó · ③ **mô phỏng lại điều kiện** (tạo tệp lạ / chạy 2 lần) · ④ chỉ kết luận sau khi **đo**.

### 31.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| `BUG-20261007-C08` (6 màn hết phơi mã thô) | ✅ `VERIFIED` (cổng C11 + tsc + eslint + build + hồi quy) — ⚠️ **chưa đo DOM** 6 màn đó (có màn cần điều hướng nhiều bước) |
| `Inventory.tsx` (nhãn BCH) | ⚠️ **`HANDOFF-20261007-C13`** (tệp phiên 02) · `app/page.tsx` trong **`HANDOFF-C13`** (LOCK phiên 01) |
| 📌 HANDOFF mở: `C02` · `C04`–`C09` · `C10` (đã thu hồi) · `C11` · `C12` · **`C13`** | ⏳ |
---

## TEST-20261007-C32 — ⭐ **BẰNG CHỨNG DOM** cho `BUG-20261007-C08` + ⭐ **GIẢI MÃ CẤU TRÚC MENU** (⛔ hết mò điều hướng)

### 32.1 ⭐ GIẢI MÃ CẤU TRÚC MENU (⛔ đây là thứ đã làm 5 lượt quét trước THẤT BẠI)
| Phát hiện (đo tại DOM thật) | Ý nghĩa |
|---|---|
| **Mục menu LÀ `<button>`** với **`<span>{nhãn}</span>`** + thẻ **`<b>{số đếm}</b>`** | ⛔ vì vậy khớp theo **`textContent`** (nhãn + số) **thất bại** — ⭐ phải khớp theo **`<span>`** |
| **11 NHÓM viết HOA** («CÔNG VIỆC» · «QUẢN LÝ DỰ ÁN» · «MEP» · «MUA HÀNG & CUNG ỨNG» · «KHO VẬT TƯ» · «TỔ ĐỘI» · «TÀI CHÍNH – KẾ TOÁN» · «HÀNH CHÍNH – PHÁP CHẾ» · «BÁO CÁO» · «DANH MỤC VẬT TƯ GỐC» · «QUẢN TRỊ HỆ THỐNG») | ⚠️ **phần lớn Ở TRẠNG THÁI ĐÓNG** (`aria-expanded="false"`) |
| ⛔ **Mục LÁ của nhóm ĐÓNG ⛔ KHÔNG có trong DOM** | ⭐ **NGUYÊN NHÂN GỐC** vì sao mọi lượt quét trước chỉ ra **7–8 mục** |
| ⭐ **Cách điều hướng ĐÚNG (đã chạy được)** | ① bấm **`button` có `<span>` = NHÃN HOA** để **mở nhóm** → ② bấm **`button` có `<span>` = nhãn mục lá** → ③ **xác nhận `h1`** |

⭐ **BẢN ĐỒ MỤC LÁ ĐÃ ĐO (đỡ phải mò lại)**: «CÔNG VIỆC» ⇒ *Dashboard · Cá nhân · Phòng ban · Giao việc · Báo cáo* ·
«TỔ ĐỘI» ⇒ *Cấp phát cho tổ đội* · «HÀNH CHÍNH – PHÁP CHẾ» ⇒ *Hồ sơ nhân sự · Hợp đồng lao động · Bảo hiểm & Chế độ · Công văn đến/đi · Văn bản pháp lý · Con dấu/Ủy quyền · Review HĐ* ·
«KHO VẬT TƯ» ⇒ *Kho vật tư* · «QUẢN LÝ DỰ ÁN» ⇒ *Quản lý dự án · Tiến độ dự án · Thi công · Sản lượng · Thu hồi vốn* ·
(kèm mục chung luôn hiện: *Trung tâm phê duyệt · Nhà cung cấp · Đối tác*).

### 32.2 ⭐ KẾT QUẢ ĐO DOM TRÊN MÀN ĐÃ VÁ (màn «**Giao việc & Kiểm soát hoàn thành**» — tệp `WorkCenter.tsx`)
| Nhãn đo được trong cột trạng thái/ưu tiên | Kết luận |
|---|---|
| **«Mới»** · «Xong» · **«Cao»** · «Bình thường» · «Quá hạn» · «0%»/«25%»… | ⭐ **TIẾNG VIỆT** — ⛔ **KHÔNG có mã trạng thái tiếng Anh** ✅ (`Mới` = `work_item` `NEW` ⇒ ⭐ **đúng nhãn mà bản vá định tuyến tới**) |
| Màn «**Nhiệm vụ nhân viên đang làm**» (bấm «Cá nhân») | ✅ **⛔ 0 mã thô** |

### 32.3 ⚠️ BỘ DÒ «MÃ THÔ» BẮT NHẦM **MÃ ĐỊNH DANH** (⭐ ghi để ⛔ không ai «sửa» chúng)
10 giá trị bị cờ ở màn trên là **mã công việc/dự án**: `CV-DA-260917-3436` · `PRJ-DEMO-01` · `E2E-DA-01`… ⇒ ⭐ **mã định danh hiển thị NGUYÊN VĂN là ĐÚNG** (⛔ không phải lỗi, ⛔ không đổi sang tiếng Việt).
⇒ ⭐ **LUẬT**: dò «mã thô» **chỉ** áp cho **cột TRẠNG THÁI/LOẠI**, ⛔ **không** áp cho cột **mã/tên**.

### 32.4 ⇒ KẾT LUẬN `BUG-20261007-C08`
✅ **`VERIFIED`** — hội đủ: **cổng hợp đồng** `C11` (4/4) · `tsc` · `eslint` · **build** (vân tay `920bb0c5f11fd64a`) · **hồi quy 859/858/0** · ⭐ **DOM thật** trên màn đã vá (**nhãn tiếng Việt, ⛔ 0 mã thô** ở cột trạng thái).
⚠️ **Phạm vi bằng chứng DOM**: **2/6 màn** đã đo trực tiếp (`WorkCenter`); 4 tệp còn lại ⭐ **được bảo đảm bởi cổng C11 + bảng nhãn tất định** (⛔ không đo DOM riêng).

### 32.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| `Cấp phát cho tổ đội` (màn `AllocateReturn` — nơi rò NẶNG NHẤT) | ⏳ ⚠️ **chưa bấm tới được** trong lượt này (mục không thấy sau khi mở nhóm) ⇒ ⭐ vòng sau dùng **bản đồ mục lá** ở §32.1 |
| `Inventory.tsx` (nhãn BCH) + `app/page.tsx` | ⚠️ **`HANDOFF-20261007-C13`** |
| 📌 HANDOFF mở: `C02` · `C04`–`C09` · `C10` (đã thu hồi) · `C11` · `C12` · `C13` | ⏳ |
---

## TEST-20261007-C33 — ⭐ **CÔNG THỨC ĐIỀU HƯỚNG ĐÃ CHẠY 3/3** + **ĐO ĐÚNG CỘT «Trạng thái»** trên màn rò NẶNG NHẤT

### 33.1 ⭐ CÔNG THỨC ĐIỀU HƯỚNG (⛔ đã sửa sai lầm của lượt trước)
⚠️ **Lượt trước trượt** vì tôi **mở NHIỀU nhóm rồi mới bấm lá** ⇒ đo được: **mở nhóm khác làm nhóm trước TỰ ĐÓNG** (hành vi kiểu accordion).
⭐ **CÔNG THỨC ĐÚNG (đã chạy đúng 3/3 lần)**:
① bấm `button` có `<span>` = **NHÃN HOA** (mở nhóm) → ② **kiểm NGAY** `<span>` của mục lá có xuất hiện không → ③ **bấm mục lá NGAY** (⛔ không mở nhóm khác xen vào) → ④ **xác nhận `h1`**.
🛟 **Chốt an toàn**: nếu mục lá **chưa xuất hiện** ⇒ **bấm nhóm LẦN 2** rồi kiểm lại.

### 33.2 ⭐ KỸ THUẬT ĐO CHÍNH XÁC (⛔ hết báo động giả từ cột MÃ)
Thay vì quét mọi ô, tôi **tìm `<th>` chứa «Trạng thái»/«Ưu tiên»** rồi **chỉ đọc các `<td>` ở ĐÚNG CHỈ SỐ CỘT đó** ⇒ ⭐ **loại hẳn** lớp báo động giả `CV-DA-…`/`PRJ-DEMO-01` đã gặp ở `§32.3`.

### 33.3 KẾT QUẢ ĐO (3/3 màn tới được ✅)
| Màn (đường đi) | Kết quả ĐO ĐƯỢC |
|---|---|
| ⭐ «**Cấp phát cho tổ đội**» ← «TỔ ĐỘI › Cấp phát cho tổ đội» (**màn rò NẶNG NHẤT** — `AllocateReturn.tsx`) | cột «Trạng thái» · **5 dòng** · ⛔ **mã thô: 0** ✅ · nhãn đo được: **«Đang hoạt động»** |
| «**Hồ sơ nhân sự**» ← «HÀNH CHÍNH – PHÁP CHẾ › Hồ sơ nhân sự» (`HrScreen.tsx`) | ⚠️ màn ⛔ **không có cột «Trạng thái/Ưu tiên»** trong bảng ⇒ **⛔ chưa đo được** (nói thẳng, ⛔ không suy ra «sạch») |
| «**Giao việc & Kiểm soát hoàn thành**» ← «CÔNG VIỆC › Giao việc» (`WorkCenter.tsx`) | cột «Trạng thái» · **0 dòng** · «Ưu tiên» · **0 dòng** ⇒ ⚠️ **⛔ không có bằng chứng theo chiều nào** trong lượt này (⚠️ lượt `§32` đã đo **24 dòng** ở phạm vi «Phòng ban» với nhãn tiếng Việt) |

### 33.4 ⇒ TRẠNG THÁI `BUG-20261007-C08` (cập nhật bằng chứng DOM)
✅ **`VERIFIED`** — nay có thêm **DOM trên màn rò NẶNG NHẤT** (`AllocateReturn`: **0 mã thô** ở cột «Trạng thái») ⇒ tổng **DOM đo 3/6 màn** (`AllocateReturn` · `WorkCenter` · + màn «Nhiệm vụ nhân viên đang làm»).
⚠️ **⛔ CHƯA ĐO DOM**: `TeamManagement` · `ProjectEntityModal` · `ProjectDetailTabs` ⇒ ⭐ vẫn **bảo đảm bởi cổng `C11` + bảng nhãn tất định** (⛔ không nói «đã đo hết»).

### 33.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| DOM cho 3 tệp còn lại (`TeamManagement` · `ProjectEntityModal` · `ProjectDetailTabs`) | ⏳ ⭐ nay **đã có công thức điều hướng** (§33.1) ⇒ làm được ở vòng sau |
| `Inventory.tsx` (nhãn BCH) + `app/page.tsx` | ⚠️ **`HANDOFF-20261007-C13`** |
| 📌 HANDOFF mở: `C02` · `C04`–`C09` · `C10` (đã thu hồi) · `C11` · `C12` · `C13` | ⏳ |
---

## TEST-20261007-C34 — ⭐ **QUÉT TOÀN BỘ: 29 MÀN** (lượt quét ĐẦU TIÊN phủ rộng) + phát hiện **NGÀY ISO HIỆN THÔ** + 2 lần **ĐỎ OAN** khi làm cổng

### 34.1 ⭐ THÀNH QUẢ LỚN: QUÉT ĐƯỢC **29 MÀN** (mọi lượt trước chỉ **3–8 mục**)
⭐ Nhờ **công thức điều hướng đã chứng minh** (`§C33`: mở nhóm bằng `<span>` **NHÃN HOA** → bấm mục lá **NGAY**) ⇒ lượt quét lần này phủ **11 nhóm** và **29 màn**.
⚠️ **Vì sao trước đây thất bại**: ⛔ mục lá của nhóm **ĐÓNG** không tồn tại trong DOM ⇒ quét khi nhóm đóng chỉ thấy **5 mục chung**.

### 34.2 KẾT QUẢ: 27 màn SẠCH · **2 màn CÓ phát hiện**
| Màn | Phát hiện ĐO ĐƯỢC |
|---|---|
| 🔴 «**Tiến độ dự án**» (nhóm QUẢN LÝ DỰ ÁN) | **NGÀY ISO HIỆN THÔ**: `«2026-01-01»` · `«2026-09-23»` ⇒ ⚠️ **KHÔNG NHẤT QUÁN** với `dd/mm/yyyy` ⇒ ⭐ **CÙNG LỚP `BUG-20261007-C10`** |
| 🔴 «**Giao việc & Kiểm soát hoàn thành**» (phạm vi Phòng ban) | **NGÀY ISO HIỆN THÔ**: `«2026-10-07»` · ⚠️ thêm **1 báo động GIẢ**: giá trị `«Cao»` bị bộ dò gắn cờ «mã thô» — ⛔ **«Cao» LÀ tiếng Việt** (⛔ không dấu) ⇒ ⭐ **bộ dò phải loại các nhãn tiếng Việt không dấu** |
| ✅ **27 màn sạch** | gồm các màn CÓ DỮ LIỆU THẬT: «Phiếu đề nghị mua hàng» (**91 dòng**) · «Đơn hàng đã giao» (**36 dòng** · cột «BCH XÁC NHẬN») · «Kế hoạch giao hàng» (13 dòng) · «Quản lý dự án» (5) · «Sản lượng» (3) · «Giao việc» (16 dòng · «Ưu tiên») ⇒ ⛔ **0 mã thô**, ⛔ **0 lỗi văn bản** |

### 34.3 ⭐ ĐÃ VÁ 11 CHỖ **HIỂN THỊ** NGÀY ISO (4 tệp — ⛔ KHÔNG phải 2 màn ở §34.2, xem §34.5)
| Tệp (thuộc quyền phiên 03) | Chỗ đã vá |
|---|---|
| `AllocateReturn.tsx` | «Ngày xuất» · «Ngày trả» |
| `Purchasing.tsx` | «Ngày yêu cầu» · «Cần có» · «Đã đặt» · «ETA» |
| `PurchaseOrderDrawer.tsx` | «Đã đặt» · «Hạn giao (ETA)» · «Ngày nhận» |
| `ContractReviewScreen.tsx` | «Ngày nhận» · «Ngày review» (**bảng + modal** — hàm `d()` nay đi qua `date()`) |
⇒ ✅ **`tsc` exit 0** · ✅ **`eslint` 0 lỗi** · ✅ cổng `C10` **6/6 ĐẠT**.

### 34.4 ⚠️⚠️ HAI LẦN **ĐỎ OAN** + MỘT LẦN **ĐẠT RỖNG** KHI LÀM CỔNG (⭐ bài học lần 10)
| Lần | Chuyện gì | ⭐ Sửa đúng |
|---|---|---|
| **1** | Bộ dò đòi `{` đứng **ngay trước** `String(` ⇒ ⛔ **KHÔNG khớp dạng TAM PHÂN THẬT** (`{cond ? String(x).slice(0,10) : "—"}`) ⇒ ca **«KHÔNG còn mẫu» ĐẠT RỖNG** | nới bộ dò khớp **mọi** `String(...).slice(0,10)` |
| **2** | Quét **toàn bộ** `app/screens/**` ⇒ **bắt nhầm** chỗ **HỢP LỆ**: ô nhập `type="date"` · **so sánh/lọc** · **tên tệp xuất** | **loại trừ** 3 trường hợp hợp lệ đó |
| **3** | Vẫn bắt nhầm **dòng ĐỊNH NGHĨA** hàm trợ giúp (`const datePart = (v) => String(v).slice(0,10)` — **LOGIC**, ⛔ không hiển thị) | **loại trừ** dòng định nghĩa (`=>` / `const datePart =`) |
⭐ **KẾT LUẬN KỸ THUẬT**: ⛔ **regex KHÔNG đủ** để phân biệt «hiển thị» với «logic/tên tệp» trên toàn cây mã
⇒ ⭐ cổng `C10-5` nay **NHẮM ĐÍCH** (chỉ kiểm **4 tệp đã vá**, nơi mọi chỗ đều là hiển thị) + **đối chứng âm `C10-6`** buộc bộ dò **khớp NGUYÊN VĂN 2 mẫu lịch sử** (⛔ chống ĐẠT RỖNG)
⚠️ Muốn quét **rộng** cho đúng thì phải **phân tích cú pháp (AST)** — ⏳ ngoài phạm vi vòng này.

### 34.5 ⛔ PHẦN **CHƯA** LÀM ĐƯỢC (nói thẳng — ⛔ không tô hồng)
⚠️ **Chưa xác định được TỆP nguồn** phát ra ngày ISO trên **2 màn ở §34.2** («Tiến độ dự án» · «Giao việc»):
· `WorkCenter.tsx` **đã** dùng `date(r.dueAt)` cho cột «Hạn» ⇒ ISO ⛔ **không** phát từ đó;
· ⭐ cần **dò tiếp** (nghi: chú thích/KPI/`title=` hoặc màn render «Tiến độ dự án» ở tệp khác)
⇒ ⛔ **KHÔNG** kết luận «đã vá xong lớp ngày ISO»; ⭐ **lớp `C10` VẪN MỞ MỘT PHẦN**.

### 34.6 BUILD + KIỂM CHỨNG
| Bước | Kết quả |
|---|---|
| `gd-cycle` | ✅ **exit 0** · migration **0341** · `BUILT ARTIFACT VALIDATION: ĐẠT` |
| Dịch vụ | ✅ `:8787`/`:9000`/`:18081` **đang nghe** · `:9000` **HTTP 200** |
| Cổng dự án | ✅ **ĐẠT** (3 ✓ + `KET LUAN`) · vân tay HTML mới **`2f7a3a924559fd46`** |
| Hồi quy | ✅ **861 test · 860 pass · 0 fail · 1 skip** (`REG_EXIT=0`) — ⭐ +2 ca cổng mới |
---

## TEST-20261007-C35 — ⭐ **TRUY ĐƯỢC NGUỒN** ngày ISO (2/2 màn) + vá `WorkKanban` + cổng `C10` **7/7**

### 35.1 ⭐ KỸ THUẬT TRUY NGUỒN (⛔ thay cho việc ĐOÁN tệp)
Với mỗi màn có ngày ISO: **tìm TEXT NODE** chứa `\d{4}-\d{2}-\d{2}` ⇒ in **PHẦN TỬ chứa** + **CHUỖI TỔ TIÊN (tag.class[data-*])** + **ngữ cảnh chữ** + **thuộc tính**.
⇒ ⭐ **1 lượt đo là ra manh mối quyết định** (⛔ thay vì grep mù cả cây mã).

### 35.2 ⭐ KẾT QUẢ TRUY NGUỒN — **CẢ 2 NGUỒN ĐỀU TÌM RA**
| Màn | Chuỗi DOM đo được | ⇒ **NGUỒN** |
|---|---|---|
| «**Tiến độ dự án**» | `td < tr < tbody < table.baseline-table` (2 chỗ: `2026-01-01` · `2026-09-23`) | ⭐ component `ProjectProgress` — **định nghĩa NGAY TRONG `app/page.tsx`** ⇒ ⛔ **LOCK phiên 01** ⇒ **`HANDOFF-20261007-C14`** |
| «**Giao việc & Kiểm soát hoàn thành**» | `p.muted < div.stack < div.stack < div.stack.work-center` · ngữ cảnh «**Hôm nay 2026-10-07** — thẻ hiển thị: …» | ⭐ **`app/screens/WorkKanban.tsx`** — `<p className="muted">Hôm nay {UI_TODAY} — …</p>` ⇒ ⛔ render **HẰNG `UI_TODAY`** (ISO) thô ⇒ ✅ **THUỘC QUYỀN PHIÊN 03** |

⭐ `UI_TODAY` (`lib/ui-shared.tsx`) = `new Date(UI_NOW_MS).toISOString().slice(0, 10)` ⇒ **luôn là ISO** ⇒ ⛔ render thẳng là **hiện `yyyy-mm-dd`**.

### 35.3 ✅ ĐÃ VÁ (1 dòng — ⛔ không đổi gì khác)
`WorkKanban.tsx`: `Hôm nay {UI_TODAY} — …` ⇒ ⭐ `Hôm nay {date(UI_TODAY)} — …` (⇒ «Hôm nay **`07/10/2026`**»).

### 35.4 ⚠️ CỔNG `C10-7` MỚI — và **4 LỚP BÁO ĐỘNG GIẢ** phải loại (⭐ bài học 10 lặp lại)
| Lớp bắt nhầm (⚠️ ĐO ĐƯỢC) | Vì sao **HỢP LỆ** | Cách loại |
|---|---|---|
| `Payments.tsx` · `ProjectTeams.tsx`: `defaultValue={UI_TODAY}` | ô nhập `type="date"` — HTML **bắt buộc** ISO | loại khi trước đó là `value=`/`defaultValue=` |
| `ProjectDetailTabs.tsx`: `` `Chi_tiet_du_an_${pid}_${UI_TODAY}` `` | **TÊN TỆP xuất** (⛔ không hiển thị) | loại khi có `download*`/`.csv`/`.json` **hoặc** kết thúc bằng `$` (template literal) |
| (lượt trước) **dòng ĐỊNH NGHĨA hàm trợ giúp** `datePart = (v) => String(v).slice(0,10)` | **LOGIC**, ⛔ không hiển thị | loại khi trước đó là `=>`/`const datePart =` |
| (lượt trước) **so sánh/lọc** `String(x).slice(0,10) === UI_TODAY` | **LOGIC** | loại khi trước đó là toán tử so sánh |
⭐ **KẾT LUẬN**: cổng chỉ **BẮT ĐÚNG** `WorkKanban` sau khi loại **4 lớp** — ⭐ và **đối chứng âm** vẫn buộc bộ dò **khớp NGUYÊN VĂN mẫu THẬT** ⇒ ⛔ **không ĐẠT RỖNG**.
⇒ ✅ cổng `C10` **7/7 ĐẠT**.

### 35.5 BUILD + KIỂM CHỨNG
| Bước | Kết quả |
|---|---|
| `gd-cycle` | ✅ **exit 0** · migration **0342** · `BUILT ARTIFACT VALIDATION: ĐẠT` |
| Dịch vụ | ✅ `:8787`/`:9000`/`:18081` **đang nghe** · `:9000` **HTTP 200** |
| Cổng dự án | ✅ **ĐẠT** (3 ✓ + `KET LUAN`) · vân tay HTML **`ab3c3d95d3d59ad4`** |
| Hồi quy | ✅ **862 test · 861 pass · 0 fail · 1 skip** (`REG_EXIT=0`) — ⭐ +1 ca cổng mới |
| Phối hợp | ✅ kiểm **⛔ không có probe của phiên khác** trước khi dừng dịch vụ · dừng **đúng PID** (18272 · 17584) |

### 35.6 TRẠNG THÁI LỚP NGÀY ISO (`BUG-20261007-C10`)
✅ **ĐÃ VÁ**: 11 chỗ (vòng 31) + **`WorkKanban`** (vòng 32 — màn «Giao việc» nay hết ISO) ⇒ **1/2 màn đã phát hiện nay SẠCH**
⚠️ **CÒN LẠI**: «**Tiến độ dự án**» ⇒ ⛔ **LOCK phiên 01** ⇒ **`HANDOFF-20261007-C14`** (kèm bằng chứng DOM + cách sửa)
---

## TEST-20261007-C36 — ⭐ **QUÉT LẠI 29 MÀN TRÊN BẢN MỚI**: xác nhận live bản vá + **săn lớp lỗi MỚI** («SỐ TIỀN THÔ»)

### 36.1 MỤC TIÊU (2 trong 1)
① **Xác nhận LIVE** các bản vá đã build (vân tay `ab3c3d95d3d59ad4`) · ② **săn lớp lỗi CHƯA từng quét**: **SỐ TIỀN/SỐ LƯỢNG hiện THÔ** (⛔ thiếu dấu phân cách) — ⚠️ đây là lớp lỗi **thật** trong ERP (tiền Việt Nam rất dài).

### 36.2 ⭐ KỸ THUẬT MỚI — QUÉT **THEO ĐÚNG CỘT** (⛔ tránh báo động giả từ cột MÃ)
| Bộ dò | Cách làm | ⛔ Vì sao không báo động giả |
|---|---|---|
| **SỐ TIỀN THÔ** | chỉ quét cột có **tiêu đề** khớp `/giá\|tiền\|số lượng\|khối lượng\|đơn giá\|tổng\|VND\|thành tiền\|giá trị\|sản lượng\|định mức\|tồn/` ⇒ bắt ô **CHỈ gồm ≥7 chữ số** (`^\d{7,}$`) | ⛔ **không** quét cột mã/tên (nên `CV-DA-…`/`PRJ-…` ⛔ không bị gắn cờ) |
| **MÃ TRẠNG THÁI THÔ** | chỉ quét cột khớp `/trạng thái\|ưu tiên\|kết quả\|mức độ\|xác nhận/` | ⭐ **loại sẵn** giá trị tiếng Việt **không dấu** (`Cao`) đã từng bị gắn cờ oan ở `§C34` |
| **LỖI VĂN BẢN** | `null`/`undefined`/`NaN`/`[object Object]` + **ngày ISO** ở mọi text node | ⛔ chỉ tính text node **hiển thị** (bỏ `script/style`, phần tử 0×0) |

### 36.3 ⭐ KẾT QUẢ: **29 màn đo trên BẢN MỚI · 28 SẠCH · 1 màn còn lỗi** (đúng màn ĐÃ HANDOFF)
| Kết quả | Chi tiết |
|---|---|
| ✅ **«Giao việc & Kiểm soát hoàn thành» NAY SẠCH** | ⭐ **BẰNG CHỨNG LIVE** cho bản vá `WorkKanban.tsx` (vòng 32) — ngày ISO `2026-10-07` **đã hết** ✅ |
| ✅ **28/29 màn SẠCH** | ⛔ **0 mã trạng thái thô** (kể cả 3 màn đã vá ở vòng 28) · ⛔ **0 số tiền thô** · ⛔ **0** `null`/`undefined`/`NaN` |
| 🔴 **1 màn còn**: «**Tiến độ dự án**» | ngày ISO `«2026-01-01»` · `«2026-09-23»` ⇒ ⭐ **ĐÚNG màn đã ghi `HANDOFF-20261007-C14`** (component `ProjectProgress` **nằm trong `app/page.tsx`** = **LOCK phiên 01**) ✅ ⇒ ⭐ **kết quả quét KHỚP CHÍNH XÁC với handoff** |
| ⭐ **LỚP LỖI MỚI «SỐ TIỀN THÔ»** | ✅ **⛔ 0 chỗ trên TOÀN BỘ 29 màn** ⇒ ⭐ **lớp này SẠCH** (tiền/số lượng đã qua `format.format()`) — ⭐ ⛔ **KHÔNG** ghi vào sổ bug (đo được sạch thì ⛔ không bịa lỗi) |
| **DANH SÁCH 29 MÀN** | Trung tâm phê duyệt · Nhà cung cấp · Phiếu đề nghị mua hàng · Kế hoạch giao hàng · Đơn hàng đã giao · Kế hoạch mua hàng & cung ứng · Xin giá vật tư · Đấu thầu · Mua hàng vật tư thiết bị · Cung ứng vật tư cho dự án · Hợp đồng các loại · Giá & dữ liệu thương mại · Quản lý dự án · **Tiến độ dự án** · Thi công · Sản lượng · Thu hồi vốn · Kế hoạch triển khai dự án · PDA / Điều phối dự án · Shopdrawing & trình duyệt · BOQ & bóc tách khối lượng · BOQ / Hợp đồng dự án · Kiểm soát vật tư & đặt hàng · Phát sinh / RFI / RFQ / NCR · Hoàn công · KPI & hiệu suất nhân viên · Nhiệm vụ nhân viên đang làm · Giao việc & Kiểm soát hoàn thành · Báo cáo & cảnh báo |

### 36.4 ⭐ Ý NGHĨA
✅ **Bản vá đã được xác nhận LIVE trên artifact đang phục vụ** (⛔ không chỉ «có trong mã nguồn»).
✅ **Lớp ngày ISO THU HẸP CÒN ĐÚNG 1 MÀN** và màn đó **đã được giao** cho phiên giữ quyền ⇒ ⭐ **kết quả đo trùng khớp handoff** (⛔ không mâu thuẫn sổ sách).
✅ Lớp «số tiền thô» **ĐO ĐƯỢC LÀ SẠCH** ⇒ ⭐ **không tạo việc giả** (§12: ⛔ không sửa thứ ⛔ không hỏng).

### 36.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| «Tiến độ dự án» (ngày ISO) | ⚠️ **`HANDOFF-20261007-C14`** (LOCK phiên 01) |
| `Inventory.tsx`: nhãn BCH + 6 chỗ ngày ISO hiển thị | ⚠️ **`HANDOFF-20261007-C13`** (tệp phiên 02) |
| 📌 HANDOFF mở: `C02` · `C04`–`C09` · `C10` (thu hồi) · `C11` · `C12` · **`C13`** · **`C14`** | ⏳ |
---

## TEST-20261007-C37 — ⭐ QUÉT **MODAL/DRAWER** lần đầu tiên (vùng phủ MỚI): **4 modal SẠCH** · ⚠️ **11 màn ⛔ chưa mở được**

### 37.1 VÌ SAO QUÉT MODAL (⭐ vùng phủ chưa từng chạm)
Các lượt quét trước **chỉ quét MÀN CHÍNH** ⇒ ⛔ chưa từng kiểm **nội dung trong modal/drawer** — ⚠️ mà đó lại là nơi user **làm việc nhiều nhất** và là nơi **từng có lỗi CẮT NỘI DUNG** (`BUG-C07`/`C08`).
⭐ Bộ dò cắt dùng **ĐÚNG bài học `§C24`**: chỉ tính khi phần tử vượt đáy **CÓ CHỮ** (⛔ bỏ hoạ tiết/`<i>` rỗng) ⇒ ⛔ **không lặp lại báo động giả đã mắc**.

### 37.2 KẾT QUẢ (2 lượt chạy — ⚠️ lượt 1 chết vì `Runtime.evaluate` timeout)
| | |
|---|---|
| **Màn đã ghé** | **16** màn |
| ⭐ **MODAL MỞ & QUÉT ĐƯỢC** | ✅ **4** — «Phiếu đề nghị mua hàng» (`entity-detail-modal`) · «Kế hoạch giao hàng» (`modal`) · «Đơn hàng đã giao» (`receipt-modal`) · «Quản lý dự án» (`entity-detail-modal`) |
| **KẾT QUẢ TRONG 4 MODAL ĐÓ** | ✅ **⛔ 0 khối CẮT CHỮ** · ⛔ **0 mã trạng thái thô** · ⛔ **0** `null`/`undefined`/`NaN` · ⛔ **0 ngày ISO** |
| ⚠️ **⛔ KHÔNG mở được modal** | **11 màn** (bấm nút/dòng ⛔ không mở — ⚠️ màn đó cần **nút riêng** hoặc ⛔ không có modal chi tiết) |

### 37.3 ⚠️ GIỚI HẠN PHƯƠNG PHÁP (⛔ nói thẳng — ⛔ không tô hồng)
⛔ **Không thể nói «đã quét hết modal toàn hệ thống»**: cách mở **chung chung** (bấm nút có chữ «Xem/Chi tiết» rồi bấm nút đầu dòng) **chỉ mở được 4/15 màn**.
⭐ **CÁCH CẢI THIỆN (cho vòng sau)**: đọc mã để tìm **đúng trigger** của từng màn (`onClick={() => open("…", row)}` trong `app/screens/*.tsx`) rồi mở **theo tên modal** — ⭐ giống cách đã tìm ra `userProfile`/`hrProfileEdit` (`§C26`).
⚠️ ⛔ **KHÔNG** kết luận 11 màn kia «sạch» hay «lỗi» — ⚠️ **chưa đo được** ⇒ ⛔ không ghi gì vào sổ bug.

### 37.4 ⚠️ BÀI HỌC KỸ THUẬT (lượt 1 hỏng ⇒ lượt 2 chạy được)
Lượt 1 chết vì **1 lời gọi `Runtime.evaluate` treo** (màn nặng) làm **cả probe dừng** ⇒ ✅ lượt 2: **đặt timeout 25s cho MỖI lời gọi** + **bọc `try/catch`** trả `"ERR:…"` để **đi tiếp** (⭐ probe ⛔ không chết giữa đường) ⇒ lượt 2 **chạy hết 16 màn**.
⇒ ⭐ **LUẬT**: mọi probe nhiều bước **phải có timeout + chịu lỗi cho TỪNG lời gọi** (⛔ không để 1 màn nặng giết cả lượt quét).

### 37.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| Mở modal **theo đúng trigger từng màn** (đọc `open("…")` trong mã) | ⏳ vòng sau |
| «Tiến độ dự án» (ngày ISO) | ⚠️ **`HANDOFF-20261007-C14`** |
| `Inventory.tsx` (nhãn BCH + 6 chỗ ngày ISO) | ⚠️ **`HANDOFF-20261007-C13`** |
---

## TEST-20261007-C38 — **BẢN KIỂM KÊ MODAL TỪ MÃ** (18 tệp) + ⚠️ **ĐÍNH CHÍNH** «11 màn không mở được» + **DỪNG săn modal**

### 38.1 ⭐ BẢN KIỂM KÊ MODAL TỪ MÃ (⭐ tài sản dùng lại — ⛔ khỏi mò)
Grep `open("<khoá>")` trong `app/screens/*.tsx` ⇒ ⭐ **18 tệp màn CÓ modal** (kèm **khoá modal**):
| Tệp | Khoá modal |
|---|---|
| `BoqControl.tsx` | `boqItem` · `boqVersion` · `projectContract` |
| `Delivered.tsx` | `receiptDetail` |
| `HrScreen.tsx` | `userProfileHr` |
| `Inventory.tsx` ⚠️(phiên 02) | `allocate` · `centralReceive` · `issue` · `receipt` · `return` · `transfer` · `warehouse` |
| `MaterialCategoryList.tsx` ⚠️(phiên 02) | `categoryMaster` |
| `MaterialListTable.tsx` | `materialMaster` · `materialMerge` |
| `P08SupplierNavigation.tsx` | `poDetail` |
| `ProjectAggregateTabs.tsx` | `teamCreate` |
| `ProjectEntityModal.tsx` | `teamCreate` · `userProfile` |
| `PurchaseOrderDrawer.tsx` | `detail` · `receiptDetail` |
| `Purchasing.tsx` | `detail` · `po` · `poDetail` |
| `ReceiptDrawer.tsx` | `poDetail` |
| `Receiving.tsx` | `receipt` |
| `RequestDrawer.tsx` | `poDetail` |
| `Requests.tsx` | `detail` · `po` · `request` |
| `Stocktake.tsx` | `count` · `return` |
| `SupplierManager.tsx` | `poDetail` |
| `TeamManagement.tsx` | `userProfile` |

### 38.2 ⚠️ **ĐÍNH CHÍNH GHI CHÉP CỦA TÔI** (`§C37.3`) — ⛔ không phải «probe hỏng»
`§C37.3` tôi ghi «11 màn ⛔ không mở được modal» như **giới hạn phương pháp**. ⭐ **ĐO LẠI BẰNG MÃ**: chỉ **18/… tệp màn có `open(...)`**
⇒ ⚠️ **phần lớn 11 màn đó ⛔ KHÔNG CÓ modal chi tiết dòng** (màn nhập liệu/bảng thuần) ⇒ ⭐ **giới hạn là CẤU TRÚC THẬT, ⛔ không phải lỗi cách bấm**.
⇒ ⭐ **KẾT LUẬN ĐÚNG**: ⛔ không nói «đã quét hết modal» **nhưng cũng ⛔ không nói «probe hỏng»** — ⚠️ **số modal THẬT hữu hạn**, cần **mở theo ĐÚNG KHOÁ** (bảng ở §38.1).

### 38.3 KẾT QUẢ QUÉT THÊM (vòng 35 · 7 đích)
| Kết quả | Chi tiết |
|---|---|
| ✅ **2 MODAL quét — SẠCH** | «Phiếu đề nghị mua hàng» (`entity-detail-modal` — kiểm lại ✅) · ⭐ **«Hồ sơ nhân sự»** (`modal` = `userProfileHr` — ⭐ **vùng phủ MỚI**) ⇒ ⛔ 0 cắt chữ · ⛔ 0 mã thô · ⛔ 0 số thô (`<dt>`/`<dd>`) · ⛔ 0 `null/undefined` · ⛔ 0 ngày ISO |
| ⚪ **4 đích ⛔ không mở** | «Tồn kho & điều chuyển» · «BOQ & bóc tách khối lượng» · «BOQ / Hợp đồng dự án» · «Cấp phát cho tổ đội» (bấm dòng/nút ⛔ không mở) |
| ⚠️ **1 đích ⛔ không thấy nhóm** | «Nhà cung cấp» (⚠️ là mục **cấp 1**, ⛔ không nằm trong nhóm nào) |

### 38.4 ⭐ **DỪNG SĂN MODAL** (⭐ biết dừng đúng lúc — bài học `§C21`)
⚠️ Sau **2 vòng** (34 + 35), vùng phủ modal đạt **5 modal khác nhau** (đều SẠCH) trong khi **bản kiểm kê cho thấy ~26 khoá modal** ⇒ ⚠️ **lợi suất giảm dần**.
⭐ **QUYẾT ĐỊNH**: **DỪNG** săn modal ⛔ thay vì đốt thêm vòng; ⭐ để lại **bản kiểm kê §38.1** + **cách mở đúng khoá** cho ai cần (⛔ không đoán tiếp).
✅ **TỔNG KẾT VÙNG PHỦ MODAL (5 modal, TẤT CẢ SẠCH)**: «Phiếu đề nghị mua hàng» · «Kế hoạch giao hàng» · «Đơn hàng đã giao» · «Quản lý dự án» · «**Hồ sơ nhân sự**».
⚠️ **⛔ CHƯA QUÉT**: ~21 khoá modal còn lại ⇒ ⚠️ **⛔ không kết luận gì về chúng**.

### 38.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ~21 khoá modal còn lại (cần **mở theo đúng khoá**) | ⏳ ⭐ tài sản: bảng §38.1 |
| «Tiến độ dự án» (ngày ISO) | ⚠️ **`HANDOFF-20261007-C14`** |
| `Inventory.tsx` (nhãn BCH + 6 chỗ ngày ISO) | ⚠️ **`HANDOFF-20261007-C13`** |
---

## TEST-20261007-C39 — Săn **2 LỚP LỖI MỚI**: «nhãn dropdown hiện mã» (SẠCH) + «chữ Anh hiển thị» (⇒ **1 lỗi THẬT, đã vá**)

### 39.1 LỚP 1 — **NHÃN `<option>` LÀ MÃ ASCII** (dropdown hiện mã tiếng Anh) ⇒ ✅ **SẠCH**
Quét **toàn bộ `app/**` + `lib/**`** tìm `<option>…</option>` có nhãn **ASCII thuần** ⇒ **4 kết quả, TẤT CẢ HỢP LỆ**:
| Kết quả | ⭐ Vì sao **HỢP LỆ** (⛔ không phải lỗi) |
|---|---|
| «**Cao**» (`ProjectDetailTabs` · `RequestDrawer` · `WorkCenter`) | ⭐ **tiếng Việt ⛔ KHÔNG DẤU** (mức ưu tiên «Cao») |
| «Arial» · «Roboto» · «Tahoma» | **tên FONT** |
| «Email» · «Web» | **tên KÊNH** |
⇒ ✅ **⛔ 0 chỗ hiện mã trạng thái trong dropdown** ⇒ ⭐ **⛔ KHÔNG ghi sổ bug** (§12: đo sạch thì ⛔ không bịa lỗi).

### 39.2 LỚP 2 — **CHỮ TIẾNG ANH Ở VỊ TRÍ NGƯỜI DÙNG ĐỌC** ⇒ 🔴 **1 LỖI THẬT**
⭐ **KỸ THUẬT**: ⛔ **KHÔNG** quét «mọi chữ Anh trong tệp» (sẽ **bắt oan tên biến/hàm/class**) ⇒ **CHỈ quét VỊ TRÍ VĂN BẢN HIỂN THỊ**:
`<th>` · `<dt>` · `<option>` · văn bản JSX giữa `>` và `<` ⇒ **4 nghị vấn**, đã **KIỂM TỪNG CHỖ**:
| Chỗ | Phán quyết |
|---|---|
| 🔴 `ErrorReportAdminPanel.tsx:125` — **`<th>User</th>`** | ⛔ **LỖI THẬT** (lệch với 9 nhãn tiếng Việt cùng dòng) ⇒ ✅ **ĐÃ VÁ** |
| 🔴 `ErrorReportAdminPanel.tsx:179` — **`<dt>User</dt>`** | ⛔ **LỖI THẬT** ⇒ ✅ **ĐÃ VÁ** |
| ✅ `page.tsx:1481` — «Import»/«Export» | ⭐ **HỢP LỆ**: nằm **trong CÂU GIẢI THÍCH tiếng Việt** («… các cột đang bật **Import** trong bảng này… Cờ Hiện/**Export** không được ph…») ⇒ ⚠️ **thuật ngữ tính năng**, ⛔ không phải nhãn; ⭐ và tệp là **LOCK phiên 01** |

### 39.3 CỔNG MỚI `tests/mt3-c12-ui-text-vi.test.mjs` — **3/3 ĐẠT**
| Ca | Nội dung | Kết quả |
|---|---|---|
| `C12-1` | ⛔ **0 chữ Anh ở vị trí hiển thị** trong `app/screens/**` | ✅ ĐẠT (**sau** khi vá — ⛔ 0 người vi phạm còn lại) |
| `C12-2` | 2 chỗ đã vá phải **THỰC SỰ** là tiếng Việt | ✅ ĐẠT |
| `C12-3` | **ĐỐI CHỨNG ÂM**: ⛔ **không bắt oan** **tên biến** · **thuộc tính JSX** · **comment** · tiếng Việt **không dấu** («Cao») · **thuật ngữ hợp lệ** («Email») — và **PHẢI bắt** đúng 2 mẫu thật | ✅ ĐẠT |
⭐ **Danh sách THUẬT NGỮ HỢP LỆ** được ghi thẳng trong cổng (`Email` · `Web` · `CSV` · `PDF` · `Excel` · `QR` · `BOQ` · `KPI` · `MEP` · `QC` · `PDA` · `RFI` · `NCR` · `Arial` · `Roboto` · `Tahoma` · `Dashboard` · `Shopdrawing`) ⇒ ⭐ tránh **báo động giả** về sau.

### 39.4 BUILD + KIỂM CHỨNG
| Bước | Kết quả |
|---|---|
| `gd-cycle` | ✅ **exit 0** · migration **0343** · `BUILT ARTIFACT VALIDATION: ĐẠT` |
| Dịch vụ | ✅ `:8787`/`:9000`/`:18081` **đang nghe** · `:9000` **HTTP 200** |
| Cổng dự án | ✅ **ĐẠT** (3 ✓ + `KET LUAN`) · vân tay HTML **`1b7a5cd90523a298`** |
| Hồi quy | ✅ **865 test · 864 pass · 0 fail · 1 skip** (`REG_EXIT=0`) — ⭐ **+3 ca cổng mới** |
| Phối hợp | ✅ kiểm **⛔ không có probe phiên khác** trước khi dừng dịch vụ · dừng **đúng PID** (19536 · 8576) |

### 39.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| «Tiến độ dự án» (ngày ISO) | ⚠️ **`HANDOFF-20261007-C14`** |
| `Inventory.tsx` (nhãn BCH + 6 chỗ ngày ISO) | ⚠️ **`HANDOFF-20261007-C13`** |
---

## TEST-20261007-C40 — Săn tiếp **5 LỚP LỖI**: **TẤT CẢ SẠCH** + **1 QUAN SÁT** đưa lên thành **CÂU HỎI QUYẾT ĐỊNH**

### 40.1 NĂM LỚP ĐÃ ĐO — ✅ SẠCH (có số liệu, ⛔ không suy đoán)
| Lớp lỗi | Phép đo | Kết quả |
|---|---|---|
| ① **Định dạng SỐ/NGÀY theo locale lạ** | grep `toLocaleString/toLocaleDateString/toLocaleTimeString` trong `app/**`+`lib/**` | ✅ **24/24 chỗ đều ghi rõ `"vi-VN"`** ⇒ ⛔ **không có chỗ nào hiện kiểu Mỹ** |
| ② **locale `en-US`/`en-GB`** | grep `"en[-_]?(US\|GB)?"` | ✅ **⛔ 0 chỗ** |
| ③ **`Intl.NumberFormat()`/`DateTimeFormat()` THIẾU locale** | grep `Intl.(NumberFormat\|DateTimeFormat)\(\s*\)` | ✅ **⛔ 0 chỗ** |
| ④ **Chữ Anh ở NÚT / TOOLTIP / PLACEHOLDER / văn bản JSX** (ngoài `<th>`·`<dt>`·`<option>` mà cổng `C12` đã phủ) | 48 từ tiếng Anh × toàn bộ `app/**/*.tsx` | ✅ **⛔ 0 chỗ** |
| ⑤ **`.toFixed()` cho TIỀN** (dấu `.` thập phân ⛔ lệch kiểu Việt) | grep mọi `.toFixed(n)` + **đọc từng ngữ cảnh** | ✅ **TẤT CẢ đều là PHẦN TRĂM**, ⛔ **không chỗ nào là TIỀN** (`moneyBillion`/`format.format` lo phần tiền — đã dùng `vi-VN`) |

⇒ ⭐ **5 lớp SẠCH** ⇒ ⛔ **KHÔNG ghi sổ bug** (§12: đo sạch thì ⛔ không bịa lỗi).

### 40.2 ⚠️ **QUAN SÁT** (⛔ KHÔNG phải bug — ⭐ cần **QUYẾT ĐỊNH của user**)
⚠️ **Phần trăm KHÔNG có một quy ước thống nhất trong app** (⭐ số liệu thật):
| Cách viết | Số chỗ |
|---|---|
| `toFixed(0)` + `%` (vd `83%`) | **5** |
| `toFixed(1)` + `%` (vd `83.3%`) | **4** |
| `toFixed(2)` + `%` (vd `83.33%`) | **9** |
| `Math.round(...)` + `%` | **4** |
| `Intl` `style:"percent"` | **0** |
⇒ ⚠️ **2 điểm chưa nhất quán**: ① **độ chính xác** (0/1/2 chữ số thập phân) ② **dấu thập phân là `.`** trong khi **TIỀN đã đúng kiểu Việt** (`1.234,56`) ⇒ ⚠️ **trong cùng một màn** có thể thấy `1.234,56 đ` cạnh `83.33%`.
⭐ **VÌ SAO ⛔ KHÔNG TỰ SỬA**: ⚠️ đây là **chủ trương hiển thị** (⛔ không phải lỗi kỹ thuật) · ảnh hưởng **~22 chỗ** trên nhiều màn ⇒ ⛔ **sửa hàng loạt là đi ngược Goal §41** (⛔ không refactor lớn khi chưa cần) ⇒ ⭐ **đã đưa vào `DECISION_LOG`** thành **câu hỏi cho user**.
⚠️ **⛔ KHÔNG** ghi vào `BUG_HOTFIX_LOG` (⛔ không phải bug).

### 40.3 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ⚠️ **Quy ước phần trăm** (chọn độ chính xác + dấu thập phân) | ⭐ **`DECISION_LOG` — chờ USER quyết** |
| «Tiến độ dự án» (ngày ISO) | ⚠️ **`HANDOFF-20261007-C14`** |
| `Inventory.tsx` (nhãn BCH + 6 chỗ ngày ISO) | ⚠️ **`HANDOFF-20261007-C13`** |
---

## TEST-20261007-C41 — ⭐ QUÉT **TAB CON TRONG MODAL** (vùng phủ MỚI): **5/5 tab ĐỔI THẬT & SẠCH** + ⚠️ **BẮT ĐƯỢC 1 LẦN «ĐẠT RỖNG»**

### 41.1 ⭐ PHÁT HIỆN VÙNG PHỦ MỚI
⭐ Đọc mã `app/page.tsx` ⇒ modal «**chi tiết dự án**» chứa **5 TAB CON** (`PROJECT_DETAIL_SUB_TABS` = *Thông tin dự án · Nhân sự · Tổ đội · Kho · Lịch sử*) render qua **`ProjectDetailTabs.tsx`** — ⭐ **chính là 1 trong 6 tệp tôi đã vá** (thẻ trạng thái).
⚠️ ⇒ **4/5 tab CHƯA TỪNG QUÉT** (lượt quét modal `§C37` **chỉ thấy tab mặc định**) ⇒ ⚠️ bằng chứng DOM của tệp đó **còn thiếu**.

### 41.2 ⚠️⚠️ LƯỢT CHẠY 1 — **ĐẠT RỖNG** (⭐ bắt được nhờ **kiểm trạng thái CHỌN**)
| | |
|---|---|
| **Hiện tượng** | bấm 5 tab ⇒ **cả 5 lần trả `NO_TAB`** ⚠️ nhưng **cả 5 lượt quét vẫn báo 0 lỗi** ⇒ ⛔ **«5 tab sạch» là KẾT LUẬN RỖNG** (thực chất quét **lại tab mặc định 5 lần**) |
| **ROOT CAUSE** | ① nhãn thật là «**Thông tin chung**» (⛔ không phải «Thông tin dự án») · ② nút tab có **SỐ ĐẾM dính kèm** («Nhân sự**1**» · «Tổ đội**0**») ⇒ ⛔ **khớp CHÍNH XÁC luôn trượt** |
| ⭐ **CÁCH SỬA** | ① khớp **THEO TIỀN TỐ** (`startsWith`) · ② ⭐ **BẮT BUỘC xác nhận `aria-selected="true"` ĐÃ DI CHUYỂN** rồi **mới** tính kết quả quét |

### 41.3 ✅ LƯỢT CHẠY 2 — **KHÔNG-RỖNG, 5/5 ĐỔI THẬT**
| Tab | Xác nhận `aria-selected` | Kết quả quét |
|---|---|---|
| «**Thông tin chung**» | ✅ chọn sẵn | ⛔ **0 cắt chữ · 0 mã thô · 0 lỗi văn bản** |
| «**Nhân sự**» | ✅ `before=false` ⇒ nay CHỌN | ⛔ 0 · 0 · 0 |
| «**Tổ đội**» | ✅ `before=false` ⇒ nay CHỌN | ⛔ 0 · 0 · 0 |
| «**Kho**» | ✅ `before=false` ⇒ nay CHỌN | ⛔ 0 · 0 · 0 |
| «**Lịch sử**» | ✅ `before=false` ⇒ nay CHỌN | ⛔ 0 · 0 · 0 |
⭐ **5/5 tab ĐỔI ĐƯỢC · 5 lượt quét · ⛔ 0 tab có phát hiện** ⇒ ✅ **`ProjectDetailTabs.tsx` nay CÓ bằng chứng DOM**.
⚠️ Nhân tiện **đính chính** chẩn đoán trước: nhãn **«Nhân sự1» · «Lịch sử»** hiển thị **ĐÚNG tiếng Việt** (⚠️ chữ «s» trong output lượt 1 là **lỗi TRÍCH XUẤT của tôi**, ⛔ không phải lỗi giao diện).

### 41.4 CẬP NHẬT VÙNG PHỦ DOM CỦA `BUG-20261007-C08` (6 tệp)
| Tệp | DOM |
|---|---|
| `AllocateReturn.tsx` · `WorkKanban.tsx` (gián tiếp) · `WorkCenter.tsx` | ✅ **đã đo** |
| ⭐ `**ProjectDetailTabs.tsx**` | ✅ **đo qua 5 TAB CON** (vòng này) |
| ⚠️ `TeamManagement.tsx` · `ProjectEntityModal.tsx` | ⚠️ **chưa đo** — ⚠️ lưu ý: `ProjectEntityModal.tsx` là **component KHÁC** với `EntityDetailModal.tsx` (⚠️ modal tôi quét ở `§C37` là `EntityDetailModal`) |
⇒ ⭐ **4/6 tệp có bằng chứng DOM**; 2 tệp còn lại vẫn **bảo đảm bởi cổng `C11` + bảng nhãn tất định** (⚠️ ⛔ không nói «đã đo hết»).

### 41.5 ⭐ BÀI HỌC (lần 11) — **ĐẠT RỖNG NGUY HIỂM HƠN ĐỎ**
⚠️ Một phép quét có thể **«xanh» mà ⛔ không đo gì** (⛔ bấm trượt ⇒ quét lại chỗ cũ) ⇒ ⭐ **LUẬT MỚI**: mọi phép **bấm-để-đổi-chế-độ** (tab · trang · bộ lọc · danh mục) **PHẢI xác nhận TRẠNG THÁI ĐÃ ĐỔI** (`aria-selected`/`active`/`h1`) **trước khi tin kết quả**.
⭐ Đây là **lần thứ 3** trong phiên gặp bẫy ĐẠT RỖNG/ĐỎ OAN (`§C11` cổng responsive xanh rỗng · `§C34` bộ dò không khớp dạng thật · **`§C41` bấm tab trượt**).
---

## TEST-20261007-C42 — ⭐ CHỐT **VÙNG PHỦ DOM** bằng MÃ (có ĐỐI CHỨNG) + ⭐ **PHÁT HIỆN 4 TỆP MÀN MÔ CÔI**

### 42.1 ⭐ `ProjectEntityModal.tsx` — **ĐÃ CÓ bằng chứng DOM** (⚠️ ghi chú cũ của tôi QUÁ DÈ DẶT)
| Bằng chứng (đọc mã) | Ý nghĩa |
|---|---|
| `page.tsx`: «`ProjectEntityModal` → **MỘT cổng mở `EntityDetailModal`** cho **Project/User/Warehouse/Team**» | ⭐ `ProjectEntityModal` **render** `EntityDetailModal` |
| `WorkHierarchy.tsx`: «`ProjectEntityModal` … **chính component đó render `EntityDetailModal` (U-01) với tab**» | xác nhận quan hệ render |
| `page.tsx`: `const entityModal = entity ? <ProjectEntityModal … /> : null;` | ⭐ được dùng thật ở màn chính |
⇒ ⭐ **KẾT LUẬN ĐO ĐƯỢC**: modal `entity-detail-modal` tôi **đã quét DOM** ở `§C37`/`§C41` (màn «Quản lý dự án», **5 tab**) **CHÍNH LÀ** nội dung của **`ProjectEntityModal`** + `EntityDetailModal`
⇒ ✅ **`ProjectEntityModal.tsx` CÓ bằng chứng DOM** (⚠️ tôi đã ghi «chưa đo» ở `§C41.4` — **quá dè dặt**, nay **sửa lại theo đo**).

### 42.2 ⭐⭐ **PHÁT HIỆN MỚI: 4 TỆP MÀN MÔ CÔI (code chết)**
Phép đo: tìm **tên tệp trần** trong **mọi tệp khác** (`app/**`, `lib/**`, `tests/**`, `scripts/**`).
⭐ **ĐỐI CHỨNG PHƯƠNG PHÁP** (⛔ để tránh kết luận sai): kiểm một màn **chắc chắn đang dùng** ⇒ `WorkCenter` **được tham chiếu ở 2 tệp khác** ⇒ ✅ **phép kiểm ĐÚNG**.
| Tệp màn | Tham chiếu nơi khác | Kết luận |
|---|---|---|
| `ProjectAggregateTabs.tsx` | ⛔ **0** | ⚠️ **MÔ CÔI** |
| `SiteCommandCreateModal.tsx` | ⛔ **0** | ⚠️ **MÔ CÔI** |
| `WarehouseCreateModal.tsx` | ⛔ **0** | ⚠️ **MÔ CÔI** |
| `TeamManagement.tsx` | ⚠️ **chỉ 2 tệp TEST** (`mt3-c11-status-no-raw.test.mjs` · `tm04-team-crud.test.mjs`) · ⛔ **0 import trong `app/**`** | ⚠️ **MÀN MÔ CÔI** (⚠️ **có test riêng** nhưng **⛔ không render ở đâu**) |
⚠️ **HỆ QUẢ CẦN BIẾT**: ① bản vá thẻ trạng thái của tôi trong **`TeamManagement.tsx` là ⛔ KHÔNG TỚI ĐƯỢC** (⚠️ **vô hại** — nếu sau này nối lại thì **đã đúng**) · ② cổng `mt3-c11` của tôi vẫn liệt kê tệp này (⚠️ **hợp lệ**, chỉ là danh sách chờ) · ③ ⚠️ `ProjectAggregateTabs.tsx` **từng xuất hiện trong bản kiểm kê modal** (`§C38.1` — khoá `teamCreate`) ⇒ nay đo được **nó ⛔ không được dùng**.
⇒ ⭐ **BÀI HỌC**: ⚠️ **quét theo MÃ trước khi đo DOM** — ⛔ đừng tốn công DOM-verify một màn **⛔ không tồn tại trên giao diện**.

### 42.3 ✅ VÙNG PHỦ DOM CỦA `BUG-20261007-C08` — **CHỐT: 5/6 tệp + 1 tệp MÔ CÔI**
| Tệp | DOM |
|---|---|
| `AllocateReturn.tsx` | ✅ đo (`§C30`) |
| `WorkCenter.tsx` | ✅ đo (`§C32`) |
| `WorkKanban.tsx` | ✅ đo **gián tiếp** (`§C33` — màn «Giao việc» chứa nó) |
| `ProjectDetailTabs.tsx` | ✅ đo qua **5 TAB CON** (`§C41`) |
| ⭐ `ProjectEntityModal.tsx` | ✅ **đo** (là `entity-detail-modal` — `§C42.1`) |
| ⚠️ `TeamManagement.tsx` | ⚠️ **⛔ KHÔNG THỂ đo DOM** — **màn MÔ CÔI** (⛔ không render) ⇒ ⚠️ **vô hại** |
⇒ ✅ **5/6 tệp có bằng chứng DOM · 1 tệp ⛔ không render ⇒ bản vá vô hại** ⇒ ⭐ **KHÔNG còn lỗ hổng xác minh thực chất**.

### 42.4 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ⚠️ **4 tệp màn mô côi** (nối lại hay xoá) | ⚠️ **`HANDOFF-20261007-C15`** (⚠️ xoá là **hành động phá huỷ** ⇒ ⛔ cần người có quyền quyết) |
| «Tiến độ dự án» (ngày ISO) · `Inventory.tsx` | ⚠️ `HANDOFF-C14` · `HANDOFF-C13` |
| ⭐ `DEC-C11` (quy ước phần trăm) | ⚠️ **chờ USER quyết** |
---

## TEST-20261007-C43 — ⭐ **KIỂM LẠI 4 HANDOFF ĐANG MỞ** (⛔ không để sổ sách sai): **1 ĐÓNG · 3 CÒN ĐÚNG · 1 SỬA SỐ LIỆU**

### 43.1 ⭐ PHƯƠNG PHÁP (⛔ rẻ mà quyết định)
Với **mỗi handoff đang mở**: **đo lại chính đối tượng** của nó trong **mã hiện tại** (⛔ không tin trạng thái cũ) ⇒
⭐ mục đích: **⛔ không để phiên khác làm việc thừa** (nếu đã sửa rồi) và **⛔ không để lỗi thật bị bỏ quên**.

### 43.2 KẾT QUẢ (đo được, vòng 42)
| Handoff | Đo lại | Kết luận |
|---|---|---|
| ⭐ **`C12`** (mã thoát cổng không ổn định) | chạy cổng **3 lần**: ⭐ **3/3 `EXIT=0`** · đủ **3 ✓ + KẾT LUẬN** · ⛔ **0 assertion** · mã có **`process.exit(1)` dòng 162** + **`process.exit(0)` dòng 165** | ✅ **ĐÓNG (`DONE`)** — ⭐ **đã được sửa đúng khuyến nghị** |
| ⚠️ **`C13`** (`Inventory.tsx`) | ngày ISO hiển thị: ⭐ **8 chỗ** (⚠️ handoff cũ ghi **6** ⇒ **ĐÍNH CHÍNH**) · nhãn **BCH** vẫn rơi xuống giá trị thô · **chưa** dùng miền `bch_confirmation` | ⚠️ **`OPEN`** (đã sửa số liệu) |
| ⚠️ **`C14`** (`app/page.tsx`) | còn `{row.startDate\|\|"—"}` (**1**) · `{row?.startDate \|\| ""}` (**1**) · module `project_progress` còn | ⚠️ **`OPEN`** |
| ⚠️ **`C15`** (4 tệp màn) | cả **4 tệp** vẫn **⛔ 0 tham chiếu** trong `app/**` + `lib/**` | ⚠️ **`OPEN`** |

### 43.3 ⭐ BÀI HỌC (14)
⚠️ **HANDOFF LÀ VĂN BẢN SỐNG** — ⛔ **không phải** bản án vĩnh viễn: **phải đo lại** trước khi dùng lại (⭐ handoff `C12` **đã được sửa** mà ⛔ sổ sách phiên 03 **vẫn ghi `OPEN`**)
và ⛔ **ngược lại** phải **tin số ĐO**, ⛔ không tin con số cũ (⚠️ `C13` tôi ghi **6**, đo lại là **8**).
⇒ ⭐ **LUẬT**: mỗi ~**10 vòng**, phiên nên **rà lại handoff** bằng **đo THẬT** (⭐ đúng việc vòng này).

### 43.4 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ✅ `C12` | **ĐÓNG** |
| ⚠️ `C13` · `C14` · `C15` | ⚠️ **OPEN** (⚠️ ngoài quyền phiên 03) |
| ⭐ `DEC-C11` (quy ước phần trăm) | ⚠️ **chờ USER** |
---

## TEST-20261007-C44 — ⭐ **QUÉT HỒI QUY 24 MÀN TRÊN BUILD MỚI `0344`** ⇒ **23 SẠCH · 1 phát hiện = ĐÚNG `C14` ĐÃ BIẾT** (⛔ **0 hồi quy MỚI**)

### 44.1 ⭐ VÌ SAO PHẢI QUÉT LẠI
⚠️ Sau lượt xác minh trước của phiên 03, **phiên khác đã đổi 68 tệp** (⚠️ kể cả `lib/request-export.ts` — **1 tệp trong vùng phiên 03**) và nay **đã build `0344`**
⇒ ⭐ **bằng chứng cũ có thể KHÔNG còn giá trị** ⇒ ⭐ phải **đo lại trên bản đang phục vụ** (⛔ không tin kết quả cũ).

### 44.2 KẾT QUẢ ĐO (BẰNG DOM, MÁY DÒ ĐÃ CHỨNG MINH)
| Chỉ số | Số đo |
|---|---|
| Màn đo được | ⭐ **24 màn** (⛔ không phải 29 — ⚠️ **nói đúng số ĐO ĐƯỢC**, ⛔ không thổi phồng) |
| ✅ **SẠCH** | **23 màn** (⛔ 0 mã thô · 0 số tiền thô · 0 `null/undefined`/`NaN`/`[object Object]` · 0 ngày ISO) |
| 🔴 **Có phát hiện** | **1 màn**: «**Tiến độ dự án**» — `NGÀY_ISO:«2026-01-01»` · `NGÀY_ISO:«2026-09-23»` |
| ⭐ **ĐỐI CHIẾU** | ⚠️ phát hiện này **CHÍNH LÀ** ⭐ **`HANDOFF-20261007-C14`** (module `project_progress` trong `app/page.tsx` = **LOCK phiên 01**) ⇒ ⛔ **KHÔNG phải hồi quy mới** |
| ⭐ **KẾT LUẬN** | ✅ **⛔ 0 HỒI QUY DO THAY ĐỔI SONG SONG** — ⭐ cây mã **vẫn sạch** sau **68 tệp** phiên khác sửa ⇒ ⭐ **phối hợp đa phiên KHÔNG làm hỏng vùng phiên 03 đã vá** |

### 44.3 ⭐ GIÁ TRỊ
⭐ Đây là **phép đo HỢP TÁC THẬT** (⛔ không phải tự khen): nó **kiểm chứng chéo** rằng công việc song song của 2 phiên kia
**⛔ không phá** 12 bản vá hiển thị của phiên 03 · và ⭐ **xác nhận `C14` vẫn là việc thật đang mở** (⚠️ nếu lượt này «sạch hết» thì `C14` có thể đã được sửa ⇒ phải đóng handoff — ⚠️ **đã kiểm, ⛔ chưa được sửa**).

### 44.4 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ⚠️ `C14` («Tiến độ dự án» — `page.tsx`, **LOCK phiên 01**) | ⚠️ **`OPEN`** — ✅ **đo lại vẫn còn** (⭐ bằng chứng DOM mới nhất) |
| ⚠️ `C13` (`Inventory.tsx` — **phiên 02**) · `C15` (4 tệp mô côi) | ⚠️ **`OPEN`** |
| ⭐ `DEC-C11` (quy ước phần trăm) | ⚠️ **chờ USER** |
---

## TEST-20261007-C45 — ⭐ **VÙNG PHỦ MỚI: MODAL DẠNG NHẬP LIỆU** (lần đầu quét) ⇒ **SẠCH** + ⭐ **QUY TẮC MỚI cho máy dò nhãn trường**

### 45.1 ⭐ VÌ SAO QUÉT (⛔ không phải quét cho có)
⚠️ Trước vòng này phiên 03 **chưa từng quét một modal DẠNG NHẬP LIỆU nào** — chỉ quét **modal CHI TIẾT** (`§C37`/`§C41`) ⇒ ⚠️ **đó là lỗ hổng phủ có giá trị nhất còn lại**:
⭐ form là nơi user **NHẬP dữ liệu**, ⚠️ lỗi ở đây (thiếu nhãn · dropdown mã thô · rác `null`) **khó phát hiện bằng mắt** hơn nhiều so với lỗi hiển thị.

### 45.2 ⭐ CÁCH TỚI ĐƯỢC (⭐ đọc MÃ, ⛔ không đoán nhãn)
Đọc `lib/menu-helpers.ts` ⇒ màn render `Requests.tsx` có **khoá `requests`** và **nhãn THẬT** = «**Phiếu đề nghị mua hàng**» (nhóm «MUA HÀNG & CUNG ỨNG»)
⚠️ (⚠️ lượt đầu tôi đoán «Đề xuất mua hàng» ⇒ **⛔ trượt**, 0 màn nào khớp) ⇒ ⭐ **bài học nhỏ**: ⛔ **đoán nhãn menu là vô ích**, **đọc `menu-helpers.ts`** là ra.
⭐ Nút mở: **«＋ Lập phiếu đề nghị»** (toolbar) ⇒ modal `.modal` mở ra với **30 trường nhập**.

### 45.3 KẾT QUẢ QUÉT (máy dò 4 lớp)
| Lớp kiểm | Kết quả |
|---|---|
| ⛔ **option mã thô** (dropdown hiện mã tiếng Anh) | ✅ **0** — mọi `<option>` đều **tiếng Việt** |
| ⛔ **rác** (`null`/`undefined`/`NaN`/`[object Object]`) + **ngày ISO** hiển thị | ✅ **0** (⚠️ **đã loại** `<input type="date">` — ⚠️ giá trị ISO ở đó là **ĐÚNG thiết kế**) |
| ⛔ **cắt chữ** trong khối | ✅ **0** |
| ⛔ **nhãn trường RỖNG** | ✅ **0** |
| 🔴 **trường "thiếu nhãn"** | ⚠️ **2** ⇒ ⭐ **ĐÃ KIỂM TỪNG CHỖ ⇒ ⛔ KHÔNG PHẢI LỖI** (xem 45.4) |

### 45.4 ⭐ PHÂN XỬ 2 TRƯỜNG "THIẾU NHÃN" — ✅ **HỢP LỆ**, ⛔ **KHÔNG ghi sổ bug**
| Trường (DOM) | Cột **`<thead>`** tương ứng | Phán quyết |
|---|---|---|
| `<input value="m">` | «**Đơn vị**» | ✅ **HỢP LỆ** — nhãn nằm ở **dòng tiêu đề bảng dòng hàng** |
| `<input type="number" min="0.001" step="0.001" required value="1">` | «**Khối lượng đề nghị mua đợt này \***» | ✅ **HỢP LỆ** — ⭐ và có cả **dấu `*` bắt buộc** |
⇒ ⭐ **BÀI HỌC QUAN TRỌNG**: ⚠️ máy dò nhãn **PHẢI loại** các trường **nằm TRONG BẢNG** mà **`<thead>` đã cung cấp nhãn cột** — ⛔ nếu không sẽ **báo động giả** và ⛔ dẫn tôi đi "sửa" một thứ **đang đúng**.
⭐ Đã ghi quy tắc này vào `SHARED_STATE §140` để các phiên sau ⛔ không lặp lại sai lầm.

### 45.5 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ⏳ **~20 khoá modal** chưa quét (⚠️ phần lớn là **form tạo mới**) | ⭐ nay **đã có công thức**: đọc **`menu-helpers.ts`** lấy nhãn ⇒ mở màn ⇒ bấm nút **`＋ Tạo/Lập/Thêm`** ⇒ chạy máy dò `§C45` |
| ⚠️ `C13` · `C14` · `C15` | ⚠️ **OPEN** (ngoài quyền phiên 03) |
| ⭐ `DEC-C11` | ⚠️ **chờ USER** |
---

## TEST-20261007-C46 — **QUÉT FORM TRÊN QUY MÔ RỘNG**: **5 form mở được ⇒ 5/5 SẠCH** + ⚠️ **GHI RÕ GIỚI HẠN CỦA PHÉP ĐO**

### 46.1 ⭐ CÁCH LÀM (⭐ an toàn dữ liệu là điều kiện tiên quyết)
Duyệt **mọi nhóm menu → mọi màn**, ở mỗi màn thử bấm nút **MỞ FORM** rồi chạy **máy dò 4 lớp** (`§C45`), sau đó **đóng form** để sang màn kế.
⚠️⚠️ **LUẬT AN TOÀN ĐÃ ÁP DỤNG**: bộ chọn nút **CHỈ khớp `＋|Tạo|Thêm|Mới|Lập|Nhập`** và ⛔ **LOẠI BỎ** mọi nút chứa **`Gửi` · `Lưu` · `Xoá/Xóa` · `Duyệt` · `Huỷ/Hủy`**
⇒ ⭐ **⛔ KHÔNG có thao tác nào ghi/tạo dữ liệu** (⚠️ chỉ **mở form** rồi **đóng**) — ⭐ đây là **điều kiện bắt buộc** khi quét form tự động.

### 46.2 KẾT QUẢ (đo được)
| Chỉ số | Số đo |
|---|---|
| ⭐ **Form mở được & quét** | **5** |
| ✅ **SẠCH** | ⭐ **5/5** — ⛔ 0 option mã thô · ⛔ 0 rác/ngày ISO · ⛔ 0 cắt chữ · ⛔ 0 trường thiếu nhãn (ngoài bảng) |
| 🔴 **Có phát hiện** | **0** |
| ⚠️ **Màn không khớp mẫu nút tạo** | **19** |
| **Các form đã quét (lần này)** | «**Nhà cung cấp**» (**8 trường**) ×3 *(mở từ 3 màn khác nhau — ⭐ cùng 1 form dùng chung)* · «**Phiếu đề nghị mua hàng**» (**30 trường**, ⭐ quét lần 2 ⇒ **kết quả LẶP LẠI y hệt** `§C45` ⇒ ⭐ **độ ỔN ĐỊNH của máy dò được chứng minh**) · «**Thi công**» (**6 trường**) |

### 46.3 ⚠️⚠️ GIỚI HẠN CỦA PHÉP ĐO (⭐ nói thẳng, ⛔ không kết luận quá)
⚠️ **19 màn "không có nút tạo"** ⛔ **KHÔNG có nghĩa** là 19 màn đó **không có form**:
⭐ bộ chọn của tôi ⛔ **chỉ khớp** nút bắt đầu bằng `＋|Tạo|Thêm|Mới|Lập|Nhập` ⇒ ⚠️ màn có nút tên khác (vd «**Khởi tạo**» · «**Ghi nhận**» · «**Đăng ký**» · «**＋ Phiếu nhập**») **sẽ bị bỏ qua**.
⇒ ⭐ **KẾT LUẬN ĐÚNG MỰC**: «**6 form đã mở & quét đều SẠCH**» (⚠️ 1 ở `§C45` + 5 ở đây) — ⛔ **KHÔNG** kết luận «mọi form trong hệ đều sạch».
⭐ **CÁCH KHẮC PHỤC (nếu cần)**: mở rộng bộ chọn theo **danh sách nhãn nút đọc từ MÃ** (⭐ ⛔ không đoán) hoặc **đếm số `open("…")` trong mã** để biết còn bao nhiêu form.

### 46.4 ⭐ MATRIX VÙNG PHỦ ĐÃ ĐO (tính đến vòng 46)
| Vùng | Số đo | Kết quả |
|---|---|---|
| Màn chính | **24** (lượt mới nhất) | 23 sạch · 1 = `C14` đã biết |
| Modal CHI TIẾT | **5** (+ **5 tab con**) | sạch |
| ⭐ **Modal DẠNG NHẬP LIỆU (form)** | ⭐ **6** | ⭐ **sạch 6/6** |
| Lớp lỗi theo mã | **7 lớp** | 0 lỗi |
| ⚠️ **Chưa quét** | ⚠️ **~20 khoá modal** + ⚠️ màn có nút tạo tên khác | ⚠️ **⛔ không kết luận gì** |
---

## TEST-20261007-C47 — **QUÉT 2 LƯỢT** (MỞ FORM + MỞ CHI TIẾT DÒNG): **FORM 5/5 SẠCH · CHI TIẾT 3/3 SẠCH** · ⭐ phủ thêm **3 modal chi tiết chưa từng quét**

### 47.1 ⭐ BỐI CẢNH: vòng 46 để lại **GIỚI HẠN** ⇒ vòng này **bịt**
⚠️ Vòng 46 kết luận đúng mực «19 màn không khớp mẫu nút tạo» ⛔ **không** nghĩa là không có form ⇒ ⭐ tôi **thử 2 cách bịt**:
| Cách | Kết quả |
|---|---|
| ① **Lấy nhãn nút từ MÃ** (đọc `open("key")` + ngữ cảnh) | ⛔ **THẤT BẠI**: ⚠️ phần lớn `open()` nằm trong **callback/đăng ký handler** ⇒ ⛔ **nhãn nút ⛔ không suy ra được** từ ngữ cảnh mã (⚠️ chỉ thu được **vài** nhãn thật: «**Thêm hệ vật tư**» · «**Lập phiếu đề nghị mua hàng**» · «**Nhập phiếu đề nghị từ tệp Excel**») |
| ② ⭐ **Mở rộng bộ khớp NÚT theo THỰC TẾ DOM** + **quét 2 LƯỢT** | ✅ **HIỆU QUẢ** ⇒ ⭐ **đây là cách đúng** |

### 47.2 ⭐ CÁCH LÀM (2 lượt, ⛔ vẫn khoá AN TOÀN DỮ LIỆU)
| Lượt | Bộ khớp nút | Mục đích |
|---|---|---|
| ① **MỞ FORM** | `＋|Tạo|Thêm|Mới|Lập|Nhập|**Khởi tạo**|**Ghi nhận**|**Đăng ký**` | mở form nhập liệu |
| ② **MỞ CHI TIẾT DÒNG** | nút/liên kết ở **dòng đầu bảng** khớp `Xem|Chi tiết|Mở|Sửa|…` | mở modal **chi tiết** (⚠️ đây là các khoá `poDetail`·`detail`·`receiptDetail` ⚠️ **chưa từng quét**) |
⚠️⚠️ **KHÓA AN TOÀN (⛔ bắt buộc)**: cả 2 lượt **LOẠI BỎ** mọi nút chứa **`Gửi`·`Lưu`·`Xoá/Xóa`·`Duyệt`·`Huỷ/Hủy`·`tệp`·`Đăng xuất`·`Xuất`·`In`·`Tải`**
⇒ ⭐ **⛔ 0 thao tác ghi/tạo/xoá/xuất dữ liệu** — ⭐ chỉ **mở** rồi **đóng**.

### 47.3 KẾT QUẢ (đo được)
| Lượt | Số mở được | Sạch | Phát hiện |
|---|---|---|---|
| ① **FORM** | **5** | ⭐ **5/5** | **0** |
| ② **CHI TIẾT DÒNG** | **3** | ⭐ **3/3** | **0** |
| **TỔNG** | **8** | ⭐ **8/8 SẠCH** | ⭐ **0** |

⭐ **Các modal đã quét (lần này)**: FORM «**Nhà cung cấp**» (8 trường, **×3 màn**) · «**Phiếu đề nghị mua hàng**» (**30 trường**, ⭐ **lần 3 ⇒ kết quả vẫn Y HỆT**) · «**Thi công**» (6 trường) ·
CHI TIẾT «**Phiếu đề nghị mua hàng**» (2 trường) · ⭐ «**Đơn hàng đã giao**» (3 trường) · ⭐ «**Quản lý dự án**» (0 trường — ⭐ modal **thẻ trạng thái/chi tiết**).
⭐ **Máy dò nay thêm lớp 5**: **thẻ trạng thái phơi MÃ THÔ** (`.badge`/`[class*=status]`) — ⛔ **0 phát hiện** ⇒ ✅ **củng cố `BUG-C08`** (bản vá thẻ trạng thái **vẫn đúng** trên 8 modal).

### 47.4 ⚠️ GIỚI HẠN (⭐ vẫn nói thẳng)
⚠️ **3 modal chi tiết** mở được là **ít** — ⚠️ phần lớn màn **dòng bảng không có nút hành động** khớp mẫu, hoặc màn **không có bảng** (⚠️ màn lưới thẻ/KPI) ⇒ ⛔ **KHÔNG** kết luận «mọi modal chi tiết đều sạch».
⚠️ Vẫn còn **~20 khoá `open("…")` trong mã** mà ⛔ **chưa mở được bằng DOM** ⇒ ⚠️ **cần** cách khác (⭐ vd **đọc mã để tìm ĐÚNG màn + nút** cho từng khoá, ⛔ không quét mò).

### 47.5 ⭐ MATRIX VÙNG PHỦ (cập nhật)
| Vùng | Số đo | Kết quả |
|---|---|---|
| Màn chính | **24** | 23 sạch · 1 = `C14` đã biết |
| Modal **CHI TIẾT** | **5** (+3 mới) = **8** | ⭐ **sạch 8/8** |
| Modal **NHẬP LIỆU (form)** | **6** | ⭐ **sạch 6/6** |
| **TAB CON** trong modal | **5** | sạch |
| Lớp lỗi theo mã | **7 lớp** (+**thẻ trạng thái** = lớp 5 của máy dò DOM) | 0 lỗi |
| ⚠️ **Chưa quét** | ⚠️ **~20 khoá `open()`** + màn có nút tên khác | ⚠️ **⛔ không kết luận** |
---

## TEST-20261007-C48 — ⚠️ **PHÉP ĐO LỚP SỐ TIỀN BỊ VÔ HIỆU** (bảng trống dữ liệu) + ✅ **cập nhật BẢNG ĐIỀU KHIỂN** + ✅ **bác bỏ 1 nghi vấn "trùng nội dung"**

### 48.1 ✅ VIỆC 1 — CẬP NHẬT **BẢNG ĐIỀU KHIỂN** `SESSION_C/README.md` (⭐ khớp số đo mới nhất)
| Mục | Trước (vòng 41) | ⭐ Sau (vòng 48) |
|---|---|---|
| Số mục log | TASK 39 · TEST 41 · CHG 15 · EVT 59 | **TASK 46 · TEST 46 · CHG 16 · EVT 66** |
| Migration / vân tay | `0339`→**`0343`** · `1b7a5cd90523a298` | `0339`→**`0344`** · **`d826dd0b33dbb3cd`** |
| Lần build | 5 | **6** |
| Màn chính | «**29 màn**» | ⭐ «**24 màn** *(lượt đo mới nhất)*» — ⚠️ **số ĐO ĐƯỢC**, ⛔ không giữ số cũ |
| Modal | «5 modal» | ⭐ **8 modal CHI TIẾT + 6 modal NHẬP LIỆU + 5 tab con** |
⭐ **Thêm**: mục **LUẬT AN TOÀN khi quét tự động** (⭐ để phiên khác ⛔ không bấm nhầm nút `Gửi/Lưu/Xoá`).

### 48.2 ⚠️⚠️ VIỆC 2 — **PHÉP ĐO LỚP SỐ TIỀN: VÔ HIỆU** ⇒ ⛔ **KHÔNG được coi là "SẠCH"**
Quét **19 màn** tìm ô **số tiền** hiển thị **không phân cách** ⇒ ⭐ kết quả: **0 cột tiền · 0 số thô** ⚠️ — nhưng ⭐ **tôi ⛔ KHÔNG kết luận "lớp tiền sạch"** vì:
⭐ **CHẨN ĐOÁN (đo được, 4 màn)**:
| Màn | Tiêu đề bảng đo được | Ô số dài (≥5 chữ số) |
|---|---|---|
| «**Sản lượng**» | Dự án · Kỳ · Tham chiếu · **Kế hoạch** · **Thực tế báo cáo** · **Được duyệt** · Người báo cáo · Trạng thái | ⛔ **0** |
| ⭐ «**Thu hồi vốn**» | … **Hóa đơn** · ⭐ **Tiền thực thu** · ⭐ **Công nợ** · Trạng thái | ⛔ **0** |
| «Đấu thầu» · «Hợp đồng các loại» | Mã nhiệm vụ · … · **Ưu tiên** · **%** | ⛔ **0** |
⇒ ⭐ **ROOT CAUSE của phép đo vô hiệu**: ⚠️ **CỘT TIỀN CÓ THẬT** (vd «**Tiền thực thu**» · «**Hóa đơn**» · «**Công nợ**») ⚠️ **nhưng Ô TRỐNG** — ⚠️ **CSDL fixture ⛔ không có số liệu** ⇒ ⭐ **không có gì để đo**.
⚠️ ⇒ ⭐ **KẾT LUẬN ĐÚNG**: «**phép đo VÔ HIỆU**» — ⛔ **KHÔNG** «lớp tiền sạch», ⛔ **KHÔNG** «lớp tiền lỗi» (**⛔ không đủ dữ liệu để phán**).
⭐ **BÀI HỌC (16)**: ⚠️ **mọi phép quét phân loại bằng DOM đều PHỤ THUỘC DỮ LIỆU** — ⭐ **trên CSDL trống thì kết quả "0 lỗi" là VÔ NGHĨA** (⚠️ đúng cái bẫy «ĐẠT RỖNG» của `§C41`, ⚠️ lần này tôi **tự phát hiện và ⛔ không khoe "sạch"**).

### 48.3 ✅ VIỆC 3 — **BÁC BỎ 1 NGHI VẤN** («Đấu thầu» và «Hợp đồng các loại» hiện **cùng một bảng**)
⭐ **Nghi vấn ban đầu**: 2 mục menu **khác tên** mà **cùng 10 tiêu đề cột** ⇒ ⚠️ nghi **lỗi định tuyến**.
⭐ **PHÉP THỬ QUYẾT ĐỊNH (so cả TIÊU ĐỀ và DÒNG)**:
| Màn | Số dòng | Dòng đầu | Ghi chú màn |
|---|---|---|---|
| «Đấu thầu» | **1** | `✓Chưa có nhiệm vụ phù …` | «**Dữ liệu mới sẽ xuất hiện tại đây.**» |
| «Hợp đồng các loại» | **1** | `✓Chưa có nhiệm vụ phù …` | «**Dữ liệu mới sẽ xuất hiện tại đây.**» |
⇒ ⭐ **KẾT LUẬN**: ⛔ **KHÔNG phải lỗi** — ⚠️ **cả 2 module CHƯA CÓ DỮ LIỆU** ⇒ ⭐ **trạng thái RỖNG giống nhau là ĐƯƠNG NHIÊN** (⚠️ **không thể phân biệt "lỗi" với "chưa có dữ liệu"** bằng phép đo này).
⭐ ⭐ **ĐIỂM CỘNG GHI NHẬN** (✅ đo được): **trạng thái rỗng có THÔNG ĐIỆP TIẾNG VIỆT RÕ RÀNG** («Chưa có nhiệm vụ phù hợp» + «Dữ liệu mới sẽ xuất hiện tại đây») ⇒ ✅ **UX trạng thái rỗng TỐT**, ⛔ không phải lỗi.
⚠️ **ĐỂ PHÂN XỬ DỨT KHOÁT** (nếu user muốn): cần **CÓ DỮ LIỆU** trong CSDL cho 2 module đó ⇒ ⚠️ **ngoài quyền phiên 03** (⛔ không tạo dữ liệu nghiệp vụ).

### 48.4 Việc còn lại
| Việc | Trạng thái |
|---|---|
| ⚠️ **Lớp SỐ TIỀN** | ⚠️ **CHƯA ĐO ĐƯỢC** (⚠️ cần CSDL có số liệu) — ⭐ **`HANDOFF-C16`** (mới) |
| ⚠️ `C13` · `C14` · `C15` | ⚠️ **OPEN** (ngoài quyền phiên 03) |
| ⭐ `DEC-C11` (quy ước phần trăm) | ⚠️ **chờ USER** |
---

## TEST-20261007-C49 — ⭐ **KIỂM CHỨNG QUA GIAO DIỆN THẬT** (user yêu cầu) cho `BUG-20261007-C12`: **2/2 PHẦN ĐÃ VÁ ĐỀU ĐÚNG** + **ẢNH BẰNG CHỨNG**

### 49.1 ⭐ CÁCH LÀM (đăng nhập **admin** thật · tài khoản test `e2e.diag` · ⛔ không đụng dữ liệu người thật)
Đăng nhập `admin` trên `:9000` → mở **«Hồ sơ nhân sự»** → bấm **dòng `e2e.diag`** → **«Sửa hồ sơ»** → ⭐ **bắt payload POST thật** bằng CDP (`Network.requestWillBeSent`) + ⭐ **chụp ảnh** + ⭐ **đối chiếu CSDL** sau khi lưu.

### 49.2 ⭐ BẰNG CHỨNG TRƯỚC KHI VÁ (ĐÃ ĐO ĐƯỢC)
| Phép đo | Kết quả |
|---|---|
| **Payload POST thật** (tab «Thông tin cá nhân» đang mở, sửa CCCD) | ⛔ `position:""` ⇒ 🔴 **bằng chứng mất dữ liệu ngay trên request thật** |
| **CSDL sau lưu** | 🔴 `position` **«Chỉ huy trưởng» ⇒ `NULL`** ⇒ **MẤT «Chức danh»** |
| ⭐ **Ô hiện trên tab «cá nhân»** | 🔴 «Số CCCD/CMND» = **«E2E-DIAG»** (= **MÃ NV**) · «Địa chỉ thường trú» = **«Chẩn đoán»** (= **HỌ TÊN**) · «Trình độ» = **«Chỉ huy trưởng»** (= **CHỨC DANH**) ⚠️ dù API trả 3 trường này **RỖNG** |

### 49.3 ✅ BẰNG CHỨNG SAU KHI VÁ (build **`0347`** · vân tay `d02e9e4702c7b7cd`)
| Phép đo | Kết quả |
|---|---|
| **Payload POST thật** | ✅ `position:"**Chỉ huy trưởng**"` ⇒ ⭐ **GIỮ NGUYÊN giá trị hồ sơ** (⛔ không còn `""`) |
| **Ô tab «Thông tin user»** | ✅ «Mã nhân viên» = `E2E-DIAG` · «Họ tên» = `Chẩn đoán` · «Chức danh» = `Chỉ huy trưởng` · «Email» = `diag@vntech.vn` ⭐ đúng |
| ⭐ **Ô tab «Thông tin cá nhân»** | ✅ **TẤT CẢ RỖNG** (`""`) ⇒ ⛔ **không còn hiện giá trị của tab kia** ⇒ **PHẦN 2 ĐÃ VÁ** |
| **CSDL sau khi bấm «Lưu hồ sơ»** | ✅ `position='Chỉ huy trưởng'` · các trường khác `NULL` ⇒ ⭐ **⛔ KHÔNG MẤT DỮ LIỆU** |
⭐ **ẢNH BẰNG CHỨNG** (trong `SESSION_C/evidence/`):
`BUG-C12-1-danh-sach-truoc-khi-sua.png` · `BUG-C12-2-modal-sua-tab-user.png` · `BUG-C12-3-modal-sua-tab-ca-nhan.png` · `BUG-C12-4-sau-khi-luu.png` · `BUG-C12-5-modal-chi-tiet.png` · `BUG-C12-6-modal-sua-dung-pham-vi.png` · `BUG-C12-7-modal-sua-tab-ca-nhan-dung-pham-vi.png` · ⭐ `BUG-C12-8-FIXED-tab-user.png` · ⭐ `BUG-C12-9-FIXED-tab-ca-nhan.png`

### 49.4 ⚠️ ĐÍNH CHÍNH 2 KẾT LUẬN SAI CỦA CHÍNH TÔI (⭐ trung thực)
| Kết luận ban đầu | ⛔ Vì sao SAI | ✅ Sự thật (đo lại) |
|---|---|---|
| «API chỉ trả **1** `hrRecords` trong khi CSDL có **26** ⇒ đường đọc hỏng» | ⚠️ **tôi đọc SAI KHOÁ JSON**: response là `{authenticated, data, ok}` ⇒ mảng nằm ở **`data.hrRecords`**, còn `$j.hrRecords` = `null` ⇒ `@($null)` đếm ra **1** | ✅ `data.hrRecords` = **26** bản ghi · ⭐ **giá trị khớp CSDL 100%** ⇒ **đường đọc ⛔ KHÔNG sai** |
| «Modal chi tiết ghép nhãn↔giá trị sai» | ⚠️ lượt đo đầu **không khoanh vùng** ⇒ có thể đọc **nhầm modal** (chi tiết vs sửa) | ✅ đo lại **đúng phạm vi** (`[data-vntech="hr-profile-edit"]` — ⭐ chỉ **1** component dùng khoá này) ⇒ lỗi nằm ở **modal SỬA** (React tái dùng ô), ⛔ không phải modal chi tiết |

### 49.5 ⭐ THIỆT HẠI ĐÃ ĐO + ⚠️ VIỆC USER CẦN LÀM
| Hồ sơ | Trạng thái | ⚠️ Việc cần làm |
|---|---|---|
| `e2e.diag` (tài khoản test) | ✅ **đã khôi phục đúng snapshot** | ⛔ không cần làm gì |
| ⚠️ **`cha.ht`** (NV-CHA · «Chỉ huy trưởng A») | 🔴 `position` = **NULL** · `phone` = **NULL** · ⚠️ `permanent_address` = «**Chỉ huy trưởng A**» (= **họ tên**) · `education_level` = «**Chỉ huy trưởng**» (= **chức danh**) | ⭐ **user nhập lại**: «Chức danh» + «Điện thoại»; ⚠️ **xoá/sửa** «Địa chỉ thường trú» và «Trình độ học vấn» (đang chứa giá trị **ghi nhầm từ trước**) |
| Toàn cục | **26** hồ sơ · rỗng: `position` **1** · `phone` **2** · `identity_no` **1** · `birth_date` **1** · `permanent_address` **1** · `education_level` **1** | ⭐ kiểm 2 hồ sơ trên là đủ (⚠️ các trường rỗng khác có thể do **chưa từng nhập**) |
| **REGRESSION** | ✅ **870 test · 869 pass · 0 fail · 1 skip** (`REG_EXIT=0`) · `tsc` **0** · `eslint` **0** | ✅ |
---

## TEST-20261007-C50 — ⭐ **QUÉT TOÀN LỚP theo LUẬT 17** + **AUDIT DỮ LIỆU LẪN TRƯỜNG**: lớp lỗi **ĐÃ ĐÓNG trong quyền phiên 03** · thiệt hại **khu trú 1 hồ sơ**

### 50.1 ⭐ QUÉT TOÀN LỚP `String(fd.get(…) || "")` (⭐ theo **luật 17**: ⛔ vá nửa lớp = chưa vá)
| Kết quả | Số đo |
|---|---|
| Tổng số chỗ còn mẫu cũ trong `app/**` | **21** (ở **14** tệp) |
| ⭐ Trong đó là **form SỬA có TAB** (⭐ **đúng lớp `BUG-C12`**) | ⭐ **0** — ✅ **`HrProfileEditModal` là chỗ DUY NHẤT** ⇒ ⭐ **LỚP LỖI ĐÃ ĐÓNG trong quyền phiên 03** |
| Còn lại là **form TẠO MỚI** (`save_benefit_record` · `save_labor_contract` · `save_correspondence` · `save_accounting_voucher` · `save_construction_daily_log` · `save_site_expense_claim` · `save_organization_unit` · `save_hr_record` ở `HrScreen`) | **20** ⇒ ⚠️ `""` = **người dùng chưa chọn/chưa nhập** ⇒ ✅ **HỢP LỆ** (⛔ tạo mới thì ⛔ không có dữ liệu cũ để mất) |
| ⚠️ `app/page.tsx` | **8 chỗ + CÓ TAB** ⇒ ⚠️ **NGUY CƠ CÙNG LỚP** ⇒ ⛔ **ngoài quyền phiên 03** ⇒ ⭐ **ĐÃ GIAO `HANDOFF-20261007-C18`** (S01) |

### 50.2 ⭐ AUDIT DỮ LIỆU — hồ sơ bị **LẪN TRƯỜNG** (⭐ do cơ chế ② ghi giá trị của tab kia)
| Phép đo (SQL trên `hr_records` × `users`) | Kết quả |
|---|---|
| Hồ sơ có `permanent_address` = **họ tên** · `identity_no` = **mã NV** · `birthplace` = **họ tên** · `education_level` = **chức danh** | ⭐ **1** hồ sơ: **`cha.ht`** (`permanent_address` = «**Chỉ huy trưởng A**» = **họ tên**) |
| Tổng hồ sơ / có dữ liệu thật (`position` hoặc `identity_no`) | **26 / 26** ⇒ ⭐ **thiệt hại KHU TRÚ** (⛔ không lan rộng) |
| Mẫu đối chiếu (5 hồ sơ đầy đủ) | ✅ «Số 1 Đường Lê Lợi, Phường …» · «Trung cấp» · «Chỉ huy trưởng» ⇒ ⭐ **dữ liệu bình thường** |
⭐ **KẾT LUẬN**: ⭐ **chỉ `cha.ht` cần user nhập lại** («Chức danh» + «Điện thoại», và **sửa** «Địa chỉ thường trú»/«Trình độ») — ⛔ **không có làn sóng hỏng dữ liệu** trên 26 hồ sơ.

### 50.3 Việc còn lại sau vòng này
| Việc | Trạng thái |
|---|---|
| ⚠️ **`cha.ht`** — user nhập lại dữ liệu | ⚠️ **chờ USER** |
| ⚠️ `HANDOFF-C17` (BE: «khoá vắng = không đổi») · ⚠️ `HANDOFF-C18` (`page.tsx`: 8 chỗ mẫu cũ + có tab) | ⚠️ **chờ S01** |
| ⭐ `DEC-C11` (phần trăm) · `C15` (4 tệp mô côi) · `C16` (số tiền — cần dữ liệu) | ⚠️ **chờ USER** |
---

## TEST-20261007-C51 — ⭐ **AUDIT MỌI LUỒNG SỬA (UPSERT) TRONG QUYỀN PHIÊN 03** ⇒ **⛔ 0 nguy cơ còn lại** + nâng `HANDOFF-C18` lên `HIGH` bằng bằng chứng

### 51.1 ⭐ PHƯƠNG PHÁP (⭐ theo **luật 17**: ⛔ vá nửa lớp = chưa vá)
① Liệt kê **MỌI action ghi** trong `app/**` (`save_*` · `update_*` · `set_*`) ⇒ **26 tệp** · ② với mỗi tệp: có mẫu **`String(fd.get(…) \|\| "")`** không · ③ có **render có điều kiện/tab** không · ④ action đó có **nhánh UPDATE theo ID** (⇒ **UPSERT**) không.

### 51.2 ✅ KẾT LUẬN CHO **QUYỀN PHIÊN 03** — ⛔ **KHÔNG còn nguy cơ**
| Nhóm | Bằng chứng | Kết luận |
|---|---|---|
| `HrProfileEditModal.tsx` (**UPSERT** `save_hr_record` + `update_user`, **có TAB**) | ⛔ trước: mẫu cũ ⇒ 🔴 **mất dữ liệu thật** | ✅ **ĐÃ VÁ** (`hrVal` + `key={tab}`) + **VERIFIED** |
| `Payments.tsx` (`save_contract_payment`, ⭐ **UPSERT theo `paymentId`**) | dùng **`{...Object.fromEntries(new FormData(f))}`** ⇒ ⛔ không dùng mẫu cũ · ⭐ ô **⛔ không render có điều kiện** · ⭐ và đây là **form TẠO MỚI** (`form.reset()` sau khi lưu) | ✅ **AN TOÀN** |
| 20 chỗ mẫu cũ còn lại (`BenefitsScreen` · `ConstructionScreen` · `CorrespondenceScreen` · `DocumentsScreen` · `HrScreen` · `LaborScreen` · `SiteCostScreen` · `SiteCommandCreateModal`) | đều là **form TẠO MỚI** (`Thêm mới`) ⇒ `""` = **người dùng chưa nhập** | ✅ **HỢP LỆ** (⛔ không có dữ liệu cũ để mất) |
| Các luồng `update_*`/`set_*` khác (`RequestDrawer.update_returned_request` · `WorkCenter.update_work_item_status` · `Purchasing.update_boq_contract_prices` · `set_*_status`) | ⛔ **không** dùng mẫu `String(fd.get \|\| "")` (chỉ gửi **trường cụ thể**) | ✅ **AN TOÀN** |

### 51.3 ⚠️ **NGOÀI QUYỀN PHIÊN 03** — ⭐ **NÂNG `HANDOFF-C18` LÊN `HIGH`** (bằng chứng mới)
`app/page.tsx` có **6 chỗ** mẫu cũ, trong đó **3 chỗ dấu hiệu render có điều kiện** ⇒ ⭐ **VÀ cả 3 action đều có nhánh UPDATE theo ID**:
`save_payment_plan` (**`planId`**) · `save_material_norm` (**`normId`**) · `save_contract_payment` (**`paymentId`**, ⭐ `recoveryRecordId=clean(...)||null` ⇒ **ghi NULL khi ô vắng**)
⇒ ⚠️ **nếu đó là form SỬA** ⇒ **đúng lớp `BUG-C12`** ⇒ ⭐ đã ghi **chi tiết + mẫu vá + cổng** vào `HANDOFF-C18` cho **phiên 01**.

### 51.4 ⭐ **LUẬT MỚI (20) — GHI ĐỂ MỌI PHIÊN TRÁNH**
⚠️ **`{...Object.fromEntries(new FormData(f))}` + backend `clean(payload.x)`** = ⚠️ **KHOÁ VẮNG ⇒ backend coi như rỗng ⇒ ghi `""`/`NULL`** ⇒ ⭐ **mọi form SỬA (UPSERT) ⛔ KHÔNG được dựa vào «khoá vắng = không đổi»** trừ khi backend đã đổi sang **PATCH semantics** (`HANDOFF-C17`).
⇒ ⭐ **CÁCH AN TOÀN**: form SỬA **phải gửi ĐỦ trường** (⭐ lấy **giá trị hiện có** cho ô không render) — ⭐ mẫu `hrVal`.
---

## TEST-20261007-C52 — ⭐ **AUDIT LỚP 18** (React tái dùng `<input>` giữa 2 tab) ⇒ **⛔ 0 nguy cơ còn lại trong quyền phiên 03**

### 52.1 ⭐ PHƯƠNG PHÁP (⭐ đo được, ⛔ không suy đoán)
① Quét **mọi component** trong `app/**` có **TAB** (`role="tab"`/`aria-selected`) **VÀ** có **ô nhập** (`<input`/`<select>`) ⇒ **7 tệp** ·
② với mỗi tệp đếm: **số nhánh ternary render cùng loại thẻ bao ngoài** (`? ( <div …`) · **số `key={tab}`** · ③ ⭐ **kiểm chặt**: **ô nhập nằm TRONG nhánh ternary** không.

### 52.2 ✅ KẾT QUẢ (đo được)
| Tệp | tab | ô nhập | nhánh ternary cùng loại | `key={tab}` | ⭐ ô nhập **TRONG** ternary | Kết luận |
|---|---|---|---|---|---|---|
| ⭐ **`HrProfileEditModal.tsx`** (phiên 03) | ✅ | ✅ | **1** | ⭐ **2 (cả 2 nhánh)** | ⚠️ **1** | ✅ **ĐÃ VÁ** (dòng **175** + **191** đều `key={tab}`) |
| `ContractReviewScreen.tsx` | ✅ | ✅ | 0 | 0 | 0 | ✅ **⛔ không cùng điều kiện** |
| `ProjectDetailTabs.tsx` | ✅ | ✅ | 0 | 0 | 0 | ✅ |
| `Purchasing.tsx` | ✅ | ✅ | 0 | 0 | 0 | ✅ |
| `WorkCenter.tsx` | ✅ | ✅ | 0 | 0 | 0 | ✅ |
| `Inventory.tsx` (**phiên 02**) | ✅ | ✅ | 0 | 0 | 0 | ✅ |
| ⚠️ `app/page.tsx` (**phiên 01**) | ✅ | ✅ | 0 | 0 | ⚠️ **1** | ⚠️ **nguy cơ THẤP** (⚠️ có 1 ô trong ternary ⚠️ nhưng **⛔ không có 2 nhánh cùng loại thẻ**) ⇒ ⭐ đã ghi vào `HANDOFF-C18` |

### 52.3 ⭐ KẾT LUẬN
⭐ **Điều kiện gây lỗi `BUG-C12` phần 2** = **2 nhánh tab render CÙNG loại thẻ bao ngoài ở CÙNG vị trí** ⇒ ⭐ chỉ **`HrProfileEditModal`** thoả (**1** nhánh) ⇒ ✅ **đã vá + VERIFIED** (⭐ kiểm bằng **giao diện thật**: tab «cá nhân» hiện **rỗng đúng thực tế**, CSDL **giữ nguyên** sau khi Lưu).
⚠️ **6 tệp còn lại = 0 nhánh cùng loại** ⇒ ⛔ **không cùng điều kiện** ⇒ ✅ **LỚP 18 ĐÓNG trong quyền phiên 03**.
⚠️ **Giới hạn của phép đo (⭐ nói thẳng)**: đây là **phân tích TĨNH** (đọc mã) ⇒ ⚠️ có thể **bỏ sót** trường hợp React tái dùng ô qua **đường khác** (vd **map theo index** · **fragment đổi thứ tự**) ⇒ ⭐ **muốn chắc 100% phải kiểm ĐỘNG từng tab** (⚠️ phiên 03 **chỉ kiểm động `HrProfileEditModal`** — nơi có **bằng chứng lỗi thật**).
---

## TEST-20261007-C53 — ⭐ **CỔNG MỚI `mt3-c14`** (khoá **luật 18**) + ⚠️ **BẮT ĐƯỢC 1 LẦN «ĐẠT RỖNG» NỮA** (nhờ **đối chứng âm**)

### 53.1 ⭐ CỔNG MỚI — `tests/mt3-c14-tab-form-remount.test.mjs` (**3 ca**)
| Ca | Nội dung | Kết quả |
|---|---|---|
| `C14-1` | ⛔ **KHÔNG** tệp nào trong `app/**` có **TAB** mà render **cùng `className`** ở **≥2 nhánh ternary** **thiếu `key`** | ✅ ĐẠT |
| `C14-2` | Tệp đã vá (`HrProfileEditModal`) **PHẢI còn `key={tab}` trên CẢ HAI nhánh** | ✅ ĐẠT (**đúng 2**) |
| `C14-3` | **ĐỐI CHỨNG ÂM**: bộ dò **PHẢI** bắt **mẫu CŨ thật** (2 nhánh `form-grid`) ⛔ nếu không ⇒ **cổng VÔ DỤNG** | ✅ ĐẠT |

### 53.2 ⚠️⚠️ **BÀI HỌC (21) — «ĐẠT RỖNG» LẦN THỨ 4** (⭐ đối chứng âm cứu lần này)
⛔ **Bộ dò đời đầu** của tôi dùng regex `\?\s*\(\s*<div\s+className="([^"]+)"` ⇒ ⚠️ **CHỈ khớp nhánh `? (`** (then) ⛔ **BỎ SÓT nhánh `) : (`** (else)
⇒ ⚠️ với mẫu thật (2 nhánh) nó **chỉ trả 1 phần tử** ⇒ 🔴 **`C14-1` ĐẠT trong khi thực chất bộ dò CHƯA đủ mạnh** (⭐ **ĐẠT RỖNG**).
⭐ **CÁCH PHÁT HIỆN**: ca **`C14-3` (đối chứng âm)** ⛔ **thất bại** ⇒ ✅ tôi **sửa bộ dò** (khớp **cả `? (` và `) : (`**, ⭐ và chỉ báo khi **cùng `className` lặp ≥2 lần đều thiếu `key`** — ⭐ đúng điều kiện gây lỗi)
⇒ ✅ **3/3 ĐẠT** và ⭐ **kết quả quét KHÔNG còn rỗng**.
⭐⭐ **LUẬT RÚT RA**: ⛔ **KHÔNG BAO GIỜ** viết cổng mà ⛔ **thiếu ĐỐI CHỨNG ÂM** — ⚠️ **4 lần** trong phiên này «cổng xanh» nhưng **bộ dò chưa đủ mạnh** (`§C11` · `§C34` · `§C41` · **`§C53`**).
⚠️ ⭐ **VÀ**: khi regex khớp **cấu trúc JSX có 2 nhánh** (`? … : …`) ⇒ **PHẢI khớp CẢ HAI nhánh** — ⛔ đừng chỉ khớp nhánh đầu.

### 53.3 ✅ KẾT QUẢ QUÉT LẦN NÀY (⭐ không rỗng)
⭐ **`app/**`**: **⛔ 0 tệp** có tab mà render **cùng `className` ≥2 nhánh thiếu `key`** ⇒ ✅ **LUẬT 18 ĐƯỢC KHOÁ BẰNG CỔNG** (⭐ ⛔ không chỉ nằm trong tài liệu).
⚠️ **Giới hạn (nói thẳng)**: cổng là **TĨNH** ⇒ ⛔ không bắt được React tái dùng ô qua **map theo index** · **fragment đổi thứ tự** ⇒ ⭐ **form MỚI vẫn phải kiểm ĐỘNG** (⭐ như tôi đã làm với `HrProfileEditModal`).

### 53.4 Hồi quy
✅ **chạy sau khi thêm cổng `C14`** — xem dòng `REG` của vòng này (⭐ **+3 ca**).
---

## TEST-20261007-C54 — ⭐ **META-GATE `mt3-c15`**: audit **CHÍNH CÁC CỔNG** ⇒ **12/12 cổng ĐẠT CHUẨN** (đối chứng âm + chốt vùng phủ) + ⚠️ **1 BÀI HỌC về «đối chứng âm SAI LỚP»**

### 54.1 ⭐ META-GATE MỚI — `tests/mt3-c15-gate-hygiene.test.mjs` (**4 ca**, ⭐ có **đối chứng âm** cho chính nó)
| Ca | Nội dung | Kết quả |
|---|---|---|
| `C15-1` | ⭐ **CHỐT VÙNG PHỦ**: phải thấy **≥ 8 cổng** + 2 cổng cụ thể ⇒ ⛔ nếu bộ liệt kê hỏng thì **kết quả VÔ NGHĨA** | ✅ ĐẠT |
| `C15-2` | **MỌI** cổng `mt3-c*` phải có **ĐỐI CHỨNG ÂM** + **khẳng định THẬT** (`assert.`) | ✅ ĐẠT |
| `C15-3` | Cổng **quét nhiều tệp** phải có **CHỐT VÙNG PHỦ** | ✅ ĐẠT |
| `C15-4` | **ĐỐI CHỨNG ÂM của meta-gate**: bộ dò **PHẢI bắt** tệp cổng «xanh rỗng» + ⛔ **không báo oan** cổng đủ chuẩn | ✅ ĐẠT |

### 54.2 ⚠️ **META-GATE ĐÃ TÌM RA 6 KHUYẾT ĐIỂM TRONG CHÍNH CÁC CỔNG CỦA TÔI** (⭐ rồi tôi vá hết)
| Khuyết điểm | Cổng | ✅ Đã vá thế nào |
|---|---|---|
| ⛔ **THIẾU ĐỐI CHỨNG ÂM** | `c03` · `c05` · `c06` · `c08` | ⭐ thêm ca đối chứng âm **dùng ĐÚNG biểu thức bộ dò của chính cổng đó** (⭐ nạp **mẫu lỗi lịch sử thật** + **mẫu đã vá** để ⛔ không báo oan) |
| ⛔ **THIẾU CHỐT VÙNG PHỦ** | `c06` · `c08` (± `c10` · `c11` · `c12`) | ⭐ thêm `assert.ok(files.length >= 40, …)` ⇒ ⛔ nếu bộ quét đọc **0 tệp** thì cổng **ĐỎ ngay** (⛔ không «xanh rỗng») |
⭐ **KẾT QUẢ SAU KHI VÁ**: ⭐ **12/12 cổng ĐẠT** — `C03` **9** · `C05` **9** · `C06` **5** · `C07` **2** · `C08` **5** · `C09` **4** · `C10` **7** · `C11` **4** · `C12` **3** · `C13` **5** · `C14` **3** · `C15` **4** (⛔ 0 lỗi).

### 54.3 ⚠️⚠️ **BÀI HỌC (22) — «ĐỐI CHỨNG ÂM SAI LỚP» cũng nguy hiểm như ⛔ KHÔNG CÓ ĐỐI CHỨNG ÂM**
⭐ Khi viết đối chứng âm cho cổng `c03`, tôi thử **8 mẫu kỹ thuật chung** (`save_hr_record` · `hr_records` · `JSON` · `API` · …) và nó **chỉ bắt 1/8** ⇒ ⚠️ tôi **suýt kết luận «bộ dò QUÁ YẾU»**.
⭐ **ĐỌC LẠI MÃ** mới thấy: `JARGON` **CỐ Ý HẸP** — ⭐ nó nhắm **đúng các chuỗi ĐÃ RÒ THẬT** ở `TeamDirectory.tsx` (`inventory[]` · `team_members` · `stock_issues` · `payload` · `NOT NULL` · `bootstrap` …), ⛔ **không phải «mọi từ kỹ thuật»**.
⇒ ✅ **SỬA ĐỐI CHỨNG ÂM** (dùng **đúng lớp mẫu** của cổng: `inventory[]` · `team_members` · `material_returns` · `payload` · `bootstrap` · `MT3 §`) ⇒ **bắt 8/8** ✅ và **⛔ không báo oan** câu nghiệp vụ tiếng Việt.
⭐⭐ **LUẬT**: ⛔ **mẫu thử của đối chứng âm PHẢI thuộc ĐÚNG LỚP mà cổng nhắm tới** — ⚠️ dùng mẫu **sai lớp** sẽ **báo oan một bộ dò ĐÚNG** ⇒ ⭐ **hậu quả: đi «sửa» thứ đang đúng** (⚠️ đúng loại sai lầm đã trả giá nhiều lần trong repo).

### 54.4 Hồi quy
✅ chạy **hồi quy đầy đủ** sau khi thêm `C15` + vá 4 cổng + 5 chốt vùng phủ — xem dòng `REG` của vòng này.
---

## TEST-20261007-C55 — ⭐ **ÁP THƯỚC ĐO CỦA META-GATE RA TOÀN BỘ `tests/**`** (chỉ ĐỌC): **5 test quét thư mục thiếu «chốt vùng phủ»** + ⭐ ghi nhận ~24 tệp đã có đối chứng âm

### 55.1 ⭐ PHƯƠNG PHÁP (⭐ read-only, ⛔ không sửa tệp của phiên khác)
Sau khi phiên 03 **tự vá 6 khuyết điểm** trong **12 cổng của mình** và tạo **meta-gate** `mt3-c15`, phiên 03 **áp CÙNG thước đo** ra **toàn bộ `tests/**`**: mỗi tệp kiểm **(a)** có `assert.` · **(b)** có **«ĐỐI CHỨNG ÂM»** · **(c)** có **quét thư mục** không · **(d)** nếu quét thì có **«CHỐT VÙNG PHỦ»** không.

### 55.2 ✅ KẾT QUẢ (đo được, vòng 53)
| Chỉ số | Số đo |
|---|---|
| Tổng test `*.test.mjs` | **150** |
| Của phiên 03 (`mt3-c*`) | **14** (⭐ **tất cả đã đạt chuẩn** sau vòng 52) |
| **Khác** (phiên 01/02 + nền tảng) | **136** |
| ⭐ **Đã có «ĐỐI CHỨNG ÂM»** | ~**24** tệp — ⭐ nổi bật họ **`ad01…ad16`** (phiên 01) ✅ |
| ⚠️ **QUÉT THƯ MỤC mà THIẾU «CHỐT VÙNG PHỦ»** | ⭐ **5** tệp: `d105-jsx-comment-textnode` · `golive-tablist-co-css` · `mt3-ui-02-status-labels` · `p07-supplier-partner-split` · `p12-05-user-identity-model` |
| ✅ Quét thư mục **CÓ** chốt vùng phủ | `d107-bang-pr-khop-so-o` · `f03-tai-chinh-audit-deps` · `f04-f05-hanh-chinh-lich-kien-truc` · `mt3-ui-16b-xlsx-utf8` · `mt3-ui-25-all-groups-tabs` · `p01-p02-p03-contract` |

### 55.3 ⚠️ VÌ SAO 5 TỆP KIA LÀ **RỦI RO THẬT** (⭐ không phải «bắt bẻ hình thức»)
⭐ Một cổng **quét thư mục** rồi khẳng định «**0 vi phạm**» ⚠️ **vẫn XANH nếu bộ quét đọc được 0 tệp** (⚠️ đường dẫn sai · cấu trúc thư mục đổi · `walk()` lỗi) ⇒ ⭐ **cổng VÔ NGHĨA mà ⛔ không ai biết** — ⚠️ **đúng cái bẫy phiên 03 đã mắc 4 lần** (`§C11` · `§C34` · `§C41` · `§C53`).
✅ **ĐÃ GIAO `HANDOFF-20261007-C19`** (⚠️ S01/S02) kèm **đoạn mã 1 dòng** để vá, ⛔ **phiên 03 KHÔNG tự sửa test của phiên khác** (Goal §19/§35).

### 55.4 ⭐ GHI NHẬN ĐIỀU TỐT (⭐ công bằng, ⛔ không chỉ nêu lỗi)
⭐ Họ **`ad01…ad16`** của phiên 01 có **đối chứng âm ở gần như mọi tệp** ⇒ ⭐ **chuẩn mực tốt**, ⭐ phiên 03 **học được** cách đặt tên và cấu trúc từ đó.
⚠️ Và **~112 tệp** ⛔ không có đối chứng âm ⚠️ **không có nghĩa là sai**: nhiều test **khẳng định trực tiếp** một hằng số/chuỗi (⭐ sai ⇒ **ĐỎ** ngay) ⇒ ⛔ **không cần** đối chứng âm ⇒ ⭐ **chỉ** cổng **quét rộng + khẳng định «0 vi phạm»** mới **thật sự cần**.
## BỔ SUNG cho TEST-20261007-C55 — ⚠️ **ĐÍNH CHÍNH SỐ LIỆU** (⭐ đọc từng tệp ⇒ **2/5 báo oan**) + **BÀI HỌC (23)**
- ⚠️ **SỐ LIỆU BAN ĐẦU SAI**: bản đầu tôi ghi «**5 tệp** quét thư mục thiếu chốt vùng phủ» ⇒ ⭐ **ĐỌC LẠI TỪNG TỆP** phát hiện:
  ✅ `golive-tablist-co-css` **CÓ chốt** (dòng **55**: `assert.ok(ds.length >= 10, …)`) · ✅ `partners-separate-table` **CÓ chốt** (dòng **77**: `assert.ok(sqlFiles.length > 100, …)`).
- ⚠️ **ROOT CAUSE**: bộ dò «chốt vùng phủ» của tôi đòi **`.length >= N` VÀ `includes(`** + ⚠️ **ngầm giả định biến tên `files`** ⇒ ⛔ **quá khắt khe** khi áp lên **tệp của phiên khác** (⚠️ mỗi phiên đặt tên khác: `ds` · `sqlFiles` …).
- ⭐ **SỐ LIỆU ĐÚNG**: **11** tệp quét thư mục ⇒ ⭐ **8 CÓ chốt** ✅ · ⚠️ **3 CẦN XEM** (`d105-jsx-comment-textnode` ⚠️ **rõ nhất** — `readdirSync` dòng **31**, ⛔ không assert số lượng, `assert.deepEqual(loi, [], …)` dòng **117** vẫn xanh nếu quét 0 tệp · `p12-05-user-identity-model` ⚠️ biên · `t10-approval-center` ⚠️ biên).
- ⭐⭐ **BÀI HỌC (23)**: ⛔ **KHÔNG gửi cho phiên khác danh sách lỗi sinh từ BỘ DÒ THÔ** — ⭐ **quét để tìm ỨNG VIÊN → ĐỌC TỪNG ỨNG VIÊN → chỉ bàn giao cái ĐÃ KIỂM → ghi rõ MỨC ĐỘ CHẮC CHẮN → và NÊU CẢ PHẦN ĐÃ ĐÚNG của họ**.
  ⚠️ Nếu gửi nguyên danh sách cũ ⇒ ⭐ **phiên khác đi «sửa» thứ đang ĐÚNG** (⚠️ đúng loại sai lầm repo đã trả giá: «lần thứ 7 suýt sửa thứ đang đúng»).
- ✅ **ĐÃ SỬA**: `HANDOFF-20261007-C19` nay có **mục ĐÍNH CHÍNH** + **danh sách đúng** + **mức `THẤP`** + ⭐ **ghi nhận điều TỐT của phiên khác** (**8/11 tệp có chốt** · họ **`ad01…ad16`** có **đối chứng âm**).
---

## TEST-20261007-C56 — ⭐ **RÀ LẠI 6 HANDOFF ĐANG MỞ BẰNG ĐO THẬT** (⭐ luật `§132` ~10 vòng/lần) ⇒ **CẢ 6 VẪN CÒN** + ⚠️ **ĐÍNH CHÍNH 1 SỐ LIỆU**

### 56.1 ⭐ PHƯƠNG PHÁP
⭐ Với **mỗi handoff đang mở**: **đo lại chính đối tượng** trong **mã hiện tại** (⛔ không tin trạng thái cũ) ⇒ ⭐ mục đích: ⛔ **không để phiên khác làm việc thừa** (nếu đã sửa) và ⛔ **không để lỗi thật bị bỏ quên**.

### 56.2 KẾT QUẢ ĐO (vòng 54)
| Handoff | Đo lại (bằng chứng) | Kết luận |
|---|---|---|
| ⚠️ **`C13`** (`Inventory.tsx` — phiên 02) | ⭐ **8** chỗ `String(row.issuedAt\|receivedAt\|returnedAt).slice(0, 10)` · ⚠️ `String(row.bchConfirmationStatus …)` **vẫn rơi xuống giá trị thô** · ⛔ **chưa** dùng miền `bch_confirmation` | ⚠️ **CÒN** |
| ⚠️ **`C14`** (`app/page.tsx` — phiên 01) | ⭐ `row.startDate\|\|"—"` (**1**) · `row?.startDate \|\| ""` (**1**) · module `project_progress` **còn** | ⚠️ **CÒN** |
| ⚠️ **`C15`** (4 tệp màn MÔ CÔI) | ⭐ **cả 4** tệp vẫn **0 tham chiếu** trong `app/**`+`lib/**` | ⚠️ **CÒN** (vẫn mô côi) |
| ⚠️ **`C17`** (BE `saveHrRecord` — «khoá vắng = không đổi») | ⭐ **`containsKey` = ⛔ KHÔNG có** · ⭐ tệp còn **73** chỗ `nvl(payload.get(…))` ⇒ ⚠️ **ngữ nghĩa «ghi đè» vẫn nguyên** | ⚠️ **CÒN** |
| ⚠️ **`C18`** (`page.tsx` — 6 dòng mẫu cũ + góc luật 18) | ⭐ **6 DÒNG** mẫu `String(fd.get(x) \|\| "")` = **8 LƯỢT** (3 dòng có **DẤU HIỆU render có điều kiện**: `save_payment_plan`·`save_material_norm`·`save_contract_payment`) ⇒ ⚠️ **không đổi** so với vòng 49 | ⚠️ **CÒN** |
| ⚠️ **`C19`** (3 test phiên khác thiếu chốt vùng phủ) | ⭐ **`d105`** · **`p12-05`** · **`t10`** — **cả 3 vẫn chưa có** chốt (`CHỐT VÙNG PHỦ` hoặc `.length >= N`) | ⚠️ **CÒN** |

### 56.3 ⚠️ **ĐÍNH CHÍNH SỐ LIỆU** (⭐ trung thực — luật 23)
⚠️ `HANDOFF-C18` (bản vòng 49) ghi «**8 chỗ** mẫu cũ» ⇒ ⭐ **CHÍNH XÁC PHẢI LÀ**: **`6 DÒNG` = `8 LƯỢT`** (⭐ 2 dòng có **2 lượt** mỗi dòng; ⚠️ bộ đếm `regex.Matches(...).Count` đếm **LƯỢT**, còn bảng liệt kê theo **DÒNG**).
⭐ **Vì sao quan trọng**: ⚠️ nếu phiên 01 đọc «8 chỗ» rồi **tìm đủ 8 dòng** mà chỉ thấy **6** ⇒ ⚠️ **tưởng còn sót 2 chỗ chưa tìm ra** ⇒ ⭐ **mất thời gian vô ích** (⚠️ đúng loại lỗi «handoff gây việc thừa» mà luật 23 cảnh báo).
✅ **ĐÃ SỬA**: `HANDOFF-C18` nay ghi rõ **«6 DÒNG · 8 LƯỢT»** + danh sách **6 dòng** (⚠️ ⛔ không phải 8).

### 56.4 ⭐ GHI NHẬN VỀ PHIÊN KHÁC (⭐ quan sát, ⛔ không phải lỗi)
⚠️ `app/page.tsx` **có thay đổi chưa commit** (`git diff --numstat` = **20 thêm / 10 bớt**) ⇒ ⭐ **phiên 01 ĐANG làm việc** ⇒ ⛔ phiên 03 **KHÔNG đụng vào** (Goal §19/§35) · ⭐ và **hồi quy vẫn XANH** sau các thay đổi đó (`901 test · 900 pass · 0 fail`) ⇒ ⭐ **phối hợp KHÔNG gây hỏng**.

### 56.5 ✅ Việc còn lại
⭐ **CẢ 6 handoff MỞ** (⚠️ **tất cả ngoài quyền phiên 03**) ⇒ ⭐ phiên 03 **tiếp tục các việc KHÔNG phụ thuộc** (`SHARED_STATE §159`).
---

## TEST-20261007-C57 — ⭐ **KIỂM BẰNG GIAO DIỆN THẬT VỚI TÀI KHOẢN KHÔNG PHẢI ADMIN** (⭐ đúng yêu cầu user) ⇒ 🔴 **phát hiện `BUG-C13`**

### 57.1 ⭐ VÌ SAO LÀM (⭐ user yêu cầu rõ)
User: «hãy kiểm tra lại bằng giao diện user thật vào tài khoản **admin hoặc hrm hoặc tài khoản có perm hành chính nhân sự** để test, chụp ảnh bằng chứng nếu cần thiết.»
⚠️ Trước vòng này phiên 03 **chỉ kiểm bằng `admin`** ⇒ ⭐ **chưa phủ vai trò `hr`** ⇒ ⚠️ **lỗ hổng xác minh** (⚠️ mà quyền thường khác nhau giữa admin và user thường).

### 57.2 ⭐ CÁCH LÀM (⭐ đọc MÃ để lấy thông tin đăng nhập, ⛔ không đoán)
⭐ Tìm trong **bộ công cụ E2E của repo**: `tools/probe-03.mjs` có ``login("e2e.ns", "Vn@2026Test")`` ⇒ ⭐ **`e2e.ns` / `Vn@2026Test`**.
⭐ Tài khoản **`e2e.ns`** = **role `hr`** («E2E Nhân sự», phòng **`ORG-HCPC`**) — ⭐ **đúng loại tài khoản user yêu cầu**.

### 57.3 KẾT QUẢ (đo được)
| Phép đo | Kết quả |
|---|---|
| Đăng nhập `e2e.ns` | ✅ **HTTP 200** · giao diện nhận đúng user · **13 nhóm menu** |
| Màn «Hồ sơ nhân sự» | ✅ **MỞ ĐƯỢC** (📸 `evidence/BUG-C12-10-role-hr-danh-sach.png`) ⇒ ⭐ **đúng quyền XEM** |
| Nút «**Sửa hồ sơ**» | 🔴 **⛔ KHÔNG CÓ** ⇒ ⚠️ **không sửa được hồ sơ** ❗ |
| Quyền **THẬT** của tài khoản (đo bằng **API**) | ✅ `data.modulePermissions` **76 dòng** · ⭐ **`dept_legal_hr` view=1 create=1 edit=1** (nguồn `company_leadership`) ⇒ ⭐ **CÓ quyền SỬA** |
| Điều kiện UI hiện tại | ⚠️ `allModulePermissions` của user = **0 dòng** ⇒ ⛔ **điều kiện không bao giờ đúng** · ⚠️ `HR_EDIT_MODULES` chứa **`dept_hr_legal`** (**mã ĐẢO**) ⛔ không phải **`dept_legal_hr`** |
| CSDL sau phiên kiểm | ✅ **⛔ KHÔNG đổi** (⚠️ không có thao tác ghi nào xảy ra) |

### 57.4 🔴 KẾT LUẬN — **LỖI THẬT `BUG-20261007-C13` (`HIGH`)**
⛔ **User CÓ quyền SỬA hồ sơ nhân sự NHƯNG ⛔ KHÔNG thấy nút để sửa** ⇒ ⚠️ **chặn nghiệp vụ HR** cho **mọi tài khoản được cấp quyền theo PHÒNG BAN** (⚠️ phổ biến: `department_module_permissions` có **481** dòng).
✅ **ĐÃ GIAO `HANDOFF-20261007-C20`** (⛔ `page.tsx` = **LOCK phiên 01**) kèm **bằng chứng 4 phép đo** + **bản vá 1 DÒNG** dùng helper **`modulePermission(data, "dept_legal_hr").canEdit`** (⭐ helper đã có sẵn, **đã đúng**, **thuộc quyền phiên 03**).

### 57.5 ⭐ BÀI HỌC (24) — **KIỂM BẰNG `admin` LÀ ⛔ CHƯA ĐỦ**
⚠️ `admin` **vượt mọi cổng quyền** (⭐ `modulePermission` trả **toàn quyền** cho admin) ⇒ ⭐ **mọi lỗi PHÂN QUYỀN đều VÔ HÌNH khi test bằng admin**.
⇒ ⭐ **LUẬT**: với **màn có nút bị chặn bởi quyền** ⇒ ⭐ **PHẢI kiểm thêm 1 tài khoản KHÔNG PHẢI admin** (⭐ như user đã yêu cầu); ⭐ và **khi phát hiện nút ẩn** ⇒ ⚠️ **phải đo QUYỀN THẬT** (DB + `data.modulePermissions`) **trước khi** kết luận «đúng là thiếu quyền» — ⚠️ nếu không sẽ **bỏ sót lỗi ẩn quyền** (⚠️ đúng lỗi này).
---

## TEST-20261007-C58 — ⭐ **QUÉT TOÀN LỚP `BUG-C13`** (luật 17) + **ĐO TÁC ĐỘNG BẢN VÁ** + cổng mới `C16`

### 58.1 ⭐ PHƯƠNG PHÁP (luật 17: ⛔ vá nửa lớp = chưa vá)
① Quét **mọi chỗ** dùng `allModulePermissions` trong `app/**`+`lib/**` ⇒ **14 chỗ** · ② quét **mọi danh sách MÃ MODULE CỨNG** ⇒ **3 chỗ** · ③ **phân loại** «cùng khuôn» vs «đúng thiết kế» · ④ với mỗi chỗ cùng khuôn: **xác định quyền sở hữu** (⛔ sửa được hay ⛔ không).

### 58.2 KẾT QUẢ PHÂN LOẠI (⭐ trung thực — ⛔ không phải chỗ nào cũng là lỗi)
| Nhóm | Chỗ | Phán quyết |
|---|---|---|
| ✅ **ĐÚNG THIẾT KẾ** | `PermissionAccessPanel` · `AdminUserModalTabs` · `permsOf` · `userPermissionSpec` · `accountRows` … (⚠️ **màn QUẢN TRỊ** — ⭐ đọc quyền **TỪNG user** là **đúng mục đích**) | ✅ ⛔ không sửa |
| ⚠️ **CÙNG KHUÔN** (gác nút cho **user thường**) | ⛔ **4 chỗ trong `app/page.tsx`**: `canViewAudit` · **`canAdministerStaff`** · `canManageRole` · `canManageUserPermissions` | ⛔ **ngoài quyền** (LOCK phiên 01) ⇒ ⭐ **`HANDOFF-C20`** |
| ✅ **CÙNG KHUÔN NHƯNG TRONG QUYỀN** | ⭐ **`lib/workflow-helpers.ts`** → `workflowApproverCandidates` | ✅ **ĐÃ VÁ** + **VERIFIED** |

### 58.3 ⭐ KIỂM **DANH SÁCH MÃ CỨNG** (3 chỗ) — có mã ĐẢO không?
| Danh sách | Tệp | Kết quả |
|---|---|---|
| `WORK_DEPT_MODULE_KEYS = ["dept_plan_tasks","dept_project_tasks","dept_plan_assign","dept_project_assign"]` | `app/screens/WorkCenter.tsx` (**trong quyền**) | ✅ **4/4 mã ĐÚNG** (có trong `module_catalog`) · ⭐ **và CÓ xét quyền phòng ban** (`departmentModulePermissions`) ⇒ ✅ **chuẩn** |
| `HR_EDIT_MODULES = ["dept_hr_legal","hr_legal","hr","dept_legal_labor"]` | `app/page.tsx` (⛔ ngoài quyền) | ⛔ **`dept_hr_legal` KHÔNG tồn tại** trong `module_catalog` (⭐ **mã ĐẢO**; mã thật **`dept_legal_hr`**) ⇒ ⭐ đã ghi trong `HANDOFF-C20` |
| `PROJECT_DETAIL_SUB_TAB_KEYS` | `app/screens/ProjectDetailTabs.tsx` | ✅ chỉ là **khoá tab UI** (⛔ không phải mã quyền) ⇒ ⛔ không liên quan |

### 58.4 ⭐ ĐO **TÁC ĐỘNG** BẢN VÁ (dữ liệu thật qua API)
| Module | ⛔ Trước (chỉ quyền cấp người dùng + admin) | ✅ Sau (thêm quyền phòng ban) | Chênh |
|---|---|---|---|
| **`approvals`** | **26** | ⭐ **61** | **+35** |
| `dept_legal_hr` | 5 | **9** | +4 |
| `dept_finance_payment_plan` | 5 | **9** | +4 |
⭐ **VÍ DỤ THẬT**: `probe_grant1_073196` · `probe_grant1_250625` · `probe_grant1_457899` (role `ksda`, phòng **BCH**) — ⛔ trước: «**Chưa có quyền duyệt**» (**SAI**) ⇒ ✅ sau: «**Có quyền duyệt**».
⚠️ **KẾT LUẬN**: ⭐ **hơn MỘT NỬA** số người duyệt hợp lệ của module `approvals` đã **BỊ ẨN** khỏi bộ chọn người duyệt ⇒ ⚠️ **lỗi có ảnh hưởng THẬT tới cấu hình luồng duyệt**.

### 58.5 ✅ CỔNG MỚI `tests/mt3-c16-dept-permission-gates.test.mjs` (**4/4**)
| Ca | Nội dung |
|---|---|
| `C16-1` | ⭐ **CHỐT VÙNG PHỦ**: tệp helper phải đọc được + có hàm thật (⛔ không ĐẠT RỖNG) |
| `C16-2` | `workflowApproverCandidates` **PHẢI** xét **quyền DUYỆT cấp PHÒNG BAN** — ⚠️ **và vẫn giữ** nhánh quyền cấp người dùng + `admin` |
| `C16-3` | ⭐ **ĐỐI CHỨNG ÂM**: bộ dò **PHẢI bắt** mã **CŨ** (⭐ nguyên văn hành vi trước khi vá) + ⛔ **không báo oan** mã đã vá |
| `C16-4` | ⭐ `WorkflowModal` phải dùng cờ `hasApprovePermission` (**nguồn đã vá**) |
⭐ **META-GATE `C15` VẪN 4/4** ⇒ ⭐ nó **tự động công nhận** cổng mới (**⛔ không cần sửa meta-gate**) — ⭐ đúng thiết kế.

### 58.6 Hồi quy + build
✅ `gd-cycle` **exit 0** · migration **`0348`** · cổng dự án **ĐẠT** (vân tay **`aa8d93a0c8ce613f`**) · **919 test · 918 pass · 0 fail · 1 skip** · `tsc` **0** · `eslint` **0** · 3 dịch vụ **đang nghe**.
---

## TEST-20261007-C59 — ⭐ **XÁC MINH BẢN VÁ BẰNG GIAO DIỆN THẬT (DOM)**: người duyệt **theo PHÒNG BAN** nay hiện **«Có quyền duyệt»** ⭐ + ⚠️ **BÀI HỌC 25** (ô nhập React)

### 59.1 ⭐ ĐƯỜNG ĐI ĐÃ DÒ ĐƯỢC (⭐ ghi lại để phiên sau ⛔ không mò lại)
`QUẢN TRỊ HỆ THỐNG` (bấm **nhóm** — ⚠️ nhãn có kèm mũi tên `⌄/⌃` ⇒ **phải khớp «chứa chuỗi»**, ⛔ khớp chính xác sẽ TRƯỢT)
→ «**Danh mục & phân quyền**» → ⚠️ màn có **TAB** ⇒ phải bấm tab «**9 Workflow phê duyệt**» → ⭐ quy trình render dạng **THẺ ⛔ không phải `<tr>`**
→ nút «Sửa» của **thẻ** chứa `WF-NHAPKHO-01` (⭐ tìm bằng: đi lên tối đa 6 cấp, dừng khi khối chỉ chứa **ĐÚNG 1** mã `WF-…`).

### 59.2 ⭐ KẾT QUẢ ĐO (DOM thật, tài khoản `admin`)
| Bước | Kết quả |
|---|---|
| Mở modal | ✅ tiêu đề «**Sửa quy trình: Quy trình nhập kho (có bước duyệt mới)**» |
| Tick «**Chỉ hiện người có quyền duyệt**» | ✅ `DA_TICK` |
| Gõ «073196» vào ô «Tìm người duyệt (gõ tên / mã nhân viên / phòng ban)» | ✅ kết quả hiện «**Probe cấp 1 quyền 073196** · `NV-PG1-073196`» |
| ⭐ **Badge** | ⭐ **«Có quyền duyệt» ×2** · «Chưa có quyền duyệt» = **0** ✅ |
| 📸 Bằng chứng | `evidence/BUG-C13-3-badge-NHAPKHO-073196.png` (⭐ + 2 ảnh màn/modal) |

### 59.3 ⭐ VÌ SAO ĐÂY LÀ BẰNG CHỨNG **QUYẾT ĐỊNH**
⭐ Tài khoản `probe_grant1_073196` (**role `ksda`, phòng BCH**) **⛔ KHÔNG có** dòng quyền **CẤP NGƯỜI DÙNG** cho module **`warehouse_receipt`** — ⭐ **chỉ có quyền theo PHÒNG BAN** (⭐ đo trước khi vá: **11** người như vậy).
⇒ ⛔ **TRƯỚC KHI VÁ**: cờ `hasApprovePermission` = **false** ⇒ ⚠️ **BỊ LỌC MẤT** khi bật «Chỉ hiện người có quyền duyệt» (⚠️ và nếu ⛔ không lọc thì badge ghi «**Chưa có quyền duyệt**» — ⚠️ **SAI**).
⇒ ✅ **SAU KHI VÁ**: **hiện đúng** với badge «**Có quyền duyệt**» ⇒ ⭐ **khớp CHÍNH XÁC** với phép đo dữ liệu (⭐ `+35` người ở module `approvals`, `+11` ở `warehouse_receipt`).

### 59.4 ⚠️⚠️ **BÀI HỌC (25) — Ô NHẬP CỦA REACT: gán `.value` là ⛔ KHÔNG ĐỦ**
⚠️ Lần đầu tôi gán `input.value = "…"` + phát `input` ⇒ ⚠️ **React ⛔ không cập nhật state** ⇒ kết quả tìm kiếm **rỗng** (⚠️ tôi **suýt kết luận sai** là «bản vá không hoạt động»).
✅ **CÁCH ĐÚNG**: dùng **native setter** rồi phát **cả `input` và `change`**:
```js
const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
setter.call(input, "073196");
input.dispatchEvent(new Event("input", { bubbles: true }));
input.dispatchEvent(new Event("change", { bubbles: true }));
```
⭐⭐ **LUẬT**: khi kiểm **ô nhập của React** bằng DOM ⇒ ⛔ **PHẢI dùng native setter**; ⚠️ nếu kết quả **rỗng** thì ⛔ **đừng kết luận «tính năng hỏng»** — ⭐ **kiểm lại cách gõ trước** (⚠️ đúng loại «ĐẠT RỖNG» ngược: **ĐỎ GIẢ**).

### 59.5 ⭐ CÔNG CỤ ĐỂ LẠI (⭐ chạy lại được)
⭐ `tools/probe-s03-dept-approver.mjs` — ⭐ **probe của phiên 03**, tự mở modal workflow ⇒ tick lọc ⇒ gõ tìm ⇒ **in badge** + **chụp ảnh** ⇒ ⭐ **chạy lại được** để tái xác minh sau này.
⚠️ (⛔ KHÔNG xóa tệp `tools/probe-*.mjs` của phiên khác — ⭐ luật đã có.)
---

## TEST-20261007-C60 — ⭐ **QUÉT LỚP CỔNG QUYỀN TRÊN TOÀN BỘ MÀN** (luật 17) ⇒ **1 lỗi giao phiên 02 · 3 chỗ đúng thiết kế · 1 chú thích sai tôi tự sửa** + cổng `C13` lên **7 ca**

### 60.1 ⭐ PHƯƠNG PHÁP (⭐ 4 tầng đối chiếu — ⛔ không suy đoán)
① Quét **mọi cổng UI** theo `role === "admin"` / `isAdminUser(` trong `app/**` (**~20 chỗ**) ·
② đọc **4 cổng `allModulePermissions`** của `page.tsx` — **xác định module của TỪNG cổng** ·
③ **đối chiếu CSDL**: module nào **CÓ** quyền cấp **PHÒNG BAN** (`department_module_permissions`) ⇒ ⚠️ **chỉ những cổng đó** mới bị «mù quyền phòng ban» ·
④ **đối chiếu backend** (`ActionRbacRegistry` + `UserManagementUseCase`) xem **UI có khớp BE** không.

### 60.2 ⭐ KẾT QUẢ (⭐ phân loại TRUNG THỰC — ⛔ không phải chỗ nào cũng là lỗi)
| Chỗ | Phán quyết | Bằng chứng |
|---|---|---|
| ⭐ **3 cổng `page.tsx`**: `canViewAudit` → **`admin_tab_11`** · `canManageRole` → **`admin_tab_01`** · `canManageUserPermissions` → **`admin_tab_06`** | ✅ **ĐÚNG THIẾT KẾ** | ⭐ **ĐO CSDL**: `department_module_permissions WHERE module_key LIKE 'admin_tab%'` ⇒ **⛔ 0 DÒNG** ⇒ tab quản trị **chỉ cấp theo NGƯỜI DÙNG** |
| ⭐ **`page.tsx:3437` vs BE** | ✅ **KHỚP** | `ActionRbacRegistry:277` → `save_user_access` = **`admin_tab_06`** + **`canView`** (`:526`) · `UserManagementUseCase:275-276` (`if (!isAdmin) requireActionModule(…)`) ⇒ ⭐ **PA-1 (`DEC-20261008-001`) đã đồng bộ 2 phía** ✅ |
| ⭐ `HrProfileEditModal` dòng **179** (ô `role`) | ✅ **KHỚP BE** | `disabled={!isAdminRole}` ⭐ khớp `UserManagementUseCase:174-176` («đổi `role` = đổi quyền ⇒ chỉ ADMIN») · ⚠️ và `canEditAccount = true` ✅ (MỐC 103) |
| ⚠️ **`Inventory.tsx` dòng 261 + 430** | ⛔ **LỖI — cùng lớp `BUG-C13`** | nút «**＋ Thêm nhân sự**» **CHỈ hiện với `role === "admin"`** ⚠️ trong khi **BE đã cho `admin_tab_06` + `canView`** đi qua ⇒ ⭐ **`HANDOFF-20261007-C21`** (→ phiên 02) |
| ✅ `Inventory.tsx:487` | ✅ **⛔ KHÔNG phải cổng** | đó là **payload** `save_user_access` (⭐ có ghi chú FULL-REPLACE) — ⚠️ và **ĐÃ gửi đủ 3 nhóm** ✅ |
| ✅ `WORK_DEPT_MODULE_KEYS` (**tệp tôi**) | ✅ **CHUẨN** | **4/4 mã ĐÚNG** (có trong `module_catalog`) + ⭐ **có xét quyền phòng ban** |
| ✅ `PROJECT_DETAIL_SUB_TAB_KEYS` | ✅ **⛔ không liên quan** | chỉ là **khoá TAB UI** |

### 60.3 ⚠️ **CHÚ THÍCH CŨ SAI TRONG TỆP TÔI — ĐÃ GỠ** (`HrProfileEditModal.tsx`)
⚠️ Khối chú thích cũ ghi «**CHỈ ROLE `admin` mới gọi được `update_user` … khoá đúng theo hợp đồng backend = chỉ `role === "admin"`**» ⇒ ⚠️ **TRÁI mã hiện tại** (`ActionRbacRegistry` cho **`admin_tab_01` + `canEdit`**).
⭐⭐ **VÌ SAO NGUY HIỂM**: ⚠️ ai **làm theo chú thích đó** sẽ **khoá CẢ mục TÀI KHOẢN** ⇒ ⭐ người có **Tab 01** ⛔ **mất quyền sửa hồ sơ** — ⚠️ **ĐÚNG LỚP `BUG-C13`** vừa phát hiện; ⚠️ và nếu mở khoá khi BE **còn** chặn thì **403 SAU KHI ĐÃ LƯU** (BUG-02).
✅ **ĐÃ GỠ** khối cũ + thay bằng ghi chú **nói rõ đã đổi gì và vì sao** + ⭐ **KHOÁ BẰNG 2 CA CỔNG** (⛔ hết đường tái phát).

### 60.4 ✅ CỔNG `C13` NAY **7 CA** (⭐ có ĐỐI CHỨNG ÂM)
| Ca mới | Nội dung |
|---|---|
| `C13-6` | ⭐ ``canEditAccount = true`` **PHẢI giữ** (⛔ không khoá mục TÀI KHOẢN theo `role`) |
| `C13-7` | ⭐ ô ``role`` **PHẢI** ``disabled={!isAdminRole}`` + ⭐ **ĐỐI CHỨNG ÂM**: ô `role` **mở khoá** ⇒ bộ dò **PHẢI bắt** |

### 60.5 Hồi quy + build
✅ `gd-cycle` **exit 0** · migration **`0349`** · cổng dự án **ĐẠT** (vân tay **`022fecb6c0e82f81`**) · hồi quy **921 test · 920 pass · 0 fail · 1 skip** (+2 ⭐ từ 2 ca cổng mới) · `tsc` **0** · `eslint` **0** · meta-gate `C15` **4/4**.
---

## TEST-20261007-C61 — ⚠️ **KIỂM PA-1 BẰNG TÀI KHOẢN ⛔ KHÔNG PHẢI ADMIN — CHƯA KẾT LUẬN ĐƯỢC** (⭐ ghi trung thực, ⛔ không claim)

### 61.1 ⭐ MỤC TIÊU (⭐ đúng việc cần làm)
⭐ Xác minh **PA-1** (`DEC-20261008-001`: `save_user_access` mở cho **`admin_tab_06` + `canView`**) **end-to-end bằng GIAO DIỆN THẬT** với tài khoản **⛔ không phải admin**
⇒ ⚠️ vì triệu chứng user báo là «**mở được, tick được, bấm Lưu ⛔ KHÔNG lưu**» ⇒ ⭐ chỉ **đăng nhập thật + bấm Lưu thật** mới chứng minh được.

### 61.2 ⭐ CHUẨN BỊ (✅ đo được)
| Bước | Kết quả |
|---|---|
| Tìm tài khoản có **`admin_tab_06` cấp NGƯỜI DÙNG** | ⭐ **10** tài khoản: `giamdoc.demo` (director) + 9 `probe_grant1_*` / `probe_permsave_*` (ksda) |
| ⭐ **Quyền HIỆU LỰC của `giamdoc.demo` (đo qua API)** | ⭐ **`admin` view=1 use=1 edit=1** + **toàn bộ `admin_tab_01…14` view=1 use=1 edit=1** (nguồn `company_leadership`) ⇒ ⭐ **đủ điều kiện** cho cả nhánh UI (`canManageUserPermissions`) **và** nhánh BE (`admin_tab_06` + `canView`) ✅ |
| Đăng nhập | ✅ `giamdoc.demo` / `Vntech@2026` ⇒ **HTTP 200** |
| ⭐ **ĐÍCH THAO TÁC (an toàn)** | ⭐ `probe_permsave_016264` (**tài khoản thử**, ⭐ chỉ có **1** dòng quyền `admin_tab_06`) ⇒ ⭐ **lưu IDEMPOTENT** (⛔ không tick/đổi ô nào) là **trung tính dữ liệu** mà vẫn chứng minh **BE ⛔ không trả 403** |

### 61.3 ⚠️ KẾT QUẢ: **CHƯA KẾT LUẬN** (⭐ nói thẳng — ⛔ không suy diễn thành «PA-1 sai»)
| Lần chạy | Đo được | Vì sao chưa kết luận |
|---|---|---|
| `tools/probe-s03-pa1-save.mjs` | ✅ đăng nhập **200** · ✅ vào «QUẢN TRỊ HỆ THỐNG» → «Danh mục & phân quyền» · ✅ **21** nút/tab · ⚠️ **⛔ KHÔNG tìm thấy danh sách NGƯỜI DÙNG** ⇒ ⭐ probe **TỰ DỪNG, ⛔ KHÔNG bấm Lưu** (⭐ an toàn đúng thiết kế) · ⭐ **0 phản hồi 403** | ⚠️ chưa chạm tới nút Lưu ⇒ ⛔ **không có bằng chứng** về PA-1 |
| `tools/probe-s03-admin-area-nonadmin.mjs` | ⚠️ thấy tiêu đề «Danh mục & phân quyền» + chuỗi «**CHƯA ĐƯỢC PHÂN QUYỀN**» **trong DOM** | 🔴 **⚠️ PHÉP ĐO SAI**: (a) `document.body.innerText` **có thể chứa chuỗi ⛔ không hiển thị**; (b) vòng lặp của tôi **bấm nhầm nút «BÁO LỖI / GÓP Ý»** ⇒ **modal che màn** ⇒ 📸 ảnh **⛔ vô dụng** (⭐ **đã xoá ảnh**) |
| Lần 3 (đo **chỉ phần hiển thị**) | 🔴 **probe LỖI CÚ PHÁP** ⇒ ⭐ **ĐÃ XOÁ tệp** (⛔ không để tệp hỏng trong repo) | ⛔ không có số liệu |

### 61.4 ⚠️⚠️ **BÀI HỌC (26 + 27)** (⭐ hai lỗi của chính tôi trong vòng này)
⭐ **26 — «CHUỖI TRONG DOM» ⛔ KHÔNG PHẢI «ĐANG HIỂN THỊ»**: ⚠️ `innerText`/`textContent` có thể chứa **nhánh render ⛔ bị ẩn** (⚠️ React vẫn dựng cây) ⇒ ⭐ **muốn khẳng định «màn bị chặn»** thì **PHẢI** kiểm **HIỂN THỊ** (`getBoundingClientRect().width/height > 0` · `offsetParent` · hoặc **ĐỌC ẢNH**) ⇒ ⚠️ **đúng loại «ĐỎ GIẢ / ĐẠT RỖNG» quen thuộc**.
⭐ **27 — ⛔ KHÔNG BẤM «MỌI NÚT» ĐỂ DÒ**: ⚠️ vòng lặp bấm mọi `button` đã bấm trúng **«BÁO LỖI / GÓP Ý»** ⇒ mở modal che màn ⇒ ⚠️ **ảnh bằng chứng vô dụng** + **phép đo sau đó sai** ⇒ ⭐ **chỉ bấm theo DANH SÁCH TRẮNG** (tab trong `.tabs`/`[role=tab]`, không bấm nút chức năng toàn cục).

### 61.5 ✅ VIỆC CÒN LẠI (⭐ mở, ghi rõ để ⛔ không mất)
⚠️ **`OPEN VERIFY`**: xác minh **PA-1 end-to-end** bằng tài khoản **⛔ không phải admin** ⭐ **tài khoản đã sẵn sàng** (`giamdoc.demo` / `Vntech@2026` — ✅ **có `admin` + `admin_tab_01…14` view/use/edit=1**) · ⭐ **đích an toàn** `probe_permsave_016264` (**1 dòng quyền**) · ⭐ **cách làm đúng**: ① tìm **đúng tab** chứa danh sách người dùng (⚠️ **in danh sách tab TRƯỚC**, ⛔ không bấm bừa) ② mở thẻ «Phân quyền công việc / Chức năng» ③ **bấm Lưu không đổi gì** ④ ⭐ **bắt phản hồi mạng** (⭐ 403 hay 200) ⑤ ⭐ **đối chiếu lại 3 bảng CSDL** trước/sau (⭐ nếu đổi ⇒ **KHÔI PHỤC** + báo).
---

## TEST-20261007-C62 — ⭐ **KIỂM PA-1 END-TO-END (lần 4 — ĐÃ ĐÚNG CÁCH)** ⇒ 🔴 **PHÁT HIỆN `BUG-C14` (HIGH)**: màn quản trị CHẶN OAN tài khoản cấu hình

### 62.1 ⭐ BA LẦN ĐẦU HỎNG — ⭐ LẦN 4 ĐÚNG NHỜ **LUẬT 26 + 27**
| Lần | Lỗi của tôi | ✅ Cách sửa ở lần 4 |
|---|---|---|
| 1 | ⛔ không tìm thấy danh sách người dùng ⇒ probe tự dừng (⭐ an toàn ✅ nhưng ⛔ không có dữ liệu) | — |
| 2 | ⚠️ đọc **chuỗi trong DOM** ⇒ 🔴 **kết luận SAI** (⚠️ chuỗi có thể **⛔ không hiển thị**) + ⚠️ bấm nhầm nút «BÁO LỖI» ⇒ ảnh bị che | ⭐ **LUẬT 26**: chỉ đo phần **HIỂN THỊ** (`getBoundingClientRect`) + ⭐ **ĐỌC ẢNH** |
| 3 | 🔴 probe lỗi cú pháp (⭐ đã xoá tệp) | ⭐ viết probe ra **TỆP** + ⭐ **IN chẩn đoán TRƯỚC** |
| **4** | ✅ | ⭐ **LUẬT 27**: ⛔ **không bấm mọi nút** ⇒ chỉ bấm theo **DANH SÁCH TRẮNG** (tab) |

### 62.2 ⭐ KẾT QUẢ ĐO (lần 4 — ✅ sạch, có 📸 bằng chứng)
| Phép đo | `admin` (đối chứng) | ⭐ `giamdoc.demo` (**role `director`**) |
|---|---|---|
| Đăng nhập | ✅ 200 | ✅ **200** (`Vntech@2026`) |
| Mở «QUẢN TRỊ HỆ THỐNG» → «Danh mục & phân quyền» | ✅ | ✅ (menu **CHO VÀO**) |
| ⭐ **TAB HIỂN THỊ** trên màn | ⭐ **40** (có «9 Workflow phê duyệt») | 🔴 **0** |
| ⭐ **DÒNG BẢNG HIỂN THỊ** | ✅ có | 🔴 **0** |
| ⭐ **NỘI DUNG MÀN (đọc ảnh)** | ✅ bảng/tab | 🔴 **panel «CHƯA ĐƯỢC PHÂN QUYỀN»** (📸 `PA1-4-man-quan-tri-director.png`) |
| ⭐ **QUYỀN THẬT (API)** | (admin ⇒ toàn quyền) | ⭐ **`admin` 1/1/1 + toàn bộ `admin_tab_01…14` 1/1/1** ❗ |

### 62.3 🔴 KẾT LUẬN — **`BUG-20261007-C14` (HIGH)**
⭐ **ROOT CAUSE = 1 DÒNG** (`app/page.tsx:625`): ``const accessDenied = active!=="admin" ? (permissionConfigured && !activePermission.canView) : !isAdminUser(data.user);``
⇒ ⚠️ nhánh **`active === "admin"`** **CHỈ** nhận `role === "admin"` ⇒ ⛔ **bỏ qua quyền CẤU HÌNH** ⇒ ⭐ **menu cho vào nhưng màn chặn** (⚠️ **tự mâu thuẫn với `page.tsx:491` cùng tệp**) và ⚠️ **mâu thuẫn backend** (`ActionRbacRegistry` + PA-1).
🔴 **HỆ QUẢ NGHIÊM TRỌNG NHẤT**: ⭐ **PA-1 KHÔNG THỂ DÙNG TỪ GIAO DIỆN** (⚠️ người cấu hình ⛔ không mở nổi màn để bấm Lưu) ⇒ ⚠️ **triệu chứng user báo còn nguyên ở tầng màn**.
⚠️ **PHẠM VI**: ⭐ **10** tài khoản `admin_tab_06` + 1 tài khoản cho mỗi `admin_tab_01…14` ⇒ ⚠️ **mọi tài khoản cấp tab quản trị theo cấu hình**.
✅ **ĐÃ GIAO `HANDOFF-20261007-C22`** (⛔ `page.tsx` = LOCK phiên 01) kèm **1 dòng vá đề xuất** (⭐ dùng `hasAnyCapability(modulePermission(data,"admin"))` — **helper đã import sẵn trong cùng tệp** ✅) + **test có đối chứng âm** + **cách đo lại**.

### 62.4 ✅ AN TOÀN DỮ LIỆU (⭐ probe tự dừng nên ⛔ KHÔNG ghi gì)
⛔ Không bấm nút Lưu ⇒ ⭐ **đối chiếu CSDL đích `probe_permsave_016264` TRƯỚC/SAU: GIỐNG NHAU** (`admin_tab_06 | view=1 | use=0 | edit=0`) ✅ · ⭐ tổng phản hồi mạng: **⛔ 0 lần 403**.

### 62.5 ⚠️ GHI CHÚ PHƯƠNG PHÁP (⭐ để phiên sau ⛔ không mò lại)
⭐ Muốn kiểm lại: `node tools/probe-s03-pa1-save.mjs` (⭐ tài khoản `giamdoc.demo` / `Vntech@2026`, ⭐ **in số tab HIỂN THỊ + số dòng bảng**) ⇒ ⭐ **và ĐỌC ẢNH** `evidence/PA1-*.png` (⛔ đừng chỉ đọc DOM — ⚠️ **luật 26**).
---

## TEST-20261007-C63 — ⭐ **TIỀN KIỂM CHỨNG BẢN VÁ `HANDOFF-C22`** trên **dữ liệu thật** (5 tài khoản · **2 dương + 2 đối chứng âm**) ⇒ ⚠️ **suýt giao một bản vá SAI** (⭐ tự bắt được)

### 63.1 ⭐ VÌ SAO LÀM (⭐ luật: ⛔ đừng giao bản vá chưa kiểm)
⭐ Trước khi để phiên 01 áp bản vá 1 dòng, phiên 03 **mô phỏng CHÍNH predicate đề xuất** trên **dữ liệu THẬT** của **5 tài khoản** ⇒ ⭐ mục đích: phát hiện **mở quá rộng** (⚠️ rủi ro **bảo mật**) hoặc **vẫn chặn oan** (⚠️ không sửa được lỗi).

### 63.2 ⚠️⚠️ **TÔI ĐÃ SUÝT GIAO BẢN VÁ SAI — ⭐ VÀ TỰ BẮT ĐƯỢC**
⚠️ Lần đo **đầu tiên** chỉ có 3 tài khoản ⇒ thấy **`e2e.ns`** (nhãn **role `hr`**) cũng được **ĐỀ XUẤT MỞ** ⇒ 🔴 tôi **tưởng là lỗ hổng** («mở khu quản trị cho nhân viên HR»).
⭐ **ĐO SÂU HƠN** mới rõ: **`e2e.ns` có ĐÚNG 15 dòng `admin*`** (`admin` + `admin_tab_01…14`, đủ 6 quyền, nguồn **`company_leadership`**) — ⭐ **giống hệt `giamdoc.demo`** ⇒ ⭐ **nó ĐƯỢC CẤP THẬT** ⇒ ⚠️ **lo ngại của tôi dựa vào NHÃN `role`, ⛔ không phải QUYỀN THẬT** (⚠️ **đúng lớp sai lầm mà chính `BUG-C13/C14` nói tới — mặt ngược lại**).
✅ **SỬA CÁCH ĐÁNH GIÁ**: thêm **2 ĐỐI CHỨNG ÂM THẬT** (`e2e.ksda` · `e2e.kt` — **0 dòng `admin*`**) ⇒ ⭐ **GIỮ CHẶN** ✅ ⇒ ⭐ **bản vá ĐÚNG** (mở cho người **CÓ quyền**, chặn người **⛔ không có**).

### 63.3 ⭐ BẢNG KIỂM CHỨNG (5 tài khoản · đăng nhập thật)
| Tài khoản | role | dòng `admin*` | HIỆN TẠI | ⭐ ĐỀ XUẤT | Phán quyết |
|---|---|---|---|---|---|
| `admin` | `admin` | — | DUOC VAO | DUOC VAO | ✅ ⛔ không mất đường |
| `giamdoc.demo` | `director` | **15** | **BI CHAN** | ⭐ **DUOC VAO** | ✅ sửa đúng `BUG-C14` |
| `e2e.thuky` | `thuky` | **15** | BI CHAN | ⭐ **DUOC VAO** | ✅ khớp quyền thật |
| ⭐ `e2e.ksda` | `ksda` | **0** | BI CHAN | ⭐ **BI CHAN** | ✅ **đối chứng âm ĐẠT** |
| ⭐ `e2e.kt` | `accountant` | **0** | BI CHAN | ⭐ **BI CHAN** | ✅ **đối chứng âm ĐẠT** |

### 63.4 ⚠️ **DỊ THƯỜNG DỮ LIỆU ĐÃ BIẾT — `L-14`** (⭐ nêu rõ, ⛔ không giấu)
⭐ `e2e.ns` (**nhãn role `hr`**) mang **15 dòng quyền cấp `admin`/`admin_tab_*`** ⇒ ⚠️ **phạm vi rộng hơn một nhân viên HR thật** — ⭐ tài liệu cũ đã ghi (`tools/viet-bao-cao-gd3-9.mjs`: «e2e.ns đang mang **mã vai trò director** thay vì `hr` … **Xem mục lỗi L-14**»).
⚠️ **HỆ QUẢ**: ⭐ bản vá `C22` **cũng mở khu quản trị cho `e2e.ns`** — ⭐ điều này **ĐÚNG theo DỮ LIỆU** (nó được cấp thật) ⚠️ nhưng **SAI theo Ý ĐỊNH** (nhãn `hr`) ⇒ ⭐ **`L-14` là vấn đề DỮ LIỆU riêng** (⚠️ ⛔ **đừng** lấy nó làm cớ **giữ `BUG-C14`**).

### 63.5 ⭐ BÀI HỌC (28) — **TIỀN KIỂM CHỨNG BẢN VÁ TRƯỚC KHI GIAO**
⭐ **Trước khi giao một bản vá cho phiên khác**: ⭐ **mô phỏng predicate/vá đó trên DỮ LIỆU THẬT** với ⭐ **≥ 2 ca DƯƠNG** (phải được MỞ) **và ≥ 2 ca ÂM** (phải GIỮ CHẶN) ⇒ ⚠️ 3 ca đầu **chưa đủ** (⚠️ tôi suýt kết luận sai vì **thiếu đối chứng âm**).
⭐⭐ **VÀ**: ⚠️ **đánh giá theo QUYỀN THẬT, ⛔ KHÔNG theo NHÃN `role`** — ⚠️ nhãn có thể **dị thường** (⭐ `L-14`) hoặc **không phản ánh cấu hình** (⭐ chủ trương của user).
---

## TEST-20261007-C64 — ⭐ **HỒI QUY TRONG PHẠM VI HR–TEAMS** (sau các build mới của phiên khác) + ⭐ **quét họ lỗi quyền TRONG phạm vi**

### 64.1 ⭐ QUÉT HỌ LỖI QUYỀN **TRONG PHẠM VI** (5 tệp HR–TEAMS) — ⭐ KẾT QUẢ: **SẠCH**
| Tệp | Cách kiểm quyền | Phán quyết |
|---|---|---|
| `HrProfileEditModal.tsx` | `role==="admin"×1` | ✅ **chỉ khoá ô `role`** (⭐ khớp BE `UserManagementUseCase:174-176` — ⛔ không phải lỗi) |
| `HrScreen.tsx` | `permission.canCreate` (⭐ nhận prop) | ✅ dùng **quyền hiệu lực do `page.tsx` truyền** |
| `TeamDirectory.tsx` | `isAdminUser(×2 · modulePermission(×1` | ✅ ⭐ **ĐÚNG KHUÔN**: ``teamGates(Boolean(permission?.isAdmin) ‖ isAdminUser(data.user), permission)`` — ⭐ chú thích trong tệp ghi rõ `modulePermission` **đã trả TOÀN QUYỀN cho admin** (`lib/permissions.ts:16`) |
| `ProjectTeams.tsx` | `isAdminUser(×1` + `canManage` (prop) | ✅ **cổng thật nằm ở `page.tsx`** (⚠️ thuộc phiên 01) ⇒ ⛔ tệp này chỉ render theo prop |
| `TeamManagement.tsx` | ⛔ không kiểm quyền | ⚠️ nhưng đây là **1 trong 4 màn MÔ CÔI** (⛔ không được render — `HANDOFF-C15`) ⇒ ⚠️ không tiếp cận được |
⭐ **VÀ**: ⛔ **KHÔNG tệp HR–TEAMS nào dùng `hasAdminTab`** ⇒ ⭐ **không phụ thuộc helper hỏng của ADMIN** (⚠️ tránh được bẫy `HANDOFF-C23`) ✅.

### 64.2 ⭐ HỒI QUY GIAO DIỆN (đăng nhập `admin`, ⛔ không bấm Lưu)
| Hạng mục | Kết quả đo |
|---|---|
| Màn «**Hồ sơ nhân sự**» | ✅ **26 dòng** · tiêu đề đúng |
| Nút «Sửa hồ sơ» (mở modal) | ✅ hiện + mở được |
| **TAB «Thông tin user»** (8 ô) | ✅ `Mã nhân viên=E2E-DIAG` · `Tên đăng nhập=e2e.diag` · `Vai trò=ksda` · `Phòng=ORG-DA` · `Họ tên=Chẩn đoán` · `Chức danh=Chỉ huy trưởng` · `Email=diag@vntech.vn` · `Điện thoại=""` (⭐ **khớp CSDL**) |
| **TAB «Thông tin cá nhân»** (8 ô) | ✅ tất cả **rỗng** (`Số CCCD/CMND` · `Ngày cấp` · `Ngày sinh` · `Nơi sinh` · `Địa chỉ thường trú` · `Trình độ` · `Ngày vào` · `Ghi chú`) — ⭐ **khớp CSDL** |
| ⭐ **CHỐNG TÁI DÙNG Ô (`BUG-C12` phần 2)** | ⭐ `Số CCCD/CMND (tab cá nhân)` = **`""`** ⛔ **KHÔNG** trùng `Mã nhân viên (tab user)` = `E2E-DIAG` ⇒ ✅ **BẢN VÁ CRITICAL CÒN GIỮ** (⚠️ trước khi vá nó hiện `E2E-DIAG` — lỗi tái dùng ô) |
| Tab «**Tổ đội**» (màn «Quản lý dự án» → tab) | ✅ render **1 bảng · 5 dòng** |
| 📸 Ảnh | `evidence/HRQ-1-danh-sach-ho-so.png` · `HRQ-2-modal-sua-ho-so.png` · `HRQ-6-tab-to-doi.png` |

### 64.3 ⚠️ **QUAN SÁT TRONG PHẠM VI (⭐ chỉ ghi, ⛔ không sửa — tệp không thuộc phiên 03)**
⚠️ `lib/menu-helpers.ts` có mục ``{ key: "teams", label: "Tổ đội theo dự án", groupKey: "project_management" }`` ⚠️ **nhưng UI KHÔNG có leaf nào tên «Tổ đội theo dự án»** — ⭐ đường vào THẬT là «**Quản lý dự án**» → **tab «Tổ đội»** (⭐ đo được: các tab = `Danh sách dự án · Tổng quan · Nhân sự · Tổ đội · Kho · Ban chỉ huy`)
⇒ ⚠️ **mục menu khai báo nhưng ⛔ không có leaf tương ứng** (⚠️ có thể gây nhầm cho người dùng/phiên sau) ⇒ ⭐ **GHI NHẬN** (⚠️ `lib/menu-helpers.ts` **thuộc phiên 02** ⇒ ⛔ phiên 03 **không sửa**; ⭐ nếu user muốn thì giao phiên 02).

### 64.4 ⭐ KẾT LUẬN VÒNG NÀY
✅ **Phạm vi HR–TEAMS: SẠCH** — ⛔ không có lỗi họ quyền, ⛔ không dùng helper hỏng, ✅ hồi quy **ĐẠT** (kể cả ⭐ **bản vá CRITICAL `C12` vẫn giữ**).
---

## TEST-20261007-C65 — ⭐ **XÁC MINH `BUG-C15`** (2 bản vá) trên **GIAO DIỆN THẬT** + cổng mới `mt3-c17`

### 65.1 ⭐ PHƯƠNG PHÁP
⭐ đăng nhập **admin** ⇒ mở «HÀNH CHÍNH – PHÁP CHẾ» → «**Hồ sơ nhân sự**» ⇒ ⭐ ① **ĐỌC 2 CỘT NGÀY** trong bảng (⭐ so với định dạng **`dd/mm/yyyy`** của toàn app) ⇒ ⭐ ② mở «**＋ Lập hồ sơ**» ⇒ **ĐẾM option** của dropdown `select[name=userId]` ⇒ ⭐ so với **KPI «Còn thiếu hồ sơ»** (⭐ ⛔ KHÔNG bấm Lưu).

### 65.2 ⭐ KẾT QUẢ (đo được)
| Phép đo | Kết quả |
|---|---|
| ⭐ **Ngày sinh / Ngày vào (5 dòng đầu)** | `Chẩn đoán` = **—** / **—** · `Chỉ huy trưởng A` = **02/03/1990** / — · `E2E Chỉ huy trưởng` = **03/01/1983** / **09/06/2023** · `E2E Chỉ Huy Trưởng` = **16/08/1992** / **24/01/2024** · `E2E Giám đốc` = **10/07/1997** / **08/10/2023** |
| ⭐ **Kiểm định dạng** | ⭐ **ISO (`yyyy-mm-dd`) = 0** ✅ · ⭐ **`dd/mm/yyyy` hoặc `—` = 5/5** ✅ |
| ⭐ **Dropdown «Nhân sự»** | ⭐ **18 option** = **17 nhân sự CHƯA có hồ sơ** + 1 dòng «— Chọn nhân sự —» ⇒ ⭐ **26 người ĐÃ có hồ sơ BỊ LOẠI** ✅ (⚠️ trước khi vá: **~43** option) |
| ⭐ **Nút Lưu** | ✅ «Lưu hồ sơ» **[MỞ]** (vì còn 17 người để lập) |
| 📸 | `evidence/C15-1-bang-HR-ngay-ddmmyyyy.png` · `C15-2-modal-lap-ho-so-loc.png` |

### 65.3 ✅ CỔNG MỚI `tests/mt3-c17-hr-screen-safety.test.mjs` (**4/4**)
| Ca | Nội dung |
|---|---|
| `C17-1` | ⭐ **CHỐT VÙNG PHỦ**: đọc đúng tệp + thấy `function HrScreen` + `staffDirectory` |
| `C17-2` | ⛔ **cấm** dropdown chọn nhân sự đổ **TOÀN BỘ** `staffDirectory` (⚠️ đường vào **mất dữ liệu**) |
| `C17-3` | ⭐ **buộc** có **chốt chặn thứ hai** (`window.confirm` cảnh báo ghi đè) khi lưu |
| `C17-4` | ⛔ cấm **ngày thô** + ⭐ **ĐỐI CHỨNG ÂM** (bộ dò **PHẢI** bắt mẫu `{r.birthDate‖"—"}` **và** ⛔ không báo oan mẫu đã vá) |
⭐ **META-GATE `c15` 4/4** ⇒ ⭐ **tự công nhận** cổng mới (⛔ không cần sửa) · ⭐ **13 cổng cũ VẪN ĐẠT** (⭐ ⛔ không vỡ gì).

### 65.4 ⚠️ KÈM PHÁT HIỆN: **CỔNG `mt3-c10` (định dạng ngày) CÓ ĐIỂM MÙ**
⭐ Cổng `C10` (⭐ quét `app/screens/**` tìm ngày in thô) **⛔ KHÔNG bắt được** `{r.birthDate‖"—"}` trong `HrScreen` (⚠️ mẫu radar của nó là `String(row.x).slice(0,10)` v.v.) ⇒ ⚠️ **bài học**: ⭐ **một cổng chỉ bắt ĐÚNG mẫu đã gặp** ⇒ ⭐ **mẫu ngày thô MỚI phải được thêm vào radar** (⭐ đã bổ sung ở `C17-4` cho `HrScreen` ✅; ⚠️ ⭐ **nên quét lại toàn bộ `app/**` cho mẫu `{x.date‖"—"}`** — ⭐ việc của vòng sau).