package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/** Port Pháp chế/HR — port nguyên trạng hr/labor contract JS. */
public interface HrStore {

    Optional<Map<String, Object>> findUser(String userId);
    Optional<Map<String, Object>> findHrRecord(String userId);
    void insertHrRecord(String id, String userId, String fullName, String identityNo, String identityDate,
                        String identityPlace, String birthDate, String birthplace, String permanentAddress,
                        String phone, String educationLevel, String joinedDate, String position, String note,
                        String createdBy, Instant now);
    void updateHrRecord(String id, String fullName, String identityNo, String identityDate, String identityPlace,
                        String birthDate, String birthplace, String permanentAddress, String phone,
                        String educationLevel, String joinedDate, String position, String note, Instant now);
    Optional<Map<String, Object>> findLaborContract(String id);
    String nextLaborContractNo();
    void insertLaborContract(String id, String contractNo, String userId, String contractType, String startDate,
                             String endDate, String signingDate, double salary, String note, String createdBy,
                             Instant now);
    void updateLaborContract(String id, String userId, String contractType, String startDate, String endDate,
                             String signingDate, double salary, String note, Instant now);
    void setLaborContractStatus(String id, String status, Instant now);
    void deleteLaborContract(String id);

    // ---- correspondence ----
    Optional<Map<String, Object>> findCorrespondence(String id);
    Optional<Map<String, Object>> findCorrespondenceByDocNo(String docNo);
    void insertCorrespondence(String id, String docNo, String direction, String docType, String issueDate,
                              String senderName, String receiverName, String summary, String internalHandler,
                              String resultNote, String createdBy, Instant now);
    void updateCorrespondence(String id, String docNo, String direction, String docType, String issueDate,
                              String senderName, String receiverName, String summary, String internalHandler,
                              String resultNote, Instant now);
    void setCorrespondenceStatus(String id, String status, String resultNote, Instant now);
    void deleteCorrespondence(String id);

    // ---- legal documents ----
    Optional<Map<String, Object>> findLegalDocument(String id);
    Optional<Map<String, Object>> findLegalDocumentByDocNo(String docNo);
    void insertLegalDocument(String id, String docNo, String docType, String title, String issueDate, String issuer,
                             String effectiveDate, String expiryDate, String scope, String attachmentId,
                             String createdBy, Instant now);
    void updateLegalDocument(String id, String docNo, String docType, String title, String issueDate, String issuer,
                             String effectiveDate, String expiryDate, String scope, String attachmentId, Instant now);
    void setLegalDocumentStatus(String id, String status, Instant now);
    void deleteLegalDocument(String id);

    // ---- seals ----
    Optional<Map<String, Object>> findSeal(String id);
    Optional<Map<String, Object>> findSealByNo(String sealNo);
    void insertSeal(String id, String sealNo, String sealName, String sealType, String custodian,
                    String registeredDate, String usageNote, String createdBy, Instant now);
    void updateSeal(String id, String sealNo, String sealName, String sealType, String custodian,
                    String registeredDate, String usageNote, Instant now);
    void setSealStatus(String id, String status, Instant now);
    void deleteSeal(String id);

    // ---- benefit records ----
    Optional<Map<String, Object>> findBenefitRecord(String id);
    String nextBenefitRecordNo();
    void insertBenefitRecord(String id, String benefitNo, String userId, String benefitType, String provider,
                             String startDate, String endDate, double monthlyAmount, String note,
                             String createdBy, Instant now);
    void updateBenefitRecord(String id, String userId, String benefitType, String provider, String startDate,
                             String endDate, double monthlyAmount, String note, Instant now);
    void setBenefitRecordStatus(String id, String status, Instant now);
    void deleteBenefitRecord(String id);
}