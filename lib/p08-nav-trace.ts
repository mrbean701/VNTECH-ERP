// PHASE 2 (`P-08`) — LOGIC THUẦN CHO ĐIỀU HƯỚNG **Nhà cung cấp ↔ PO ↔ Vật tư**.
//
// NGUYÊN VĂN YÊU CẦU (`docs/25_TODO_ROADMAP.md`, dòng `P-08`):
//   «Liên kết Supplier ↔ MR/PR/PO ↔ Material».
// TRUY VẾT DỮ LIỆU đã xong 15/15 cặp · 0 mồ côi (`tools/p2-reference-integrity.mjs`) ⇒ phần CÒN THIẾU
// của `P-08` là **MENU / ĐIỀU HƯỚNG**: đi từ NCC sang PO của NCC đó và từ PO sang vật tư (và chiều ngược).
//
// VÌ SAO TÁCH RA TỆP RIÊNG (đúng tiền lệ `lib/p2-po-trace.ts` · `lib/boq-line-display.ts` ·
// `lib/p2-approval-timeline.ts`):
//   1) `app/page.tsx` là tệp khổng lồ ⇒ logic nằm trong JSX thì KHÔNG test được ở tầng dữ liệu;
//   2) tệp này KHÔNG import gì (không phụ thuộc `@/…`) ⇒ `tests/p08-*.test.mjs` import TRỰC TIẾP bằng
//      `node --import tsx` và KHÔNG tạo import vòng.
//
// ⚠️ TÊN TRƯỜNG LÀ TÊN THẬT ĐÃ ĐO TRÊN PAYLOAD BOOTSTRAP (không đoán):
//   · `purchase_orders.supplier_id`      → payload `supplierId`   (`BootstrapDataAdapter.java:242-253`)
//   · `purchase_orders.po_no`            → payload `poNo`         (`BootstrapDataAdapter.java:243`)
//   · `purchase_order_items.request_item_id` → payload `requestItemId` (`BootstrapDataAdapter.java:278`)
//   · `purchase_order_items` JOIN `material_request_items` JOIN `materials`
//     → payload dòng PO có `materialId` · `materialCode` · `materialName` · `unit`
//     (`BootstrapDataAdapter.java:287-290` — CÙNG câu SQL, KHÔNG phải suy diễn)
//   · `material_request_items.material_id` → payload dòng PR `materialId` (`lib/request-context.ts:14`)
//   · `materials.code` / `materials.name` → payload `code` / `name` (`lib/admin-bulk-import.ts` khớp `code`)
//
// ⚠️ NGUYÊN TẮC «KHÔNG BỊA» (đúng `lib/p2-approval-timeline.ts`): thiếu nguồn trong payload ⇒ trả về
//    ĐÚNG `NO_SOURCE_TEXT` («chưa có nguồn») kèm LÝ DO, KHÔNG suy ra, KHÔNG thay bằng 0/«—» im lặng.

/** Bản ghi bất kỳ đến từ payload bootstrap (giữ kiểu `Row` như `lib/p2-po-trace.ts`, không dùng `any`). */
export type Row = Record<string, unknown>;

/** Nguyên văn hiện lên UI khi payload KHÔNG có nguồn — dùng chung để test khoá được chuỗi. */
export const NO_SOURCE_TEXT = "chưa có nguồn";

// ─────────────────────────────────────────────────────────────────────────────
// 1. TIỆN ÍCH NỀN (thuần, không ném lỗi, không nuốt dữ liệu lạ)
// ─────────────────────────────────────────────────────────────────────────────

/** `true` khi giá trị có nghĩa sau khi cắt khoảng trắng. `0` và `false` VẪN là có nghĩa. */
export function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

/** Khoá so khánh an toàn: `null`/`undefined`/chuỗi rỗng ⇒ `""` (KHÔNG bao giờ khớp nhầm). */
export function navKey(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  return text;
}

/** So khánh hai giá trị theo CHUỖI đã cắt khoảng trắng (id trong payload là GUID dạng chuỗi). */
export function sameKey(a: unknown, b: unknown): boolean {
  const left = navKey(a);
  const right = navKey(b);
  return left !== "" && left === right;
}

/** Cắt 10 ký tự đầu của mốc thời gian (đúng cách UI đang hiện `orderedAt`/`eta`). */
export function navDate(value: unknown): string {
  if (!hasValue(value)) return "";
  return String(value).slice(0, 10);
}

/** Mảng an toàn: giá trị không phải mảng ⇒ mảng rỗng (payload có thể thiếu khoá). */
function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : [];
}

/** Các khoá thực thể trên payload mà `P-08` cần để dựng chuỗi điều hướng. */
export type P08Data = {
  suppliers?: Row[];
  purchaseOrders?: Row[];
  materials?: Row[];
  requests?: Row[];
};

/** Kết quả khi KHÔNG có nguồn: UI BẮT BUỘC hiện `NO_SOURCE_TEXT` + lý do. */
export type NoSource = { value: typeof NO_SOURCE_TEXT; hasSource: false; note: string };

function noSource(note: string): NoSource {
  return { value: NO_SOURCE_TEXT, hasSource: false, note };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CHIỀU XUÔI — NHÀ CUNG CẤP → PO → VẬT TƯ
// ─────────────────────────────────────────────────────────────────────────────

/** Một dòng vật tư của PO: lấy THẲNG từ payload, KHÔNG tra cứu lại rồi tự suy tên. */
export type MaterialItem = {
  /** Dòng PO trong payload. */
  item: Row;
  /** `materialId` thật của dòng PO (rỗng khi payload không kèm). */
  materialId: string;
  /** `materialCode` thật, hoặc `NO_SOURCE_TEXT` khi thiếu. */
  materialCode: string;
  /** `materialName` thật, hoặc `NO_SOURCE_TEXT` khi thiếu. */
  materialName: string;
  /** `true` = dòng PO KHAI ĐƯỢC `materialId` ⇒ mở được màn vật tư. */
  hasMaterialSource: boolean;
  /** Lý do khi thiếu nguồn (rỗng khi `hasMaterialSource = true`). */
  note: string;
};

/**
 * Danh sách vật tư của MỘT PO — nguồn: `purchase_orders.items[]` (payload đã JOIN
 * `material_request_items` + `materials`, xem đầu tệp). Dòng PO KHÔNG khai `materialId`/`materialCode`
 * ⇒ vẫn trả về (để UI đếm đủ dòng) nhưng đánh dấu `hasMaterialSource = false` + lý do.
 */
export function purchaseOrderMaterialItems(
  po: Row | null | undefined,
): { hasSource: boolean; lines: MaterialItem[]; note: string } {
  if (!po) return { hasSource: false, lines: [], note: "Không có đơn mua (PO) để đọc dòng vật tư." };
  const items = asRows(po.items);
  if (items.length === 0) {
    return { hasSource: false, lines: [], note: "Payload của PO KHÔNG kèm `items` (không có `purchase_order_items` để nối sang vật tư)." };
  }
  const lines: MaterialItem[] = items.map((item) => {
    const materialId = navKey(item.materialId);
    const code = navKey(item.materialCode);
    const name = navKey(item.materialName);
    const hasMaterialSource = materialId !== "" || code !== "";
    return {
      item,
      materialId,
      materialCode: code || NO_SOURCE_TEXT,
      materialName: name || NO_SOURCE_TEXT,
      hasMaterialSource,
      note: hasMaterialSource
        ? ""
        : "Dòng PO thiếu `materialId`/`materialCode` ⇒ KHÔNG truy được vật tư (payload không nối `material_request_items`).",
    };
  });
  const any = lines.some((line) => line.hasMaterialSource);
  return {
    hasSource: any,
    lines,
    note: any ? "" : "MỌI dòng PO thiếu `materialId`/`materialCode` ⇒ không truy được vật tư.",
  };
}

/**
 * PO của MỘT nhà cung cấp — đi **Nhà cung cấp → PO của NCC đó**.
 * Khớp theo `purchase_orders.supplier_id` = `suppliers.id`. Payload KHÔNG kèm `supplierId`
 * (dữ liệu cũ) thì LÙI về khớp `supplierName` = `suppliers.name` — và ghi RÕ trong `matchedBy`.
 */
export function supplierPurchaseOrders(
  data: P08Data | null | undefined,
  supplier: Row | null | undefined,
): { hasSource: boolean; purchaseOrders: Row[]; matchedBy: "supplierId" | "supplierName" | "none"; note: string } {
  const suppliers = data?.suppliers;
  const orders = asRows(data?.purchaseOrders);
  if (!Array.isArray(suppliers)) {
    return { hasSource: false, purchaseOrders: [], matchedBy: "none", note: "Payload KHÔNG kèm `suppliers` ⇒ không xác định được nhà cung cấp." };
  }
  if (!supplier) {
    return { hasSource: false, purchaseOrders: [], matchedBy: "none", note: "Chưa chọn nhà cung cấp." };
  }
  const supplierId = navKey(supplier.id);
  const supplierName = navKey(supplier.name);
  if (supplierId === "" && supplierName === "") {
    return { hasSource: false, purchaseOrders: [], matchedBy: "none", note: "Bản ghi nhà cung cấp thiếu cả `id` lẫn `name`." };
  }
  if (orders.length === 0) {
    return { hasSource: false, purchaseOrders: [], matchedBy: "none", note: "Nhà cung cấp này CHƯA có PO nào trong payload." };
  }
  const byId = supplierId === "" ? [] : orders.filter((po) => sameKey(po.supplierId, supplierId));
  if (byId.length > 0) {
    return { hasSource: true, purchaseOrders: byId, matchedBy: "supplierId", note: "" };
  }
  const byName = supplierName === "" ? [] : orders.filter((po) => navKey(po.supplierName) === supplierName);
  if (byName.length > 0) {
    return {
      hasSource: true,
      purchaseOrders: byName,
      matchedBy: "supplierName",
      note: `PO cũ không kèm \`supplierId\` ⇒ đã khớp theo TÊN NCC «${supplierName}» (${byName.length} PO).`,
    };
  }
  return { hasSource: true, purchaseOrders: [], matchedBy: "supplierId", note: "Nhà cung cấp này CHƯA có PO nào trong payload." };
}

/** Chuỗi điều hướng XUÔI cho MỘT nhà cung cấp: NCC → từng PO → từng vật tư. */
export type SupplierChain = {
  /** Bản ghi nhà cung cấp (nguyên trạng từ payload). */
  supplier: Row;
  /** Mã NCC hiển thị, hoặc `NO_SOURCE_TEXT`. */
  supplierCode: string;
  /** Tên NCC hiển thị, hoặc `NO_SOURCE_TEXT`. */
  supplierName: string;
  /** PO của NCC (rỗng khi NCC chưa có PO). */
  purchaseOrders: Row[];
  /** `true` = tra được danh sách PO (kể cả rỗng) từ payload. */
  hasSource: boolean;
  matchedBy: "supplierId" | "supplierName" | "none";
  note: string;
  /** Vật tư gộp theo PO, ĐÚNG thứ tự PO trả về. */
  materialLines: { purchaseOrder: Row; line: MaterialItem }[];
  /** Số dòng vật tư CÓ nguồn (loại dòng thiếu nguồn). */
  sourcedMaterialCount: number;
};

/**
 * Dựng TRỌN chuỗi điều hướng **NCC → PO → Vật tư** cho MỘT nhà cung cấp.
 * Chỉ đọc payload; không gọi API, không ghi gì.
 */
export function supplierToPurchaseOrderChain(
  data: P08Data | null | undefined,
  supplier: Row | null | undefined,
): SupplierChain | null {
  if (!supplier) return null;
  const scoped = supplierPurchaseOrders(data, supplier);
  const materialLines: { purchaseOrder: Row; line: MaterialItem }[] = [];
  for (const po of scoped.purchaseOrders) {
    for (const line of purchaseOrderMaterialItems(po).lines) materialLines.push({ purchaseOrder: po, line });
  }
  return {
    supplier,
    supplierCode: navKey(supplier.code) || NO_SOURCE_TEXT,
    supplierName: navKey(supplier.name) || NO_SOURCE_TEXT,
    purchaseOrders: scoped.purchaseOrders,
    hasSource: scoped.hasSource,
    matchedBy: scoped.matchedBy,
    note: scoped.note,
    materialLines,
    sourcedMaterialCount: materialLines.filter((entry) => entry.line.hasMaterialSource).length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CHIỀU NGƯỢC — VẬT TƯ → PO → NHÀ CUNG CẤP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dòng PR (`material_request_items`) của MỘT vật tư — nguồn: `requests[].items[].materialId`.
 * KHÔNG quét `purchase_order_items` (bảng đó không có `material_id`) — cầu nối là `requestItemId`.
 */
export function requestItemsForMaterial(data: P08Data | null | undefined, material: unknown): Row[] {
  const materialId = navKey(material);
  if (materialId === "") return [];
  const out: Row[] = [];
  for (const request of asRows(data?.requests)) {
    for (const item of asRows(request.items)) {
      if (sameKey(item.materialId, materialId)) out.push(item);
    }
  }
  return out;
}

/**
 * PO có chứa MỘT vật tư — đi **Vật tư → PO đã đặt vật tư đó**.
 * Cầu nối THẬT: `purchase_order_items.request_item_id` = `material_request_items.id`
 * (`BootstrapDataAdapter.java:289`), và dòng PO có thẳng `materialId`.
 * Không tìm thấy bằng cả hai cách ⇒ trả về mảng rỗng + `note` nói RÕ đã thử gì.
 */
export function materialPurchaseOrders(
  data: P08Data | null | undefined,
  material: unknown,
): { hasSource: boolean; purchaseOrders: Row[]; matchedBy: "poItem.materialId" | "requestItemId" | "none"; note: string } {
  const materialId = navKey(material);
  if (materialId === "") {
    return { hasSource: false, purchaseOrders: [], matchedBy: "none", note: "Mã vật tư rỗng ⇒ không tra được PO." };
  }
  const orders = asRows(data?.purchaseOrders);
  if (orders.length === 0) {
    return { hasSource: false, purchaseOrders: [], matchedBy: "none", note: "Payload KHÔNG kèm `purchaseOrders` ⇒ không tra được PO của vật tư." };
  }
  const direct = orders.filter((po) => asRows(po.items).some((item) => sameKey(item.materialId, materialId)));
  if (direct.length > 0) return { hasSource: true, purchaseOrders: direct, matchedBy: "poItem.materialId", note: "" };

  const requestRows = requestItemsForMaterial(data, materialId);
  const requestRowIds = requestRows.map((row) => row.id);
  const viaParent = orders.filter((po) =>
    asRows(po.items).some((item) => requestRowIds.some((id) => sameKey(item.requestItemId, id))),
  );
  if (viaParent.length > 0) {
    return {
      hasSource: true,
      purchaseOrders: viaParent,
      matchedBy: "requestItemId",
      note: `Dòng PO không kèm \`materialId\` ⇒ đã nối qua \`requestItemId\` → dòng PR (${requestRows.length} dòng PR của vật tư).`,
    };
  }
  if (requestRows.length === 0 && asRows(data?.requests).length === 0) {
    return { hasSource: false, purchaseOrders: [], matchedBy: "none", note: "Payload KHÔNG kèm `requests` ⇒ không có cầu nối dòng PR để truy vật tư." };
  }
  return { hasSource: true, purchaseOrders: [], matchedBy: "none", note: "Vật tư này CHƯA có PO nào trong payload." };
}

/** Nhà cung cấp của MỘT PO — đi **PO → Nhà cung cấp**. */
export function purchaseOrderSupplier(
  data: P08Data | null | undefined,
  po: Row | null | undefined,
): { hasSource: boolean; supplier: Row | null; matchedBy: "supplierId" | "supplierName" | "none"; note: string } {
  if (!po) return { hasSource: false, supplier: null, matchedBy: "none", note: "Không có PO để tra nhà cung cấp." };
  const suppliers = asRows(data?.suppliers);
  if (suppliers.length === 0) {
    return { hasSource: false, supplier: null, matchedBy: "none", note: "Payload KHÔNG kèm `suppliers` ⇒ không đối chiếu được nhà cung cấp." };
  }
  const supplierId = navKey(po.supplierId);
  if (supplierId !== "") {
    const found = suppliers.find((row) => sameKey(row.id, supplierId));
    if (found) return { hasSource: true, supplier: found, matchedBy: "supplierId", note: "" };
  }
  const supplierName = navKey(po.supplierName);
  if (supplierName !== "") {
    const found = suppliers.find((row) => navKey(row.name) === supplierName);
    if (found) {
      return {
        hasSource: true,
        supplier: found,
        matchedBy: "supplierName",
        note: `PO không kèm \`supplierId\` (hoặc id không có trong danh mục) ⇒ đã khớp theo TÊN NCC «${supplierName}».`,
      };
    }
  }
  return {
    hasSource: false,
    supplier: null,
    matchedBy: "none",
    note: supplierId === ""
      ? "PO KHÔNG kèm `supplierId` và tên NCC không khớp danh mục ⇒ chưa xác định được nhà cung cấp."
      : "`supplierId` của PO KHÔNG có trong danh mục `suppliers` của payload.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. BẢN ĐỒ ĐIỀU HƯỚNG (DAG 3 NÚT) — đầu vào cho khối menu/nút điều hướng trên UI
// ─────────────────────────────────────────────────────────────────────────────

/** Nút nhà cung cấp trong bản đồ điều hướng. */
export type SupplierNav = {
  supplier: Row;
  code: string;
  name: string;
  /** Số PO của NCC, đếm từ payload. */
  purchaseOrderCount: number;
  /** Số dòng vật tư CÓ nguồn trên các PO của NCC. */
  sourceableMaterialCount: number;
  /** Số dòng vật tư nối được sang PO (PO + dòng PO đều có thật). */
  materialLinkCount: number;
  /** `true` = tra được (kể cả 0 PO). */
  hasSource: boolean;
  note: string;
};

/** Bản đồ điều hướng `P-08`: 3 tầng NCC → PO → Vật tư. */
export type P08NavGraph = {
  suppliers: SupplierNav[];
  purchaseOrders: Row[];
  materials: Row[];
  /** Cạnh `supplierId::poId` có thật trong payload. */
  supplierPoEdges: { supplierId: string; purchaseOrderId: string; matchedBy: "supplierId" | "supplierName" }[];
  /** Cạnh `poId::materialId` dựng từ `purchase_order_items` (có `materialId` thật). */
  poMaterialEdges: { purchaseOrderId: string; materialId: string; requestItemId: string; materialCode: string }[];
  /** Số NCC tra được PO theo `supplier_id`. */
  linkedSupplierCount: number;
  /** Số PO nối được ít nhất 1 vật tư. */
  poWithMaterialCount: number;
  /** Số dòng PO thiếu nguồn vật tư (KHÔNG giấu). */
  unsourcedPoLineCount: number;
  /** Cảnh báo «chưa có nguồn» cấp bản đồ (rỗng khi mọi tầng đều có nguồn). */
  notes: string[];
};

/** Điểm vào DUY NHẤT cho khối điều hướng: dựng cả 3 tầng + 2 loại cạnh từ payload. */
export function buildP08NavGraph(data: P08Data | null | undefined): P08NavGraph {
  const suppliers = asRows(data?.suppliers);
  const orders = asRows(data?.purchaseOrders);
  const materials = asRows(data?.materials);
  const notes: string[] = [];
  if (!Array.isArray(data?.suppliers)) notes.push("Payload KHÔNG kèm `suppliers` ⇒ tầng Nhà cung cấp chưa có nguồn.");
  if (!Array.isArray(data?.purchaseOrders)) notes.push("Payload KHÔNG kèm `purchaseOrders` ⇒ tầng PO chưa có nguồn.");
  if (!Array.isArray(data?.materials)) notes.push("Payload KHÔNG kèm `materials` ⇒ tầng Vật tư chưa có nguồn.");

  const supplierPoEdges: P08NavGraph["supplierPoEdges"] = [];
  const supplierNavs: SupplierNav[] = suppliers.map((supplier) => {
    const scoped = supplierPurchaseOrders(data, supplier);
    const chain = supplierToPurchaseOrderChain(data, supplier);
    for (const po of scoped.purchaseOrders) {
      supplierPoEdges.push({
        supplierId: navKey(supplier.id),
        purchaseOrderId: navKey(po.id),
        matchedBy: scoped.matchedBy === "supplierName" ? "supplierName" : "supplierId",
      });
    }
    return {
      supplier,
      code: navKey(supplier.code) || NO_SOURCE_TEXT,
      name: navKey(supplier.name) || NO_SOURCE_TEXT,
      purchaseOrderCount: scoped.purchaseOrders.length,
      sourceableMaterialCount: chain ? chain.sourcedMaterialCount : 0,
      materialLinkCount: chain
        ? chain.materialLines.filter((entry) => navKey(entry.purchaseOrder.id) !== "").length
        : 0,
      hasSource: scoped.hasSource,
      note: scoped.note,
    };
  });

  const poMaterialEdges: P08NavGraph["poMaterialEdges"] = [];
  let unsourcedPoLineCount = 0;
  let poWithMaterialCount = 0;
  for (const po of orders) {
    const parsed = purchaseOrderMaterialItems(po);
    let linked = 0;
    for (const line of parsed.lines) {
      if (!line.hasMaterialSource) {
        unsourcedPoLineCount += 1;
        continue;
      }
      linked += 1;
      poMaterialEdges.push({
        purchaseOrderId: navKey(po.id),
        materialId: line.materialId,
        requestItemId: navKey(line.item.requestItemId),
        materialCode: line.materialCode,
      });
    }
    if (linked > 0) poWithMaterialCount += 1;
  }
  if (unsourcedPoLineCount > 0) {
    notes.push(`${unsourcedPoLineCount} dòng PO thiếu \`materialId\`/\`materialCode\` ⇒ ${NO_SOURCE_TEXT} vật tư cho các dòng đó.`);
  }
  if (orders.length > 0 && poMaterialEdges.length === 0) {
    notes.push(`0 dòng PO nối được vật tư ⇒ ${NO_SOURCE_TEXT} cạnh PO → Vật tư.`);
  }
  if (suppliers.length > 0 && supplierPoEdges.length === 0) {
    notes.push(`0 PO khớp được nhà cung cấp theo \`supplierId\`/\`supplier_name\` ⇒ ${NO_SOURCE_TEXT} cạnh NCC → PO.`);
  }

  return {
    suppliers: supplierNavs,
    purchaseOrders: orders,
    materials,
    supplierPoEdges,
    poMaterialEdges,
    linkedSupplierCount: supplierNavs.filter((nav) => nav.purchaseOrderCount > 0).length,
    poWithMaterialCount,
    unsourcedPoLineCount,
    notes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. NHÃN HIỂN THỊ CHO NÚT ĐIỀU HƯỚNG («chưa có nguồn» thay vì «—» im lặng)
// ─────────────────────────────────────────────────────────────────────────────

/** Nhãn nút «NCC → PO»: `«NCC · 3 PO»`, hoặc `NO_SOURCE_TEXT` + lý do khi thiếu nguồn. */
export function supplierNavLabel(nav: SupplierNav | null | undefined): { label: string; hasSource: boolean; note: string } {
  if (!nav) return { label: NO_SOURCE_TEXT, hasSource: false, note: "Chưa chọn nhà cung cấp." };
  if (!nav.hasSource) return { label: NO_SOURCE_TEXT, hasSource: false, note: nav.note };
  const base = `${nav.code} · ${nav.name}`;
  if (nav.purchaseOrderCount === 0) {
    return { label: `${base} — ${NO_SOURCE_TEXT} PO`, hasSource: false, note: nav.note || "Nhà cung cấp chưa có PO trong payload." };
  }
  return { label: `${base} — ${nav.purchaseOrderCount} PO`, hasSource: true, note: nav.note };
}

/** Nhãn nút «PO → Vật tư»: `«PO-123 · 4 dòng · 4 vật tư»`. */
export function poNavLabel(
  po: Row | null | undefined,
  materialItems?: MaterialItem[],
): { label: string; hasSource: boolean; note: string } {
  if (!po) return { label: NO_SOURCE_TEXT, hasSource: false, note: "Không có PO để điều hướng." };
  const parsed = materialItems ? { hasSource: materialItems.some((line) => line.hasMaterialSource), lines: materialItems, note: "" } : purchaseOrderMaterialItems(po);
  const poNo = navKey(po.poNo) || navKey(po.id) || NO_SOURCE_TEXT;
  if (parsed.lines.length === 0) return { label: `${poNo} — ${NO_SOURCE_TEXT}`, hasSource: false, note: parsed.note || "Payload PO không kèm dòng vật tư." };
  const sourced = parsed.lines.filter((line) => line.hasMaterialSource).length;
  if (sourced === 0) {
    return {
      label: `${poNo} — ${parsed.lines.length} dòng · ${NO_SOURCE_TEXT} vật tư`,
      hasSource: false,
      note: parsed.note,
    };
  }
  return {
    label: `${poNo} — ${parsed.lines.length} dòng · ${sourced} vật tư`,
    hasSource: true,
    note: sourced === parsed.lines.length ? "" : `${parsed.lines.length - sourced}/${parsed.lines.length} dòng thiếu nguồn vật tư.`,
  };
}

/** Nhãn nút «Vật tư → PO»: `«MAT-01 · Thép hộp — 2 PO»`. */
export function materialNavLabel(
  material: Row | null | undefined,
  purchaseOrders: Row[] | null | undefined,
): { label: string; hasSource: boolean; note: string } {
  if (!material) return { label: NO_SOURCE_TEXT, hasSource: false, note: "Chưa chọn vật tư." };
  const code = navKey(material.code) || navKey(material.id);
  const name = navKey(material.name);
  const base = name ? `${code} · ${name}` : code || NO_SOURCE_TEXT;
  const orders = Array.isArray(purchaseOrders) ? purchaseOrders : [];
  if (orders.length === 0) return { label: `${base} — ${NO_SOURCE_TEXT} PO`, hasSource: false, note: "Vật tư chưa có PO trong payload." };
  return { label: `${base} — ${orders.length} PO`, hasSource: true, note: "" };
}
