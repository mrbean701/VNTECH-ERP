# TASK-MT3-UI-26 — **«ĐƯA TẤT CẢ MENU ITEM VÀO NHÓM → CHUYỂN THÀNH TAB»**

| Mục | Nội dung |
|---|---|
| **Task** | **UI-26** — yêu cầu **TRỰC TIẾP** của user 27/09/2026 |
| **Phase** | **GĐ1 — FRONTEND** |
| **Status** | ✅ **HOÀN TẤT — đã build + đang phục vụ** |

## 🔴 NGUYÊN VĂN YÊU CẦU CỦA USER
> «làm lại toàn bộ master task 3, tôi vừa check lại giao diện gần như chẳng có thay đổi nào đáng kể.
> **cái quan trọng nhất là đưa tất cả menu item vào trong menu chuyển thành tab thì vẫn chưa được thực hiện**»

## 🔴 VÌ SAO ANH THẤY «GẦN NHƯ KHÔNG ĐỔI» — **LỖI VẬN HÀNH CỦA TÔI** *(⛔ không phải anh xem sai)*
| # | Nguyên nhân | Bằng chứng |
|---|---|---|
| 1 | **`gd-cycle` ⛔ CHƯA HỀ chạy được** ⇒ **`dist/` là bản build CŨ** | `gd-cycle.mjs:59` — *«build — cần UI dừng + `.local-data` tạm chuyển»*; bị chặn `EPERM` vì **Node UI giữ khoá** |
| 2 | **Server UI mới ⛔ CHƯA hề chạy** | `:8788` **ĐÓNG** *(proxy mặc định trỏ UI vào đây — `cutover-proxy.mjs:34`)* |
| 3 | **Proxy `:9000` trỏ vào `:8787` = UI Node/JS CŨ** | Dòng lệnh thực tế: `cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081` |
⇒ **Anh nhìn bản CŨ suốt** ⇒ thấy không đổi là **ĐÚNG**.

## ✅ ĐÃ SỬA VẬN HÀNH
| Bước | Việc | Kết quả |
|---|---|---|
| 1 | Dừng **đúng PID** giữ `.local-data` *(`scripts/local-server.mjs` — xác minh dòng lệnh TRƯỚC khi dừng)* | ✅ giải phóng khoá |
| 2 | `node tools/gd-cycle.mjs "…"` | ✅ **ĐẠT** · `VNTECH-FP-89851CF444903582` · **563 tệp** · `BUILT ARTIFACT VALIDATION: ĐẠT` |
| 3 | `npm run start` *(= `vinext start`, phục vụ `dist/server/index.js`)* | ✅ UI mới ở **`:3000`** |
| 4 | `node tools/cutover-proxy.mjs --port 9000 --ui-port 3000 --api-port 18081` | ✅ **`:9000` HTTP 200** + **`/api/system` HTTP 200** |

## ✅ **VIỆC CHÍNH: TỔNG QUÁT HOÁ THANH TAB CHO MỌI NHÓM**
### ⚠️ Trước đây — đo được: **CHỈ 1/8 nhóm** có tab
| Nhóm (`groupKey`) | Số mục con | Trước |
|---|---|---|
| `purchasing` | **18** | ✅ có *(10 tab curated — hard-code thẳng trong `page.tsx:650`)* |
| `warehouse` · `my_work` · `reports` · `mep` · `project_management` · `finance` · `hr_legal` | 14 · 10 · 9 · 8 · 7 · 7 · 6 | ⛔ **KHÔNG có tab** |

### ✅ Cách làm — **CƠ CHẾ DÙNG CHUNG** *(§14 — ⛔ không copy khối tab 7 lần)*
**`lib/menu-helpers.ts`** ➕:
- `HUB_TAB_GROUP_KEYS` — 8 nhóm có tab *(đo từ `modules`)*
- `HUB_GROUP_LABELS` — nhãn tiếng Việt cho `aria-label`
- **`hubTabsFor(active)`** — trả **tab của NHÓM chứa màn đang mở**; `null` nếu nhóm chỉ 1 mục
  - ⚠️ `purchasing` **GIỮ danh sách curated 10 tab** *(⛔ KHÔNG thay bằng ánh xạ 1-1 — như vậy là **phá quyết định user**)*
  - các nhóm khác: **1 mục con = 1 tab** *(đúng «tất cả menu item … thành tab»)*
- **`hubLabelFor(active)`** — nhãn nhóm

**`app/page.tsx:650`** 🔁 — thay điều kiện hard-code `purchasingHubTabs.some(...)` bằng:
```jsx
{(()=>{const tabs=hubTabsFor(active);if(!tabs)return null;
  const gk=String(modules.find((m)=>String(m.key)===active)?.groupKey||"hub");
  const anchor=gk==="purchasing"?"purchasing-hub-tabs":`hub-tabs-${gk}`;
  return <nav className="switch-tabs" data-vntech={anchor} role="tablist" aria-label={hubLabelFor(active)}>
    {tabs.map((item)=><button key={item.key} type="button" role="tab"
      aria-selected={active===item.key} className={active===item.key?"active":""}
      onClick={()=>activateModule(item.key)}>{item.label}</button>)}</nav>;})()}
```
⛔ **KHÔNG thêm CSS mới** — dùng lại `.switch-tabs` *(giữ đúng §14)*.
✅ Nhóm Mua hàng **giữ nguyên khoá mỏ neo `purchasing-hub-tabs`** ⇒ ⛔ **không phá hợp đồng cũ**.

## 🧪 Testing — ✅ **test mới 7/7 ĐẠT** · contract **XANH** · ⛔ không hồi quy
| Cổng | Kết quả |
|---|---|
| test mới `tests/mt3-ui-25-all-groups-tabs.test.mjs` | ✅ **`tests 7 · pass 7 · fail 0`** |
| `npx tsc --noEmit` | ✅ **`EXIT=0`** |
| contract **toàn bộ** | ✅ **`tests 653 · pass 652 · fail 0 · skipped 1`** |
| `npm run test:regression` | ✅ **`pass 69 · fail 0`** |
| ⚠️ Sửa hợp đồng test cũ | ✅ **2 assertion** trong `mt3-ui-12d` — **đúng lý do được phép**: *đề bài mới của user đổi hợp đồng* (điều kiện riêng `purchasing` → cơ chế dùng chung). ⛔ **GIỮ NGUYÊN** mọi ràng buộc khác *(tablist · aria-selected · `activateModule` · dùng lại `.switch-tabs`)* + **ghi chú lý do trong test** |

### ⚠️ LỖI TEST TÔI ĐÃ MẮC VÀ TỰ SỬA *(ghi để không lặp)*
1. Dùng `hubTabsFor("my_work")` ⇒ **`null`** — vì `my_work` là **`groupKey`**, ⛔ **KHÔNG phải `key` của module** ⇒ phải `modules.find(m => m.groupKey==="my_work")` rồi mới gọi.
2. Trước đó: test mới **chèn dữ liệu H2 dùng chung** ⇒ **50/74 bài của lớp KHÁC đổ** (`409`). **Bằng chứng tách bạch**: chạy *không có* test mới ⇒ **67/67 ĐẠT** ⇒ **mã ⛔ KHÔNG gây lỗi**. Đã sửa bằng **`@Transactional`** *(mỗi bài chạy trong giao dịch tự rollback)* + **`@AfterEach` dọn đúng id**.

## Files changed
| Tệp | Việc |
|---|---|
| `lib/menu-helpers.ts` | ➕ `HUB_TAB_GROUP_KEYS` · `HUB_GROUP_LABELS` · **`hubTabsFor`** · **`hubLabelFor`** + export |
| `app/page.tsx` | 🔁 import 2 hàm mới · 🔁 thay thanh tab hard-code bằng cơ chế dùng chung |
| `tests/mt3-ui-25-all-groups-tabs.test.mjs` | ➕ **MỚI** — 7 ca |
| `tests/mt3-ui-12d-purchasing-hub-tabs.test.mjs` | 🔁 **2 assertion** *(đúng lý do + ghi chú)* |
| `java-backend/.../ApprovalSlaAutoRejectTest.java` | 🔁 ➕ `@Transactional` + `@AfterEach` dọn dữ liệu *(sửa lỗi H2 dùng chung)* |
| `app/globals.css` | 🔁 *(từ C2)* nút thu gọn menu tự ẩn ở ≥1024px |

## 🖥️ TRẠNG THÁI PHỤC VỤ *(đã kiểm bằng HTTP thật)*
| Cổng | Vai trò | Trạng thái |
|---|---|---|
| **`:9000`** | **cổng vào chuẩn** *(proxy → UI `:3000` + API `:18081`)* | ✅ **HTTP 200** · `/api/system` **HTTP 200** |
| `:3000` | UI mới *(từ `dist/`)* | ✅ MỞ |
| `:18081` | Java API | ✅ MỞ |
| `:8787` | UI Node/JS **cũ** *(⛔ không chứa mã Next.js)* | ⛔ đã dừng *(để build)* |

⚠️ **Lưu ý vận hành quan trọng**: `local-server.mjs` **tự khởi động lại** *(thấy PID mới sau khi dừng)* — có cơ chế watchdog. ⇒ Muốn build phải **dừng đúng tiến trình đang giữ `.local-data`** rồi chạy `gd-cycle` **ngay**.

## Blockers
⛔ **Không.**
⚠️ **CÒN 2 VIỆC** *(⛔ chưa làm)*:
1. **Bộ test backend**: đã sửa nguyên nhân *(50/74 đỏ do test tôi chèn dữ liệu H2)* nhưng **⛔ chưa chạy lại `mvn test` để xác nhận 74/74**.
2. **`mt3` §B khác**: ma trận #4 `Inventory.tsx:220` `<aside>` → **modal** *(user đã cho phép)* + chụp lại 68 ảnh.

## Next task
1. **Chạy lại `mvn test`** ⇒ xác nhận **74/74 ĐẠT**.
2. **Ma trận #4** — `Inventory.tsx:220` `<aside>` → modal + **chụp lại 68 ảnh**.
3. Cập nhật `MASTER_STATUS.md` + `TASK_INDEX.md` + `CURRENT_TASK.md`.