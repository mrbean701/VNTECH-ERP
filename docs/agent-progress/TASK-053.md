# TASK-053 — `constructionDailyLogs` THIẾU 2 CỘT ⇒ cột "Khối lượng" của Nhật ký thi công luôn 0

**Trạng thái:** **DONE — đã vá cùng lượt với TASK-050.** Commit **#85**.
**Ngày:** 17/09/2026 · **Lớp lỗi:** đường ĐỌC thiếu trường **ở mức CỘT** (biến thể mới của lần thứ 10)

---

## 1. Vì sao phát hiện được

Khi port `constructionDailyLogItems` (TASK-050) tôi đối chiếu **nguyên văn** truy vấn `constructionDailyLogs` hai phía và thấy Java **thiếu cột**, không chỉ thiếu khoá:

| Nguồn | Câu truy vấn |
|---|---|
| **JS** `scripts/system-route.mjs:658` | `… LEFT JOIN (SELECT log_id,COUNT(*) AS item_count,SUM(completed_qty) AS completed_qty FROM construction_daily_log_items GROUP BY log_id) x ON x.log_id=l.id …` + chọn `COALESCE(x.item_count,0) AS itemCount, COALESCE(x.completed_qty,0) AS completedQty` ⇒ **27 cột** |
| **Java** `BootstrapDataAdapter:1018` (trước khi vá) | **21 cột** — thiếu đúng **6**: `itemCount`, `completedQty`, `cancelledBy`, `cancelledAt`, `createdBy`, `createdByName` |

## 2. Hệ quả ĐO ĐƯỢC

`app/page.tsx:2548` (bảng Nhật ký thi công) đọc **cả hai** cột bị thiếu:
`<td>{l.itemCount||items.length}</td><td>{money(l.completedQty)}</td>`
⇒ cột **"Khối lượng"** luôn hiển thị **0**, và cột "Hạng mục" trước đây rơi vào `items.length` (cũng 0, vì `constructionDailyLogItems` chưa được port — đã sửa ở TASK-050).
Dữ liệu thật bị che: **1 nhật ký · 2 dòng công việc** (`completed_qty` 36 + 25 = **61**).

Bốn cột `cancelledBy`/`cancelledAt`/`createdBy`/`createdByName` **không** được UI đọc ở đâu (`grep` toàn `app/`) ⇒ **không** đưa vào phạm vi vá lần này (giữ diff nhỏ, có kiểm chứng); ghi lại để rà sau.

## 3. Cách vá

Thêm 2 cột + `LEFT JOIN` tổng hợp **nguyên trạng JS** vào truy vấn `constructionDailyLogs`.

## 4. Kiểm chứng (`tools/probe-task050-bootstrap.mjs`, mục 5)

* `[admin] constructionDailyLogs có đủ 2 cột itemCount/completedQty` — **ĐẠT**
* `[admin] 2 cột khớp MySQL theo từng dòng nhật ký` — **ĐẠT** (đối chiếu **theo từng dòng** với truy vấn MySQL độc lập, không chỉ đếm tổng)

Tổng probe: **87/87 ĐẠT**.
