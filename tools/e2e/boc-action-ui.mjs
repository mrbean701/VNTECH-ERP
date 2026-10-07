// BÓC TÊN ACTION từ mã gọi thật của giao diện: submit("x") / action("x") trong app/ và lib/.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const THU_MUC = ["app", "lib", "scripts"];
const tap = [];
const quet = (dir) => {
  for (const ten of readdirSync(dir)) {
    const p = join(dir, ten);
    if (statSync(p).isDirectory()) { quet(p); continue; }
    if (/\.(ts|tsx|mjs)$/.test(ten)) tap.push(p);
  }
};
for (const d of THU_MUC) { try { quet(d); } catch { /* thu muc khong ton tai */ } }

const RE = /(?:submit|action|doAction|runAction|post|dispatch)\s*\(\s*["']([a-z][a-z_0-9]{2,})["']/g;
const timThay = new Map();
for (const f of tap) {
  const s = readFileSync(f, "utf8");
  let m;
  RE.lastIndex = 0;
  while ((m = RE.exec(s))) {
    const ten = m[1];
    if (!timThay.has(ten)) timThay.set(ten, new Set());
    timThay.get(ten).add(f);
  }
}

const nhom = (ten) => {
  if (/^(save|create|update|delete|add|register)_?(organization_unit|department|user|role|team|project|warehouse|site_command|business_role|position|staff)/.test(ten)) return "quan-tri";
  if (/(workflow|approval|step|approve|decide)/.test(ten)) return "workflow";
  if (/(hr|labor|contract|benefit|insurance|personnel)/.test(ten)) return "nhan-su";
  if (/(material|categor|subcategor|alias|supplier|partner)/.test(ten)) return "ke-toan-vat-tu";
  if (/(request|purchase_order|create_po|po_|split|supplier|order)/.test(ten)) return "mua-hang";
  if (/(receipt|receive|issue|return|transfer|stock|inventory|warehouse|count)/.test(ten)) return "kho";
  return "khac";
};

const nhomTat = {};
for (const [ten] of [...timThay].sort()) (nhomTat[nhom(ten)] ||= []).push(ten);

let tong = 0;
for (const [n, ds] of Object.entries(nhomTat)) {
  console.log("\n--- " + n.toUpperCase() + " (" + ds.length + ") ---");
  console.log("    " + ds.join(", "));
  tong += ds.length;
}
console.log("\n  TONG: " + tong + " ten action goi tu ma giao dien, doc o " + tap.length + " tep.");

const duLieu = {};
for (const [ten, fs] of timThay) duLieu[ten] = { nhom: nhom(ten), trong: [...fs] };
writeFileSync("tools/e2e/action-ui.json", JSON.stringify(duLieu, null, 2), "utf8");