// VNTECH ERP V5.3.0 — PHASE 2 · LOGIC THUẦN CHO 3 CỔNG ĐO (không I/O, không gọi CSDL)
//
// VÌ SAO TÁCH RA: 3 cổng đo cần MySQL thật và tự gọi `process.exit()`, nên không thể kiểm thử bằng cách
// import thẳng. Toàn bộ phần QUYẾT ĐỊNH (tính mồ côi, % truy vết, ngưỡng ĐẠT/HỎNG, định dạng bảng) nằm
// ở đây dưới dạng hàm thuần: đầu vào là số liệu đã đếm, đầu ra xác định ⇒ test được offline
// (`tests/p2-gates-tools.test.mjs`) mà không cần CSDL, và không thể "xanh giả" khi mất kết nối.
//
// ⚠️ Tệp này CHỈ tính toán trên số đã cho — tuyệt đối không chứa câu lệnh ghi nào.

/** Dung sai số thực cho cột DECIMAL(18,4): 1e-4 * 10^-4 ≈ 0.0001. */
export const DUNG_SAI_SL = 0.0001;

/** % dạng chuỗi; mẫu số 0 ⇒ "n/a" (KHÔNG được in "0.0%" hay "100.0%" để tránh xanh giả). */
export function tiLe(tu, mau) {
  const m = Number(mau || 0);
  if (m === 0) return "n/a";
  return `${((Number(tu || 0) / m) * 100).toFixed(1)}%`;
}

/** Đệm phải cho cột bảng ASCII (đếm theo ký tự, an toàn với tiếng Việt). */
export function dem(s, n) {
  return String(s).padEnd(n);
}

/** Đếm số PHẦN TỬ dài nhất trong một cột để canh bảng. */
export function rongCot(giaTri) {
  return giaTri.reduce((m, v) => Math.max(m, String(v).length), 0);
}

/** In một bảng ASCII đơn giản. `cot` = [{ ten, rong }], `dong` = mảng mảng ô. */
export function bang(cot, dong) {
  const duong = cot.map((c) => "─".repeat(c.rong)).join("─┼─");
  const out = [];
  out.push("  " + cot.map((c) => dem(c.ten, c.rong)).join(" │ "));
  out.push("  " + duong);
  for (const d of dong) out.push("  " + d.map((o, i) => dem(o, cot[i].rong)).join(" │ "));
  return out.join("\n");
}

/**
 * Gộp một (hoặc nhiều) quan hệ tham chiếu thành kết quả đo.
 * @param {{tong:number, rong:number, treo:number}|Array<{tong:number,rong:number,treo:number}>} d
 *        tong = số dòng có cột đó; rong = số dòng NULL/rỗng; treo = số dòng trỏ tới bản ghi KHÔNG tồn tại.
 * @returns cùng hình dạng đầu vào: 1 đối tượng hoặc mảng đối tượng kết quả.
 */
export function doQuanHe(d) {
  if (Array.isArray(d)) return d.map((x) => doQuanHe(x));
  const tong = Number(d.tong || 0);
  const rong = Number(d.rong || 0);
  const treo = Number(d.treo || 0);
  const moCoi = rong + treo;
  return {
    tong,
    rong,
    treo,
    moCoi,
    truyDuoc: tong - moCoi,
    dat: moCoi === 0,
    rongBang: tong === 0,
  };
}

/**
 * Đếm số `request_id` được tham chiếu bởi ≥ 2 PO (đo năng lực "1 PR → N PO" TRÊN DỮ LIỆU THẬT).
 * @param {Array<{request_id:string, n:number}>} rows — đầu ra GROUP BY request_id.
 */
export function demMrNhieuPo(rows) {
  return rows.filter((r) => Number(r.n || 0) >= 2).length;
}

/**
 * Tìm dòng PR bị đặt VƯỢT số lượng đã duyệt.
 * @param {Array<{id:string, approved:number, ordered:number}>} rows
 * @returns {Array<{id:string, approved:number, ordered:number, vuot:number}>} chỉ các dòng vượt.
 */
export function dongVuotSoLuong(rows) {
  const ra = [];
  for (const r of rows) {
    const approved = Number(r.approved || 0);
    const ordered = Number(r.ordered || 0);
    if (ordered > approved + DUNG_SAI_SL) {
      ra.push({ ...r, approved, ordered, vuot: ordered - approved });
    }
  }
  return ra;
}

/**
 * So tổng đặt hàng tính từ dòng PO (`SUM(poi.ordered_qty)`) với tổng đã ghi trên dòng PR.
 * Lệch ⇒ rollup của engine và dòng PR KHÔNG khớp nhau.
 * @param {Array<{id:string, mriOrdered:number, poiSum:number}>} rows
 * @returns {Array<{id:string, mriOrdered:number, poiSum:number, lech:number}>} chỉ các dòng lệch.
 */
export function lechTong(rows) {
  const ra = [];
  for (const r of rows) {
    const mriOrdered = Number(r.mriOrdered || 0);
    const poiSum = Number(r.poiSum || 0);
    const lech = mriOrdered - poiSum;
    if (Math.abs(lech) > DUNG_SAI_SL) ra.push({ ...r, mriOrdered, poiSum, lech });
  }
  return ra;
}

/**
 * Gộp số liệu một cặp cột quan hệ thành dòng báo cáo toàn vẹn tham chiếu.
 */
export function theThamChieu(d) {
  const r = doQuanHe(d);
  return {
    quanHe: `${d.bang}.${d.cot} → ${d.dichBang}.${d.dichCot}`,
    ...r,
    viDu: d.viDu || [],
    duaTrenQuyUoc: true, // CSDL 0 FK ⇒ mọi quan hệ chỉ do quy ước/mã ứng dụng gánh
  };
}

/**
 * Kết luận chung: ĐẠT khi không có quan hệ/chặng nào mồ côi.
 * @param {Array<{dat:boolean, quanHe?:string, ten?:string}>} ds
 */
export function ketLuan(ds) {
  const hong = ds.filter((x) => !x.dat);
  return { dat: hong.length === 0, hong, soHong: hong.length, soTong: ds.length };
}
