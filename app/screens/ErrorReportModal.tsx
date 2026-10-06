import { useMemo, useState } from "react";
import type { AppData, Row } from "@/lib/ui-shared";

/**
 * USER 29/09/2026 (MỐC 42) — MODAL BÁO LỖI.
 *
 * <p>Yêu cầu: nút báo lỗi nằm **cạnh nút đổi màu nền**; bấm vào mở modal cho phép
 * điền **tiêu đề · chọn mục cần báo lỗi · nội dung báo lỗi**.
 *
 * <p>⛔ Chỉ chọn được các module **NGHIỆP VỤ** — loại trừ `admin` (theo yêu cầu user:
 * không báo lỗi về chính màn Quản trị hệ thống). Backend cũng chặn lần 2 ở
 * `ErrorReportUseCase.save`.
 *
 * <p>⛔ MọI user đã đăng nhập đều gửi được — action `save_error_report` **không** gắc module
 * trong `ActionRbacRegistry` (mẫu `List.of()`, giống `mark_notification_read`).
 */
export default function ErrorReportModal({ data, close, submit }: {
  data: AppData;
  close: () => void;
  submit: (action: string, payload: Row) => Promise<unknown>;
}) {
  const user = (data.user ?? {}) as Row;
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState<"gop_y" | "bao_loi">("bao_loi");
  const [moduleKey, setModuleKey] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // ⛔ LOẠI TRỪ module `admin` + module không có quyền xem + module đã ẩn.
  // ⛔⛔ VÁ 06/10/2026 (GO-LIVE · BUG-20261006-002 — MỨC CAO) — **DROPDOWN RỖNG HOÀN TOÀN**.
  //   📍 TRIỆU CHỨNG (user báo): «mục chọn nhóm chức năng trong modal báo lỗi ⛔ không hiển thị gì cả»
  //   🔎 ĐO ĐƯỢC: `GET /api/system` (⭐ ĐÚNG cách UI gọi — ⛔ KHÔNG phải `POST {action:'bootstrap'}`)
  //      ⇒ `data.moduleCatalog` **CÓ dữ liệu thật**, ví dụ:
  //        `{"moduleKey":"admin_tab_01","label":"Quản trị hệ thống - Tab 01. Tài khoản",
  //          "active":true,"sortOrder":1,"systemLocked":true}`
  //   ⛔ NGUYÊN NHÂN GỐC: bộ lọc cũ so `String(m.active ?? 1) === "1"` ⚠️ nhưng dữ liệu trả
  //      **`active` KIỂU BOOLEAN `true`** ⇒ `String(true)` = **`"true"`** ≠ `"1"` ⇒ ⭐ **LỌC SẠCH
  //      TOÀN BỘ module** ⇒ ⭐ **dropdown rỗng** ✓
  //   ✅ SỬA: chấp nhận **CẢ HAI kiểu** — `true` (boolean) **và** `"1"`/`1` — ⭐ ⛔ không đổi
  //      hành vi cũ (⭐ module có `active="1"` vẫn qua như trước) ✓
  const dangHoatDong = (v: unknown) => v === true || String(v ?? 1) === "1" || String(v) === "true";
  const moduleOptions = useMemo(
    () => (data.moduleCatalog ?? [])
      .filter((m: Row) => dangHoatDong(m.active))
      .filter((m: Row) => String(m.moduleKey) !== "admin")
      .map((m: Row) => ({ key: String(m.moduleKey), label: String(m.label ?? m.moduleKey) })),
    [data.moduleCatalog],
  );

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!title.trim()) { setError("Thiếu tiêu đề."); return; }
    // MỐC 103 — «nhóm chức năng» KHÔNG BẮT BUỘC (user 29/09).
    if (!content.trim()) { setError("Thiếu nội dung."); return; }
    setBusy(true); setError("");
    try {
      await submit("save_error_report", {
        title: title.trim(),
        reportType,
        moduleKey,
        content: content.trim(),
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        employeeCode: user.employeeCode,
        organizationUnitId: user.organizationUnitId,
        organizationName: user.department ?? user.organizationName,
      });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không gửi được báo lỗi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <section className="modal error-report-modal" data-vntech="error-report-modal" role="dialog" aria-label="Báo lỗi">
        <header>
          <div>
            <h2>Báo lỗi / Góp ý</h2>
            <p>Gửi lỗi gặp phải hoặc ý kiến của bạn. Nội dung sẽ hiện ở tab «Báo lỗi» của màn Quản trị hệ thống.</p>
          </div>
          <button type="button" onClick={close} aria-label="Đóng">×</button>
        </header>
        <form onSubmit={send}>
          <div className="modal-body error-report-body">
            {error && <div className="inline-alert" role="alert">{error}</div>}
            <label className="error-report-field">
              <span>Tiêu đề *</span>
              <input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Sai số liệu hợp đồng" />
            </label>
            <label className="error-report-field">
              <span>Mục *</span>
              <select value={reportType} onChange={(e) => setReportType(e.target.value as "gop_y" | "bao_loi")}>
                <option value="bao_loi">Báo lỗi</option>
                <option value="gop_y">Góp ý</option>
              </select>
            </label>
            <label className="error-report-field">
              <span>Nhóm chức năng (không bắt buộc)</span>
              <select value={moduleKey} onChange={(e) => setModuleKey(e.target.value)}>
                <option value="">— Không chọn —</option>
                {moduleOptions.map((m: { key: string; label: string }) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </label>
            <label className="error-report-field">
              <span>Nội dung báo lỗi *</span>
              <textarea value={content} rows={7} maxLength={4000} onChange={(e) => setContent(e.target.value)}
                placeholder="Mô tả càng cụ thể càng dễ xử lý: bước thực hiện, kết quả mong đợi, kết quả thực tế." />
            </label>
          </div>
          <footer className="modal-footer">
            <button type="button" className="secondary" onClick={close}>Hủy</button>
            <button type="submit" className="primary" disabled={busy}>{busy ? "Đang gửi…" : "Gửi báo lỗi"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
