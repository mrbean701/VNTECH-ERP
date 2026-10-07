# README — MULTI-SESSION LOGGING (VNTECH ERP)
> Thu muc nay la MULTI_SESSION_LOG_ROOT.
> VNTECH ERP V5.3.0 — MASTER BASELINE R1.1.1 · Timezone Asia/Ho_Chi_Minh (UTC+7)

## 1. Muc dich
Luu LICH SU PHAT TRIEN CO CAU TRUC cua MOI DSH session tren VNTECH ERP:
SESSION A + SESSION B -> STANDARDIZED LOGS -> WEEKLY REPORT DATA -> CONSOLIDATED VNTECH ERP REPORT -> WORD / EXCEL
LOG ONCE — REPORT MANY: ghi log MOT LAN, dung lai cho daily tracking · weekly report · monthly report · project progress · bug statistics · development history · change history · testing history.

## 2. Quan he voi docs/dsh-state/ (DOC KY)
| Thu muc | Vai tro | Trang thai |
|---|---|---|
| docs/dsh-state/ | state VAN HANH hien co (CHECKLIST · CURRENT_STATE · DECISIONS · SESSION_REGISTRY · TASK_HISTORY) | GIU NGUYEN — KHONG xoa, KHONG di chuyen |
| docs/dsh-mutil-session/ | lop LOG CHUAN HOA MOI phuc vu bao cao tuan | TAO MOI |
=> KHONG tao he thong state thu hai thay the docs/dsh-state/ — hai thu muc BO SUNG cho nhau.

## 3. Cau truc
docs/dsh-mutil-session/
├── README.md · SESSION_REGISTRY.md · SHARED_STATE.md · SHARED_TODO.md
├── SESSION_A/ (9 log)  <- ERP-SESSION-01
├── SESSION_B/ (9 log)  <- ERP-SESSION-02
└── weekly-reports/YYYY-WXX/{WEEKLY_REPORT.md, WEEKLY_REPORT_DATA.md, *.docx, *.xlsx}

## 4. 9 loai log BAT BUOC
| Log | Ghi gi |
|---|---|
| EVENT_LOG.md | timeline su kien (SESSION_START · TASK_START · BUG_FOUND · HOTFIX_* · TEST_* · VERIFICATION · BLOCKER · HANDOFF · OWNERSHIP_* · SESSION_END) |
| TASK_LOG.md | log QUAN TRONG NHAT cho tien do — moi task 1 entry |
| DEV_LOG.md | PHAT TRIEN KY THUAT THAT (Frontend/Backend/API/DB/Migration/RBAC/Workflow/UI-UX/Shared Component/Integration/Performance/Config) |
| CHANGE_LOG.md | thay doi THUC TE cua he thong (Before -> After) — KHONG ghi y tuong chua lam |
| TEST_LOG.md | kiem thu (UNIT/API/UI/INTEGRATION/E2E/REGRESSION/MANUAL) |
| BUG_HOTFIX_LOG.md | bug + hotfix (kem ROOT CAUSE) |
| DECISION_LOG.md | quyet dinh anh huong he thong/quy trinh |
| HANDOFF_LOG.md | giao tiep/chuyen giao giua 2 session |
| WEEKLY_REPORT_DATA.md | du lieu chuan hoa cho bao cao tuan (tong hop TU LOG, KHONG suy doan) |

## 5. Quy uoc
ID: EVT- · TASK- · DEV- · CHG- · TEST- · BUG- · DEC- · HANDOFF- + YYYYMMDD + so thu tu. KHONG dung lai ID.
Timestamp: YYYY-MM-DD HH:mm:ss · Status: OPEN | IN_PROGRESS | BLOCKED | FIXED | VERIFIED | DONE | CANCELLED
Severity: CRITICAL | HIGH | MEDIUM | LOW | UI · Test Result: PASS | FAIL | PARTIAL | N/A
Category: UI_UX · FRONTEND · BACKEND · API · DATABASE · MIGRATION · RBAC · WORKFLOW · BUGFIX · HOTFIX · TESTING · PERFORMANCE · DEVOPS · DOCUMENTATION · OTHER
Moi file log CHI ghi dung loai thong tin cua no. Lien ket giua cac log bang ID (KHONG copy nguyen noi dung).

## 6. Thu tu nguon su that
1. ACTUAL CODE  2. ACTUAL TEST RESULT  3. STRUCTURED LOGS  4. CURRENT STATE  5. CHECKLIST  6. TELEGRAM  7. CHAT HISTORY
=> Neu log KHONG khop code/test thuc te => SUA LOG THEO THUC TE. KHONG bao cao thanh qua chua xac minh.

## 7. An toan da phien
KHONG overwrite log phien khac · KHONG sua TASK_LOG / WEEKLY_REPORT_DATA cua phien khac · KHONG xoa log ·
KHONG reset state phien khac · KHONG danh dau task phien khac DONE.
File SHARED (SESSION_REGISTRY.md · SHARED_STATE.md · SHARED_TODO.md): READ -> MODIFY CAREFULLY -> PRESERVE OTHER SESSION DATA -> WRITE -> VERIFY (KHONG overwrite ca file).

## 8. Xuat bao cao (khi user yeu cau)
- «Tong hop bao cao tuan» => chi tao WEEKLY_REPORT.md (+ dataset tong hop). KHONG tu tao Word/Excel.
- «... va xuat Word + Excel» => VNTECH_ERP_Weekly_Report_YYYY-WXX.docx + .xlsx — CUNG MOT DATASET
  (Excel gom sheet: Summary · Tasks · Development · Changes · Tests · Bugs_Hotfix · Decisions · Handoffs · Risks_Blockers · Next_Week).
- Luu tru: weekly-reports/YYYY-WXX/ — KHONG ghi de bao cao tuan cu.

---

## 9. ⭐ TỆP LIÊN QUAN CẦN ĐỌC TRƯỚC KHI GHI

| Tệp | Vì sao phải đọc |
|---|---|
| **`docs/dsh-state/00_GOAL_S4_MAPPING.md`** | ⭐ **BẢN ĐỒ ÁNH XẠ Goal §4 ⇄ state thực có** — cho biết **loại dữ liệu nào lưu ở ĐÂU** để ⛔ **không tạo tệp trùng** và ⛔ **không ghi sai chỗ**. Kèm bảng **«ai ghi gì»**. |
| `docs/dsh-state/CURRENT_STATE.md` | trạng thái vận hành hiện tại — ⚠️ **phiên khác cũng cập nhật** ⇒ ĐỌC trước khi ghi |
| `docs/dsh-state/SESSION_REGISTRY.md` | ai đang giữ tệp nào (LOCK) — **SHARED**, ghi bằng **APPEND** |
| `docs/dsh-mutil-session/SHARED_STATE.md` | build hiện hành · cảnh báo đang mở · tên trường dữ liệu THẬT |

> ⚠️ **Trước khi ghi bất kỳ tệp nào**: đọc `00_GOAL_S4_MAPPING.md` §3 «Ai ghi gì» để ghi **ĐÚNG LOẠI LOG**,
> ⛔ tránh **ghi trùng** và ⛔ tránh **state conflict** (Goal §2).
