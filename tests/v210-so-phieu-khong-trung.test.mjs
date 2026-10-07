/**
 * VÒNG 210 — Khoá bất biến đặt số phiếu kho (L-06).
 *
 * BẤT BIẾN (đã được MÃ NGUỒN tự viết ra tại StockManagementUseCase.java:972):
 *   Khi bộ đếm đếm THEO TỪNG DỰ ÁN mà cột số phiếu có chỉ mục UNIQUE TOÀN CỤC,
 *   thì số phiếu BẮT BUỘC phải kèm mã dự án — nếu không, dự án thứ hai trong
 *   cùng năm chắc chắn sinh ra một số phiếu đã tồn tại.
 *
 * Vì sao tệp thử này đọc mã nguồn chứ không gọi API:
 *   Máy này KHÔNG có Maven (D-044) ⇒ phần Java không bao giờ biên dịch được ở đây.
 *   Đây là cách duy nhất để chặn hồi quy cho mã Java mà vẫn xác minh được.
 *
 * Vì sao phải có ĐỐI CHỨNG ÂM:
 *   Một tệp thử xanh mà không bắt được lỗi thì vô dụng (xem D-086).
 *   Cách kiểm: sửa nguồn cho vi phạm ⇒ tệp thử phải ĐỎ ⇒ hoàn tác.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

const useCase = read(
  "java-backend/application/src/main/java/com/vntech/erp/application/service/StockManagementUseCase.java",
);
const adapter = read(
  "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/WarehouseStockStoreAdapter.java",
);

const lines = useCase.split(/\r?\n/);

// ─────────────────────────────────────────────────────────────────────────────
// Thu thập mọi chỗ đặt số có bộ đếm theo (project, year).
// Mẫu bắt buộc phải bám đúng cách gọi thật: nextSequenceNo("X:" + projectId + ":" + year, ...)
// ─────────────────────────────────────────────────────────────────────────────
function timChiDoTheoDuAn() {
  const ket = [];
  lines.forEach((d, i) => {
    const m = d.match(/nextSequenceNo\("([^"]+):"\s*\+\s*projectId\s*\+\s*":"\s*\+\s*year/);
    if (m) ket.push({ tienTo: m[1], dong: i + 1 });
  });
  return ket;
}

/**
 * Lấy phần mã (BỎ dòng chú thích) ngay sau lệnh lấy bộ đếm, dừng trước lệnh lấy bộ đếm kế tiếp.
 * Cần bỏ chú thích vì chính dòng chú thích về PX đã chứa chuỗi `"PX-` và sẽ bị khớp nhầm.
 * Cần dừng ở lệnh kế tiếp vì nếu không, một số phiếu "đúng" của chỗ sau có thể
 * làm chỗ trước tưởng đã đúng (tệp thử xanh vì lý do sai).
 */
function maSauLenhDem(dong) {
  const cat = [];
  for (let i = dong; i < lines.length; i++) {
    if (i > dong && /nextSequenceNo\(/.test(lines[i])) break;
    if (lines[i].trim().startsWith("//")) continue;
    cat.push(lines[i]);
  }
  return cat.join("\n");
}

test("VỆ 1 — thu thập được mọi chỗ đặt số có bộ đếm theo từng dự án", () => {
  const sites = timChiDoTheoDuAn();
  // PX, GRN-STO, GRN-PX, RET, CENTRAL_RETURN, KK  = 6 chỗ. Cần ≥ 6 để tệp thử
  // không âm thầm rơi xuống 0 và trở thành "xanh vô nghĩa".
  assert.ok(
    sites.length >= 6,
    `Chỉ tìm thấy ${sites.length} chỗ đặt số theo dự án (cần ≥ 6). ` +
      `Nếu mã đã đổi, phải sửa lại tệp thử cho khớp — KHÔNG được hạ ngưỡng để "cho xanh".`,
  );
  // Tên tiền tố phải là những cái thật, tránh khớp nhầm chuỗi rác.
  const ten = sites.map((s) => s.tienTo);
  for (const kyVong of ["PX", "GRN-PX", "GRN-STO", "RET", "KK"]) {
    assert.ok(ten.includes(kyVong), `Không còn chỗ đặt số "${kyVong}" — tệp thử có thể đã lệch với mã.`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LỖI ĐÃ BIẾT, CHƯA SỬA ĐƯỢC — nêu tên tường minh thay vì giấu đi.
// Khi ai đó vá được thì XOÁ khỏi danh sách này, tệp thử vẫn xanh.
// ─────────────────────────────────────────────────────────────────────────────
const DA_BIET_CHUA_SUA = new Set(["GRN-STO"]);

test("VỆ 2 — chỗ đếm theo dự án thì số phiếu phải kèm mã dự án", () => {
  const sites = timChiDoTheoDuAn();
  const loi = [];
  for (const s of sites) {
    if (DA_BIET_CHUA_SUA.has(s.tienTo)) continue;
    // Số phiếu là chỗ có `String.format("%04d")` — nhận diện bằng DÒNG MÃ đặt số,
    // KHÔNG dựa vào tên khoá đếm: tên khoá và tiền tố trên số phiếu có thể khác nhau
    // (CENTRAL_RETURN ↔ KT-RET-, TRANSFER ↔ TRF-).
    const ma = maSauLenhDem(s.dong);
    if (!/String\.format\("%0/.test(ma)) {
      loi.push(`${s.tienTo} (dòng ${s.dong}): không tìm thấy dòng dựng số phiếu (String.format("%04d")).`);
      continue;
    }
    if (!ma.includes("projectCode")) {
      loi.push(
        `${s.tienTo} (dòng ${s.dong}): số phiếu KHÔNG kèm mã dự án — ` +
          `dự án thứ hai trong cùng năm sẽ đụng số phiếu đã có.`,
      );
    }
  }
  assert.equal(
    loi.length,
    0,
    `Phát hiện ${loi.length} chỗ đặt số vi phạm bất biến:\n   - ` + loi.join("\n   - "),
  );
});

test("VỆ 3 — danh sách lỗi tồn đọng phải đúng thực tế, không phình ra", () => {
  const sites = timChiDoTheoDuAn();
  const ten = sites.map((s) => s.tienTo);
  for (const tenCu of DA_BIET_CHUA_SUA) {
    assert.ok(
      ten.includes(tenCu),
      `Danh sách lỗi tồn đọng có "${tenCu}" nhưng mã không còn chỗ đặt số đó — ` +
        `nếu đã vá thì hãy XOÁ nó khỏi DA_BIET_CHUA_SUA.`,
    );
  }
  // GRN-STO vẫn chưa kèm mã dự án — xác nhận đúng tình trạng đang ghi, không phải giả định.
  const siteSto = sites.find((s) => s.tienTo === "GRN-STO");
  const maSto = maSauLenhDem(siteSto.dong);
  assert.match(maSto, /String\.format\("%0/, "GRN-STO: không còn tìm thấy dòng dựng số phiếu.");
  assert.ok(!maSto.includes("projectCode"), "GRN-STO đã được vá — cập nhật lại ghi chú D-087.");
});

test("VỆ 4 — GRN-PX đã vá: số phiếu kèm mã dự án", () => {
  assert.match(
    useCase,
    /String receiptNo = "GRN-PX-" \+ sv\(issue, "projectCode"\)\.toUpperCase\(\) \+ "-" \+ year/,
    "Số phiếu GRN-PX phải kèm mã dự án (vá D-087).",
  );
});

test("VỆ 5 — nguồn số phải được lấy thật, không để sinh số rỗng", () => {
  // `stock_issues` KHÔNG có cột project_code. Nếu JOIN bị mất, sv(...) trả ""
  // ⇒ sinh ra "GRN-PX--2026-0001" và VẪN TRÙNG. Phải chặn cả trường hợp này.
  const khoi = adapter.match(/findStockIssueFull\(String issueId\) \{[\s\S]*?\n {4}\}/);
  assert.ok(khoi, "Không tìm thấy findStockIssueFull trong WarehouseStockStoreAdapter.");
  assert.match(
    khoi[0],
    /p\.code AS "projectCode"/,
    "findStockIssueFull phải lấy p.code AS projectCode — nếu không, số phiếu sẽ là GRN-PX--<năm>-0001.",
  );
  assert.match(
    khoi[0],
    /LEFT JOIN projects p ON p\.id=si\.project_id/,
    "findStockIssueFull phải JOIN projects theo project_id để lấy mã dự án.",
  );
});

test("VỆ 6 — quy tắc phải được chính mã nguồn ghi lại, không chỉ nằm trong tệp thử", () => {
  // Quy tắc đã có sẵn trong mã (dòng ~972). Nếu ai đó xoá comment này thì bất biến
  // mất dấu vết và sẽ bị vi phạm lại mà không ai nhận ra.
  assert.match(
    useCase,
    /unique TOÀN CỤC, sequence lại đếm theo \(project, year\)/,
    "Mất comment giải thích bất biến đặt số — hãy khôi phục.",
  );
});