// MỐC 103 (user 29/09) — MENU «REVIEW HĐ».
// Nhân sự hành chính ghi nhận việc kiểm tra/review hợp đồng.
// Click vào hợp đồng ⇒ mở modal chi tiết gồm Thông tin hợp đồng + Lịch sử review.
//
// MỐC 105 — UI chung: nhóm nút Tạo + CRUD + Search + Sort + Filter nằm NGANG ở bên phải
// toolbar (`ListToolbar`), Total Count bên trái. Không dùng layout lệch thành nhiều cột dọc.
//
// MỐC 106 — các tab trong cùng modal phải ĐỒNG NHẤT kích thước / chiều rộng / chiều cao
// và cách căn chỉnh, KHÔNG đổi theo độ dài nội dung hay độ dài tiêu đề tab.
import { useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge } from "@/app/components/ui";
import { ListToolbar } from "@/app/components/ui/ListToolbar";
import { BaseModal } from "@/lib/ui-blocks";
import { CardHead, Empty, date } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const d = (v: unknown) => date(v); // MT3-S03 (08/10/2026) — ⛔ hết in NGÀY ISO thô: đi qua `date()` DÙNG CHUNG ⇒ `dd/mm/yyyy`
const viewedOf = (r: Row) => r.viewed === true || s(r.viewed) === "1" || s(r.viewed) === "true";

/** ⛔ MỐC 106: chiều rộng tab CỐ ĐỊNH, không theo độ dài tiêu đề. */
const REVIEW_TABS = [
  { key: "info", label: "Thông tin hợp đồng", width: "240px" },
  { key: "logs", label: "Lịch sử review", width: "200px" },
] as const;

export function ContractReviewScreen({ data, action, permission }: {
  data: AppData; action: (name: string, payload: Row) => Promise<boolean>;
  permission: { canCreate: boolean; canEdit: boolean; canUse: boolean };
}) {
  const rows = (data.contractReviews as Row[]) || [];
  const [query, setQuery] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [sort, setSort] = useState<"received" | "no" | "status">("received");
  const [detail, setDetail] = useState<Row | null>(null);
  const [tab, setTab] = useState<"info" | "logs">("info");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  // ⛔ THỜI GIAN THAO TÁC: đo từ lúc mở modal tới lúc ghi nhận / đóng.
  const openedAt = useRef<number>(0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows.filter((r) => (onlyPending ? !viewedOf(r) : true))
      .filter((r) => !q || [r.contractNo, r.contractType, r.contractName, r.senderName, r.receiverName]
        .some((v) => s(v).toLowerCase().includes(q)));
    out = [...out].sort((a, b) => {
      if (sort === "no") return s(a.contractNo).localeCompare(s(b.contractNo));
      if (sort === "status") return Number(viewedOf(a)) - Number(viewedOf(b));
      return s(b.receivedDate).localeCompare(s(a.receivedDate));
    });
    return out;
  }, [rows, query, onlyPending, sort]);

  // Mỗi khi mở modal ⇒ bắt đầu đo thời gian thao tác + ghi nhận lượt xem.
  useEffect(() => {
    if (!detail) return;
    openedAt.current = Date.now();
    void action("open_contract_review", { reviewId: s(detail.id) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.id]);

  const elapsed = () => Math.max(0, Math.round((Date.now() - openedAt.current) / 1000));

  async function confirmReview() {
    if (!detail) return;
    setBusy(true);
    const ok = await action("log_contract_review", {
      reviewId: s(detail.id), comment, durationSeconds: String(elapsed()),
    });
    setBusy(false);
    if (ok) { setMsg("Đã ghi nhận kết quả review."); setComment(""); setDetail(null); }
  }

  const pendingCount = rows.filter((r) => !viewedOf(r)).length;

  return (
    <div className="stack module-screen">
      <div className="kpi-grid small">
        <div className="kpi"><span className="kpi-label">Tổng hợp đồng</span><strong className="kpi-value">{rows.length}</strong></div>
        <div className="kpi"><span className="kpi-label">Chưa xem</span><strong className="kpi-value">{pendingCount}</strong></div>
        <div className="kpi"><span className="kpi-label">Đã xem</span><strong className="kpi-value">{rows.length - pendingCount}</strong></div>
      </div>

      <section className="card">
        <CardHead title="Review hợp đồng"
          note="Danh sách hợp đồng cần kiểm tra. Bấm vào một dòng để mở modal chi tiết (thông tin hợp đồng + lịch sử review)." />

        {/* MỐC 105 — toolbar ngang: bên trái Total Count, bên phải nhóm nút. */}
        <ListToolbar
          title="Danh sách hợp đồng"
          count={visible.length}
          total={rows.length}
          unit="hợp đồng"
          search={{ value: query, onChange: setQuery, placeholder: "Tìm mã HĐ · loại · tên · bên gửi/nhận…" }}
          sort={{
            value: sort,
            onChange: (v) => setSort(v as typeof sort),
            options: [
              { value: "received", label: "Ngày nhận (mới nhất)" },
              { value: "no", label: "Mã HĐ (A→Z)" },
              { value: "status", label: "Trạng thái (chưa xem trước)" },
            ],
          }}
          filters={[{
            key: "viewed",
            label: "Trạng thái",
            value: onlyPending ? "pending" : "all",
            onChange: (v) => setOnlyPending(v === "pending"),
            options: [
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Chỉ chưa xem" },
            ],
          }]}
          actions={permission.canEdit ? (
            <button type="button" className="primary" onClick={() => setMsg("Bấm vào một dòng để mở modal chi tiết và ghi nhận review.")}
              data-vntech="review-create">＋ Ghi nhận review</button>
          ) : null}
        />

        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Mã hợp đồng</th><th>Loại hợp đồng</th><th>Tên hợp đồng</th>
              <th>Bên gửi</th><th>Bên nhận</th><th>Ngày nhận</th><th>Ngày review</th><th>Trạng thái</th>
            </tr></thead>
            <tbody>
              {visible.map((r) => (
                <tr key={s(r.id)} onClick={() => setDetail(r)} title="Xem chi tiết hợp đồng" style={{ cursor: "pointer" }}>
                  <td><strong>{s(r.contractNo) || "—"}</strong></td>
                  <td>{s(r.contractType) || "—"}</td>
                  <td>{s(r.contractName) || "—"}</td>
                  <td>{s(r.senderName) || "—"}</td>
                  <td>{s(r.receiverName) || "—"}</td>
                  <td>{d(r.receivedDate)}</td>
                  <td>{d(r.reviewDate)}</td>
                  <td><StatusBadge value={viewedOf(r) ? "Đã xem" : "Chưa xem"} /></td>
                </tr>
              ))}
              {!visible.length && (
                <tr><td colSpan={8}>
                  <Empty text={rows.length ? "Không có hợp đồng nào khớp bộ lọc." : "Chưa có hợp đồng cần review."} />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {msg && <div className="notice" role="status">{msg}</div>}

      {/* ⛔ MỐC 106 — modal 2 tab ĐỒNG NHẤT: tab width cố định, panel cao cố định. */}
      {detail && (
        <BaseModal title={s(detail.contractName) || `Hợp đồng ${s(detail.contractNo)}`}
          note="Thông tin hợp đồng và lịch sử các lượt nhân sự hành chính đã kiểm tra."
          close={() => setDetail(null)}>
          <div className="review-modal">
            <div className="user-admin-tabs" role="tablist">
              {REVIEW_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  data-vntech={`review-tab-${t.key}`}
                  className={tab === t.key ? "active" : ""}
                  style={{ width: t.width, minWidth: t.width, maxWidth: t.width }}
                  onClick={() => setTab(t.key)}
                >{t.label}</button>
              ))}
            </div>

            {/* ⛔ Chiều cao cố định ⇒ nội dung ngắn/dài KHÔNG làm modal nhảy kích thước. */}
            <div className="review-tab-panel" data-vntech={`review-panel-${tab}`}>
              {tab === "info" ? (
                <dl className="kv">
                  <dt>Mã hợp đồng</dt><dd>{s(detail.contractNo) || "—"}</dd>
                  <dt>Loại hợp đồng</dt><dd>{s(detail.contractType) || "—"}</dd>
                  <dt>Tên hợp đồng</dt><dd>{s(detail.contractName) || "—"}</dd>
                  <dt>Bên gửi</dt><dd>{s(detail.senderName) || "—"}</dd>
                  <dt>Bên nhận</dt><dd>{s(detail.receiverName) || "—"}</dd>
                  <dt>Ngày nhận</dt><dd>{d(detail.receivedDate)}</dd>
                  <dt>Ngày review</dt><dd>{d(detail.reviewDate)}</dd>
                  <dt>Trạng thái</dt>
                  <dd><StatusBadge value={viewedOf(detail) ? "Đã xem" : "Chưa xem"} /></dd>
                </dl>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th>Thời gian review</th><th>Thời gian thao tác</th><th>Trạng thái</th><th>Người review</th>
                    </tr></thead>
                    <tbody>
                      {((detail.logs as Row[]) || []).map((l) => (
                        <tr key={s(l.id)}>
                          <td>{s(l.reviewedAt) || "—"}</td>
                          <td>{l.durationSeconds === null || l.durationSeconds === undefined ? "—" : `${s(l.durationSeconds)} giây`}</td>
                          <td><StatusBadge value={s(l.status) === "reviewed" ? "Đã review" : "Đã xem"} /></td>
                          <td>{s(l.reviewerName) || "—"}</td>
                        </tr>
                      ))}
                      {!((detail.logs as Row[]) || []).length && (
                        <tr><td colSpan={4}><Empty text="Chưa có lượt review nào." /></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {permission.canEdit && (
              <div className="modal-actions review-modal-actions">
                <input placeholder="Nhận xét (không bắt buộc)" value={comment}
                  onChange={(e) => setComment(e.target.value)} />
                <button type="button" className="primary" disabled={busy} onClick={confirmReview}
                  data-vntech="confirm-review">Ghi nhận đã review</button>
              </div>
            )}
          </div>
        </BaseModal>
      )}
    </div>
  );
}
