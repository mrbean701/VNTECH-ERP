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
