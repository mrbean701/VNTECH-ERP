# TASK-047 — `save_material` phần 2: alias theo `aliasText`, luật trùng tên, `audit(...)`, văn bản thông điệp

**Trạng thái:** **DONE** — probe **18/18 ĐẠT, exit 0** (bộ probe TASK-045 nay phủ luôn TASK-047)
**Nguồn:** known issue #43 (phần 2 chưa port) — rà theo MASTER TASK §47 (audit → implement)
**Ngày:** 17/09/2026 · **Commit:** #68

## 1. Đã port (nguyên trạng JS `system-route.mjs:2634-2643`)

| Hạng mục | JS | Java TRƯỚC | Đã sửa |
|---|---|---|---|
| **Rebuild alias** | `DELETE FROM material_aliases WHERE material_id=?` rồi INSERT lại từ `aliasText` (tách theo `[;\n]+`, bỏ rỗng, bỏ trùng chính tên gốc, bỏ trùng nhau — giữ bản đầu) | **không đọc `aliasText`** ⇒ sửa danh sách tên tương đương mà hệ thống không đổi gì; lại còn **tự tạo alias bằng chính tên gốc** khi tạo mã mới (JS không làm vậy) | thêm `deleteAliasesForMaterial` + dựng `LinkedHashMap<normalized, alias>` rồi ghi lại; **bỏ** alias tự-tạo |
| **Luật trùng TÊN GỐC** | `catalog.find(row => normalize(row.name)===canonicalNormalized)` hoặc alias của mã khác ⇒ 400 *"Tên gốc “{name}” đã thuộc hoặc tương đương mã {code}; hãy chọn đúng mã gốc thay vì tạo vật tư trùng."* | không có | port đủ, nguyên văn |
| **Luật trùng TÊN TƯƠNG ĐƯƠNG** | như trên cho từng alias ⇒ 400 *"Tên tương đương “{alias}” đang thuộc mã {code}; không được ghép hai vật tư khác thông số."* | không có | port đủ, nguyên văn; **kiểm TRƯỚC khi xoá alias** nên nhánh chặn không làm mất dữ liệu |
| **`audit(...)`** | `audit(user.id, materialId?"UPDATE":"CREATE", "material", targetId, before, {code,name,unit,categoryId,subcategoryId,aliases})` | **không gọi audit** (known issue #38) | `AuditLogPort` tiêm vào use case; `before` = JSON cả dòng vật tư, `after` = đúng 6 khoá JS |
| **Thông điệp** | `Đã lưu mã gốc {code} · {name} với {N} tên tương đương.` | `Đã cập nhật vật tư X.` / `Đã tạo vật tư X.` | trả **nguyên văn JS** |

**Tệp mới:** `application/support/MiniJson.java` — `JSON.stringify` viết tay (không kéo Jackson vào use-case), escape đúng `"` `\` `\n` `\r` `\t` và ký tự điều khiển.

## 2. LỖI PARITY do probe phát hiện: HAI bộ chuẩn hoá tên KHÁC NHAU

Phép kiểm `T047-I3` đầu tiên báo HỎNG: Java cho `cap cu 2x2.5` còn JS cho `cap cu 2x2 5`.
Nguyên nhân: `saveMaterial` cũ (và bản TASK-047 đầu tiên của tôi) dùng `MaterialMatcherV2.normalizeMaterialText`
— **giữ dấu chấm** — trong khi JS `normalizeMaterialName` kết thúc bằng `.replace(/[^a-z0-9]+/g," ")`
⇒ mọi ký tự không phải chữ-số thành **khoảng trắng**.
⇒ `normalized_name` của hai hệ **khác nhau** ⇒ alias nhập ở JS không khớp ở Java (và ngược lại).
**Đã sửa:** dùng `MaterialSystemCodes.normalizeMaterialName` (helper đã port nguyên trạng JS ở TASK-040 nhóm 3b) cho cả tên gốc lẫn từng alias. Probe xác nhận lại: `cap cu 2x2 5` ✓.

## 3. Kiểm chứng lúc chạy — **18/18 ĐẠT, exit 0**

jar **90.899.353 bytes** (17:53) · API PID hiện tại (job `pwsh-89`) · log **0 ERROR**

| Phép kiểm | Kết quả |
|---|---|
| `T047-I2` thông điệp | `Đã lưu mã gốc ZZP045-VT-002 · Vật tư probe TASK-045 với 2 tên tương đương.` ✓ |
| `T047-I3` alias | `[["Bê tông M300","be tong m300"],["Cáp Cu 2x2.5","cap cu 2x2 5"]]` — bỏ tên gốc, bỏ trùng chuẩn hoá ✓ |
| `T047-I4` audit | có dòng `audit_logs` `UPDATE` `entity_type='material'`, `after_json` hợp lệ chứa `aliases` ✓ |
| `T047-I5` chặn ghép trùng | 400 nguyên văn *"Tên tương đương “Gạch ống 4 lỗ” đang thuộc mã KHAC-VLXD-001…"*, **alias còn nguyên 2 dòng** ✓ |
| 14 phép kiểm TASK-045 | vẫn ĐẠT toàn bộ (không hồi quy) ✓ |
| Dọn dẹp | `materials`/`material_aliases`/`material_code_history` về đúng **14/19/14** ✓ |

## 4. LỖI CỦA CHÍNH TÔI trong lượt này (2 lỗi, đều về cách ghi tệp)

1. **Lại dùng `Set-Content` để sửa mã Java** ⇒ PowerShell ghi **UTF-8 kèm BOM** ⇒ build đứt:
   `illegal character: '\ufeff'` ở dòng 1 và hàng loạt `class, interface, enum, or record expected`.
   Đã sửa bằng **node** (`fs.writeFileSync(..., 'utf8')` — không BOM) và build lại sạch.
   **Bài học (đã ghi ở known issue #28/#40): TUYỆT ĐỐI không dùng `Set-Content` cho mã nguồn hay tài liệu — kể cả khi có `-Encoding utf8`.**
2. **Chạy `node -e` với đường dẫn đã bao gồm `java-backend/` trong khi `workdir` cũng là `java-backend`** ⇒ `ENOENT` giả, tưởng hỏng nặng. **Đường dẫn phải tính theo `workdir`.**
3. Probe báo HỎNG oan 3 phép kiểm mới vì `uiPayload()` mặc định dùng mã GỐC, trong khi phép kiểm G trước đó đã **đổi mã** ⇒ bị luật "đổi mã phải có lý do" chặn. Phải lấy **mã hiện tại** của bản ghi.

## 5. Còn lại (đã đăng ký)
`merge_material_master`: JS **xoá** mã nguồn (`DELETE FROM materials`) còn Java chỉ `active=0` + đổi mã `<code>_X` ⇒ cần người dùng quyết định hành vi đúng (known issue #43).
