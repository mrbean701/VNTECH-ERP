// MT2-P1-03b — HỢP ĐỒNG: BÀI HỌC H2 phải ghi ĐÚNG «PHẢI KHAI Ở CẢ 2 NƠI» (entity + schema-h2 ALTER).
// Vì sao có test này: ghi chú cũ («ALTER trong schema-h2 bị Hibernate xoá ⇒ chỉ cần khai ở entity») đã khiến
// người sau BỎ ALTER và làm ĐỎ 38 test (đo thật ở MT2-P1-03). Bài học phải bám vào DỮ KIỆN KIỂM ĐƯỢC trong repo,
// ⛔ không phải một câu văn trôi nổi: nếu ai đó đổi `ddl-auto` hoặc xoá khối `[H2-MANUAL-*]`, test này ĐỎ.
// Chạy: node --import tsx --test tests/p1-03b-h2-lesson.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const url = (p) => new URL(p, import.meta.url);
const read = (p) => readFileSync(url(p), "utf8");
const doc = read("../docs/18_KE_HOACH_SUA_LOI_HIEN_THI_MENU_PHAN_QUYEN_WORKFLOW.md");
const testYml = read("../java-backend/web/src/test/resources/application-test.yml");
const schema = read("../java-backend/web/src/test/resources/schema-h2.sql");
const entity = read("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/jpa/UserJpaEntity.java");

test("P1-03b — bài học cũ (d) ĐÃ được đánh dấu CHƯA ĐỦ + nêu quy tắc mới", () => {
  assert.match(doc, /GHI CHÚ \(d\) \*\*CHƯA ĐỦ\*\*/, "phải có khối cập nhật đánh dấu ghi chú (d) CHƯA ĐỦ");
  assert.match(doc, /PHẢI KHAI Ở CẢ 2 NƠI/, "phải nêu rõ quy tắc: khai ở CẢ entity VÀ schema-h2");
  assert.match(doc, /0 Failures \/ \*\*38 Errors\*\*/, "phải kèm BẰNG CHỨNG SỐ đã đo (38 Errors trước khi vá)");
});

test("P1-03b — DỮ KIỆN nền của bài học còn đúng trong repo", () => {
  assert.match(testYml, /ddl-auto: none/, "profile test phải là `ddl-auto: none` (lược đồ H2 = schema-h2.sql)");
  assert.match(schema, /\[H2-MANUAL-START\]/, "schema-h2.sql phải còn khối [H2-MANUAL-START] để đặt ALTER");
  assert.match(entity, /@Column\(name = "signature_url"/, "entity phải khai cột (vế thứ nhất của quy tắc 2 vế)");
});

test("P1-03b — có bản sao THỨ HAI của schema H2 được nhắc trong bài học (⛔ không sửa sót)", () => {
  // ⚠️ ĐƯỜNG DẪN ĐÚNG đo bằng `glob **/schema-h2.sql`: bản TEST ở `web/src/test/resources`,
  // bản DEMO/DEV ở `web/src/main/resources/db/demo` — ⛔ KHÔNG có `db/demo/schema-h2.sql` ở gốc repo.
  const demo = "../java-backend/web/src/main/resources/db/demo/schema-h2.sql";
  assert.ok(existsSync(url(demo)), "bản sao DEMO/DEV phải tồn tại thật");
  assert.match(doc, /java-backend\/web\/src\/main\/resources\/db\/demo\/schema-h2\.sql/,
    "bài học phải nhắc ĐÚNG đường dẫn bản sao thứ hai");
  assert.match(doc, /java-backend\/web\/src\/test\/resources\/schema-h2\.sql/,
    "bài học phải nhắc đường dẫn bản TEST");
});
