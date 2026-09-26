# TASK-079 (`U-15` đợt 1 + `U-02`) — `DataTable` dùng thật: 0 → 13 bảng

**Trạng thái:** ✅ DONE — `tsc` **exit 0** · eslint **0 error · 74 warning** (= mốc nền) · `<DataTable>` **0 → 13** · bảng tự viết **100 → 87**
**Ngày:** 17/09/2026 · **Nhánh:** `unity`

---

## 1. Đã chuyển 13 bảng (2 lô, theo màn CÓ trong ảnh chuẩn để cổng ảnh chứng minh được)

| Lô | Màn | Số bảng |
|---|---|---|
| 1 | `WarehouseReceipt` · `Delivered` | 2 |
| 2 | `Dashboard` ×2 · `ProjectManagement` ×2 · `ProjectProgress` · `WorkCenter` ×2 · `TaskTable` · `TeamManagement` · `MaterialCatalogManager` · `Inventory` | 11 |

Mỗi bảng giữ **nguyên văn tiêu đề cột, nội dung ô, `emptyText`**; ô nào dùng **biến chỉ số của `.map`** thì `render` nhận chỉ số.

## 2. Mở rộng component dùng chung (tương thích ngược)

`DataTable` — `Column.render`: `(row) => ReactNode` → **`(row, index) => ReactNode`**, và lời gọi thành `c.render(row, i)`.
Cần cho cột **STT** (`{i + 1}`) — cùng cách đã mở `ListToolbar.title/note` ở TASK-078.

## 3. 🔴 BA LỖI CỦA CHÍNH TÔI trong đợt này (ghi lại để không lặp)

| # | Lỗi | Cách bắt được | Cách sửa |
|---|---|---|---|
| 1 | Trích `key={…}` bằng `indexOf("}")` ⇒ **cắt sai template literal** `` `${a}-${b}` `` (gặp `}` của `${…}` trước) ⇒ sinh mã hỏng: `String(`${row.materialId)` | `tsc` **2 lỗi cú pháp** | **Cân ngoặc** khi trích biểu thức |
| 2 | Phép kiểm dùng `\bindex\b` trong khi **biến chỉ số thật tên `i`** ⇒ không thêm tham số ⇒ `Cannot find name 'i'` | `tsc` **2 lỗi tên** | Kiểm theo **đúng tên biến** của `.map` |
| 3 | **Dùng `Set-Content` của PowerShell** để sửa script ⇒ **tệp thành MOJIBAKE**, chuỗi `"Chưa có dữ liệu."` hỏng | Đọc lại tệp thấy `ChÆ°a cÃ³ dá»¯ liá»‡u` | Viết lại bằng **công cụ file** |

⇒ **Quy tắc #28 của dự án (không dùng `Set-Content` cho tệp có tiếng Việt) bị tôi vi phạm LẦN NỮA** — đã ghi lại.
**Cả 3 lần, `app/page.tsx` đều được HOÀN TÁC về commit sạch (`git checkout -- app/page.tsx`) rồi chạy lại bằng bộ chuyển đổi đã sửa** — không để lại mã hỏng trong lịch sử.

## 4. Quy trình đã dùng (đáng giữ)

```text
git checkout -- app/page.tsx          (về mốc sạch)
node converter --targets=… --write    (chỉ ghi khi MỌI khối khớp đúng 1 lần)
npm run typecheck                     (trọng tài cú pháp + kiểu)
npx eslint                            (0 error)
node tools/probe-ui-adoption.mjs      (đếm dùng THẬT: 0 → 13)
node tools/probe-roadmap-progress.mjs (tiến độ: 31 → 32/110)
```

## 5. Đo sau khi sửa

| Phép kiểm | Kết quả |
|---|---|
| `npm run typecheck` | **exit 0** |
| `npx eslint app/page.tsx` | **0 error · 74 warning** (= mốc nền) |
| `probe-ui-adoption.mjs` | `<DataTable>` **0 → 13 lần DANG DUNG** · bảng tự viết **100 → 87** · trạng thái rỗng tự viết **100 → 88** |
| `probe-roadmap-progress.mjs` | **DONE 32/110 = 29,1 %** · `PHASE 1` **9/17** |

## 6. Còn lại của `U-15` (đã xác định được lô kế tiếp)

Bộ chuyển đổi xử lý được **42 bảng phẳng** nữa (đã liệt kê được danh sách hàm ở lô "**--all**", gồm `Requests` · `Purchasing` · `CentralWarehouse` ×2 · `BoqControl` · `Payments` · `Reports` ×8 · khối HR/Pháp chế 9 bảng · `Admin` 5 bảng).
**Không chuyển được** (cần xử lý riêng): bảng có **`<Fragment>` gộp dòng** (nhóm + dòng con) và bảng dùng `colSpan` phức tạp.

## 7. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | 13 khối `<div className="table-wrap"><table>` → `<DataTable …/>` |
| `app/components/ui/DataTable.tsx` | `Column.render` nhận thêm `index`; gọi `c.render(row, i)` |
| `docs/25_TODO_ROADMAP.md` | `U-02` → **`DONE / AP-DUNG 13`** · `U-15` cập nhật số đo |
| `docs/agent-progress/MASTER_STATUS.md` | CURRENT TODO + dòng task |
