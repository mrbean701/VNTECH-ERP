# WEEKLY_REPORT_DATA — SESSION_C (ERP-SESSION-03) · TUẦN 2026-W41

> Dữ liệu chuẩn hoá cho báo cáo tuần — tổng hợp **TỪ LOG**, ⛔ KHÔNG suy đoán.
> Phiên: `ERP-SESSION-03` · Branch `unity` · HEAD khi mở phiên `8bfde0d`.
> ⭐ **CẬP NHẬT LỚN 08/10/2026 (vòng 38)** — phần A được **DỰNG LẠI đầy đủ** từ **8 log** của phiên:
> trước đó A chỉ có `TASK-C01…C09`; nay phủ **toàn bộ** `TASK-C01…C36`, `BUG-C01…C11`, `TEST-C01…C40`,
> `CHG-C01…C23`, `DEC-C01…C11`, `HANDOFF-C01…C14`, `EVT-C01…C56`.
> ⛔ **KHÔNG xoá dữ liệu cũ** — toàn bộ nhật ký chi tiết theo vòng được **GIỮ NGUYÊN** ở **PHẦN B (phụ lục)**.

---

# PHẦN A — DỮ LIỆU CHUẨN HOÁ CHO BÁO CÁO TUẦN (§14)

## Session
`ERP-SESSION-03` — phiên thứ 3 của cụm đa phiên · log: `docs/dsh-mutil-session/SESSION_C/` · vai trò: **hotfix FE giai đoạn GO-LIVE** (thứ tự user chốt: **FE → BE → DB**) · phạm vi sở hữu: `app/screens/**` (trừ tệp phiên 02) · `app/components/ui/*` · `lib/status-labels.ts` · `lib/labels.ts` · `lib/report-catalog.ts` · `lib/request-export.ts` · `lib/ui-shared.tsx` · `public/templates/*` · `tests/**` · `docs/dsh-mutil-session/SESSION_C/**`.

## Period
Tuần **ISO 2026-W41** — `2026-10-05` → `2026-10-11`. Dữ liệu phiên 03 phát sinh trong **2026-10-07 → 2026-10-08**.

## Completed Tasks
⭐ **36 task** (`TASK-20261007-C01` → `C36`) — xem danh sách đầy đủ ở `TASK_LOG.md`; **nhóm theo mục tiêu**:
| Nhóm | Task | Kết quả |
|---|---|---|
| **Hotfix user báo** | `C01` (CCCD «Sửa hồ sơ») · `C12`–`C14` (modal «Chi tiết đơn giao hàng» **cắt mất khối**) | ✅ `VERIFIED` (C01 có **đối chứng âm API** `§C29`) |
| **Tiếng Việt hoá / hết mã thô** | `C04` · `C05` · `C06` · `C09` · `C27` · `C35` | ✅ `VERIFIED` (cổng `C04` **13 ca** · `C11` **4 ca** · `C12` **3 ca**) |
| **UTF-8 / tệp xuất** | `C03` · `C10` | ✅ `VERIFIED` (BOM + đối chứng âm) |
| **Định dạng NGÀY** | `C19` · `C20` · `C30` · `C31` | ✅ 12 chỗ hiển thị đã vá; ⚠️ **1 màn còn** → `HANDOFF-C14` |
| **Cắt nội dung (grid co hàng)** | `C15`–`C16` · `C21`–`C24` · `C26` | ✅ lớp đóng; ⭐ **thu hồi** 1 handoff báo động giả (`C23`) |
| **Quét & xác minh** | `C16` · `C25` · `C28`–`C34` · `C36`–`C38` · `C40` | ✅ **29 màn** + **5 modal** + **7 lớp lỗi** đo được |
| **Cổng & hạ tầng test** | `C08` · `C11` · `C17` · `C18` · `C33` · `C34` · `C39` | ✅ 8 cổng hợp đồng mới (`C04`·`C05`·`C06`·`C07`·`C08`·`C09`·`C10`·`C11`·`C12`) |
| **Tài liệu / sổ sách** | `C07` · `C36` | ✅ `WEEKLY_REPORT_DATA` chuẩn §14 + **cập nhật đầy đủ** (vòng 38) |

## In Progress
| Việc | Trạng thái | Ghi chú |
|---|---|---|
| «**Tiến độ dự án**» — ngày ISO hiện thô | ⚠️ **`HANDOFF-20261007-C14`** | ⛔ ngoài quyền: `app/page.tsx` (**LOCK phiên 01**) — đã có **bằng chứng DOM** + manh mối mã |
| `Inventory.tsx` — nhãn **BCH** + **6 chỗ ngày ISO** hiển thị | ⚠️ **`HANDOFF-20261007-C13`** | ⛔ ngoài quyền: tệp **phiên 02** |
| ~**21 khoá MODAL** chưa quét | ⏳ | ⭐ đã có **bản kiểm kê từ mã** (`TEST_LOG.md §C38.1`) |
| ⚠️ **Quy ước PHẦN TRĂM** | ⭐ **`DEC-20261007-C11`** — **chờ USER quyết** | ⛔ phiên 03 **không tự sửa** (~22 chỗ) |

## UI/UX
| Hạng mục | Kết quả đo được |
|---|---|
| **Thẻ trạng thái** (`StatusBadge`) | ✅ 6 tệp hết **phơi mã thô** (`BUG-C08`) — **DOM xác nhận** 3 màn |
| **Mã trạng thái trong TỆP XUẤT** | ✅ `BUG-C05`/`C06` — cổng `C04` **13 ca** |
| **Định dạng ngày** | ✅ 12 chỗ `dd/mm/yyyy` (cùng `date()` dùng chung) |
| **Modal** | ✅ 5 modal quét sạch (⛔ 0 cắt chữ · 0 mã thô · 0 `null/undefined`) |
| **Bảng/toolbar/menu** | ✅ **29 màn** quét: **28 sạch** · 1 màn còn lỗi (đã handoff) |
| **Chữ tiếng Anh hiển thị** | ✅ `BUG-C11` («User» ×2) đã vá + **cổng `C12`** |
| ⚠️ **Phần trăm** | ⚠️ **chưa thống nhất** (0/1/2 chữ số + dấu `.`) → `DEC-C11` |

## Frontend
- **Tệp sản phẩm đã sửa (phiên 03)**: `app/screens/{ReceiptDrawer,Delivered,DocumentsScreen,HrProfileEditModal,Payments,ProjectDetailTabs,ProjectTeams,Purchasing,RequestDrawer,Requests,SealScreen,TeamDirectory,WorkCenter,AllocateReturn,WorkKanban,TeamManagement,ProjectEntityModal,ContractReviewScreen,PurchaseOrderDrawer,ErrorReportAdminPanel}.tsx` · `app/components/ui/StatusBadge.tsx` · `lib/{labels,report-catalog,status-labels,ui-shared}.ts` · `public/templates/*.csv`.
- **Bản vá có cổng chặn hồi quy**: 9 cổng `tests/mt3-c0*.test.mjs` + `mt3-c10..c12`.

## Backend/API
- ⛔ **Không sửa backend** (ngoài phạm vi phiên 03 — `java-backend/**` là **LOCK phiên 01**).
- ⭐ **Tri thức API đo được** (`TEST_LOG.md §C29`): **đọc** = `GET /api/system` (kèm cookie; ~2,6 triệu ký tự JSON) · **ghi** = `POST /api/system {action:"…"}` (Java có **259** action) · app chỉ gọi **2** đường `/api/*`.
- ⭐ **Chứng minh end-to-end `BUG-C01`**: payload cũ ⇒ **400** («… là bắt buộc»); payload đã vá ⇒ **200**.

## Database
- ⛔ **Không sửa schema/dữ liệu nghiệp vụ**. Phiên 03 chỉ **đọc** dữ liệu thật (`GET /api/system`) để **đo mã enum** và **đo giá trị hiển thị**.
- ✅ Phép đo API `BUG-C01` **có ghi** nhưng trên **1 tài khoản fixture** (`e2e.diag`) và **gửi lại đúng giá trị hiện có** ⇒ **dữ liệu không đổi thực chất** (đã kiểm).

## RBAC/Workflow
- ✅ `BUG-C01` là lỗi **hợp đồng payload** giữa FE–BE (không phải lỗi phân quyền) — đã chứng minh bằng **đối chứng âm 400 + bản vá 200**.
- ⚠️ Cổng `probe-action-registry-coverage` **ĐỎ do BÁO ĐỘNG GIẢ** (đã bác bỏ **bằng mã**) → **`HANDOFF-20261007-C11`**.

## Bugs
| ID | Nội dung | Mức độ | Trạng thái |
|---|---|---|---|
| `BUG-C01` | CCCD «Sửa hồ sơ» ⇒ 400 | HIGH | ✅ `VERIFIED` (**đối chứng âm API**) |
| `BUG-C02` | 2 tệp mẫu CSV **thiếu BOM** | MEDIUM | ✅ `VERIFIED` (**BOM đo theo byte**) |
| `BUG-C03` · `C04` · `C05` · `C06` | Trạng thái/ưu tiên/hồ sơ **hiện mã tiếng Anh** (màn + tệp xuất) | MEDIUM | ✅ `VERIFIED` (cổng `C04` 13 ca) |
| `BUG-C07` | ⭐ **Lỗi user báo**: modal «Chi tiết đơn giao hàng» **cắt mất khối** | HIGH | ✅ `VERIFIED` (đo lại DOM: `49 → 279px`) |
| `BUG-C08` | **Thẻ trạng thái phơi mã thô** (6 tệp) | UI | ✅ `VERIFIED` (cổng `C11` + **DOM**) |
| `BUG-C09` | Phép kiểm **ĐỎ OAN do tranh chấp** nhiều phiên | MEDIUM | ✅ `VERIFIED` (**chứng minh bằng mô phỏng**) |
| `BUG-C10` | Ngày ISO hiện thô | UI | ⚠️ **`OPEN` một phần** — 12 chỗ vá, **1 màn** → `HANDOFF-C14` |
| `BUG-C11` | **Chữ Anh hiển thị** («User» ×2) | UI | ✅ `VERIFIED` (cổng `C12`) |

## Hotfixes
⭐ **15 change** (đếm thật từ `CHANGE_LOG.md`): `CHG-C01…C09` + `CHG-C18…C23` — ⚠️ **lỗ hổng mã `C10–C17`** (⛔ chưa từng dùng, ⛔ không phải mất dữ liệu).
⭐ **5 LẦN BUILD** (`gd-cycle` **exit 0** cả 5): migration **`0339`→`0343`** (kiểm **TỆP THẬT** trong `drizzle/`) · `BUILT ARTIFACT VALIDATION: ĐẠT` mỗi lần · vân tay HTML tiến hoá `344d1da5553cca1e` → **`1b7a5cd90523a298`**.
⚠️ Quy trình an toàn đã tuân thủ: dừng dịch vụ **đúng PID** (⛔ không `Stop-Process node`), **chờ** phiên khác xong việc dùng `:8787` trước khi build, khởi động lại ngay.

## Testing
⭐ **39 mục test** (`TEST-C01…C40`) · **9 cổng hợp đồng** đang chạy trong hồi quy:
`mt3-c03` (8 ca) · `mt3-c04` (**13**) · `mt3-c05` (8) · `mt3-c06` (4) · `mt3-c07` (2) · `mt3-c08` (4) · `mt3-c09` (4) · `mt3-c10` (**7**) · `mt3-c11` (4) · `mt3-c12` (3).
| Lần hồi quy | Kết quả |
|---|---|
| Cuối (sau build `0343`) | ✅ **865 test · 864 pass · 0 fail · 1 skip** (`REG_EXIT=0`) |
| `tsc --noEmit` | ✅ **exit 0** |
| `eslint` | ✅ **0 lỗi** (⚠️ chỉ cảnh báo **có sẵn**) |
⚠️ **2 lần ĐỎ trong hồi quy đều KHÔNG do bản vá**: `§C28` (mã thoát cổng ⛔ không ổn định → `HANDOFF-C12`) · `§C31` (ĐỎ OAN do **tranh chấp** nhiều phiên → đã vá `CHG-C21`).

## Important Changes
| Change | Nội dung | Ảnh hưởng |
|---|---|---|
| `CHG-C20` | Thẻ trạng thái: **chốt chặn cuối** = bảng nhãn dùng chung | ⛔ hết phơi mã thô |
| `CHG-C21` | Phép kiểm `trust-lock-foundation` **bền với tranh chấp** | ⛔ hết ĐỎ OAN |
| `CHG-C22` | 11 chỗ **hiển thị ngày ISO** → `date()` dùng chung | ✅ nhất quán `dd/mm/yyyy` |
| `CHG-C23` | 2 nhãn tiếng Anh («User») → «Tên đăng nhập» | ✅ hết chữ Anh hiển thị |
| `CHG-C18/C19` | Định dạng ngày (4 chỗ đầu) | ✅ `dd/mm/yyyy` |

## Decisions
⭐ **11 quyết định** (`DEC-C01…C11`) — nổi bật: ① **dùng bảng nhãn dùng chung** làm **nguồn duy nhất** (`lib/status-labels.ts`, 10 miền) · ② **cổng phải NHẮM ĐÍCH + có ĐỐI CHỨNG ÂM** (⛔ regex quét rộng sinh ĐỎ OAN) · ③ ⛔ **không tự sửa** việc **ngoài quyền** (đi qua HANDOFF) · ④ ⛔ **không đụng CSS dùng chung** (lỗi `.kpi` **thu hồi** — báo động giả) · ⑤ ⭐ **`DEC-C11`: quy ước PHẦN TRĂM** — ⚠️ **CHỜ USER QUYẾT**.

## Blockers/Risks
| Rủi ro | Mức | Trạng thái |
|---|---|---|
| ⚠️ **Lỗi ngoài quyền** (`Inventory.tsx` · `page.tsx`) | ⚠️ TRUNG BÌNH | Đã **bàn giao** (`C13`, `C14`) — ⛔ phiên 03 **không tự sửa** |
| ⚠️ **Cổng dự án có mã thoát KHÔNG ổn định** (lúc `0`, lúc **crash**) | ⚠️ THẤP–TRUNG BÌNH | `HANDOFF-C12` + ⭐ **luật dùng**: đọc **DÒNG KẾT LUẬN + 3 dấu ✓**, ⛔ đừng chỉ tin mã thoát |
| ⚠️ **Nhiều phiên chạy song song ⇒ ĐỎ OAN** | ⚠️ TRUNG BÌNH | Đã gặp **3 lần** (2 ca test + 1 cổng) — 1 đã vá, 1 đã handoff |
| ⚠️ **KPI bị cắt** (3 màn) | ⛔ **KHÔNG phải lỗi** | ⭐ **ĐÃ THU HỒI** `HANDOFF-C10` — thủ phạm là **hoạ tiết trang trí** (`<i>` rỗng), ⛔ không cắt chữ |
| ⚠️ **~21 khoá modal chưa quét** | ⚠️ THẤP | ⭐ đã có **bản kiểm kê từ mã** để làm tiếp |

## Remaining Work
1. ⚠️ **`HANDOFF-C14`** (`app/page.tsx` — phiên 01): ngày ISO ở «Tiến độ dự án» *(đã có bằng chứng DOM: `td < tr < table.baseline-table`, `2026-01-01`)*.
2. ⚠️ **`HANDOFF-C13`** (`Inventory.tsx` — phiên 02): nhãn **BCH** + **6 chỗ ngày ISO** hiển thị.
3. ⚠️ **`HANDOFF-C12`**: sửa **mã thoát** cổng `verify-ui-build-applied.mjs` (1 dòng `process.exit`).
4. ⭐ **`DEC-C11`**: **chọn quy ước phần trăm** (A giữ nguyên · B `1 chữ số + dấu ,` · C số nguyên).
5. ⏳ Quét ~**21 khoá modal** còn lại (⭐ mở **đúng khoá** theo bảng `§C38.1`).
6. ⏳ `HANDOFF-C02` · `C04`–`C09` · `C11` (các cổng/probe **báo động giả** — ⛔ không phải lỗi sản phẩm).

## Next Week
- ⭐ **Chờ user nghiệm thu bằng mắt** các bản vá UI (⭐ phiên 03 ⛔ **không đọc được ảnh**) — nhất là: modal «Chi tiết đơn giao hàng» (`BUG-C07`), thẻ trạng thái (`BUG-C08`), nhãn «Tên đăng nhập» (`BUG-C11`).
- ⭐ **Nhận quyết định `DEC-C11`** rồi triển khai **1 helper dùng chung** (⚠️ cần phối hợp phiên giữ `page.tsx`).
- ⭐ **Đóng các handoff** theo quyền sở hữu; ⛔ không sửa chéo.
- ⭐ Nếu tiếp tục quét: dùng **`h1`-theo-màn-đích** + **bản kiểm kê modal** (⛔ không mò nhãn menu).
# PHẦN B — NHẬT KÝ CHI TIẾT THEO VÒNG (⛔ KHÔNG XOÁ — giữ nguyên để tra cứu)
> ⚠️ Các mục dưới đây là **bản ghi gốc theo từng vòng**, giữ nguyên văn. ⛔ Số liệu ở đây là **số TẠI THỜI ĐIỂM ĐÓ**
> (vòng 1–2), ⛔ **không** phải số hiện hành — số hiện hành nằm ở **PHẦN A** phía trên.

## (phụ lục) 1. Tổng quan phiên — ⚠️ SỐ TẠI MỐC VÒNG 1–2 (⛔ không dùng làm số hiện hành)

| Mục | Giá trị |
|---|---|
| Session ID | `ERP-SESSION-03` |
| Vai trò | Phiên thứ 3 của cụm đa phiên — nhận **hotfix FE giai đoạn GO-LIVE** |
| Task | **3** (`TASK-20261007-C01` · `C02` · `C03`) |
| Bug | **3** (`BUG-20261007-C01` CCCD · `C02` CSV thiếu BOM · `C03` trạng thái tiếng Anh) |
| Change | **6** (`CHG-20261007-C01..06`) |
| Dev entry | **4** (`DEV-20261007-C01..04`) |
| Test entry | **5** (`TEST-20261007-C01..05`) |
| Decision | **6** (`DEC-20261007-C01..06`) |
| Handoff | **3** (`HANDOFF-20261007-C01..03`) |
| Event | **18** (`EVT-20261007-C01..18`) |
| Tệp mã nguồn sửa | **11** (6 TSX/TS màn + 3 lib + 2 CSV asset) |
| Tệp test sửa/thêm | **8** (3 mới + 5 sửa) |
| **TỔNG ĐO ĐƯỢC** | `test:regression` **823 test · 822 pass · 0 fail · 1 skip** · `tsc` 0 · `eslint` 0 error · **build 3 lần ĐẠT** · LIVE 2 cổng **200**· vân tay **`VNTECH-FP-CC0200A8CAF69D28`** (724 files) |

## 2. Tasks
| ID | Tên | Category | Status |
|---|---|---|---|
| `TASK-20261007-C01` | Hotfix: sửa CCCD ở modal «Sửa hồ sơ» không còn báo lỗi trường tài khoản | HOTFIX · FRONTEND | `FIXED` (chờ user nghiệm thu) |
| `TASK-20261007-C02` | Audit tab Tổ đội + lược bỏ thông tin thừa/rác | UI_UX · FRONTEND | `FIXED` (chờ user nghiệm thu) |

## 3. Bugs & Hotfix
| ID | Mô tả | Severity | Root cause | Status |
|---|---|---|---|---|
| `BUG-20261007-C01` | Tab «Thông tin cá nhân» sửa CCCD ⇒ 400 «Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc» | HIGH | Form chỉ render tab đang mở ⇒ `update_user` nhận payload `{userId}`, `fullName` rỗng; BE `UserManagementUseCase.java:115-125` **không** fallback `fullName` (khác `employeeCode`/`username`) | `FIXED` (FE) |

## 4. Development
| ID | Nội dung | Loại |
|---|---|---|
| `DEV-20261007-C01` | Cổng `fd.has("fullName")` + payload đủ 5 trường có fallback + không đóng modal khi đồng bộ tài khoản lỗi | FRONTEND |
| `DEV-20261007-C02` | Gỡ **15 chỗ** in tên bảng/cột CSDL, khoá payload, tên action, đường dẫn tệp khỏi render màn Tổ đội (giữ nguyên khối dữ liệu `TM-PURE`) | UI_UX |

## 5. Changes
| ID | Before → After |
|---|---|
| `CHG-20261007-C01` | Sửa CCCD: **lỗi 400** → **lưu bình thường** |
| `CHG-20261007-C02` | Màn Tổ đội: **15 chỗ rác kỹ thuật** → câu tiếng Việt nghiệp vụ |
| `CHG-20261007-C03` | Test: **+1 tệp 8 ca** chống tái phát; **3 assertion** cập nhật theo yêu cầu mới; **1 lỗi công cụ đo** (`between`) sửa |

## 6. Tests (số ĐO ĐƯỢC)
| Cổng | Kết quả | Exit |
|---|---|---|
| `npx tsc --noEmit` | 0 lỗi | `0` |
| `npx eslint` (2 tệp sửa) | 0 lỗi · 0 cảnh báo | `0` |
| `node --test` (8 tệp hợp đồng) | **55 test · 55 pass · 0 fail** | `0` |
| `npm run test:regression` | **811 test · 810 pass · 0 fail · 1 skip** | `0` |
| `node tools/gd-cycle.mjs` | PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT** | `0` |
| LIVE `:8787` · `:9000` | **HTTP 200** · **HTTP 200** | — |
| Kiểm bundle đang phục vụ | 5/5 chuỗi đúng kỳ vọng (2 chuỗi mới CÓ · 3 chuỗi rác KHÔNG còn) | — |

## 7. Decisions
| ID | Quyết định |
|---|---|
| `DEC-20261007-C01` | Hotfix GO-LIVE theo thứ tự **FE → BE → DB**; phiên 03 chỉ làm FE lượt này |
| `DEC-20261007-C02` | Mở `SESSION_C` cho phiên 03; giao tiếp qua `SESSION_C/HANDOFF_LOG.md`; ⛔ không ghi vào log phiên khác |
| `DEC-20261007-C03` | Áp **tiền lệ MỐC 116**: phân tách **DỮ LIỆU** (giữ, cho test) vs **RENDER** (gỡ) khi dọn rác |

## 8. Handoffs
| ID | Từ → Đến | Nội dung | Status |
|---|---|---|---|
| `HANDOFF-20261007-C01` | S03 → S01 + S02 | Thông báo mở phiên 03 + chốt ranh giới tệp (giao = ∅) | `OPEN` |
| `HANDOFF-20261007-C02` | S03 → S01 | **Nợ BE**: `updateUser` bất đối xứng validate `fullName` (`UserManagementUseCase.java:115-116`) | `OPEN` (chờ user chốt phương án) |

## 9. Rủi ro & chặn
| # | Nội dung | Mức |
|---|---|---|
| 1 | ⚠️ Cảnh báo cũ của S01 còn hiệu lực: «vân tay nguồn không hợp lệ khi nhiều phiên cùng sửa» — phiên 03 **đã chạy `gd-cycle`** khi cây làm việc SẠCH (chỉ có thay đổi của phiên 03: 4 tệp) ⇒ vân tay mới `VNTECH-FP-846B70AAA8D06A12` **phản ánh đúng** HEAD `8bfde0d` + bản vá phiên 03 | Trung bình |
| 2 | Gốc **BE** của `BUG-20261007-C01` **chưa sửa** (cố ý, theo luật FE-first) ⇒ client khác gửi thiếu `fullName` vẫn 400 | Trung bình |
| 3 | 3 ca nghiệm thu **chờ USER** (⛔ chưa có bằng chứng cuối) | — |

## 10. Việc kế tiếp của phiên 03
- ⏳ Chờ user nghiệm thu 2 task ⇒ chuyển `VERIFIED`.
- Chờ user chốt phương án cho `HANDOFF-20261007-C02` (① cho `fullName` fallback như 2 trường kia, hay ② tách thông điệp nêu đích danh trường thiếu).
- Tiếp tục chuỗi hotfix FE theo đặc tả **MASTER TASK 3** (menu → tab, responsive, toolbar CRUD, trạng thái tiếng Việt, Excel UTF-8, modal thay side tab, thông báo hệ thống…).

---

## 11. BỔ SUNG VÒNG 2 (2026-10-07 18:xx) — AUDIT UTF-8 MỌI NÚT XUẤT EXCEL/CSV

### 11.1 Task
| ID | Tên | Category | Status |
|---|---|---|---|
| `TASK-20261007-C03` | Audit UTF-8 toàn bộ đường xuất Excel/CSV + vá tệp mẫu thiếu BOM | UI_UX · BUGFIX · TESTING | `FIXED` (chờ user nghiệm thu) |

### 11.2 Bug
| ID | Mô tả | Severity | ROOT CAUSE | Status |
|---|---|---|---|---|
| `BUG-20261007-C02` | Nút «Mẫu CSV» tải tệp thiếu BOM ⇒ Excel hiện **sai dấu** tiếng Việt | MEDIUM | 2/13 đường xuất là **tệp mẫu CSV tĩnh THIẾU BOM `EF BB BF`**; Excel Windows không tự dò UTF-8. ⚠️ `scripts/template-preflight.mjs` **ĐẠT** vì ⛔ không kiểm BOM ⇒ lỗi tồn tại lâu | `FIXED` |

### 11.3 Development / Change
| ID | Nội dung |
|---|---|
| `DEV-20261007-C03` | Lập **bảng audit 13 đường xuất** (12 ĐẠT · **1 nhóm LỖI = 2 tệp mẫu CSV**); vá BOM; dựng cổng 5 ca có **đối chứng âm** |
| `CHG-20261007-C04` | 2 tệp mẫu CSV: 241 B → **244 B** · 1175 B → **1178 B** (thêm BOM, ⛔ không đổi nội dung) — nay **đã publish** ra `:8787`/`:9000` |
| `CHG-20261007-C05` | Thêm `tests/mt3-c03-export-utf8.test.mjs` (5 ca) — gồm **quét đệ quy `public/**`** bắt buộc BOM + **chạy thật** XLSX (giải nén, đọc lại XML) |

### 11.4 Tests (đo được)
| Cổng | Kết quả |
|---|---|
| Cổng UTF-8 mới | **5/5 PASS** · **đối chứng âm ĐỎ đúng thiết kế** (thêm CSV không BOM ⇒ 1 fail, nêu đích danh tệp) |
| `npm run test:regression` | **816 test · 815 pass · 0 fail · 1 skip** (exit 0) |
| `tsc` · `eslint` | **0 lỗi** · **0 lỗi** (tự sửa 1 lỗi ESLint `no-assign-module-variable` do tôi đặt tên biến `module`) |
| `gd-cycle` lần 2 | PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT** · `fixed point stable: OK` · vân tay **`VNTECH-FP-B28418CE305E837E`** (722 files) · exit 0 |
| LIVE | `:8787` **200** · `:9000` **200** · CSV mẫu trả về **244 B / 1178 B · BOM=True** trên **cả 2 cổng** |

### 11.5 Decisions
| ID | Quyết định |
|---|---|
| `DEC-20261007-C04` | CSV tiếng Việt **BẮT BUỘC** có BOM; cổng kiểm đặt ở `tests/**` (⛔ không sửa `scripts/**`); mọi đường xuất mới phải đi qua `lib/tabular-export.ts` |
| `DEC-20261007-C05` | ⛔ **KHÔNG** chạy `fixpoint-fingerprint.mjs` như lệnh CHỈ ĐỌC (nó **GHI** định danh) — muốn refresh thì luôn đi qua `gd-cycle` |

### 11.6 Handoff / Risk
| ID | Nội dung | Status |
|---|---|---|
| `HANDOFF-20261007-C03` | Gửi S01+S02: phối hợp build/dịch vụ (dừng **đúng PID**), vân tay mới `B28418CE…`, và **tự nhận sự cố** vân tay + luật rút ra | `OPEN` (thông báo) |
| Rủi ro | ⚠️ Có **~2 phút gián đoạn** `:8787`/`:9000` trong lúc build (đã ghi rõ, ⛔ không che) · ⛔ 3 task vẫn `FIXED`, **CHƯA** `VERIFIED` vì chưa có nghiệm thu của user | — |

---

## 12. BỔ SUNG VÒNG 3 (2026-10-07 19:xx) — TRẠNG THÁI TIẾNG VIỆT TOÀN HỆ THỐNG (MT3 §IV.6)

### 12.1 Task / Bug
| ID | Nội dung | Status |
|---|---|---|
| `TASK-20261007-C04` | Trạng thái đơn/phiếu toàn hệ thống hiển thị tiếng Việt | `FIXED` (chờ user nghiệm thu) |
| `BUG-20261007-C03` | Trạng thái hiển thị **tiếng Anh** ở nhiều màn + **lọt cả vào TỆP XUẤT** | `FIXED` |

### 12.2 ROOT CAUSE (đo thật trước khi sửa)
`partial_issued` ⇒ «Partial issued» · `issued` ⇒ «Issued» · `awaiting_po` ⇒ «Awaiting po» · `posted` ⇒ «Posted» ·
`REWORK` ⇒ «REWORK» · `WAITING_SUPPLIER` ⇒ «WAITING SUPPLIER» · `StatusBadge("IN_PROGRESS")` in nguyên mã.

**4 nguyên nhân gốc**: ① bảng nhãn DÙNG CHUNG thiếu **15 mã** chuỗi cung ứng · ② `StatusBadge` chỉ dịch mã **chữ thường**
⇒ mã VIẾT HOA của Công việc lọt nguyên · ③ `lib/labels.ts` fallback `row.supplyStatus || row.status` ⇒ **rò mã thô**
(7 mô-đun, gồm **2 đường XUẤT TỆP**) · ④ `lib/report-catalog.ts` là bản `statusLabel` **thứ ba** (Trung tâm báo cáo).
⑤ (phát hiện thêm khi viết cổng) ô lọc trạng thái dựng nhãn từ mã thô.

### 12.3 Change / Dev
| ID | Nội dung |
|---|---|
| `CHG-20261007-C06` | **Số bảng nhãn trạng thái: 3 → 1**; mã chữ HOA được dịch; màu badge suy từ chữ hiển thị; ô lọc + cột tình trạng hết rò mã thô |
| `DEV-20261007-C04` | Thêm domain `supply` + `knownStatusLabel()` + tra chéo domain theo **thứ tự cố định**; `StatusBadge` nhận `A-Za-z0-9_.-` |

### 12.4 Testing
| Cổng | Kết quả |
|---|---|
| `tests/mt3-c04-status-vi.test.mjs` (**mới, 7 ca**) | **7/7 PASS** — chạy THẬT bảng nhãn bằng esbuild + **đối chứng âm** |
| `npm run test:regression` | **823 test · 822 pass · 0 fail · 1 skip** (exit 0) |
| `tsc` · `eslint` | **0 lỗi** · **0 error** (6 warning có sẵn từ trước) |
| `gd-cycle` (lần 3) | PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT** · vân tay **`CC0200A8CAF69D28`** (724 files) |
| LIVE | `:8787` **200** · `:9000` **200** · bundle chứa **8/8 nhãn mới** + chốt chữ HOA · hồi quy 2 bản vá trước **ĐẠT** |

### 12.5 Decisions / Rủi ro
| ID | Nội dung |
|---|---|
| `DEC-20261007-C06` | 1 nguồn nhãn duy nhất; bảng ĐẶC THÙ PHÂN HỆ được phép **có điều kiện** (phải fallback bảng chung); tra chéo domain theo thứ tự cố định; **bảng chung luôn thắng**; cập nhật 2 ca `v215` ⛔ **không hạ chuẩn** |
| Tồn đọc lại | `priority` của nhiệm vụ còn in mã thô — **ngoài phạm vi trạng thái** ⇒ task sau (⛔ không tự thêm vào `lib/ui-shared.tsx` giữa GO-LIVE) |

---

## 13. BỔ SUNG VÒNG 4 (2026-10-07 20:xx) — HẾT MÃ TIẾNG ANH Ở ƯU TIÊN + LOẠI CON DẤU

### 13.1 Task / Bug
| ID | Nội dung | Status |
|---|---|---|
| `TASK-20261007-C05` | Hợp nhất nhãn `priority` + `seal_type`; vá 4 màn còn in mã thô | `FIXED` (chờ user nghiệm thu) |
| `BUG-20261007-C04` | Cột «Ưu tiên»/«Loại con dấu» in **mã tiếng Anh** (+ ternary **sót `critical`** ⇒ việc KHẨN CẤP hiện «Thường») | `FIXED` |

### 13.2 Phép đo quyết định (đối chiếu ô CHỌN trong form với chỗ HIỂN THỊ)
✅ **6 trường LƯU NHÃN TIẾNG VIỆT** (`benefitType` · `docType`×2 · `contractType` lao động · `costType`) ⇒ ⛔ **KHÔNG sửa**.
⛔ **2 trường LƯU MÃ ANH** ⇒ đã vá: `work_items.priority` · `seals.seal_type`.

### 13.3 Change / Dev
| ID | Nội dung |
|---|---|
| `CHG-20261007-C07` | Thêm domain `priority` (5 mức) + `seal_type` (4 loại) vào bảng nhãn DÙNG CHUNG; vá 5 chỗ hiển thị; ⛔ không tạo bảng thứ năm; ⛔ không xoá `KANBAN_PRIORITIES` (còn `tone`/`rank`) ⇒ cổng kiểm chống lệch |
| `DEV-20261007-C05` | `DOMAIN_LOOKUP_ORDER` nối thêm 2 domain; cổng C04 thêm 3 ca (gồm **đối chứng dương** `critical` ⛔ không được «Thường») |

### 13.4 Testing
| Cổng | Kết quả |
|---|---|
| `tests/mt3-c04-status-vi.test.mjs` | **10/10 PASS** |
| `npm run test:regression` | **826 test · 825 pass · 0 fail · 1 skip** (exit 0) |
| `tsc` · `eslint` | **0 lỗi** · **0 error** (6 warning có sẵn từ trước) |
| `gd-cycle` (lần 4) | **ĐẠT** · vân tay **`VNTECH-FP-810CCA1455FA48BD`** (725 files) |
| LIVE | `:8787` **200** · `:9000` **200** · bundle **4/4 nhãn mới** · **hồi quy 3 vòng trước ĐẠT** |

### 13.5 Handoff / Rủi ro
| ID | Nội dung |
|---|---|
| `HANDOFF-20261007-C04` | Gửi S01: `app/page.tsx:3110` in `contractType` dự án dạng mã `main`/`addendum` (⛔ phiên 03 không sửa tệp đó) |
| ⛔ Tự nhận | Tôi từng **thêm domain SAI THỜI ĐIỂM** (sau build) ⇒ làm lệch vân tay nguồn ⇒ **đã hoàn tác ngay**, kiểm lại `contract_type` = **0 lần**, cổng **10/10**, `tsc` **0** |
| Tồn đọc lại | `lib/supply-docs.tsx` · `lib/request-actions.ts` (đường XUẤT TỆP) cần đo riêng xem có lọt `priority`/`contractType` thô không ⇒ task sau |

---

## 14. BỔ SUNG VÒNG 5 (2026-10-07 21:xx) — MÃ THÔ ƯU TIÊN TRONG TỆP XUẤT + MỞ RỘNG CỔNG SANG `lib/**`

### 14.1 Task / Bug
| ID | Nội dung | Status |
|---|---|---|
| `TASK-20261007-C06` | Vá bản dịch Ưu tiên thứ 5 & 6; mở rộng cổng sang `lib/**` | `FIXED` (chờ user nghiệm thu) |
| `BUG-20261007-C05` | Ưu tiên in **MÃ THÔ vào TỆP XUẤT PDF/XLSX** (`lib/request-export.ts`) | `FIXED` |

### 14.2 Root cause + 3 chỗ cổng bắt được khi mở rộng phạm vi
`lib/request-export.ts:25` tự dịch Ưu tiên và **sót `critical`/`low`** ⇒ rơi vào `text(value)` = **in mã thô vào tệp xuất**.
Mở rộng cổng sang `app/**` + `lib/**` bắt thêm: `app/screens/RequestDrawer.tsx` (hiện **«Bình thường» cho mọi mã lạ** — sai
nghiệp vụ, ⛔ tệ hơn in mã thô) và `app/page.tsx` (⛔ thuộc phiên 01 ⇒ `HANDOFF-20261007-C05`, cổng ghi thành **NỢ ĐÃ GIAO có tên**).

### 14.3 Testing
| Cổng | Kết quả |
|---|---|
| `tests/mt3-c04-status-vi.test.mjs` | **11/11 PASS** (ca ⑪ quét cả `app/**` + `lib/**`, có đối chứng dương) |
| `test:regression` **trước build** | ⚠️ **827 test · 824 pass · 2 ĐỎ** (`v217-4/217-5`: cổng báo **«dist/ CŨ HƠN nguồn»** — ⭐ **đúng thiết kế**) |
| `test:regression` **sau build** | **827 test · 826 pass · 0 fail · 1 skip** |
| `tsc` · `eslint` | **0 lỗi** · **0 error** |
| ⭐ `node tools/verify-ui-build-applied.mjs` | ✓ dist mới hơn nguồn · ✓ HTML khớp vân tay SSOT · ✓ 6/6 bundle đúng byte ⇒ **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»** |
| `gd-cycle` (lần 5) | **ĐẠT** · vân tay **`VNTECH-FP-852E28FC276F90F6`** (726 files) |
| LIVE | `:8787` **200** · `:9000` **200** · bundle chứa **6/6 dấu vân tay 5 vòng** |

### 14.4 Bài học & Phối hợp
| ID | Nội dung |
|---|---|
| ⭐ Bài học 1 | **`gd-cycle` là BẮT BUỘC** sau mọi sửa `lib/**`·`app/**`·`public/**` — dự án có cổng riêng (`tools/verify-ui-build-applied.mjs` qua `tests/v217`) bắt việc «dist cũ hơn nguồn». |
| ⭐ Bài học 2 | **Một cổng chỉ mạnh bằng PHẠM VI QUÉT** — vòng 4 chỉ quét `app/screens/**` nên bỏ sót **đường XUẤT TỆP** (`lib/**`). Từ nay quét cả hai. |
| Ghi nhận | Baseline định danh đầu vào build lần 5 là `0FFB3FBA…` ⇒ **một phiên khác đã build xen giữa** (⛔ phiên 03 không nhận xét thay ai). |
| Nợ đã giao | `HANDOFF-20261007-C04` (`contractType`) · `HANDOFF-20261007-C05` (Ưu tiên trong `app/page.tsx`) — ⛔ cả hai **hiện tên** mỗi lần chạy cổng, ⛔ không phải nợ ẩn. |
