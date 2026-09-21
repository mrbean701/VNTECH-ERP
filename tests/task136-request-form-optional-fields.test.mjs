// TASK-136 — 4 chỉnh sửa giao diện form "Lập đề nghị cấp vật tư" (+2 chỗ đổi tên cho nhất quán)
//
// Hợp đồng kiểm tra (bám NGUYÊN VĂN yêu cầu người dùng):
//   (1) Dự án / Hợp đồng / BOQ Version  ⇒ KHÔNG bắt buộc (bỏ dấu ` *` + bỏ `required`)
//   (2) "Kho nguồn dự kiến"          ⇒ đổi nhãn thành "Kho"
//   (3) "Ngày cần vật tư tại công trường" ⇒ đổi thành "Ngày cần" (3 nơi: form + form-fields + PDF)
//   (4) Gửi phiếu KHÔNG còn popup `window.confirm("Bạn có chắc chắn muốn gửi phiếu này?…")`
//   (5) Máy chủ KHÔNG được 400/500 khi các trường trên rỗng (project_id/area là NOT NULL trong CSDL
//       ⇒ phải luôn điền một giá trị hợp lệ, KHÔNG đổi schema).
//
// Chạy: node --import tsx --test tests/task136-request-form-optional-fields.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

const PAGE = read("app/page.tsx");
const FORM_FIELDS = read("lib/form-fields.ts");
const EXPORT = read("lib/request-export.ts");
const USE_CASE = read(
  "java-backend/application/src/main/java/com/vntech/erp/application/service/RequestManagementUseCase.java",
);
const PORT = read("java-backend/application/src/main/java/com/vntech/erp/application/port/out/RequestStore.java");
const ADAPTER = read(
  "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/RequestStoreAdapter.java",
);

/** Cắt đúng vùng form `RequestModal` — tránh dương tính giả từ các modal khác trong file. */
function requestModalRegion() {
  const start = PAGE.indexOf("function RequestModal(");
  assert.ok(start > 0, "không tìm thấy RequestModal trong app/page.tsx");
  const end = PAGE.indexOf("function LineEditor(", start);
  assert.ok(end > start, "không tìm thấy mốc kết thúc vùng RequestModal");
  return PAGE.slice(start, end);
}

const OLD_NEEDED_LABEL = "Ngày cần vật tư tại công trường";
const OLD_WAREHOUSE_LABEL = "Kho nguồn dự kiến";
const OLD_CONFIRM = "Bạn có chắc chắn muốn gửi phiếu này";

test("TASK-136 (0) chốt an toàn: chuỗi cũ vẫn tồn tại ở bản đang sửa để phép kiểm có ý nghĩa", () => {
  // Nếu repo đã sạch từ trước thì các phép kiểm dưới đây là vô nghĩa ⇒ phải đọc lại đề bài.
  assert.ok(PAGE.includes("function RequestModal("), "app/page.tsx phải còn RequestModal");
});

test("TASK-136 (1) Dự án/Hợp đồng/BOQ Version KHÔNG còn bắt buộc trên form", () => {
  const region = requestModalRegion();
  assert.ok(
    !/label\("projectId","Dự án"\)\} \*/.test(region),
    'nhãn Dự án còn dấu " *" (phải bỏ ⇒ không bắt buộc)',
  );
  assert.ok(
    !/setImportError\(""\);\}\} required>/.test(region),
    "select Dự án còn thuộc tính required",
  );
  assert.ok(!/<span>Hợp đồng \*<\/span>/.test(region), 'nhãn Hợp đồng còn dấu " *"');
  assert.ok(!/<span>BOQ Version \*<\/span>/.test(region), 'nhãn BOQ Version còn dấu " *"');
  assert.ok(
    !/setPreviewSummary\(null\);\}\} required>/.test(region),
    "select Hợp đồng/BOQ Version còn thuộc tính required",
  );
  // Vẫn PHẢI giữ select để người dùng chọn khi muốn (không được xoá trường).
  assert.ok(/name="projectId"/.test(region), "vẫn phải giữ select Dự án để chọn khi cần");
});

test("TASK-136 (2) nhãn kho đổi thành đúng chữ “Kho”, giữ nguyên select kho", () => {
  const region = requestModalRegion();
  assert.ok(!region.includes(OLD_WAREHOUSE_LABEL), `còn nhãn cũ "${OLD_WAREHOUSE_LABEL}"`);
  assert.ok(/<span>Kho<\/span>/.test(region), 'chưa có nhãn "<span>Kho</span>"');
  assert.ok(/name="sourceWarehouseId"/.test(region), "phải giữ nguyên select kho nguồn");
});

test("TASK-136 (3) “Ngày cần vật tư tại công trường” ⇒ “Ngày cần” ở cả 3 nơi hiển thị", () => {
  assert.ok(
    !requestModalRegion().includes(OLD_NEEDED_LABEL),
    `form còn nhãn cũ "${OLD_NEEDED_LABEL}"`,
  );
  assert.ok(
    /label\("neededAt","Ngày cần"\)/.test(requestModalRegion()),
    'form chưa dùng mặc định "Ngày cần" cho neededAt',
  );
  assert.ok(!FORM_FIELDS.includes(OLD_NEEDED_LABEL), "lib/form-fields.ts còn tên cũ");
  assert.ok(
    /fieldKey:"neededAt", displayName:"Ngày cần"/.test(FORM_FIELDS),
    'lib/form-fields.ts chưa đổi displayName neededAt thành "Ngày cần"',
  );
  assert.ok(!EXPORT.includes(OLD_NEEDED_LABEL), "lib/request-export.ts (bản in PDF/Excel) còn nhãn cũ");
  assert.ok(/Ngày cần: \$\{viDate\(doc\.neededAt\)\}/.test(EXPORT), "bản in chưa đổi nhãn thành “Ngày cần”");
});

test("TASK-136 (4) gửi phiếu không còn popup xác nhận", () => {
  const region = requestModalRegion();
  assert.ok(!region.includes(OLD_CONFIRM), `còn popup "${OLD_CONFIRM}"`);
  assert.ok(!/window\.confirm\(/.test(region), "vùng form vẫn còn window.confirm");
  // Các kiểm tra nghiệp vụ khác PHẢI còn nguyên.
  assert.ok(/lines\.length<1\|\|lines\.length>100/.test(region), "mất kiểm tra 1–100 dòng");
  assert.ok(/matchStatus&&row\.matchStatus!=="exact"/.test(region), "mất kiểm tra dòng chưa map BOQ");
});

test("TASK-136 (5) máy chủ chịu được projectId/contractId/BOQ rỗng (KHÔNG đổi schema)", () => {
  // (5a) rỗng ⇒ rơi về dự án mặc định trong phạm vi tài khoản thay vì lỗi cứng
  assert.ok(
    USE_CASE.includes("defaultProjectIdForUser"),
    "createRequest chưa rơi về dự án mặc định của tài khoản khi projectId rỗng",
  );
  assert.ok(
    PORT.includes("defaultProjectIdForUser"),
    "RequestStore chưa khai báo defaultProjectIdForUser",
  );
  assert.ok(
    ADAPTER.includes("defaultProjectIdForUser"),
    "RequestStoreAdapter chưa cài defaultProjectIdForUser",
  );
  assert.ok(
    /project_id\) NOT NULL|`project_id` VARCHAR\(64\) NOT NULL/.test(
      read("java-backend/infrastructure/src/main/resources/db/migration/V1__baseline.sql"),
    ),
    "cột material_requests.project_id phải vẫn NOT NULL (TASK-136 KHÔNG được đổi schema)",
  );
  // (5b) không còn chốt cứng "phải có dự án và ít nhất một dòng vật tư"
  assert.ok(
    !/projectId\.isEmpty\(\) \|\| rawLines\.isEmpty\(\)/.test(USE_CASE),
    "còn chốt cứng projectId bắt buộc trong createRequest",
  );
  // (5c) hợp đồng rỗng không được ném lỗi khi dự án không có hợp đồng mặc định
  assert.ok(
    !/requestedContractId\.isEmpty\(\)\s*\n?\s*\? store\.defaultContract\(projectId\)/.test(USE_CASE) ||
      USE_CASE.includes("resolveContractOrNull"),
    "resolveContract vẫn ném lỗi khi hợp đồng rỗng",
  );
});
