package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * MỐC 103 (user 29/09) — MENU «REVIEW HĐ».
 * Nhân sự hành chính ghi nhận việc kiểm tra/review hợp đồng.
 *
 * <p>Bảng CSDL: {@code contract_reviews} + {@code contract_review_logs}.
 */
public interface ContractReviewStore {

    List<Map<String, Object>> listReviews();

    Map<String, Object> findReview(String id);

    /**
     * Thêm / sửa một hợp đồng trong danh sách cần review.
     * {@code viewed} = 1 (đã xem) hoặc 0 (chưa xem).
     */
    void saveReview(String id, String contractId, String contractNo, String contractType,
                    String contractName, String senderName, String receiverName,
                    String receivedDate, String reviewDate, boolean viewed,
                    String note, String userId, Instant now);

    void deleteReview(String id);

    List<Map<String, Object>> listLogs(String reviewId);

    /**
     * Ghi 1 dòng LỊCH SỬ REVIEW: thời gian review · thời gian thao tác · trạng thái · người review.
     *
     * @param durationSeconds thời gian thao tác (giây); null được nếu chưa biết
     */
    void addLog(String id, String reviewId, String contractId, String reviewedAt,
                Integer durationSeconds, String status, String reviewerId, String reviewerName,
                String comment, Instant now);

    void markViewed(String reviewId, String reviewerId, String reviewerName,
                    String reviewedAt, Integer durationSeconds, Instant now);
}
