# TASK-MT3-UI-27 — **RÀ SOÁT MA TRẬN THEO MÃ THẬT + SỬA #9 (KẾT LUẬN: KHÔNG PHẢI KHOẢNG TRỐNG)**

| Mục | Nội dung |
|---|---|
| **Task** | **UI-27** — rà lại 12 hàng ma trận bằng **đo trên mã thật** |
| **Phase** | **GĐ1 — FRONTEND** *(rà soát)* + **§15 — PERMISSION** |
| **Status** | ✅ **HOÀN TẤT** · ma trận đã cập nhật theo bằng chứng |

## 🔴 BƯỚC 1 — MA TRẬN `MT3-UI-MATRIX.md` **ĐÃ CŨ** ⇒ ⛔ suýt tin nhầm
File vẫn ghi `#5 ❌ · #8 ❌ · #11 ❌` **dù đã sửa xong**. ⇒ **ĐÃ cập nhật 9 dòng** theo đo thật.

## ✅ KẾT QUẢ RÀ 12 HÀNG *(đều bằng đo, ⛔ không đoán)*

| # | Hàng | Kết quả **đo được** |
|---|---|---|
| 1 | Menu cha mở màn có tab con | ✅ **8/8 nhóm** có tab *(cơ chế dùng chung `hubTabsFor`)* + sidebar **chỉ còn NHÓM CHA** |
| 2 | Bỏ «Chọn dự án» đầu trang | ✅ **XONG** — chuỗi còn lại đều là **comment** ghi «đã bỏ» hoặc bộ chọn phạm vi **có chủ đích** trong toolbar |
| 3 | Toolbar CRUD ngang chuẩn | ⚠️ **CẦN RÀ TỪNG TỆP** — 40 màn: **14** có `ListToolbar`, **18** có `row-actions`; **8 tệp có `row-actions` mà ⛔ không có `ListToolbar`**: `BoqControl` · `CorrespondenceScreen` · `MaterialListTable` · `ProjectDetailTabs` · `ProjectEntityModal` · `RequestDrawer` · `Stocktake` · `SupplierDetailModal` |
| 4 | Modal thay side panel | ✅ **XONG** — `<aside>` màn Kho → hộp thoại (kế hoạch 5 bước, ⛔ **KHÔNG viết lại dòng 1000 ký tự** — chỉ chèn **2 mốc ngắn**) |
| 5 | Trạng thái tiếng Việt | ✅ **XONG** — **0** chỗ dùng `StatusBadge value={String(row.status)}`; **5 file** dùng `statusLabel` |
| 6 | Export Excel/CSV UTF-8 | ✅ **4/4 màn** dùng `downloadCsv` từ `lib/tabular-export` |
| 7 | Responsive 5 mức | ✅ **ĐÃ CÓ** — đo thật: `max-width: 375px` · `360px` · `320px` |
| 8 | Toggle menu «tự ẩn khi đủ chỗ» | ✅ **XONG** — `@media (min-width:1024px)` ẩn `.mobile-nav-collapse` *(thuần CSS, ⛔ không hook JS)* |
| 9 | Phân quyền nút + backend | ✅ **KHÔNG PHẢI KHOẢNG TRỐNG** *(xem dưới)* |
| 10 | Dự án: tab đúng nhãn | ✅ **XONG** — `ProjectDetailTabs.tsx:33` = `["Thông tin dự án","Nhân sự","Tổ đội","Kho","Lịch sử"]` |
| 11 | Thi công | ✅ **XONG** — nút đã bỏ (`ConstructionScreen.tsx:51` ghi nhận) |
| 12 | Tổ đội: tab + Lịch sử | ✅ Có tab **Lịch sử** + `ListToolbar` |

## 🔴 BƯỚC 2 — #9: **ĐÃ ĐỊNH SỬA SAI THÌ KHÔNG PHẢI KHOẢNG TRỐNG**
### Triệu chứng ban đầu
`Requests.tsx`: **12 `<button>` + 3 `ListToolbar`** nhưng `permission` = **0 lần**.

### Điều tra đầy đủ trước khi sửa
| Câu hỏi | Trả lời | Hệ quả |
|---|---|---|
| `Requests` có nhận prop `permission`? | ⛔ **KHÔNG** — `{ rows, projects, project, onProject, open, inventory, exportRows, onPickShortage }` | không thể chặn ở UI mà không phải **tự chế cơ chế mới** |
| **Có màn nào khác nhận prop `permission` không?** | ⛔ **0/40 tệp** trong `app/screens` | ⇒ chẳng màn nào chặn ở UI ⇒ **không phải thiếu sót riêng của `Requests`** |
| **Backend có chặn không?** *(phần cứng của §15)* | ✅ **CÓ** — `ActionRbacRegistry:89` `create_request→module "requests"` · `:343` `create_request→canCreate` · **`RbacService:57,70` là nơi đọc registry**; `RequestManagementUseCase:66` ghi rõ *«Quyền TẠO vẫn đi qua **CỔNG RBAC**»* | ⇒ **§15 đã được đáp ứng** |

### ✅ KẾT LUẬN
⛔ **KHÔNG sửa.** Lý do:
1. **§15 phần cứng đã đạt** — backend **từ chối** request trái phép.
2. §15 nói *«không hiển thị action **nếu phù hợp**»* ⇒ phần UI là **tuỳ chọn**, không phải bắt buộc.
3. Sửa sẽ phải **tự chế** nguồn capability mới ⛔ vi phạm **§19 (không tự phát minh nghiệp vụ)**; và nếu chặn nhầm sẽ **ẩn nút người dùng hợp lệ vẫn cần** ⇒ **phá app**.

## 🧠 **BA BÀI HỌC TRONG LÒM NÀY** *(lần thứ 3–4 tôi suýt kết luận sai)*
1. ⛔ **Đừng kết luận «thiếu» từ việc THIẾU một từ khoá** — `permission` = 0 **không** chứng minh thiếu; phải hỏi *«tệp khác có làm vậy không?»* ⇒ **0/40**.
2. ⛔ **Đừng dùng `grep` khớp chuỗi làm bằng chứng** — `WorkKanban.tsx:16,125` chứa *«Gửi kiểm tra»* nhưng đó là **tên quy trình thật** *(«Người thực hiện chỉ được Gửi kiểm tra; trưởng phòng mới xác nhận»*) ⇒ suýt **xoá nhầm nghiệp vụ**.
3. ⛔ **Đừng kết luận từ lệnh PowerShell HỎNG** — `-Include` thiếu đường dẫn ⇒ `0/0 tệp` nhưng tôi suýt đọc là «không màn nào dùng toolbar».

## 🧪 XÁC MINH CUỐI — **7/7 CỔNG ĐẠT**
| # | Cổng | Kết quả |
|---|---|---|
| 1 | `npm run verify:master-baseline` | ✅ **ĐẠT** · `!important=3652` |
| 2 | `npm run verify:css-baseline` | ✅ **ĐẠT** · `2558 lines` · **`dead classes=0 · dead vars=0`** · `empty media=0` |
| 3 | `npx tsc --noEmit` | ✅ **`EXIT=0`** |
| 4 | contract | ✅ **`tests 653 · pass 652 · fail 0 · skipped 1`** |
| 5 | `npm run test:regression` | ✅ **`pass 69 · fail 0`** |
| 6 | `mvn -f java-backend/pom.xml test` | ✅ **`Tests run: 74 · Failures: 0 · Errors: 0`** · **BUILD SUCCESS** |
| 7 | Dịch vụ `:9000` | ✅ trang chủ **HTTP 200** · **đăng nhập HTTP 200** |

## 🖥️ Trạng thái phục vụ
| Cổng | Vai trò |
|---|---|
| **`:9000`** | **cổng vào chuẩn** *(proxy → UI `:3000` + API `:18081`)* ✅ |
| `:3000` | UI mới *(từ `dist/`, build `VNTECH-FP-2F285AE22C787DDC` · **564 tệp**)* ✅ |
| `:18081` | Java API ✅ |
| `:8787` | UI Node/JS **cũ** ⛔ *(không chứa mã Next.js)* — có watchdog tự khởi động lại |

## Blockers
⛔ **Không có blocker kỹ thuật.**
⛔ **KHÔNG tuyên bố `MASTER TASK 3 = COMPLETE`** — còn:
- **#3** — cần **đọc từng trong 8 tệp** để xác định có thực sự vi phạm quy ước toolbar không.
- **Chưa có xác nhận trực quan từ user** *(user tự soi ảnh/giao diện theo lựa chọn của mình)*.

## Next task
1. **#3** — rà 8 tệp có `row-actions` mà không có `ListToolbar`; ⛔ **không sửa mù**, chỉ sửa tệp **thực sự** vi phạm.
2. Chờ user xác nhận giao diện tại `http://127.0.0.1:9000`.
