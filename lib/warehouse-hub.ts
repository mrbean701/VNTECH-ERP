// HUB «KHO VẬT TƯ» — KHỐI THUẦN (⛔ KHÔNG JSX, ⛔ KHÔNG import UI) ⇒ test trích ra chạy thật được.
//
// ⭐ YÊU CẦU USER (06/10/2026): click menu «Kho vật tư» ⇒ hiện NGAY dashboard tồn kho, trên đầu có
//    TABBAR 3 tab: `KHO` · `XUẤT & NHẬP` · `CẤP PHÁT & HOÀN TRẢ`.
//      · Tab KHO: cards TẤT CẢ kho — Tên · Mã · Dự án (nếu kho dự án) · Tồn kho hiện tại.
//        Kho DỰ ÁN chỉ hiện với user ĐƯỢC THÊM VÀO dự án đó.
//      · Tab XUẤT & NHẬP: subtabbar XUẤT / NHẬP — mặc định mở tab nào là theo QUYỀN user.
//      · Tab CẤP PHÁT & HOÀN TRẢ: logic tương tự.
//
// ⭐ QUYẾT ĐỊNH USER (chốt qua câu hỏi, 06/10/2026) — QUY TẮC NGOẠI LỆ:
//    «Xem tất cả + thao tác theo quyền module» ⇒ BAN GIÁM ĐỐC · ADMIN · IT **XEM ĐƯỢC MỌI KHO**
//    (kể cả kho dự án mình không thuộc), nhưng MỌI THAO TÁC vẫn gác theo quyền module như thường.
//    ⇒ Ở tệp này: `canSeeAllWarehouses()` chỉ quyết định **PHẠM VI XEM**;
//      ⛔ KHÔNG cấp thêm quyền ghi/xuất/nhập — việc đó vẫn do `modulePermission()` quyết định.
//
// NGUỒN DỮ LIỆU (đã ĐO trên payload `GET /api/system` — ⛔ KHÔNG gọi API mới, ⛔ KHÔNG migration):
//   · `data.warehouses[]` : id · code · name · type · projectId · parentWarehouseId   (system-route.mjs:665)
//   · `data.inventory[]`  : projectId · projectCode · warehouseId · warehouseCode · warehouseName · type ·
//                           materialId · materialCode · materialName · unit · minStock · balance · reserved · available
//   · `data.userScopes[]` : phạm vi DỰ ÁN của user (BootstrapDataAdapter lọc theo `user_project_scopes`)

import type { Row } from "@/lib/ui-shared";

// ---------------------------------------------------------------------------------------------
// 1. TABBAR CẤP 1 của hub — ⭐ nguyên văn 3 tab user yêu cầu (⛔ không tự đặt thêm/bớt).
// ---------------------------------------------------------------------------------------------
export const WAREHOUSE_HUB_TABS = ["KHO", "XUẤT & NHẬP", "CẤP PHÁT & HOÀN TRẢ"] as const;
export type WarehouseHubTab = (typeof WAREHOUSE_HUB_TABS)[number];

// Subtabs của tab «XUẤT & NHẬP» và tab «CẤP PHÁT & HOÀN TRẢ» (⭐ user: «logic tương tự»).
export const OUT_IN_SUBTABS = ["XUẤT", "NHẬP"] as const;
export const ALLOCATE_RETURN_SUBTABS = ["CẤP PHÁT", "HOÀN TRẢ"] as const;
export type OutInSubtab = (typeof OUT_IN_SUBTABS)[number];
export type AllocateReturnSubtab = (typeof ALLOCATE_RETURN_SUBTABS)[number];

// ---------------------------------------------------------------------------------------------
// 2. QUY TẮC NGOẠI LỆ — ai được XEM TẤT CẢ kho (⭐ quyết định user 06/10/2026).
//    ⚠️ CHỈ là phạm vi XEM. ⛔ KHÔNG phải cấp quyền thao tác (thao tác vẫn theo `modulePermission`).
// ---------------------------------------------------------------------------------------------
//
// «BAN GIÁM ĐỐC» = vai trò `director` (nhãn «Ban Lãnh đạo» — `lib/ui-shared.tsx:44`).
// «ADMIN» · «IT» = vai trò `admin` (IT dùng chung tài khoản quản trị hệ thống — ⛔ chưa có vai trò `it`
//   riêng trong `roleNames`, nên ⛔ KHÔNG bịa thêm vai trò mới; nếu sau này có `it` thì thêm vào mảng dưới).
export const SEE_ALL_WAREHOUSE_ROLES = ["director", "admin"] as const;

/** Vai trò gốc của user (khớp `roleBase()` trong `lib/permissions.ts` — ⛔ không nhân bản logic khác đi). */
export function hubRoleBase(user: Row | null | undefined): string {
  return String(user?.roleBase || user?.role || "");
}

/** ⭐ NGOẠI LỆ: BAN GIÁM ĐỐC · ADMIN · IT ⇒ xem được MỌI kho (kể cả kho dự án mình không thuộc). */
export function canSeeAllWarehouses(user: Row | null | undefined): boolean {
  return (SEE_ALL_WAREHOUSE_ROLES as readonly string[]).includes(hubRoleBase(user));
}

// ---------------------------------------------------------------------------------------------
// 3. TỒN KHO của MỘT kho — tính từ `inventory[]` (⭐ balance/reserved/available đã có sẵn trong payload).
//    ⛔ KHÔNG tự cộng trừ sổ kho ở đây: payload đã tính `balance = Σ stock_movements`
//    (`BootstrapDataAdapter` :651) ⇒ ⛔ cộng lại sẽ SAI (bài học «0 AS tong_ra viết cứng»).
// ---------------------------------------------------------------------------------------------
export type WarehouseTotals = {
  /** Số dòng vật tư có tồn trong kho (⛔ đếm theo khoá `warehouseId`, không theo tên). */
  materialCount: number;
  /** Σ `balance` — tồn thực tế. */
  balance: number;
  /** Σ `reserved` — đã giữ chỗ. */
  reserved: number;
  /** Σ `available` — khả dụng. */
  available: number;
  /** Số dòng có `balance` < `minStock` (≥ minStock>0) — «sắp hết» theo định mức tối thiểu. */
  belowMinCount: number;
};

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function emptyTotals(): WarehouseTotals {
  return { materialCount: 0, balance: 0, reserved: 0, available: 0, belowMinCount: 0 };
}

/** Tồn của 1 kho, tính trên các dòng `inventory` của ĐÚNG kho đó. */
export function totalsForWarehouse(inventory: Row[], warehouseId: unknown): WarehouseTotals {
  const id = String(warehouseId ?? "");
  if (!id) return emptyTotals();
  const rows = (inventory || []).filter((r) => String(r?.warehouseId ?? "") === id);
  return totalsFromRows(rows);
}

/** Tồn cộng gộp của NHIỀU kho (dùng cho thẻ tổng / phạm vi «TẤT CẢ»). */
export function totalsFromRows(rows: Row[]): WarehouseTotals {
  const out = emptyTotals();
  for (const r of rows || []) {
    if (!r) continue;
    out.materialCount += 1;
    out.balance += num(r.balance);
    out.reserved += num(r.reserved);
    out.available += num(r.available);
    const min = num(r.minStock);
    if (min > 0 && num(r.balance) < min) out.belowMinCount += 1;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// 4. CARD KHO — đúng 4 thông tin user yêu cầu: Tên kho · Mã kho · Dự án (nếu là kho dự án) · Tồn hiện tại.
// ---------------------------------------------------------------------------------------------
export type WarehouseCard = {
  id: string;
  code: string;
  name: string;
  /** `site` = kho dự án · `central`/khác = kho tổng (⭐ lấy nguyên văn `warehouses.type`). */
  type: string;
  /** ⭐ chỉ có giá trị khi là KHO DỰ ÁN (user: «dự án (nếu là kho dự án)»). */
  projectId: string;
  projectCode: string;
  projectName: string;
  isProjectWarehouse: boolean;
  totals: WarehouseTotals;
};

export function isProjectWarehouse(type: unknown): boolean {
  const t = String(type ?? "").toLowerCase();
  // ⚠️ ĐO ĐƯỢC: kho dự án mang `type = 'site'`; kho tổng là `central`/`main` (khuôn `warehouseScopeKind`).
  return t === "site" || t === "project";
}

/**
 * Dựng cards kho từ `warehouses[]` + `inventory[]` + tên dự án từ `projects[]`.
 * ⭐ THỨ TỰ: kho TỔNG trước, kho DỰ ÁN sau; trong mỗi nhóm sắp theo `code` (⛔ không theo id — id là UUID ngẫu nhiên).
 */
export function warehouseCards(
  warehouses: Row[],
  inventory: Row[],
  projects: Row[],
  warehouseIds?: readonly string[] | null,
): WarehouseCard[] {
  const projectName = new Map<string, string>();
  for (const p of projects || []) {
    if (p && p.id != null) projectName.set(String(p.id), String(p.name ?? ""));
  }
  const allow = warehouseIds && warehouseIds.length ? new Set(warehouseIds.map((v) => String(v))) : null;
  const cards: WarehouseCard[] = [];
  for (const w of warehouses || []) {
    if (!w || w.id == null) continue;
    const id = String(w.id);
    if (allow && !allow.has(id)) continue;
    const type = String(w.type ?? "");
    const projectId = String(w.projectId ?? "");
    const isProject = isProjectWarehouse(type) && Boolean(projectId);
    cards.push({
      id,
      code: String(w.code ?? ""),
      name: String(w.name ?? ""),
      type,
      projectId: isProject ? projectId : "",
      // ⭐ user: «dự án (nếu là kho dự án)» ⇒ kho tổng ⛔ KHÔNG gán dự án (kể cả khi DB có projectId thừa).
      projectCode: isProject ? String(w.projectCode ?? "") : "",
      projectName: isProject ? String(projectName.get(projectId) ?? "") : "",
      isProjectWarehouse: isProject,
      totals: totalsForWarehouse(inventory, id),
    });
  }
  return cards.sort((a, b) => {
    if (a.isProjectWarehouse !== b.isProjectWarehouse) return a.isProjectWarehouse ? 1 : -1;
    return String(a.code).localeCompare(String(b.code), "vi");
  });
}

// ---------------------------------------------------------------------------------------------
// 5. PHẠM VI XEM KHO — ⭐ trái tim của yêu cầu «kho dự án chỉ hiện với user thuộc dự án đó».
// ---------------------------------------------------------------------------------------------
/** Tập projectId mà user ĐƯỢC gán (nguồn: `userScopes[]` — đã lọc theo `user_project_scopes` ở backend). */
export function myProjectIds(userScopes: Row[]): string[] {
  const out: string[] = [];
  for (const s of userScopes || []) {
    const id = String(s?.projectId ?? "");
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

export type WarehouseVisibility = {
  /** Cards được PHÉP HIỆN. */
  visible: WarehouseCard[];
  /** Số kho bị ẩn vì ngoài phạm vi dự án (⭐ hiện lên UI để user biết ⛔ không phải mất dữ liệu). */
  hiddenByScope: number;
  /** `true` khi user thuộc nhóm ngoại lệ ⇒ đang thấy TẤT CẢ kho. */
  seeAll: boolean;
};

/**
 * Lọc cards theo phạm vi (§ yêu cầu user):
 *   · NGOẠI LỆ (`director`/`admin`) ⇒ thấy TẤT CẢ (⭐ quyết định user 06/10/2026).
 *   · Còn lại: kho TỔNG luôn thấy; kho DỰ ÁN chỉ thấy khi `projectId ∈ myProjectIds`.
 */
export function visibleWarehouseCards(
  cards: WarehouseCard[],
  user: Row | null | undefined,
  userScopes: Row[],
): WarehouseVisibility {
  const seeAll = canSeeAllWarehouses(user);
  if (seeAll) return { visible: cards.slice(), hiddenByScope: 0, seeAll: true };
  const mine = new Set(myProjectIds(userScopes));
  const visible = cards.filter((c) => !c.isProjectWarehouse || mine.has(c.projectId));
  return { visible, hiddenByScope: cards.length - visible.length, seeAll: false };
}

// ---------------------------------------------------------------------------------------------
// 6. SUBTAB MẶC ĐỊNH của «XUẤT & NHẬP» — ⭐ user: «hiển thị màn XUẤT trước hoặc NHẬP tùy thuộc user perm».
//    ⛔ KHÔNG hardcode admin; ⛔ KHÔNG tự suy diễn thêm điều kiện ngoài quyền `canView` của 2 module.
// ---------------------------------------------------------------------------------------------
export function defaultOutInSubtab(canViewIssue: boolean, canViewReceipt: boolean): OutInSubtab {
  if (canViewIssue) return "XUẤT"; // ⭐ ưu tiên XUẤT khi có quyền (user: «hiển thị màn XUẤT trước»)
  if (canViewReceipt) return "NHẬP";
  return "XUẤT"; // ⛔ không có quyền nào ⇒ vẫn hiện khung XUẤT (rỗng) để ⛔ không vỡ giao diện
}

/** Tương tự cho «CẤP PHÁT & HOÀN TRẢ» — cả hai đều nằm trên khoá `warehouse_issue` (khuôn MT2-P9-06). */
export function defaultAllocateReturnSubtab(canViewIssue: boolean, canViewStocktake: boolean): AllocateReturnSubtab {
  if (canViewIssue) return "CẤP PHÁT";
  if (canViewStocktake) return "HOÀN TRẢ";
  return "CẤP PHÁT";
}

// ---------------------------------------------------------------------------------------------
// 7. TAB CHI TIẾT KHO — ⭐ đúng 5 tab user yêu cầu (⛔ không tự thêm/bớt/đổi tên).
// ---------------------------------------------------------------------------------------------
export const WAREHOUSE_DETAIL_TABS = [
  "Dashboard kho",
  "Tồn kho",
  "Xuất - Nhập",
  "Cấp phát - Hoàn trả",
  "Nhân sự",
] as const;
export type WarehouseDetailTab = (typeof WAREHOUSE_DETAIL_TABS)[number];

/** Dòng `inventory` của MỘT kho (dùng cho tab «Tồn kho» của màn chi tiết). */
export function inventoryRowsOfWarehouse(inventory: Row[], warehouseId: unknown): Row[] {
  const id = String(warehouseId ?? "");
  if (!id) return [];
  return (inventory || []).filter((r) => String(r?.warehouseId ?? "") === id);
}

/** Phiếu XUẤT / NHẬP / CẤP PHÁT / HOÀN TRẢ có liên quan tới MỘT kho (dùng cho màn chi tiết kho). */
export function documentsOfWarehouse(
  rows: Row[],
  warehouseId: unknown,
  fields: readonly string[],
): Row[] {
  const id = String(warehouseId ?? "");
  if (!id) return [];
  return (rows || []).filter((r) => fields.some((f) => String(r?.[f] ?? "") === id));
}

// ---------------------------------------------------------------------------------------------
// ⭐⭐⭐ TASK-234 (08/10/2026) — QUY TẮC SINH **MÃ KHO** & **TÊN KHO** (⭐ USER CHỐT) ⭐⭐⭐
//   NGUỒN: `DEC-20261008-013` — trích NGUYÊN VĂN lời user:
//     • «*Mã kho sinh theo quy tắc : **KD-xxx** (xxx là số thứ tự **không được trùng với các kho khác**)*»
//     • «*Tên kho thì đặt theo quy tắc : **KHO xxx** (xxx là **tên dự án**)*»
//   ⚠️ 2 hàm này CHỈ SINH CHUỖI — ⛔ KHÔNG ghi CSDL (việc ghi thuộc backend — `HANDOFF-20261008-009`).
// ---------------------------------------------------------------------------------------------
/** Tiền tố mã kho theo quy tắc user chốt: «KD-xxx». */
export const WAREHOUSE_CODE_PREFIX = "KD-";

/**
 * ⭐ Sinh **MÃ KHO kế tiếp** theo quy tắc user chốt: `KD-xxx` — xxx = số thứ tự, **⛔ KHÔNG trùng**.
 *
 * ⚠️ DÙNG **max + 1** (⛔ không dùng «số nhỏ nhất còn trống») — LÝ DO: user yêu cầu
 *    «**không được trùng với các kho khác**»; nếu tái dùng số của kho đã **ngừng hoạt động**
 *    thì chứng từ cũ (đang tham chiếu mã đó) sẽ **trỏ nhầm sang kho mới** ⚠️.
 *    ⇒ Đếm **tăng đơn điệu** ⇒ mã cũ ⛔ không bao giờ bị dùng lại ✅.
 *
 * @param existingCodes mã của MỌI kho đã từng có (kể cả đã ẩn/ngừng) — nguồn: `warehouses[].code`
 */
export function nextWarehouseCode(existingCodes: readonly unknown[] | null | undefined): string {
  const re = new RegExp(`^${WAREHOUSE_CODE_PREFIX}(\\d+)$`, "i");
  let max = 0;
  for (const raw of existingCodes || []) {
    const m = re.exec(String(raw ?? "").trim());
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return WAREHOUSE_CODE_PREFIX + String(max + 1).padStart(3, "0");
}

/**
 * ⭐ Tên kho **DỰ ÁN** theo quy tắc user chốt: `KHO <tên dự án>`.
 * ⚠️ GHI ĐÈ 2 kiểu tên cũ đo được («*Kho dự án A06*» · «*Kho công trường PRJ-DEMO-01*») — user chốt lại.
 * ⛔ KHÔNG dùng cho KHO TỔNG (kho Tổng giữ tên riêng của nó).
 */
export function projectWarehouseName(projectName: unknown): string {
  const ten = String(projectName ?? "").trim();
  return ten ? `KHO ${ten}` : "KHO";
}

/**
 * ⭐⭐ KIỂM **MÃ KHO** khi TẠO MỚI hoặc **SỬA** (⭐ quy tắc user chốt `DEC-20261008-013`) ⭐⭐
 *
 * ⚠️ VÌ SAO CẦN: user chốt ② «*sửa kho: cho sửa… **có cho phép sửa mã kho***» ⇒ **mã kho ĐỔI ĐƯỢC**
 *    ⇒ khi sửa **phải kiểm lại** (⛔ không được để trùng kho khác) ⚠️ — nhưng **phải BỎ QUA chính nó**
 *    (nếu ⛔ không bỏ qua thì **sửa mà giữ nguyên mã** sẽ bị báo «trùng» SAI).
 *
 * @param newCode     mã người dùng nhập
 * @param existingCodes mã của MỌI kho khác (nguồn: `warehouses[].code`)
 * @param currentCode mã HIỆN TẠI của kho đang sửa (⛔ để trống khi TẠO MỚI) — sẽ được BỎ QUA khi đối chiếu
 * @returns `{ ok, code, errors }` — `code` là mã ĐÃ CHUẨN HOÁ (trim + IN HOA), `errors` rỗng nghĩa là hợp lệ
 */
export function validateWarehouseCode(
  newCode: unknown,
  existingCodes: readonly unknown[] | null | undefined,
  currentCode?: unknown,
): { ok: boolean; code: string; errors: string[] } {
  const code = String(newCode ?? "").trim().toUpperCase();
  const errors: string[] = [];
  const dangChuan = new RegExp(`^${WAREHOUSE_CODE_PREFIX}\\d+$`);

  if (!code) {
    errors.push("Mã kho là bắt buộc.");
  } else if (!dangChuan.test(code)) {
    errors.push(`Mã kho phải theo quy tắc ${WAREHOUSE_CODE_PREFIX}xxx (ví dụ ${WAREHOUSE_CODE_PREFIX}001).`);
  } else {
    const boQua = String(currentCode ?? "").trim().toUpperCase();
    for (const raw of existingCodes || []) {
      const other = String(raw ?? "").trim().toUpperCase();
      if (!other || other === boQua) continue; // bỏ qua chính nó khi SỬA
      if (other === code) {
        errors.push(`Mã kho ${code} đã được dùng cho kho khác.`);
        break;
      }
    }
  }
  return { ok: errors.length === 0, code, errors };
}

/**
 * ⭐⭐ KIỂM **TÊN KHO** (⭐ quy tắc user chốt: «*Tên kho thì đặt theo quy tắc : **KHO xxx** (xxx là tên dự án)*») ⭐⭐
 * ⚠️ Kho **DỰ ÁN** phải theo mẫu `KHO <tên dự án>` (⛔ không dùng mẫu này cho KHO TỔNG).
 */
export function validateProjectWarehouseName(
  newName: unknown,
  projectName: unknown,
): { ok: boolean; name: string; expected: string; errors: string[] } {
  const name = String(newName ?? "").trim();
  const expected = projectWarehouseName(projectName);
  const errors: string[] = [];
  if (!name) errors.push("Tên kho là bắt buộc.");
  else if (name !== expected) errors.push(`Tên kho dự án phải là «${expected}».`);
  return { ok: errors.length === 0, name, expected, errors };
}

// ---------------------------------------------------------------------------------------------
// ⭐⭐⭐ TASK-236 — QUY TẮC ④: «GIỮ CHỖ KHI PHIẾU ĐANG XỬ LÝ» (⭐ USER CHỐT) ⭐⭐⭐
//   NGUỒN: `DEC-20261008-013` — trích NGUYÊN VĂN lời user:
//     «khi phiếu ở trạng thái **hoàn thành** thì mới được **thay đổi tồn kho** trong kho đích và nguồn.
//      Trong thời gian **tạo phiếu hoặc chờ duyệt** thì số lượng vật tư trong phiếu đó ở trong
//      **trạng thái đang xử lý** (**không cho user khác thao tác vào những mã vật tư đó**),
//      ví dụ như **dây diện cadivi 1.5 tồn 100 - phiếu xuất 70 (đang xử lý)** thì những user khác
//      **không được thao tác xuất quá số lượng đang trạng thái bình thường**»
//   ⚠️ HẠ TẦNG ĐÃ CÓ: bảng `stock_reservations` + trường `reserved` + `available = balance − reserved`
//      (đo từ `BootstrapDataAdapter.java:303` · `WarehouseStockStoreAdapter.java:65`)
//      ⚠️ NHƯNG hiện chỉ gắn vào `request_id` (phiếu ĐỀ NGHỊ — `RequestStoreAdapter.java:426`)
//      ⇒ cần NỐI THÊM vào phiếu XUẤT/CẤP PHÁT — việc đó thuộc backend (`HANDOFF-20261008-009`).
//   ⇒ 2 hàm dưới đây là PHẦN LOGIC THUẦN của phiên 02: UI/kiểm tra dùng chung, ⛔ KHÔNG ghi CSDL.
// ---------------------------------------------------------------------------------------------

/**
 * ⭐ Số lượng **CÒN ĐƯỢC PHÉP XUẤT** = tồn thực tế − phần ĐANG GIỮ CHỖ (phiếu đang xử lý).
 * ⚠️ Đúng ví dụ user chốt: tồn **100** − đang xử lý **70** ⇒ còn **30**.
 * ⛔ KHÔNG BAO GIỜ trả số âm (dữ liệu lệch ⇒ kẹp về 0, ⛔ không cho xuất âm).
 */
export function availableToIssue(balance: unknown, reserved: unknown): number {
  const ton = Number(balance ?? 0);
  const giu = Number(reserved ?? 0);
  if (!Number.isFinite(ton)) return 0;
  const con = ton - (Number.isFinite(giu) ? giu : 0);
  return con > 0 ? con : 0;
}

/**
 * ⭐⭐ KIỂM SỐ LƯỢNG XUẤT/CẤP PHÁT — ⛔ chặn xuất quá phần «đang bình thường» (quy tắc ④) ⭐⭐
 *
 * @param want    số lượng muốn xuất
 * @param balance tồn THỰC TẾ trong kho nguồn
 * @param reserved phần ĐANG GIỮ CHỖ cho các phiếu đang tạo/chờ duyệt (⛔ chưa trừ tồn)
 * @returns `{ ok, available, errors }` — `available` = số còn được phép xuất
 */
export function validateIssueQuantity(
  want: unknown,
  balance: unknown,
  reserved: unknown,
): { ok: boolean; available: number; errors: string[] } {
  const soLuong = Number(want ?? 0);
  const available = availableToIssue(balance, reserved);
  const errors: string[] = [];
  if (!Number.isFinite(soLuong) || soLuong <= 0) {
    errors.push("Số lượng xuất phải lớn hơn 0.");
  } else if (soLuong > available) {
    errors.push(
      `Chỉ còn ${available} được phép xuất (tồn ${Number(balance ?? 0)} trừ ${Number(reserved ?? 0)} đang xử lý).`,
    );
  }
  return { ok: errors.length === 0, available, errors };
}

/**
 * ⭐ Trạng thái của một phiếu cấp phát/xuất — quy tắc ④: **CHỈ `hoàn thành` mới đổi tồn kho**.
 * ⛔ Khi ở `tạo phiếu`/`chờ duyệt` ⇒ số lượng phải vào trạng thái **ĐANG XỬ LÝ** (giữ chỗ), ⛔ KHÔNG trừ tồn.
 */
export const ISSUE_DONE_STATUS = "completed";

/** ⭐ Phiếu ở trạng thái này thì số lượng được coi là **ĐANG XỬ LÝ** (giữ chỗ, ⛔ chưa trừ tồn). */
export const ISSUE_PENDING_STATUSES: readonly string[] = ["draft", "pending_approval"];

/**
 * ⭐ Quy tắc ④: phiếu có được phép **THAY ĐỔI TỒN KHO** không?
 * ⛔ CHỈ khi `hoàn thành` — mọi trạng thái khác (tạo/chờ duyệt) chỉ ĐANG XỬ LÝ.
 */
export function canChangeStockOnIssue(status: unknown): boolean {
  return String(status ?? "").trim().toLowerCase() === ISSUE_DONE_STATUS;
}

/** ⭐ Số lượng của phiếu này có đang **ĐANG XỬ LÝ** (giữ chỗ) không? */
export function isIssueHoldingStock(status: unknown): boolean {
  return ISSUE_PENDING_STATUSES.includes(String(status ?? "").trim().toLowerCase());
}

// ---------------------------------------------------------------------------------------------
// ⭐⭐⭐ TASK-237 — QUY TẮC ③ (PHẦN CÒN LẠI): «DỰ ÁN NGỪNG ⇒ HỎI USER CÓ NGỪNG KHO KHÔNG» ⭐⭐⭐
//   NGUỒN: `DEC-20261008-013` — trích NGUYÊN VĂN lời user:
//     «Xóa kho: **không cho phép** nhưng cho phép **ẩn kho** hoặc **set trạng thái ngừng hoạt động**.
//      Logic **kho ngừng hoạt động cũng sẽ phải liên kết đến dự án** (nếu là kho dự án),
//      khi **dự án ngừng hoạt động** thì sẽ **hỏi user có ngừng kho dự án "  " hay không**,
//      nếu chọn **không** thì **kệ** còn chọn **có** thì **ngừng**»
//   ⚠️ 2 hành động THAY THẾ cho xoá: **ẨN kho** · **NGỪNG HOẠT ĐỘNG** (set `active = 0`).
//   ⚠️ Kho TỔNG ⛔ KHÔNG gắn dự án ⇒ ⛔ KHÔNG áp logic này.
// ---------------------------------------------------------------------------------------------

/** ⭐ 2 hành động THAY THẾ cho «xoá kho» — quy tắc ③ user chốt: ⛔ TUYỆT ĐỐI KHÔNG xoá. */
export const WAREHOUSE_DEACTIVATE_ACTIONS: readonly string[] = ["hide", "deactivate"];

/** ⭐ Có được phép XOÁ kho không? ⛔ KHÔNG — user chốt «Xóa kho: **không cho phép**». */
export const ALLOW_DELETE_WAREHOUSE = false;

/** ⭐ Tên hiển thị của 2 hành động (⭐ dùng cho nút/nhãn UI, ⛔ không hard-code rải rác). */
export const WAREHOUSE_DEACTIVATE_LABELS: Record<string, string> = {
  hide: "Ẩn kho",
  deactivate: "Ngừng hoạt động",
};

/**
 * ⭐⭐ KHO DỰ ÁN ⇒ khi DỰ ÁN ngừng hoạt động, hệ thống phải **HỎI user** có ngừng kho không (quy tắc ③) ⭐⭐
 *
 * ⚠️ ĐÂY LÀ CÂU HỎI, ⛔ KHÔNG phải hành động — ⭐ user chốt rõ:
 *    «*nếu chọn **không** thì **kệ** còn chọn **có** thì **ngừng**»* ⇒ ⛔ hệ thống ⛔ **KHÔNG tự ngừng kho**.
 *
 * @param project      dự án đang được ngừng (nguồn: `projects[]`)
 * @param warehouses   TOÀN BỘ kho (nguồn: `warehouses[]`) — hàm tự lọc kho thuộc dự án
 * @returns `{ shouldAsk, warehouses, message }`
 *   • `shouldAsk=false` ⇒ ⛔ KHÔNG hỏi (dự án không có kho nào ⇒ ⛔ không có gì để ngừng)
 *   • `warehouses`     ⇒ danh sách kho DỰ ÁN còn đang hoạt động (⭐ chỉ hỏi những kho CHƯA ngừng)
 */
export function projectDeactivationPrompt(
  project: Record<string, unknown> | null | undefined,
  warehouses: readonly Record<string, unknown>[] | null | undefined,
): { shouldAsk: boolean; warehouses: { id: string; name: string; code: string }[]; message: string } {
  const projectId = String(project?.id ?? "").trim();
  const tenDuAn = String(project?.name ?? "").trim();
  const list: { id: string; name: string; code: string }[] = [];
  if (projectId) {
    for (const w of warehouses || []) {
      // ⭐ chỉ kho DỰ ÁN thuộc đúng dự án này, và ⭐ chỉ kho CÒN đang hoạt động (⛔ bỏ kho đã ngừng)
      if (String(w?.projectId ?? "").trim() !== projectId) continue;
      if (Number(w?.active ?? 1) === 0) continue;
      list.push({ id: String(w?.id ?? ""), name: String(w?.name ?? ""), code: String(w?.code ?? "") });
    }
  }
  const message = list.length
    ? `Dự án ${tenDuAn || projectId} ngừng hoạt động. Bạn có ngừng ${list.length} kho của dự án không? (${list
        .map((w) => w.name || w.code)
        .join(", ")})`
    : "";
  return { shouldAsk: list.length > 0, warehouses: list, message };
}
