# TASK-031 — Cây dự án trong menu bị TẮT: chủ ý sản phẩm hay tắt nhầm?

**Trạng thái:** BLOCKED — **cần người dùng quyết định**
**Nguồn:** phát hiện ở lượt quét hồi quy của TASK-008 (test `mobile-menu-interaction` đỏ)
**Ngày:** 18/09/2026 · **Phân loại:** `CONFLICT`

---

## Objective

Xác định cây dự án (danh sách dự án + workspace từng dự án) trong nhóm menu **QUẢN LÝ DỰ ÁN**
(`site_command`) bị tắt là **chủ ý sản phẩm** hay **tính năng bị tắt nhầm rồi bỏ quên**, rồi xử lý tương ứng.

## Bằng chứng

`tests/mobile-menu-interaction.test.mjs:36` khẳng định:
```js
assert.match(mobile, /groupKey==="site_command" \? activeSiteProjects\.map/);
```

Mã hiện tại (`app/page.tsx`):
* dòng **664** (nav desktop) và dòng **678** (nav mobile) đều kiểm tra `groupKey==="__site_command_tree_disabled__"`
* sentinel này **không thể trùng** `groupKey` thật ⇒ nhánh `activeSiteProjects.map(...)` là **MÃ CHẾT**
* dòng **671** vẫn tính `activeSiteProjects=groupKey==="site_command"?data.projects.filter(...)` nhưng **không còn nơi dùng**

⇒ Cây dự án **bị tắt đồng thời ở CẢ HAI nav** (không phải lỗi riêng mobile).

## Truy nguồn ý đồ

| Bằng chứng | Giá trị |
|---|---|
| Commit đưa sentinel vào | **`1c01f39`** (16/09/2026) |
| Thời điểm so với công việc RBAC | **TRƯỚC** toàn bộ TASK-021…030 của phiên hiện tại |
| Mô tả commit có nhắc việc tắt cây dự án? | **KHÔNG** — commit đó nói về GD0/GD1 + sửa 12 lỗi purchasing |
| Test có được cập nhật cùng lúc? | **KHÔNG** |

## Vì sao KHÔNG tự sửa

1. **Bật lại cây dự án là thay đổi hành vi người dùng** — thuộc quyết định nghiệp vụ (§3, §18).
2. Bằng chứng **hai chiều**: tên sentinel nói rõ "disabled" và **cả hai** nav cùng tắt (trông có chủ đích),
   NHƯNG thay đổi được đưa vào **âm thầm** trong một commit không liên quan và test không được cập nhật
   (trông như tắt tạm rồi bỏ quên). ⇒ `CONFLICT`, chưa đủ căn cứ.
3. **KHÔNG sửa test cho khớp mã** — làm vậy là "đóng băng" một trạng thái có thể là lỗi, và phá giá trị
   của chính phép kiểm.

## Câu hỏi cần người dùng trả lời

> Nhóm menu **QUẢN LÝ DỰ ÁN** trên thanh điều hướng (cả desktop và mobile) hiện **không hiển thị danh sách
> dự án và cây workspace của từng dự án** — nó chỉ hiện danh sách chức năng con.
> **Đây có phải là chủ ý không?**
> * **(A)** Đúng chủ ý — giữ nguyên, và **cập nhật test** `mobile-menu-interaction.test.mjs` để khẳng định đúng trạng thái hiện tại.
> * **(B)** Tắt nhầm — **bật lại** cây dự án ở cả hai nav (khôi phục điều kiện `groupKey==="site_command"`), test đang đỏ sẽ tự xanh.
> * **(C)** Chỉ muốn một nav có cây (desktop **hoặc** mobile) — nói rõ nav nào.

## Dependencies

* Chặn việc làm xanh `npm test` (cùng TASK-032). `test:workflow` chưa từng chạy vì `test:regression` đỏ.

## Limitations

* Chưa xác định được **lý do kỹ thuật** khiến ai đó tắt cây dự án (không có ghi chú trong commit, không có issue).

## Continuation Notes

* Đọc `TASK-008.md` phần 2 mục **F2a** để có toàn bộ ngữ cảnh.
* Khi có quyết định: sửa `app/page.tsx` (1 điều kiện × 2 nav) **hoặc** sửa test — **không làm cả hai**.
