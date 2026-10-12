import { useEffect, useState } from "react";
import type { AppData, Row } from "@/lib/ui-shared";
// ⭐ 06/10/2026 (USER YÊU CẦU) — bấm «Chi tiết» phải mở **MODAL** chứ không phải thẻ inline dưới bảng.
//   §17 SHARED COMPONENT RULE: ⭐ **TÁI DÙNG `BaseModal`** của `@/lib/ui-blocks` (đã có sẵn, 8 màn khác
//   đang dùng) ⇒ ⛔ KHÔNG tạo modal mới, ⛔ KHÔNG sao chép CSS. Modal tự đóng khi click ra ngoài.
import { BaseModal } from "@/lib/ui-blocks";

/**
 * USER 29/09/2026 (MỐC 42) — TAB 14 «Báo lỗi» của màn Quản trị hệ thống.
 *
 * <p>Yêu cầu user: hiển thị danh sách report của user gồm **mã report · tiêu đề · mã nhân
 * viên · user · tên · phòng ban · thời gian gửi report · report về vấn đề gì**; bấm vào xem
 * **chi tiết đầy đủ** kèm thông tin của modal báo lỗi; có **nút tick (đánh dấu đã xử lý
 * xong)**; danh sách **ưu tiên report gần nhất**.
 *
 * <p>⛔ Phân quyền: action `error_reports` + `mark_error_report_resolved` gắn module `admin` trong
 * `ActionRbacRegistry` ⇒ chỉ quản trị viên mới mở được tab này (backend chặn, không chỉ ẩn UI).
 */
export default function ErrorReportAdminPanel({ data, submit }: {
  data: AppData;
  submit: (action: string, payload: Row) => Promise<unknown>;
}) {
  const [reports, setReports] = useState<Row[]>([]);
  const [openId, setOpenId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  // ⛔⛔ VÁ 06/10/2026 (GO-LIVE · BUG-20261006-001 — **CAO**) — **NUỐT LỖI IM LẶNG**.
  //   📍 TRIỆU CHỨNG USER BÁO: «phần báo lỗi chưa hiển thị được danh sách báo lỗi của user gửi lên»
  //   🔎 TRUY VẾT 6 TẦNG (UI → API → BACKEND → DATABASE → PERMISSION → WORKFLOW):
  //     ✅ DATABASE: bảng `error_reports` có **16 dòng** — ⭐ dữ liệu CÓ ✓
  //     ✅ BACKEND/API: gọi `error_reports` bằng `admin` ⇒ **HTTP 200 · trả về ĐỦ 16 report** ✓
  //     ⛔ PERMISSION: `error_reports` gắn module **`admin`** (`ActionRbacRegistry:61`)
  //        ⇒ tài khoản ⛔ không có module `admin` nhận **HTTP 403**
  //        «Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.» ✓
  //     ⛔ **UI = NGUYÊN NHÂN GỐC**: `void fetchReports().then(...)` ⚠️ **KHÔNG có `.catch()`**
  //        ⇒ ⭐ lỗi **403 bị NUỐT IM LẶNG** ⇒ `reports` ở lại `[]`
  //        ⇒ ⭐ hiện **«Chưa có báo lỗi nào.»** ⚠️ **GÂY HIỂU SAI HOÀN TOÀN**:
  //        người dùng tưởng **«không có dữ liệu»** trong khi thực chất là **«không có quyền xem»** ✓
  //   ⇒ ⭐ SỬA: **bắt lỗi + HIỆN THÔNG BÁO RÕ** — ⛔ không để trạng thái rỗng gây hiểu sai ✓
  const [loadError, setLoadError] = useState("");

  // ⭐ VÁ 06/10/2026 (BUG-20261006-002) — CÙNG LỖI như `ErrorReportModal`:
  //   bộ lọc cũ so `String(m.active ?? 1) === "1"` ⚠️ nhưng bootstrap trả **`active` BOOLEAN `true`**
  //   ⇒ ⭐ `String(true)` = `"true"` ≠ `"1"` ⇒ lọc sạch ⇒ ⭐ tên nhóm chức năng hiện ra «—» ✓
  //   ✅ Chấp nhận CẢ HAI kiểu (⭐ `true` boolean và `"1"`/`1`) ✓
  const dangHoatDong = (v: unknown) => v === true || String(v ?? 1) === "1" || String(v) === "true";
  const modules = (data.moduleCatalog ?? []).filter((m: Row) => dangHoatDong(m.active));
  const label = (key: string) => String(modules.find((m: Row) => String(m.moduleKey) === key)?.label ?? key ?? "—");

  async function fetchReports() {
    const res = (await submit("error_reports", {})) as { reports?: Row[] } | undefined;
    // ⛔ Backend đã ORDER BY created_at DESC ⇒ mới nhất trước. Vẫn sắp lại ở UI cho chắc.
    return (res?.reports ?? []).slice().sort((a: Row, b: Row) =>
      String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  }

  async function load() {
    // ⭐ VÁ BUG-20261006-001: bắt lỗi ⇒ ⛔ KHÔNG để danh sách rỗng gây hiểu sai là «không có dữ liệu».
    try {
      setLoadError("");
      setReports(await fetchReports());
    } catch (e) {
      setReports([]);
      setLoadError(e instanceof Error ? e.message : "Không tải được danh sách báo lỗi.");
    }
  }

  // 📌 VÒNG 197 — setState trong effect nằm trong `.then()`, kèm chống `active`
  //   để không setState sau khi đã đóng. `fetchReports` tách riêng để `load()` dùng lại được
  //   mà không phải nhân đôi logic sắp xếp (trước để fix set-state-in-effect cho `npm test`).
  // ⭐ VÁ BUG-20261006-001: thêm `.catch()` — ⚠️ trước đây lỗi **403 bị nuốt im lặng**.
  useEffect(() => {
    let active = true;
    void fetchReports()
      .then((rows) => { if (active) { setReports(rows); setLoadError(""); } })
      .catch((e: unknown) => {
        if (!active) return;
        setReports([]);
        setLoadError(e instanceof Error ? e.message : "Không tải được danh sách báo lỗi.");
      });
    return () => { active = false; };
  }, []);

  async function toggle(r: Row) {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const next = String(r.status) !== "resolved";
      await submit("mark_error_report_resolved", { reportId: r.id, resolved: next });
      setMessage(next ? `Đã đánh dấu ${r.reportCode} là xong.` : `Đã mở lại ${r.reportCode}.`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Không cập nhật được report.");
    } finally { setBusy(false); }
  }

  const open = reports.find((r) => String(r.id) === openId);

  return (
    <div className="stack error-report-admin" data-vntech="error-report-tab">
      <section className="card">
        <header className="card-head">
          <div>
            <h3>DANH SÁCH BÁO LỖI</h3>
            <p>Người dùng gửi từ nút báo lỗi cạnh nút đổi màu nền. Ưu tiên report gần nhất.</p>
          </div>
          <button type="button" className="secondary" onClick={() => void load()}>↻ Tải lại</button>
        </header>
        {message && <div className="inline-alert">{message}</div>}
        {/* ⭐ VÁ BUG-20261006-001 — hiện LỖI RÕ RÀNG thay vì «Chưa có báo lỗi nào» gây hiểu sai.
            ⛔ Trước đây lỗi 403 (thiếu quyền) bị nuốt im lặng ⇒ người dùng tưởng «không có dữ liệu». */}
        {loadError && (
          <div className="inline-alert">
            <p><b>Không tải được danh sách báo lỗi.</b> {loadError}</p>
            <p>Thao tác xem danh sách báo lỗi chỉ dành cho <b>quản trị viên</b>. Nếu anh/chị là quản trị viên,
              hãy kiểm tra lại quyền của tài khoản ở mục «Phân quyền công việc / Chức năng».</p>
          </div>
        )}
        {!loadError && !reports.length && <p className="admin-empty">Chưa có báo lỗi nào.</p>}
        {!loadError && !!reports.length && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã report</th><th>Mục</th><th>Tiêu đề</th><th>Mã NV</th><th>Tên đăng nhập</th>
                  <th>Tên</th><th>Phòng ban</th><th>Thời gian gửi</th><th>Report về</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={String(r.id)} data-report-code={String(r.reportCode)}>
                    <td><strong>{r.reportCode}</strong></td>
                    <td>{r.reportType === "gop_y" ? "Góp ý" : "Báo lỗi"}</td>
                    <td>{r.title}</td>
                    <td>{r.employeeCode || "—"}</td>
                    <td>{r.username || "—"}</td>
                    <td>{r.fullName || "—"}</td>
                    <td>{r.organizationName || "—"}</td>
                    <td>{r.createdAt || "—"}</td>
                    <td>{label(String(r.moduleKey ?? ""))}</td>
                    <td>
                      <div className="row-actions">
                        {/* ⭐ 06/10/2026 — nhãn nút theo ngữ nghĩa MODAL: mở thì hiện «✕ Đóng»
                            (⚠️ trước đây ghi «Thu gọn» — ⛔ chỉ đúng khi chi tiết là thẻ INLINE). */}
                        <button type="button" className="export-mini" data-vntech="open-report-detail"
                          onClick={() => setOpenId(String(r.id) === openId ? "" : String(r.id))}>
                          {String(r.id) === openId ? "✕ Đóng" : "Chi tiết"}
                        </button>
                        <button type="button" className={`export-mini ${String(r.status) === "resolved" ? "" : "mini-approve"}`}
                          disabled={busy} data-vntech="mark-report-resolved"
                          onClick={() => void toggle(r)}>
                          {String(r.status) === "resolved" ? "✓ Đã xử lý" : "○ Đánh dấu xong"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ⭐ 06/10/2026 (USER YÊU CẦU) — CHI TIẾT HIỂN THỊ TRONG **MODAL**.
          ⚠️ TRƯỚC ĐÂY là thẻ `<section className="card">` INLINE dưới bảng ⇒ phải CUỘN MỚI THẤY,
          và bấm «Chi tiết» ở dòng nào cũng mở cùng một thẻ ⇒ dễ lẫn với dòng đang xem.
          ⇒ Nay dùng `BaseModal` (tái dùng) ⇒ nổi lên giữa màn, đóng bằng nút × hoặc click ra ngoài.
          ⛔ NỘI DUNG GIỮ NGUYÊN 100 % (9 trường + nội dung báo lỗi) — chỉ đổi CÁCH HIỂN THỊ. */}
      {open && (
        <BaseModal
          title={`CHI TIẾT · ${String(open.reportCode)}`}
          note="Toàn bộ thông tin người gửi và nội dung báo lỗi."
          close={() => setOpenId("")}
        >
          <dl className="error-report-detail-list" data-vntech="error-report-detail">
            <div><dt>Mã report</dt><dd>{open.reportCode}</dd></div>
            <div><dt>Tiêu đề</dt><dd>{open.title}</dd></div>
            <div><dt>Mã nhân viên</dt><dd>{open.employeeCode || "—"}</dd></div>
            <div><dt>Tên đăng nhập</dt><dd>{open.username || "—"}</dd></div>
            <div><dt>Tên</dt><dd>{open.fullName || "—"}</dd></div>
            <div><dt>Phòng ban</dt><dd>{open.organizationName || "—"}</dd></div>
            <div><dt>Thời gian gửi</dt><dd>{open.createdAt || "—"}</dd></div>
            <div><dt>Report về vấn đề gì</dt><dd>{label(String(open.moduleKey ?? ""))}</dd></div>
            <div><dt>Trạng thái</dt><dd>{String(open.status) === "resolved" ? "Đã xử lý xong" : "Chưa xử lý"}</dd></div>
            {open.resolutionNote ? <div><dt>Ghi chú xử lý</dt><dd>{open.resolutionNote}</dd></div> : null}
          </dl>
          <div className="error-report-content"><b>NỘI DUNG BÁO LỖI</b><p>{open.content}</p></div>
        </BaseModal>
      )}
    </div>
  );
}
