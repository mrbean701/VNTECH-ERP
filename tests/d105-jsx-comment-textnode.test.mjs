// VÒNG 1 (GO-LIVE) · D-105 — LỚP LỖI: COMMENT JSX KHÔNG BỌC NGOẶC NHỌN BỊ VẼ RA MÀN HÌNH.
//
// SỰ CỐ ĐÃ XẢY RA THẬT: khi xoá đoạn văn thừa ở MỤC 3, tôi thay bằng một comment
// `/* … */` đặt TRỰC TIẾP giữa các phần tử con trong `return ( … )` của JSX.
//   · ESLint báo `react/jsx-no-comment-textnodes` — ĐÚNG.
//   · `tsc` EXIT=0 — KHÔNG bắt.
//   · 7 vệ của `tests/v1-muc3-…` ĐỀU XANH — KHÔNG bắt.
//   · Build vẫn ĐẠT, cổng UI vẫn 3/3 ✓, `npm test` chỉ FAIL ở chính lint.
// ⇒ CHỈ ESLINT BẮT ĐƯỢC. Tệp này đưa quy tắc đó vào tầng test để lỗi KHÔNG lọt tới màn nữa,
//   và để khi sửa JSX mà quên bọc thì đỏ NGAY, không phải tới lúc người dùng chụp màn hình.
//
// NGUYÊN TẮC: trong JSX, chỉ `{/* … */}` mới là comment. `/* … */` đứng giữa children ⇒ TEXT NODE.
//
// CHẠY RIÊNG: node --import tsx --test tests/d105-jsx-comment-textnode.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// ⛔ Đường dẫn repo này CÓ KHOẢNG TRẮNG và DẤU CHẤM ⇒ `url.pathname` trả về dạng `%20…` và sẽ
//   ENOENT. Phải dùng `fileURLToPath` (giải mã %20) — đã dính lỗi này 1 lần rồi.
const duongDan = (u) => fileURLToPath(u);
const APP_DIR = duongDan(new URL("../app/", import.meta.url));
const PURCHASING = duongDan(new URL("../app/screens/Purchasing.tsx", import.meta.url));

// Bỏ chú thích (D-088) để không tự bắt chính mình bằng lời giải thích.
const maCode = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(name)) out.push(full);
  }
  return out;
}

/**
 * Trả về mọi comment đặt TRỰC TIẾP giữa các phần tử con JSX — tức dòng bắt đầu bằng dấu gạch chéo
 * mà không có `{` ngay trước, nằm trong vùng `return ( … )` của component.
 * ⛔ D-102(d): KHÔNG được viết cặp đóng bình luận vào JSDoc này — parser sẽ đóng sớm tại đó.
 * Dòng bắt đầu bằng `{` + dấu gạch chéo, hoặc kết thúc bằng dấu gạch chéo + `}`, là hợp lệ.
 */
function commentTranXuyenLe(src, file) {
  const dong = [];
  const lines = src.split(/\r?\n/);
  // ⛔ PHẢI quét trên MÃ NGUỒN THÔ, KHÔNG phải trên `maCode(src)`: hàm bóc chú thích xoá sạch
  //   chính những comment cần tìm ⇒ vệ trở nên RỖNG (đã dính đúng lỗi này, xem D-106).
  // ⛔ Không cắt vùng bằng `indexOf("return (")`: chữ "return (" có thể nằm trong chú thích hoặc
  //   trong một component khác trước đó ⇒ cắt sai chỗ và bỏ sót lỗi thật.
  // ⇒ DÙNG CHIỀU SÂU KHUNG (D-101): chỉ dò khi đang ở SỐ LẺ 1 ngoặc nhọn ⇒ tức là con trực tiếp
  //   của JSX trong `return (…)`, và bỏ qua mọi thứ bên trong `{…}` biểu thức.
  let depth = 0; // 0 = ngoài `return (…)`; 1 = ngay trong JSX children; >1 = trong `{…}`
  for (const raw of lines) {
    const cat = raw.replace(/\s+$/, "");
    const truoc = cat.replace(/^\s*/, "");
    // ⛔ KHÔNG dùng cờ `sauReturn` chỉ bật MỘT LẦN: tệp có nhiều component ⇒ các `return (…)`
    //   sau bị bỏ sót (đã dính, V2 bắt được). Mỗi `return (` phải ĐẶT LẠI chiều sâu = 1.
    // ⛔ VÀ phải nhận CẢ `return <div …>` KHÔNG có ngoặc tròn: `Purchasing.tsx:307` viết đúng kiểu
    //   đó, nên phép dò `return (` đã trượt và chiều sâu mãi bằng 0 ⇒ vệ RỖNG (D-101).
    if (/(^|[=(:,;])\s*return\s*[<(]/.test(truoc)) {
      depth = 1;
      continue;
    }
    // 1) Dò lỗi TRƯỚC khi cập nhật chiều sâu: depth === 1 nghĩa là con trực tiếp của JSX.
    if (depth === 1 && /^\/\*(?!\*)/.test(truoc)) {
      dong.push(`${file}: comment JSX không bọc {} → bị vẽ ra màn: ${truoc.slice(0, 70)}`);
      continue;
    }
    // 2) Cập nhật chiều sâu: `{` mở, `}` đóng, bỏ qua nội dung chuỗi để không đếm nhầm.
    if (depth < 1) continue;
    let i = 0;
    while (i < cat.length) {
      const ch = cat[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        const dau = cat.indexOf(ch, i + 1);
        i = dau < 0 ? cat.length : dau + 1;
        continue;
      }
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
      i += 1;
    }
  }
  return dong;
}

test("D-105 V1 — trong app/ KHONG co comment JSX tran xuyen le (khong boc {} nen se bi ve chu ra man)", () => {
  const files = walk(APP_DIR);
  const loi = [];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    loi.push(...commentTranXuyenLe(src, file.replace(/^.*?app\\/, "app\\")));
  }
  assert.deepEqual(
    loi,
    [],
    `comment JSX khong boc {} se bi VE RA MAN HINH:\n${loi.join("\n")}\n` +
      `Sua: doi thanh "/* … */" thanh "{/* … */}".`,
  );
});

test("D-105 V2 — DOC CHUNG AM: bo {} o mau thi V1 phai DO (chung minh V1 khong rong)", () => {
  const mau = "  return (\n    <div>\n      /* comment lo — neu thay bang text node thi se bi ve ra man */\n      <b>x</b>\n    </div>\n  );";
  const timThay = commentTranXuyenLe(mau, "mau.tsx");
  assert.equal(timThay.length, 1, `mau phai bi bat, hien tai = ${timThay.length}`);
  assert.match(timThay[0], /comment lo/, "phai tro ve dung dong comment do");

  const mauHopLe = "  return (\n    <div>\n      {/* comment da boc ngoac nhon */}\n      <b>x</b>\n    </div>\n  );";
  assert.deepEqual(commentTranXuyenLe(mauHopLe, "mau.tsx"), [], "mau hop le khong duoc bao loi");
});

test("D-105 V3 — Purchasing.tsx phai dung comment DA BOC trong vung JSX cua no", () => {
  const file = PURCHASING;
  const loi = commentTranXuyenLe(readFileSync(file, "utf8"), "Purchasing.tsx");
  assert.deepEqual(loi, [], `Purchasing.tsx con comment tran xuyen le:\n${loi.join("\n")}`);
});