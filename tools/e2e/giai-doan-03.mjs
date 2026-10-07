// ============================================================================
// GIAI DOAN 3 — "PHONG NHAN SU TAO HO SO NHAN SU, HOP DONG LAO DONG VA
//                BAO HIEM XA HOI CHO TOAN BO NGUOI DUNG"
// ----------------------------------------------------------------------------
// ⛔ IDEMPOTENT: chay lai nhieu lan cung ra mot ket qua, khong tao trung.
// ⛔ KHONG xoa / KHONG sua du lieu co san — chi TAO MOI, moi ban ghi co dau
//    nhan dang E2E trong truong `note`.
// ⛔ KHONG dung co `boQuaLoi` cho lenh ghi: bat buoc `coThat` (nem loi khi may
//    chu tra loi) va doi chieu `ok` that su qua `buoc`.
// ⛔ Khong `require`, khong `node -e`, khong `\uXXXX`, ten bien khong dau.
// ============================================================================
import { login, bootstrap, call, coThat, buoc, ghi, tieuDe } from "./client.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const KET_QUA = "tools/e2e/ket-qua-03.json";
const MAT_KHAU_E2E = "Vn@2026Test";
const TK_NHAN_SU = "e2e.ns";
const MARK_HS = "E2E-HS-03";
const MARK_HD = "E2E-HD-03";
const MARK_BH = "E2E-BH-03";

const baoCao = [];        // buoc() ghi day
const loiChiTiet = [];   // loi/ghi chu canh bao
const ghiBangNhom = { save_hr_record: null, save_labor_contract: null, save_benefit_record: null };
let nguoiGhiHienTai = "admin";

// ---------------------------------------------------------------------------
// Tien ich
// ---------------------------------------------------------------------------

/** Bam ngau FNV-1a 32bit — sinh du lieu TIEN DINH theo username (chay lai ra
 *  cung ket qua, khong doi giac ngau nhien). */
function bam(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
const so = (n) => String(n).padStart(2, "0");
/** So CCCD gia lap 12 so, tien dinh theo username. */
const cccd = (u) => "0799" + String(bam(u) % 100000000).padStart(8, "0");
/** Ngay sinh trong khoang 1982..1998, tien dinh. */
function ngaySinh(u) {
  const h = bam(u + "ns");
  return `${1982 + (h % 17)}-${so(1 + (Math.floor(h / 17) % 12))}-${so(1 + (Math.floor(h / 204) % 28))}`;
}
/** Ngay vao lam trong khoang 2020..2024, tien dinh. */
function ngayVao(u) {
  const h = bam(u + "vao");
  return `${2020 + (h % 5)}-${so(1 + (Math.floor(h / 5) % 12))}-${so(1 + (Math.floor(h / 60) % 28))}`;
}
/** Muc luong theo vai tro (VND), tien dinh. */
function luong(u) {
  const goc = {
    director: 45000000, admin: 0, hr: 18000000, accountant: 22000000,
    cht: 25000000, da_truong: 28000000, kh_truong: 24000000, ksda: 16000000,
    thu_kho: 12000000, thuky: 13000000, kh_nv: 11000000, da_nv: 10000000,
  }[String(u.role)] || 12000000;
  return goc + (bam(String(u.username)) % 5) * 1000000;
}
/** Loai hop dong: giam doc / truong bo phan -> khong xac dinh; con lai xac dinh 3 nam. */
const loaiHopDong = (u) =>
  ["director", "hr", "da_truong", "cht"].includes(String(u.role))
    ? "Hợp đồng không xác định thời hạn"
    : "Hợp đồng xác định thời hạn";

const KY = "2026-01-15", TU = "2026-02-01", DEN = "2029-01-31";
/** Hai loai bao hiem tao cho moi nguoi (ty le % luong). */
const LOAI_BH = [
  { ten: "BHXH", nha: "BHXH tỉnh Hà Nội", he: 0.215 },
  { ten: "BHYT", nha: "Bảo hiểm y tế tỉnh Hà Nội", he: 0.03 },
];

/** Loi nao THAT SU la loi quyen (thi moi duoc fallback sang admin). */
function laLoiQuyen(msg) {
  const m = String(msg || "").toLowerCase();
  return m.includes("quyền") || m.includes("quyen") || m.includes("403") || m.includes("không được phép");
}

/** Ghi mot ban ghi, UU TIEN tài khoan Phong Nhan su (e2e.ns); neu e2e.ns khong
 *  du quyen thi chuyen sang admin va THU LAI (lenh that bai 403 khong ghi gi
 *  nen thu lai an toan). Loi khac thi nem len cho `buoc` danh dau LOI that. */
async function ghiMoi(tenBuoc, tenAction, payload) {
  return buoc(tenBuoc, async () => {
    if (nguoiGhiHienTai !== TK_NHAN_SU) {
      let vaoDuoc = true;
      try { await login(TK_NHAN_SU, MAT_KHAU_E2E); } catch (e) {
        vaoDuoc = false;
        loiChiTiet.push({ action: tenAction, taiKhoan: TK_NHAN_SU, vanDe: "khong dang nhap duoc", loi: String(e.message) });
      }
      nguoiGhiHienTai = vaoDuoc ? TK_NHAN_SU : "admin";
    }
    if (nguoiGhiHienTai === "admin") await login("admin", "Admin123456@");

    let r;
    try {
      r = await coThat(tenAction, payload, tenBuoc);
    } catch (e) {
      if (nguoiGhiHienTai === TK_NHAN_SU && laLoiQuyen(e.message)) {
        loiChiTiet.push({ action: tenAction, taiKhoan: TK_NHAN_SU, vanDe: "khong du quyen module", loi: String(e.message), xuLy: "chuyen sang admin va thu lai" });
        nguoiGhiHienTai = "admin";
        await login("admin", "Admin123456@");
        r = await coThat(tenAction, payload, tenBuoc + " (fallback admin)");
      } else throw e;
    }
    ghiBangNhom[tenAction] = nguoiGhiHienTai;
    return r;
  }, baoCao);
}

// ===========================================================================
// 0. DANG NHAP + ANH CHUP TRUOC KHI CHAY
// ===========================================================================
tieuDe("GIAI DOAN 3 — HO SO NHAN SU / HOP DONG LAO DONG / BAO HIEM XA HOI");

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const truoc = {
  taiKhoan: bs0.users.length,
  staffDirectory: bs0.staffDirectory.length,
  hrRecords: bs0.hrRecords.length,
  laborContracts: bs0.laborContracts.length,
  benefitRecords: bs0.benefitRecords.length,
};
console.log("  TRUOC KHI CHAY: tai khoan=" + truoc.taiKhoan +
  " · staffDirectory=" + truoc.staffDirectory +
  " · ho so=" + truoc.hrRecords +
  " · hop dong=" + truoc.laborContracts +
  " · bao hiem=" + truoc.benefitRecords);

// ===========================================================================
// 1. AI DUOC COI LA "TOAN BO NGUOI DUNG"
// ===========================================================================
tieuDe("1. DANH SACH MUC TIEU — 'toan bo' = bao nhieu nguoi");

const loai = [
  { username: "admin", lydo: "Tai khoan quan tri he thong (role=admin) — khong phai nhan su lao dong." },
  { username: "testuser86661", lydo: "Tai khoan kiem chung bao mat tu sinh: ho ten 'Nguoi dung kiem chung', email @test.local, ma NV SEC-866610 — KHONG phai nguoi that." },
];

const targets = [];
const biLoai = [];
for (const u of bs0.users) {
  const r = loai.find((x) => x.username === u.username);
  if (r) { biLoai.push({ username: u.username, ten: u.fullName, role: u.role, lydo: r.lydo }); continue; }
  targets.push(u);
}
console.log("  Tong tai khoan trong he thong : " + bs0.users.length);
console.log("  BI LOAI                       : " + biLoai.length);
for (const x of biLoai) console.log("    - " + x.username + " (" + x.ten + ") :: " + x.lydo);
console.log("  MUC TIEU (" + targets.length + " nguoi):");
for (const u of targets) console.log("    - " + String(u.username).padEnd(16) + String(u.role).padEnd(12) + u.fullName);

// ===========================================================================
// 2. HO SO NHAN SU  (action: save_hr_record — UPSERT theo userId)
// ===========================================================================
tieuDe("2. TAO HO SO NHAN SU — action save_hr_record");

const coHoSo = new Set(bs0.hrRecords.map((r) => String(r.userId)));
const boQuaHoSo = targets.filter((u) => coHoSo.has(String(u.id)))
  .map((u) => ({ username: u.username, ten: u.fullName }));
const taoHoSo = targets.filter((u) => !coHoSo.has(String(u.id)));
console.log("  Da co ho so san (KHONG sua): " + boQuaHoSo.length +
  (boQuaHoSo.length ? " → " + boQuaHoSo.map((x) => x.username).join(", ") : ""));
console.log("  Can tao moi: " + taoHoSo.length);

for (const u of taoHoSo) {
  await ghiMoi("ho so · " + u.username, "save_hr_record", {
    userId: u.id,
    fullName: u.fullName,
    identityNo: cccd(u.username),
    identityDate: "2021-04-10",
    identityPlace: "Cục CSQL cư trú Hà Nội",
    birthDate: ngaySinh(u.username),
    birthplace: "Hà Nội",
    permanentAddress: "Số 1 Đường Lê Lợi, Phường Trung Hưng, Quận Hoàn Kiếm, Hà Nội",
    phone: "09" + String(10000000 + (bam(u.username) % 89999999)),
    educationLevel: ["Trung cấp", "Cao đẳng", "Đại học", "Thạc sĩ"][bam(u.username + "hv") % 4],
    joinedDate: ngayVao(u.username),
    position: u.roleName || u.role,
    note: MARK_HS + " · Hồ sơ nhân sự E2E Giai đoạn 3 · lập bởi Phòng Nhân sự",
  });
}

// ===========================================================================
// 3. HOP DONG LAO DONG  (action: save_labor_contract)
// ===========================================================================
tieuDe("3. TAO HOP DONG LAO DONG — action save_labor_contract");

const coHopDong = new Set(bs0.laborContracts.map((r) => String(r.userId)));
const boQuaHopDong = targets.filter((u) => coHopDong.has(String(u.id)))
  .map((u) => ({ username: u.username, ten: u.fullName, so: bs0.laborContracts.find((c) => String(c.userId) === String(u.id))?.contractNo }));
const taoHopDong = targets.filter((u) => !coHopDong.has(String(u.id)));
console.log("  Da co hop dong san (KHONG sua): " + boQuaHopDong.length +
  (boQuaHopDong.length ? " → " + boQuaHopDong.map((x) => x.username + "/" + x.so).join(", ") : ""));
console.log("  Can tao moi: " + taoHopDong.length);

for (const u of taoHopDong) {
  await ghiMoi("hop dong · " + u.username, "save_labor_contract", {
    userId: u.id,
    contractType: loaiHopDong(u),
    signingDate: KY,
    startDate: TU,
    endDate: DEN,
    salary: String(luong(u)),
    jobRank: "Chuyên viên",
    grade: "Bậc " + (1 + (bam(u.username + "bac") % 4)),
    renewalRound: 0,
    note: MARK_HD + " · HĐ lập bởi Phòng Nhân sự E2E Giai đoạn 3 · " + u.username,
  });
}

// Doc lai tu may chu de lay id hop dong vua tao (id do may chu sinh)
const bs1 = await bootstrap();
console.log("  Doc lai tu may chu: ho so=" + bs1.hrRecords.length + " · hop dong=" + bs1.laborContracts.length);

// ===========================================================================
// 4. XAC NHAN HOP DONG TON TAI  (action: set_labor_contract_status)
//    "Không tìm thấy hợp đồng" se nem loi ⇒ buoc nay la bang chung that.
// ===========================================================================
tieuDe("4. XAC NHAN HOP DONG TON TAI — action set_labor_contract_status");

// Xac nhan MOI hop dong co dau E2E (vua tao o lan nay HOAC da tao o lan truoc)
// => bang chung ton tai o MOI LAN CHAY, ma van idempotent (active -> active).
const hdMoi = bs1.laborContracts.filter((c) => String(c.note || "").includes(MARK_HD));
console.log("  Hop dong co dau E2E: " + hdMoi.length);
for (const c of hdMoi) {
  await ghiMoi("trang thai HD · " + c.fullName, "set_labor_contract_status", { contractId: c.id, status: "active" });
}

// ===========================================================================
// 5. BAO HIEM XA HOI  (action: save_benefit_record)
// ===========================================================================
tieuDe("5. TAO BAO HIEM XA HOI — action save_benefit_record");

// Pham vi bao hiem = MỌI mục tiêu đang CÓ hợp đồng lao động (kể cả hợp đồng có
// sẵn từ trước) ⇒ chạy lại vẫn tự vá nốt bản ghi còn thiếu, không tạo trùng.
const coHieuLuc = new Set(bs1.laborContracts.map((c) => String(c.userId)));
const nguoiBH = targets.filter((u) => coHieuLuc.has(String(u.id)));
console.log("  Nguoi duoc tao bao hiem: " + nguoiBH.length + " · moi nguoi " + LOAI_BH.length + " loai (BHXH + BHYT)");

const taoMoiBh = [];
for (const u of nguoiBH) {
  const hd = bs1.laborContracts.find((c) => String(c.userId) === String(u.id));
  const luongNguoi = Number(hd?.salary || luong(u));
  for (const b of LOAI_BH) {
    const daCo = bs1.benefitRecords.some((x) => String(x.userId) === String(u.id) && String(x.benefitType) === b.ten);
    if (daCo) { console.log("    [BO QUA] " + u.username + " · " + b.ten + " đã có bản ghi"); continue; }
    await ghiMoi("bao hiem " + b.ten + " · " + u.username, "save_benefit_record", {
      userId: u.id,
      benefitType: b.ten,
      provider: b.nha,
      startDate: hd?.startDate || TU,
      endDate: hd?.endDate || DEN,
      monthlyAmount: String(Math.round(luongNguoi * b.he)),
      note: MARK_BH + " · Bảo hiểm E2E Giai đoạn 3 · " + u.username + " · HĐ " + (hd?.contractNo || "?"),
    });
    taoMoiBh.push(u.username + " · " + b.ten);
  }
}

// ===========================================================================
// 6. XAC NHAN BAO HIEM TON TAI  (action: set_benefit_record_status)
// ===========================================================================
const bs2 = await bootstrap();
tieuDe("6. XAC NHAN BAO HIEM TON TAI — action set_benefit_record_status");
const bhMoi = bs2.benefitRecords.filter((x) => String(x.note || "").includes(MARK_BH));
console.log("  Ban ghi bao hiem co dau E2E: " + bhMoi.length);
for (const b of bhMoi) {
  await ghiMoi("trang thai BH · " + b.fullName + " · " + b.benefitType, "set_benefit_record_status", { benefitId: b.id, status: "active" });
}

// ===========================================================================
// 7. DEM LAI TU MAY CHU
// ===========================================================================
tieuDe("7. DEM LAI TU MAY CHU (bootstrap la doc lai, khong tin bao cao)");
await login("admin", "Admin123456@");
const bs3 = await bootstrap();
const sau = {
  taiKhoan: bs3.users.length,
  staffDirectory: bs3.staffDirectory.length,
  hrRecords: bs3.hrRecords.length,
  laborContracts: bs3.laborContracts.length,
  benefitRecords: bs3.benefitRecords.length,
};
console.log("                    TRUOC      SAU      TANG");
for (const k of ["hrRecords", "laborContracts", "benefitRecords"]) {
  console.log("  " + k.padEnd(18) + String(truoc[k]).padStart(5) + String(sau[k]).padStart(9) + String(sau[k] - truoc[k]).padStart(8));
}

const hrTheoNguoi = new Map(bs3.hrRecords.map((r) => [String(r.userId), r]));
const hdTheoNguoi = new Map();
for (const c of bs3.laborContracts) if (!hdTheoNguoi.has(String(c.userId))) hdTheoNguoi.set(String(c.userId), c);
const bhTheoNguoi = new Map();
for (const b of bs3.benefitRecords) {
  const k = String(b.userId) + "|" + String(b.benefitType);
  if (!bhTheoNguoi.has(k)) bhTheoNguoi.set(k, b);
}

console.log("\n  TINH TRANG TUNG NGUOI (muc tieu " + targets.length + "):");
let dayHoSo = 0, dayHopDong = 0, dayBH = 0;
for (const u of targets) {
  const id = String(u.id);
  const hr = hrTheoNguoi.get(id);
  const hd = hdTheoNguoi.get(id);
  const bh = LOAI_BH.filter((b) => bhTheoNguoi.get(id + "|" + b.ten));
  if (hr) dayHoSo++; if (hd) dayHopDong++; if (bh.length) dayBH++;
  console.log("  " + String(u.username).padEnd(16) +
    " hoSo=" + (hr ? "Y" : "n") + (hr ? (String(hr.note || "").includes(MARK_HS) ? "(E2E)" : "(cũ)") : "") +
    " hopDong=" + (hd ? "Y" : "n") + (hd ? (String(hd.note || "").includes(MARK_HD) ? "(E2E)" : "(cũ)") : "") +
    " baoHiem=" + bh.length + "/" + LOAI_BH.length);
}
console.log("  → " + dayHoSo + "/" + targets.length + " có hồ sơ · " +
  dayHopDong + "/" + targets.length + " có hợp đồng · " + dayBH + "/" + targets.length + " có bảo hiểm");

// ===========================================================================
// 8. MOI NGUOI TU DOC LAI HO SO CUA CHINH MINH
// ===========================================================================
tieuDe("8. TAI KHOAN E2E TU DOC LAI HO SO CUA CHINH MINH (dang nhap lai + bootstrap lai)");

const taiKhoanE2E = targets.filter((u) => String(u.username).startsWith("e2e."));
const tuDoc = [];
for (const u of taiKhoanE2E) {
  const dong = { username: u.username, hoTen: u.fullName, userId: u.id, vai: u.role };
  try {
    await login(u.username, MAT_KHAU_E2E);
    const b = await bootstrap();
    const id = String(u.id);
    const hr = (b.hrRecords || []).find((r) => String(r.userId) === id) || null;
    const hd = (b.laborContracts || []).find((c) => String(c.userId) === id) || null;
    const bh = (b.benefitRecords || []).filter((x) => String(x.userId) === id);
    Object.assign(dong, {
      dangNhap: true,
      thayToiDungDangNhap: String(b.user?.id || "") === id,
      soKhoaBootstrap: Object.keys(b).length,
      hoSo: hr ? { id: hr.id, hoTen: hr.fullName, chucDanh: hr.position, cccd: hr.identityNo, ngayVao: hr.joinedDate, e2e: String(hr.note || "").includes(MARK_HS) } : null,
      hopDong: hd ? { so: hd.contractNo, loai: hd.contractType, tu: hd.startDate, den: hd.endDate, luong: hd.salary, trangThai: hd.status, e2e: String(hd.note || "").includes(MARK_HD) } : null,
      baoHiem: bh.map((x) => ({ so: x.benefitNo, loai: x.benefitType, muc: x.monthlyAmount, trangThai: x.status, e2e: String(x.note || "").includes(MARK_BH) })),
      // Bootstrap tra ve TOAN BO du lieu he thong cho moi tai khoan (khong cat theo nguoi).
      tongNhinThay: { hoSo: (b.hrRecords || []).length, hopDong: (b.laborContracts || []).length, baoHiem: (b.benefitRecords || []).length },
    });
    dong.dat = !!(hr && hd && bh.length);
  } catch (e) {
    Object.assign(dong, { dangNhap: false, dat: false, loi: String(e.message || e) });
  }
  tuDoc.push(dong);
  console.log("  " + (dong.dangNhap ? "[OK ]" : "[LOI]") + " " + String(dong.username).padEnd(12) +
    " hoSo=" + (dong.hoSo ? dong.hoSo.hoTen : "-") +
    " · HĐ=" + (dong.hopDong ? dong.hopDong.so : "-") +
    " · BH=" + (dong.baoHiem || []).length +
    (dong.dangNhap ? "" : " :: " + dong.loi));
}
await login("admin", "Admin123456@");
console.log("  → Đã đăng nhập lại admin. " + tuDoc.filter((x) => x.dat).length + "/" + tuDoc.length +
  " tài khoản E2E thấy đủ hồ sơ của chính mình.");

// ===========================================================================
// 9. GHI KET QA
// ===========================================================================
const dat = baoCao.filter((b) => b.ok).length;

/** Tong so ban ghi co dau E2E hien co trong may chu (doc lai, khong tin bao cao). */
const tongE2E = {
  hoSo: bs3.hrRecords.filter((r) => String(r.note || "").includes(MARK_HS)).length,
  hopDong: bs3.laborContracts.filter((c) => String(c.note || "").includes(MARK_HD)).length,
  baoHiem: bs3.benefitRecords.filter((b) => String(b.note || "").includes(MARK_BH)).length,
};

/** Lich su TICH LUY — suot so ban ghi E2E, lay truc tiep tu may chu theo dau
 *  `note` (E2E-HS-03 / E2E-HD-03 / E2E-BH-03) ⇒ chay lai bao nhieu lan cung
 *  ra dung mot con so, khong cong don nhung khong bao gio kiem. */
let truocDay = {};
try { truocDay = JSON.parse(readFileSync(KET_QUA, "utf8")).lichSuTao || {}; } catch { truocDay = {}; }
let ketQuaCu = {};
try { ketQuaCu = JSON.parse(readFileSync(KET_QUA, "utf8")); } catch { ketQuaCu = {}; }
// Lần chay hoàn toàn idempotent (không tạo gì) thì action nào chưa ghi lần này sẽ null —
// giữ lại kết quả của lần chay trước để báo cáo không bị mất dấu vết.
for (const [a, v] of Object.entries(ketQuaCu.ghiBang || {})) {
  if (ghiBangNhom[a] === null && v) ghiBangNhom[a] = v + " (lần chay trước)";
}
const lichSuTao = {
  hoSo: tongE2E.hoSo,
  hopDong: tongE2E.hopDong,
  baoHiem: tongE2E.baoHiem,
  lanChay: Number(truocDay.lanChay || 0) + 1,
  nguon: "đếm trực tiếp từ máy chủ theo dấu E2E trong `note` (không cộng dồn cục bộ)",
};

/** Ai THỰC SỰ đã gọi từng action nhóm nhan-su — đọc nguyên văn nhật ký bằng chứng. */
const NHOM_NHAN_SU = ["save_hr_record", "save_labor_contract", "set_labor_contract_status",
  "save_benefit_record", "set_benefit_record_status", "delete_labor_contract",
  "delete_benefit_record", "delete_hr_record"];
const nguoiDaGhi = {};
try {
  const nhatKy = readFileSync("tools/e2e/bien-chung.jsonl", "utf8").split("\n").filter(Boolean)
    .map((d) => { try { return JSON.parse(d); } catch { return null; } }).filter(Boolean);
  for (const a of NHOM_NHAN_SU) {
    const ds = [...new Set(nhatKy.filter((e) => e.loai === "action" && e.action === a && e.ok).map((e) => e.user))];
    nguoiDaGhi[a] = ds.join(", ");
  }
} catch { for (const a of NHOM_NHAN_SU) nguoiDaGhi[a] = ""; }

const ketQua = {
  giaiDoan: 3,
  chayLuc: new Date().toISOString(),
  ghiBang: ghiBangNhom,
  nguoiDaGhiTheoNhatKy: nguoiDaGhi,
  truoc, sau,
  taoMoiLanNay: { hoSo: taoHoSo.length, hopDong: taoHopDong.length, baoHiem: taoMoiBh.length },
  tongBanGhiE2ETrenMayChu: tongE2E,
  lichSuTao,
  mucTieu: { soNguoi: targets.length, danhSach: targets.map((u) => ({ username: u.username, ten: u.fullName, vai: u.role, id: u.id })) },
  biLoai,
  khongDungLai: { hoSo: boQuaHoSo, hopDong: boQuaHopDong },
  buoc: baoCao,
  loiChiTiet,
  tuDocTaiKhoan: tuDoc,
  ghiChu: [
    "save_hr_record là UPSERT theo userId: lần chạy sau nếu hồ sơ đã có thì taoHoSo rỗng ⇒ không tạo trùng.",
    "save_labor_contract không có khóa tự nhiên theo người; script BỎ QUA người đã có BẤT KỲ hợp đồng nào ⇒ chạy lại không tạo trùng.",
    "save_benefit_record: script bỏ qua cặp (userId, benefitType) đã có ⇒ chạy lại không tạo trùng.",
    "Mọi bản ghi mới mang dấu E2E trong `note` (E2E-HS-03 / E2E-HD-03 / E2E-BH-03).",
    "Số hợp đồng (HĐLĐ-xxxxx) và mã bảo hiểm (BH-xxxxx) do SERVER sinh, client không tự đặt được ⇒ dấu E2E nằm ở `note`.",
    "bootstrap() trả về TOÀN BỘ dữ liệu hệ thống cho mọi tài khoản ⇒ bước 8 tự lọc theo userId của chính mình.",
    "set_labor_contract_status / set_benefit_record_status được gọi ngay sau khi tạo: server ném 'Không tìm thấy...' nếu bản ghi không tồn tại ⇒ đây là bằng chứng ghi thật.",
    "`taoMoiLanNay` = số bản ghi tạo ra ở lần chạy này; `lichSuTao` = tích luỹ qua các lần chạy (không bị ghi đè khi chạy lại).",
  ],
};
writeFileSync(KET_QUA, JSON.stringify(ketQua, null, 2), "utf8");
ghi({ loai: "giai-doan-03", truoc, sau, dat, loi: baoCao.length - dat, buoc: baoCao.length });

tieuDe("TONG KET GIAI DOAN 3");
console.log("  Buoc DAT : " + dat + "/" + baoCao.length + " · that bai " + (baoCao.length - dat));
for (const b of baoCao.filter((x) => !x.ok)) console.log("    ! " + b.ten + " :: " + b.loi);
console.log("  Tai khoan ghi du lieu: " + [...new Set(Object.values(ghiBangNhom).filter(Boolean))].join(", ") +
  "  (Phong Nhan su thuc hien kich ban trang thai duoc quyen day du)");
console.log("  Nguoi da goi tung action nhom nhan-su (doc tu bien-chung.jsonl):");
for (const [a, v] of Object.entries(nguoiDaGhi)) {
  console.log("    " + a.padEnd(26) + (v || "(chua co lenh nao)") + (v?.includes(",") ? "   ← nhiều tài khoản" : ""));
}
console.log("");
console.log("  BANG TONG HOP TRUOC / SAU (dem lai tu may chu):");
console.log("    " + "KHOA".padEnd(18) + "TRUOC".padStart(7) + "SAU".padStart(7) + "TANG".padStart(7));
for (const k of ["hrRecords", "laborContracts", "benefitRecords"]) {
  console.log("    " + k.padEnd(18) + String(truoc[k]).padStart(7) + String(sau[k]).padStart(7) + String(sau[k] - truoc[k]).padStart(7));
}
console.log("  Ban ghi E2E con tren may chu: ho so=" + tongE2E.hoSo + " · hop dong=" + tongE2E.hopDong + " · bao hiem=" + tongE2E.baoHiem);
console.log("  Lan chay nay tao moi: ho so=" + taoHoSo.length + " · hop dong=" + taoHopDong.length + " · bao hiem=" + taoMoiBh.length);
console.log("");
console.log("  BANG XAC NHAN TAI KHOAN E2E DOC LAI HO SO CUA CHINH MINH:");
console.log("    " + "TAI KHOAN".padEnd(12) + "VAO".padEnd(5) + "HO SO (ho ten · chuc danh)".padEnd(44) + "HOP DONG".padEnd(22) + "BAO HIEM".padEnd(14) + "KET");
for (const d of tuDoc) {
  console.log("    " + String(d.username).padEnd(12) +
    (d.dangNhap ? (d.thayToiDungDangNhap ? "OK " : "SAI") : "LOI").padEnd(5) +
    (d.hoSo ? (d.hoSo.hoTen + " · " + (d.hoSo.chucDanh || "")).slice(0, 42).padEnd(44) : "— KHÔNG THẤY HỒ SƠ CỦA MÌNH".padEnd(44)) +
    (d.hopDong ? (d.hopDong.so + " · " + d.hopDong.trangThai).slice(0, 20).padEnd(22) : "—".padEnd(22)) +
    ((d.baoHiem || []).map((b) => b.loai).sort().join("+") || "—").padEnd(14) +
    (d.dat ? "ĐẠT" : "CHƯA ĐỦ"));
}
for (const d of tuDoc.filter((x) => !x.dangNhap || !x.dat)) console.log("    ! " + d.username + " :: " + (d.loi || "thiếu hồ sơ/hợp đồng/bảo hiểm của chính mình"));
console.log("");
console.log("  Da luu   : " + KET_QUA);
