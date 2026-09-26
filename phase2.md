PHASE 2 — PURCHASE REQUEST / PURCHASE ORDER WORKFLOW
1. MỤC TIÊU
Tiếp tục triển khai Phase 2 — Mua hàng & Cung ứng của VNTECH ERP.
Đây là yêu cầu nghiệp vụ quan trọng, có liên quan trực tiếp đến:
PR
→ Approval Workflow
→ PO
→ GRN
→ Inventory / Receiving

Không được triển khai chỉ dựa trên mô tả trong prompt này.
BẮT BUỘC phải audit tài liệu mô tả quy trình Phase 2 đang có trong repository trước khi thay đổi code.
————
2. BẮT BUỘC ĐỌC VÀ PHÂN TÍCH TÀI LIỆU PHASE 2
Tìm trong repository các tài liệu liên quan đến:
Phase 2
Purchase
Material Request
MR
Purchase Request
PR
Purchase Order
PO
Approval
Workflow
GRN
Receiving

Đặc biệt tìm file tài liệu mô tả luồng phê duyệt đơn đề nghị mua hàng / PR → PO.
Nếu tài liệu không phải Word/text thông thường
Có thể là:
- PDF;
- PDF scan;
- tài liệu có sơ đồ;
- ảnh;
- diagram;
- screenshot;
- tài liệu embedded image.
Nếu text extraction không đủ để hiểu quy trình:
BẮT BUỘC phải sử dụng khả năng phân tích hình ảnh / render page / screenshot phù hợp để đọc sơ đồ và nội dung trực quan.
Không được kết luận:
Không đọc được text → bỏ qua tài liệu

Phải cố gắng đọc cả:
TEXT
+
TABLE
+
DIAGRAM
+
FLOWCHART
+
IMAGE

————
3. NGUYÊN TẮC AUDIT TRƯỚC KHI IMPLEMENT
Trước khi sửa code:
READ PHASE 2 DOCUMENT
        ↓
UNDERSTAND BUSINESS FLOW
        ↓
AUDIT CURRENT DATABASE
        ↓
AUDIT CURRENT API
        ↓
AUDIT CURRENT WORKFLOW ENGINE
        ↓
AUDIT CURRENT PR/MR/PO/GRN IMPLEMENTATION
        ↓
COMPARE DOCUMENT ↔ CURRENT SYSTEM
        ↓
IDENTIFY GAP
        ↓
PROPOSE REQUIRED CHANGES
        ↓
IMPLEMENT

Không được tự ý thay đổi database hoặc business flow chỉ vì thấy kiến trúc hiện tại khác mong muốn.
Mọi điểm chưa rõ phải được phân loại:
CONFIRMED FROM DOCUMENT
CURRENT SYSTEM BEHAVIOR
USER REQUIREMENT
INFERENCE
UNKNOWN

Không được biến INFERENCE hoặc UNKNOWN thành business rule mà không kiểm tra.
————
4. KHẢ NĂNG LOẠI BỎ MR
Có khả năng nghiệp vụ cuối cùng sẽ không sử dụng MR độc lập và chỉ còn:
PR
PO
GRN

Tuy nhiên:
KHÔNG được xóa MR ngay.
Trước tiên phải audit:
MR hiện đang tồn tại ở đâu?
MR có bảng database riêng không?
MR có API riêng không?
MR có UI riêng không?
MR có được PR sử dụng làm source không?
MR có liên quan tới BOQ/procurement allocation không?
Có dữ liệu cũ đang sử dụng MR không?
Workflow hiện tại có reference MR không?
Report/export có reference MR không?

Sau audit phải đưa ra kết luận:
MR = REQUIRED
hoặc
MR = LEGACY / INTERNAL ONLY
hoặc
MR = REMOVE / MERGE INTO PR

Nếu cần loại bỏ MR:
Ưu tiên migration/transition an toàn, không được xóa dữ liệu hoặc phá reference cũ.
————
5. BUSINESS FLOW MỤC TIÊU
Theo yêu cầu nghiệp vụ hiện tại, flow chính cần hướng tới:
PR
 ↓
Approval Workflow
 ↓
All approval stages completed
 ↓
PR Approved
 ↓
Create / Split PO
 ↓
PO Processing
 ↓
Order / Track Supplier
 ↓
GRN
 ↓
Receive Materials
 ↓
PO Completed
 ↓
All PO Completed
 ↓
PR Completed

————
6. PR APPROVAL WORKFLOW
PR phải đi qua workflow phê duyệt theo thứ tự:
1. Thư ký Tổng Giám đốc
        ↓
2. Phòng Dự án
        ↓
3. Phòng Kế hoạch
        ↓
4. Giám đốc

Không hard-code logic này trực tiếp vào UI hoặc backend nếu hệ thống đã có Dynamic Workflow Engine.
Phải sử dụng workflow động hiện có.
PR phải lưu reference tới workflow version/snapshot đã được áp dụng.
Ví dụ:
PR001
workflow_id = WF-PR-2026-001
workflow_version = 3

————
7. WORKFLOW VERSIONING
Đây là requirement bắt buộc.
Khi PR được tạo:
PR001
   ↓
workflow = WF-PR
version = V1

Sau đó admin thay đổi workflow:
WF-PR V1
      ↓
      V2

PR001 KHÔNG được tự động chuyển sang V2.
PR001 phải tiếp tục chạy theo:
WF-PR V1

Trong khi PR mới:
PR002

sẽ sử dụng:
WF-PR V2

Do đó cần kiểm tra/thiết kế cơ chế:
Workflow Definition
Workflow Version
Workflow Instance / Snapshot
Workflow Step Instance
Approval Record

Không chỉ lưu một workflow_id đơn thuần nếu điều đó không đủ để bảo đảm workflow cũ vẫn bất biến.
————
8. PR → PO
Chỉ khi toàn bộ approval step của PR hoàn thành:
PR APPROVAL COMPLETE

thì PR mới được chuyển sang trạng thái cho phép tạo PO.
Không được tạo PO từ PR đang:
PENDING
REJECTED
CANCELLED

trừ khi business rule hiện tại trong tài liệu Phase 2 quy định khác và đã được xác nhận.
————
9. MỘT PR CÓ THỂ TÁCH THÀNH NHIỀU PO
Đây là requirement quan trọng.
Không được thiết kế quan hệ:
1 PR = 1 PO

mà phải hỗ trợ:
1 PR
 ├── PO001
 ├── PO002
 └── PO003

Lý do:
Một PR có thể chứa nhiều mã vật tư nhưng một nhà cung cấp không nhất thiết đáp ứng được toàn bộ vật tư.
Ví dụ:
PR001

Mã VT    SL
----------------
VT001    100
VT002    200
VT003    300
VT004    50

Có thể tách:
PO001 → Supplier A
VT001
VT002

PO002 → Supplier B
VT003

PO003 → Supplier C
VT004

————
10. LOGIC SPLIT PO FROM PR
Cần xây dựng logic:
PR
 ↓
Select PR Items
 ↓
Select Supplier
 ↓
Create PO
 ↓
Assign selected PR Items to PO

Một PR item có thể được chia thành nhiều PO nếu business requirement cho phép.
Ví dụ:
PR001
VT001 required = 100

PO001 = 60
PO002 = 40

Do đó phải phân biệt:
PR Requested Quantity
PO Allocated Quantity
GRN Received Quantity
Remaining Quantity

Không được chỉ dùng một field quantity.
————
11. MATERIAL CODE + QUANTITY VALIDATION
Bắt buộc kiểm tra:
Material code
PO chỉ được tạo từ material code tồn tại hợp lệ trong PR.
Không được:
PR001 contains VT001
PO001 creates VT999

nếu VT999 không thuộc PR hoặc không được phép bổ sung theo business rule.
Quantity
Tổng quantity được phân bổ vào PO không được vượt quá quantity PR:
SUM(PO allocated quantity)
<=
PR requested quantity

Ví dụ:
PR001
VT001 = 100

PO001 = 60
PO002 = 40

Total PO = 100
Remaining = 0

Không được:
PO001 = 60
PO002 = 60

Total = 120

trừ khi có business rule rõ ràng cho phép vượt.
————
12. PO TRACKING
Sau khi PR được approved và PO được tạo, trách nhiệm nghiệp vụ chuyển sang quy trình PO.
PO phải hỗ trợ tối thiểu:
Supplier
Order creation
Order placement
Order tracking
Expected delivery
Actual delivery
Delivery status
GRN reference
Material received
Remaining quantity

Phần nghiệp vụ này chủ yếu thuộc:
Phòng Kế hoạch
+
Kế toán

theo phạm vi nghiệp vụ đã mô tả.
————
13. PO → GRN
Một PO có thể có một hoặc nhiều GRN nếu thực tế giao hàng nhiều đợt.
Không được giả định:
1 PO = 1 GRN

Mô hình phải hỗ trợ:
PO001
 ├── GRN001
 ├── GRN004
 └── GRN007

Ví dụ:
PO001
VT001 ordered = 100

GRN001 received = 60
GRN002 received = 40

Total received = 100

Khi đủ:
Received Quantity >= Ordered Quantity

và tất cả điều kiện hoàn thành của PO thỏa mãn:
PO001 = COMPLETED

————
14. PO COMPLETION LOGIC
Không được cho PO thành COMPLETED chỉ vì:
PO created

hoặc:
Order placed

PO chỉ hoàn thành khi toàn bộ vật tư thuộc PO đã được xử lý nhận hàng đầy đủ theo business rule.
Cần kiểm tra:
Ordered Quantity
        ↓
GRN Received Quantity
        ↓
Remaining Quantity

Ví dụ:
PO001
Ordered = 100
Received = 100
Remaining = 0

→ PO001 COMPLETED

Nếu:
Ordered = 100
Received = 70
Remaining = 30

→ PO001 NOT COMPLETED

————
15. PR COMPLETION LOGIC
PR không được hoàn thành chỉ vì:
PR approved

hoặc:
PO created

PR chỉ hoàn thành khi tất cả PO phát sinh từ PR đã hoàn thành.
Ví dụ:
PR001
 ├── PO001
 ├── PO002
 └── PO003

và:
PO001 → COMPLETED
PO002 → COMPLETED
PO003 → COMPLETED

thì:
PR001 → COMPLETED

Nếu:
PO001 → COMPLETED
PO002 → COMPLETED
PO003 → IN_PROGRESS

thì:
PR001.is_complete = false

————
16. PR COMPLETION MUST BE DERIVED FROM PO STATE
Không được để frontend tự quyết định:
PR.is_complete = true

Backend phải tính/validate trạng thái.
Logic conceptually:
PR is COMPLETED
IF
    PR approval is completed
    AND
    PR has required PO coverage
    AND
    EVERY related PO is COMPLETED
    AND
    ALL required quantities have been received

Cần xác định chính xác business rule từ tài liệu Phase 2 trước khi implement.
Đặc biệt phải phân biệt:
No PO created
Partial PO
PO partially received
PO fully received
PO cancelled
PO rejected
PO completed

Không được coi:
PO cancelled

là tự động hoàn thành PR nếu chưa có business rule cho phép.
————
17. DATA RELATIONSHIP
Audit database hiện tại và thiết kế relationship tối thiểu theo hướng:
PR
 │
 ├── PR Items
 │
 ├── Workflow Instance
 │
 ├── Approval Steps
 │
 └── PO Allocations
          │
          ├── PO001
          │     └── GRN(s)
          │
          ├── PO002
          │     └── GRN(s)
          │
          └── PO003
                └── GRN(s)

Cần đảm bảo truy vết được:
PR
→ PR Item
→ PO
→ PO Item
→ GRN
→ GRN Item
→ Received Quantity

Mọi quantity phải có thể đối soát.
————
18. KHÔNG ĐƯỢC TẠO DUPLICATE DATA LOGIC
Trước khi thêm bảng/API:
AUDIT CURRENT TABLES
AUDIT CURRENT RELATIONSHIPS
AUDIT CURRENT API ACTIONS
AUDIT CURRENT WORKFLOW TABLES
AUDIT CURRENT GRN / GOODS_RECEIPTS

Đặc biệt báo cáo hiện trạng cho biết database hiện đã có:
material_requests
material_request_items
purchase_orders
approvals
supply_workflow_steps
goods_receipts
procurement_allocations
contract_stock_ledger

Do đó ưu tiên mở rộng kiến trúc hiện tại thay vì tạo một hệ thống PR/PO/GRN thứ hai.
————
19. APPROVAL TIMELINE UI
PR detail phải hiển thị approval timeline dạng:
●──────●──────●──────●
│      │      │      │
TK TGĐ  DA     KH     GĐ

Mỗi step hiển thị:
Approver
Department
Step Order
Status
Approval Time
Comment / Reason

Các trạng thái cần phản ánh dữ liệu thật:
PENDING
IN_PROGRESS
APPROVED
REJECTED
CANCELLED

Không hard-code approval status.
Phải lấy từ workflow/approval instance thực tế.
————
20. PR → PO UI
Trong PR detail cần thể hiện rõ:
PR001

Approval
   ↓
Approved

PO:
├── PO001 — Supplier A — COMPLETED
├── PO002 — Supplier B — IN_PROGRESS
└── PO003 — Supplier C — PENDING

PR STATUS:
IN_PROGRESS

Khi tất cả hoàn thành:
PO001 — COMPLETED
PO002 — COMPLETED
PO003 — COMPLETED

PR STATUS:
COMPLETED

————
21. PO DETAIL UI
PO detail phải cho phép xem:
Source PR
Supplier
PO Items
Ordered Quantity
Received Quantity
Remaining Quantity
GRN List
Delivery Status
Order Status
Timeline / Activity

Có thể click:
PO → GRN
GRN → PO
PO → PR
PR → PO list

để truy vết ngược/xuôi.
————
22. PERMISSION / RBAC
Mọi action phải đi qua backend authorization.
Đặc biệt:
Create PR
Approve PR
Reject PR
Create PO
Split PO
Assign Supplier
Update PO
Create GRN
Receive Material
Complete PO
Complete PR

Không được chỉ ẩn button ở frontend.
Phải kiểm tra:
Role
Capability
Department
Scope
Project
Approval authority

theo RBAC hiện tại.
————
23. DYNAMIC WORKFLOW — KHÔNG HARD-CODE
Không được implement:
if step === 1 → secretary
if step === 2 → project
if step === 3 → planning
if step === 4 → director

trực tiếp như business engine.
Các bước hiện tại:
Thư ký TGĐ
Phòng Dự án
Phòng Kế hoạch
Giám đốc

là workflow configuration hiện tại, không phải logic hard-coded.
Workflow engine phải có khả năng thay đổi:
Step
Order
Approver
Department
Role
Permission
SLA

mà không phải sửa source code.
————
24. BACKWARD COMPATIBILITY
Không được phá dữ liệu PR/MR/PO/GRN hiện tại.
Trước migration phải:
BACKUP / CHECKPOINT
AUDIT REFERENCES
CHECK EXISTING DATA
CHECK MIGRATION SAFETY

Không dùng:
DROP TABLE
DELETE ALL
RESET DATABASE

trong quá trình phát triển nếu không có chỉ thị rõ ràng.
Migration phải append-only theo kiến trúc integrity hiện tại.
————
25. TEST CASE BẮT BUỘC
Phải tạo/điều chỉnh test cho tối thiểu các trường hợp:
Case 1
PR
→ chưa approve đủ
→ không được tạo PO

Case 2
PR
→ approve đủ
→ tạo PO

Case 3
PR
→ 3 PO
→ tất cả PO completed
→ PR completed

Case 4
PR
→ 3 PO
→ 2 completed
→ 1 incomplete
→ PR incomplete

Case 5
PO ordered = 100
GRN received = 70
→ PO incomplete

Case 6
PO ordered = 100
GRN1 = 60
GRN2 = 40
→ PO completed

Case 7
PR item = 100
PO001 = 60
PO002 = 40
→ valid

Case 8
PR item = 100
PO001 = 60
PO002 = 60
→ reject / prevent over-allocation

Case 9
PR001 → Workflow V1
Workflow changed → V2
PR001 continues V1
PR002 uses V2

Case 10
PO cancelled
→ verify PR completion logic

Case 11
Multiple GRN for one PO
→ quantity aggregation correct

Case 12
Multiple PO from one PR
→ source relationship preserved

————
26. TODO ENFORCEMENT
Đây là yêu cầu bắt buộc.
Mỗi khi BẮT ĐẦU một task mới phải gọi TODO tool.
Mỗi khi KẾT THÚC một task phải gọi TODO tool.
Không được chỉ nói:
TODO updated

mà không thực sự gọi TODO tool.
Workflow bắt buộc:
SELECT TASK
    ↓
CALL TODO TOOL
    ↓
TASK = IN_PROGRESS
    ↓
IMPLEMENT
    ↓
TEST
    ↓
VALIDATE
    ↓
CALL TODO TOOL
    ↓
TASK = COMPLETED
    ↓
SELECT NEXT TASK
    ↓
CALL TODO TOOL
    ↓
NEXT TASK = IN_PROGRESS
    ↓
CONTINUE

TODO phải phản ánh được tiến độ Phase 2 và toàn bộ MASTER TASK.
————
27. TELEGRAM PROGRESS REPORT
Phải báo cáo tiến độ qua Telegram theo cơ chế hiện có.
Tối thiểu:
Khi bắt đầu task
[START]
Phase 2
Task: P-XX
Description: ...
Status: IN PROGRESS

Khi hoàn thành task
[DONE]
Phase 2
Task: P-XX
Result: ...
Tests: ...
Next: P-XX

Khi blocker
[BLOCKED]
Task: P-XX
Reason: ...
Required decision: ...

Không được tuyên bố đã gửi Telegram nếu integration/tool không thực sự gửi thành công.
————
28. CONTINUOUS EXECUTION
Không dừng sau một task nhỏ.
Sau mỗi task:
FINISH
↓
TEST
↓
VALIDATE
↓
CALL TODO — MARK DONE
↓
UPDATE TASK HISTORY
↓
UPDATE MASTER STATUS
↓
REPORT TELEGRAM
↓
RE-READ MASTER TASK
↓
SELECT NEXT TASK
↓
CALL TODO — MARK IN PROGRESS
↓
CONTINUE

Không được:
Task P-01 DONE
→ Session complete

nếu Phase 2 hoặc MASTER TASK vẫn còn requirement.
————
29. PHASE 2 COMPLETION CONDITION
Không được đánh dấu Phase 2 hoàn thành chỉ vì:
PR UI done
PO UI done

Phải verify toàn bộ:
PR
├── Creation
├── Approval
├── Dynamic Workflow
├── Workflow Versioning
├── Approval Timeline
├── PO creation
├── PO splitting
├── Material validation
├── Quantity validation
├── Supplier assignment
├── PO tracking
├── GRN relationship
├── Partial receiving
├── Full receiving
├── PO completion
├── PR completion
├── RBAC
├── Audit
├── Regression tests
└── Documentation

Chỉ khi tất cả requirement đã được xác minh mới:
PHASE 2 = COMPLETE

————
30. FIRST ACTION — KHÔNG CODE NGAY
Ngay khi bắt đầu Phase 2:
1. Find Phase 2 purchase workflow document.
2. Read the complete document.
3. If necessary render/analyze images and diagrams.
4. Extract the documented PR → Approval → PO → GRN flow.
5. Audit current MR/PR/PO/GRN database.
6. Audit current APIs.
7. Audit current workflow engine.
8. Audit current UI.
9. Compare DOCUMENT vs CURRENT SYSTEM vs THIS REQUIREMENT.
10. Report the gap analysis.
11. Create/update TODO.
12. Then begin implementation.

Không được bỏ qua bước audit để code ngay.
Nếu tài liệu chứng minh rằng MR không còn cần thiết, lập kế hoạch migration từ MR → PR an toàn.
Nếu tài liệu vẫn yêu cầu MR, giữ MR và không tự ý loại bỏ.
————
31. SUCCESS CRITERIA
Mục tiêu cuối cùng của Phase 2 là hệ thống phải quản lý được chuỗi:
PR
 ↓
Dynamic Approval Workflow
 ↓
Approved PR
 ↓
Split PR → Multiple PO
 ↓
Supplier Order / Tracking
 ↓
Multiple GRN per PO
 ↓
Quantity Reconciliation
 ↓
PO Completion
 ↓
All PO Completed
 ↓
PR Completion

với đầy đủ:
TRACEABILITY
QUANTITY CONTROL
MATERIAL CODE CONTROL
WORKFLOW VERSIONING
RBAC
AUDIT
TESTING
TELEGRAM REPORTING
TODO TRACKING

Không được tạo logic giả lập chỉ để UI hiển thị đúng.
Backend + Database + Workflow + UI phải cùng phản ánh một business state duy nhất.