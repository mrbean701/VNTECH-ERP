# TASK-185 — GO-LIVE ĐỢT 40: **NGUỒN SỰ THẬT** LẠC HẬU ~42 TASK — ĐÃ BỔ SUNG

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ **Lần thứ BA** lặp phép kiểm «tài liệu ⇄ sự thật» — và **lần thứ ba tìm ra lỗi thật** |
| **Phát hiện** | ⛔ **`docs/agent-progress/MASTER_STATUS.md`** — tệp **tự khai là «NGUỒN SỰ THẬT»** — **lạc hậu ~42 task** |
| **Đã sửa** | ✅ **+88 dòng** (khối «TASK-147 → TASK-184 — VÒNG GO-LIVE 2→40») · CRLF thuần · 659 → **747 dòng** |
| **Vân tay** | ⛔ **không đổi** (`docs/` ngoài `ROOT_DIRS`) |

---

## ① ⛔ PHÁT HIỆN — TỆP **TỰ KHAI LÀ NGUỒN SỰ THẬT** MÀ LẠI LẠC HẬU NHẤT

`docs/agent-progress/MASTER_STATUS.md` — dòng 3 của chính nó ghi:
> *«Tệp này là **NGUỒN SỰ THẬT** về trạng thái toàn cục. Mọi phiên làm việc mới **PHẢI đọc tệp này trước**.»*

⭐ **Và `AGENTS.md` cũng trỏ vào nó**: *«`docs/agent-progress/MASTER_STATUS.md` — **nguồn sự thật trạng thái hiện tại**»* + *«Tiến độ master task: **DONE/tổng 110** — lấy số mới nhất **từ MASTER_STATUS** sau khi cập nhật»* ✓

### ĐO ĐƯỢC
| Phép đo | Giá trị |
|---|---|
| Sửa lúc | **05/10/2026 02:13** ⚠️ (**đầu phiên** — khoảng vòng 14) |
| Số dòng | **659** |
| Có nhắc `GO-LIVE`? | ✅ **Có** — nhưng chỉ **«TASK-146 — VÒNG GO-LIVE **1**»** |
| Có nhắc `TASK-142`? | ✅ Có |
| Có nhắc `TASK-178`? | ⛔ **KHÔNG** |
| Có nhắc `TASK-184`? | ⛔ **KHÔNG** |
| Có vân tay gần đây (`C1B45AA…` · `27251D9B…`)? | ⛔ **KHÔNG** |

⇒ ⛔⛔ **TỆP ĐƯỢC TUYÊN BỐ LÀ «NGUỒN SỰ THẬT» LẠI LÀ TỆP LẠC HẬU NHẤT** — ⛔ **chậm ~42 task** (`TASK-143` → `TASK-184`) ✓
⭐⭐ **HỆ QUẢ**: một phiên mới **đọc đúng tệp được chỉ định** sẽ ⛔ **không biết** có **5 bản vá Java đang chờ triển khai**, ⛔ **không biết 5 bản vá CSS đã lên sóng**, ⛔ **không biết sự cố quyền đã điều tra tới đâu** ⇒ ⭐ **sẽ ĐO LẠI từ đầu** ✓

---

## ② ✅ ĐÃ SỬA — BỔ SUNG KHỐI «TASK-147 → TASK-184 — VÒNG GO-LIVE 2→40» (**88 dòng**, 8 mục)

| # | Mục | Nội dung |
|---|---|---|
| 1 | **SỐ ĐO ĐƯỢC** | vân tay · 713 tệp · nhánh · ⭐ **HEAD = điểm lùi ĐÚNG `cae2815`** + cảnh báo **`82d7ea8` cách 8 commit** · 132 đường chưa commit · ⛔ không commit/push |
| 2 | ⛔ **5 BẢN VÁ JAVA** | bảng đầy đủ (BUG-003 · 005 · 008 · 20261010 · 20261011) + **1 lệnh triển khai** + mô tả công cụ **8 bước/6 chốt an toàn** + cảnh báo giờ triển khai |
| 3 | ✅ **5 BẢN VÁ CSS** | đã lên `:8787`, ⛔ chờ mắt người + ⭐ **TIÊU CHÍ ĐÚNG (A)/(B)** + **§11 tab đã đóng** (20/20) |
| 4 | ⛔ **SỰ CỐ QUYỀN** | điều **CHẮC CHẮN duy nhất** + **8 GIẢ THUYẾT ĐÃ BÁC BỎ kèm phép đo** (⛔ đừng thử lại) + cách duy nhất còn lại + **cam kết vận hành** |
| 5 | **CỔNG XANH** | `mvn` **156/156** · `npm test` **EXIT=0** · vân tay · cổng UI **3/3** · `:8787` 200 · `:18081` PID 3784 |
| 6 | **PHỦ TEST & GIỚI HẠN** | **90/92** action · 13 ca CSS · 12 action mới · **0 khoá ngoại** · **H2 dễ dãi hơn MySQL** · 3 action ⛔ không test · `manage_contract_review` chết |
| 7 | ⛔ **6 VIỆC CHỜ USER** | triển khai Java · xác nhận CSS · phép thử GHI · vai trò lập phiếu · commit theo nhóm · BUG-20261009 + kho đích + Transit + khoá ngoại |
| 8 | ⛔ **BÀI HỌC LỚN NHẤT** | **thứ tự kiểm đúng** + **5 lần kết luận sai** + **công cụ quá lỏng** + **cảnh báo khẩn cần bằng chứng cao hơn** + **trích xuất theo dòng** + **kiểm tài liệu ⇄ sự thật có lãi** |

**KIỂM CHỨNG**: 659 → **747 dòng** · **CRLF thuần = True** (⛔ 0 dòng LF đơn) · 9 chuỗi nội dung mới **đều có** (`TASK-147 → TASK-184` · vân tay mới · `cae2815` · `8 COMMIT` · `5 BẢN VÁ JAVA` · `5 BẢN VÁ CSS` · `§11` · `8 GIẢ THUYẾT` · `90/92`) ✓ · vân tay nguồn **không đổi** ✓

---

## ③ ⭐ LẦN THỨ BA PHÉP KIỂM NÀY TÌM RA LỖI THẬT — ĐÃ THÀNH «CÔNG CỤ»

| Lần | Vòng | Phát hiện |
|---|---|---|
| 1 | TASK-178 | `CURRENT_STATE.md` **lạc hậu ~25 vòng** (ghi build/files/nhánh sai) |
| 2 | TASK-184 | ⭐ **ĐIỂM LÙI SAI 8 COMMIT** (`82d7ea8` thay vì `cae2815`) — **vấn đề AN TOÀN** |
| **3** | **TASK-185 (vòng này)** | ⛔ **`MASTER_STATUS.md` — «NGUỒN SỰ THẬT» — lạc hậu ~42 task** |

⭐⭐ **3/3 LẦN ĐỀU TÌM RA VẤN ĐỀ THẬT** ⇒ ⭐ **đây ⛔ không còn là «kiểm cho chắc» mà là một CÔNG CỤ KIỂM CÓ LÃI CAO** ⇒ **nên đưa vào quy trình định kỳ** ✓

⭐ **Và nay tôi đã kiểm HẾT 4 tệp trạng thái mà GOAL §6/§16 chỉ định**:
| Tệp | Trạng thái |
|---|---|
| `CURRENT_STATE.md` | ✅ đã sửa (TASK-178 · 183 · 184) — **có khối «VÒNG GO-LIVE 8→32»** |
| `MASTER_STATUS.md` | ✅ **vừa sửa (TASK-185)** — **có khối «GO-LIVE 2→40»** |
| `CHECKLIST.md` | ✅ **6974 dòng** — cập nhật mỗi vòng |
| `testlog.md` | ✅ **580 dòng** — cập nhật mỗi vòng |

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Lỗ hổng tài liệu phát hiện | **1** — ⛔ **«nguồn sự thật» lạc hậu ~42 task** ⇒ ✅ **đã bổ sung 88 dòng** |
| Tổng số lần phép kiểm này tìm ra lỗi thật | ⭐ **3/3** |
| 4 tệp trạng thái theo GOAL §6/§16 | ✅ **cả 4 nay đã khớp sự thật** |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá Java chưa lên sóng** |

---

## ⑤ BÀI HỌC

1. ⭐⭐ **«NGUỒN SỰ THẬT» CŨNG CÓ THỂ LÀ TỆP LẠC HẬU NHẤT.** ⭐ **Tên gọi ⛔ không bảo đảm nội dung** — tệp **tự khai** là nguồn sự thật và **`AGENTS.md` cũng trỏ vào nó**, nhưng nó **chậm ~42 task** ✓ ⭐ **Điều nguy hiểm là phiên mới ĐỌC ĐÚNG TỆP ĐƯỢC CHỈ ĐỊNH rồi vẫn hiểu sai** ✓
2. ⭐⭐ **CÙNG MỘT PHÉP KIỂM, BA LẦN BA LỖI KHÁC NHAU** ⇒ ⭐ **một phép kiểm tìm ra lỗi 3/3 lần là CÔNG CỤ, ⛔ không phải may mắn** ⇒ **đưa vào quy trình định kỳ** ✓
3. ⭐ **KIỂM HẾT, ⛔ ĐỪNG KIỂM MỘT TỆP.** Tôi sửa `CURRENT_STATE` ở 3 vòng liên tiếp nhưng **⛔ chưa từng kiểm `MASTER_STATUS`** — ⭐ **kiểm một tệp rồi kết luận «tài liệu đã ổn» là kết luận vội** ✓ Nay **cả 4 tệp §6/§16 đã khớp** ✓
4. ⭐ **BỔ SUNG BẰNG KHỐI MỚI + SỐ ĐO THẬT, ⛔ KHÔNG viết lại tệp.** Giữ **lịch sử** (`TASK-146` vẫn còn) và **thêm** khối mới có ghi rõ **«mục trên đã CŨ»** ✓
5. ⭐⭐ **PHÉP KIỂM «TÀI LIỆU ⇄ SỰ THẬT» RẺ HƠN MỌI PHÉP KIỂM KHÁC.** Nó chỉ cần **vài truy vấn `git` + `read`** — ⭐ **rẻ hơn 5 vòng điều tra quyền**, và **3/3 lần đều có kết quả** ✓

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **132 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai`.
2. ⭐ **Xác nhận 5 bản vá CSS bằng mắt** (`modal-head` · `receiving-kpi-button` · `requests-shortage-card` · `page-collapse` · `stack-form`).
3. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền (câu hỏi **duy nhất** còn lại của chuỗi đó).
4. **`e2e.project` có đúng là vai trò lập phiếu đề nghị mua hàng không?**
5. **Commit theo NHÓM hay gộp?**
6. **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
