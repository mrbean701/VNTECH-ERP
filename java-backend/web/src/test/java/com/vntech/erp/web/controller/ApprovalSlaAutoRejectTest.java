package com.vntech.erp.web.controller;

import com.vntech.erp.application.port.out.OpsTaskStore;
import com.vntech.erp.application.port.out.RequestStore;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * MT3-A1 — <b>LUẬT SLA 72 GIỜ</b> cho danh sách chờ duyệt.
 *
 * <p><b>Nguồn luật</b> (quyết định user 27/09/2026 — `docs/dsh/MT3_USER_DECISIONS.md` §A1, nguyên văn):
 * «ưu tiên hiển thị các đơn mới nhất, nếu có đơn sắp đạt SLA 72 thì ưu tiên hiển thị trước.
 * Giữ quá SLA là giữ lại luật SLA. Nếu như quá SLA mà không có ai duyệt mặc định bị hệ thống từ chối.
 * Từ chối khi quá SLA.»
 *
 * <p><b>7 CA BIÊN</b> (⛔ không chỉ kiểm ca thuận lợi):
 * <ol>
 *   <li>CHƯA quá hạn ⇒ ⛔ KHÔNG từ chối, phiếu vẫn `pending`.</li>
 *   <li>ĐÚNG MỐC BIÊN (`now == due_at + 72h`) ⇒ ✅ TỪ CHỐI.</li>
 *   <li>QUÁ MỐC (`now > due_at + 72h`) ⇒ ✅ TỪ CHỐI + phiếu về người lập + `approval_stage=0`.</li>
 *   <li>`due_at` NULL ⇒ ⛔ KHÔNG từ chối (⛔ không suy diễn khi thiếu hạn).</li>
 *   <li>GỌI LẶP 3 lần ⇒ <b>IDEMPOTENT</b>: lần đầu 1, các lần sau 0, `decided_at` ⛔ KHÔNG đổi.</li>
 *   <li>Bước ĐÃ quyết định rồi (`approved`) ⇒ ⛔ KHÔNG bị đụng.</li>
 *   <li>THỨ TỰ danh sách chờ duyệt: đơn HẠN GẦN HƠN lên trước; cùng hạn ⇒ đơn MỚI NHẤT trước.</li>
 * </ol>
 *
 * <p>⚠️ Test **trực tiếp trên tầng store** (⛔ không dựng topology HTTP): đã xác minh **toàn repo
 * KHÔNG có khoá ngoại nào** (`FOREIGN KEY` = 0 kết quả) ⇒ chèn dữ liệu tối thiểu là hợp lệ.
 */
@SpringBootTest
// 🔴🔴 BÀI HỌC LỚN ĐÃ MẮC THẬT — NGUYÊN NHÂN THẬT của «50/74 bài đổ khi thêm lớp test này»:
//   `@AutoConfigureMockMvc` **THAY ĐỔI KHOÁ CACHE CONTEXT** của Spring Test.
//   Lớp này TRƯỚC ĐÂY thiếu nó ⇒ sinh ra **một BIẾN THỂ CONTEXT THỨ HAI** ⇒ spring **tái dùng cache
//   context khác đi** ⇒ **H2 in-memory (`jdbc:h2:mem:vntech` — DB DÙNG CHUNG) sống lâu hơn dự kiến**
//   ⇒ lớp test chạy sau thấy bảng `users` ĐÃ CÓ DÒNG ⇒ `AuthUseCase:83` `isSetupComplete()=true`
//   ⇒ `setup` trả **409** ⇒ đổ hàng loạt.
//   ✅ BẰNG CHỨNG TÁCH BẠCH: chạy bộ test **⛔ không có** lớp này ⇒ **67/67 ĐẠT**.
//   ⛔ Hai cách sửa SAI tôi đã thử và ⛔ KHÔNG hiệu quả: (1) `DELETE` ở `@AfterEach`;
//      (2) `@Transactional` cho rollback. ⇒ Vì vấn đề ⛔ KHÔNG nằm ở DỮ LIỆU mà ở **VÒNG ĐỜI CONTEXT**.
//   ⇒ CÁCH ĐÚNG: dùng **ĐÚNG cấu hình context** như mọi lớp test khác trong dự án.
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
// 🔴 BÀI HỌC ĐÃ MẮC THẬT (sửa sau khi bộ test đỏ 50/74):
//   H2 của profile test là DB **DÙNG CHUNG** (`jdbc:h2:mem:vntech`, ⛔ không `DB_CLOSE_DELAY`).
//   1) Chèn dữ liệu thô mà ⛔ không dọn  ⇒ lớp sau nhận `409` («đã setup») — **50/74 bài đổ**.
//   2) Dọn bằng `DELETE` ở `@AfterEach` ⇒ VẪN đỏ ⇒ ⛔ không phải chỉ do dữ liệu sót.
//   ⇒ Cách ĐÚNG: chạy mỗi bài trong **một giao dịch tự ROLLBACK** ⇒ ⛔ không để lại dấu vết nào
//      ⇒ ⛔ không phá thứ tự/trạng thái của các lớp test khác.
@Transactional
class ApprovalSlaAutoRejectTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private RequestStore requestStore;

    @Autowired
    private OpsTaskStore opsTaskStore;

    /** Mốc "bây giờ" cố định để biên tính được chính xác. */
    private static final Instant NOW = Instant.parse("2026-09-27T10:00:00Z");
    private static final long GRACE = 72L;
    private static final String REASON = "Hệ thống tự động từ chối: quá hạn SLA (test).";

    private static Timestamp ts(Instant instant) {
        return instant == null ? null : Timestamp.from(instant);
    }

    /** Danh sách id phiếu do test này chèn — dùng để DỌN SẠCH. */
    private static final List<String> SEEDED = List.of(
            "r1", "r2", "r3", "r4", "r5", "r6", "rA", "rB", "rC");

    /**
     * 🔴 <b>BẮT BUỘC DỌN SẠCH</b> — bài học đã mắc THẬT:
     * H2 của profile test là DB **DÙNG CHUNG** (`jdbc:h2:mem:vntech`, ⛔ không có `DB_CLOSE_DELAY`).
     * Lần đầu tôi ⛔ không dọn ⇒ **50/74 bài của các lớp KHÁC đổ** với `409` («đã setup rồi»).
     * ⇒ Mọi test chèn dữ liệu THÔ (⛔ không qua luồng `setup`) **PHẢI** xoá lại đúng phần mình chèn.
     * ⚠️ Xoá theo **đúng danh sách id** (⛔ không dùng mẫu `LIKE` rộng để tránh xoá nhầm dữ liệu khác).
     */
    @AfterEach
    void cleanup() {
        for (String id : SEEDED) {
            jdbc.update("DELETE FROM request_comments WHERE request_id=?", id);
            jdbc.update("DELETE FROM approvals WHERE request_id=?", id);
            jdbc.update("DELETE FROM material_requests WHERE id=?", id);
        }
    }

    /** Phiếu tối thiểu — các cột còn lại đều CÓ DEFAULT. */
    private void seedRequest(String id, String status, int approvalStage, Instant createdAt) {
        jdbc.update("INSERT INTO material_requests (id,request_no,project_id,requested_by,requested_at,"
                        + "needed_at,area,status,approval_stage,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                id, "MR-" + id, "p_sla", "u_sla", ts(createdAt), ts(createdAt), "Khu A", status,
                approvalStage, ts(createdAt), ts(createdAt));
    }

    /** Bước phê duyệt tối thiểu. `dueAt == null` ⇒ mô phỏng bước KHÔNG có hạn. */
    private void seedApproval(String id, String requestId, int stage, String status, Instant dueAt,
                              Instant createdAt, String roleCodes) {
        jdbc.update("INSERT INTO approvals (id,request_id,stage,department,status,due_at,created_at,"
                        + "updated_at,allowed_role_codes_snapshot) VALUES (?,?,?,?,?,?,?,?,?)",
                id, requestId, stage, "KH", status, ts(dueAt), ts(createdAt), ts(createdAt), roleCodes);
    }

    private String statusOf(String requestId, int stage) {
        return jdbc.queryForObject("SELECT status FROM approvals WHERE request_id=? AND stage=?",
                String.class, requestId, stage);
    }

    private int sweep() {
        return requestStore.rejectOverdueApprovals(GRACE, REASON, NOW);
    }

    // ── ① CHƯA quá hạn ────────────────────────────────────────────────────────────────────────
    @Test
    void chuaQuaHan_thiKhongTuChoi() {
        seedRequest("r1", "pending_approval", 1, NOW.minusSeconds(3600));
        seedApproval("a1", "r1", 1, "pending", NOW.plusSeconds(10 * 3600), NOW.minusSeconds(3600), "kh_truong");

        Assertions.assertEquals(0, sweep(), "chưa quá hạn ⇒ ⛔ KHÔNG được từ chối");
        Assertions.assertEquals("pending", statusOf("r1", 1), "bước phải VẪN chờ duyệt");
        Assertions.assertEquals("pending_approval",
                jdbc.queryForObject("SELECT status FROM material_requests WHERE id=?", String.class, "r1"));
    }

    // ── ② ĐÚNG MỐC BIÊN: now == due_at + 72h ───────────────────────────────────────────────────
    @Test
    void dungMocBien_thiTuChoi() {
        seedRequest("r2", "pending_approval", 1, NOW.minusSeconds(100 * 3600));
        // due_at = NOW - 72h  ⇔  NOW == due_at + 72h  (ĐÚNG biên)
        seedApproval("a2", "r2", 1, "pending", NOW.minusSeconds(GRACE * 3600), NOW.minusSeconds(100 * 3600), "kh_truong");

        Assertions.assertEquals(1, sweep(), "ĐÚNG mốc biên ⇒ phải TỪ CHỐI (user: «Từ chối KHI quá SLA»)");
        Assertions.assertEquals("rejected", statusOf("r2", 1));
    }

    // ── ③ QUÁ MỐC + hiệu ứng ĐẦY ĐỦ giống người duyệt từ chối ─────────────────────────────────
    @Test
    void quaMoc_thiTuChoiVaTraPhieuVeNguoiLap() {
        seedRequest("r3", "pending_approval", 2, NOW.minusSeconds(200 * 3600));
        seedApproval("a3", "r3", 2, "pending", NOW.minusSeconds(100 * 3600), NOW.minusSeconds(200 * 3600), "kh_truong");

        Assertions.assertEquals(1, sweep(), "quá mốc ⇒ phải TỪ CHỐI");
        Assertions.assertEquals("rejected", statusOf("r3", 2));
        Map<String, Object> mr = jdbc.queryForMap(
                "SELECT status,approval_stage FROM material_requests WHERE id=?", "r3");
        Assertions.assertEquals("returned_to_requester", mr.get("status"),
                "phiếu phải về NGƯỜI LẬP — đúng hiệu ứng người duyệt từ chối");
        Assertions.assertEquals(0, ((Number) mr.get("approval_stage")).intValue(),
                "bước duyệt phải về 0");
        Integer decided = jdbc.queryForObject(
                "SELECT COUNT(*) FROM approvals WHERE request_id=? AND stage=? AND decided_at IS NOT NULL",
                Integer.class, "r3", 2);
        Assertions.assertEquals(1, decided, "phải ghi nhận THỜI ĐIỂM quyết định");
    }

    // ── ④ due_at NULL ⇒ ⛔ KHÔNG suy diễn ─────────────────────────────────────────────────────
    @Test
    void dueAtNull_thiKhongTuChoi() {
        seedRequest("r4", "pending_approval", 1, NOW.minusSeconds(500 * 3600));
        seedApproval("a4", "r4", 1, "pending", null, NOW.minusSeconds(500 * 3600), "kh_truong");

        Assertions.assertEquals(0, sweep(), "⛔ KHÔNG có hạn ⇒ ⛔ KHÔNG được suy diễn là quá hạn");
        Assertions.assertEquals("pending", statusOf("r4", 1));
    }

    // ── ⑤ GỌI LẶP ⇒ IDEMPOTENT ───────────────────────────────────────────────────────────────
    @Test
    void goiLap_thiIdempotent() {
        seedRequest("r5", "pending_approval", 1, NOW.minusSeconds(200 * 3600));
        seedApproval("a5", "r5", 1, "pending", NOW.minusSeconds(100 * 3600), NOW.minusSeconds(200 * 3600), "kh_truong");

        Assertions.assertEquals(1, sweep(), "lần 1 ⇒ từ chối 1 bước");
        Timestamp first = jdbc.queryForObject(
                "SELECT decided_at FROM approvals WHERE request_id=? AND stage=?", Timestamp.class, "r5", 1);
        Assertions.assertEquals(0, sweep(), "lần 2 ⇒ ⛔ KHÔNG từ chối lại (đã hết `pending`)");
        Assertions.assertEquals(0, sweep(), "lần 3 ⇒ ⛔ vẫn 0");
        Timestamp after = jdbc.queryForObject(
                "SELECT decided_at FROM approvals WHERE request_id=? AND stage=?", Timestamp.class, "r5", 1);
        Assertions.assertEquals(first, after, "⛔ `decided_at` KHÔNG được đổi ở các lần gọi sau");
        Integer comments = jdbc.queryForObject(
                "SELECT COUNT(*) FROM request_comments WHERE request_id=?", Integer.class, "r5");
        Assertions.assertEquals(1, comments, "⛔ KHÔNG được ghi thêm bình luận ở lần gọi lặp");
    }

    // ── ⑥ Bước ĐÃ quyết định ⇒ ⛔ KHÔNG bị đụng ──────────────────────────────────────────────
    @Test
    void daDuyetRoi_thiKhongBiDung() {
        seedRequest("r6", "pending_approval", 1, NOW.minusSeconds(300 * 3600));
        seedApproval("a6", "r6", 1, "approved", NOW.minusSeconds(200 * 3600), NOW.minusSeconds(300 * 3600), "kh_truong");

        Assertions.assertEquals(0, sweep(), "bước đã duyệt ⇒ ⛔ KHÔNG được từ chối");
        Assertions.assertEquals("approved", statusOf("r6", 1), "trạng thái phải GIỮ NGUYÊN");
    }

    // ── ⑦ THỨ TỰ danh sách chờ duyệt ─────────────────────────────────────────────────────────
    @Test
    void thuTuDanhSachChoDuyet_dungLuatUser() {
        Instant base = NOW.minusSeconds(1000 * 3600);
        // (a) hạn XA nhất · tạo MỚI NHẤT
        seedRequest("rA", "pending_approval", 1, base.plusSeconds(300));
        seedApproval("aA", "rA", 1, "pending", NOW.plusSeconds(90 * 3600), base.plusSeconds(300), "role_x");
        // (b) hạn GẦN nhất · tạo CŨ nhất  ⇒ phải LÊN ĐẦU
        seedRequest("rB", "pending_approval", 1, base);
        seedApproval("aB", "rB", 1, "pending", NOW.plusSeconds(5 * 3600), base, "role_x");
        // (c) CÙNG hạn với (a) nhưng tạo MỚI HƠN  ⇒ phải đứng TRƯỚC (a) khi cùng hạn
        seedRequest("rC", "pending_approval", 1, base.plusSeconds(600));
        seedApproval("aC", "rC", 1, "pending", NOW.plusSeconds(90 * 3600), base.plusSeconds(600), "role_x");

        List<Map<String, Object>> list = opsTaskStore.pendingApprovalsForRoleCodes(List.of("role_x"));
        List<String> order = list.stream().map(r -> String.valueOf(r.get("requestId"))).toList();
        Assertions.assertEquals(List.of("rB", "rC", "rA"), order,
                "luật user: đơn SẮP ĐẠT SLA (hạn gần) lên TRƯỚC; cùng hạn thì đơn MỚI NHẤT trước");
    }
}
