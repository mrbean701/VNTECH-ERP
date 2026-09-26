// TASK-137 — Hợp đồng kiểm tra 5 điểm form "Lập đề nghị cấp vật tư"
// (bám NGUYÊN VĂN phản hồi người dùng 21/09/2026)
//
//   (1) Ô Dự án LUÔN hiển thị `<select>` (bỏ nhánh ẩn khi tài khoản chỉ có 1 dự án) và KHÔNG bắt buộc
//   (2) Hợp đồng hiển thị nhưng KHÔNG bắt buộc
//   (3) BOQ Version hiển thị nhưng KHÔNG bắt buộc
//   (4) Mọi ô KHÔNG bắt buộc có mục "— Tùy chọn (để trống) —"
//       (ô Kho giữ "Mua mới / chưa xác định" — lựa chọn có chủ đích, đã ghi rõ trong hồ sơ)
//   (5) "Phạm vi / Khu vực thi công" ⇒ "Ghi chú" (cả form và default `lib/form-fields.ts`)
//   (+) KHÔNG phá luồng đối chiếu Excel: nút "↻ Đối chiếu lại" vẫn `disabled` khi thiếu Hợp đồng/BOQ
//   (+) Đường gửi rỗng: `submit("create_request",{...payload,projectId,…})` — state rỗng đi thẳng lên server
//
// Cách chạy:
//   GREEN (bản đang có):  node --import tsx --test tests/task137-request-form-final-check.test.mjs
//   RED (bản TRƯỚC khi sửa, để chứng minh test có ý nghĩa):
//     $env:VNTECH_PAGE_SRC="<temp>\page-truoc-sua.tsx"; $env:VNTECH_FORM_FIELDS_SRC="<temp>\form-fields-truoc-sua.ts"
//     node --import tsx --test tests/task137-request-form-final-check.test.mjs   # phải ĐỎ
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PAGE = readFileSync(process.env.VNTECH_PAGE_SRC || path.join(ROOT, "app/page.tsx"), "utf8");
const FORM_FIELDS = readFileSync(process.env.VNTECH_FORM_FIELDS_SRC || path.join(ROOT, "lib/form-fields.ts"), "utf8");

/** Cắt đúng vùng `RequestModal` để tránh dương tính giả từ các modal/màn khác trong cùng tệp. */
function requestModalRegion() {
  const start = PAGE.indexOf("function RequestModal(");
  assert.ok(start > 0, "không tìm thấy RequestModal trong app/page.tsx");
  const end = PAGE.indexOf("function LineEditor(", start);
  assert.ok(end > start, "không tìm thấy mốc kết thúc vùng RequestModal");
  return PAGE.slice(start, end);
}

const EMPTY_OPTION = '<option value="">— Tùy chọn (để trống) —</option>';
const OLD_PROJECT_OPTION = "— Chọn dự án cụ thể —";
const OLD_AREA_LABEL = "Phạm vi / Khu vực thi công";
const OLD_AREA_PLACEHOLDER = "Tầng / khu / phạm vi";

test("TASK-137 (0) chốt an toàn: vùng RequestModal phải tồn tại để các phép kiểm có ý nghĩa", () => {
  assert.ok(requestModalRegion().includes('name="projectId"'), "vùng form phải còn select Dự án (`name=\"projectId\"`)");
});

test("TASK-137 (1) ô Dự án LUÔN hiện select và KHÔNG bắt buộc", () => {
  const region = requestModalRegion();
  assert.ok(
    !region.includes("data.projects.length===1?<strong"),
    "còn nhánh ẩn select khi tài khoản chỉ có 1 dự án (phải bỏ ⇒ luôn hiển thị để chọn)",
  );
  assert.ok(region.includes("{lockedProject?<strong"), "phải giữ nhánh khoá theo dự án màn hình ngoài `lockedProject`");
  assert.ok(region.includes('<select name="projectId" value={projectId}'), "phải còn select Dự án bind state `projectId`");
  assert.ok(!region.includes("setImportError(\"\");}} required>"), "select Dự án còn thuộc tính `required`");
  assert.ok(!/label\("projectId","Dự án"\)\} \*/.test(region), 'nhãn Dự án còn dấu " *"');
  assert.ok(!region.includes(OLD_PROJECT_OPTION), `còn mục rỗng cũ "${OLD_PROJECT_OPTION}"`);
  assert.ok(
    region.includes('"Không bắt buộc: có thể để trống — phiếu sẽ không thuộc dự án nào"'),
    "chưa có ghi chú mới: không bắt buộc / có thể để trống",
  );
});

test("TASK-137 (2)+(3) Hợp đồng và BOQ Version hiển thị nhưng KHÔNG bắt buộc", () => {
  const region = requestModalRegion();
  assert.ok(!/<span>Hợp đồng \*<\/span>/.test(region), 'nhãn Hợp đồng còn dấu " *"');
  assert.ok(!/<span>BOQ Version \*<\/span>/.test(region), 'nhãn BOQ Version còn dấu " *"');
  assert.ok(!region.includes("Chọn hợp đồng</option>"), 'còn mục rỗng cũ "Chọn hợp đồng"');
  assert.ok(!region.includes("Chọn phiên bản BOQ</option>"), 'còn mục rỗng cũ "Chọn phiên bản BOQ"');
  assert.ok(region.includes("<span>Hợp đồng</span>"), "phải giữ nhãn Hợp đồng (hiển thị để chọn)");
  assert.ok(region.includes("<span>BOQ Version</span>"), "phải giữ nhãn BOQ Version (hiển thị để chọn)");
});

test("TASK-137 (4) mọi ô không bắt buộc có mục “— Tùy chọn (để trống) —”; ô Kho giữ nhãn nghiệp vụ", () => {
  const region = requestModalRegion();
  const count = region.split(EMPTY_OPTION).length - 1;
  assert.ok(count >= 3, `phải có ít nhất 3 mục "${EMPTY_OPTION}" (Dự án/Hợp đồng/BOQ), đang có ${count}`);
  assert.ok(
    region.includes('<option value="">Mua mới / chưa xác định</option>'),
    "ô Kho phải giữ mục rỗng mang nghĩa nghiệp vụ “Mua mới / chưa xác định”",
  );
  assert.ok(!/<span>Kho<\/span>[^]{0,80}\srequired/.test(region), "ô Kho không được có `required`");
});

test("TASK-137 (5) “Phạm vi / Khu vực thi công” ⇒ “Ghi chú” ở cả form và default cấu hình trường", () => {
  const region = requestModalRegion();
  assert.ok(!region.includes(OLD_AREA_LABEL), `form còn nhãn cũ "${OLD_AREA_LABEL}"`);
  assert.ok(region.includes('label("area","Ghi chú")'), 'form chưa dùng mặc định "Ghi chú" cho trường area');
  assert.ok(!region.includes(OLD_AREA_PLACEHOLDER), `form còn placeholder cũ "${OLD_AREA_PLACEHOLDER}"`);
  assert.ok(region.includes('placeholder="Ghi chú cho phiếu (không bắt buộc)"'), "placeholder chưa đổi cho khớp");
  assert.ok(!FORM_FIELDS.includes(OLD_AREA_LABEL), "lib/form-fields.ts còn tên cũ của trường area");
  assert.ok(FORM_FIELDS.includes('fieldKey:"area", displayName:"Ghi chú"'), 'lib/form-fields.ts chưa đổi default area thành "Ghi chú"');
  assert.ok(!/fieldKey:"projectId"[^}]*required:true/.test(FORM_FIELDS), "default projectId vẫn còn required:true");
  assert.ok(/fieldKey:"area"[^}]*required:false/.test(FORM_FIELDS), "default area phải là required:false");
});

test("TASK-137 (+) KHÔNG phá luồng đối chiếu Excel và đường gửi rỗng", () => {
  const region = requestModalRegion();
  // Đối chiếu khối lượng vẫn cần đủ Hợp đồng + BOQ Version (chỉ việc LẬP PHIẾU mới không bắt buộc).
  assert.ok(
    region.includes("disabled={!contractId||!boqVersionId}"),
    'nút "↻ Đối chiếu lại" phải giữ điều kiện disabled khi thiếu Hợp đồng/BOQ',
  );
  assert.ok(
    region.includes('if(!projectId||!contractId||!boqVersionId)throw new Error('),
    "hàm preview() phải còn chốt Dự án/Hợp đồng/BOQ trước khi đối chiếu",
  );
  // Giá trị rỗng đi thẳng lên server (projectId/contractId/boqVersionId là state, không bị FormData ghi đè).
  assert.ok(
    region.includes('submit("create_request",{...payload,projectId,contractId,boqVersionId,lines})'),
    "payload create_request phải gửi projectId/contractId/boqVersionId từ state (rỗng ⇒ chuỗi rỗng)",
  );
  assert.ok(region.includes("const [projectId,setProjectId]=useState("), "phải còn state projectId");
});
