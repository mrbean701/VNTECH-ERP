// MT2-P12-07 (§13.3) — CỔNG KIỂM TRA TOÀN VẸN ĐỊNH DANH NGƯỜI DÙNG (CHỈ ĐỌC).
//
// Mục đích: «⛔ **không tạo hai identity khác nhau cho cùng một user**» (§13.3) — biến yêu cầu này thành CỔNG
// kiểm tra CHẠY LẠI ĐƯỢC, thay vì chỉ đo một lần rồi ghi log.
//
// ⚠️ TUYỆT ĐỐI CHỈ ĐỌC: tệp này **không** có `INSERT` / `UPDATE` / `DELETE` / `ALTER` / `DROP`.
//    Chạy: java -cp "<mysql-connector.jar>" tools/IdentityIntegrityCheck.java
//    (hoặc đặt VNTECH_DB_URL / VNTECH_DB_USER / VNTECH_DB_PASSWORD để trỏ CSDL khác)
//    Mã thoát: 0 = sạch · 1 = CÓ VI PHẠM ĐỊNH DANH (dùng làm cổng chặn CI).
//
// Phân loại kết quả:
//   · LỖI   (exit 1): hồ sơ nhân sự trỏ tới user KHÔNG tồn tại · trùng mã nhân viên · trùng tên đăng nhập
//                   · 1 user có NHIỀU hồ sơ nhân sự.
//   · CẢNH BÁO (exit 0): user chưa có mã / chưa có cấp bậc / chưa có hồ sơ — là TRẠNG THÁI DỮ LIỆU đã biết
//                   (theo dõi ở BLK-02/BLK-06), ⛔ KHÔNG tự sửa vì cần quyết định nghiệp vụ.
import java.sql.*;

public class IdentityIntegrityCheck {
    private static int errors = 0;
    private static int warnings = 0;

    public static void main(String[] args) throws Exception {
        String url = System.getenv().getOrDefault("VNTECH_DB_URL",
                "jdbc:mysql://localhost:3306/vntech_erp?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true&useSSL=false");
        String user = System.getenv().getOrDefault("VNTECH_DB_USER", "vntech");
        String pass = System.getenv().getOrDefault("VNTECH_DB_PASSWORD", "vntech");
        try (Connection c = DriverManager.getConnection(url, user, pass)) {
            System.out.println("MT2-P12-07 · KIỂM TRA TOÀN VẸN ĐỊNH DANH NGƯỜI DÙNG (chỉ đọc)");
            System.out.println("CSDL: " + c.getMetaData().getDatabaseProductName()
                    + " · schema " + c.getCatalog());
            System.out.println();

            // ① Hồ sơ nhân sự trỏ tới user KHÔNG tồn tại ⇒ 2 identity lệch nhau
            error(c, "Hồ sơ nhân sự trỏ user KHÔNG tồn tại (mồ côi)",
                    "SELECT h.id,h.user_id FROM hr_records h LEFT JOIN users u ON u.id=h.user_id WHERE u.id IS NULL");
            // ② Một user có NHIỀU hồ sơ nhân sự ⇒ 2 identity cùng 1 người
            error(c, "Một user có nhiều hồ sơ nhân sự",
                    "SELECT user_id,COUNT(*) AS so_hos_so FROM hr_records GROUP BY user_id HAVING COUNT(*)>1");
            // ③ Trùng mã nhân viên (bỏ qua rỗng — rỗng đã bị chặn ở tầng ứng dụng từ P12-05)
            error(c, "Mã nhân viên bị TRÙNG giữa 2 tài khoản",
                    "SELECT employee_code,COUNT(*) AS so_user FROM users"
                    + " WHERE employee_code IS NOT NULL AND TRIM(employee_code)<>''"
                    + " GROUP BY employee_code HAVING COUNT(*)>1");
            // ④ Trùng tên đăng nhập
            error(c, "Tên đăng nhập bị TRÙNG",
                    "SELECT username,COUNT(*) AS so_user FROM users GROUP BY username HAVING COUNT(*)>1");

            // ⑤⑥⑦ Trạng thái dữ liệu đã biết — CẢNH BÁO, ⛔ không tự sửa
            warn(c, "Tài khoản CHƯA có mã nhân viên (BLK-06)",
                    "SELECT username,full_name FROM users WHERE employee_code IS NULL OR TRIM(employee_code)=''");
            warn(c, "Tài khoản CHƯA có cấp bậc hệ thống (BLK-02)",
                    "SELECT username,full_name FROM users WHERE system_level_code IS NULL OR TRIM(system_level_code)=''");
            warn(c, "Tài khoản CHƯA có hồ sơ nhân sự",
                    "SELECT u.username,u.full_name FROM users u LEFT JOIN hr_records h ON h.user_id=u.id WHERE h.user_id IS NULL");

            // ⑧ Tổng quan
            one(c, "Tổng quan", "SELECT (SELECT COUNT(*) FROM users) AS users,"
                    + " (SELECT COUNT(*) FROM hr_records) AS hr_records,"
                    + " (SELECT COUNT(*) FROM users WHERE active=1) AS active_users");

            // ⑨ Ràng buộc CSDL phải CÒN (ai đó xoá index ⇒ cổng này phải đỏ)
            one(c, "Ràng buộc UNIQUE phải còn", "SELECT INDEX_NAME,NON_UNIQUE,COLUMN_NAME FROM information_schema.STATISTICS"
                    + " WHERE TABLE_SCHEMA=DATABASE() AND INDEX_NAME IN"
                    + " ('users_employee_code_uidx','users_username_uidx','hr_records_uidx_user_id')"
                    + " ORDER BY INDEX_NAME");
        }
        System.out.println();
        System.out.println("KẾT QUẢ: lỗi=" + errors + " · cảnh báo=" + warnings
                + " ⇒ " + (errors > 0 ? "❌ CÓ VI PHẠM ĐỊNH DANH (exit 1)" : "✅ sạch (exit 0)"));
        System.exit(errors > 0 ? 1 : 0);
    }

    private static void error(Connection c, String title, String sql) {
        int n = count(c, sql);
        System.out.println((n > 0 ? "❌ LỖI  " : "✅ OK    ") + title + " → " + n);
        if (n > 0) { errors++; rows(c, sql); }
    }

    private static void warn(Connection c, String title, String sql) {
        int n = count(c, sql);
        System.out.println((n > 0 ? "⚠️  CẢNH BÁO " : "✅ OK         ") + title + " → " + n);
        if (n > 0) { warnings++; rows(c, sql); }
    }

    private static void one(Connection c, String title, String sql) {
        System.out.println("ℹ️  " + title);
        rows(c, sql);
    }

    private static int count(Connection c, String sql) {
        try (Statement st = c.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            int n = 0;
            while (rs.next()) n++;
            return n;
        } catch (SQLException e) {
            System.out.println("   ⚠️ LỖI TRUY VẤN: " + e.getMessage());
            return -1;
        }
    }

    private static void rows(Connection c, String sql) {
        try (Statement st = c.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            ResultSetMetaData m = rs.getMetaData();
            int n = m.getColumnCount();
            StringBuilder head = new StringBuilder("   ");
            for (int i = 1; i <= n; i++) head.append(m.getColumnLabel(i)).append(i < n ? " | " : "");
            System.out.println(head);
            while (rs.next()) {
                StringBuilder line = new StringBuilder("   ");
                for (int i = 1; i <= n; i++) line.append(rs.getString(i)).append(i < n ? " | " : "");
                System.out.println(line);
            }
        } catch (SQLException e) {
            System.out.println("   ⚠️ LỖI ĐỌC DÒNG: " + e.getMessage());
        }
    }
}
