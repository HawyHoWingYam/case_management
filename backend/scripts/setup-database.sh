#!/bin/bash

# Database setup script for Case Management System
# This script initializes the PostgreSQL database with schema, constraints, and seed data

set -e

echo "🚀 Setting up Case Management System database..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please copy .env.example to .env and configure DATABASE_URL"
    exit 1
fi

# Load environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env file"
    exit 1
fi

echo "✅ Environment configuration loaded"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🏗️  Running database migrations..."
npx prisma migrate dev --name init

# Apply database constraints
echo "🔒 Applying database constraints and indexes..."
if command -v psql &> /dev/null; then
    # Extract database connection details from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    
    echo "📋 Applying constraints to database: $DB_NAME"
    PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p') psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f prisma/constraints.sql
else
    echo "⚠️  psql not found. Please manually apply prisma/constraints.sql to your database"
fi

# Seed the database
echo "🌱 Seeding database with demo data..."
npm run seed

# Refresh materialized views
echo "📊 Refreshing materialized views..."
if command -v psql &> /dev/null; then
    PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p') psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT refresh_case_statistics();"
else
    echo "⚠️  psql not found. Please manually refresh materialized views"
fi

echo "✅ Database setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Start the backend server: npm run start:dev"
echo "   2. View database in Prisma Studio: npm run prisma:studio"
echo "   3. Test API endpoints with the seeded demo data"
echo ""
echo "👥 Demo users created:"
echo "   - clerk@example.com (password: password123)"
echo "   - chair@example.com (password: password123)" 
echo "   - caseworker1@example.com (password: password123)"
echo "   - caseworker2@example.com (password: password123)"