-- pg_trgm 拡張を有効化
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Workflow: title + description の GIN インデックス
CREATE INDEX IF NOT EXISTS idx_workflows_title_search
  ON workflows USING gin (COALESCE(title, '') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_workflows_description_search
  ON workflows USING gin (COALESCE(description, '') gin_trgm_ops);

-- Project: name + description の GIN インデックス
CREATE INDEX IF NOT EXISTS idx_projects_name_search
  ON projects USING gin (COALESCE(name, '') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_projects_description_search
  ON projects USING gin (COALESCE(description, '') gin_trgm_ops);

-- Task: title の GIN インデックス
CREATE INDEX IF NOT EXISTS idx_tasks_title_search
  ON tasks USING gin (COALESCE(title, '') gin_trgm_ops);

-- Expense: description の GIN インデックス
CREATE INDEX IF NOT EXISTS idx_expenses_description_search
  ON expenses USING gin (COALESCE(description, '') gin_trgm_ops);