-- Initialize Case Management Databases
-- This script creates the main development and test databases

-- Create development database if it doesn't exist
SELECT 'CREATE DATABASE case_management_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'case_management_dev')\gexec

-- Create test database if it doesn't exist
SELECT 'CREATE DATABASE case_management_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'case_management_test')\gexec

-- Connect to development database and create extensions
\c case_management_dev;

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create initial schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS security;

-- Connect to test database and create extensions
\c case_management_test;

-- Enable required PostgreSQL extensions for test database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create initial schemas for test database
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS security;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE case_management_dev TO postgres;
GRANT ALL PRIVILEGES ON DATABASE case_management_test TO postgres;