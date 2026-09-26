// MT2-P8-05 (§6.3) — **MODAL CHI TIẾT NHÀ CUNG CẤP**.
//
// §6.3 NGUYÊN VĂN:
//   «Click NCC ⇒ modal chi tiết gồm: Tab 1 Thông tin · Tab 2 PO (danh sách PO liên quan,
//     click PO ⇒ modal chi tiết PO) · Tab 3 Danh sách vật tư …»
//
// CHỈ ĐỌC DỮ LIỆU ĐANG CÓ TRONG PAYLOAD — ⛔ 0 API mới · ⛔ 0 migration · ⛔ 0 action mới.
//   · Tab 1: `suppliers` (đã có `email` từ migration V28).
//   · Tab 2: `purchaseOrders` **ĐÃ LỌC theo NCC** — ⚠️ người gọi dùng hàm THUẦN
//            `supplierToPurchaseOrderChain()` (`lib/p08-nav-trace.ts`) ⇒ ⛔ KHÔNG lọc lại ở đây (§15).
//   · Tab 3: `materialLines` của CHÍNH hàm đó (`MaterialItem` đã có `materialCode`/`materialName`/`note`).
//
// ⚠️ MODAL THEO §23: `.overlay` + `<section className="card" role="dialog" aria-modal="true">`,
//    có nút đóng, có `Empty` khi thiếu nguồn, ⛔ KHÔNG bịa số liệu.
// ⛔ KHÔNG dùng `.timeline` (`app/globals.css:161` — đó là dải 3 CỘT DÙNG CHUNG; sửa/dùng lại
//    làm lệch 28/28 màn — bài học U-08). Dải tab ở đây là nút thường.

import { useState } from "react";
import type { MaterialItem } from "@/lib/p08-nav-trace";
import { Empty, date, money } from "@/lib/ui-shared";
import type { Row } from "@/lib/ui-shared";

/** Dòng vật tư của NCC — lấy từ `supplierToPurchaseOrderChain().materialLines` (hàm THUẦN đã có test). */
export type SupplierMaterialLine = { purchaseOrder: Row; line: MaterialItem };

const TABS = ["Thông tin", "PO", "Danh sách vật tư"] as const;

/** Một dòng «nhãn: giá trị» của Tab 1. ⚠️ `email` có từ migration V28 (§6.2). */
function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="supplier-info-row"><span>{label}</span><strong>{value || "—"}</strong></div>;
}

export function SupplierDetailModal({
  supplier, purchaseOrders, materialLines, onClose, openPo, action, loadGaps,
}: {
  supplier: Row;
  /** PO **đã lọc** theo NCC này (⛔ không truyền toàn bộ PO). */
  purchaseOrders: Row[];
  /** Vật tư theo dòng PO của NCC này (⛔ không truyền toàn bộ vật tư). */
  materialLines: SupplierMaterialLine[];
  onClose: () => void;
  /** Khi có: bấm một dòng PO sẽ mở **modal chi tiết PO** (§6.3). */
  openPo?: (po: Row) => void;
  /** ⚠️ MT2-P8-06 (§6.4) — gọi `save_supplier_material`. ⛔ KHÔNG tự động thêm: chỉ khi user BẤM. */
  action?: (name: string, payload: Row) => Promise<boolean>;
  /**
   * ⚠️ MT2-P8-06 (§6.4) — nạp DANH SÁCH VẬT TƯ THIẾU của 1 PO.
   * ✅ VÌ SAO CẦN PROP NÀY (⛔ KHÔNG dùng `action`): `action()` **⛔ KHÔNG trả payload** (trả `undefined`
   * khi thành công) ⇒ ⛔ KHÔNG đọc được `{ missing }`. Hàm này trả về ĐÚNG mảng đó từ `requestApi`.
   * ⚠️ ĐỂ TÙY CHỌN ⇒ nơi gọi cũ vẫn hợp lệ (⛔ không phá build).
   */
  loadGaps?: (purchaseOrderId: string) => Promise<Row[]>;
}) {
  const [tab, setTab] = useState(0);
  // §6.4 — PO đang kiểm + danh sách vật tư NCC CHƯA có. `null` = chưa kiểm.
  const [gapPo, setGapPo] = useState<Row | null>(null);
  const [gaps, setGaps] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const supplierId = String(supplier.id || "");

  /** §6.4 — KIỂM vật tư thiếu của 1 PO. ⛔ KHÔNG tự thêm gì: chỉ ĐỌC rồi HỎI. */
  async function checkGaps(po: Row) {
    if (!loadGaps) { setMsg("Chưa nối được nguồn kiểm vật tư thiếu."); return; }
    setBusy(true); setGapPo(po); setGaps(null); setMsg("");
    try {
      const rows = await loadGaps(String(po.id));
      setGaps(Array.isArray(rows) ? rows : []);
    } catch {
      setGaps([]); setMsg("Không kiểm được vật tư thiếu — thử lại.");
    }
    setBusy(false);
  }

  /** §6.4 — user ĐỒNG Ý thêm 1 vật tư vào danh mục NCC (⚠️ CHỈ khi user BẤM). */
  async function approveAdd(materialId: string) {
    if (!action) { setMsg("Chưa nối được hành động thêm vật tư."); return; }
    setBusy(true);
    const ok = await action("save_supplier_material", { supplierId: supplierId, materialId: materialId });
    setBusy(false);
    if (ok) {
      const left = (gaps || []).filter((row) => String(row.materialId) !== String(materialId));
      setGaps(left);
      setMsg(left.length === 0 ? "Đã thêm hết vật tư thiếu vào danh mục NCC." : "Đã thêm 1 vật tư — còn vật tư khác.");
    } else {
      setMsg("Không thêm được — kiểm tra quyền hoặc dữ liệu.");
    }
  }
  const name = String(supplier.name || "");
  const code = String(supplier.code || "");

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="card supplier-detail-modal" role="dialog" aria-modal="true" aria-label={`Chi tiết nhà cung cấp ${code}`}>
        <header>
          <div>
            <small className="document-name">CHI TIẾT NHÀ CUNG CẤP</small>
            <strong>{code} · {name}</strong>
          </div>
          <button type="button" onClick={onClose} title="Đóng">×</button>
        </header>

        <div className="row-actions">
          {TABS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={index === tab ? "primary" : "secondary"}
              onClick={() => setTab(index)}
            >{label}</button>
          ))}
        </div>

        {/* TAB 1 — THÔNG TIN */}
        {tab === 0 && (
          <div className="supplier-detail-tab">
            <InfoRow label="Mã NCC" value={code} />
            <InfoRow label="Tên NCC" value={name} />
            <InfoRow label="Mã số thuế" value={String(supplier.taxCode || "")} />
            <InfoRow label="Người liên hệ" value={String(supplier.contactName || "")} />
            <InfoRow label="Điện thoại" value={String(supplier.phone || "")} />
            <InfoRow label="Email" value={String(supplier.email || "")} />
            <InfoRow label="Lead time (ngày)" value={String(supplier.leadTimeDays ?? "")} />
            <InfoRow label="Đánh giá" value={String(supplier.rating ?? "")} />
            <InfoRow label="Trạng thái" value={supplier.active ? "Đang sử dụng" : "Ngừng sử dụng"} />
          </div>
        )}

        {/* TAB 2 — PO CỦA NCC NÀY */}
        {tab === 1 && (
          purchaseOrders.length === 0
            ? <Empty text="Nhà cung cấp này chưa có PO nào trong dữ liệu." />
            : <div className="table-wrap"><table><thead><tr>
                <th>Số PO</th><th>Yêu cầu</th><th>Dự án</th><th>Ngày đặt</th><th>ETA</th>
                <th>Trạng thái</th><th>Giá trị</th><th>Số dòng</th>
              </tr></thead><tbody>
                {purchaseOrders.map((po) => (
                  <tr
                    key={String(po.id)}
                    onClick={openPo ? () => openPo(po) : undefined}
                    style={openPo ? { cursor: "pointer" } : undefined}
                    title={openPo ? "Bấm để mở chi tiết PO" : undefined}
                  >
                    <td><strong>{String(po.poNo || "—")}</strong></td>
                    <td>{String(po.requestNo || "—")}</td>
                    <td>{String(po.projectCode || "—")}</td>
                    <td>{po.orderedAt ? date(String(po.orderedAt)) : "—"}</td>
                    <td>{po.eta ? date(String(po.eta)) : "—"}</td>
                    <td>{String(po.status || "—")}</td>
                    <td>{po.totalValue == null ? "—" : money(Number(po.totalValue))}</td>
                    <td>{String(po.itemCount ?? "—")}</td>
                    <td>
                      <button type="button" className="export-mini" disabled={!loadGaps || busy}
                              onClick={(event) => { event.stopPropagation(); checkGaps(po); }}
                              title={loadGaps ? "Tìm vật tư PO này cần mà NCC chưa có" : "Chưa nối được nguồn kiểm vật tư thiếu"}>Kiểm vật tư thiếu</button>
                    </td>
                  </tr>
                ))}
              </tbody></table></div>
        )}

        {/* MT2-P8-06 (§6.4) — GAP VẬT TƯ: HỎI user TRƯỚC khi thêm. ⛔ KHÔNG tự động thêm. */}
        {tab === 1 && gapPo && (
          <section className="card supplier-material-gap">
            {gaps === null && <p>Đang kiểm vật tư thiếu của PO {String(gapPo.poNo || "")}…</p>}
            {gaps !== null && gaps.length === 0 && (
              <p><strong>PO {String(gapPo.poNo || "")} đã đủ vật tư trong danh mục nhà cung cấp này.</strong></p>
            )}
            {gaps !== null && gaps.length > 0 && <>
              <p><strong>Vật tư này chưa có trong danh mục vật tư của nhà cung cấp. Bạn có muốn thêm không?</strong></p>
              <div className="table-wrap"><table><thead><tr>
                <th>Mã vật tư</th><th>Tên vật tư</th><th>ĐVT</th><th>Thêm vào danh mục NCC</th>
              </tr></thead><tbody>
                {gaps.map((row) => (
                  <tr key={String(row.materialId)}>
                    <td><strong>{String(row.materialCode || "—")}</strong></td>
                    <td>{String(row.materialName || "—")}</td>
                    <td>{String(row.unit || "—")}</td>
                    <td>
                      <button type="button" className="export-mini" disabled={busy}
                              onClick={() => approveAdd(String(row.materialId))} title="Đồng ý thêm vật tư này vào danh mục NCC">Đồng ý thêm</button>
                    </td>
                  </tr>
                ))}
              </tbody></table></div>
            </>}
            <div className="row-actions">
              <button type="button" className="secondary" onClick={() => { setGapPo(null); setGaps(null); setMsg(""); }}>Không</button>
            </div>
          </section>
        )}
        {msg && <div className="inline-alert">{msg}</div>}

        {/* TAB 3 — DANH SÁCH VẬT TƯ (theo DÒNG PO) */}
        {tab === 2 && (
          materialLines.length === 0
            ? <Empty text="Chưa có dòng vật tư nào nối được từ PO của nhà cung cấp này." />
            : <div className="table-wrap"><table><thead><tr>
                <th>Số PO</th><th>Mã vật tư</th><th>Tên vật tư</th><th>Ghi chú</th>
              </tr></thead><tbody>
                {materialLines.map((row, index) => (
                  <tr key={`${String(row.purchaseOrder.id)}-${index}`}>
                    <td>{String(row.purchaseOrder.poNo || "—")}</td>
                    <td><strong>{row.line.materialCode || "—"}</strong></td>
                    <td>{row.line.materialName || "—"}</td>
                    <td>{row.line.note || (row.line.hasMaterialSource ? "" : "chưa có nguồn")}</td>
                  </tr>
                ))}
              </tbody></table></div>
        )}

        <div className="row-actions">
          <button type="button" className="secondary" onClick={onClose}>Đóng</button>
        </div>
      </section>
    </div>
  );
}
