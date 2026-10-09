> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# 61 — GHI CHÚ PHÁT HÀNH BẢN `ALPHA TEST` (08/10/2026)

## 1. BẢN NÀY LÀ GÌ
Bản **alpha test** của VNTECH ERP: hệ thống **chạy được đầy đủ chuỗi nghiệp vụ**, đã qua
**cổng kiểm tự động** (xem §4), ⭐ **mời các bộ phận chuyên môn vào kiểm thử** theo
[`36_KIEM_THU_ALPHA_THEO_BO_PHAN_CHUYEN_MON.md`](36_KIEM_THU_ALPHA_THEO_BO_PHAN_CHUYEN_MON.md).
⚠️ **Chưa phải bản phát hành chính thức**: còn hạng mục tồn (xem §5) và dữ liệu là **dữ liệu mẫu**.

## 2. ĐIỂM VÀO NHANH

| Việc | Ở đâu |
|---|---|
| ⭐ Chỉ mục toàn bộ tài liệu | [`00_INDEX_TAI_LIEU_ALPHA_TEST.md`](00_INDEX_TAI_LIEU_ALPHA_TEST.md) |
| Người nhận bàn giao | [`31_TAI_LIEU_BAN_GIAO.md`](31_TAI_LIEU_BAN_GIAO.md) |
| Người dùng cuối | [`30_HUONG_DAN_NGUOI_DUNG.md`](30_HUONG_DAN_NGUOI_DUNG.md) |
| Nghiệp vụ / BA | [`33_MO_TA_CHUC_NANG_VA_HE_THONG.md`](33_MO_TA_CHUC_NANG_VA_HE_THONG.md) |
| Kỹ thuật / kiến trúc | [`32_TAI_LIEU_PHAN_TICH_HE_THONG.md`](32_TAI_LIEU_PHAN_TICH_HE_THONG.md) |
| Lập trình viên | [`34_TAI_LIEU_DEV.md`](34_TAI_LIEU_DEV.md) |
| ⭐ Kế hoạch kiểm thử alpha | [`36_KIEM_THU_ALPHA_THEO_BO_PHAN_CHUYEN_MON.md`](36_KIEM_THU_ALPHA_THEO_BO_PHAN_CHUYEN_MON.md) |

## 3. THAY ĐỔI LỚN KỂ TỪ BẢN TÀI LIỆU 01/10/2026

| # | Thay đổi | Ý nghĩa với người kiểm thử |
|---|---|---|
| 1 | ⭐ **Phân quyền uỷ nhiệm hoạt động thật** (`S-1` · `M-2` · `U-1`) | người **không phải** `role=admin` vẫn dùng được phần quản trị **theo quyền được cấp**, ⛔ không cần mượn tài khoản admin |
| 2 | ⭐ **U-1**: người uỷ nhiệm thấy dữ liệu **TRONG PHẠM VI** | ⚠️ **thấy ÍT hơn admin là ĐÚNG thiết kế**, ⛔ không phải lỗi |
| 3 | ~~Lỗi «bấm Lưu không lưu được phân quyền»~~ | ✅ đã vá (3 tầng RBAC) |
| 4 | **4 chức năng kho**: tạo · sửa · ngừng hoạt động · thêm nhân sự vào kho | ⚠️ ⛔ **không có chức năng «Xoá kho»** — dùng **«Ngừng hoạt động»** |
| 5 | **Giữ chỗ tồn kho** cho phiếu xuất đang xử lý | người khác ⛔ **không xuất quá** phần còn lại |
| 6 | **Hub Kho** gom nhóm + sửa lệch bố cục | 1 mục menu «KHO VẬT TƯ» ⇒ thẻ kho ⇒ chi tiết 5 tab |
| 7 | Lỗi hệ thống lặp mỗi 60 giây (worker email) | ✅ đã vá |

## 4. CỔNG KIỂM ĐÃ XANH (⭐ chạy lại được bất cứ lúc nào)

| Cổng | Lệnh | Kết quả ngày 08/10 |
|---|---|---|
| Hồi quy giao diện | `node scripts/regression-suite.mjs` | ✅ **955 test · 954 pass · 0 fail** |
| Kiểu TypeScript | `npx tsc --noEmit --incremental false` | ✅ **0 lỗi** |
| Test backend | `cd java-backend && mvn -B test` | ✅ **88/88** (0 failure · 0 error) |
| Bản chạy khớp bản build | `node tools/verify-ui-build-applied.mjs --port=8787` | ✅ `do-moi` · `van-tay bb706f1202490077` · **`byte 6/6`** |
| Phân quyền E2E | `node tools/probe-grant-1-perm-e2e.mjs` | ✅ **17/17 ĐẠT** |
| Migration sắp chạy | `node tools/check-migration-idempotency.mjs` | ✅ **38 tệp · 0 đang chờ** |

## 5. HẠNG MỤC CÒN TỒN & RỦI RO ĐÃ BIẾT (⭐ đọc trước khi ghi phiếu lỗi)

| # | Hạng mục | Trạng thái | ⚠️ Lưu ý cho người test |
|---|---|---|---|
| 1 | **Migration `V39` chưa idempotent** | ⏸ chờ chủ sở hữu xử lý | ⚠️ trên CSDL **đã có** cột `issue_id` thì migration này **làm chết backend** khi khởi động — đã gặp và khôi phục ngày 08/10; ⭐ chạy `check-migration-idempotency.mjs` trước khi deploy máy khác |
| 2 | **Phạm vi `U-1` chưa áp hết** | ⏸ mở | `userWarehouseScopes` · `engineRoleProfiles` · `adminSuppliers`/`adminPartners` **vẫn admin-only** ⇒ người uỷ nhiệm có thể thấy **trống** ở vài màn ⇒ ⚠️ **ghi phiếu là «thiếu dữ liệu», ⛔ không phải «lỗi»** |
| 3 | ⚠️ **Thao tác ghi quyền là GHI ĐÈ TOÀN PHẦN** | 🔴 quy tắc an toàn | `save_user_access` **xoá rồi ghi lại** toàn bộ phạm vi/quyền ⇒ ⛔ **chỉ test trên tài khoản thử**, ⛔ **KHÔNG dùng tài khoản thật** |
| 4 | ~~2 action TỔ ĐỘI bị nới quyền~~ | ✅ đã xử lý | cổng `TM-04` đã xanh |
| 5 | Dữ liệu | ⚠️ | là **dữ liệu mẫu/demo**, ⛔ không dùng cho quyết định thật |

## 6. QUY TẮC GHI PHIẾU LỖI (⭐ bắt buộc)
1. Ghi **bộ phận · màn hình · các bước · kết quả mong đợi · kết quả thực tế**.
2. ⭐ **Kèm SỐ ĐO ĐƯỢC** (số dòng bảng · trạng thái nút · mã lỗi HTTP) — ⛔ không ghi «hình như lỗi».
3. ⚠️ **Đối chiếu §5 trước**: nhiều hiện tượng **là thiết kế** (vd «thấy ít tài khoản hơn admin») ⇒ ⛔ không phải lỗi.
4. ⚠️ Nếu kết quả **vô lý** (số 0, danh sách trống bất thường): ⭐ nghi **phép đo/điều kiện test** trước, rồi mới kết luận sản phẩm.

## 7. LIÊN KẾT TRẠNG THÁI
- Sổ đăng ký phiên & ghim điều phối: [`dsh-state/SESSION_REGISTRY.md`](dsh-state/SESSION_REGISTRY.md)
- Trạng thái master task 110 mục: [`agent-progress/MASTER_STATUS.md`](agent-progress/MASTER_STATUS.md)
- Nhật ký lỗi & hotfix của phiên 01: `dsh-mutil-session/SESSION_A/BUG_HOTFIX_LOG.md`
