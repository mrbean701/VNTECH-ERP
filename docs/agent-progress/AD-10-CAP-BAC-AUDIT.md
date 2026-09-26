# AD-10 — AUDIT MÀN «CẤP BẬC» + SỬA UI TỐI THIỂU (KHÔNG THIẾT KẾ LẠI)

> Mục master task: `AD-10` — nguyên văn `docs/25_TODO_ROADMAP.md`: «Audit + sửa UI nếu cần +
> **kiểm thử kỹ** (không thiết kế lại)» (module «Cấp bậc», UI=FIX).

## 1. KẾT LUẬN

| # | Khẳng định | Kết luận | Bằng chứng |
|---|---|---|---|
| 1 | Màn «Cấp bậc hệ thống» hoạt động: bảng thang cấp bậc (Hạng · Mã · Tên · Tự động toàn quyền · Duyệt vượt cấp · Số tài khoản · Trạng thái) + 3 KPI + khối «Xếp cấp bậc cho tài khoản» | **CONFIRMED** | `app/page.tsx` khối `SystemLevelManager` (bảng + `Kpi` + `ListToolbar` gán cấp bậc) |
| 2 | **LỖI THẬT (đã sửa):** nút «Xóa» gọi action `delete_system_level` **KHÔNG có bước xác nhận** và **KHÔNG chặn cấp bậc đang được gán cho tài khoản** ⇒ một cú bấm làm mất cấp bậc đang dùng của nhiều người | **CONFIRMED** | Trước bản vá: `onClick={() => action("delete_system_level", { levelId: l.id })}` — không `window.confirm`, không `disabled` |
| 3 | Action xoá tồn tại ở CẢ 2 tầng (không phải bịa tên action) | **CONFIRMED** | `SystemController.java:415` `case "delete_system_level" -> {` · `ActionRbacRegistry.java:127` (`List.of()` = admin) + `:316` (`canUse`) |
| 4 | Cấp bậc `auto_grant_all` cấp toàn quyền tự động (không cần cấu hình từng chức năng) | **CONFIRMED** | `UserManagementUseCase.replaceDepartmentDefaults` — nhánh `autoAll` ⇒ `new Caps(1,1,1,1,1,1)` |
| 5 | Cấp bậc «duyệt vượt cấp» có hiệu lực ở tầng workflow | **LIKELY** | `system_level_catalog.can_skip_levels` được trả trong payload; UI ghi rõ hệ quả; chưa đo được một lượt duyệt vượt cấp thật trong dữ liệu hiện có |
| 6 | Số tài khoản «chưa xếp cấp bậc» trên dữ liệu sống | **UNKNOWN** | Phụ thuộc môi trường; UI đếm THẬT tại chỗ (`noLevel`), không hard-code |

## 2. BẢN VÁ ĐÃ ÁP DỤNG (tối thiểu, không thiết kế lại)

Trong `SystemLevelManager` (`app/page.tsx`):

```tsx
// AD-10 — PHÁT HIỆN THẬT khi audit: nút «Xóa» gọi thẳng API, không xác nhận và không chặn cấp bậc ĐANG DÙNG.
const canDeleteLevel = (level: Row) => usersOfLevel(String(level.code)).length === 0;
```

và nút xoá:

```tsx
<button className="export-mini danger" disabled={!canDeleteLevel(l)}
  title={canDeleteLevel(l) ? `Xóa cấp bậc ${l.name} (không có tài khoản nào đang giữ)` : `Không xóa được: … tài khoản đang giữ cấp bậc này — hãy xếp lại cấp bậc trước`}
  onClick={() => { if (!window.confirm(`Xóa cấp bậc «${l.name}»? Thao tác không khôi phục được.`)) return; void action("delete_system_level", { levelId: l.id }); }}>Xóa</button>
```

**Giữ nguyên** (không thiết kế lại): 3 chỉ số KPI gốc · cột bảng gốc · tiêu đề khối · luồng gán cấp bậc · action gốc.

## 3. KIỂM THỬ KỸ

`tests/ad10-system-level-audit.test.mjs` (4 ca):
1. nút xoá phải có `window.confirm` + `disabled` + dùng action ĐÃ CÓ (**đối chứng âm:** xoá `window.confirm` ⇒ cổng HỎNG);
2. không thiết kế lại — còn đủ 3 KPI + cột bảng gốc;
3. bằng chứng action ở cả 2 tầng Java;
4. tài liệu audit có verdict + bằng chứng (chính là tệp này).
