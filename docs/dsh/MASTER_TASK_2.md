# MASTER TASK 2 — VNTECH ERP
## FUNCTIONAL ENHANCEMENT, UI/UX, WORKFLOW, RBAC & SYSTEM INTEGRATION

> **Document Type:** Master Task / Functional Specification (nguồn sự thật chức năng)
> **Execution Mode:** AUTONOMOUS CONTINUOUS EXECUTION
> **Agent:** DSH · **Status:** EXECUTION REQUIRED
> **Nguồn gốc:** người dùng giao 21/09/2026 (bản gốc `master task 2.md` trong workspace)

---

# 0. EXECUTION DIRECTIVE

MASTER TASK 2 là **nguồn yêu cầu chức năng chính** của phạm vi hiện tại. Không sửa UI rời rạc.

Mục tiêu: ① audit hệ thống ② đối chiếu code với yêu cầu ③ **tái sử dụng** logic/component/API/DB/workflow nếu phù hợp ④ bổ sung phần thiếu ⑤ **không duplicate logic** ⑥ **không phá chức năng hiện có** ⑦ đảm bảo FE/BE/API/DB/RBAC/workflow đồng bộ ⑧ sau mỗi task phải test + cập nhật trạng thái ⑨ tự chuyển task tiếp ⑩ **không dừng chỉ vì một task/module xong**.

---

# 1. MUST IMPLEMENT

Công việc · Trung tâm phê duyệt · Quản lý dự án · Mua hàng & cung ứng · Kho vật tư · Tổ đội · Hành chính-Pháp chế · Báo cáo · Danh mục vật tư gốc · Quản trị hệ thống · **Notification Web** · **Notification Email** · **RBAC** · **Workflow** · CRUD/Search/Sort/Filter nơi được yêu cầu · Modal/detail view · Audit/history · Tài liệu Master Task + task history.

# 2. TEMPORARILY SKIP *(chưa có mô tả nghiệp vụ)*

MEP · Đối tác · Tài chính-Kế toán · phần thi công trong Quản lý dự án · Sản lượng · Thu hồi vốn · So sánh/Đối chiếu BOQ · Soát trùng Alias & chất lượng danh mục · **Logic đánh giá tiến độ dự án**.

> Các phần này chỉ bỏ qua **logic nghiệp vụ** — ⛔ **KHÔNG tự suy diễn, KHÔNG tự tạo nghiệp vụ mới**.

---

# 3. CÔNG VIỆC

## 3.1. Dashboard
Click menu **Công việc** ⇒ hiển thị **Dashboard ngay**; đưa Dashboard lên **đầu menu** nếu vẫn giữ menu; **hoặc bỏ menu item Dashboard** nếu menu Công việc đã có đủ tab và dashboard hiển thị trực tiếp. ⛔ Không tạo menu item không cần thiết.

## 3.2. Giao việc & kiểm soát hoàn thành
Hiện giới hạn theo phòng ban + dự án ⇒ **mở rộng theo hierarchy/chức vụ**:

| Chức vụ | Được phép |
|---|---|
| **Trưởng phòng trở lên** | xem công việc của nhân viên **thuộc phòng ban mình** · xem trạng thái hoàn thành · xem tiến độ · giao việc trong phạm vi được phép |
| **Phó giám đốc trở lên** | xem công việc **toàn bộ phòng ban** · xem công việc **toàn bộ nhân viên công ty** · giao việc **toàn công ty** theo quyền |

**Logic giao việc dùng CÙNG mô hình phạm vi quyền.** ⛔ Không hard-code frontend. Backend phải kiểm: user · chức vụ · phòng ban · phạm vi · project scope · quyền giao việc. ⛔ Không cho frontend tự quyết định quyền.

---

# 4. TRUNG TÂM PHÊ DUYỆT

## 4.1. Dashboard approval cards
⛔ **Không** hiển thị card “phiếu đang chờ duyệt” cho user **không có quyền quản trị hệ thống** hoặc **không có chức vụ tương đương/cao hơn Trưởng phòng**. Kiểm permission/RBAC **ở backend**.
➕ **Phải có card “Chờ Giám đốc duyệt”** — lấy dữ liệu thực từ workflow/approval engine.

## 4.2. Danh sách phiếu chờ duyệt
```text
DANH SÁCH PHIẾU CHỜ DUYỆT → click → PHIẾU ĐANG XỬ LÝ → click "Chi tiết" → MODAL CHI TIẾT PHIẾU
```
Click một phiếu ⇒ **chuyển sang khu vực “Phiếu đang xử lý”** — ⛔ **không mở detail ngay**. Trong bảng Phiếu đang xử lý phải có **nút “Chi tiết”** ⇒ mở **modal**.

## 4.3. Approval timeline
⛔ Không hiển thị dạng cột dọc. Thiết kế **bắt buộc**:
```text
Bước 1        Bước 2        Bước 3        Bước 4
   o ------------ o ------------ o ------------ o
   |              |              |              |
 Nguyễn A       Trần B         Lê C           ...
 Phòng A        Phòng B        Phòng C        ...
 10:30          11:20          14:30
 Approved       Approved       Pending
```
- **Step đã hoàn thành**: tên người duyệt · phòng ban · thời gian duyệt · trạng thái · comment/reason nếu có.
- **Step hiện tại**: Pending/Đang chờ · người/phạm vi được yêu cầu duyệt nếu workflow cho phép hiển thị.
- ⛔ Không hiển thị thông tin người duyệt ở **step chưa tới**.

## 4.4. SLA quá hạn
Nếu SLA quá hạn ⇒ **VẪN CHO PHÉP DUYỆT**, nhưng **BẮT BUỘC nhập lý do quá hạn**.
⛔ Không cho submit khi `SLA expired + Reason empty` ⇒ **phải reject validation**.

**Tracking quá hạn** — hệ thống phải lưu: approval id · workflow step · due time · approved time · expired flag · overdue duration · overdue reason · approver · department. Phải tính được `total overdue approvals` + theo dõi số lượng · thời gian quá hạn · nguyên nhân.

## 4.5. Hồ sơ chi tiết — tài liệu đính kèm
Fix: **lỗi font** · **text overlap** · **input upload** · responsive. ⛔ Không để label và file selector chồng lên nhau. Phải kiểm trên **nhiều kích thước màn hình**.

## 4.6. Menu Trung tâm phê duyệt
Menu chỉ có 1 item ⇒ click “Trung tâm phê duyệt” ⇒ **mở trực tiếp màn hình**, ⛔ không lồng `Trung tâm phê duyệt → Trung tâm phê duyệt`.

---

# 5. QUẢN LÝ DỰ ÁN

## 5.1. Danh sách dự án
Hiện: label trái + **buttons xếp dọc bên phải** ⇒ sửa thành:
```text
DANH SÁCH DỰ ÁN
[Search] [Sort] [Filter] [Create] [...]
```
Nút **nằm ngang**. Responsive nhưng ⛔ không tạo layout lệch.

## 5.2. Project tabs
Các tab **Tổng quan · Nhân sự · Tổ đội · Kho · Ban chỉ huy** hiện **không hoạt động đầy đủ** ⇒ phải triển khai. Mỗi tab: ① hiển thị **danh sách dữ liệu tương ứng** ② có thông tin thực tế ③ click item ④ **mở modal detail tương ứng**.
```text
Nhân sự → User A → Modal "Chi tiết nhân sự"
```
⛔ Không chuyển sang màn hình không liên quan nếu chỉ cần xem detail.

## 5.3. Tiến độ dự án
Chưa có nghiệp vụ đánh giá ⇒ **chỉ triển khai phần hiển thị và nhập dữ liệu**: tạo công việc/nhiệm vụ · upload Excel tiến độ · **hệ thống tự tạo file Excel mẫu** để user download → điền → upload → import. Template phải phù hợp **schema hiện tại**.
⛔ **KHÔNG tự tạo logic đánh giá tiến độ** *(do Chỉ huy trưởng dự án + Trưởng phòng dự án quyết định — chưa có mô tả nghiệp vụ)*.

---

# 6. MUA HÀNG & CUNG ỨNG

## 6.1. Nhà cung cấp
Đưa menu NCC **xuống cuối nhóm menu** tương ứng. Đổi **“Danh mục nhà cung cấp dùng cho PO”** ⇒ **“Danh mục nhà cung cấp”**.

## 6.2. Supplier CRUD
Danh mục NCC phải có **Create · Read · Update · Delete · Search · Sort · Filter**.
**Create Supplier**: ⛔ không dùng side form ⇒ **mở modal riêng**, thông tin: Mã NCC · Tên NCC · Mã số thuế · Người liên hệ · Điện thoại · Email · Ghi chú · Trạng thái.

## 6.3. Supplier detail
Click NCC ⇒ **modal chi tiết** gồm: **Tab 1 Thông tin** · **Tab 2 PO** *(danh sách PO liên quan, click PO ⇒ modal chi tiết PO)* · **Tab 3 Danh sách vật tư** *(vật tư từng được đặt từ NCC — nguồn: PO → PO Items → Supplier Materials)*.

## 6.4. Supplier material auto-detection
```text
PO-001 đặt Dây LAN RJ45 CAT6e → NCC chưa có vật tư này → HỎI:
"Vật tư này chưa có trong danh mục vật tư của nhà cung cấp. Bạn có muốn thêm không?"
→ user đồng ý ⇒ thêm vào danh mục NCC
```
⛔ Không tự động thêm nếu nghiệp vụ yêu cầu xác nhận.

## 6.5. Đối tác ⇒ ⏸️ TẠM BỎ QUA *(chưa có mô tả nghiệp vụ)*

## 6.6. Phiếu đề nghị mua hàng (PR)
Buttons hiện **xếp dọc lệch phải** ⇒ sửa thành **nằm ngang ngay dưới label**:
```text
PHIẾU ĐỀ NGHỊ MUA HÀNG
[Create] [Search] [Sort] [Filter] [...]
```

## 6.7. Material shortage card
⛔ Không hiển thị dòng *“Vật tư đang thiếu tồn trong phạm vi”* ⇒ thay bằng **card dashboard**:
```text
┌──────────────────────────────┐
│ VẬT TƯ ĐANG THIẾU            │
│             XX               │
│       mã vật tư thiếu        │
└──────────────────────────────┘
```
Logic: kiểm tồn kho trên **toàn bộ các kho trong phạm vi hệ thống**. Click card ⇒ modal/danh sách vật tư thiếu: **Mã vật tư · Tên · Số lượng tồn · Tồn tối thiểu · Kho đang thiếu · Project/BOQ/Contract liên quan nếu có** + nút **“Lập phiếu đề nghị”**.
Khi tạo PR từ shortage: hệ thống **tự fill** material · quantity · warehouse · project · BOQ · contract · thông tin liên quan. User được phép chỉnh sửa trước khi submit nếu business rule cho phép.

## 6.8. Mua hàng & PO
Buttons xếp dọc ⇒ sửa thành **nằm ngang**:
```text
DANH SÁCH PHIẾU ĐỀ NGHỊ MUA (PR)
[Create] [Search] [Sort] [Filter] [...]
```

## 6.9. PR table
Hiện: **cột bước duyệt hiển thị sai** · **cột trạng thái bị trộn** · **trạng thái `issued` không phù hợp**.
Phải **audit enum/state hiện tại**. PR phải có: trạng thái PR · bước duyệt · thông tin workflow. ⛔ **Không trộn `PR status` với `Approval step`**. Nếu nghiệp vụ PR kết thúc tại `Completed` ⇒ **không tự thêm state `Issued` cho PR**.

## 6.10. Tách PR và PO
Tách thành **2 tab** `[ PR ]` `[ PO ]` — tab PR = bảng danh sách PR, tab PO = bảng danh sách PO. ⛔ Không gộp PR và PO vào cùng một bảng.

## 6.11. Giao nhận công trường
Dashboard cards: **Lịch giao hàng hôm nay · Trễ hẹn · Sắp đến hạn · Nhà cung cấp đang giao** ⇒ mỗi card phải có **modal/list detail** tương ứng. Nếu thiếu database/API/business field ⇒ ① audit schema ② đề xuất data model ③ bổ sung nếu cần ④ ⛔ **không tự tạo dữ liệu giả**.

## 6.12. Ghi nhận số lượng giao thực tế
⛔ Không dùng sideform ⇒ dùng **modal “Ghi nhận số lượng giao thực tế”** cho phép: nhập số lượng · **upload ảnh** · **upload NHIỀU ảnh** · upload hồ sơ/chứng từ liên quan.

## 6.13. Đơn hàng đã giao
Thêm **Search · Sort · Filter**. Đổi **“Xác nhận giao hàng thực tế”** ⇒ **“Chi tiết đơn giao hàng”** ⇒ click mở **modal** (⛔ không sideform). Fix toàn bộ lỗi text overlap · layout · ảnh · tài liệu.
Sau khi đơn hoàn thành và thủ kho đã nhận hàng ⇒ **vẫn cho phép bổ sung ảnh giao hàng và hồ sơ giao hàng** nếu nghiệp vụ cho phép. Ảnh hiển thị `Bảng ảnh → click → Full image viewer`. Hiển thị **lịch sử giao nhận**.
⛔ **Xoá các bảng lịch sử/ảnh/tài liệu đang hiển thị trực tiếp bên ngoài danh sách đơn hàng** ⇒ gom vào **modal chi tiết đơn giao hàng**.

---

# 7. KHO VẬT TƯ

## 7.1. Kho dashboard
Kho hiển thị dạng **card** `[Kho A] [Kho B] [Kho C]`. Chưa chọn kho ⇒ **dashboard tổng hợp**. Click kho ⇒ dashboard chuyển sang **dữ liệu của kho được chọn**.

## 7.2. Nhập / Xuất trong màn Kho
Có `[Nhập kho]` `[Xuất kho]` ⇒ click **mở modal tạo phiếu tương ứng**.

## 7.3. Nhập kho
```text
NHẬP KHO
[Create] [Search] [Sort] [Filter] [...]
```
**Nằm ngang**. Thêm **Sort · Filter**.

## 7.4. Tạo phiếu nhập
Cho phép **tạo phiếu nhập từ STO/phiếu xuất kho**: nếu phiếu liên quan đã có **kho đi/kho đến** ⇒ **tự động fill**; nếu chưa có ⇒ cho user nhập. Khi chọn đơn/phiếu liên quan ⇒ **hiển thị thông tin phiếu liên quan bên dưới**. Trong quá trình tạo phiếu: upload **ảnh giao hàng · chứng chỉ · hồ sơ liên quan**.

## 7.5. Xuất kho
Thêm **CRUD · Search · Sort · Filter**. Hiển thị danh sách **phiếu xuất · đơn xuất kho**.

## 7.6. Cấp phát — Hoàn trả *(MENU ITEM MỚI)*
```text
[ Cấp phát ] [ Hoàn trả ]
```
Mỗi tab hiển thị **danh sách riêng**. Thông tin cơ bản: **mã đơn · người tạo · tổ đội/người nhận · dự án · kho xuất · kho nhập (đối với hoàn trả)**.
⚠️ **Logic nghiệp vụ + workflow + quyền sẽ triển khai SAU khi business rule được xác định** ⇒ hiện tại **chỉ triển khai cấu trúc UI/list/tab/data foundation** phù hợp. ⛔ Không tự suy diễn nghiệp vụ.

---

# 8. TỔ ĐỘI
Chỉ hiển thị **danh sách tổ đội** + **Filter theo dự án**. ⛔ Không tự thêm nghiệp vụ ngoài phạm vi.

# 9. TÀI CHÍNH - KẾ TOÁN ⇒ ⏸️ TẠM BỎ QUA *(chưa chốt nghiệp vụ)*

---

# 10. HÀNH CHÍNH - PHÁP CHẾ

## 10.1. Hồ sơ nhân sự
⛔ **Không hiển thị filter chọn dự án**. Modal **“Hồ sơ nhân sự chi tiết”** có **3 tab**: `[Thông tin user]` *(tab đầu tiên)* · `[Thông tin cá nhân]` · `[Dự án đã và đang tham gia]`.

## 10.2. Bảo hiểm & chế độ
⛔ Không hiển thị **filter chọn dự án**.

## 10.3. Công văn đến / đi
Thêm **Tạo công văn**: Số công văn/giấy tờ · Hướng · Loại · Ngày · Ngày tạo · Người gửi · Người nhận · Trích yếu · Trạng thái · **Hình ảnh/tài liệu liên quan (upload nhiều ảnh)**. Danh sách công văn: thêm **nút Sửa** cho từng công văn.

## 10.4. Văn bản pháp lý
Logic và hiển thị **liên kết với Công văn đến/đi** — ⛔ không xây data flow độc lập nếu có thể tái sử dụng dữ liệu công văn.

---

# 11. BÁO CÁO
- **Báo cáo & cảnh báo**: ⛔ không chia menu theo phòng ban ⇒ hiển thị **thông tin tổng hợp**.
- **KPI & hiệu suất nhân viên**: ⛔ không chia menu theo phòng ban ⇒ hiển thị **thông tin tổng hợp**.

---

# 12. DANH MỤC VẬT TƯ GỐC

## 12.1. Fix lỗi danh sách vật tư
Tab danh sách vật tư **không hiển thị đúng thông tin danh sách vật tư và mã vật tư gốc** ⇒ phải audit **API · response · mapping · component · table columns · database relationship** và **fix ROOT CAUSE**. ⛔ Không chỉ hide lỗi frontend.

## 12.2. Tách tab
`[Danh sách vật tư]` · `[Danh mục nhóm con mã vật tư gốc]` · `[Mã vật tư gốc]` — mỗi tab hiển thị danh sách tương ứng.

## 12.3. ⏸️ Tạm bỏ qua: So sánh/Đối chiếu BOQ · Soát trùng Alias · Đánh giá chất lượng danh mục

---

# 13. QUẢN TRỊ HỆ THỐNG

## 13.1. Tab THÔNG BÁO
Thêm tab **Thông báo** — cấu hình thông báo cho user qua **Web hoặc Email**. Danh sách có **CRUD · Search · Sort · Filter**.

## 13.2. Create notification
Loại thông báo (**Web** / **Email**) · Tên · Mã · Nội dung · Người nhận · Thời gian gửi · **Thời gian kết thúc (đối với Web)**.
**Recipient** có thể: **user đơn · nhiều user · phòng ban · dự án · toàn bộ user** ⇒ thiết kế recipient targeting **đủ linh hoạt để mở rộng sau này**.

## 13.3. Tài khoản
- ⛔ **Bỏ trường “Hạn mức”** — không thay bằng trường khác nếu chưa có nghiệp vụ.
- Danh sách tài khoản phải hiển thị **Last Login · Created At** ⇒ **fix root cause** nếu hiện không hiển thị.
- Một số user **chưa có mã** ⇒ audit **identity model** ⇒ bổ sung **User ID** và đảm bảo **khớp với ID trong Hồ sơ nhân sự** ⇒ ⛔ **không tạo hai identity khác nhau cho cùng một user**.

## 13.4. Chữ ký user
Trong modal **tạo user** và **chỉnh sửa user** ⇒ thêm **Chữ ký**, cho phép upload **đúng 1 ảnh**. Nếu upload ảnh mới ⇒ **xoá/thay ảnh cũ** ⇒ lưu ảnh mới. ⛔ Không cho tồn tại nhiều chữ ký active cho cùng user nếu nghiệp vụ không yêu cầu.

---

# 14. WEB NOTIFICATION
```text
Login → Check notifications by userID → Check active period → Display system notification modal
```
Modal hiển thị: **nội dung · người tạo · thời gian phát hành** + nút **“Không nhắc lại hôm nay”**.
Phải lưu trạng thái theo **userID + notificationID** ⇒ ⛔ **không đánh dấu đọc global cho tất cả user**.

## 14.1. Read status
Mỗi notification có **“Đánh dấu đã đọc”** + **“Đánh dấu tất cả đã đọc”**. Trạng thái **theo user**.

---

# 15. EMAIL NOTIFICATION
Thiết kế notification engine cho các sự kiện liên quan user:
- **Approval**: tới lượt user duyệt · phiếu được duyệt · bị từ chối · bị trả lại · SLA sắp hết · SLA quá hạn.
- **Work**: được giao việc · sắp đến hạn · quá hạn · hoàn thành · bị thay đổi.
- **Procurement**: PR cần duyệt · PR được duyệt · PO liên quan · giao hàng · giao hàng trễ · GRN · thiếu vật tư.
- **Project**: được thêm vào project · project assignment · task assignment · project milestone.
- **Warehouse**: phiếu nhập · phiếu xuất · cấp phát · hoàn trả · tồn kho thấp.

DSH phải ① audit các module hiện có ② xác định **event thực tế** ③ **đề xuất thêm** event phù hợp ④ ⛔ **không tạo event không có nguồn dữ liệu**.

## 15.1. Kiến trúc notification
⛔ Không tạo logic notification **rải rác trong từng page**. Ưu tiên:
```text
Business Event → Notification Service → Notification Rule → Recipient Resolver → Web/Email → Notification Log → Read/Delivery Status
```
Mục tiêu: **mở rộng thêm event mà không phải sửa toàn bộ module**.

---

# 16. RBAC
Các chức năng liên quan quyền **phải kiểm tra backend**: Công việc · Giao việc · Trung tâm phê duyệt · Approval · Quản lý dự án · Nhà cung cấp · PR · PO · Kho · Notification · User · Admin.
⛔ Không dựa chỉ vào `hide button`. **Frontend chỉ là UI — BACKEND mới là enforcement layer.**

# 17. RESPONSIVE / UI CONSISTENCY
Chuẩn hoá: toolbar · button alignment · modal · table · card · tab · form · upload · typography · spacing · responsive.
⛔ Không tạo layout riêng nếu **component dùng chung đã tồn tại** ⇒ ưu tiên reusable component.

# 18. MODAL STANDARD
Detail view ưu tiên `List → Click item/action → Detail Modal`. ⛔ Không dùng sideform nếu yêu cầu đã chỉ rõ modal. Modal phải: responsive · không overflow · không text overlap · scroll đúng vùng · tabs nếu cần · **loading/error/empty state**.

# 19. DATA INTEGRITY
⛔ **Không tạo dữ liệu giả để UI trông hoàn chỉnh**. Nếu thiếu backend/data ⇒ ① xác định nguồn dữ liệu ② kiểm schema ③ bổ sung migration nếu cần ④ bổ sung API ⑤ bổ sung service ⑥ bổ sung frontend. ⛔ Không hard-code business data.

# 20. BACKWARD COMPATIBILITY
⛔ Không: drop table tuỳ tiện · reset database · delete toàn bộ data · phá API cũ · thay đổi schema không migration · xoá dữ liệu lịch sử. Mọi thay đổi DB phải: migration · backward-compatible nếu có thể · kiểm dữ liệu cũ · kiểm FK/reference.

# 21. TESTING
Mỗi task phải test mức phù hợp — **UI** (rendering/responsive/modal/tabs/table/search/sort/filter) · **API** (success/validation/permission/error) · **Database** (migration/relationship/integrity) · **Workflow** (state/permission/transition/history) · **Regression** (không làm hỏng chức năng hiện có). ⛔ Không test hình thức.

# 22. DOCUMENTATION
Sau mỗi task cập nhật nếu có thay đổi: `TASK-XXX.md` · `TASK_INDEX.md` · `MASTER_STATUS.md` · `TODO.md`. Nếu phát hiện **thay đổi kiến trúc** ⇒ cập nhật tài liệu architecture. Nếu **business rule chưa rõ** ⇒ ghi rõ vào documentation ⛔ thay vì tự suy diễn.

# 23. GIT POLICY
```text
COMMIT = FORBIDDEN
PUSH   = FORBIDDEN
```
Chỉ được: modify code · test · review diff · report. **Chỉ commit/push khi user yêu cầu trực tiếp.**

# 24. FINAL ACCEPTANCE
⛔ Không tuyên bố hoàn thành chỉ dựa trên `Build passed` / `Tests passed`. Phase chỉ hoàn thành khi đã kiểm: **UI · API · Database · RBAC · Workflow · CRUD · Search · Sort · Filter · Modal · Notification · Audit · Regression · Documentation · TODO · Task history**.

# 25. MASTER COMPLETION CONDITION
```text
CÔNG VIỆC → RBAC + GIAO VIỆC + DASHBOARD
TRUNG TÂM PHÊ DUYỆT → APPROVAL + TIMELINE + SLA + OVERDUE
QUẢN LÝ DỰ ÁN → PROJECT + MEMBERS + TEAMS + WAREHOUSE + COMMAND BOARD
MUA HÀNG → SUPPLIER → PR → APPROVAL → PO → DELIVERY → GRN → WAREHOUSE
QUẢN TRỊ → USER → RBAC → WORKFLOW → NOTIFICATION
REPORT → AGGREGATED DATA
```
Toàn bộ flow phải có: **Traceability · Data Integrity · RBAC · Workflow · Audit · Notification · Testing · Documentation**.

# 26. ABSOLUTE RULES
```text
CONTINUOUS_EXECUTION = TRUE      AUTO_CONTINUE = TRUE
TODO_TOOL = MANDATORY            TODO_IS_NOT_END_CONDITION = TRUE
MASTER_TASK_IS_END_CONDITION = TRUE
TELEGRAM_PROGRESS_REPORT = TRUE   AUDIT_BEFORE_CODE = TRUE
BACKEND_AUTHORIZATION = TRUE      NO_DESTRUCTIVE_DB_CHANGE = TRUE
NO_COMMIT = TRUE                  NO_PUSH = TRUE
NO_FAKE_DATA = TRUE               NO_UNAUTHORIZED_BUSINESS_INFERENCE = TRUE
REUSE_EXISTING_LOGIC = TRUE
```
