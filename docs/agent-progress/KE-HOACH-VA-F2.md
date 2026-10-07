# KẾ HOẠCH KHẮC PHỤC **F2** — chuẩn bị sẵn, ⛔ **CHƯA ÁP DỤNG**

| | |
|---|---|
| **Ngày lập** | 06/10/2026 |
| **Lỗi** | **F2** — `receive_goods` **⛔ không kiểm trạng thái PO** ⇒ PO **chưa phát hành** vẫn nhận hàng thành công ⇒ ⭐ **cổng kiểm soát «Lập & PHÁT HÀNH PO» (bước 101) bị VÔ HIỆU** |
| **Mức** | 🔴 **CAO** — §19 xếp **«WORKFLOW ISSUE» = hạng 3** (trên bug MEDIUM) |
| **Trạng thái** | ⛔ **CHƯA VÁ** — ⭐ user đã yêu cầu **tạm dừng áp dụng bản vá** ⇒ tài liệu này **chuẩn bị sẵn** để lần sau chỉ cần **1 lần deploy** |
| **Nguồn** | Báo cáo `BAO-CAO-LUONG-DUYET-WF-MUAHANG-01.md` §F2 (21/09/2026) — ⭐ **đã kiểm lại 06/10: F2 CÒN** |

---

## ① VÌ SAO «CHỈ THÊM MỘT DÒNG CHỐT» ⛔ KHÔNG ĐỦ

⭐ **Đã thử ngày 06/10/2026** và **thất bại có ý nghĩa**:
```text
Thêm vào `PurchaseManagementUseCase.receiveGoods`:
  if (!List.of("waiting_delivery","partial_delivery").contains(sv(po,"status")))
      throw Api("PO chưa được phát hành nên chưa thể giao nhận. …");

KẾT QUẢ `mvn -o test`:
  [ERROR] StockChainIntegrationTest        — Tests run: 2, Failures: 2  <<< FAILURE!
  [ERROR] SupplyChainEndToEndIntegrationTest — Tests run: 1, Failures: 1  <<< FAILURE!
  [ERROR] Tests run: 86, Failures: 3, Errors: 0
  [INFO]  BUILD FAILURE
```
⇒ ✅ **Đã hoàn nguyên** để cây mã nguồn **XANH 156/156** (⭐ ⛔ không để lại BUILD FAILURE) — ⭐ **giữ khối chú thích kỹ thuật** trong `receiveGoods` để lần sau xử lý đúng ✓

### ⭐⭐ NGUYÊN NHÂN — **3 TEST ĐANG MÃ HOÁ CHÍNH HÀNH VI CỦA LỖI F2**

| Tệp test | ⭐ Chuỗi nó chạy | ⚠️ Thiếu gì |
|---|---|---|
| `java-backend/web/src/test/java/com/vntech/erp/web/controller/StockChainIntegrationTest.java` | (dòng 23) `setup → seed → create_po → receive_goods → confirm_delivery` | ⛔ **KHÔNG có bước phát hành PO** — dòng **125** `create_po` rồi dòng **132** `receive_goods` **ngay sau** |
| `…/SupplyChainEndToEndIntegrationTest.java` | (dòng 26) `setup → login → create_request → duyệt 2 bước → create_po → receive_goods → …` | ⛔ **có duyệt PHIẾU nhưng ⛔ KHÔNG duyệt PO** — dòng **153** `create_po` rồi dòng **163** `receive_goods** |

⭐ **VÌ SAO CHÚNG LÀM VẬY**: ⭐ rất có thể vì **`approve_po` từng trả 403** (lỗi **F1**) ⇒ ⭐ **bài kiểm thử phải đi vòng, ⛔ không qua bước phát hành PO** ⇒ ⭐ **nay F1 đã vá nhưng test vẫn giữ đường vòng** ✓
⇒ ⭐ **KẾT LUẬN: ⛔ không thể vá F2 mà ⛔ không sửa 3 test** ✓

---

## ② MÁY TRẠNG THÁI PO — **ĐỌC TỪ MÃ, ⛔ KHÔNG SUY ĐOÁN**

```text
createPo   (PurchaseManagementUseCase:185)  → ghi status = 'pending_approval'
decidePo   (:250)  đòi ĐÚNG 'pending_approval'
           (:254)  → approve=true  ⇒ 'waiting_delivery'
                    approve=false ⇒ 'cancelled'
receiveGoods (:369,:387)  → 'partial_delivery' / 'awaiting_bch_confirmation'
confirmDelivery (:445,:450) → 'completed'
```
📊 **DỮ LIỆU THẬT (06/10)**: 18 `completed` · 9 `waiting_delivery` · 4 `pending_approval` ✓
⇒ ⭐ ⭐ **CỔNG ĐÚNG: chỉ nhận hàng khi PO ∈ {`waiting_delivery`, `partial_delivery`}** ✓

---

## ③ HỢP ĐỒNG CỦA `approve_po` (⭐ đủ để viết lời gọi trong test)

| Hạng mục | ⭐ Giá trị (đọc từ mã) |
|---|---|
| Action | **`approve_po`** → `SystemController:1161` → `purchaseManagementUseCase.approvePo(…)` → `decidePo(principal, payload, true)` ✓ |
| Payload | ⭐ **`purchaseOrderId`** (bắt buộc) · `reason` (chỉ dùng khi từ chối) ✓ |
| Cổng vai trò | ⭐ `requireRole(["procurement","accountant","admin"])` — ⚠️ **so với `base_role`** ✓ |
| Cổng module | ⭐ `ActionRbacRegistry:26` → **`purchasing`** + dòng 318 → **`canApprove`** ✓ (⭐ **F1 đã vá ⇒ nay ⛔ không còn rỗng**) ✓ |
| Hiệu ứng | ⭐ PO: `pending_approval` → **`waiting_delivery`** ✓ |
| Tiền lệ trong test | ⭐ `SupplyChainEndToEndIntegrationTest:206` **đã biết cách cấp module permission** («Cho người lập phiếu quyền `approvals.canApprove=1` để cổng MODULE đi qua») ✓ |

⚠️ **LƯU Ý QUAN TRỌNG**: tài khoản dùng cho `receive_goods` nhiều khả năng là **vai trò `warehouse`** ⚠️ ⇒ ⭐ **tài khoản đó ⛔ KHÔNG THỂ duyệt PO** (⛔ không có vai trò `procurement/accountant/admin`) ⇒ ⭐ **test phải gọi `approve_po` bằng MỘT TÀI KHOẢN KHÁC** — ⭐ **đúng như nó đã làm với việc duyệt PHIẾU (2 tài khoản khác nhau)** ✓

---

## ④ CÁC BƯỚC SỬA — **CHÍNH XÁC, ĐÃ ĐỊNH VỊ**

### Bước 1 — `StockChainIntegrationTest.java`
⚠️ **CƠ CHẾ ĐỔI TÀI KHOẢN CỦA TỆP NÀY** (⭐ đọc từ mã, ⛔ không đoán): hàm `postAction(String json, int expectStatus)` **chỉ có 2 tham số** — ⭐ **tài khoản được mang bằng COOKIE**, qua `TestActors.login(mockMvc, "<tên>")`; ⭐ tệp **đã có sẵn** `postActionAs(TestActors.login(mockMvc, "kh.nv.stk"), action("create_request", …), …)` ở **dòng 116** ⇒ ⭐ **dùng ĐÚNG khuôn đó** ✓

⭐ Chèn **SAU dòng 129** (⭐ chỗ đã có `poId`) và **TRƯỚC dòng 132 (`receive_goods`)**:
```java
// ⭐ F2 — createPo ghi PO ở `pending_approval` ⇒ PHẢI PHÁT HÀNH PO trước khi nhận hàng.
//   ⭐ Tài khoản phát hành PHẢI có vai trò `procurement|accountant|admin`
//     + module `purchasing` + `canApprove` (ActionRbacRegistry:26 và :318).
//   ⚠️ Tài khoản đang dùng cho `receive_goods` (vai trò kho) ⛔ KHÔNG duyệt được PO.
postActionAs(TestActors.login(mockMvc, "<tài khoản có vai trò procurement>"),
        action("approve_po", "\"purchaseOrderId\":\"" + poId + "\""), 200);
assertEquals("waiting_delivery", jdbc.queryForObject(
        "SELECT status FROM purchase_orders WHERE id=?", String.class, poId));
```
⚠️ **Cần xác nhận trước khi viết**: ⭐ danh sách tài khoản kiểm thử có sẵn trong `TestActors` (⭐ tệp đã dùng `kh.nv.stk`) — ⭐ **chọn tài khoản có `base_role = procurement`**, ⛔ không bịa tên ✓

### Bước 2 — `SupplyChainEndToEndIntegrationTest.java`
⚠️ **CƠ CHẾ ĐỔI TÀI KHOẢN CỦA TỆP NÀY**: `postAction(String json, int expectStatus)` **cũng 2 tham số**; ⭐ tệp dùng **biến cookie** — `requesterCookie = TestActors.login(mockMvc, "kh.nv.e2e")` ở **dòng 126** ⇒ ⭐ **dùng ĐÚNG khuôn đó** ✓

⭐ Chèn **SAU dòng 155** (⭐ chỗ đã có `poId`) và **TRƯỚC dòng 163 (`receive_goods`)**:
```java
// ⭐ F2 — phát hành PO trước khi giao nhận (xem Bước 1 để biết yêu cầu vai trò/module)
String purchaserCookie = TestActors.login(mockMvc, "<tài khoản có vai trò procurement>");
postActionAs(purchaserCookie, action("approve_po",
        "\"purchaseOrderId\":\"" + poId + "\""), 200);
assertEquals("waiting_delivery", jdbc.queryForObject(
        "SELECT status FROM purchase_orders WHERE id=?", String.class, poId));
```
⚠️ **Cần xác nhận**: ⭐ **tên hàm nhận cookie** trong tệp này (⭐ `postActionAs` hay tên khác) — ⭐ **đọc lại chữ ký trước khi viết**, ⛔ không suy đoán ✓

### Bước 3 — **cấp quyền cho tài khoản duyệt PO** (⭐ nếu tài khoản đó chưa có)
⭐ Theo **đúng tiền lệ dòng 206** của `SupplyChainEndToEndIntegrationTest`: cấp **`purchasing`** với **`canApprove = 1`** cho tài khoản giữ vai trò `procurement` (hoặc dùng `admin` cho gọn — ⚠️ **nhưng ⭐ nên dùng tài khoản nghiệp vụ để test đúng cổng RBAC**) ✓

### Bước 4 — **vá F2** trong `PurchaseManagementUseCase.receiveGoods`
⭐ Khôi phục chốt (⭐ **nội dung đã có sẵn trong khối chú thích tôi để lại trong mã**):
```java
if (!List.of("waiting_delivery", "partial_delivery").contains(sv(po, "status")))
    throw Api("PO chưa được phát hành nên chưa thể giao nhận. "
            + "Hãy phát hành PO ở bước “Lập & phát hành PO” trước.");
```
⚠️ ⛔ **TUYỆT ĐỐI ⛔ KHÔNG đặt chốt trong `findPoForReceiving`** — ⭐ hàm đó còn phục vụ **`decidePo` (dòng 248)** và một hàm khác (dòng 270), mà **`decidePo` CẦN PO ở `pending_approval`** ⇒ ⭐ **đặt ở đó sẽ KHOÁ CHẾT đúng đường phát hành PO** ✓ (⭐ **đã kiểm 3 nơi gọi** trước khi kết luận) ✓

### Bước 5 — **kiểm chứng**
1. `mvn -o test` ⇒ ⭐ **phải XANH 156/156** (⭐ nếu còn đỏ ⇒ tìm test khác cũng đi vòng)
2. ⭐ **Thêm 1 test ÂM**: `receive_goods` trên PO `pending_approval` ⇒ **phải 400** với thông điệp «PO chưa được phát hành…» ✓
3. Triển khai ⇒ ⭐ **gọi thật** `receive_goods` trên PO chưa phát hành ⇒ kỳ vọng **400** ✓

---

## ⑤ RỦI RO & LƯU Ý

| ⚠️ | Nội dung |
|---|---|
| ⚠️ **Có thể còn test khác đi vòng** | ⭐ đã thấy **3 ca đỏ**; ⚠️ **phải chạy lại TOÀN BỘ** sau khi sửa, ⛔ không chỉ 2 tệp này |
| ⚠️ **Dữ liệu cũ** | ⭐ các PO đang `pending_approval` (**4 PO**) sẽ **⛔ không nhận hàng được** nữa ⇒ ⭐ **đúng nghiệp vụ**, nhưng ⚠️ phải **thông báo cho người dùng** trước khi triển khai |
| ⚠️ **9 PO `waiting_delivery`** | ⭐ vẫn nhận hàng bình thường ⇒ ⛔ **không ảnh hưởng** ✓ |
| ⭐ **12 đơn vị kẹt `WH-TRANSIT`** | ⭐ **không liên quan F2** — chúng kẹt do **BUG-20261005-005** (⭐ đã vá, chờ triển khai) ✓ |
| ⭐ **Quan hệ với F1** | ⭐ **F1 đã vá ⇒ đường phát hành PO nay HOẠT ĐỘNG** ⇒ ⭐ **vá F2 ⛔ không chặn người dùng** (⭐ họ có thể phát hành PO để đi tiếp) ✓ |

---

## ⑥ KIẾN NGHỊ THỨ TỰ

1. ⭐ **Triển khai 9 bản vá hiện có TRƯỚC** (⭐ dập **4 lỗi HTTP 500**) — ⛔ **không trộn với F2** ⇒ ⭐ giữ deploy nhỏ, dễ lùi ✓
2. ⭐ **Sau đó** làm gói F2 (⭐ **3 tệp: 2 test + 1 use case**) ⇒ ⭐ **deploy lần hai** ✓
3. ⭐ **Nhập lại dữ liệu test** (⭐ theo yêu cầu user) — ⭐ **nên làm SAU bước 1** vì dữ liệu trả hàng kho sẽ sạch hơn ✓

---

## ⑦ THAM CHIẾU

| Tài liệu | Nội dung |
|---|---|
| `docs/agent-progress/BAO-CAO-LUONG-DUYET-WF-MUAHANG-01.md` §F2 | phát hiện gốc F2 (21/09/2026) |
| `docs/agent-progress/TASK-134.md` | nhật ký công việc luồng duyệt |
| `testlog.md` mục **582** | ⭐ ghi lại việc **vá thử ⇒ đỏ 3 test ⇒ hoàn nguyên** (06/10/2026) |
| `docs/dsh-state/CHECKLIST.md` «VÒNG 76» §C | ⭐ cùng nội dung, có bảng |
