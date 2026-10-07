// BẢN ĐỒ HỆ THỐNG — đăng nhập, đọc bootstrap, liệt kê action đã biết.
import { login, bootstrap, tomTat, call, tieuDe } from "./client.mjs";

tieuDe("BẢN ĐỒ HỆ THỐNG");

await login("admin", "Admin123456@");
const bs = await bootstrap();
const tt = tomTat(bs);
const keys = Object.keys(tt);
console.log("  bootstrap: " + keys.length + " khoa\n");

let tong = 0;
const coDuLieu = [];
for (const k of keys) {
  if (typeof tt[k] === "number") {
    tong += tt[k];
    if (tt[k] > 0) coDuLieu.push([k, tt[k]]);
  }
}
console.log("  --- CO DU LIEU (" + coDuLieu.length + "/" + keys.length + " khoa) ---");
for (const [k, n] of coDuLieu) console.log("    " + String(n).padStart(5) + "  " + k);

const rong = keys.filter((k) => typeof tt[k] === "number" && tt[k] === 0);
console.log("\n  --- RONG (" + rong.length + ") ---");
console.log("    " + rong.join(", "));

const phiMang = keys.filter((k) => typeof tt[k] !== "number");
console.log("\n  --- KHONG PHAI MANG (" + phiMang.length + ") ---");
console.log("    " + phiMang.join(", "));
console.log("\n  tong phan tu trong mang: " + tong);

// Liệt kê action mà mã nguồn biết — tìm trong backend Java + scripts.
console.log("\n  (buoc tiep theo: boc action tu ma nguon backend)");

const probe = await call("khong_ton_tai_action_197", {}, { lenient: true });
console.log("  action sai → " + JSON.stringify(probe._loi));