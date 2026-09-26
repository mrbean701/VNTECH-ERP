# TASK-MT2-P14-03c — NHẬT KÝ TASK (MT2 §35)

> MASTER TASK: **MT2** · PROJECT: VNTECH ERP V5.3.0 (MASTER BASELINE R1.1.1)
> PHASE: **PHASE 14** (QA/DB/đối chiếu) · TRẠNG THÁI: **DONE**
> ⛔ **NO COMMIT · NO PUSH** (GOAL MT2 §28–29 · MT2 §23) · Cập nhật: **23/09/2026**

---

## 1. Task
`MT2-P14-03c` — **RÀ CỔNG BẰNG PROBE + VÁ LỖI PHÁT HIỆN ĐƯỢC** (viết lại probe cũ, truy tận gốc mọi ca đỏ, vá lỗi sản phẩm thật nếu có).

## 2. Objective
Chạy **toàn bộ** probe/hợp đồng của dự án, mỗi ca đỏ **phải được đọc mã / đo CSDL / đo live** trước khi phân loại; ⛔ không kết luận bằng suy đoán; ⛔ không hạ nhẹ phép kiểm để có màu xanh.

## 3. Requirement (yêu cầu gốc)
* GOAL MT2 §46 (ưu tiên kiểm hệ thống đang chạy thật) · §25/§26 (test & regression) · §27 (review diff) · §39 (lỗi ngoài scope ⇒ tách task) · §44/§45 (⛔ no fake completion/report).
* MT2 §52 hạng mục **Testing** và **Documentation**.

## 4. Current State (trước khi làm)
* Nhiều probe cũ viết theo **UI/CSDL thời điểm trước** ⇒ đỏ oan sau các đợt refactor MT2 (đổi tên tab, chuẩn hoá toolbar, thêm tab).
* Một số probe **chưa bao giờ chạy được** (đòi tham số môi trường) hoặc **để lại rác** lần chạy trước ⇒ ngoại lệ.
* Chưa có **sổ kiểm chốt** cho biết ca nào là lỗi thật, ca nào là lỗi công cụ.

## 5. Implementation (đã làm)
1. Chạy **109 tệp probe / 9 đợt**, gom bằng chứng vào `docs/dsh/MT2_GATE_SWEEP_23-09.md` (§H.1 → §H.34 + **§H.18.1 SỔ KIỂM CHỐT**).
2. **Truy tận gốc từng ca đỏ**: đọc mã Java/TS, đo `information_schema`/dữ liệu thật, đo DOM live qua CDP ⇒ phân thành 5 nhóm: ① chuẩn hoá UI §22 ② thêm tab/đổi tên ③ sai phương pháp đo ④ tiền đề sai ⑤ môi trường/fixture.
3. **Vá 1 LỖI SẢN PHẨM THẬT**: nút «Thu gọn khối» ở màn Phiếu đề nghị **vô tác dụng** (state `collapsed` chỉ đổi nhãn) — sửa `app/screens/RequestDrawer.tsx` + `app/globals.css`; **xác minh LIVE bằng click CHUỘT THẬT** (`bodyScroll 1605 → 375`).
4. **Sửa 28 lỗi CÔNG CỤ/PROBE** (#1 → #33), trong đó 3 ca cuối:
   * **#28 `probe-task073-team-members`** — fixture `PRB073-*` lần trước còn sót ⇒ `ERROR 1062` ⇒ **dọn TRƯỚC KHI ĐO mức nền** + dọn trước khi cắm ⇒ **21/21 ĐẠT**.
   * **#29 `probe-task040-nhom45`** — đòi `argv[2]` ⇒ **tự dò** `stock_issue_items` (READ-ONLY) ⇒ **9/9 ĐẠT**.
   * **#30 `probe-p2-ui-dom`** — tìm `.sidebar .nav-child` trong khi **P6-08** vẽ nhóm 1 mục thành **nút đi thẳng** ⇒ **ĐẠT: 5/5 dấu trên DOM** (bundle `page-C3s9lFmS.js`, 1.024.969 byte).
5. Vá **công cụ seed** (#22): `tools/seed-p2-test-data.mjs` thiếu `bch_confirmed_by`/`bch_confirmed_at` ⇒ thêm 2 cột + giá trị người xác nhận THẬT (**kiểm cân xứng 15 cột = 15 giá trị**).
6. Cập nhật **hồ sơ điều khiển**: `MT2_PHASE_TASK_LIST.md` §0 · `MT2_EXECUTION_STATE.md` · `MASTER_STATUS.md` · `MT2_FINAL_AUDIT_DRAFT.md` §A.1.

## 6. Files Changed
```text
app/screens/RequestDrawer.tsx              (LỖI SẢN PHẨM: className theo state collapsed)
app/globals.css                            (.sections-collapsed > .drawer-section { display:none })
tools/probe-menu-11.mjs                    (4 kỳ vọng cũ: tab 1 Tài khoản · ≥12 tab · nhóm CÔNG VIỆC ×2)
tools/probe-p6.mjs                         (so ID dòng mới · bỏ khoá 12 tab · ListToolbar · gõ từ khoá thật)
tools/probe-p5.mjs                         (danh sách phòng ban mẫu mới · nút nhóm · ListToolbar · snapshot/khôi phục)
tools/probe-task073-team-members.mjs       (#28 dọn fixture trước khi đo mức nền)
tools/probe-task040-nhom45.mjs             (#29 tự dò issueItemId READ-ONLY)
tools/probe-p2-ui-dom.mjs                  (#30 tìm menu mọi phần tử sidebar)
tools/probe-task075-attachments.mjs        (đọc thêm lib/ui-shared.tsx)
tools/probe-user-profile.mjs · probe-material-perm.mjs · probe-task041-delete.mjs · probe-live-rolebase.mjs · probe-p2-live-approval.mjs
tools/seed-p2-test-data.mjs                (#22 thêm bch_confirmed_by/bch_confirmed_at)
docs/dsh/MT2_GATE_SWEEP_23-09.md           (§H.1 → §H.34 + §H.18.1 SỔ KIỂM CHỐT)
docs/dsh/MT2_EXECUTION_STATE.md · MT2_PHASE_TASK_LIST.md · MT2_FINAL_AUDIT_DRAFT.md
docs/agent-progress/MASTER_STATUS.md
```

## 7. API Changed
⛔ **KHÔNG** — không thêm/đổi action nào. (Mọi ca đỏ đều được chứng minh là thuộc công cụ/tiền đề, ⛔ không phải sai API.)

## 8. DB Changed
⛔ **KHÔNG có thay đổi schema**. Chỉ: **đọc** `information_schema` + dữ liệu; **dọn đúng fixture CỦA PROBE** (`team_members` id `PRB073-A/B`) và **khôi phục** quyền user về trạng thái đầu trong `probe-p5`.

## 9. RBAC Changed
⛔ **KHÔNG**. Đo để xác nhận ranh giới vẫn nguyên: `probe-task027-live` **312 chặn đúng tầng admin · 0 lọt**; 403 của `tkhodemo` cho `approve_stock_issue` là **ĐÚNG THIẾT KẾ** (bước ② `WF-XUATKHO-01` giao **kế toán** `kttdemo`); `probe-task040-nhom45` xác nhận `confirm_installation` **403** khi thiếu quyền.

## 10. Workflow Changed
⛔ **KHÔNG**. Đo để xác nhận: `approvals` **0 hồ sơ** cho bước 101/102/103 (⇒ 3 bước là **hàng MIRROR** của engine `workflow_*` — 4 định nghĩa active, 10 bước/10 người duyệt).

## 11. Tests
```text
frontend contracts : node --import tsx --test tests/*.test.mjs
                     ⇒ tests 570 · PASS 569 · FAIL 0 · cancelled 0 · SKIP 1 · 24,0s   (exit 0)
typecheck          : npx tsc --noEmit                        ⇒ exit 0
CSS baseline gate  : npm run verify:css-baseline              ⇒ ĐẠT · dead classes = 0 · dead vars = 0
Java               : mvn -pl web -am test                     ⇒ 64/64 · 0 Failures · 0 Errors
probe              : 109 tệp probe · 28 lỗi công cụ đã sửa · 1 lỗi sản phẩm thật đã vá · 0 ca BLOCKED
kiểm phủ sóng §50  : 43/43 tiêu đề cấp 2 của MASTER_TASK_2.md được tham chiếu · 0 chưa tham chiếu
```

## 12. Validation
* Lỗi sản phẩm duy nhất **đã kiểm live bằng chuột thật qua CDP** (⛔ không dùng `element.click()` — từng cho kết quả ÂM GIẢ).
* Mọi kết luận «lỗi thật» đều bị bác bỏ hoặc xác nhận **bằng đọc mã hoặc bằng số đo CSDL** (⛔ không suy đoán).
* ⛔ **Không hạ nhẹ phép kiểm** ở bất kỳ ca nào: các probe được vá vẫn **bắt buộc** có bằng chứng thật (VD `probe-p6` phải chứng minh được **lọc thật** `101 → 4`).

## 13. Known Issues (còn lại, ⛔ ngoài phạm vi task này)
* 3 **khe hở ghi cột** (parity ghi JS ⇄ Java): `approval_stage_catalog.stage_kind` (🔴 CAO — `INSERT` Java tại `OpsTaskStoreAdapter:335` ⛔ thiếu cột, cột có `DEFAULT 'approval'`) · `users.avatar_url` · `boq_versions.approved_at` ⇒ **chờ user chọn A/B/C** (`MT2_BLOCKER_DECISION_BRIEF.md` §⑤.1).
* Việc cá nhân `CN` ⛔ không thấy trong bootstrap (6 dòng `work_items` `department_code='CN'` **toàn là tàn dư `sec_probe_*`** ⇒ 0 dòng nghiệp vụ thật) ⇒ §⑤.2.
* 14 dòng `goods_receipts` thiếu người xác nhận **do seed** (đã vá seed cho lần sau) ⇒ §⑤.4.
* 🔎 **KHE HỞ NHẬT KÝ (đo lại trong phiên, mức TRUNG BÌNH):** `audit_logs` **1.579 dòng** — 0 dòng thiếu CẢ HAI snapshot · **0 dòng thiếu `after_json`** · nhưng **1.486 dòng thiếu `before_json`**, trong đó có **hành động SỬA/XOÁ** nơi **phải** có trạng thái trước: `update_user` **279** · `delete_department_permission` 22 · `update_returned_request` 16 · `delete_request` 16 · `delete_approval_stage` 14 · `update_boq_contract_prices` 12 · `delete_supplier`/`delete_system_level`/`delete_material_norm`/`delete_partner` 8–9. **93 dòng CÓ `before_json` đều là hành động KIỂU CŨ (CHỮ HOA)** (`EDIT_RETURNED` 16 · `DELETE_RETURNED` 16 · `CANCEL` 16 · `RESUBMIT` 16 · `UPDATE` 15 · `APPROVE_PARTIAL` 14); `update_user` = **0/279**. Đường ghi Java **CÓ** cột (`AuditLogAdapter.java:58`) nhưng nhánh Java **⛔ không truyền giá trị** ⇒ ⛔ **không dựng lại được «đã đổi từ gì»** với các action sửa/xoá mới. ⚠️ **Số cũ «7/259» THẤP HƠN THỰC TẾ** — đây là số đo lại đầy đủ.
  **⛔ Chưa sửa** (ngoài phạm vi, cần quyết định): đề xuất **(A)** mở task riêng `MT2-P14-07` · **(B)** chỉ ghi nhận · **(C)** chỉ áp cho `delete_*` ⇒ xem `MT2_BLOCKER_DECISION_BRIEF.md` §⑤.6.
* 🔎 **CỔNG `test:release-static` ĐỎ — NGUYÊN NHÂN THẬT (đo lại, ⛔ không đoán):** cổng báo nguyên văn `Error: SHA256 không khớp: .ai/orchestration/MASTER_STATE.md` ⇒ `RELEASE STATIC GATE: KHÔNG ĐẠT`. `MANIFEST_SHA256.txt` (7.579 dòng) đang chứa **15 đường dẫn là TỆP TRẠNG THÁI NỘI BỘ hay đổi** (`.ai/orchestration/*` 5 dòng + `.memsearch/memory/*.md` 10 dòng) ⇒ chỉ cần phiên làm việc ghi tiếp là checksum lệch. ⚠️ **ĐÍNH CHÍNH**: ghi cũ cho rằng nguyên nhân là «`drizzle/0080 datetime()`» là **SAI** — đo tệp đó: **`datetime(3)` × 6 · `datetime()` rỗng × 0**. ⛔ **0 mã sản phẩm sai**; đây là vấn đề **quy tắc cổng** (chọn A/B/C ở brief §⑤.5.1).
* 🟡 `app/styles/canonical.css` = **967 dòng** > trần **930** khai trong `tools/css-budget.json` `"lines"` ⇒ quy tắc CÓ THẬT ⇒ chờ chọn (A1) nâng trần · (A2) tách tệp · (B) giữ.

## 14. Remaining Work
* `MT2-P14-05` (final audit §52/§53) — **chờ** 4 quyết định ① ② để gỡ blocker `P4-01`/`P5-03`/`P5-04`/`P10-05`.
* 9 nhóm kỹ thuật ở §⑤ của `MT2_BLOCKER_DECISION_BRIEF.md`.

## 15. Next Task
**`MT2-P14-05` — FINAL AUDIT §52/§53** (bản nháp đã sẵn: `docs/dsh/MT2_FINAL_AUDIT_DRAFT.md`, 8 hạng mục + khung §53; đã bổ sung §A.1 bằng chứng chạy lại cổng trong phiên).
