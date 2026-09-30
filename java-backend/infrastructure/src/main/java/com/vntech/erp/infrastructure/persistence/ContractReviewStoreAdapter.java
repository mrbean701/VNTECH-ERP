package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.ContractReviewStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * MỐC 103 (user 29/09) — MENU «REVIEW HĐ». Adapter JDBC cho {@code contract_reviews}
 * và {@code contract_review_logs}.
 *
 * <p>⛔ Bảng mới PHẢI khai {@code COLLATE=utf8mb4_unicode_ci} (đã làm ở drizzle/0315) —
 * nếu không, JOIN với bảng cũ sẽ lỗi 1267 và làm hỏng TOÀN BỘ BootstrapDataAdapter.
 */
@Repository
public class ContractReviewStoreAdapter implements ContractReviewStore {

    private final JdbcTemplate jdbcTemplate;

    public ContractReviewStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<Map<String, Object>> MAPPER = (ResultSet rs, int i) -> {
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", rs.getString("id"));
        m.put("contractId", rs.getString("contract_id"));
        m.put("contractNo", rs.getString("contract_no"));
        m.put("contractType", rs.getString("contract_type"));
        m.put("contractName", rs.getString("contract_name"));
        m.put("senderName", rs.getString("sender_name"));
        m.put("receiverName", rs.getString("receiver_name"));
        m.put("receivedDate", rs.getString("received_date"));
        m.put("reviewDate", rs.getString("review_date"));
        m.put("viewed", rs.getInt("viewed") == 1);
        m.put("lastReviewerName", rs.getString("last_reviewer_name"));
        m.put("note", rs.getString("note"));
        m.put("createdAt", rs.getString("created_at"));
        m.put("updatedAt", rs.getString("updated_at"));
        return m;
    };

    @Override
    public List<Map<String, Object>> listReviews() {
        return jdbcTemplate.query("""
                SELECT id,contract_id,contract_no,contract_type,contract_name,sender_name,receiver_name,
                       received_date,review_date,viewed,last_reviewer_name,note,created_at,updated_at
                FROM contract_reviews
                ORDER BY viewed ASC, IFNULL(received_date,'') DESC, IFNULL(created_at,'') DESC""", MAPPER);
    }

    @Override
    public Map<String, Object> findReview(String id) {
        List<Map<String, Object>> rows = jdbcTemplate.query("""
                SELECT id,contract_id,contract_no,contract_type,contract_name,sender_name,receiver_name,
                       received_date,review_date,viewed,last_reviewer_name,note,created_at,updated_at
                FROM contract_reviews WHERE id=?""", MAPPER, id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Override
    @Transactional
    public void saveReview(String id, String contractId, String contractNo, String contractType,
                           String contractName, String senderName, String receiverName,
                           String receivedDate, String reviewDate, boolean viewed,
                           String note, String userId, Instant now) {
        String ts = now.toString();
        int n = jdbcTemplate.update("""
                UPDATE contract_reviews SET contract_id=?,contract_no=?,contract_type=?,contract_name=?,
                       sender_name=?,receiver_name=?,received_date=?,review_date=?,viewed=?,note=?,updated_at=?
                WHERE id=?""",
                contractId, contractNo, contractType, contractName, senderName, receiverName,
                receivedDate, reviewDate, viewed ? 1 : 0, note, ts, id);
        if (n == 0) {
            jdbcTemplate.update("""
                    INSERT INTO contract_reviews (id,contract_id,contract_no,contract_type,contract_name,
                            sender_name,receiver_name,received_date,review_date,viewed,note,created_by,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    id, contractId, contractNo, contractType, contractName, senderName, receiverName,
                    receivedDate, reviewDate, viewed ? 1 : 0, note, userId, ts, ts);
        }
    }

    @Override
    @Transactional
    public void deleteReview(String id) {
        jdbcTemplate.update("DELETE FROM contract_review_logs WHERE review_id=?", id);
        jdbcTemplate.update("DELETE FROM contract_reviews WHERE id=?", id);
    }

    @Override
    public List<Map<String, Object>> listLogs(String reviewId) {
        return jdbcTemplate.query("""
                SELECT id,review_id,contract_id,reviewed_at,duration_seconds,status,reviewer_id,reviewer_name,comment,created_at
                FROM contract_review_logs WHERE review_id=?
                ORDER BY IFNULL(reviewed_at,'') DESC, IFNULL(created_at,'') DESC""",
                (rs, i) -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", rs.getString("id"));
                    m.put("reviewId", rs.getString("review_id"));
                    m.put("contractId", rs.getString("contract_id"));
                    m.put("reviewedAt", rs.getString("reviewed_at"));
                    int d = rs.getInt("duration_seconds");
                    m.put("durationSeconds", rs.wasNull() ? null : d);
                    m.put("status", rs.getString("status"));
                    m.put("reviewerName", rs.getString("reviewer_name"));
                    m.put("comment", rs.getString("comment"));
                    m.put("createdAt", rs.getString("created_at"));
                    return m;
                }, reviewId);
    }

    @Override
    @Transactional
    public void addLog(String id, String reviewId, String contractId, String reviewedAt,
                       Integer durationSeconds, String status, String reviewerId, String reviewerName,
                       String comment, Instant now) {
        // MỐC 103b — `reviewer_name` PHẢI là TÊN NGƯỜI, không phải mã tài khoản.
        //   `Principal` (HrManagementUseCase.Principal) chỉ có `userId()` + `role()`, không có tên
        //   hiển thị ⇒ tra `users.full_name` ngay trong câu lệnh. Không tra được (tài khoản đã xoá)
        //   thì giữ giá trị truyền vào để không mất dấu vết.
        jdbcTemplate.update("""
                INSERT INTO contract_review_logs (id,review_id,contract_id,reviewed_at,duration_seconds,
                        status,reviewer_id,reviewer_name,comment,created_at)
                SELECT ?,?,?,?,?,?,?,IFNULL((SELECT full_name FROM users WHERE id=?),?),?,?""",
                id, reviewId, contractId, reviewedAt, durationSeconds, status, reviewerId,
                reviewerId, reviewerName, comment, now.toString());
    }

    @Override
    @Transactional
    public void markViewed(String reviewId, String reviewerId, String reviewerName,
                           String reviewedAt, Integer durationSeconds, Instant now) {
        // MỐC 103b — `last_reviewer_name` cũng phải là TÊN NGƯỜI (xem chú thích ở `addLog`).
        jdbcTemplate.update("""
                UPDATE contract_reviews SET viewed=1,review_date=COALESCE(NULLIF(?,''),review_date),
                       last_reviewer_id=?,
                       last_reviewer_name=IFNULL((SELECT full_name FROM users WHERE id=?),?),
                       updated_at=? WHERE id=?""",
                reviewedAt == null ? "" : reviewedAt.substring(0, Math.min(10, reviewedAt.length())),
                reviewerId, reviewerId, reviewerName, now.toString(), reviewId);
    }
}
