package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.HrStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter Pháp chế/HR. */
@Component
public class HrStoreAdapter implements HrStore {

    private final JdbcTemplate jdbcTemplate;

    public HrStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private Optional<Map<String, Object>> first(String sql, Object... args) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    /**
     * MT2 §10.4 (②A) — rỗng/trắng ⇒ {@code NULL} cho cột khoá {@code correspondence_id}.
     * ⛔ Không ghi chuỗi rỗng: để UI gỡ liên kết (bỏ chọn công văn) phải XOÁ ĐƯỢC liên kết, không phải
     * để lại một "id rỗng" rồi mất khả năng phân biệt với NULL khi tra cứu.
     */
    private static Object blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    @Override
    public Optional<Map<String, Object>> findUser(String userId) {
        return first("SELECT id FROM users WHERE id=?", userId);
    }

    @Override
    public Optional<Map<String, Object>> findHrRecord(String userId) {
        return first("SELECT * FROM hr_records WHERE user_id=?", userId);
    }

    @Override
    @Transactional
    public void insertHrRecord(String id, String userId, String fullName, String identityNo, String identityDate,
                               String identityPlace, String birthDate, String birthplace, String permanentAddress,
                               String phone, String educationLevel, String joinedDate, String position, String note,
                               String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO hr_records (id,user_id,full_name,identity_no,identity_date,identity_place,birth_date,
                                        birthplace,permanent_address,phone,education_level,joined_date,position,note,
                                        created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                id, userId, fullName, identityNo, identityDate, identityPlace, birthDate, birthplace,
                permanentAddress, phone, educationLevel, joinedDate, position, note, createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateHrRecord(String id, String fullName, String identityNo, String identityDate,
                               String identityPlace, String birthDate, String birthplace, String permanentAddress,
                               String phone, String educationLevel, String joinedDate, String position, String note,
                               Instant now) {
        jdbcTemplate.update("""
                UPDATE hr_records SET full_name=?,identity_no=?,identity_date=?,identity_place=?,birth_date=?,
                       birthplace=?,permanent_address=?,phone=?,education_level=?,joined_date=?,position=?,note=?,
                       updated_at=? WHERE id=?""",
                fullName, identityNo, identityDate, identityPlace, birthDate, birthplace, permanentAddress,
                phone, educationLevel, joinedDate, position, note, now, id);
    }

    @Override
    public Optional<Map<String, Object>> findLaborContract(String id) {
        return first("SELECT * FROM labor_contracts WHERE id=?", id);
    }

    @Override
    public String nextLaborContractNo() {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*)+1 FROM labor_contracts", Long.class);
        return n == null ? "1" : String.valueOf(n);
    }

    @Override
    @Transactional
    public void insertLaborContract(String id, String contractNo, String userId, String contractType,
                                    String startDate, String endDate, String signingDate, double salary,
                                    String note, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO labor_contracts (id,contract_no,user_id,contract_type,start_date,end_date,signing_date,
                                             salary,status,note,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,'active',?,?,?,?)""",
                id, contractNo, userId, contractType, startDate, endDate, signingDate, salary, note,
                createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateLaborContract(String id, String userId, String contractType, String startDate, String endDate,
                                    String signingDate, double salary, String note, Instant now) {
        jdbcTemplate.update("""
                UPDATE labor_contracts SET user_id=?,contract_type=?,start_date=?,end_date=?,signing_date=?,
                       salary=?,note=?,updated_at=? WHERE id=?""",
                userId, contractType, startDate, endDate, signingDate, salary, note, now, id);
    }

    @Override
    @Transactional
    public void setLaborContractStatus(String id, String status, Instant now) {
        jdbcTemplate.update("UPDATE labor_contracts SET status=?,updated_at=? WHERE id=?", status, now, id);
    }

    @Override
    @Transactional
    public void deleteLaborContract(String id) {
        jdbcTemplate.update("DELETE FROM labor_contracts WHERE id=?", id);
    }

    // ---------- correspondence ----------
    @Override
    public Optional<Map<String, Object>> findCorrespondence(String id) {
        return first("SELECT * FROM official_correspondence WHERE id=?", id);
    }

    @Override
    public Optional<Map<String, Object>> findCorrespondenceByDocNo(String docNo) {
        return first("SELECT id FROM official_correspondence WHERE doc_no=?", docNo);
    }

    @Override
    @Transactional
    public void insertCorrespondence(String id, String docNo, String direction, String docType, String issueDate,
                                     String senderName, String receiverName, String summary, String internalHandler,
                                     String resultNote, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO official_correspondence (id,doc_no,direction,doc_type,issue_date,sender_name,
                                                     receiver_name,summary,internal_handler,status,result_note,
                                                     created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,'received',?,?,?,?)""",
                id, docNo, direction, docType, issueDate, senderName, receiverName, summary, internalHandler,
                resultNote, createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateCorrespondence(String id, String docNo, String direction, String docType, String issueDate,
                                     String senderName, String receiverName, String summary, String internalHandler,
                                     String resultNote, Instant now) {
        jdbcTemplate.update("""
                UPDATE official_correspondence SET doc_no=?,direction=?,doc_type=?,issue_date=?,sender_name=?,
                       receiver_name=?,summary=?,internal_handler=?,result_note=?,updated_at=? WHERE id=?""",
                docNo, direction, docType, issueDate, senderName, receiverName, summary, internalHandler,
                resultNote, now, id);
    }

    @Override
    @Transactional
    public void setCorrespondenceStatus(String id, String status, String resultNote, Instant now) {
        jdbcTemplate.update("""
                UPDATE official_correspondence SET status=?,result_note=COALESCE(?,result_note),updated_at=?
                WHERE id=?""", status, resultNote, now, id);
    }

    @Override
    @Transactional
    public void deleteCorrespondence(String id) {
        jdbcTemplate.update("DELETE FROM official_correspondence WHERE id=?", id);
    }

    // ---------- legal documents ----------
    @Override
    public Optional<Map<String, Object>> findLegalDocument(String id) {
        return first("SELECT * FROM legal_documents WHERE id=?", id);
    }

    @Override
    public Optional<Map<String, Object>> findLegalDocumentByDocNo(String docNo) {
        return first("SELECT id FROM legal_documents WHERE doc_no=?", docNo);
    }

    @Override
    @Transactional
    public void insertLegalDocument(String id, String docNo, String docType, String title, String issueDate,
                                    String issuer, String effectiveDate, String expiryDate, String scope,
                                    String attachmentId, String correspondenceId, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO legal_documents (id,doc_no,doc_type,title,issue_date,issuer,effective_date,expiry_date,
                                             scope,attachment_id,correspondence_id,status,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,'active',?,?,?)""",
                id, docNo, docType, title, issueDate, issuer, effectiveDate, expiryDate, scope, attachmentId,
                blankToNull(correspondenceId), createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateLegalDocument(String id, String docNo, String docType, String title, String issueDate,
                                    String issuer, String effectiveDate, String expiryDate, String scope,
                                    String attachmentId, String correspondenceId, Instant now) {
        jdbcTemplate.update("""
                UPDATE legal_documents SET doc_no=?,doc_type=?,title=?,issue_date=?,issuer=?,effective_date=?,
                       expiry_date=?,scope=?,attachment_id=?,correspondence_id=?,updated_at=? WHERE id=?""",
                docNo, docType, title, issueDate, issuer, effectiveDate, expiryDate, scope, attachmentId,
                blankToNull(correspondenceId), now, id);
    }

    @Override
    @Transactional
    public void setLegalDocumentStatus(String id, String status, Instant now) {
        jdbcTemplate.update("UPDATE legal_documents SET status=?,updated_at=? WHERE id=?", status, now, id);
    }

    @Override
    @Transactional
    public void deleteLegalDocument(String id) {
        jdbcTemplate.update("DELETE FROM legal_documents WHERE id=?", id);
    }

    // ---------- seals ----------
    @Override
    public Optional<Map<String, Object>> findSeal(String id) {
        return first("SELECT * FROM seal_management WHERE id=?", id);
    }

    @Override
    public Optional<Map<String, Object>> findSealByNo(String sealNo) {
        return first("SELECT id FROM seal_management WHERE seal_no=?", sealNo);
    }

    @Override
    @Transactional
    public void insertSeal(String id, String sealNo, String sealName, String sealType, String custodian,
                           String registeredDate, String usageNote, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO seal_management (id,seal_no,seal_name,seal_type,custodian,registered_date,status,
                                             usage_note,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,'active',?,?,?,?)""",
                id, sealNo, sealName, sealType, custodian, registeredDate, usageNote, createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateSeal(String id, String sealNo, String sealName, String sealType, String custodian,
                           String registeredDate, String usageNote, Instant now) {
        jdbcTemplate.update("""
                UPDATE seal_management SET seal_no=?,seal_name=?,seal_type=?,custodian=?,registered_date=?,
                       usage_note=?,updated_at=? WHERE id=?""",
                sealNo, sealName, sealType, custodian, registeredDate, usageNote, now, id);
    }

    @Override
    @Transactional
    public void setSealStatus(String id, String status, Instant now) {
        jdbcTemplate.update("UPDATE seal_management SET status=?,updated_at=? WHERE id=?", status, now, id);
    }

    @Override
    @Transactional
    public void deleteSeal(String id) {
        jdbcTemplate.update("DELETE FROM seal_management WHERE id=?", id);
    }

    // ---------- benefit records ----------
    @Override
    public Optional<Map<String, Object>> findBenefitRecord(String id) {
        return first("SELECT * FROM benefit_records WHERE id=?", id);
    }

    @Override
    public String nextBenefitRecordNo() {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*)+1 FROM benefit_records", Long.class);
        return n == null ? "1" : String.valueOf(n);
    }

    @Override
    @Transactional
    public void insertBenefitRecord(String id, String benefitNo, String userId, String benefitType, String provider,
                                    String startDate, String endDate, double monthlyAmount, String note,
                                    String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO benefit_records (id,benefit_no,user_id,benefit_type,provider,start_date,end_date,
                                             monthly_amount,status,note,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,'active',?,?,?,?)""",
                id, benefitNo, userId, benefitType, provider, startDate, endDate, monthlyAmount, note,
                createdBy, now, now);
    }

    @Override
    @Transactional
    public void updateBenefitRecord(String id, String userId, String benefitType, String provider, String startDate,
                                    String endDate, double monthlyAmount, String note, Instant now) {
        jdbcTemplate.update("""
                UPDATE benefit_records SET user_id=?,benefit_type=?,provider=?,start_date=?,end_date=?,
                       monthly_amount=?,note=?,updated_at=? WHERE id=?""",
                userId, benefitType, provider, startDate, endDate, monthlyAmount, note, now, id);
    }

    @Override
    @Transactional
    public void setBenefitRecordStatus(String id, String status, Instant now) {
        jdbcTemplate.update("UPDATE benefit_records SET status=?,updated_at=? WHERE id=?", status, now, id);
    }

    @Override
    @Transactional
    public void deleteBenefitRecord(String id) {
        jdbcTemplate.update("DELETE FROM benefit_records WHERE id=?", id);
    }
}