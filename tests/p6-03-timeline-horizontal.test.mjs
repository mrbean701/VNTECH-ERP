// MT2-P6-03 (§4.3) — HỢP ĐỒNG REGRESSION: timeline phê duyệt dạng NGANG `bước 1 o----o bước 2 o----o …`.
// Nguyên văn §4.3: «⛔ Không hiển thị dạng cột dọc. Thiết kế bắt buộc: Bước 1 o----o Bước 2 …».
// ⚠️ TRUNG THỰC: baseline ĐÃ có (`ApprovalTimeline` mặc định `layout="horizontal"` + CSS `.vt-timeline.is-horizontal`)
// ⇒ đây là **KHOÁ REGRESSION viết sau**, ⛔ KHÔNG giả vờ đỏ→xanh.
// Chạy: node --import tsx --test tests/p6-03-timeline-horizontal.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const timeline = read("../app/components/ui/Timeline.tsx");
const css = read("../app/styles/canonical.css");

test("P6-03 — `ApprovalTimeline` MẶC ĐỊNH NGANG (⛔ không phải cột dọc)", () => {
  assert.match(timeline, /layout = "horizontal"/, "mặc định phải là `horizontal` (§4.3)");
  assert.match(timeline, /layout === "horizontal" \? " is-horizontal"/, "phải gắn lớp `is-horizontal`");
  assert.match(timeline, /data-vntech="approval-timeline"/, "giữ marker nghiệm thu DOM của dải duyệt");
});

test("P6-03 — CSS xếp NGANG + có ĐƯỜNG NỐI giữa hai marker (o----o)", () => {
  assert.match(css, /\.vt-timeline\.is-horizontal \{[\s\S]{0,120}flex-direction: row;/, "dải ngang phải `flex-direction: row`");
  assert.match(css, /\.vt-timeline\.is-horizontal \.vt-timeline-step:not\(:last-child\)::before \{[\s\S]{0,160}height: 2px;/,
    "đường nối NGANG (height 2px, chạy từ marker này sang marker kế)");
});

test("P6-03 — §24 RESPONSIVE: màn hẹp (<768px) tự về DỌC để ⛔ không tràn layout", () => {
  assert.match(css, /@media \(max-width: 768px\) \{[\s\S]{0,220}\.vt-timeline\.is-horizontal \{ flex-direction: column; overflow-x: visible; \}/,
    "dưới 768px phải chuyển dọc + bỏ cuộn ngang");
});

test("P6-03 — bước CHƯA TỚI LƯỢT vẫn hiện NGƯỜI DUYỆT · PHÒNG BAN · THỜI GIAN (yêu cầu user 26/09/2026)", () => {
  // USER 26/09/2026: «cần hiển thị thông tin cơ bản về AI ĐÃ DUYỆT, PHÒNG BAN NÀO, THỜI GIAN DUYỆT»
  // ⇒ mỗi bước phải thấy được khối thông tin. ⛔ Luật cũ (`.is-waiting … {display:none}`) đã bỏ.
  assert.doesNotMatch(css, /\.vt-timeline-step\.is-waiting \.vt-timeline-meta,\s*\n?\s*\.vt-timeline-step\.is-waiting \.vt-timeline-note \{ display: none; \}/,
    "⛔ KHÔNG được ẩn thông tin người duyệt/phòng ban/thời gian ở bước chưa duyệt (user yêu cầu thấy đủ thông tin)");
  assert.match(css, /\.vt-timeline-step\.is-waiting \.vt-timeline-meta \{ opacity:/,
    "bước chưa duyệt chỉ làm MỜ thông tin, ⛔ không ẩn");
  // Khối thông tin phải đủ 3 mục: người duyệt · phòng ban · thời gian.
  const meta = timeline.slice(timeline.indexOf("vt-timeline-meta"));
  assert.match(meta, /Người duyệt:/, "phải hiện Người duyệt");
  assert.match(meta, /Phòng ban:/, "phải hiện Phòng ban");
  assert.match(meta, /Thời gian:/, "phải hiện Thời gian");
});
