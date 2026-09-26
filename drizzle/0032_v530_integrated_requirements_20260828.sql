-- V5.3 integrated requirements: labels and data-integrity guards.
UPDATE module_catalog SET label='Báo cáo sản lượng',updated_at=CURRENT_TIMESTAMP WHERE module_key='production';
--> statement-breakpoint
UPDATE module_catalog SET label='Báo cáo thu hồi vốn',updated_at=CURRENT_TIMESTAMP WHERE module_key='payments';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS teams_project_active_idx ON teams(project_id,active);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS stock_issues_team_idx ON stock_issues(team_id,issued_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS material_returns_team_idx ON material_returns(team_id,returned_at);
