-- Database validation constraints and business rules for Case Management System
-- Apply these constraints after initial migration

-- User email validation
ALTER TABLE users ADD CONSTRAINT valid_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- User name validation (not empty after trimming)
ALTER TABLE users ADD CONSTRAINT first_name_not_empty 
  CHECK (length(trim(first_name)) > 0);

ALTER TABLE users ADD CONSTRAINT last_name_not_empty 
  CHECK (length(trim(last_name)) > 0);

-- Case title validation (not empty after trimming)
ALTER TABLE cases ADD CONSTRAINT case_title_not_empty 
  CHECK (length(trim(title)) > 0);

-- Case description validation (not empty after trimming)
ALTER TABLE cases ADD CONSTRAINT case_description_not_empty 
  CHECK (length(trim(description)) > 0);

-- Case assignment business rule: only ASSIGNED, IN_PROGRESS, PENDING_COMPLETION, and COMPLETED cases can have assignedTo
ALTER TABLE cases ADD CONSTRAINT assignment_status_rule 
  CHECK (
    (assigned_to IS NULL AND status IN ('NEW', 'PENDING_REVIEW')) OR
    (assigned_to IS NOT NULL AND status IN ('ASSIGNED', 'IN_PROGRESS', 'PENDING_COMPLETION', 'COMPLETED'))
  );

-- Case document file size validation (100MB limit)
ALTER TABLE case_documents ADD CONSTRAINT reasonable_file_size 
  CHECK (file_size > 0 AND file_size <= 104857600);

-- Case document filename validation (not empty)
ALTER TABLE case_documents ADD CONSTRAINT filename_not_empty 
  CHECK (length(trim(filename)) > 0);

-- Case document S3 key validation (not empty and follows pattern)
ALTER TABLE case_documents ADD CONSTRAINT s3_key_format 
  CHECK (length(trim(s3_key)) > 0 AND s3_key ~ '^case-documents/');

-- Case log action validation (not empty)
ALTER TABLE case_logs ADD CONSTRAINT action_not_empty 
  CHECK (length(trim(action)) > 0);

-- Create partial indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_cases 
  ON cases(status, created_at) 
  WHERE status IN ('NEW', 'PENDING_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_COMPLETION');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_assignments 
  ON cases(created_at DESC) 
  WHERE status = 'PENDING_REVIEW';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_assigned_cases 
  ON cases(assigned_to, status, updated_at DESC) 
  WHERE assigned_to IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_case_logs_recent 
  ON case_logs(case_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity 
  ON case_logs(user_id, timestamp DESC);

-- Create materialized view for reporting (case statistics by user and status)
CREATE MATERIALIZED VIEW IF NOT EXISTS case_statistics AS
SELECT 
  u.role,
  u.first_name || ' ' || u.last_name as user_name,
  c.status,
  c.priority,
  COUNT(*) as case_count,
  AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at))/3600) as avg_hours_to_update
FROM cases c
JOIN users u ON c.created_by = u.id
GROUP BY u.role, u.first_name, u.last_name, c.status, c.priority
ORDER BY u.role, case_count DESC;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_statistics_unique 
  ON case_statistics(role, user_name, status, priority);

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_case_statistics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY case_statistics;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE users IS 'System users with role-based access control for case management';
COMMENT ON TABLE cases IS 'Core business entity managing case workflow from creation to completion';
COMMENT ON TABLE case_logs IS 'Complete audit trail for all case activities and status changes';
COMMENT ON TABLE case_documents IS 'File attachments linked to cases with S3 storage metadata';

COMMENT ON COLUMN users.role IS 'User role: CLERK (creates cases), CHAIR (assigns/approves), CASEWORKER (executes)';
COMMENT ON COLUMN cases.status IS 'Workflow status: NEW → PENDING_REVIEW → ASSIGNED → IN_PROGRESS → PENDING_COMPLETION → COMPLETED';
COMMENT ON COLUMN cases.priority IS 'Case priority level affecting assignment and completion urgency';
COMMENT ON COLUMN case_logs.action IS 'Action type: created, assigned, status_changed, commented, document_uploaded';
COMMENT ON COLUMN case_logs.details IS 'JSON object containing additional context and metadata for the action';
COMMENT ON COLUMN case_documents.s3_key IS 'Unique S3 object key for secure file retrieval with presigned URLs';

-- Row Level Security policies (commented out - enable when implementing multi-tenancy)
-- ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY case_access_policy ON cases
--   USING (
--     created_by = current_setting('app.current_user_id')::uuid OR 
--     assigned_to = current_setting('app.current_user_id')::uuid OR
--     EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.current_user_id')::uuid AND role = 'CHAIR')
--   );