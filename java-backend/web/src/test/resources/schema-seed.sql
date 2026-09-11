-- Test-only: tạo các bảng seed (company_settings, email_settings, warehouses) cho integration test
-- (users/sessions/projects do JPA ddl-auto tạo; bảng này do SystemSetupAdapter dùng JdbcTemplate)
CREATE TABLE IF NOT EXISTS company_settings (
  id VARCHAR(64) PRIMARY KEY,
  company_name VARCHAR(500) NOT NULL,
  updated_by VARCHAR(64),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS email_settings (
  id VARCHAR(64) PRIMARY KEY,
  enabled TINYINT(1) DEFAULT 0 NOT NULL,
  smtp_port INT DEFAULT 587,
  security VARCHAR(64) DEFAULT 'starttls',
  sender_name VARCHAR(255),
  updated_by VARCHAR(64),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS warehouses (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(500) NOT NULL,
  type VARCHAR(64),
  project_id VARCHAR(64),
  parent_warehouse_id VARCHAR(64),
  keeper_user_id VARCHAR(64),
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);