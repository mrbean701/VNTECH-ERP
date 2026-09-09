# VNTECH Native Verifier Foundation

W2 chỉ chốt protocol và trust root công khai; chưa kèm binary native và chưa enforce. Native verifier tương lai phải xác minh manifest phát hành, chữ ký Ed25519, machine/TPM evidence và trả kết quả theo `protocol-v1.json`.

Binary native phải được build/sign ở pipeline riêng. Source ERP không chứa private signing key. Runtime Development hiện dùng verifier JavaScript tương thích cùng license schema.
