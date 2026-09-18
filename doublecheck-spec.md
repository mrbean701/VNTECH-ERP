# Doublecheck spec

## Goal
Đưa luồng PHÊ DUYỆT PO vào hệ thống phê duyệt động ở CẢ 2 LÕI (Java + JS) và chuyển bề mặt chi tiết phiếu đề nghị sang modal dùng chung, với cổng `npm test` xanh và bằng chứng chạy thật.

## Scope
TRONG phạm vi: `app/page.tsx` (thay vỏ `<aside class="drawer request-drawer">` của `RequestDrawer` bằng `EntityDetailModal`); `scripts/system-route.mjs` (create_po ⇒ pending_approval; thêm approve_po/reject_po; thêm update_po_price; sửa `poId`→`firstPoId`); `java-backend/**` (PurchaseStore port + adapter `@Transactional` gộp 2 ghi; PurchaseManagementUseCase approvePo/rejectPo/updatePoPrice; SystemController 3 case); `tests/workflow-direct.test.ts` (cập nhật hợp đồng mới); `tools/*` (công cụ vá có mốc/tự chối + probes + cổng E2E có hoàn tác); `drizzle/0145_*` + file định danh/manifest (làm mới định danh). NGOÀI phạm vi: các phase khác của lộ trình 110 mục; dữ liệu baseline ngoài phạm vi probe có hoàn tác.

## Acceptance criteria
1. `tsc --noEmit` exit 0. 2. `npm test` (lint + typecheck + hồi quy + workflow) exit 0 — trong đó hồi quy 61/61 và tests/workflow-direct ĐẠT. 3. `npm run build` exit 0 + "BUILT ARTIFACT VALIDATION: ĐẠT" sau khi làm mới định danh (VNTECH-FP-86BBC6285E599BA5, head 0145). 4. Cổng E2E reject_po 8/8 (PO⇒cancelled, decision_reason/decided_by, MR KHÔNG đổi, task_notifications tới đúng buyer_user_id, hoàn tác sạch) và approve_po HTTP 200 ⇒ waiting_delivery + decided_by/decided_at. 5. Cổng giá PO 6/6: sửa được khi chưa hoàn thành (0⇒1234.56 đọc lại), BỊ CHẶN khi completed, CHECKSUM TABLE materials KHÔNG đổi. 6. receive_goods trả `warnings` (đo được trên response thật). 7. WF-05 5/5 và WF-02/S-08 5/5 với mã thoát 0.

## Failure modes
1. Đổi trạng thái PO khởi tạo ⇒ test cũ kỳ vọng waiting_delivery hỏng ⇒ CẬP NHẬT test theo hợp đồng mới (đã làm). 2. Dùng biến không tồn tại trong lõi JS (`poId`) ⇒ ReferenceError ⇒ HTTP 400 ⇒ dùng `firstPoId` (đã sửa). 3. Hai câu ghi rời ⇒ trạng thái nửa vời khi câu thứ hai lỗi ⇒ gộp vào MỘT method `@Transactional`. 4. `task_notifications.work_item_id` là NOT NULL ⇒ truyền null gây 409 ⇒ truyền `poId` + status "SENT". 5. Chèn trước chữ ký method làm tách annotation ⇒ '@Override is not a repeatable annotation' ⇒ chèn theo DÒNG và đếm ngoặc. 6. Probe neo theo SỐ DÒNG ⇒ hỏng giả khi mã dịch chuyển ⇒ neo theo NỘI DUNG. 7. Probe ghi dữ liệu hỏng hoàn tác ⇒ mất 2 dòng goods_receipts baseline (đang BLOCKED chờ user).

## Priorities
ĐÚNG NGHIỆP VỤ và CÓ BẰNG CHỨNG CHẠY THẬT trước tiên (cổng đo được), rồi mới tới gọn mã; KHÔNG được phá các cổng đang xanh (hồi quy 61/61, WF-02, WF-05, build, artifact validation); mọi thay đổi dữ liệu phải có hoàn tác theo ID cụ thể.

## Non-goals
Không push git. Không dựng lại dữ liệu đã mất bằng suy đoán (việc phục hồi 2 dòng goods_receipts đang chờ quyền/backup từ người dùng). Không đụng các phase khác của lộ trình 110 mục trong lượt này. Không viết lại JSX lớn khi chưa chia bước và chưa có cổng.
