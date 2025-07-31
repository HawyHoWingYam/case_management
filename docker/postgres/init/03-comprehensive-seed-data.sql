-- Comprehensive seed data for Case Management System Development Environment
-- This script creates realistic test data for development and testing

\c case_management_dev;

-- Clear existing data
TRUNCATE TABLE case_documents, case_notes, cases, users, audit.audit_logs, security.user_sessions RESTART IDENTITY CASCADE;

-- Insert comprehensive user data with properly hashed passwords
-- Password: admin123
INSERT INTO users (id, email, password, first_name, last_name, phone_number, role, status, email_verified, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@casemanagement.dev',
    '$2a$10$pDi8nSMJNZJE4CQb1iVuL.21admWwGFQs7zgpi2bDObiOBnKVQ8l2',
    'System',
    'Administrator',
    '+1-555-0001',
    'admin',
    'active',
    true,
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
);

-- Password: supervisor123
INSERT INTO users (id, email, password, first_name, last_name, phone_number, role, status, email_verified, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'supervisor@casemanagement.dev',
    '$2a$10$69Sj.Wzo3Q0q2QwcJXGeSu6AzBX3eDRU1YWoh/dMXONHoWQ.w1i/m',
    'Jane',
    'Supervisor',
    '+1-555-0002',
    'supervisor',
    'active',
    true,
    CURRENT_TIMESTAMP - INTERVAL '25 days',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
);

-- Password: caseworker123
INSERT INTO users (id, email, password, first_name, last_name, phone_number, role, status, email_verified, created_at, updated_at)
VALUES 
(
    '00000000-0000-0000-0000-000000000003',
    'caseworker1@casemanagement.dev',
    '$2a$10$yHmkz/fJcvQTSDZs0nPnD.gFDxFqqMRIwr4yfQsgAOSWk0AZKfzAe',
    'John',
    'Worker',
    '+1-555-0003',
    'caseworker',
    'active',
    true,
    CURRENT_TIMESTAMP - INTERVAL '20 days',
    CURRENT_TIMESTAMP - INTERVAL '30 minutes'
),
(
    '00000000-0000-0000-0000-000000000004',
    'caseworker2@casemanagement.dev',
    '$2a$10$yHmkz/fJcvQTSDZs0nPnD.gFDxFqqMRIwr4yfQsgAOSWk0AZKfzAe',
    'Sarah',
    'Johnson',
    '+1-555-0004',
    'caseworker',
    'active',
    true,
    CURRENT_TIMESTAMP - INTERVAL '18 days',
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
),
(
    '00000000-0000-0000-0000-000000000005',
    'caseworker3@casemanagement.dev',
    '$2a$10$yHmkz/fJcvQTSDZs0nPnD.gFDxFqqMRIwr4yfQsgAOSWk0AZKfzAe',
    'Michael',
    'Davis',
    '+1-555-0005',
    'caseworker',
    'active',
    true,
    CURRENT_TIMESTAMP - INTERVAL '15 days',
    CURRENT_TIMESTAMP - INTERVAL '45 minutes'
);

-- Password: client123
INSERT INTO users (id, email, password, first_name, last_name, phone_number, role, status, email_verified, created_at, updated_at)
VALUES 
(
    '00000000-0000-0000-0000-000000000006',
    'client1@example.com',
    '$2a$10$79ir4rYP0Ixr0BsUz9pmbeWII8BaKhHwa04hovhQRfZ/v4e1msNJS',
    'Alice',
    'Smith',
    '+1-555-1001',
    'client',
    'active',
    true,
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP - INTERVAL '3 hours'
),
(
    '00000000-0000-0000-0000-000000000007',
    'client2@example.com',
    '$2a$10$79ir4rYP0Ixr0BsUz9pmbeWII8BaKhHwa04hovhQRfZ/v4e1msNJS',
    'Robert',
    'Brown',
    '+1-555-1002',
    'client',
    'active',
    true,
    CURRENT_TIMESTAMP - INTERVAL '8 days',
    CURRENT_TIMESTAMP - INTERVAL '5 hours'
),
(
    '00000000-0000-0000-0000-000000000008',
    'client3@example.com',
    '$2a$10$79ir4rYP0Ixr0BsUz9pmbeWII8BaKhHwa04hovhQRfZ/v4e1msNJS',
    'Emily',
    'Wilson',
    '+1-555-1003',
    'client',
    'active',
    false,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    '00000000-0000-0000-0000-000000000009',
    'client4@example.com',
    '$2a$10$79ir4rYP0Ixr0BsUz9pmbeWII8BaKhHwa04hovhQRfZ/v4e1msNJS',
    'David',
    'Martinez',
    '+1-555-1004',
    'client',
    'active',
    true,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
);

-- Insert comprehensive case data
INSERT INTO cases (id, case_number, title, description, type, status, priority, client_id, assigned_to, created_by, due_date, metadata, created_at, updated_at)
VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    'CASE-2025-001',
    'Initial Legal Consultation - Contract Review',
    'Client requires legal review of employment contract with specific focus on non-compete clauses and compensation structure. Case involves complex intellectual property considerations.',
    'legal_advice',
    'open',
    'high',
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    '{"contract_type": "employment", "industry": "technology", "urgency_reason": "job_start_date"}',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
),
(
    '10000000-0000-0000-0000-000000000002',
    'CASE-2025-002',
    'Family Law Mediation - Custody Agreement',
    'Mediation services required for child custody arrangement. Both parties seeking collaborative approach to reach mutually beneficial agreement.',
    'mediation',
    'in_progress',
    'medium',
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    '{"children_count": 2, "mediation_type": "custody", "previous_agreements": true}',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '3 hours'
),
(
    '10000000-0000-0000-0000-000000000003',
    'CASE-2025-003',
    'Emergency Housing Legal Assistance',
    'Client facing imminent eviction requires emergency legal representation. Complex case involving tenant rights and landlord obligations.',
    'representation',
    'open',
    'urgent',
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    '{"case_type": "eviction", "emergency": true, "court_date": "2025-08-05"}',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '30 minutes'
),
(
    '10000000-0000-0000-0000-000000000004',
    'CASE-2025-004',
    'Document Review - Business Partnership Agreement',
    'Comprehensive review of partnership agreement for new business venture. Includes liability, profit sharing, and exit strategy clauses.',
    'document_review',
    'pending_review',
    'medium',
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP + INTERVAL '10 days',
    '{"document_pages": 45, "business_type": "partnership", "review_scope": "comprehensive"}',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
),
(
    '10000000-0000-0000-0000-000000000005',
    'CASE-2025-005',
    'Immigration Consultation - Visa Application',
    'Initial consultation for work visa application. Client requires guidance on documentation and application process.',
    'consultation',
    'closed',
    'low',
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    '{"visa_type": "H1B", "consultation_outcome": "approved", "follow_up_required": false}',
    CURRENT_TIMESTAMP - INTERVAL '15 days',
    CURRENT_TIMESTAMP - INTERVAL '10 days'
),
(
    '10000000-0000-0000-0000-000000000006',
    'CASE-2025-006',
    'Personal Injury - Car Accident Claim',
    'Client injured in motor vehicle accident seeks legal representation for insurance claim and potential lawsuit.',
    'representation',
    'open',
    'high',
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP + INTERVAL '21 days',
    '{"accident_date": "2025-07-20", "injury_type": "whiplash", "insurance_company": "StateAuto"}',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
);

-- Update one case to be closed
UPDATE cases 
SET 
    status = 'closed',
    closed_at = CURRENT_TIMESTAMP - INTERVAL '5 days',
    closed_by = '00000000-0000-0000-0000-000000000002',
    closure_reason = 'Successfully completed initial consultation. Client received all requested guidance and documentation requirements. No further action required at this time.'
WHERE id = '10000000-0000-0000-0000-000000000005';

-- Insert comprehensive case notes
INSERT INTO case_notes (case_id, author_id, type, title, content, is_confidential, is_billable, billable_hours, contact_date, metadata, created_at)
VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'phone_call',
    'Initial Client Contact',
    'Spoke with client Alice Smith regarding employment contract review. Client is concerned about non-compete clause scope and wants to understand implications before signing. Scheduled in-person meeting for detailed document review.',
    false,
    true,
    0.5,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    '{"call_duration": 30, "follow_up_required": true}',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'meeting',
    'Contract Review Session',
    'Conducted detailed review of employment contract with client. Identified several concerning clauses in sections 4.2 and 7.1 regarding non-compete restrictions. Advised client on potential modifications to request.',
    false,
    true,
    2.0,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    '{"meeting_location": "office", "documents_reviewed": ["employment_contract_v1.pdf"]}',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'internal',
    'Case Strategy Discussion',
    'Discussed case strategy with John Worker. Recommend focusing negotiations on geographic scope of non-compete and compensation adjustment for restrictive clauses.',
    true,
    false,
    null,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    '{"participants": ["supervisor", "caseworker"], "strategy_approved": true}',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'meeting',
    'Mediation Session #1',
    'First mediation session with both parties present. Established ground rules and identified key areas of concern: custody schedule, holiday arrangements, and decision-making authority.',
    false,
    true,
    3.0,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    '{"session_number": 1, "both_parties_present": true, "progress_level": "good"}',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'phone_call',
    'Follow-up with Client',
    'Client called to discuss concerns about upcoming mediation session. Provided reassurance and guidance on preparation. Scheduled brief pre-session consultation.',
    false,
    true,
    0.25,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    '{"call_type": "client_initiated", "emotional_support": true}',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000005',
    'email',
    'Emergency Response - Documentation Request',
    'Received emergency call from client Emily Wilson. Immediately requested all relevant documents: lease agreement, notice to quit, correspondence with landlord. Set up urgent meeting for tomorrow morning.',
    false,
    true,
    0.75,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    '{"urgency": "high", "emergency_response": true, "documents_requested": ["lease", "notices", "correspondence"]}',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    'document_review',
    'Partnership Agreement Analysis',
    'Completed initial review of 45-page partnership agreement. Identified several areas requiring clarification: profit distribution formula, intellectual property ownership, and dissolution procedures.',
    false,
    true,
    4.5,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    '{"pages_reviewed": 45, "issues_identified": 8, "priority_issues": 3}',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000004',
    'general',
    'Visa Application Consultation Complete',
    'Successfully completed H1B visa consultation with client. Provided comprehensive checklist of required documents, timeline expectations, and application procedures. Client well-prepared to proceed independently.',
    false,
    true,
    1.5,
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    '{"consultation_type": "H1B", "outcome": "successful", "client_satisfaction": "high"}',
    CURRENT_TIMESTAMP - INTERVAL '10 days'
);

-- Insert sample case documents
INSERT INTO case_documents (case_id, uploaded_by, original_filename, stored_filename, file_path, file_size, mime_type, type, status, description, is_confidential, reviewed_by, reviewed_at, file_hash, created_at)
VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000006',
    'employment_contract_draft.pdf',
    'emp_contract_001_20250730.pdf',
    '/documents/cases/10000000-0000-0000-0000-000000000001/emp_contract_001_20250730.pdf',
    245760,
    'application/pdf',
    'contract',
    'approved',
    'Draft employment contract requiring legal review before signing',
    false,
    '00000000-0000-0000-0000-000000000003',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    'a1b2c3d4e5f6789012345678901234567890abcdef1234567890123456789012',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'contract_analysis_notes.docx',
    'analysis_notes_001_20250730.docx',
    '/documents/cases/10000000-0000-0000-0000-000000000001/analysis_notes_001_20250730.docx',
    87432,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'other',
    'approved',
    'Detailed analysis notes and recommendations for contract modifications',
    true,
    '00000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    'b2c3d4e5f6789012345678901234567890abcdef1234567890123456789012a',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000007',
    'custody_financial_disclosure.pdf',
    'financial_disc_002_20250730.pdf',
    '/documents/cases/10000000-0000-0000-0000-000000000002/financial_disc_002_20250730.pdf',
    156789,
    'application/pdf',
    'financial',
    'pending_review',
    'Financial disclosure statement for custody mediation',
    true,
    null,
    null,
    'c3d4e5f6789012345678901234567890abcdef1234567890123456789012ab',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000008',
    'lease_agreement.pdf',
    'lease_003_20250730.pdf',
    '/documents/cases/10000000-0000-0000-0000-000000000003/lease_003_20250730.pdf',
    198765,
    'application/pdf',
    'contract',
    'approved',
    'Current lease agreement - primary evidence for eviction case',
    false,
    '00000000-0000-0000-0000-000000000005',
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    'd4e5f6789012345678901234567890abcdef1234567890123456789012abc',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000008',
    'eviction_notice.pdf',
    'eviction_notice_003_20250730.pdf',
    '/documents/cases/10000000-0000-0000-0000-000000000003/eviction_notice_003_20250730.pdf',
    78432,
    'application/pdf',
    'correspondence',
    'approved',
    '30-day eviction notice from landlord',
    false,
    '00000000-0000-0000-0000-000000000005',
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    'e5f6789012345678901234567890abcdef1234567890123456789012abcd',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000009',
    'partnership_agreement_v2.pdf',
    'partnership_004_20250730.pdf',
    '/documents/cases/10000000-0000-0000-0000-000000000004/partnership_004_20250730.pdf',
    342187,
    'application/pdf',
    'contract',
    'pending_review',
    'Partnership agreement draft requiring comprehensive legal review',
    false,
    null,
    null,
    'f6789012345678901234567890abcdef1234567890123456789012abcde',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
);

-- Insert comprehensive audit log entries
INSERT INTO audit.audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, created_at)
VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'CREATE',
    'user',
    '00000000-0000-0000-0000-000000000003',
    null,
    '{"email": "caseworker1@casemanagement.dev", "role": "caseworker", "status": "active"}',
    '192.168.1.10',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    CURRENT_TIMESTAMP - INTERVAL '20 days'
),
(
    '00000000-0000-0000-0000-000000000002',
    'CREATE',
    'case',
    '10000000-0000-0000-0000-000000000001',
    null,
    '{"case_number": "CASE-2025-001", "status": "open", "priority": "high", "type": "legal_advice"}',
    '192.168.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    '00000000-0000-0000-0000-000000000003',
    'UPDATE',
    'case',
    '10000000-0000-0000-0000-000000000001',
    '{"status": "open"}',
    '{"status": "open", "assigned_to": "00000000-0000-0000-0000-000000000003"}',
    '192.168.1.12',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    '00000000-0000-0000-0000-000000000006',
    'CREATE',
    'document',
    '20000000-0000-0000-0000-000000000001',
    null,
    '{"filename": "employment_contract_draft.pdf", "case_id": "10000000-0000-0000-0000-000000000001", "type": "contract"}',
    '192.168.1.45',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    '00000000-0000-0000-0000-000000000002',
    'UPDATE',
    'case',
    '10000000-0000-0000-0000-000000000005',
    '{"status": "open"}',
    '{"status": "closed", "closed_by": "00000000-0000-0000-0000-000000000002", "closure_reason": "Successfully completed"}',
    '192.168.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    CURRENT_TIMESTAMP - INTERVAL '5 days'
);

-- Insert sample user sessions (for active users)
INSERT INTO security.user_sessions (user_id, session_token, refresh_token, expires_at, ip_address, user_agent, is_active, created_at)
VALUES 
(
    '00000000-0000-0000-0000-000000000002',
    'sess_' || uuid_generate_v4()::text,
    'refresh_' || uuid_generate_v4()::text,
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    '192.168.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    true,
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
),
(
    '00000000-0000-0000-0000-000000000003',
    'sess_' || uuid_generate_v4()::text,
    'refresh_' || uuid_generate_v4()::text,
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    '192.168.1.12',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    true,
    CURRENT_TIMESTAMP - INTERVAL '30 minutes'
);

-- Create a minimal test admin user in test database
\c case_management_test;

-- Clear any existing test data
TRUNCATE TABLE case_documents, case_notes, cases, users, audit.audit_logs, security.user_sessions RESTART IDENTITY CASCADE;

-- Insert minimal test admin user for integration tests
-- Password: testadmin123
INSERT INTO users (id, email, password, first_name, last_name, role, status, email_verified, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test-admin@casemanagement.dev',
    '$2a$10$pDi8nSMJNZJE4CQb1iVuL.21admWwGFQs7zgpi2bDObiOBnKVQ8l2',
    'Test',
    'Administrator',
    'admin',
    'active',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Insert a test client for testing client-related functionality
-- Password: testclient123
INSERT INTO users (id, email, password, first_name, last_name, role, status, email_verified, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'test-client@casemanagement.dev',
    '$2a$10$79ir4rYP0Ixr0BsUz9pmbeWII8BaKhHwa04hovhQRfZ/v4e1msNJS',
    'Test',
    'Client',
    'client',
    'active',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Show summary of inserted data
\c case_management_dev;

SELECT 
    'Development Database Summary' as info,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM cases) as total_cases,
    (SELECT COUNT(*) FROM case_notes) as total_case_notes,
    (SELECT COUNT(*) FROM case_documents) as total_documents,
    (SELECT COUNT(*) FROM audit.audit_logs) as total_audit_logs;

SELECT 
    'User Roles Distribution' as info,
    role,
    COUNT(*) as count
FROM users 
GROUP BY role 
ORDER BY role;

SELECT 
    'Case Status Distribution' as info,
    status,
    COUNT(*) as count
FROM cases 
GROUP BY status 
ORDER BY status;