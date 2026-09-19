// PHASE 7 (`AD-15`) — HỢP ĐỒNG AUDIT: PHỤ THUỘC CỦA MÀN «CẤU HÌNH HỆ THỐNG» → GHI BACKLOG.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-15`: «Audit phụ thuộc; nếu không ảnh hưởng roadmap → **ghi backlog**».
//
// BẰNG CHỨNG ĐỌC ĐƯỢC (test tự xác minh): bước 12 «Cấu hình hệ thống» ghép 5 khối phụ thuộc khác nhau —
// `FormFieldConfigManager` · `UiDisplaySettingsManager` · `FactoryResetAdmin` · `TrustLockAdmin` ·
// nhật ký cấu hình (đọc `data.audits`). Mỗi khối có action GHI riêng; một số phụ thuộc nằm NGOÀI roadmap
// (ví dụ hệ license/trust, đã tạm hoãn ở nhánh bảo mật) ⇒ phải vào BACKLOG chứ không kéo vào PHASE 7.
//
// Chạy riêng:  node --test tests/ad15-config-audit.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const page = read("app/page.tsx");
const DOC = "docs/agent-progress/AD-15-CAU-HINH-PHU-THUOC-AUDIT.md";

function configBlock() {
  const start = page.indexOf("{step===12&&");
  const end = page.indexOf("function draftRequestDocument", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy nhánh `step===12` (Cấu hình hệ thống)");
  return page.slice(start, end);
}

test("AD-15 — màn Cấu hình hệ thống có ĐÚNG 5 khối phụ thuộc đã khai (không bịa thêm)", () => {
  const block = configBlock();
  const parts = [
    ["FormFieldConfigManager", "Cấu hình cột/biểu mẫu", "save_form_field_config"],
    ["UiDisplaySettingsManager", "Tùy chỉnh giao diện", "save_ui_display_settings"],
    ["FactoryResetAdmin", "Factory reset", "factory_reset"],
  ];
  for (const [component, label] of parts) {
    assert.ok(block.includes(`<${component}`), `Thiếu khối phụ thuộc «${label}» (${component})`);
  }
  assert.match(block, /<TrustLockAdmin/, "Khối tin cậy/khóa phải được ghi nhận (đã tạm hoãn ở nhánh bảo mật)");
  assert.match(block, /Nhật ký cấu hình hệ thống/, "Khối nhật ký cấu hình phải được ghi nhận");
  // Cổng đối chứng: đếm đúng 5 khối.
  const count = ["FormFieldConfigManager", "UiDisplaySettingsManager", "FactoryResetAdmin", "TrustLockAdmin", "Nhật ký cấu hình hệ thống"]
    .filter((key) => block.includes(key)).length;
  assert.equal(count, 5, "Phải đủ ĐÚNG 5 khối phụ thuộc");
});

test("AD-15 — mỗi khối phụ thuộc dùng action GHI ĐÃ CÓ (chứng minh không cần mở rộng backend)", () => {
  const js = read("scripts/system-route.mjs");
  const java = read("java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");
  for (const action of ["save_form_field_config", "save_ui_display_settings", "factory_reset_execute"]) {
    const inAny = js.includes(`"${action}"`) || java.includes(`case "${action}"`);
    assert.ok(inAny, `Action «${action}» phải tồn tại ở ít nhất 1 trong 2 đường ghi`);
  }
  // Tên action THẬT mà UI đang gọi (đo được trong app/page.tsx, không suy đoán).
  assert.match(page, /action\("reorder_form_fields"/, "Khối cột/biểu mẫu phải gọi action thật `reorder_form_fields`");
  assert.match(page, /action\("save_ui_display_settings"/, "Khối giao diện phải gọi action thật `save_ui_display_settings`");
  assert.match(page, /requestApi\("factory_reset_execute"/, "Khối factory reset phải gọi action thật `factory_reset_execute`");
});

test("AD-15 — TÀI LIỆU: verdict + bảng phụ thuộc + phần BACKLOG ghi rõ KHÔNG ảnh hưởng roadmap", () => {
  assert.ok(existsSync(new URL(DOC, root)), `Thiếu tài liệu bắt buộc ${DOC}`);
  const text = readFileSync(new URL(DOC, root), "utf8");
  assert.match(text, /CONFIRMED|LIKELY|UNKNOWN/, "Phải có kết luận phân loại");
  assert.match(text, /BACKLOG/i, "Phải có phần BACKLOG (yêu cầu nguyên văn của AD-15)");
  assert.match(text, /không ảnh hưởng (roadmap|đến roadmap)/i, "Phải khẳng định rõ không ảnh hưởng roadmap");
  assert.match(text, /TrustLockAdmin|license/i, "Phải nêu ít nhất 1 phụ thuộc thuộc nhánh đã tạm hoãn");
  assert.match(text, /app\/page\.tsx|java-backend|scripts\//, "Phải trích dẫn bằng chứng tệp");
  // Đối chứng âm cho cổng tài liệu.
  const gate = (t) => /BACKLOG/i.test(t) && /không ảnh hưởng (roadmap|đến roadmap)/i.test(t);
  assert.equal(gate(text), true);
  assert.equal(gate("Cấu hình hệ thống phụ thuộc nhiều thứ."), false, "[đối chứng âm] văn xuôi không có BACKLOG ⇒ HỎNG");
});
