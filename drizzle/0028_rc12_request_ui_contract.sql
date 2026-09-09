-- KHO VNTECH V5.2.5 RC12 - 2026-08-26
-- Phiếu đề nghị của BCH không gán tổ đội. Tổ đội chỉ được chọn khi cấp phát vật tư thực tế.
UPDATE form_field_config
SET visible=0,
    required=0,
    importable=0,
    exportable=0,
    editable=0,
    active=0,
    updated_at=datetime('now')
WHERE form_key='request_header' AND field_key='teamId';
