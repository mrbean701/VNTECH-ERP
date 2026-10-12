# 📤 HANDOFF S4 → S1 (bắt buộc đọc) — chồng lấn phạm vi menu Công việc + BUILD ĐỎ

- **Từ:** `ERP-SESSION-04` (S4 — phụ trách **menu Công việc**: `app/screens/WorkCenter.tsx`, tab công việc, nhóm danh sách việc)
- **Đến:** **`ERP-SESSION-01` (S1 — phụ trách **phân quyền / menu quản trị hệ thống**)**
- **Ngày:** 08/10/2026 · **Trạng thái:** ⏳ **CHỜ S1 xử lý**
- **Bối cảnh do user chốt:** «*S1 và S4 đang làm cùng 1 nhóm chức năng công việc… s4 thì chuyên về menu công việc… hãy liên tục trao đổi với s1 về phạm vi công việc để tránh conflict.*»

---

## 1. 🚨 VIỆC CHẶN #1 — `tsc` ĐỎ (⛔ rebuild không chạy được cho MỌI phiên)

**Đo được:** `npm run typecheck` → `app/page.tsx(138,3) error TS2353: 'work_dashboard' does not exist in type 'Record<ModuleKey, [string, string]>'`

**Nguyên nhân:** `app/page.tsx` (sửa lúc **10-09 14:24:28**) có **8 khoá trong `titles` mà ⛔ CHƯA có trong `ModuleKey`** (`lib/ui-shared.tsx`):
`work_dashboard` · `work_list` · `work_assign` · `work_department` · `work_others` · `work_project` · `work_reports` · `code` · `duties`

**⚠️ Lưu ý kỹ thuật quan trọng (S4 đã THỬ và TỰ TRẢ NGUYÊN):** chỉ thêm **thành viên `ModuleKey`** là **⛔ KHÔNG ĐỦ** ⇒ sẽ lộ tiếp **`TS2739`** ở `app/page.tsx(125,7)`: vì `titles` được khai kiểu **`Record<ModuleKey, [string,string]>`** (bắt buộc **ĐỦ MỌI khoá**) ⇒ **phải làm ĐỒNG THỜI cả hai**: ① mở rộng `ModuleKey` ② bổ sung mục `titles` còn thiếu (hoặc đổi kiểu sang `Partial<Record<…>>` nếu muốn cho phép thiếu — ⚠️ nhưng phải kiểm nơi tiêu thụ).
⇒ S4 đã **trả `ModuleKey` về đúng bản gốc** để ⛔ không tạo conflict merge cho S1.

**CẦN S1:** hoàn tất cặp `ModuleKey` ↔ `titles` ⇒ `npm run typecheck` = **0 lỗi**.

## 2. ⚠️ CHỒNG LẤN PHẠM VI ĐÃ XẢY RA (cần thống nhất)

S4 đo được **`app/screens/WorkCenter.tsx` đã bị SỬA NGOÀI S4** (nội dung khác bản S4 để lại lúc 14:13:43): `PERSONAL_GROUPS` đã bị chuyển từ **3 nhóm → 2 nhóm** và `personalWorkGroups` thêm `assignedOut`.

**Đánh giá của S4:** ✅ **thay đổi ĐÚNG với quyết định của user** («*gộp lại thành 2 nhóm cho gọn*»: «Của tôi» = TOÀN BỘ việc của bản thân · «Đã giao» = việc tôi giao cho NGƯỜI KHÁC) ⇒ ⛔ S4 **không hoàn nguyên**.
**⚠️ Nhưng:** lần sau khi cần sửa `WorkCenter.tsx`, **xin báo S4 trước** (theo yêu cầu của user) — hoặc ghi 1 dòng vào file này, S4 sẽ đọc.
**🧹 Tồn dư nhỏ S4 ⛔ KHÔNG tự xoá (tránh chồng lấn thêm):** trong `personalWorkGroups` còn **biến `assigned` không còn dùng** (`const assigned = mine.filter(...)`) ⇒ nên xoá (có thể bị `lint` bắt).

## 3. ✅ S4 ĐÃ CẬP NHẬT HỢP ĐỒNG TEST CHO KHỚP 2 NHÓM (repo đã xanh lại)

| Tệp | Sửa gì | Kết quả |
|---|---|---|
| `tests/t05-personal-work.test.mjs` | 3 nhóm → **2 nhóm**: nhãn `["Của tôi","Đã giao"]` · khoá `["mine","assignedOut"]` · bộ lọc `assignedOut` = `assignedBy===tôi ∧ assignedTo!==tôi` · bộ đếm `[2,1]` / `[4,1]` / `[0,0]` / `[1,0]` · thêm khẳng định **A (tự tạo) ⛔ KHÔNG thuộc «Đã giao»** | ✅ **6/6 PASS** |
| `tests/t13-work-progress-cell.test.mjs` | case `D` mục ④: bỏ khẳng định «nhóm `assigned` phải còn» ⇒ thay bằng: «Của tôi» phải là **TOÀN BỘ** + có nhóm **`assignedOut`** + ⛔ **không được quay lại** nhóm `assigned` | ✅ **18/18 PASS** |
| `t01` / `t07` / `p5-01` | không đổi | ✅ 9/9 · 8/8 · 4/4 |
| **Hồi quy đầy đủ** (`npm run test:regression`) | — | ✅ **FAIL 0 · exit 0** |

## 4. 🧾 VIỆC CỦA S1 (theo phân công của user) — S4 ⛔ không làm thay

1. **Cặp `ModuleKey` ↔ `titles`** (mục 1) — ⚠️ đang chặn rebuild của mọi phiên.
2. Cơ chế **công tắc «việc của người khác»** (xem/sửa/duyệt) trên ma trận (B1 hay B2 do S1 quyết).
3. **Action + capability XOÁ công việc** (registry hiện **⛔ chưa có action xoá nào** cho công việc) ⇒ để S4 làm nút «Xoá» ở UI.
4. **Bản vá `project_admin`** cho `create/update/delete_project` — bản vá sẵn sàng: `docs/dsh-mutil-session/SESSION_D/probes/KE-HOACH-A3-CRUD-PROJECT.md` §8.
5. **1 lượt rebuild** sau khi `tsc` xanh ⇒ đưa **6 sửa FE** của S4 (bật Bình luận · ẩn tab «Được giao» · căn giữa 2 modal · khoá `work` ở tab · danh sách **11 phòng ban động** · dòng ma trận `project_admin`) tới người dùng. ⚠️ Đo được: `:8787` vẫn là bản **13:34** · `dist/` = **10-09 13:34:24**.

## 5. 🧭 HÀNG VIỆC CÒN LẠI CỦA S4 (⛔ không cần S1)

- **W2**: khối «**xem danh sách công việc của NGƯỜI KHÁC**» theo phạm vi (trưởng phòng → người **trong phòng mình**; giám đốc/admin → **mọi người**) — 🔴 **chưa có** (đo: 0 dòng khớp `viewAs|ownerUserId|Xem công việc của` trong `WorkCenter.tsx`).
- **W3**: nút **XOÁ** việc của bản thân (UI) — ⚠️ phụ thuộc mục 4.3 của S1.
- Dán **6 dòng nhật ký** `CHG-D25…D29` + `BUG-D26` (bản sẵn sàng: `SESSION_D/probes/NHAT-KY-SAN-SANG-DAN-v102-105.md`).

---
**⚠️ NGUYÊN TẮC S4 TỰ ÁP (sau 2 lần suy diễn sai):** ⛔ không suy diễn nghĩa nghiệp vụ khi đã có hợp đồng test · ⛔ không sửa vùng phiên khác khi họ đang mở · **luôn chạy `npm run typecheck` + `npm run test:regression` NGAY sau khi sửa** (chỉ kết luận FIXED khi FAIL 0) · ⛔ không dùng `node --test tests` (sai cú pháp).
