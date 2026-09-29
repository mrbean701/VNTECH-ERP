import { useEffect, useState } from "react";
import type { AppData, Row } from "@/lib/ui-shared";

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

  const modules = (data.moduleCatalog ?? []).filter((m: Row) => String(m.active ?? 1) === "1");
  const label = (key: string) => String(modules.find((m: Row) => String(m.moduleKey) === key)?.label ?? key ?? "—");

  async function load() {
    const res = (await submit("error_reports", {})) as { reports?: Row[] } | undefined;
    // ⛔ Backend đã ORDER BY created_at DESC ⇒ mới nhất trước. Vẫn sắp lại ở UI cho chắc.
    const rows = (res?.reports ?? []).slice().sort((a: Row, b: Row) =>
      String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    setReports(rows);
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

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
        {!reports.length && <p className="admin-empty">Chưa có báo lỗi nào.</p>}
        {!!reports.length && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã report</th><th>Mục</th><th>Tiêu đề</th><th>Mã NV</th><th>User</th>
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
                        <button type="button" className="export-mini"
                          onClick={() => setOpenId(String(r.id) === openId ? "" : String(r.id))}>
                          {String(r.id) === openId ? "Thu gọn" : "Chi tiết"}
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

      {open && (
        <section className="card" data-vntech="error-report-detail">
          <header className="card-head"><div><h3>CHI TIẾT · {String(open.reportCode)}</h3>
            <p>Toàn bộ thông tin người gửi và nội dung báo lỗi.</p></div>
            <button type="button" className="secondary" onClick={() => setOpenId("")}>Đóng</button>
          </header>
          <dl className="error-report-detail-list">
            <div><dt>Mã report</dt><dd>{open.reportCode}</dd></div>
            <div><dt>Tiêu đề</dt><dd>{open.title}</dd></div>
            <div><dt>Mã nhân viên</dt><dd>{open.employeeCode || "—"}</dd></div>
            <div><dt>User</dt><dd>{open.username || "—"}</dd></div>
            <div><dt>Tên</dt><dd>{open.fullName || "—"}</dd></div>
            <div><dt>Phòng ban</dt><dd>{open.organizationName || "—"}</dd></div>
            <div><dt>Thời gian gửi</dt><dd>{open.createdAt || "—"}</dd></div>
            <div><dt>Report về vấn đề gì</dt><dd>{label(String(open.moduleKey ?? ""))}</dd></div>
            <div><dt>Trạng thái</dt><dd>{String(open.status) === "resolved" ? "Đã xử lý xong" : "Chưa xử lý"}</dd></div>
            {open.resolutionNote ? <div><dt>Ghi chú xử lý</dt><dd>{open.resolutionNote}</dd></div> : null}
          </dl>
          <div className="error-report-content"><b>NỘI DUNG BÁO LỖI</b><p>{open.content}</p></div>
        </section>
      )}
    </div>
  );
}
