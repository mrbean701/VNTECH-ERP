// T16 — HỢP ĐỒNG: ⛔ **CẤM ký hiệu định dạng (`%s` · `%d` · `%n` …) trong CHÚ THÍCH SQL** của mọi text block
// đi qua `String.formatted(...)` — và khoá bản vá `BUG-D27` (lọc `wi.active=1`) khỏi bị revert âm thầm.
//
// ⚠️ VÌ SAO CÓ TEST NÀY (nguồn: `BUG-20261009-D32` — 🔴 sự cố THẬT · HIGH · do `ERP-SESSION-01` gây ra):
//   Bản vá `BUG-D27` thêm **chú thích SQL** vào text block của câu payload `work_items`, và trong chú thích
//   có viết ký hiệu định dạng `%s`. Java KHÔNG phân biệt chú thích SQL với mã SQL trong text block ⇒
//   `.formatted(workItemWhere)` thấy **2 ký hiệu định dạng nhưng chỉ 1 tham số** ⇒
//   `java.util.MissingFormatArgumentException: Format specifier '%s'` ⇒ 🔴 **HTTP 500** ở `/api/bootstrap`
//   (⭐ đo được: log `api-d27c.out` 16:29 · cổng `probe-workitems-active.mjs` báo «payload HTTP 500»).
//   ⇒ ⭐ Test này khoá lại: ⛔ đừng bao giờ viết `%` trong chú thích SQL của text block.
//
// 📏 BÀI HỌC KÈM THEO (⚠️ cũng là hợp đồng vận hành, ghi ở đây để không mất):
//   ⛔ **KHÔNG được đóng gói jar khi tiến trình API còn chạy** — trên Windows `java -jar` **KHOÁ tệp jar**
//   ⇒ `spring-boot:repackage` FAIL ⇒ jar bị thay bằng **jar mỏng** ⇒ API ⛔ không khởi động được
//   («no main manifest attribute»). ⭐ ĐÚNG THỨ TỰ: **dừng API (đúng PID) → `mvn package` → khởi động lại**.
//
// Chạy: node --import tsx --test tests/t16-java-sql-textblock-format.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// ⚠️ ĐO ĐƯỢC (09/10/2026): `new URL(...).pathname` trả đường dẫn **ĐÃ MÃ HOÁ** (dấu cách ⇒ `%20`) ⇒
// `readdirSync` ném `ENOENT … scandir 'D:\13.%20Duong%20Trong%20Thang\…'`. ⭐ Dùng `fileURLToPath` (API chuẩn).
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const JAVA_ROOT = join(ROOT, "java-backend");

/** Liệt kê mọi tệp `.java` (⛔ bỏ `target/` = mã sinh ra). */
function javaFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "target") continue;
      out.push(...javaFiles(full));
    } else if (name.endsWith(".java")) {
      out.push(full);
    }
  }
  return out;
}

const files = javaFiles(JAVA_ROOT);

test("T16 — quét được mã Java (⛔ không quét rỗng âm thầm)", () => {
  assert.ok(files.length > 50, `phải tìm thấy nhiều tệp .java (tìm được ${files.length})`);
});

test("T16 — ⛔ KHÔNG chú thích SQL nào chứa ký hiệu định dạng (% · %s · %d …) — nguồn của BUG-20261009-D32", () => {
  const offenders = [];
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      // Chú thích SQL trong text block: dòng bắt đầu bằng `--` (cho phép thụt lề) và có ký tự `%`.
      if (/^\s*--.*%/.test(line)) {
        offenders.push(`${relative(ROOT, file)}:${i + 1}  ${line.trim().slice(0, 110)}`);
      }
    });
  }
  assert.deepEqual(
    offenders,
    [],
    "⛔ CẤM ký hiệu định dạng trong chú thích SQL: text block đi qua `.formatted(...)` ⇒ " +
    "MissingFormatArgumentException ⇒ HTTP 500 (đúng sự cố BUG-20261009-D32). " +
    "Nếu cần nhắc ký hiệu đó trong chú thích, viết chữ (vd «phần-trăm-s») hoặc bỏ hẳn:\n" +
    offenders.join("\n"),
  );
});

test("T16 — khoá bản vá BUG-D27: payload `work_items` PHẢI lọc `wi.active=1` (⛔ không revert âm thầm)", () => {
  const src = readFileSync(join(JAVA_ROOT, "infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java"), "utf8");
  // ⚠️ `%s` ở đây là ký hiệu định dạng THẬT của câu SQL (1 tham số = `workItemWhere`) ⇒ hợp lệ.
  assert.match(
    src,
    /WHERE \(%s\) AND wi\.active=1/,
    "câu payload `work_items` phải là `WHERE (%s) AND wi.active=1` — ⚠️ BẮT BUỘC bọc ngoặc vì `%s` là " +
    "biểu thức OR phức tạp; ⛔ KHÔNG lọc theo `status` (COMPLETED/CANCELLED vẫn active=1 và PHẢI HIỆN)",
  );
});
