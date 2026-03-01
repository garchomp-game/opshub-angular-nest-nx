-- audit_logs テーブルの INSERT ONLY 制約（DB レベル）
-- UPDATE を禁止
CREATE RULE audit_logs_no_update AS
  ON UPDATE TO audit_logs
  DO INSTEAD NOTHING;

-- DELETE を禁止
CREATE RULE audit_logs_no_delete AS
  ON DELETE TO audit_logs
  DO INSTEAD NOTHING;