// MT2 §10.4 (đề án ②A user chốt 26/09/2026) — HỢP ĐỒNG: KHÓA VĂN BẢN PHÁP LÝ ↔ CÔNG VĂN.
//
// VÌ SAO CẦN: `legal_documents` và `official_correspondence` vốn là HAI bảng độc lập, KHÔNG có khoá
// liên kết ⇒ không tra cứu được «văn bản này sinh ra từ công văn nào» (khối chặn BLK-04 của MT2).
// Phương án ②A đã được user duyệt: THÊM MỘT CỘT KHOÁ, ⛔ KHÔNG tạo bảng mới, ⛔ KHÔNG nhân bản dữ liệu.
//
// Cách kiểm (đủ 4 tầng theo GOAL §16 — DB → BACKEND → API → UI):
//   (1) DB: có migration MỚI thêm cột + index; cột NULL ⇒ dữ liệu cũ không bị ảnh hưởng (GOAL §19).
//   (2) H2: cột phải khai Ở CẢ HAI bản schema H2 (bài học MT2-P1-03b: `ddl-auto: none`).
//   (3) BACKEND: port/adapter/use-case truyền `correspondenceId`; payload bootstrap trả về khoá này.
//   (4) PARITY + UI: JS `system-route.mjs` phải ghi cùng cột; màn Văn bản pháp lý phải CHỌN được công văn.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

const migrationName = "java-backend/infrastructure/src/main/resources/db/migration/V31__mt2_p10_05_legal_document_correspondence_link.sql";
const h2Test = "java-backend/web/src/test/resources/schema-h2.sql";
const h2Demo = "java-backend/web/src/main/resources/db/demo/schema-h2.sql";
const port = "java-backend/application/src/main/java/com/vntech/erp/application/port/out/HrStore.java";
const adapter = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/HrStoreAdapter.java";
const useCase = "java-backend/application/src/main/java/com/vntech/erp/application/service/HrManagementUseCase.java";
const bootstrap = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java";
const jsRoute = "scripts/system-route.mjs";
const screen = "app/screens/LegalDocsScreen.tsx";

test("P10-05 (1) DB — có migration MỚI thêm cột `correspondence_id` + index, cột cho phép NULL", () => {
  assert.ok(existsSync(new URL("../" + migrationName, import.meta.url)), "phải có file migration V31 (⛔ không sửa V1 đã chạy)");
  const sql = read(migrationName);
  assert.match(sql, /ALTER TABLE `legal_documents`[\s\S]{0,80}ADD COLUMN `correspondence_id` VARCHAR\(64\) NULL/,
    "phải thêm cột `correspondence_id` cho phép NULL (dữ liệu cũ không bị ảnh hưởng)");
  assert.match(sql, /CREATE INDEX `idx_legal_documents_correspondence`/, "phải có index tra cứu theo công văn");
  assert.doesNotMatch(sql, /DROP |TRUNCATE |DELETE FROM/i, "GOAL §19 — ⛔ không thao tác phá dữ liệu");
});

test("P10-05 (2) H2 — cột phải khai ở CẢ HAI bản schema (bài học MT2-P1-03b: ddl-auto none)", () => {
  for (const file of [h2Test, h2Demo]) {
    const schema = read(file).slice(read(file).indexOf("CREATE TABLE IF NOT EXISTS `legal_documents`"));
    assert.match(schema.slice(0, 900), /`correspondence_id` VARCHAR\(64\) NULL/,
      `${file}: thiếu cột ⇒ test H2 sẽ đỏ hàng loạt`);
  }
});

test("P10-05 (3) BACKEND — port/adapter/use-case truyền `correspondenceId`, bootstrap trả khoá", () => {
  const p = read(port), a = read(adapter), u = read(useCase), b = read(bootstrap);
  assert.match(p, /void insertLegalDocument\([\s\S]{0,400}String correspondenceId,/,
    "port `insertLegalDocument` phải nhận `correspondenceId`");
  assert.match(p, /void updateLegalDocument\([\s\S]{0,400}String correspondenceId,/,
    "port `updateLegalDocument` phải nhận `correspondenceId`");
  assert.match(a, /INSERT INTO legal_documents \([\s\S]{0,300}correspondence_id/, "INSERT phải ghi cột mới");
  assert.match(a, /UPDATE legal_documents SET[\s\S]{0,300}correspondence_id=\?/, "UPDATE phải ghi cột mới");
  assert.match(u, /nvl\(payload\.get\("correspondenceId"\)\)/, "use-case phải đọc `correspondenceId` từ payload");
  assert.match(b, /d\.correspondence_id AS correspondenceId/, "payload bootstrap phải trả `correspondenceId` để UI tra cứu");
});

test("P10-05 (4) PARITY JS + UI — JS ghi cùng cột; màn VB pháp lý CHỌN được công văn từ payload có sẵn", () => {
  const js = read(jsRoute);
  const block = js.slice(js.indexOf('if (action === "save_legal_document")')).slice(0, 1800);
  assert.match(block, /correspondenceId=clean\(payload\.correspondenceId\)/, "JS phải đọc `correspondenceId` (giữ parity với Java)");
  assert.match(block, /INSERT INTO legal_documents\([\s\S]{0,300}correspondence_id/, "JS INSERT phải ghi cột mới");
  assert.match(block, /UPDATE legal_documents SET[\s\S]{0,300}correspondence_id=\?/, "JS UPDATE phải ghi cột mới");

  const ui = read(screen);
  assert.match(ui, /data\.officialCorrespondence/, "UI phải dùng payload `officialCorrespondence` (⛔ KHÔNG tạo bảng/dữ liệu mới)");
  assert.match(ui, /name="correspondenceId"/, "form phải có ô chọn công văn liên kết");
  // ⛔ KHÔNG nhân bản dữ liệu công văn: chỉ tra cứu theo id từ payload.
  assert.doesNotMatch(ui, /officialCorrespondence\.push|save_official_correspondence/, "⛔ không được nhân bản/ghi công văn từ màn văn bản pháp lý");
});
