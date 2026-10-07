# TASK-MT3-UI-12b — Mua hàng & Cung ứng: 10 tab (theo 4 QUYẾT ĐỊNH USER)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-12b |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | 🟡 **MỘT PHẦN** — ✅ đã làm 1/4 quyết định · ⛔ 2 quyết định cần cập nhật test cũ · ⛔ 1 chưa xác định màn |
| **Requirement** | MT3 §E: màn «Mua hàng & Cung ứng» gồm **10 tab** (PR & PO · Phiếu đề nghị mua hàng · Giao nhận công trường · Đơn hàng đã giao · Kế hoạch mua hàng & cung ứng · Đấu thầu · Hợp đồng · Danh mục nhà cung cấp · Giá & dữ liệu thương mại · Báo cáo) · «Loại bỏ menu trùng nhưng phải xác định rõ nội dung được chuyển vào tab nào» |

## Đã thực hiện theo 4 QUYẾT ĐỊNH USER (26/09/2026 — `docs/dsh/MT3_USER_DECISIONS.md`)
| # | Quyết định user | Trạng thái |
|---|---|---|
| 4 | «Giao nhận công trường» / «Kế hoạch giao hàng» → **cứ làm theo đề xuất** | ✅ **ĐÃ ĐỔI TÊN**: `menu-helpers.ts:83` `label: "Kế hoạch giao hàng"` → **«Giao nhận công trường»** (⛔ không tách 2 tab) |
| 1 | Kho: luân chuyển vật tư thuộc Cấp phát & hoàn trả | ✅ đã xong ở **P3-UI-10c** |
| 2 | Gộp 2 mục NCC thành 1 «Nhà cung cấp» | ⛔ **CHƯA LÀM** — xem Known issues #1 |
| 3 | «Xin giá vật tư» = **tab riêng** | ⛔ **CHƯA DỰNG** tab (chờ dựng cả cụm 10 tab) |

## Files changed (vòng này)
| Tệp | Thay đổi |
|---|---|
| `lib/menu-helpers.ts` | đổi nhãn mục `receiving` → **«Giao nhận công trường»** (+ chú thích quyết định user) |

## Frontend changes
Có (1 tệp sản phẩm, 1 nhãn + chú thích).

## Backend / Database / API / Permission / Workflow changes
⛔ **Không có** (chỉ đổi nhãn hiển thị; khoá module `receiving` **giữ nguyên** ⇒ ⛔ không ảnh hưởng quyền hay luồng).

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **616 tests · 615 pass · 0 fail · 1 skip** (⛔ không sửa test nào) |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-56D4F5649DD34F43` |

## Known issues (⛔ phần còn lại — có lý do rõ ràng, không làm mù)
1. ⛔ **Gộp 2 mục NCC (quyết định #2)**: xác định được màn chuẩn là **`dept_plan_suppliers`** (vì `supplierPartnerViewFor()` chỉ nhận khoá này; `supplier_catalog` là khoá **cũ**).
   - ⛔ **Chặn kỹ thuật đã xác minh**: `tests/p07-supplier-partner-split-probe.mjs:35` **ghim cứng** `label:"Danh mục Nhà cung cấp"` + `groupKey:"purchasing"` + `sortOrder:120` cho `supplier_catalog` (`menu-helpers.ts:89-92`).
   - ⇒ Muốn gộp đúng ý user **phải**: (a) gỡ mục menu `supplier_catalog`, (b) **cập nhật hợp đồng `p07`** cho khớp, (c) chạy lại đủ cổng. ⛔ **Không làm vội** vì đụng hợp đồng cũ.
2. ⛔ **Dựng cụm 10 tab** (kể cả tab riêng «Xin giá vật tư» — quyết định #3): cần màn **hub** cho nhóm `purchasing` (mẫu tham chiếu: `warehouse_hub` + `warehouse_hub` dùng `moduleKey: "central_warehouse"`), tức **thêm tab bar cấp nhóm** vào `app/page.tsx` + mảng tab ở `lib/menu-helpers.ts`.
3. ⛔ **Tab «Báo cáo» (MT3 §E)**: **chưa xác định màn báo cáo nào** của nhóm Mua hàng (có `kpiSummaryMenuItems`/`legacyReportsMenuKeys` nhưng chưa đối chiếu) ⇒ ⛔ **không tự chọn**; đã ghi ở biên bản quyết định.
4. ⛔ Xác minh bằng mắt (ảnh chuẩn) — **P3-UI-17**.

## Blockers
⛔ **Không có blocker cứng.** 3 việc ở Known issues là **công việc còn lại đã xác định rõ đường làm**, không phải bế tắc.

## Next task
**P3-UI-12c** — (a) gộp `supplier_catalog` vào `dept_plan_suppliers` + cập nhật `p07`; (b) dựng tab bar cấp nhóm `purchasing` (10 tab, gồm tab riêng «Xin giá vật tư»); (c) xác định màn «Báo cáo» của nhóm rồi mới thêm tab thứ 11 nếu user muốn.
