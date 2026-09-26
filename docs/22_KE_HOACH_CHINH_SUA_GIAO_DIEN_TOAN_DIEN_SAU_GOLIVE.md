# 22 — KẾ HOẠCH CHỈNH SỬA GIAO DIỆN TOÀN DIỆN SAU GOLIVE

- **Trạng thái:** Chờ duyệt — **chưa thực hiện**
- **Tiền đề:** `docs/21` — 8 nhóm yêu cầu đã hoàn thành, định danh `VNTECH-FP-91C8C3B6EE5D6703`
- **Nguyên tắc:** không đổi nghiệp vụ, không đổi hợp đồng API, không phá vỡ định danh nguồn

---

## 1. Vì sao cần một đợt chỉnh sửa toàn diện

Tám nhóm yêu cầu vừa rồi là **sửa cục bộ có kiểm soát**. Chúng giải quyết đúng vấn đề người
dùng nêu, nhưng không chạm tới ba khoản nợ kỹ thuật gốc vẫn đang kìm hãm giao diện:

### Nợ 1 — Tầng CSS chồng lấn

| Chỉ số | Hiện trạng |
|---|---|
| `globals.css` | 2.724 dòng |
| Số lần `!important` | **4.950** |
| Số định nghĩa `.table-wrap` | **26** chồng chéo nhau |
| Số tệp CSS phải nạp | 3 (`globals` → `canonical` → `font-floor`) |

`canonical.css` là **lớp đè**, không phải bản viết lại. Nó thắng nhờ nạp sau và nhờ
`!important`, chứ không nhờ cấu trúc. Mỗi lần thêm giao diện mới, xác suất va chạm lại tăng.
`font-floor.css` cũng là **băng dán**: nó nâng 120 selector lên 10px bằng cách sinh tự động
từ danh sách selector cứng, chứ không sửa gốc nơi cỡ chữ bị đặt sai.

### Nợ 2 — Một tệp chứa toàn bộ giao diện

`app/page.tsx` hiện **4.057 dòng** với **218 khai báo hàm cấp cao**. Không có biên giới module,
không thể tách người làm song song, không thể test từng màn độc lập, và mọi thay đổi đều
phải build lại toàn bộ.

### Nợ 3 — Không có tầng thiết kế

Không có token thiết kế tập trung. Khoảng cách, bo góc, đổ bóng, cỡ chữ được viết rải rác
bằng giá trị cứng trong từng component. Hệ quả là giao diện **không nhất quán giữa các màn**
và không thể đổi nhận diện thương hiệu mà không sửa hàng nghìn dòng.

---

## 2. Mục tiêu và phi mục tiêu

**Mục tiêu**
1. Một tầng CSS **có cấu trúc**, không dùng `!important` để thắng.
2. Một **hệ token thiết kế** duy nhất làm nguồn sự thật cho màu, chữ, khoảng cách, bo góc.
3. Tách `app/page.tsx` thành các module màn hình độc lập.
4. Nhất quán thị giác trên **toàn bộ** màn hình: bảng, biểu mẫu, nút, trạng thái, thông báo.
5. Không hồi quy: 13 probe hiện có phải ĐẠT sau **mỗi** đợt.

**Phi mục tiêu**
- Không đổi mô hình dữ liệu, không đổi API, không đổi RBAC.
- Không đổi công nghệ (vẫn Next/vinext + React, không chuyển sang thư viện UI ngoài).
- Không làm lại toàn bộ giao diện từ đầu — đây là **tái cấu trúc**, không phải viết mới.
- Không thêm tính năng nghiệp vụ mới trong đợt này.

---

## 3. Bố cục tổng thể

Đợt chỉnh sửa chia **6 giai đoạn**, mỗi giai đoạn có cổng nghiệm thu riêng và có thể dừng lại
an toàn. Thứ tự được chọn sao cho **mỗi bước đều để lại hệ thống chạy được**, không có bước
nào yêu cầu "đập đi xây lại" rồi mới chạy được.

```
GĐ 0  Chốt baseline + lưới an toàn          (không đổi giao diện)
GĐ 1  Hệ token thiết kế                     (không đổi hình thức)
GĐ 2  Viết lại tầng CSS có cấu trúc         (đổi cách, không đổi hình)
GĐ 3  Tách app/page.tsx thành module        (không đổi hành vi)
GĐ 4  Chuẩn hoá thành phần giao diện        (đổi hình có kiểm soát)
GĐ 5  Rà soát toàn diện + nghiệm thu        (khoá phiên bản)
```

---

## 4. Chi tiết từng giai đoạn

### GĐ 0 — Chốt baseline và dựng lưới an toàn

**Mục tiêu:** có thước đo khách quan trước khi chạm vào bất cứ thứ gì.

**Công việc**
1. Chụp ảnh **toàn bộ màn hình ở 4 kích thước** (desktop rộng, laptop, tablet, điện thoại)
   làm ảnh chuẩn đối chiếu.
2. Ghi lại chỉ số xuất phát: `globals.css` 2.724 dòng / 4.950 `!important` / 26 định nghĩa
   `.table-wrap`; `app/page.tsx` 4.057 dòng / 218 khai báo hàm.
3. Dựng `tools/probe-visual-regression.mjs` — so ảnh chụp từng màn theo ngưỡng lệch điểm ảnh,
   báo cáo vùng lệch. Đây là **cổng chặn hồi quy thị giác** cho toàn bộ các giai đoạn sau.
4. Dựng `tools/probe-css-budget.mjs` — đếm và chặn ngưỡng: số `!important`, số định nghĩa
   trùng selector, số dòng mỗi tệp. **Đặt trần:** `!important` không được tăng, chỉ được giảm.

**Cổng nghiệm thu GĐ 0:** 13 probe hiện có ĐẠT + 2 probe mới chạy được và báo cáo đúng hiện trạng.

**Rủi ro:** thấp — chưa chạm vào mã sản phẩm.

---

### GĐ 1 — Hệ token thiết kế

**Mục tiêu:** một nguồn sự thật duy nhất cho mọi giá trị thị giác. **Chưa đổi hình thức.**

**Công việc**
1. Tạo `app/styles/tokens.css` định nghĩa bằng biến CSS, chia nhóm rõ ràng:
   - **Màu:** nền, mặt phẳng, viền, chữ chính/phụ/mờ, màu nhấn, màu trạng thái
     (thành công · cảnh báo · nguy hiểm · thông tin);
   - **Chữ:** thang cỡ (11 · 12 · 13 · 14 · 16 · 20 · 24 · 32px), độ đậm, chiều cao dòng,
     họ chữ;
   - **Khoảng cách:** thang 4px (4 · 8 · 12 · 16 · 24 · 32 · 48);
   - **Bo góc:** 4 · 6 · 8 · 12 · tròn;
   - **Đổ bóng:** 3 mức;
   - **Lớp xếp chồng (`z-index`):** đặt tên thay vì số rời rạc;
   - **Điểm ngắt responsive:** 4 mức đặt tên.
2. Ánh xạ **giá trị cứng đang dùng** sang token — không phát minh giá trị mới, chỉ đặt tên
   cho cái đang có.
3. Nâng **sàn cỡ chữ 10px** thành token `--font-size-min` và **ghi rõ lý do**: đây là mức nhỏ
   nhất còn đọc được trên màn hình mật độ cao; mọi cỡ nhỏ hơn phải bị cấm ở tầng token.
4. Chuyển `font-floor.css` sang **dùng token** thay vì giá trị cứng.

**Cổng nghiệm thu GĐ 1:** `probe-visual-regression` — **0 vùng lệch** (hình thức không đổi) +
`probe-css-budget` ĐẠT.

**Rủi ro:** thấp–trung bình. Rủi ro chính là ánh xạ sai giá trị cứng sang token, nhưng cổng
so ảnh sẽ bắt ngay.

---

### GĐ 2 — Viết lại tầng CSS có cấu trúc

**Mục tiêu:** bỏ cách "thắng bằng `!important`", thay bằng cấu trúc thật.

**Công việc**
1. **Hợp nhất 26 định nghĩa `.table-wrap`** thành **một** định nghĩa chuẩn, có biến thể
   tường minh (`.table-wrap--compact`, `.table-wrap--sticky-head`) thay vì chồng đè ngầm.
2. Chia CSS theo tầng rõ ràng và **kiểm soát thứ tự nạp**:
   - `tokens.css` — biến, không có selector
   - `base.css` — reset, kiểu thẻ gốc, thanh cuộn, nhịp dọc
   - `components.css` — nút, biểu mẫu, bảng, thẻ, nhãn trạng thái, hộp thoại
   - `screens.css` — bố cục riêng từng màn
   - `utilities.css` — lớp tiện ích tối thiểu
3. **Loại bỏ `!important` theo từng đợt**, mỗi đợt là một nhóm selector, chạy cổng so ảnh
   sau mỗi đợt. Mục tiêu cuối: **0 `!important`** cho bố cục và màu sắc.
4. Gộp `globals.css` vào cấu trúc mới; các quy tắc chết (không selector nào khớp trong mã
   nguồn) bị **xoá hẳn**, có liệt kê trong báo cáo.
5. Chuyển các điểm ngắt responsive từ giá trị cứng sang token dùng chung.

**Cổng nghiệm thu GĐ 2:** `probe-visual-regression` 0 vùng lệch khi kết thúc giai đoạn, cho
phép lệch tạm thời **trong** giai đoạn ở những chỗ cố ý sửa; `probe-css-budget`:
`!important` **giảm xuống dưới 200**, `.table-wrap` **đúng 1** định nghĩa gốc.

**Rủi ro:** **cao nhất trong toàn bộ kế hoạch.** Đây là chỗ dễ gây hồi quy thị giác diện rộng.
Giảm thiểu: làm theo từng nhóm selector nhỏ, cổng so ảnh sau mỗi nhóm, giữ `canonical.css`
nguyên vẹn cho tới khi nhóm cuối cùng được chuyển xong.

---

### GĐ 3 — Tách `app/page.tsx` thành module màn hình

**Mục tiêu:** biên giới rõ ràng, không đổi hành vi.

**Công việc**
1. Tách theo **màn hình**, không tách theo loại kỹ thuật:

```
app/
  screens/
    projects/        ProjectManagement + 5 tab
    work/            WorkCenter + 3 tab
    teams/           TeamManagement + 3 tab
    materials/       MaterialCatalogPage, MaterialListTable, MaterialCatalogManager
    staff/           AdminStaffList
    organization/    quyền phòng ban, checkbox
    requests/        RequestDrawer (chế độ drawer + page)
  components/        thành phần dùng chung: CardHead, Pill, Empty, bảng, biểu mẫu
  lib/               kiểu dữ liệu, hàm hỗ trợ thuần (daysFromToday, workRate, isTaskLate…)
  page.tsx           chỉ còn: nạp bootstrap, định tuyến màn hình, khung bao ngoài
```

2. Chuyển phần dùng chung xuống `components/` và `lib/` **trước**, tách màn hình **sau** —
   để tránh nhập nhằng sở hữu.
3. Giữ nguyên tên lớp CSS trong suốt giai đoạn này, **không đổi giao diện**.
4. `page.tsx` mục tiêu: **dưới 300 dòng**.

**Cổng nghiệm thu GĐ 3:** `probe-visual-regression` 0 vùng lệch + toàn bộ 13 probe ĐẠT +
build thành công. Đây là giai đoạn dễ kiểm chứng nhất vì hành vi phải **giống hệt**.

**Rủi ro:** trung bình. Rủi ro chính là vòng phụ thuộc vòng giữa các module và trạng thái
dùng chung khó tách. Giảm thiểu: tách từng màn một, chạy cổng sau mỗi màn.

---

### GĐ 4 — Chuẩn hoá thành phần giao diện

**Mục tiêu:** đổi hình thức **có chủ đích** để đạt nhất quán toàn hệ thống.

**Công việc**
1. **Thang chữ:** bỏ mọi cỡ dưới 11px ở nội dung thường; bảng dùng 12–13px; tiêu đề theo
   thang token. Sàn 10px chỉ còn áp cho nhãn phụ trong bảng mật độ cao.
2. **Bảng:** một thành phần bảng duy nhất dùng chung cho mọi màn — tiêu đề dính khi cuộn,
   sắp xếp, lọc, phân trang, trạng thái rỗng, đang tải — thay cho các bảng viết riêng.
3. **Biểu mẫu:** nhãn trên ô nhập, thông báo lỗi cạnh ô, trạng thái bắt buộc, trạng thái
   `disabled` đọc được rõ ràng.
4. **Trạng thái:** một bảng nhãn trạng thái thống nhất (màu + chữ) dùng chung cho công việc,
   dự án, tổ đội, vật tư.
5. **Thông báo:** hệ thống thông báo thống nhất (thành công · lỗi · cảnh báo · thông tin),
   có thời lượng và có thể đóng.
6. **Tải và rỗng:** mọi danh sách có trạng thái khung xương khi đang tải và trạng thái rỗng
   có hướng dẫn hành động, không để bảng trắng.
7. **Khả năng truy cập:** mọi nút và ô nhập đều có nhãn; điều hướng bàn phím hoạt động;
   tương phản màu đạt **WCAG AA**; nút bị vô hiệu hoá **phải** giải thích lý do (đã làm ở
   bảng vật tư — nhân rộng ra toàn hệ thống).

**Cổng nghiệm thu GĐ 4:** ảnh chuẩn được **cập nhật có chủ đích** cho từng màn, kèm lý do
từng thay đổi; mọi màn ĐẠT kiểm tra tương phản; 4 kích thước không tràn ngang.

**Rủi ro:** trung bình — đây là giai đoạn **cố ý** đổi hình, nên cổng so ảnh không còn là
"0 vùng lệch" mà là "mọi lệch đều được giải thích và duyệt".

---

### GĐ 5 — Rà soát toàn diện và nghiệm thu

**Công việc**
1. Chạy lại **toàn bộ** probe ở 4 kích thước màn hình.
2. Kiểm tra tương phản màu toàn hệ thống theo WCAG AA.
3. Kiểm tra bàn phím và trình đọc màn hình trên các luồng chính.
4. Đo lại chỉ số: số dòng CSS, số `!important`, kích thước gói sau khi build.
5. Kiểm tra bằng **tài khoản thiếu quyền** cho **mọi** màn — không chỉ admin.
6. Cập nhật ảnh chuẩn làm baseline mới, ghi vào tài liệu.
7. Chạy chu trình định danh đầy đủ, sinh manifest, khoá phiên bản.

**Cổng nghiệm thu GĐ 5:** toàn bộ probe ĐẠT, `probe-css-budget` đạt mọi trần, không hồi quy
chức năng, người dùng nghiệm thu trên môi trường chạy thật.

---

## 5. Chỉ số mục tiêu

| Chỉ số | Hiện tại | Mục tiêu |
|---|---|---|
| Số lần `!important` | 4.950 | **0** cho bố cục và màu sắc |
| Định nghĩa gốc `.table-wrap` | 26 | **1** |
| Số dòng `app/page.tsx` | 4.057 | **< 300** |
| Số dòng `globals.css` | 2.724 | gộp vào cấu trúc, xoá quy tắc chết |
| Số tệp CSS | 3 chồng lớp | 5 tầng có thứ tự kiểm soát |
| Số cỡ chữ dưới 11px | 120 selector | chỉ còn nhãn phụ mật độ cao |
| Số bảng dùng chung | nhiều bản riêng | **1** thành phần bảng |
| Tương phản màu | chưa đo | **WCAG AA** toàn hệ thống |

---

## 6. Rủi ro và cách giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Hồi quy thị giác diện rộng ở GĐ 2 | **Cao** | Chia nhóm selector nhỏ, cổng so ảnh sau mỗi nhóm, giữ `canonical.css` tới nhóm cuối |
| Phụ thuộc vòng khi tách module ở GĐ 3 | Trung bình | Tách dùng chung trước, tách màn sau, một màn mỗi lần |
| Mất hành vi ngầm khi tách `page.tsx` | Trung bình | Giai đoạn 3 bắt buộc hành vi **giống hệt**; 13 probe làm lưới |
| Đổi định danh nguồn giữa đường | Trung bình | Mỗi đợt một migration `drizzle/`, chạy đủ chu trình |
| Gián đoạn dịch vụ đang chạy | Thấp | Build theo chu trình, chỉ dừng UI và proxy |
| Mất `.local-data` khi build | Thấp | Dời ra **cùng ổ đĩa**, **không** dùng `%TEMP%` |

---

## 7. Thứ tự thực hiện đề xuất

**Ưu tiên 1 — nền móng, không đổi hình:** GĐ 0 → GĐ 1.
Ít rủi ro nhất, lợi ích lâu dài lớn nhất, không ảnh hưởng người dùng đang nghiệm thu.

**Ưu tiên 2 — dọn cấu trúc:** GĐ 2 → GĐ 3.
Rủi ro cao nhưng nếu không làm thì mọi thay đổi sau đều đắt.

**Ưu tiên 3 — đổi hình có kiểm soát:** GĐ 4 → GĐ 5.
Chỉ nên bắt đầu **sau khi** nền móng xong, nếu không sẽ phải chỉnh lại hai lần.

**Khuyến nghị:** chạy GĐ 0 và GĐ 1 **trong lúc chờ người dùng nghiệm thu** 8 nhóm yêu cầu,
vì hai giai đoạn này **không đổi một điểm ảnh nào** trên giao diện.

---

## 8. Điều kiện bắt đầu

- [ ] Người dùng nghiệm thu xong 8 nhóm yêu cầu trên `http://127.0.0.1:9000`
- [ ] Người dùng duyệt kế hoạch này
- [ ] Chốt phạm vi GĐ 0 và GĐ 1 (được phép làm ngay hay chờ golive)
- [ ] Xác nhận cách commit: gộp hay tách theo từng giai đoạn

---

## 9. Ghi chú kỹ thuật rút ra từ đợt trước (áp dụng cho đợt này)

- Kiểm thử **phải** chạy bằng trình duyệt thật, **phải** có chiều tài khoản thiếu quyền.
  Lỗi `adminMaterials` ở `docs/21` mục 4 chỉ lộ ra khi thử bằng tài khoản chỉ có quyền xem.
- Khi probe báo hỏng, phải phân biệt **hỏng sản phẩm** hay **hỏng probe** trước khi sửa.
  Đã có ít nhất một lần probe sai và sản phẩm đúng.
- **Không** dùng `Get-Process node | Stop-Process -Force` — harness DSH chạy trên node.
- Tên trường bootstrap là hợp đồng: `departmentModulePermissions` (không phải
  `departmentPermissions`), `systemLevelCatalog` (không phải `systemLevels`), `teamMembers`.
- Bảng `users` **không có** cột `role_name` — phải JOIN `role_catalog`.
- Bảng `material_subcategories` **không có** mặc định cho `created_at`.
