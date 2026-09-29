// USER 28/09/2026 — Dua CA «Nhà cung cấp» + «Đối tác» XUONG CUOI nhom «purchasing» (sidebar).
// ⚠️ ĐIỂM CHÈN ĐÃ ĐO (không đoán): khối `group.children.map` của sidebar kết thúc bằng
//    `</button>; })}</div>}` — chèn NGAY TRƯỚC `</div>}` đó.
// ⛔ KHÔNG đổi dữ liệu `supplierPartnerMenuItems` (probe P-07 vẫn phải xanh).
import { readFileSync, writeFileSync } from "node:fs";

const F = "app/page.tsx";
let t = readFileSync(F, "utf8");

// ① CẮT khối sidebar đang nằm TRƯỚC group.children
const START = '{groupKey==="purchasing"&&supplierPartnerMenuChildren.map';
const s0 = t.indexOf(START);
if (s0 < 0) { console.log("  FAIL khong tim thay khoi purchasing"); process.exit(1); }
const e0rel = t.indexOf(";})}", s0);
if (e0rel < 0) { console.log("  FAIL khong tim thay ket thuc khoi"); process.exit(1); }
const e0 = e0rel + 4;
const block = t.slice(s0, e0);
if (!block.includes("supplierPartnerBadge") && !block.includes("supplierPartnerMenuBadge")) {
  console.log("  FAIL khoi cat ra khong dung"); process.exit(1);
}
const gAt = t.indexOf("group.children.map");
if (s0 > gAt) { console.log("  (khoi da o SAU group.children — khong can di chuyen)"); process.exit(0); }
t = t.slice(0, s0) + t.slice(e0);
console.log("  · da CAT khoi sidebar (" + block.length + " ky tu)");

// ② CHÈN ngay trước `</div>}` kết thúc khối children của sidebar
const ANCHOR = '<span>{item.label}</span>{badge > 0 && <b>{badge}</b>}</button>; })}</div>}';
const n = t.split(ANCHOR).length - 1;
if (n !== 1) { console.log("  FAIL diem chen xuat hien " + n + " lan (mong doi 1)"); process.exit(1); }
t = t.replace(ANCHOR, '<span>{item.label}</span>{badge > 0 && <b>{badge}</b>}</button>; })}' + block + '</div>}');
console.log("  · da CHEN khoi xuong cuoi nhom purchasing (ngay truoc </div>})");

writeFileSync(F, t, "utf8");
console.log("  OK · da ghi " + F);

// ③ TỰ KIỂM: vị trí mới phải SAU group.children
const t2 = readFileSync(F, "utf8");
const g2 = t2.indexOf("group.children.map");
const p2 = t2.indexOf(START);
console.log("  TU KIEM: group.children=" + g2 + " · khoi purchasing=" + p2 +
  " ⇒ " + (p2 > g2 ? "✅ ĐÚNG — ĐỐI TÁC/NCC Ở CUỐI" : "🔴 SAI — vẫn ở trước"));
