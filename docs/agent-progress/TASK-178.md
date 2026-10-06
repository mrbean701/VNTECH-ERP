# TASK-178 — GO-LIVE ĐỢT 33: DỪNG ĐIỀU TRA ĐÚNG LÚC + ⭐ VÁ LỖ HỔNG TÀI LIỆU KHÔI PHỤC PHIÊN

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc 1** | Bác bỏ **giả thuyết thứ 5** bằng **truy vấn CHỈ ĐỌC** ⇒ ⭐ **DỪNG điều tra** (§12) |
| **Việc 2** | ⭐ **Phát hiện + vá lỗ hổng tài liệu**: `CURRENT_STATE.md` **lạc hậu ~25 vòng** |
| **Tệp sửa** | `docs/dsh-state/CURRENT_STATE.md` (**+117 dòng** + sửa phần đầu) — ⛔ ngoài `ROOT_DIRS` |
| **Vân tay** | ⛔ **không đổi** (`docs/` ngoài `ROOT_DIRS`) |

---

## ① BÁC BỎ GIẢ THUYẾT THỨ 5 (⛔ không cần chạy gì)

**Giả thuyết**: `assertDepartmentAllowsPermissions` **THROW 400** nếu **BẤT KỲ** module nào trong payload thiếu `can_view=1` của phòng ban ⇒ **toàn bộ `save_user_access` bị TỪ CHỐI** ⇒ quyền cũ giữ nguyên.

**PHÉP ĐO (chỉ đọc — an toàn):**
| Đơn vị | `can_view=1` | `can_view=0` | Tổng |
|---|---|---|---|
| Phòng Kế hoạch | 59 | **0** | 59 |
| Phòng Tài chính – Kế toán | 60 | **0** | 60 |
| Ban chỉ huy công trường | 60 | **0** | 60 |
| **Phòng Dự án** | **60** | **0** | 60 |
| Ban giám đốc | 59 | **0** | 59 |

⭐ Và: `e2e.to` có **0 module** nằm ngoài danh sách `can_view=1` của phòng ⇒ ⛔ **hàm kiểm ⛔ KHÔNG throw** ✓

⇒ ⛔ **GIẢ THUYẾT SAI** — giả thuyết **thứ 5** bị bác bỏ bằng đo lường ✓

---

## ② ⭐ DỪNG ĐIỀU TRA ĐÚNG LÚC (§12)

| Đã bác bỏ | Bởi |
|---|---|
| ① Backend ⛔ không lưu cờ | **1989** dòng `can_use=1` |
| ② `assertDepartmentAllowsPermissions` kẹp cờ | Đọc mã: chỉ đọc `can_view`, **throw** chứ ⛔ không kẹp |
| ③ Payload khai `department_default` ⇒ cờ bị bỏ | Đọc mã: backend **TỰ TÍNH**, ⛔ bỏ qua payload |
| ④ Xoá trắng quyền toàn hệ thống | E2E **726** dòng `can_use=1` ngang tài khoản thật **725** |
| ⑤ Hàm kiểm **throw 400** vì thiếu `can_view` | Mọi đơn vị đều `can_view=1` (**0** dòng `can_view=0`) |

⇒ ⭐ **5 giả thuyết bị bác bỏ** · ⛔ **phân tích tĩnh + truy vấn chỉ đọc ⛔ KHÔNG ĐỦ** ⇒ cách duy nhất còn lại là **1 phép thử GHI** — ⛔ **cần user cho phép** (là `save_user_access`, replace-all).
⭐⭐ **DỪNG Ở ĐÂY LÀ ĐÚNG** (§12 ⛔ không over-engineer): **ảnh hưởng = CHỈ tài khoản TEST** (đã đo: tài khoản thật **⛔ không bị ảnh hưởng**), ⛔ **không phải bug sản phẩm**.

---

## ③ ⭐⭐ PHÁT HIỆN LỖ HỔNG THẬT — TÀI LIỆU KHÔI PHỤC PHIÊN **LẠC HẬU ~25 VÒNG**

### Triệu chứng đo được
`docs/dsh-state/CURRENT_STATE.md` — tệp mà **GOAL §6/§16 bắt phiên mới phải đọc để khôi phục** — đang ghi:

| Trường | Tệp ghi | **SỰ THẬT** |
|---|---|---|
| Build | `VNTECH-FP-702F7531E63FB174` | **`VNTECH-FP-C1B45AAAF31BFCF2`** |
| Files chưa commit | **64** | **125 đường** |
| Nhánh | `unity-p2-full-20260920` | **`unity`** |
| Khối vòng GO-LIVE | chỉ tới **«VÒNG GO-LIVE 2→7»** | nay đã tới **vòng 33** |
| Nhắc `TASK-147` … `TASK-177` | ⛔ **KHÔNG nhắc task nào** | **31 tệp nhật ký** tồn tại |

⇒ ⛔⛔ **MỘT PHIÊN MỚI ĐỌC TỆP NÀY SẼ HIỂU SAI**: tưởng chưa có bản vá nào, tưởng build cũ, ⛔ **không biết 5 bản vá Java đang chờ triển khai**, ⛔ **không biết 4 bản vá CSS đã lên sóng**, ⛔ **không biết sự cố quyền đã được điều tra tới đâu** ⇒ ⭐ **sẽ ĐO LẠI từ đầu** — đúng thứ tôi vừa tốn **5 vòng** để làm.

### Đã vá
⭐ Thêm khối **«VÒNG GO-LIVE 8→32 (05/10/2026) — TỔNG HỢP ĐỂ PHIÊN SAU»** gồm **10 mục**:

| Mục | Nội dung |
|---|---|
| 1 | Commit/build — **số THẬT** + ⭐ trỏ tới `GO-LIVE-phan-nhom-commit.md` (56 đường phiên này / 58 đường phiên trước) |
| 2 | ⛔ **5 bản vá Java ĐÃ VIẾT + ĐÃ KIỂM nhưng CHƯA LÊN SÓNG** (bảng đầy đủ) + ⭐ **1 lệnh triển khai** + cảnh báo |
| 3 | ✅ **4 bản vá CSS ĐÃ LÊN `:8787`** — ⛔ chờ mắt người |
| 4 | ⭐ **BUG-20261005-007 đã khép** + **tiêu chí (A)/(B)** |
| 5 | ⛔ **Sự cố quyền tài khoản test** — số đo + **5 giả thuyết ĐÃ BÁC BỎ** (⛔ đừng thử lại) + cách duy nhất còn lại |
| 6 | **Cổng xanh** (mvn 156/156 · npm test EXIT=0 · vân tay · cổng UI 3/3) |
| 7 | **Giới hạn đã biết** (0 khoá ngoại · H2 dễ dãi hơn MySQL · 3 action ⛔ không test · `manage_contract_review` chết · ⛔ chưa có «thêm thành viên tổ đội») |
| 8 | **Quy trình bắt buộc sau khi sửa mã trong `ROOT_DIRS`** (8 bước) |
| 9 | ⛔ **12 việc chờ user quyết** |
| 10 | ⛔ **Bài học lớn nhất**: kết luận trước — đo sau; **thứ tự kiểm đúng**; **công cụ quá lỏng luôn nói «sạch»**; **cảnh báo khẩn cần bằng chứng cao hơn** |

⭐ Và sửa **phần đầu tệp** (3 dòng) để ⛔ **không còn số cũ gây hiểu nhầm**, kèm ghi chú rõ «dòng cũ đã lỗi thời».

### Kiểm chứng
| Phép đo | Kết quả |
|---|---|
| Số dòng | 1299 → **1416** |
| CRLF thuần | ✅ **True** (⛔ 0 dòng LF đơn) |
| Có vân tay MỚI | ✅ True |
| Số cũ | ⭐ chỉ còn **trong ghi chú «đã lỗi thời»**, ⛔ không còn ở dòng trạng thái |
| Vân tay nguồn | ✅ **không đổi** (`docs/` ngoài `ROOT_DIRS`) |

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Giả thuyết bác bỏ | **5** (tổng cả chuỗi điều tra) |
| Điều tra quyền | ⏸️ **DỪNG** — nguyên nhân **chưa xác định**, cần **1 phép thử GHI** (chờ user) |
| Lỗ hổng tài liệu phát hiện | **1** — `CURRENT_STATE.md` lạc hậu **~25 vòng** |
| Đã vá tài liệu | ✅ **+117 dòng** + sửa 3 dòng phần đầu · CRLF thuần |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-C1B45AAAF31BFCF2` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑤ BÀI HỌC

1. ⭐⭐ **TÀI LIỆU KHÔI PHỤC CŨNG LÀ MỘT SẢN PHẨM — VÀ NÓ CÓ THỂ HỎNG ÂM THẦM.** `CURRENT_STATE.md` ⛔ **không báo lỗi gì**, vẫn đọc được, vẫn «có vẻ đúng» — nhưng **lệch 25 vòng**. ⭐ **Một tài liệu khôi phục sai còn nguy hiểm hơn ⛔ không có tài liệu**: nó khiến phiên sau **tin vào số cũ** và **đo lại từ đầu**.
2. ⭐ **KIỂM TRA «TÀI LIỆU CÓ KHỚP SỰ THẬT KHÔNG» LÀ MỘT PHÉP ĐO, ⛔ KHÔNG PHẢI VIỆC CẢM TÍNH.** Tôi so **4 trường** (build · files · nhánh · khối vòng) với số **đo được** ⇒ lệch **cả 4** ⇒ ⭐ **kết luận có bằng chứng**, ⛔ không «chắc là cũ rồi».
3. ⭐⭐ **DỪNG ĐIỀU TRA CŨNG LÀ MỘT QUYẾT ĐỊNH KỸ THUẬT.** Sau **5 giả thuyết bị bác bỏ** và khi **phạm vi ảnh hưởng chỉ là tài khoản test**, ⭐ tiếp tục đào là **vi phạm §12** ⇒ ⭐ **ghi rõ «chưa xác định + cách duy nhất còn lại»** đúng hơn là **đoán thêm**.
4. ⭐ **LOẠI TRỪ CÓ GIÁ TRỊ LÂU DÀI — NẾU ĐƯỢC GHI LẠI.** Tôi ghi **5 giả thuyết đã bác bỏ** kèm **phép đo bác bỏ** vào `CURRENT_STATE.md` ⇒ ⭐ phiên sau ⛔ **không tốn 5 vòng nữa** để thử lại.
5. ⭐ **SỬA SỐ CŨ Ở NHIỀU CHỖ, ⛔ KHÔNG CHỈ THÊM KHỐI MỚI.** Thêm khối ở cuối mà để **phần đầu ghi số sai** thì người đọc **vẫn bị lừa** — nên tôi sửa **cả 3 dòng phần đầu** và **ghi rõ dòng cũ đã lỗi thời** ✓

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **125 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai`.
2. ⭐ **Xác nhận 4 bản vá CSS bằng mắt** (`modal-head` · `receiving-kpi-button` · `requests-shortage-card` · `page-collapse`).
3. ⭐ **Cho phép 1 phép thử GHI** để tìm nguyên nhân `can_use=0` — hoặc **cho chạy lại `tools/e2e/cap-quyen-chuc-nang.mjs`**.
4. **Commit theo NHÓM hay gộp?**
5. **`stack-form`** · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **CRUD 6 thực thể** · **khoá ngoại**.
