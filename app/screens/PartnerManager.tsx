// TASK-125 (21/09/2026) — MÀN QUẢN LÝ ĐỐI TÁC (màn RIÊNG, KHÔNG dùng chung `SupplierManager`).
//
// QUYẾT ĐỊNH NGUYÊN VĂN CỦA NGƯỜI DÙNG (21/09/2026):
//   ① «Đối tác là bảng riêng»  ⇒ màn này đọc/ghi BẢNG RIÊNG `partners` (không mượn bảng `suppliers`).
//   ② «Cho nhập dữ liệu»       ⇒ form thêm/sửa/xoá gọi action THẬT (`save_partner` · `set_partner_status` · `delete_partner`).
//   ③ «Không cần gộp»          ⇒ 3 lối vào NCC giữ nguyên; mục «Đối tác» mở MÀN NÀY.
//
// KHUÔN UI: sao chép `app/screens/SupplierManager.tsx` (cùng lớp CSS `supplier-new-grid` /
// `supplier-admin-list` / `supplier-admin-row`) ⇒ ĐỒNG BỘ giao diện, không sinh CSS mới.
//
// NGUỒN DỮ LIỆU: `data.partners` — trường bootstrap THÊM MỚI (chỉ THÊM) ở CẢ HAI đường đọc:
//   • JS  : `scripts/system-route.mjs` (SELECT từ bảng `partners`)
//   • Java: `BootstrapDataAdapter.java` (đường đang phục vụ UI — proxy :9000 → :18081)
// ⛔ KHÔNG bịa dữ liệu: khi `partners` rỗng ⇒ hiện `<Empty>` nói rõ; KHÔNG lấy nhà cung cấp làm đối tác.
//
// KHOÁ QUYỀN: mục «Đối tác» dùng chung khoá CŨ `dept_plan_suppliers` (`lib/menu-helpers.ts`) ⇒ 0 khoá `module_catalog` mới.

import { CardHead, Empty } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent, useMemo, useState } from "react";

const PARTNER_TYPE_LABEL: Record<string, string> = {
  supplier: "Nhà cung cấp",
  contractor: "Nhà thầu phụ",
  consultant: "Tư vấn / thiết kế",
  customer: "Khách hàng",
  other: "Khác",
};

// Không nhận prop `open`: hiện CHƯA có modal chi tiết đối tác trong `app/page.tsx` ⇒ KHÔNG bịa tên modal.
function PartnerManager({ data, action }: { data: AppData; action: (name: string, payload: Row) => Promise<boolean> }) {
  const rows = data.partners || [];
  const [keyword, setKeyword] = useState("");
  const filtered = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => [row.code, row.name, row.taxCode, row.contactName, row.contactPhone, row.email]
      .some((value) => String(value ?? "").toLowerCase().includes(needle)));
  }, [rows, keyword]);

  async function saveForm(event: FormEvent<HTMLFormElement>, partner?: Row) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    const partnerId = partner?.id;
    if (await action("save_partner", { ...payload, partnerId }) && !partnerId) (event.currentTarget as HTMLFormElement).reset();
  }

  return <><section className="card">
    <CardHead title="Đối tác" note="Danh mục ĐỐI TÁC (bảng riêng `partners`) — độc lập với danh mục Nhà cung cấp dùng cho PO." />
    <form className="supplier-new-grid" onSubmit={(event) => saveForm(event)}>
      <input name="code" placeholder="Mã đối tác *" required />
      <input name="name" placeholder="Tên đối tác *" required />
      <input name="taxCode" placeholder="Mã số thuế" />
      <input name="contactName" placeholder="Người liên hệ" />
      <input name="contactPhone" placeholder="Điện thoại" />
      <input name="email" placeholder="Email" />
      <select name="partnerType" defaultValue="supplier" aria-label="Loại đối tác">{Object.entries(PARTNER_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <input name="address" placeholder="Địa chỉ" />
      <button className="primary">＋ Thêm đối tác</button>
    </form>
    <div className="toolbar-inline">
      <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm đối tác theo mã / tên / MST / liên hệ" aria-label="Tìm kiếm đối tác" />
      {keyword && <button type="button" className="export-mini" onClick={() => setKeyword("")}>Xoá lọc</button>}
    </div>
    <div className="supplier-admin-list">{filtered.map((row) => <form className={`supplier-admin-row ${row.active ? "" : "inactive"}`} key={row.id} onSubmit={(event) => saveForm(event, row)}>
      <input name="code" defaultValue={row.code} required />
      <input name="name" defaultValue={row.name} required />
      <input name="taxCode" defaultValue={row.taxCode || ""} placeholder="MST" />
      <input name="contactName" defaultValue={row.contactName || ""} placeholder="Liên hệ" />
      <input name="contactPhone" defaultValue={row.contactPhone || ""} placeholder="Điện thoại" />
      <input name="email" defaultValue={row.email || ""} placeholder="Email" />
      <select name="partnerType" defaultValue={row.partnerType || "supplier"} aria-label={`Loại đối tác ${row.code}`}>{Object.entries(PARTNER_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <input name="address" defaultValue={row.address || ""} placeholder="Địa chỉ" />
      <span className="muted">{PARTNER_TYPE_LABEL[String(row.partnerType || "supplier")] || String(row.partnerType || "")}</span>
      <button className="export-mini" type="submit">Lưu</button>
      <button type="button" className={`export-mini ${row.active ? "danger" : ""}`} onClick={() => action("set_partner_status", { partnerId: row.id, active: row.active ? 0 : 1 })}>{row.active ? "Ngừng sử dụng" : "Kích hoạt"}</button>
      <button type="button" className="export-mini danger" onClick={() => window.confirm(`Xoá đối tác ${row.code}?` ) && action("delete_partner", { partnerId: row.id })}>Xoá</button>
    </form>)}
      {!rows.length && <Empty text="Chưa có Đối tác nào trong bảng `partners`. Hãy thêm đối tác đầu tiên — hệ thống KHÔNG lấy danh mục Nhà cung cấp làm dữ liệu đối tác." />}
      {rows.length > 0 && !filtered.length && <Empty text={`Không có đối tác nào khớp từ khoá “${keyword}”.`} />}
    </div>
  </section></>;
}

export {
  PartnerManager,
};
