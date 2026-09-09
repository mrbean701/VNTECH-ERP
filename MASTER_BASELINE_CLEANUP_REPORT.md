# VNTECH ERP V5.3.0 — MASTER BASELINE CLEANUP R1.1.1 FINAL

Ngày khóa source: 08/09/2026  
Package: `VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1`  
Build: `5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908`

## Phạm vi khóa

- Không bổ sung nghiệp vụ mới.
- Không đổi workflow, RBAC, BOQ, Kho, Đề nghị, Mua hàng, PO, SLA hoặc dữ liệu giao dịch.
- Không redesign UI; mục tiêu là cleanup source/CSS và đồng bộ runtime/release identity.
- Nghiêm cấm xóa declaration của selector còn sống chỉ vì chưa thấy nó thắng trong một fixture. Bản FINAL dùng chiến lược **safe-clean**: chỉ xóa selector branch chứng minh không thể match source/runtime, rule trùng y hệt, biến CSS không có consumer, comment/marker lịch sử và container rỗng.

## Kết quả cleanup kiến trúc

1. `/api/files` chỉ còn một SSOT: `app/api/files/route.ts`; Universal/Local Server delegate vào cùng built Worker route.
2. `PathFileBucket` và `LocalFileBucket` đều có `delete()` vật lý; sửa biến `filesRouteUrl` mồ côi ở Local Server.
3. Archive project giữ `contract_ownership_transfers` trong SSOT.
4. `approval_project_assignments` trong `db/schema.ts` phản ánh đúng DDL migration 0047, không khai báo FK ảo.
5. Migration head nâng tới `0049_master_baseline_identity_refresh_r1_1_1.sql`; 0049 chỉ refresh metadata identity/trust, không đổi nghiệp vụ.
6. Runtime local/PostgreSQL migrator lấy source fingerprint từ identity SSOT, không hard-code fingerprint release cũ.
7. Fingerprint source được tính lại từ 171 source file và verifier tự tính lại source fingerprint khi chạy.

## CSS cleanup an toàn

| Chỉ số | Source gốc 07/09 | R1.1.1 FINAL safe-clean | Thay đổi |
|---|---:|---:|---:|
| `globals.css` | 472.227 B | **400.653 B** | **-15,16%** |
| `!important` | 5.288 | **4.950** | **-6,39%** |
| Dòng CSS | 3.391 | **2.725** | **-19,64%** |
| Class chết theo audit | chưa khóa | **0** | sạch |
| CSS variable chết | chưa khóa | **0** | sạch |
| Marker patch/override lịch sử | nhiều | **0** | sạch |
| Media/container rỗng | có lịch sử | **0** | sạch |

R1.1.1 cố ý giữ nhiều declaration hơn bản cleanup aggressive trước đó. Lý do: các phép xóa declaration riêng lẻ đã chứng minh có thể làm sai Login/collapsed state. Ưu tiên cuối cùng là **không xóa nhầm** chứ không tối đa hóa tỷ lệ giảm dung lượng.

## Contract chống xóa nhầm CSS

`css-baseline-audit.mjs` kiểm hai chiều Source ↔ CSS:

- base `.nav-glyph` phải còn width/height/min-width/display/place-items/background/color/border;
- mọi tone động từ `NAV_ICON_TONE` phải có CSS tương ứng (`green`, `indigo`, `red`...);
- các family động `nav-subgroup-*`, `nav-child-*`, `request-match-*`, `mapping-status-*`, `density-*`, `boq-row-*` được khóa contract;
- cấm class chết, biến chết, media rỗng, marker patch lịch sử và CSS append sau canonical END.

## Visual equivalence

So với R1 candidate đã chạy ổn định, gate RGB/computed-style sau khi chờ transition kết thúc hoàn toàn đạt **0 pixel diff + 0 computed-style diff trên 12/12 trạng thái**:

- Desktop 1672×941;
- Desktop dark;
- Desktop sidebar collapsed;
- 1366×768;
- 1024×768;
- Mobile 941×1672;
- Mobile dark;
- Mobile 390×844;
- Login Desktop;
- Login Desktop dark;
- Login Mobile 941×1672;
- Login 390×844.

Sai khác collapsed ở vòng trước được xác định là false-positive do screenshot chụp giữa transition 0,18 giây; sau khi chụp ở trạng thái settled, diff = 0.

## Technical debt cố ý chưa refactor

`scripts/system-route.mjs` và `app/page.tsx` vẫn lớn. Không tách chúng trong R1.1.1 vì refactor monolith là thay đổi kiến trúc rủi ro cao và phải có vòng riêng. Không dùng CSS patch để che technical debt backend/frontend.
