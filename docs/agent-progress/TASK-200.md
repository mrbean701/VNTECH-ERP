# TASK-200 — GO-LIVE ĐỢT 55: ĐƯỜNG THÀNH CÔNG `project_contract` — **5/5 ĐẠT** + ⭐ **KIỂM CHỐT CHẶN THEO CHIỀU ÂM**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Mở rộng **đường thành công** sang cặp `project_contract` («tạo được mà ⛔ chưa từng xoá được») |
| **Kết quả** | ✅ **5/5 ĐẠT · EXIT=0** · ⭐ **94 mảng bootstrap ⛔ không đổi** · ⭐ **MySQL: 0 rác, dự án về y trạng thái gốc, hợp đồng gốc CÒN NGUYÊN** |
| **Bao phủ đường thành công** | **88 → 91** (`save_project_contract` · `set_project_contract_status` · `delete_project_contract`) |
| **⭐ KỸ THUẬT MỚI** | ⭐⭐ **KIỂM CHỐT CHẶN THEO CHIỀU ÂM** — gọi `delete` với **chuỗi xác nhận SAI** ⇒ **chứng minh chốt chống xoá nhầm HOẠT ĐỘNG** |
| **⛔ LỖI CỦA TÔI** | **0** (⭐ nhờ **đọc TRỌN khối validate** — bài học TASK-199 được áp dụng) |
| **Sản phẩm** | `tools/e2e/go-live-thanh-cong-hop-dong.mjs` |

---

## ① ⭐ HỢP ĐỒNG ĐỌC **TRỌN** TỪ MÃ — ⛔ KHÔNG CHỈ CÁC DÒNG `payload.get`

⭐ **Bài học TASK-199 được áp dụng ngay**: ⭐ lần này tôi **in TRỌN 2 hàm** (35 dòng/hàm) thay vì chỉ lọc các dòng đọc tham số ✓

| Action | Chốt chặn (đọc trọn) |
|---|---|
| `save_project_contract` | ⛔ `contractNo`/`contractName` rỗng ⇒ 400 «Số hợp đồng và tên hợp đồng là bắt buộc.» · ⚠️ `parentContractId` ⛔ không thuộc dự án ⇒ 400 · ⭐ **TRẢ VỀ `contractId` TRONG PHẢN HỒI** |
| `set_project_contract_status` | ⛔ không tìm thấy ⇒ 400 · ⚠️ `requireProjectAccess` ⇒ «Không có quyền tại dự án này.» · ⚠️ **TẮT mà `contractStockResidual > 0`** ⇒ 400 «Hợp đồng còn tồn kế toán theo Contract; phải điều chuyển/hoàn trả hết trước khi ngừng áp dụng.» |
| `delete_project_contract` | **4 CHỐT**: ① ⛔ không tìm thấy ⇒ 400 · ② `requireProjectAccess` · ③ ⚠️⚠️ **CHUỖI XÁC NHẬN** `expected = "XOA " + contract_no` ⇒ ⛔ khác ⇒ 400 «Xác nhận chưa đúng. Hãy nhập “…”.» · ④ ⚠️ **`contractUsageCount > 0`** ⇒ 400 «Hợp đồng vẫn còn phụ lục/BOQ Version/giao dịch/lịch sử…» · ⭐ **tự chuyển hợp đồng mặc định** nếu xoá hợp đồng primary |

⭐ **VÀ controller**: `save_project_contract` lấy `projectId` **từ payload** + gọi `accessScopeService.requireProjectAccess(...)` ✓ · `set_status({contractId, active})` · `delete({contractId, confirmText})` ✓

⭐⭐ **CHI TIẾT THIẾT KẾ ĐÁNG KHEN**: ⭐ **`save` TRẢ VỀ `contractId`** ⇒ ⭐ **bài kiểm ⛔ KHÔNG cần dò bootstrap** ⇒ ⛔ **tránh hẳn được cái bẫy «quét mọi mảng»** (TASK-195) ✓

---

## ② ⭐⭐ KỸ THUẬT MỚI — KIỂM CHỐT CHẶN **THEO CHIỀU ÂM**

⭐ **Vòng 53 (TASK-199) tôi ⛔ KHÔNG kiểm được chiều âm**: ⭐ muốn thử chốt «bước hoạt động cuối cùng» thì phải có **đúng 1 bước hoạt động** ⇒ ⚠️ **quá rủi ro** ✓
⭐⭐ **Vòng này CÓ CƠ HỘI VÀ TÔI ĐÃ NẮM**: ⭐ `delete_project_contract` có chốt **chuỗi xác nhận** ⇒ ⭐ **gọi với chuỗi SAI là HOÀN TOÀN VÔ HẠI** ✓

```text
② delete với CONFIRMTEXT SAI ⇒ phải 400 «Xác nhận chưa đúng.»   ← ⭐⭐ DAT
```
⇒ ⭐⭐ **CHỐT CHỐNG XOÁ NHẦM ĐÃ ĐƯỢC CHỨNG MINH LÀ HOẠT ĐỘNG** — ⛔ **không chỉ «đọc thấy trong mã»** ✓✓✓
⭐⭐ **ĐÂY LÀ BƯỚC TIẾN VỀ ĐỘ TIN**: ⭐ từ «đọc mã thấy có chốt» ⇒ ⭐ **«chốt nổ đúng khi bị kích hoạt»** ✓

---

## ③ ✅ KẾT QUẢ — **5/5 ĐẠT · EXIT=0**

```text
[DAT] ① save_project_contract (TẠO THẬT)
[DAT] ② delete với CONFIRMTEXT SAI ⇒ phải 400 «Xác nhận chưa đúng.»   ← ⭐⭐ CHỐT CHỐNG XOÁ NHẦM HOẠT ĐỘNG
[DAT] ③ set_project_contract_status(active=false) — SỬA THẬT
[DAT] ④ delete_project_contract với CONFIRMTEXT ĐÚNG (XOÁ THẬT)
[DAT] ⑤ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy hợp đồng.»
dat 5/5 · that bai 0 · EXIT=0
```
⭐ **Bước ② dùng ĐÚNG công thức của mã** (`"XOA " + contract_no`) cho lần ④ và **chuỗi sai** cho lần ② ⇒ ⭐ **cả hai chiều đều được kiểm** ✓

### ✅ KIỂM HẬU QUẢ **HAI LỚP**
| Lớp | Kết quả |
|---|---|
| **Bootstrap** | ✅ **94 mảng ⛔ KHÔNG mảng nào đổi** ✓ |
| ⭐ **MySQL** (có thẩm quyền) | ✅ **`rac_e2e_con_lai = 0`** · ✅ **dự án E2E về đúng `1` hợp đồng · `1` mặc định** · ⭐ **hợp đồng gốc `PCON_94598137-…` CÒN NGUYÊN** (`is_primary=1`, `status=active`) ✓ |
| `chup-so-dong` | ✅ chỉ `audit_logs` +3 + `sessions` +1 ✓ |

⭐⭐ **GHI NHẬN QUAN TRỌNG**: ⭐ hợp đồng mới của tôi **⛔ KHÔNG phải primary** (vì dự án đã có `PCON_94598137`) ⇒ ⭐ **logic «tự chuyển hợp đồng mặc định» ⛔ không bị kích hoạt** ✓ — ⭐ **và hợp đồng gốc ⛔ không bị đụng** ✓ ⭐ **đó là hành vi ĐÚNG** ✓

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Vòng đời `project_contract` | ✅ **5/5 ĐẠT · EXIT=0** |
| Bao phủ **đường thành công** | **88 → 91** (40% → **41%**) |
| ⭐ **Chốt chặn kiểm theo CHIỀU ÂM** | ✅ **chuỗi xác nhận sai ⇒ 400** ⇒ ⭐ **chốt chống xoá nhầm HOẠT ĐỘNG** |
| Kiểm hậu quả | ✅ **2 lớp SẠCH** — 94 mảng ⛔ không đổi · MySQL **0 rác**, dự án về **y trạng thái gốc** |
| ⭐ Hợp đồng gốc | ✅ **CÒN NGUYÊN** (`is_primary=1`, `status=active`) |
| Bug sản phẩm mới | **0** |
| ⛔ Lỗi của tôi | **0** — ⭐ **nhờ đọc TRỌN khối validate** (bài học TASK-199 áp dụng ngay) |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **7 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑤ BÀI HỌC

1. ⭐⭐⭐ **BÀI HỌC TASK-199 ĐƯỢC ÁP DỤNG NGAY VÀ ĐÃ TRẢ LÃI: 0 LỖI.** ⭐ Vòng trước tôi **đoán vai trò** ⇒ 1 lỗi; ⭐ vòng này tôi **in TRỌN 2 hàm** ⇒ ⭐ **payload đúng ngay lần đầu** ✓ ⭐ **đọc trọn khối validate là việc rẻ nhất và lãi nhất** ✓
2. ⭐⭐⭐ **MỘT CHỐT CHẶN CHỈ ĐƯỢC COI LÀ «CÓ» KHI NÓ ĐÃ NỔ.** ⭐ Từ nay: ⭐ **tìm cách kiểm chốt chặn theo CHIỀU ÂM** — ⭐ **và chọn ca mà việc kiểm là VÔ HẠI** (⭐ như chuỗi xác nhận sai ở đây) ✓
3. ⭐⭐ **API TRẢ VỀ ID LÀ ĐIỀU TỐT CHO CẢ NGƯỜI DÙNG LẪN BÀI KIỂM.** ⭐ `save_project_contract` trả `contractId` ⇒ ⭐ **bài kiểm ⛔ không cần dò bootstrap** ⇒ ⛔ **tránh hẳn bẫy «quét mọi mảng»** ✓
4. ⭐⭐ **KIỂM «HỢP ĐỒNG GỐC CÒN NGUYÊN» LÀ PHÉP ĐO ĐÁNG LÀM.** ⭐ Không chỉ đếm rác — ⭐ **phải xác nhận dữ liệu THẬT của người dùng ⛔ không bị đụng** ✓
5. ⭐ **LOGIC «BỎ QUA» TIẾP TỤC ĐỨNG VỮNG** — ⭐ bài kiểm ⛔ không báo động giả dây chuyền ✓

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **152 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **7 bản vá** + **12→13 bài nghiệm thu** — ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 và BUG-014** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
3. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
4. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
5. ⭐ **Còn 4 cặp «tạo được mà chưa từng xoá được»**: `labor_contract` · `benefit_record` · `boq_item` · `workflow` ⚠️ (**cần dữ liệu nghiệp vụ**) ⇒ ⭐ **tôi có thể tiếp tục** ✓
6. **Commit theo NHÓM hay gộp?** · **dọn Transit** · **khoá ngoại**.
