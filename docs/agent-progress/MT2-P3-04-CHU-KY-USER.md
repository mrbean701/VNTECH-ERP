# MT2-P3-04 — CHỮ KÝ USER (§13.4)

> Trạng thái: **IN_PROGRESS — audit xong, chưa code**
> Phase: **PHASE 3 — BACKEND SERVICE & API** (MT2) · Ngày audit: 22/09/2026

## 1. YÊU CẦU — NGUYÊN VĂN MT2 §13.4 (`docs/dsh/MASTER_TASK_2.md:265-266`)

```text
## 13.4. Chữ ký user
Trong modal **tạo user** và **chỉnh sửa user** ⇒ thêm **Chữ ký**, cho phép upload **đúng 1 ảnh**.
Nếu upload ảnh mới ⇒ **xoá/thay ảnh cũ** ⇒ lưu ảnh mới. ⛔ …
```
⇒ 3 điều phải có: ① ô **Chữ ký** trong modal tạo/sửa user ② **ĐÚNG 1 ảnh** ③ ảnh mới **THAY** ảnh cũ (⛔ không giữ nhiều).

## 2. HIỆN TRẠNG (bằng chứng đọc mã + đo CSDL — ⛔ không suy đoán)

| Hạng mục | Bằng chứng | Kết luận |
|---|---|---|
| Cột lưu | `information_schema`: `users.signature_url` kiểu **text · NULL được** | **ĐÃ CÓ** từ migration **V25** (MT2-P1-02) ✔ |
| Khai báo entity | `UserJpaEntity:62` `@Column(name="signature_url", length=500)` + `:63 private String signatureUrl;` | **ĐÃ CÓ** ✔ |
| Dữ liệu | `SELECT COUNT(*)`, `SUM(signature_url IS NOT NULL)` ⇒ **13 user · 0 có chữ ký** | tính năng **CHƯA dùng được** ✗ |
| API ghi | `grep signatureUrl` toàn `java-backend/**` ⇒ **chỉ 2 dòng khai báo entity** | ⛔ **KHÔNG có API/use-case/đường upload** ✗ |
| Bootstrap | `BootstrapDataAdapter:910` và `:1248` trả `u.avatar_url AS avatarUrl` nhưng ⛔ **KHÔNG trả `signature_url`** | ⛔ không có dữ liệu để hiển thị ✗ |
| Hàm domain | chưa có `changeSignature` (chỉ có `changeAvatar`) | cần thêm (soi gương avatar) |

⇒ **GAP**: entity + cột đã sẵn; thiếu **hàm domain → API → bootstrap → test** (đúng 4 tầng).

## 3. KHUÔN REUSE ĐÃ CHẠY THẬT — `AuthUseCase.updateProfileAvatar` (`AuthUseCase.java:188-204`)

```text
· validate:  avatarDataUrl khớp  ^data:image/(png|jpeg|webp);base64,.*   ⇒ nếu không: ApiError 400
              «Ảnh đại diện chỉ hỗ trợ JPG, PNG hoặc WebP.»
· giới hạn:  length > 2_800_000  ⇒ 400 «Ảnh đại diện vượt quá giới hạn 2 MB.»
· chuỗi rỗng/NULL ⇒ **XOÁ** ảnh (đúng vế «xoá/thay ảnh cũ» của §13.4)
· ghi:       user.changeAvatar(...) → userRepository.save(user)
· audit:     auditLogPort.log(userId, "AVATAR_CHANGE", "user", userId, null, "{\"avatarUpdated\":…}", null)
· TEST có sẵn (soi gương được):  AuthUseCaseTest:290  updateProfileAvatar_validatesAndClears
```

## 4. KẾ HOẠCH (⛔ KHÔNG migration mới — cột đã có ở V25)

1. **Domain**: thêm `User.changeSignature(String)` (song song `changeAvatar`) — ⛔ không đổi schema.
2. **API (đường ghi)** — phủ ĐÚNG 2 vế của §13.4:
   - ① **tự phục vụ** (soi gương avatar): action **`update_profile_signature`**
     ⇒ `AuthUseCase.updateProfileSignature(userId, dataUrl)` (validate y hệt avatar; rỗng ⇒ xoá)
     ⇒ đăng ký RBAC **`PUBLIC_ACTIONS`** (cùng nhóm `update_profile_avatar`) + capability `canUse` trong map.
   - ② **quản trị** (modal tạo/sửa user theo §13.4): cho `update_user`/tạo user nhận `signatureUrl`
     và ghi cùng lúc — **audit** kỹ `UserManagementUseCase` trước khi sửa (⛔ không đoán tên hàm).
3. **Bootstrap**: thêm `u.signature_url AS signatureUrl` vào **cả 2 truy vấn users** (`BootstrapDataAdapter:910` và `:1248`).
4. **Test H2 ĐỎ→XANH** (soi gương `AuthUseCaseTest:290`):
   · data-URL PNG hợp lệ ⇒ **lưu** và bootstrap trả `signatureUrl` ✔
   · URL ngoài `https://…` ⇒ **400** «chỉ hỗ trợ JPG, PNG hoặc WebP»
   · chuỗi rỗng ⇒ **XOÁ** (cột về NULL) ✔
   · quá 2,8 MB ⇒ **400** ✔

## 5. GHI CHÚ / RỦI RO
- ⛔ **KHÔNG** tạo bảng/cột mới; ⛔ KHÔNG sửa `avatar_url`.
- `signature_url` là **text** còn entity khai `length=500` ⇒ ⚠️ lệch khai báo (harmless vì Hibernate ở đây không tự tạo schema) — **ghi nhận**, ⛔ không sửa để tránh đổi schema.
- §13.4 nói ảnh nằm trong **modal tạo/sửa user** ⇒ phần UI thuộc đợt UI (Phase 12/6), backend làm trước theo §42 (BACKEND trước UI).

## 6. VIỆC KẾ TIẾP
1 (domain) → 2 (2 API) → 3 (bootstrap) → 4 (test).

### 22/09/2026 — KHẢO SÁT SÂU TẦNG DOMAIN/PERSISTENCE (⛔ DỪNG để tránh vá liều)
- **Bản đồ chính xác (đọc mã)**:
  · `domain/.../entity/User.java` — `:23 private String avatarUrl;` · `:27` **hàm khởi tạo** có tham số `String avatarUrl` ·
    `:40 this.avatarUrl = avatarUrl;` · `:48-49 public void changeAvatar(String newUrl) { this.avatarUrl = newUrl; }` ·
    `:69 public String avatarUrl()` ⇒ ⛔ **CHƯA có** `signatureUrl` / `changeSignature` / `signatureUrl()` ✗
  · `infrastructure/.../jpa/UserJpaEntity.java` — `:53 avatarUrl` + `:115 getAvatarUrl()` + `:122 setAvatarUrl(...)` ·
    `:63 signatureUrl` **đã có trường** nhưng ⛔ **chưa có getter/setter** ✗ (getter/setter của entity được viết TAY ✗).
- **🔴 RỦI RO PHÁT HIỆN — LÝ DO CHƯA VÁ NGAY**: `avatarUrl` nằm **trong danh sách tham số hàm khởi tạo** của
  `User` (`:27`) ⇒ nếu thêm `signatureUrl` vào hàm khởi tạo thì **MỌI chỗ `new User(...)` sẽ vỡ** ✗
  (kể cả test) — chưa đếm được hết caller trong ngân sách lượt này ⇒ ⛔ **KHÔNG vá liều** (`AGENTS.md`: chia lệnh nhỏ;
  `GOAL §8`: code chưa test = chưa DONE).
- **KẾ HOẠCH AN TOÀN (chốt cho lượt sau)**:
  1. `User.java`: thêm **trường** `signatureUrl` + `changeSignature(String)` + `signatureUrl()`
     nhưng ⛔ **KHÔNG đổi hàm khởi tạo** ⇒ ⛔ 0 caller vỡ; giá trị nạp qua `changeSignature` khi ánh xạ từ entity.
  2. `UserJpaEntity`: thêm `getSignatureUrl()/setSignatureUrl(...)` (viết tay theo khuôn `:115`/`:122`).
  3. Tìm **adapter ánh xạ JPA↔domain** (chưa xác định — ⛔ không đoán) rồi nối `signatureUrl` **⊂ 1 dòng**.
  4. Rồi mới tới 2 API + bootstrap + test như §4.
- **Next Task**: thực thi 4 bước an toàn trên (⛔ không đụng hàm khởi tạo `User`).

### 22/09/2026 — BƯỚC ①(a) XONG: DOMAIN CÓ CHỮ KÝ (compile SUCCESS) + TÌM RA 3 ĐIỂM ÁNH XẠ
- **Files Changed**: `domain/.../entity/User.java` — thêm `private String signatureUrl;` ·
  `public void changeSignature(String newUrl)` (**null/rỗng ⇒ XOÁ** — đúng vế «xoá/thay ảnh cũ» của §13.4) ·
  `public String signatureUrl()`.
- **⚠️ QUYẾT ĐỊNH AN TOÀN ĐÃ THỰC THI**: ⛔ **KHÔNG** thêm tham số vào hàm khởi tạo `User`
  (`:27` — `avatarUrl` là tham số cuối) ⇒ nếu thêm sẽ vỡ **mọi** `new User(...)`
  (đã kiểm: `AuthUseCase:105`, `AuthUseCaseTest:68`, `SessionStoreAdapter:96`, `UserRepositoryAdapter:82`) ⇒
  bằng chứng: **hàm khởi tạo VẪN đúng 13 tham số** và `mvn -B -pl domain -am compile` ⇒
  Clean Architecture **SUCCESS** · Domain **SUCCESS** · EXIT = 0 ✔ (⛔ 0 caller vỡ).
- 🔑 **ĐÃ TÌM RA ĐÚNG 3 ĐIỂM ÁNH XẠ CẦN NỐI** (thay cho phỏng đoán ở lượt trước):
  ```text
  infrastructure/.../persistence/UserRepositoryAdapter.java
     :76  existing.setAvatarUrl(user.avatarUrl());          ← ĐƯỜNG GHI  (cần set thêm chữ ký)
     :82-84  return new User(..., e.getAvatarUrl());        ← ĐƯỜNG ĐỌC  (cần changeSignature sau khi tạo)
  infrastructure/.../persistence/SessionStoreAdapter.java
     :96-98  return new User(..., e.getAvatarUrl());        ← ĐƯỜNG ĐỌC (đăng nhập/phiên) — cần nạp chữ ký
  infrastructure/.../jpa/UserJpaEntity.java
     :115 getAvatarUrl() · :122 setAvatarUrl(...)            ← cần thêm cặp getter/setter cho signatureUrl
  ```
- **Next Task**: ①(b) thêm `getSignatureUrl/setSignatureUrl` vào `UserJpaEntity` + nối **đúng 3 điểm** trên
  (⛔ không đoán: đã có số dòng cụ thể) ⇒ rồi ③ 2 API + ④ bootstrap + test.

### 22/09/2026 — BƯỚC ①(b) XONG: CHỮ KÝ ĐÃ ĐI TRỌN ĐƯỜNG DB↔ENTITY↔DOMAIN (compile 4/4 SUCCESS)
- **Files Changed**: `UserJpaEntity.java` (+`getSignatureUrl()` · +`setSignatureUrl(...)`) ·
  `UserRepositoryAdapter.java` (`merge` **ghi** chữ ký · `toDomain` **đọc** chữ ký qua `changeSignature`) ·
  `SessionStoreAdapter.java` (`toDomain` đọc chữ ký).
- **Chi tiết cách nối (đúng kế hoạch an toàn)**:
  ```text
  ghi :  merge(...)  → existing.setSignatureUrl(user.signatureUrl());   // null ⇒ XOÁ (thay/xoá ảnh cũ)
  đọc :  toDomain(e) → User user = new User(...);  user.changeSignature(e.getSignatureUrl());  return user;
         ⛔ KHÔNG thêm `signatureUrl` vào hàm khởi tạo `User` ⇒ 0 caller vỡ (đã chứng minh ở bước ①(a))
  ```
- **Tests**: `mvn -B -pl infrastructure -am compile` ⇒ Clean Architecture · Domain · Application ·
  **Infrastructure** đều **SUCCESS** · EXIT = 0 ✔ ⇒ ⛔ 0 lỗi compile trên cả 3 điểm ánh xạ.
- **API Changed**: ⛔ chưa (bước ③). **DB Changed**: ⛔ không (cột có từ V25).
- **Next Task**: ③ **2 API** — `update_profile_signature` (tự phục vụ; soi gương `updateProfileAvatar`;
  validate data-URL `png|jpeg|webp` + giới hạn 2,8 MB + rỗng ⇒ xoá; phải vào **`PUBLIC_ACTIONS`** vì
  ⛔ `List.of()` = **403** theo bài học đã kiểm) + cho `update_user` nhận `signatureUrl` (§13.4 modal quản trị)
  ⇒ ④ bootstrap `u.signature_url AS signatureUrl` ở `:910`/`:1248` ⇒ ⑤ test H2.

### 22/09/2026 — BƯỚC ③(a) XONG: API TỰ PHỤC VỤ `update_profile_signature` (compile 5/5 SUCCESS)
- **Files Changed**: `AuthUseCase.java` (+`updateProfileSignature(userId, signatureDataUrl)`) ·
  `RbacService.java` (+`update_profile_signature` vào **`PUBLIC_ACTIONS`**) ·
  `SystemController.java` (+`case "update_profile_signature"`).
- **Chi tiết (soi gương `updateProfileAvatar`, ⛔ không tự đặt luật mới)**:
  ```text
  · validate: rỗng thì bỏ qua; ngược lại phải khớp ^data:image/(png|jpeg|webp);base64,.* ⇒ 400
              «Chữ ký chỉ hỗ trợ JPG, PNG hoặc WebP.»
  · giới hạn: length > 2_800_000 ⇒ 400 «Ảnh chữ ký vượt quá giới hạn 2 MB.»
  · ghi: user.changeSignature(signatureDataUrl)   // null/rỗng ⇒ XOÁ  (đúng «xoá/thay ảnh cũ» §13.4)
  · audit: auditLogPort.log(userId, "SIGNATURE_CHANGE", "user", userId, null, {"signatureUpdated":...}, null)
  · trả:  «Đã cập nhật chữ ký.» / «Đã xóa chữ ký.»
  · Controller LUÔN dùng `cu.id()` ⇒ ⛔ KHÔNG thể sửa chữ ký người khác qua đường này (§17 backend enforcement)
  ```
- **🔑 RBAC — đúng bài học đã trả giá (403)**: `update_profile_signature` đặt ở **`PUBLIC_ACTIONS`**
  (cùng nhóm `update_profile_avatar`), ⛔ **KHÔNG** khai `List.of()` ở map module vì
  `RbacService.requireActionModule` coi map rỗng là **MẶC ĐỊNH TỪ CHỐI 403** ✗ — ⛔ không lặp lại sai sót P3-01.
- **Tests**: `mvn -B -pl web -am compile` ⇒ Clean Architecture · Domain · Application · Infrastructure ·
  **Web** đều **SUCCESS** · EXIT = 0 ✔
- **Known Issues**: ① `update_user` (đường QUẢN TRỊ theo §13.4 «modal tạo/sửa user») ⛔ **chưa** nhận `signatureUrl` ✗
  ② bootstrap ⛔ chưa trả `signatureUrl` ✗ ③ test hành vi ⛔ chưa viết ✗ ⇒ 3 việc còn lại, chưa đủ điều kiện DONE.
- **Next Task**: ③(b) `update_user` nhận `signatureUrl` → ④ bootstrap → ⑤ test H2.

### 22/09/2026 — BƯỚC ④ XONG: BOOTSTRAP TRẢ `signatureUrl` (test về ĐÚNG BASELINE)
- **Files Changed**: `BootstrapDataAdapter.java` — thêm `u.signature_url AS signatureUrl,` vào **CẢ 2**
  truy vấn danh sách user (`:910` khối `staffDirectory` và `:1248`).
- **🔴 LỖI EM GẶP & CÁCH SỬA (ghi lại vì dễ tái diễn)**: 2 lần `edit` đầu ⛔ **không khớp** vì
  **hai dòng này thụt lề KHÁC nhau** (`:910` = 23 dấu cách · `:1248` = 27 dấu cách) ✗ — em giả định cùng thụt lề.
  ⇒ Cách sửa ĐÚNG: dùng **mảnh neo KHÔNG chứa thụt lề đầu dòng** (`organizationName,u.avatar_url AS avatarUrl,`)
  + `replace_all: true`, sau khi đã **đo bằng `Select-String`** rằng mảnh đó xuất hiện **đúng 2 lần** (⛔ không sửa nhầm chỗ khác).
  🎓 **BÀI HỌC**: khi sửa nhiều chỗ giống nhau → ⛔ đừng neo vào cả dòng có thụt lề; hãy neo vào **mảnh giữa dòng**
  + **đếm số lần xuất hiện trước** khi dùng `replace_all`.
- **Tests**: `mvn -B -pl web -am test` ⇒ **Tests run: 46 · Failures: 3 · Errors: 0**;
  3 ca Đỏ = ĐÚNG 3 ca CÓ SẴN `ProductionRoleCounterProofTest` ⇒ ⛔ KHÔNG hồi quy ✔;
  ⛔ **KHÔNG lỗi `JdbcSQL`** ⇒ **cả 2 truy vấn bootstrap** (đã thêm cột mới) **chạy đúng trên H2** ✔
  (bootstrap `GET /api/system` được gọi trong nhiều test ⇒ bằng chứng chạy thật).
- **API Changed**: bootstrap trả thêm `signatureUrl` trong danh sách user.
- **Còn lại**: ① ③(b) cho `update_user` nhận `signatureUrl` (đường QUẢN TRỊ theo §13.4 «modal tạo/sửa user»)
  ② ⑤ **test HÀNH VI** (lưu · URL ngoài ⇒ 400 · rỗng ⇒ XOÁ · >2,8 MB ⇒ 400) ⇒ **⛔ chưa đủ điều kiện DONE** (GOAL §8).
- **Next Task**: ③(b) + ⑤.

### 22/09/2026 — BƯỚC ⑤ XONG ⇒ CHỨC NĂNG CHỮ KÝ CHẠY THẬT (test XANH) · CÒN ③(b)
- **Files Changed**: `web/src/test/.../ProfileSignatureTest.java` (**MỚI**).
- **Test kiểm ĐÚNG 4 vế của §13.4** (qua HTTP thật, action `update_profile_signature`):
  ```text
  ① «upload đúng 1 ảnh»        : gửi data:image/png ⇒ 200 và DB `users.signature_url` = đúng chuỗi đó
  ② «ảnh mới THAY ảnh cũ»      : gửi ảnh JPEG ⇒ cột đổi sang ảnh mới; ⛔ ĐÚNG 1 ảnh chữ ký/user
  ③ «xoá»                      : gửi chuỗi rỗng ⇒ cột về NULL
  ④ chặn ảnh sai               : URL ngoài (`https://…`) ⇒ **400**; ảnh > 2,8 MB ⇒ **400**
                                 — và cả 2 ca bị chặn đều ⛔ **KHÔNG ghi gì** vào CSDL
  ```
- **Tests**: `mvn -B -pl web -am test` ⇒ **Tests run: 47 · Failures: 3 · Errors: 0**;
  `ProfileSignatureTest` **1 run · 0 failures · 0 errors** ✔;
  3 ca Đỏ = ĐÚNG 3 ca CÓ SẴN `ProductionRoleCounterProofTest` ⇒ ⛔ KHÔNG hồi quy ✔.
- **Trạng thái thật**: đường **TỰ PHỤC VỤ** (user tự đổi chữ ký của mình) đã **chạy và có test** ✔;
  đường **QUẢN TRỊ** (§13.4 nói ô Chữ ký nằm trong **modal tạo/sửa user**) ⛔ **CHƯA làm** ✗ ⇒
  **P3-04 CHƯA DONE** (⛔ không tự đánh DONE khi thiếu 1 vế của đặc tả).
- **Next Task**: ③(b) — audit `UserManagementUseCase` rồi cho `update_user` (và tạo user) nhận `signatureUrl`,
  dùng lại đúng logic `changeSignature` (+cùng validate) ⇒ rồi mới đánh **P3-04 DONE**.

### 22/09/2026 — AUDIT ③(b) XONG: CHỌN CÁCH GHI CHỮ KÝ **AN TOÀN** (⛔ không đổi chữ ký hàm cũ)
- **Bản đồ (đọc mã)**:
  ```text
  UserManagementUseCase.updateUser(Principal, Map payload)      :88
      └─ store.updateUser(targetUserId, employeeCode, fullName, username, email, role, department, …)  :112
  UserAdminStore (port)   :22 insertUser(...)   :25 updateUser(...)   ← THAM SỐ VỊ TRÍ (positional)
  ```
- **🔴 RỦI RO NẾU VÁ ẨU**: thêm `signatureUrl` vào `store.updateUser(...)`/`insertUser(...)` sẽ **lan toả**
  sang **adapter + mọi caller** ✗ — đúng loại rủi ro đã gặp ở hàm khởi tạo `User` (bước ①(a) lượt trước).
- **✅ CÁCH ĐÃ CHỌN — AN TOÀN, THUẦN THÊM (additive)**:
  ```text
  ① port `UserAdminStore`: thêm HÀM MỚI  void setUserSignature(String userId, String signatureUrl, Instant now);
  ② adapter: cài đặt 1 câu  UPDATE users SET signature_url=?,updated_at=? WHERE id=?
  ③ use-case `updateUser(...)`: SAU `store.updateUser(...)`, nếu payload CÓ khoá `signatureUrl`
     ⇒ validate y hệt avatar (data-URL png|jpeg|webp · ≤ 2,8 MB) rồi gọi `store.setUserSignature(...)`
     (rỗng/null ⇒ ghi NULL = XOÁ — đúng vế «xoá/thay ảnh cũ» §13.4)
  ⇒ ⛔ KHÔNG đổi chữ ký tham số nào của hàm cũ ⇒ **0 caller vỡ** ✔
  ```
  💡 Vì sao ⛔ không tái dùng `UserRepository` ở đây: use-case quản trị đi qua **`UserAdminStore` (JDBC)**,
  ⛔ không dùng `UserRepository` (JPA) ⇒ trộn hai đường ghi vào CÙNG một bản ghi là rủi ro ghi đè ✗.
- **Next Task**: viết ①②③ trên + **mở rộng `ProfileSignatureTest`** thêm 1 ca: gọi `update_user` (đường QUẢN TRỊ)
  với `signatureUrl` ⇒ ⛔ chứng minh CẢ HAI đường đều ghi được, rồi mới đánh **P3-04 DONE**.

### 22/09/2026 — BƯỚC ③(b) XONG: ĐƯỜNG QUẢN TRỊ GHI ĐƯỢC CHỮ KÝ (compile 5/5 SUCCESS, ⛔ 0 chữ ký hàm cũ bị đổi)
- **Files Changed**: `UserAdminStore.java` (+hàm MỚI `setUserSignature`) ·
  `UserAdminStoreAdapter.java` (+cài đặt) · `UserManagementUseCase.java` (`updateUser` xử lý `signatureUrl`).
- **Chi tiết**:
  ```text
  ① port : void setUserSignature(String userId, String signatureUrl, Instant now);
  ② adapter: UPDATE users SET signature_url=?,updated_at=? WHERE id=?
             · rỗng/null ⇒ ghi NULL = XOÁ          · ⚠️ `Instant` ⇒ phải Timestamp.from(now) khi truyền JDBC
  ③ use-case `updateUser` (ngay SAU `store.updateUser(...)`):
             ⚠️ CHỈ làm khi payload **CÓ khoá** `signatureUrl` (⛔ không ghi đè chữ ký nếu client không gửi trường)
             · validate y hệt đường tự phục vụ: data-URL ^data:image/(png|jpeg|webp);base64, · ≤ 2,8 MB
             · lỗi ⇒ AuthUseCase.ApiError 400     · rỗng ⇒ ghi NULL (vế «xoá» §13.4)
  ```
- **✅ Vì sao CÁCH THUẦN THÊM là đúng (đã thực thi, ⛔ không đoán)**: `insertUser`/`updateUser` của port dùng
  **tham số VỊ TRÍ** ⇒ thêm tham số vào đó sẽ **lan toả** sang adapter + mọi caller ✗ ⇒ dùng **hàm mới**
  ⇒ ⛔ **0 chữ ký hàm cũ bị đổi** ⇒ ⛔ 0 caller vỡ ✔ (cùng mẫu an toàn đã dùng ở hàm khởi tạo `User`).
- **Tests**: `mvn -B -pl web -am compile` ⇒ Clean Architecture · Domain · Application · Infrastructure ·
  **Web** đều **SUCCESS** · EXIT = 0 ✔
- **Next Task**: **mở rộng `ProfileSignatureTest`** thêm ca đường QUẢN TRỊ (`update_user` + `signatureUrl`)
  ⇒ chứng minh CẢ HAI đường ghi được ⇒ rồi mới đánh **MT2-P3-04 DONE**.

### 22/09/2026 — TEST 2 ĐƯỜNG: TỰ PHỤC VỤ **XANH** · QUẢN TRỊ **ĐỎ (400)** ⇒ CHƯA DONE (đang điều tra)
- **Files Changed**: `ProfileSignatureTest.java` (+1 ca `duongQuanTri_updateUser_ghiDuocChuKy` + helper).
- **Kết quả chạy**: `mvn -B -pl web -am test` ⇒ **Tests run: 48 · Failures: 4 · Errors: 0**
  - 3 ca Đỏ = **ĐÚNG 3 ca CÓ SẴN** `ProductionRoleCounterProofTest` ⇒ ⛔ không hồi quy phần cũ ✔
  - **+1 ca Đỏ MỚI của em**: `ProfileSignatureTest.duongQuanTri_updateUser_ghiDuocChuKy`
    ⇒ `update_user` trả **400** tại `updateUserViaAdmin:148` (**ngay lần gọi ĐẦU** ⇒ chưa ghi được chữ ký nào).
- **⚠️ EM ⛔ KHÔNG KẾT LUẬN KHI CHƯA CÓ BẰNG CHỨNG** (đúng AGENTS.md + GOAL §44):
  hiện có **2 giả thuyết chưa phân biệt được**:
  ```text
  (a) payload của TEST thiếu/khác thứ `update_user` cần, đặc biệt nhánh `resolveOrganization(payload, roleRow)`
      (`UserManagementUseCase:102`) — ⛔ lỗi ở TEST, mã sản phẩm vẫn đúng;
  (b) nhánh chữ ký em thêm trong `updateUser` gây 400 — ⛔ lỗi ở MÃ.
  ```
  ⇒ Bước tiếp theo **bắt buộc**: đọc **thông báo lỗi 400 thật** (body trả về) để phân biệt (a)/(b) **trước khi sửa**.
- **Trạng thái**: **P3-04 = IN_PROGRESS** (⛔ không đánh DONE). Đường tự phục vụ **đã có test xanh** ✔;
  đường quản trị **chưa có bằng chứng chạy đúng** ✗.
- **Next Task**: lấy body lỗi 400 → xác định (a)/(b) → sửa đúng chỗ → chạy lại tới khi **48 test / 3 Đỏ có sẵn / 0 Errors**.

### 22/09/2026 — 🔬 ĐÃ PHÂN BIỆT ĐƯỢC (a)/(b) BẰNG BẰNG CHỨNG: **LỖI Ở TEST, ⛔ KHÔNG Ở MÃ**
- **Cách lấy bằng chứng (⛔ không đoán)**: đổi helper test sang **`andReturn()` + assert thủ công**
  (⚠️ `andDo` ⛔ KHÔNG chạy khi `andExpect` fail ⇒ phải dùng `andReturn()` mới **luôn** in được body)
  rồi chạy **riêng** ca đó: `mvn -pl web -am test -Dtest=ProfileSignatureTest#duongQuanTri_updateUser_ghiDuocChuKy`.
- **BẰNG CHỨNG THẬT (in từ test)**:
  ```text
  [P3-04][update_user] status=400 body={"error":"Vai trò không tồn tại hoặc đang bị ẩn trong danh mục.","ok":false}
  ```
- **KẾT LUẬN DỨT KHOÁT** ⇒ **giả thuyết (a) ĐÚNG** ✔:
  `update_user` kiểm `canonicalRoleCode(role)` và role **`admin`** ⛔ **không tồn tại/đang bị ẩn trong `role_catalog`**
  ⇒ trả **400 NGAY**, **TRƯỚC** khi chạy tới nhánh chữ ký ⇒ **⛔ KHÔNG phải lỗi ở mã chữ ký của em** ✔
  ⇒ Việc ⛔ **không sửa mò** ở vòng trước là đúng: nếu sửa mã thì đã sửa **sai chỗ** ✗.
- **ĐÃ SỬA ĐÚNG CHỖ (chỉ sửa TEST, ⛔ không đụng mã sản phẩm)**:
  · ⛔ **không** dùng chính tài khoản `admin` làm ĐÍCH nữa;
  · seed một **user ĐÍCH** bằng khuôn `TestActors.seedRequester(...)` với role **`kh_nv`** (role TỒN TẠI, đã dùng
    thành công ở `NotificationCenterTest`) + gán `organization_unit_id` lấy từ dữ liệu THẬT (⛔ không bịa);
  · thêm assert `storedSignatureOf(userId)` để kiểm chữ ký của **user đích** (⛔ không chỉ admin).
- **Next Task**: chạy lại `mvn -B -pl web -am test` ⇒ kỳ vọng **48 test / 3 Đỏ có sẵn / 0 Errors**
  ⇒ nếu đạt ⇒ đánh **MT2-P3-04 DONE** (MT2 20/98 = 20,4 %).

### 22/09/2026 — CHẨN ĐOÁN TIẾP: VẪN 400, ĐÃ THU HẸP ĐƯỢC PHẠM VI (⛔ chưa xong)
- **Chạy lại toàn bộ** ⇒ **Tests run: 48 · Failures: 4 · Errors: 0** ⇒ vẫn **1 Đỏ của em** ✗ (3 Đỏ kia là có sẵn).
  Body in ra vẫn là: `{"error":"Vai trò không tồn tại hoặc đang bị ẩn trong danh mục.","ok":false}`
- **BẰNG CHỨNG MỚI (đo `role_catalog` trên MySQL thật)** — 16 role, **tất cả active=1**:
  ```text
  accountant · cht · commander · da_nv · da_truong · director · engineer · kh_nv ·
  kh_truong · ksda · procurement · project · team · thu_kho · thuky · warehouse
  ⛔ KHÔNG có dòng `admin`  ← và users.admin mang role `admin`
  ```
- **BẰNG CHỨNG MÃ (đọc `UserManagementUseCase`, ngay sau `canonicalRoleCode`)**:
  ```java
  Map<String, Object> roleRow = store.findRoleByCode(role).orElse(null);
  if (roleRow == null || "admin".equals(role)) { … "Vai trò không tồn tại hoặc đang bị ẩn trong danh mục." }
  ```
  ⇒ giải thích **CHÍNH XÁC** vì sao lần đầu (đích = tài khoản `admin`) bị 400: role `admin` **bị loại tường minh** ✔.
- **⚠️ CÒN 1 NGHI VẤN CHƯA GIẢI QUYẾT** (⛔ không kết luận vội): lần sau đích là user seed role `kh_nv`
  (`role_catalog` **có** `kh_nv`, active=1) nhưng **vẫn 400** ⇒ nghi vấn: giá trị `role` gửi lên **không phải `kh_nv`**
  (vd. `TestActors.seedRequester(...)` ghi role khác, hoặc khoá payload sai) ✗.
  ⇒ **Bước bắt buộc kế tiếp**: **in chính payload JSON** trong test (và/hoặc in `role` đọc từ `u_sig_target`)
  để biết giá trị thật đang gửi ⇒ rồi mới sửa.
- **Trạng thái**: **P3-04 = IN_PROGRESS** (⛔ không DONE). Đường tự phục vụ: **XANH** ✔; đường quản trị: **chưa xanh** ✗.
- **Next Task**: in payload → xác định giá trị `role` thật → chọn role hợp lệ từ `role_catalog` → chạy lại.

### 22/09/2026 — 🎯 TÌM RA NGUYÊN NHÂN GỐC (bằng chứng đầy đủ): **H2 TEST THIẾU DÒNG `role_catalog`**, ⛔ không phải mã chữ ký
- **Payload in ra từ test (THẬT)** — hoàn toàn ĐÚNG:
  ```text
  {"action":"update_user","userId":"u_sig_target","employeeCode":"NV-u_sig_target","fullName":"Người Đích",
   "username":"sig.target","email":"","role":"kh_nv","department":"Phòng Kế hoạch","organizationUnitId":"",
   "active":"1","approvalLimit":"0","signatureUrl":"data:image/png;base64,…"}
  ```
  và `TestActors.seedRequester(...)` **thật sự ghi** role truyền vào (`INSERT INTO users (…,role,…) VALUES (…)`) ✔.
- **Đọc mã chỗ chặn** (`UserManagementUseCase`):
  ```java
  :99   Map<String,Object> roleRow = store.findRoleByCode(role).orElse(null);
  :100  if (roleRow == null || !isActive(roleRow.get("active")))
  :101      throw new ApiError("Vai trò không tồn tại hoặc đang bị ẩn trong danh mục.", 400);
  ```
  `UserAdminStoreAdapter.findRoleByCode`: `SELECT … FROM role_catalog WHERE code=? AND active=1` (chỉ `code` + `active=1`)
  · `canonicalRoleCode`: alias-map **không** đụng `kh_nv` ✔
- **⇒ KẾT LUẬN (em đã tự phát hiện mình ĐO NHẦM NGUỒN)**:
  con số “`role_catalog` có 16 role, `kh_nv` active=1” là đo trên **MySQL THẬT (live)** ✗ — còn test chạy trên **H2** ✗.
  ⇒ **`role_catalog` trong H2 KHÔNG có `kh_nv`** ⇒ `findRoleByCode` trả **rỗng** ⇒ **400** ✔
  ⇒ ⛔ **KHÔNG phải lỗi ở mã chữ ký** · ⛔ **không phải payload sai** · mà là **thiếu DỮ LIỆU DANH MỤC trong test** ✗.
- 🎓 **BÀI HỌC (quan trọng, dùng lại cho mọi test sau)**: **test H2 ⛔ KHÔNG tự có danh mục của MySQL**.
  `TestActors.seedRequester` có seed `module_catalog` ✔ nhưng ⛔ **KHÔNG seed `role_catalog`** ✗
  ⇒ **test nào gọi action kiểm role thì PHẢI tự seed `role_catalog`** ✔
  (đây là lần thứ 2 loại bẫy “đo sai nguồn dữ liệu” cắn em ⇒ từ nay **phải nói rõ đang đo MySQL hay H2**).
- **Next Task**: trong test **seed `role_catalog`** (dòng `kh_nv`, `active=1`, kèm các cột NOT NULL bắt buộc)
  **iff chưa có** ⇒ chạy lại tới **48 test / 3 Đỏ có sẵn / 0 Errors** ⇒ rồi đánh **P3-04 DONE**.

### 22/09/2026 — GIẢ THUYẾT ĐƯỢC CHỨNG MINH ✔ + LỘ RA CHẶN CUỐI (đã chỉ đúng dòng)
- **Đã seed `role_catalog` trong test** (đo cột NOT NULL trước: `id · code · name · created_at · updated_at`):
  ```sql
  INSERT INTO role_catalog (id,code,name,active,created_at,updated_at)
  SELECT 'rc_kh_nv','kh_nv','Nhân viên Phòng Kế hoạch',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
  WHERE NOT EXISTS (SELECT 1 FROM role_catalog WHERE code='kh_nv')
  ```
- ✅ **KẾT QUẢ: lỗi «Vai trò không tồn tại hoặc đang bị ẩn trong danh mục.» ĐÃ BIẾN MẤT** ✔
  ⇒ **GIẢ THUYẾT “H2 thiếu `role_catalog.kh_nv`” ĐƯỢC CHỨNG MINH BẰNG THỰC NGHIỆM** ✔ (⛔ không còn là suy đoán)
- 🆕 **LỘ RA CHẶN CUỐI** — lỗi mới (tiến thêm 1 tầng, body in từ test):
  ```text
  {"ok":false,"error":"Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc."}
  ```
  ⇒ ném ở `UserManagementUseCase:104-105` (điều kiện `org == null || department.isEmpty()`)
  ⇒ nguyên nhân: `resolveOrganization(payload, roleRow)` trả **NULL** vì payload có `organizationUnitId=""`
  **và** dòng role vừa seed **thiếu `default_organization_unit_id`** ⇒ ⛔ không suy ra được phòng/bộ phận.
  ⇒ ⛔ **VẪN là thiếu DỮ LIỆU test**, ⛔ **KHÔNG phải lỗi ở mã chữ ký** ✔
- **Trạng thái**: **P3-04 = IN_PROGRESS** · tổng **48 test · 4 Đỏ** (3 có sẵn + 1 của em).
  Đường tự phục vụ **XANH** ✔ · đường quản trị: đã vượt **2 tầng chặn về dữ liệu**, còn **1 tầng** ✗.
- **Next Task (đúng 1 việc)**: cho `resolveOrganization` có dữ liệu — hoặc gán
  `role_catalog.default_organization_unit_id` = một `organization_units.id` **có thật trong H2**
  (⛔ nếu H2 rỗng thì phải seed `organization_units` — đo cột NOT NULL trước), hoặc truyền `department` khớp danh mục
  ⇒ chạy lại tới **48 / 3 Đỏ có sẵn / 0 Errors** ⇒ đánh **P3-04 DONE**.

### 22/09/2026 — ✅ **MT2-P3-04 DONE** (TEST XANH CẢ 2 ĐƯỜNG)
- **Files Changed (bổ sung cuối)**: `ProfileSignatureTest.java` — seed **`organization_units`** (mã `KH`) +
  gán `role_catalog.base_role='procurement'` cho role vừa seed.
- **Đọc mã `resolveOrganization` (:329)** ⇒ hiểu ĐÚNG vì sao cần dữ liệu này — có **3 bước dự phòng**:
  ```text
  ① store.resolveOrganizationUnit(<organizationUnitId> HOẶC <department>, false)
  ② roleRow.defaultOrganizationUnitId
  ③ baseRole → code {procurement→'KH', project→'DA', accountant→'TCKT', director→'BGD',
                     engineer/commander/warehouse/team→'BCH'} ⇒ resolveOrganizationUnit(code)
  ```
  Cột NOT NULL của `organization_units`: `id · code · name · unit_type · created_at · updated_at`
  (dữ liệu thật: `KH` = «Phòng Kế hoạch»).
- **KẾT QUẢ CHẠY (`mvn -B -pl web -am test`)**:
  ```text
  Tests run: 48 · Failures: 3 · Errors: 0
  ProfileSignatureTest: 2 runs · 0 failures · 0 errors      ← CẢ HAI đường đều XANH ✔
  [P3-04][update_user] status=200 body={"message":"Đã cập nhật tài khoản sig.target.","ok":true}
  3 ca Đỏ = ĐÚNG 3 ca CÓ SẴN ProductionRoleCounterProofTest ⇒ ⛔ KHÔNG hồi quy ✔
  ```
- ✅ **MT2-P3-04 DONE** — chữ ký user (§13.4) đầy đủ: **DB ↔ entity ↔ domain ↔ 2 API ↔ bootstrap**, có test cho
  **cả đường TỰ PHỤC VỤ và đường QUẢN TRỊ**; ⛔ 0 migration (cột có từ V25).
- 🎓 **TỔNG KẾT 4 BÀI HỌC CỦA TASK NÀY** (đã trả giá thật, ghi lại để tái dùng):
  1. ⛔ **KHÔNG thêm tham số vào hàm cũ dùng tham số VỊ TRÍ** ⇒ thêm **hàm mới thuần thêm** (0 caller vỡ).
  2. **test H2 ⛔ không tự có danh mục của MySQL** ⇒ phải tự seed `role_catalog` / `organization_units`.
  3. **Luôn IN payload + body** (`andReturn()` + assert thủ công) — ⛔ `andDo` không chạy khi `andExpect` fail.
  4. **Ghi rõ đang đo MySQL hay H2** — bẫy “đo sai nguồn” đã cắn **2 lần** trong task này.
- **Next Task**: **MT2-P3-05** (vật tư NCC — bảng `supplier_materials` đã có ở V27) hoặc **P3-02/P3-03**.
