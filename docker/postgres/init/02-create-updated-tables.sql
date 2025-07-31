-- Updated table structure for Case Management System
-- This script creates tables that match the TypeORM entities exactly

\c case_management_dev;

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS case_documents CASCADE;
DROP TABLE IF EXISTS case_notes CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS audit.audit_logs CASCADE;
DROP TABLE IF EXISTS security.user_sessions CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS case_status CASCADE;
DROP TYPE IF EXISTS case_priority CASCADE;
DROP TYPE IF EXISTS case_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS note_type CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;

-- Create updated enum types to match TypeORM entities
CREATE TYPE user_role AS ENUM ('admin', 'caseworker', 'supervisor', 'client');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE case_status AS ENUM ('open', 'in_progress', 'pending_review', 'closed', 'archived');
CREATE TYPE case_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE case_type AS ENUM ('consultation', 'legal_advice', 'representation', 'mediation', 'document_review', 'other');
CREATE TYPE document_type AS ENUM ('contract', 'correspondence', 'court_filing', 'evidence', 'id_document', 'financial', 'medical', 'other');
CREATE TYPE document_status AS ENUM ('pending_review', 'approved', 'rejected', 'archived');
CREATE TYPE note_type AS ENUM ('general', 'phone_call', 'meeting', 'email', 'court_appearance', 'document_review', 'follow_up', 'internal');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT');

-- Users table (matches TypeORM User entity)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    role user_role NOT NULL DEFAULT 'client',
    status user_status NOT NULL DEFAULT 'active',
    profile_image_url TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cases table (matches TypeORM Case entity)
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type case_type DEFAULT 'consultation',
    status case_status DEFAULT 'open',
    priority case_priority DEFAULT 'medium',
    client_id UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES users(id),
    closure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Case notes table (matches TypeORM CaseNote entity)
CREATE TABLE case_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    type note_type DEFAULT 'general',
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_confidential BOOLEAN DEFAULT false,
    is_billable BOOLEAN DEFAULT false,
    billable_hours DECIMAL(4,2),
    contact_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Case documents table (matches TypeORM CaseDocument entity)
CREATE TABLE case_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    type document_type DEFAULT 'other',
    status document_status DEFAULT 'pending_review',
    description VARCHAR(500),
    is_confidential BOOLEAN DEFAULT false,
    is_client_accessible BOOLEAN DEFAULT true,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    file_hash VARCHAR(64),
    version INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action audit_action NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for authentication
CREATE TABLE security.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create comprehensive indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email_verified ON users(email_verified);

CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_priority ON cases(priority);
CREATE INDEX idx_cases_type ON cases(type);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX idx_cases_created_by ON cases(created_by);
CREATE INDEX idx_cases_due_date ON cases(due_date);
CREATE INDEX idx_cases_created_at ON cases(created_at);

CREATE INDEX idx_case_notes_case_id ON case_notes(case_id);
CREATE INDEX idx_case_notes_author_id ON case_notes(author_id);
CREATE INDEX idx_case_notes_type ON case_notes(type);
CREATE INDEX idx_case_notes_is_confidential ON case_notes(is_confidential);
CREATE INDEX idx_case_notes_created_at ON case_notes(created_at);

CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_case_documents_uploaded_by ON case_documents(uploaded_by);
CREATE INDEX idx_case_documents_type ON case_documents(type);
CREATE INDEX idx_case_documents_status ON case_documents(status);
CREATE INDEX idx_case_documents_is_confidential ON case_documents(is_confidential);
CREATE INDEX idx_case_documents_created_at ON case_documents(created_at);

CREATE INDEX idx_audit_logs_user_id ON audit.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit.audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit.audit_logs(created_at);

CREATE INDEX idx_user_sessions_user_id ON security.user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON security.user_sessions(session_token);
CREATE INDEX idx_user_sessions_is_active ON security.user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON security.user_sessions(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_notes_updated_at BEFORE UPDATE ON case_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_documents_updated_at BEFORE UPDATE ON case_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

----------------------------
-- Apply the same structure to test database
----------------------------
\c case_management_test;

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS case_documents CASCADE;
DROP TABLE IF EXISTS case_notes CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS audit.audit_logs CASCADE;
DROP TABLE IF EXISTS security.user_sessions CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS case_status CASCADE;
DROP TYPE IF EXISTS case_priority CASCADE;
DROP TYPE IF EXISTS case_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS note_type CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;

-- Create updated enum types to match TypeORM entities
CREATE TYPE user_role AS ENUM ('admin', 'caseworker', 'supervisor', 'client');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE case_status AS ENUM ('open', 'in_progress', 'pending_review', 'closed', 'archived');
CREATE TYPE case_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE case_type AS ENUM ('consultation', 'legal_advice', 'representation', 'mediation', 'document_review', 'other');
CREATE TYPE document_type AS ENUM ('contract', 'correspondence', 'court_filing', 'evidence', 'id_document', 'financial', 'medical', 'other');
CREATE TYPE document_status AS ENUM ('pending_review', 'approved', 'rejected', 'archived');
CREATE TYPE note_type AS ENUM ('general', 'phone_call', 'meeting', 'email', 'court_appearance', 'document_review', 'follow_up', 'internal');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT');

-- Users table (matches TypeORM User entity)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    role user_role NOT NULL DEFAULT 'client',
    status user_status NOT NULL DEFAULT 'active',
    profile_image_url TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cases table (matches TypeORM Case entity)
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type case_type DEFAULT 'consultation',
    status case_status DEFAULT 'open',
    priority case_priority DEFAULT 'medium',
    client_id UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES users(id),
    closure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Case notes table (matches TypeORM CaseNote entity)
CREATE TABLE case_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    type note_type DEFAULT 'general',
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_confidential BOOLEAN DEFAULT false,
    is_billable BOOLEAN DEFAULT false,
    billable_hours DECIMAL(4,2),
    contact_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Case documents table (matches TypeORM CaseDocument entity)
CREATE TABLE case_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    type document_type DEFAULT 'other',
    status document_status DEFAULT 'pending_review',
    description VARCHAR(500),
    is_confidential BOOLEAN DEFAULT false,
    is_client_accessible BOOLEAN DEFAULT true,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    file_hash VARCHAR(64),
    version INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action audit_action NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for authentication
CREATE TABLE security.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create comprehensive indexes for performance (test database)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email_verified ON users(email_verified);

CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_priority ON cases(priority);
CREATE INDEX idx_cases_type ON cases(type);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX idx_cases_created_by ON cases(created_by);
CREATE INDEX idx_cases_due_date ON cases(due_date);
CREATE INDEX idx_cases_created_at ON cases(created_at);

CREATE INDEX idx_case_notes_case_id ON case_notes(case_id);
CREATE INDEX idx_case_notes_author_id ON case_notes(author_id);
CREATE INDEX idx_case_notes_type ON case_notes(type);
CREATE INDEX idx_case_notes_is_confidential ON case_notes(is_confidential);
CREATE INDEX idx_case_notes_created_at ON case_notes(created_at);

CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_case_documents_uploaded_by ON case_documents(uploaded_by);
CREATE INDEX idx_case_documents_type ON case_documents(type);
CREATE INDEX idx_case_documents_status ON case_documents(status);
CREATE INDEX idx_case_documents_is_confidential ON case_documents(is_confidential);
CREATE INDEX idx_case_documents_created_at ON case_documents(created_at);

CREATE INDEX idx_audit_logs_user_id ON audit.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit.audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit.audit_logs(created_at);

CREATE INDEX idx_user_sessions_user_id ON security.user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON security.user_sessions(session_token);
CREATE INDEX idx_user_sessions_is_active ON security.user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON security.user_sessions(expires_at);

-- Create updated_at trigger function for test database
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers for test database
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_notes_updated_at BEFORE UPDATE ON case_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_documents_updated_at BEFORE UPDATE ON case_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();