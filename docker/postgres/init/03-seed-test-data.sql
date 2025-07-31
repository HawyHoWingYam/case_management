-- Test data seeding for case management system
-- This script populates the test database with sample data for testing

-- Insert test users
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'test@example.com', '$2b$10$example.hash.for.testing', 'Test', 'User', 'caseworker', true, NOW(), NOW()),
('123e4567-e89b-12d3-a456-426614174001', 'admin@example.com', '$2b$10$example.hash.for.testing', 'Admin', 'User', 'admin', true, NOW(), NOW()),
('123e4567-e89b-12d3-a456-426614174002', 'supervisor@example.com', '$2b$10$example.hash.for.testing', 'Supervisor', 'User', 'supervisor', true, NOW(), NOW()),
('123e4567-e89b-12d3-a456-426614174003', 'caseworker2@example.com', '$2b$10$example.hash.for.testing', 'Jane', 'Smith', 'caseworker', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test clients
INSERT INTO clients (id, first_name, last_name, email, phone, address, date_of_birth, created_at, updated_at) VALUES
('223e4567-e89b-12d3-a456-426614174000', 'John', 'Doe', 'john.doe@example.com', '+1234567890', '123 Main St, City, State 12345', '1990-01-01', NOW(), NOW()),
('223e4567-e89b-12d3-a456-426614174001', 'Jane', 'Johnson', 'jane.johnson@example.com', '+1234567891', '456 Oak Ave, City, State 12345', '1985-05-15', NOW(), NOW()),
('223e4567-e89b-12d3-a456-426614174002', 'Bob', 'Wilson', 'bob.wilson@example.com', '+1234567892', '789 Pine St, City, State 12345', '1992-09-30', NOW(), NOW()),
('223e4567-e89b-12d3-a456-426614174003', 'Alice', 'Brown', 'alice.brown@example.com', '+1234567893', '321 Elm St, City, State 12345', '1988-12-10', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test cases
INSERT INTO cases (id, title, description, status, priority, assigned_user_id, client_id, created_at, updated_at) VALUES
('323e4567-e89b-12d3-a456-426614174000', 'Test Case 1', 'This is a test case for unit testing purposes', 'open', 'medium', '123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174000', NOW(), NOW()),
('323e4567-e89b-12d3-a456-426614174001', 'High Priority Case', 'Urgent case requiring immediate attention', 'open', 'high', '123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001', NOW(), NOW()),
('323e4567-e89b-12d3-a456-426614174002', 'Closed Case', 'This case has been resolved and closed', 'closed', 'low', '123e4567-e89b-12d3-a456-426614174003', '223e4567-e89b-12d3-a456-426614174002', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),
('323e4567-e89b-12d3-a456-426614174003', 'In Progress Case', 'Case currently being worked on', 'in_progress', 'medium', '123e4567-e89b-12d3-a456-426614174003', '223e4567-e89b-12d3-a456-426614174003', NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test case notes
INSERT INTO case_notes (id, case_id, user_id, content, created_at, updated_at) VALUES
('423e4567-e89b-12d3-a456-426614174000', '323e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000', 'Initial assessment completed. Client cooperative.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('423e4567-e89b-12d3-a456-426614174001', '323e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000', 'Follow-up scheduled for next week.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('423e4567-e89b-12d3-a456-426614174002', '323e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174000', 'Urgent: Client requires immediate assistance.', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
('423e4567-e89b-12d3-a456-426614174003', '323e4567-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174003', 'Case resolved successfully. All documentation completed.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Insert test documents
INSERT INTO documents (id, case_id, filename, original_name, mime_type, size, s3_key, uploaded_by, created_at, updated_at) VALUES
('523e4567-e89b-12d3-a456-426614174000', '323e4567-e89b-12d3-a456-426614174000', 'assessment_report.pdf', 'Initial Assessment Report.pdf', 'application/pdf', 1024000, 'documents/323e4567-e89b-12d3-a456-426614174000/assessment_report.pdf', '123e4567-e89b-12d3-a456-426614174000', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('523e4567-e89b-12d3-a456-426614174001', '323e4567-e89b-12d3-a456-426614174001', 'medical_records.pdf', 'Medical Records.pdf', 'application/pdf', 2048000, 'documents/323e4567-e89b-12d3-a456-426614174001/medical_records.pdf', '123e4567-e89b-12d3-a456-426614174000', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('523e4567-e89b-12d3-a456-426614174002', '323e4567-e89b-12d3-a456-426614174002', 'closure_summary.docx', 'Case Closure Summary.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 512000, 'documents/323e4567-e89b-12d3-a456-426614174002/closure_summary.docx', '123e4567-e89b-12d3-a456-426614174003', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Insert test audit logs
INSERT INTO audit_logs (id, table_name, record_id, action, old_values, new_values, user_id, created_at) VALUES
('623e4567-e89b-12d3-a456-426614174000', 'cases', '323e4567-e89b-12d3-a456-426614174000', 'CREATE', '{}', '{"title": "Test Case 1", "status": "open", "priority": "medium"}', '123e4567-e89b-12d3-a456-426614174000', NOW() - INTERVAL '2 days'),
('623e4567-e89b-12d3-a456-426614174001', 'cases', '323e4567-e89b-12d3-a456-426614174002', 'UPDATE', '{"status": "in_progress"}', '{"status": "closed"}', '123e4567-e89b-12d3-a456-426614174003', NOW() - INTERVAL '5 days'),
('623e4567-e89b-12d3-a456-426614174002', 'case_notes', '423e4567-e89b-12d3-a456-426614174000', 'CREATE', '{}', '{"content": "Initial assessment completed. Client cooperative."}', '123e4567-e89b-12d3-a456-426614174000', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Update sequences if needed (PostgreSQL specific)
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id::integer), 1) FROM users WHERE id ~ '^[0-9]+$'), false);
SELECT setval('clients_id_seq', (SELECT COALESCE(MAX(id::integer), 1) FROM clients WHERE id ~ '^[0-9]+$'), false);
SELECT setval('cases_id_seq', (SELECT COALESCE(MAX(id::integer), 1) FROM cases WHERE id ~ '^[0-9]+$'), false);

-- Create test-specific indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_test_cases_assigned_user ON cases(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_test_case_notes_case_id ON case_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_test_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_test_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Create a view for test statistics
CREATE OR REPLACE VIEW test_case_statistics AS
SELECT 
    COUNT(*) as total_cases,
    COUNT(*) FILTER (WHERE status = 'open') as open_cases,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_cases,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_cases,
    COUNT(*) FILTER (WHERE priority = 'high') as high_priority_cases,
    COUNT(*) FILTER (WHERE priority = 'medium') as medium_priority_cases,
    COUNT(*) FILTER (WHERE priority = 'low') as low_priority_cases
FROM cases;

COMMIT;