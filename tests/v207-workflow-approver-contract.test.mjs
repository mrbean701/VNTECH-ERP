// VÒNG 207 — KHÓA HỢP ĐỒNG UI ↔ SERVER cho màn «Quy trình phê duyệt» (D-085).
//
// VÌ SAO CÓ TEST NÀY:
// `WorkflowModal.tsx:151` từng hiển thị câu «theo chế độ CHỈ CẢNH BÁO, quy trình VẪN lưu được».
// Câu đó MÔ TẢ SAI: server `OpsTaskManagementUseCase.java:704` từ chối tuyệt đối
// `if (userIds.isEmpty()) throw Api("Bước … chưa chỉ định người duyệt.");` — không tồn tại chế độ chỉ cảnh báo.
// Bản ghi cũ còn SAI hơn: cho rằng UI cho phép lưu bước không có người duyệt. Thực tế `WorkflowModal.tsx:70`
// ĐÃ chặn sẵn. ⇒ Cả hai lỗi đều là lỗi MÔ TẢ, không phải lỗi hành vi.
//
// Bài học mà test này khóa lại: CÂU CHỮ trong UI là bằng chứng về HÀNH VI thì chưa đủ —
// phải kiểm tra CẢ HAI vế: (1) UI có thật sự chặn trước khi gọi API không,
// và (2) câu chữ có khớp với điều server thật sự làm không.
// Chỉ kiểm tra vế (2) thì sẽ tái phát đúng lỗi «bản ghi cũ SAI».
//
// Chạy riêng:  node --test tests/v207-workflow-approver-contract.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const modal = read("app/screens/WorkflowModal.tsx");
const server = read(
  "java-backend/application/src/main/java/com/vntech/erp/application/service/OpsTaskManagementUseCase.java",
);

test("VỆ 1 — UI CHẶN thật trước khi gọi API khi bước chưa có người duyệt", () => {
  // Vế (1): hành vi. Không có `return` ⇒ vẫn gọi `submit` ⇒ người dùng mất một vòng gọi thất bại.
  const chan = modal.match(/if \(!users\.length\)\s*return\s+setError\([^;]*;/);
  assert.ok(chan, "Thiếu lệnh chặn khi bước chưa có người duyệt (thay đổi `return setError` thành gọi API trực tiếp).");
  // `return` phải nằm TRƯỚC lời gọi `submit("save_workflow"` ⇒ chặn mới có tác dụng.
  const viTriChan = modal.indexOf(chan[0]);
  const viTriSubmit = modal.indexOf('submit("save_workflow"');
  assert.ok(viTriSubmit > 0, "Không tìm thấy lời gọi `submit(\"save_workflow\"…` trong modal.");
  assert.ok(viTriChan < viTriSubmit, "Lệnh chặn phải nằm TRƯỚC lời gọi submit, nếu không thì chặn là vô nghĩa.");
});

test("VỆ 2 — server THẬT SỰ từ chối bước không có người duyệt (không có chế độ chỉ cảnh báo)", () => {
  // Vế (2) phía server: điều UI nói tới phải có thật trong mã nguồn.
  const tuChoi = server.match(/if \(userIds\.isEmpty\(\)\)\s*throw\s+Api\([^;]*;/);
  assert.ok(tuChoi, "Server không còn từ chối bước không có người duyệt — phải cập nhật lại câu chữ ở UI cho khớp.");
  assert.match(
    tuChoi[0],
    /chưa chỉ định người duyệt/,
    "Thông báo từ chối phải nói rõ «chưa chỉ định người duyệt» để câu chữ UI có thể dẫn lại đúng.",
  );
});

test("VỆ 3 — câu chữ cảnh báo ở UI KHÔNG được hứa rằng vẫn lưu được", () => {
  // Chính là lỗi đã sửa ở D-085. Giữ test để lỗi này không quay lại.
  assert.doesNotMatch(
    modal,
    /VẪN lưu được/,
    "Câu chữ «VẪN lưu được» là SAI: server từ chối tuyệt đối. Đừng hứa người dùng điều hệ thống không làm.",
  );
  assert.doesNotMatch(
    modal,
    /CHỈ CẢNH BÁO/,
    "Không tồn tại chế độ «CHỈ CẢNH BÁO» ở màn quy trình — không được viết ra như thể có.",
  );
});

test("VỆ 4 — cảnh báo hiển thị đúng nghĩa với điều kiện chặn", () => {
  // Cảnh báo phải nói rằng phải có người duyệt thì mới lưu được — tức là mô tả đúng việc bị chặn.
  // Phải khớp ĐÚNG cảnh báo `inline-alert`, KHÔNG phải dòng `menu-drop-empty` ngay trên nó
  // (cả hai đều chứa chữ «người duyệt») — bản đầu vì regex lỏng đã khớp nhầm dòng kề.
  const canhBao = modal.match(/!selected\.length &&[^\n]*inline-alert[^\n]*/);
  assert.ok(canhBao, "Không tìm thấy cảnh báo `inline-alert` cho bước chưa có người duyệt.");
  assert.match(canhBao[0], /mới lưu được/, "Cảnh báo phải nói rõ chưa có người duyệt thì KHÔNG lưu được.");
});

test("VỆ 5 — chế độ «một người duyệt» giữ được bất biến số người được chọn", () => {
  // Vế bổ sung: nếu UI cho chọn 2 người ở chế độ «single» thì vẫn chặn ở VỆ 1-adjacent, phải khớp server :706.
  const serverSingle = server.match(/if \([^\n]*"single"[^\n]*\)\s*\n?\s*throw Api\([^;]*;/);
  assert.ok(serverSingle, "Server phải từ chối chế độ «một người duyệt» khi chọn nhiều hơn một người.");
  assert.match(
    modal,
    /approvalMode\) === "single" && users\.length > 1/,
    "UI phải chặn trước chế độ «một người duyệt» bị chọn nhiều người.",
  );
});