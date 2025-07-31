-- Seed data for Case Management System Development Environment
-- This script creates initial test data for development

\c case_management_dev;

-- Insert default admin user
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@casemanagement.dev',
    '$2b$10$YourHashedPasswordHere', -- This should be properly hashed in real implementation
    'System',
    'Administrator',
    'admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample caseworkers
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES 
(
    '00000000-0000-0000-0000-000000000002',
    'supervisor@casemanagement.dev',
    '$2b$10$YourHashedPasswordHere',
    'Jane',
    'Supervisor',
    'supervisor',
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000003',
    'caseworker1@casemanagement.dev',
    '$2b$10$YourHashedPasswordHere',
    'John',
    'Worker',
    'caseworker',
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000004',
    'caseworker2@casemanagement.dev',
    '$2b$10$YourHashedPasswordHere',
    'Sarah',
    'Johnson',
    'caseworker',
    true,
    true
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample cases
INSERT INTO cases (id, case_number, title, description, status, priority, assigned_to, created_by, due_date)
VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    'CASE-2024-001',
    'Initial Assessment Required',
    'New client intake requiring comprehensive assessment and service planning.',
    'open',
    'high',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP + INTERVAL '7 days'
),
(
    '10000000-0000-0000-0000-000000000002',
    'CASE-2024-002',
    'Follow-up Service Coordination',
    'Ongoing case requiring coordination with multiple service providers.',
    'in_progress',
    'medium',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP + INTERVAL '14 days'
),
(
    '10000000-0000-0000-0000-000000000003',
    'CASE-2024-003',
    'Emergency Housing Assistance',
    'Client requires immediate housing support and case management services.',
    'open',
    'urgent',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP + INTERVAL '2 days'
)
ON CONFLICT (case_number) DO NOTHING;

-- Insert sample case notes
INSERT INTO case_notes (case_id, author_id, content, is_private)
VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'Initial contact made with client. Scheduled intake appointment for next week.',
    false
),
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'Client has complex medical needs that will require specialized referrals.',
    true
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'Met with housing coordinator. Three potential placements identified.',
    false
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    'Emergency shelter placement secured. Follow-up scheduled for tomorrow.',
    false
);

-- Create sample audit log entries
INSERT INTO audit.audit_logs (user_id, action, resource_type, resource_id, new_values, ip_address)
VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'CREATE',
    'user',
    '00000000-0000-0000-0000-000000000003',
    '{"email": "caseworker1@casemanagement.dev", "role": "caseworker"}',
    '127.0.0.1'
),
(
    '00000000-0000-0000-0000-000000000002',
    'CREATE',
    'case',
    '10000000-0000-0000-0000-000000000001',
    '{"case_number": "CASE-2024-001", "status": "open"}',
    '127.0.0.1'
);

-- Note: For test database, we typically don't seed data as tests should create their own data
-- However, we can create a minimal admin user for integration tests if needed

\c case_management_test;

-- Insert minimal test admin user
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test-admin@casemanagement.dev',
    '$2b$10$TestHashedPasswordHere',
    'Test',
    'Administrator',
    'admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;