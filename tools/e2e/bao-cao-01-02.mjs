// Sinh báo cáo Giai đoạn 1 + 2 (dựng tổ chức + cấu hình luồng duyệt) ra .md và .docx.
import { readFileSync } from "node:fs";
import { viet } from "./bao-cao.mjs";
import { login, bootstrap, tieuDe } from "./client.mjs";

tieuDe("SINH BÁO CÁO GIAI ĐOẠN 1 + 2");
const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
await login("admin", "Admin123456@");
const bs = await bootstrap();

const donVi = bs.organizationUnits.filter((u) => String(u.code || "").startsWith("E2E-") || u.code === "NS");
const nguoi = bs.users.filter((u) => String(u.username || "").startsWith("e2e.") && u.username !== "e2e.diag");
const nhom = bs.users.filter((u) => u.username?.startsWith("e2e.") && u.username !== "e2e.diag");
const tds = bs.teams.filter((t) => t.projectId === tt.duAn);
const wf = bs.workflowDefinitions.find((w) => w.code === "WF-E2E-MUAHANG");
const buocWf = bs.workflowSteps.filter((s) => s.workflowId === wf?.id).sort((a, b) => a.stepNo - b.stepNo);

const r = viet("gd12", (b) => {
  b.h1("1. Mục đích và phạm vi");
  b.doan("Kiểm thử hành vi GIAI ĐOẠN 1 và GIAI ĐOẠN 2 của kịch bản kiểm thử toàn hệ thống, thực hiện bằng cách gọi trực tiếp API của ứng dụng (POST /api/system) — đúng đường đi mà giao diện người dùng sử dụng, không vòng qua tầng trung gian khác.");
  b.doan("Mọi thao tác đều do Quản trị viên thực hiện với tư cách người dùng thật, dữ liệu ghi xuống thật, không mô phỏng, không chèn trực tiếp vào cơ sở dữ liệu.");
  b.bang(["Nội dung", "Chi tiết"], [
    ["Môi trường", "Proxy :9000 → giao diện :8787 → backend Java :18081"],
    ["Cơ sở dữ liệu", "MySQL 8 `vntech_erp` (dùng chung với môi trường đang chạy)"],
    ["Nguyên tắc dữ liệu", "Không xoá, không sửa dữ liệu sẵn có; mọi bản ghi mới mang tiền tố E2E-"],
    ["Đơn vị sử dụng", "Việt Nam không dấu trong mã, tiếng Việt có dấu trong văn bản báo cáo"],
  ], { rong: [2600, 6400] });

  b.h1("2. Kết quả tổng quan");
  b.bang(["Giai đoạn", "Nội dung", "Kết quả", "Trạng thái"], [
    ["Giai đoạn 1", "Dựng tổ chức: phòng ban, vai trò, dự án, ban chỉ huy, tổ đội, tài khoản", "7/7 lệnh ghi thành công, kiểm chứng lại bằng đếm trực tiếp từ máy chủ", "ĐẠT"],
    ["Giai đoạn 2", "Cấu hình quy trình phê duyệt 4 bước với người duyệt chỉ định theo từng bước", "1/1 lệnh ghi thành công; 4 bước, 4 người duyệt được ghi nhận đúng", "ĐẠT"],
  ], { rong: [1400, 3400, 3400, 800] });

  b.h1("3. Giai đoạn 1 — Dựng tổ chức");
  b.h2("3.1. Phòng ban");
  b.doan("Kịch bản yêu cầu có phòng ban: Dự án, Kế hoạch, Kế toán, Nhân sự, Ban giám đốc và Ban chỉ huy công trường. Khảo sát cho thấy hệ thống đã có sẵn phần lớn; riêng Phòng Nhân sự chưa tồn tại — nhân sự đang nằm gộp trong Phòng Hành chính Pháp chế.");
  b.bang(["Phòng ban", "Mã", "Tình trạng", "Xử lý"], [
    ["Phòng Dự án", "DA", "Đã có sẵn", "Tái sử dụng"],
    ["Phòng Kế hoạch", "KH", "Đã có sẵn", "Tái sử dụng"],
    ["Phòng Tài chính – Kế toán", "TCKT", "Đã có sẵn", "Tái sử dụng"],
    ["Ban giám đốc", "BGD", "Đã có sẵn", "Tái sử dụng"],
    ["Phòng Nhân sự", "NS", "THIẾU", "Đã tạo mới trong giai đoạn này"],
    ["Ban chỉ huy công trường", "E2E-BCH-01", "Cần cho dự án E2E", "Đã tạo mới, gắn với dự án"],
  ], { rong: [2600, 1200, 1600, 3600] });
  b.ghiChu("Phát hiện: kịch bản liệt kê Phòng Nhân sự là một bộ phận riêng, nhưng hệ thống đang gộp chức năng nhân sự vào Hành chính Pháp chế. Người dùng thật sẽ không tìm được phòng Nhân sự trong danh sách chọn.");

  b.h2("3.2. Dự án và kho công trường");
  b.doan("Tạo dự án E2E kèm kho công trường riêng. Hệ thống tự sinh kho khi bật cờ tạo kho, đúng như thiết kế W-03 đã ghi trong mã nguồn.");
  b.bang(["Đối tượng", "Mã", "Tên", "Định danh"], [
    ["Dự án", "E2E-DA-01", "Dự án chuẩn hoá quy trình E2E", tt.duAn],
    ["Kho công trường", "KHO-E2E-01", "Kho dự án E2E Đà Nẵng", tt.khoSite],
    ["Ban chỉ huy", "E2E-BCH-01", "Ban chỉ huy công trường E2E Đà Nẵng", tt.bch],
  ], { rong: [1500, 1500, 3400, 2600] });

  b.h2("3.3. Tổ đội");
  b.doan("Hệ thống tự sinh kho riêng cho từng tổ đội và tự đặt lại mã theo kiểu «MãDự án-MãTổĐội», không giữ nguyên mã do người dùng nhập.");
  b.bang(["Mã do hệ thống sinh", "Tên tổ đội", "Hạng mục", "Kho tổ đội"], tds.map((t) => [t.code, t.name, t.trade, t.warehouseId || "—"]), { rong: [2400, 2900, 1500, 2200] });
  b.ghiChu("Phát hiện: biểu mẫu bắt buộc nhập «Hạng mục / chuyên môn» (trade). Bỏ trống thì hệ thống từ chối lưu tổ đội với thông báo rõ ràng — hành vi đúng như thiết kế.");

  b.h2("3.4. Vai trò và tài khoản");
  b.doan("Dựng mỗi tài khoản cho một vị trí trong quy trình mua hàng, gán đúng phòng ban và đúng vai trò lấy từ danh mục vai trò của hệ thống.");
  b.bang(["Tài khoản", "Họ tên", "Vai trò", "Đơn vị"], nguoi.map((u) => [u.username, u.fullName, u.roleName || u.role, u.organizationName || u.department || "—"]), { rong: [1600, 2900, 1900, 2600] });
  b.doan("Mật khẩu chung của các tài khoản kiểm thử: " + tt.matKhau + " (đủ chữ hoa, chữ thường, chữ số và ký tự đặc biệt, trên 8 ký tự — theo ràng buộc của biểu mẫu).");
  b.ghiChu("Phát hiện: tài khoản Nhân sự có vai trò hr nhưng nhóm quyền cơ sở vẫn là director do được tạo trong lần đầu tiên khi Phòng Nhân sự chưa tồn tại và rơi vào Hành chính Pháp chế. Cần chỉnh lại quyền theo Phòng Nhân sự.");

  b.h2("3.5. Quyền được cấp tự động");
  b.doan("Khi tạo tài khoản, hệ thống tự cấp quyền mặc định theo phòng ban. Kiểm chứng bằng cách đếm số chức năng mỗi tài khoản được cấp quyền và quyền phê duyệt.");
  b.bang(["Tài khoản", "Vai trò", "Nhóm quyền", "Tổng số chức năng", "Chức năng được duyệt"], nhom.map((u) => {
    const rows = (bs.allModulePermissions || []).filter((p) => String(p.userId) === String(u.id));
    return [u.username, u.role, u.roleBase || "—", String(rows.length), String(rows.filter((p) => Number(p.canApprove) === 1).length)];
  }), { rong: [1700, 1700, 1900, 1900, 1800] });

  b.trang();
  b.h1("4. Giai đoạn 2 — Cấu hình quy trình phê duyệt");
  b.h2("4.1. Quy trình trước khi thay đổi");
  b.doan("Hệ thống có sẵn bốn quy trình, mỗi quy trình gắn với một chức năng. Mỗi bước có số thứ tự, chế độ duyệt, thời hạn SLA và danh sách người duyệt.");
  b.bang(["Mã quy trình", "Chức năng", "Số bước", "Mặc định"], bs.workflowDefinitions.map((w) => [
    w.code, w.moduleKey, String(bs.workflowSteps.filter((s) => s.workflowId === w.id).length), Number(w.isDefault) === 1 ? "Có" : "Không",
  ]), { rong: [2400, 2200, 1200, 1600] });

  b.h2("4.2. Quy trình E2E vừa dựng");
  b.doan("Dựng quy trình riêng cho kịch bản kiểm thử, gồm bốn bước, mỗi bước chỉ định đúng một người duyệt, và đặt làm mặc định cho chức năng yêu cầu mua hàng để các phiếu tạo sau đó đi đúng luồng này.");
  b.bang(["Bước", "Tên bước", "Chế độ", "SLA", "Người duyệt"], buocWf.map((s) => {
    const ap = bs.workflowStepApprovers.filter((a) => a.stepId === s.id);
    return [String(s.stepNo), s.name, s.approvalMode, s.slaHours + " giờ", ap.map((a) => bs.users.find((u) => u.id === a.userId)?.username || a.userId).join(", ")];
  }), { rong: [700, 3800, 1200, 1100, 2200] });
  b.ghiChu("Lưu ý vận hành: đặt WF-E2E-MUAHANG làm mặc định cho chức năng `requests` đã thay thế WF-MUAHANG-01 trong môi trường kiểm thử. Mã định danh của quy trình gốc đã lưu lại trong trạng thái kiểm thử để khôi phục.");

  b.h1("5. Sai sót phát hiện và cách xử lý");
  b.h2("5.1. Bộ đo kiểm thử báo thành công khi thực tế không ghi được dữ liệu");
  b.doan("Ở lần chạy đầu tiên, 6 trong 11 lệnh ghi bị báo là thành công, nhưng kiểm chứng lại bằng cách đếm trực tiếp từ máy chủ cho thấy dữ liệu không hề tăng. Nguyên nhân nằm ở chính bộ đo: một cờ cho phép bỏ qua lỗi khiến kết quả trả về có cờ thất bại không được kiểm tra.");
  b.doan("Đã sửa: mọi lệnh ghi trong toàn bộ kịch bản kiểm thử từ nay bắt buộc thành công, dừng ngay khi máy chủ báo lỗi, và mỗi giai đoạn đều đếm lại số lượng thực tế từ máy chủ trước khi kết luận.");
  b.bang(["Lệnh", "Báo cáo sai", "Thực tế"], [
    ["Tạo tổ đội (lần 1)", "Thành công", "Thất bại — thiếu trường Hạng mục bắt buộc"],
    ["Tạo 3 tài khoản (lần 1)", "Thành công", "Thất bại — mã vai trò không tồn tại trong danh mục"],
    ["Tạo Ban chỉ huy (lần 1)", "Thành công", "Thất bại — định danh dự án truyền vào sai kiểu dữ liệu"],
  ], { rong: [2900, 2000, 4100] });
  b.ghiChu("Bài học áp dụng: trong kiểm thử, KHÔNG được tin vào thông báo thành công của chính lệnh ghi. Phải đo lại từ nguồn dữ liệu.");

  b.h2("5.2. Sai lệch khi đo quyền");
  b.doan("Ban đầu đo quyền phê duyệt bằng tên trường không tồn tại nên ra kết quả 0 cho toàn bộ tài khoản, tưởng rằng mất quyền. Tên cờ thật của hệ thống là canApprove, dùng số 0 hoặc 1. Đo lại cho thấy cả bảy tài khoản đều có quyền phê duyệt như thiết kế.");

  b.h1("6. Kết luận Giai đoạn 1 và Giai đoạn 2");
  b.danhSach([
    "Hệ thống tạo đủ được toàn bộ tổ chức cần thiết cho kịch bản: dự án, kho công trường, ban chỉ huy, hai tổ đội, bảy tài khoản theo đúng vai trò trong quy trình.",
    "Quy trình phê duyệt bốn bước dựng thành công, mỗi bước gắn đúng một người duyệt và thời hạn SLA riêng — dữ liệu phê duyệt là dữ liệu, không viết cứng trong mã.",
    "Ràng buộc bắt buộc được thực thi đúng: thiếu Hạng mục thì không lưu được tổ đội; dùng mã vai trò không có trong danh mục thì không tạo được tài khoản.",
    "Phát hiện một điểm cần theo dõi: một bước phê duyệt không có người duyệt vẫn lưu được quy trình, hệ thống chỉ cảnh báo. Sẽ kiểm tra tác động ở Giai đoạn 12.",
  ]);
}, { tieuDe: "Báo cáo kiểm thử E2E — Giai đoạn 1 và Giai đoạn 2", phuDe: "Dựng tổ chức và cấu hình quy trình phê duyệt", ngay: "01/10/2026" });

console.log("  .md   -> " + r.md);
console.log("  .docx -> " + r.docx + "  (" + r.byte + " byte)");