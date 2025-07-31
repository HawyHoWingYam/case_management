#!/bin/bash

# Initialize LocalStack S3 buckets for Case Management System
# This script creates the necessary S3 buckets for development

echo "Initializing LocalStack S3 buckets..."

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to start..."
while ! curl -s http://localhost:4566/_localstack/health | grep -q '"s3": "available"'; do
    sleep 2
done

echo "LocalStack is ready. Creating S3 buckets..."

# Set AWS CLI to use LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Create main application bucket
awslocal s3 mb s3://case-management-dev
echo "Created bucket: case-management-dev"

# Create buckets for different purposes
awslocal s3 mb s3://case-management-documents
echo "Created bucket: case-management-documents"

awslocal s3 mb s3://case-management-uploads
echo "Created bucket: case-management-uploads"

awslocal s3 mb s3://case-management-exports
echo "Created bucket: case-management-exports"

awslocal s3 mb s3://case-management-backups
echo "Created bucket: case-management-backups"

# Set bucket policies for development (permissive for testing)
cat > /tmp/bucket-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::case-management-dev/*"
        }
    ]
}
EOF

awslocal s3api put-bucket-policy --bucket case-management-dev --policy file:///tmp/bucket-policy.json
echo "Applied bucket policy to case-management-dev"

# Enable versioning on important buckets
awslocal s3api put-bucket-versioning --bucket case-management-documents --versioning-configuration Status=Enabled
awslocal s3api put-bucket-versioning --bucket case-management-backups --versioning-configuration Status=Enabled
echo "Enabled versioning on document and backup buckets"

# Create CORS configuration for uploads
cat > /tmp/cors-config.json << 'EOF'
{
    "CORSRules": [
        {
            "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF

awslocal s3api put-bucket-cors --bucket case-management-uploads --cors-configuration file:///tmp/cors-config.json
echo "Applied CORS configuration to uploads bucket"

# List all buckets to verify creation
echo "Verifying bucket creation..."
awslocal s3 ls

# Create some sample directories/prefixes
awslocal s3api put-object --bucket case-management-documents --key "cases/" --content-length 0
awslocal s3api put-object --bucket case-management-documents --key "users/" --content-length 0
awslocal s3api put-object --bucket case-management-documents --key "reports/" --content-length 0

awslocal s3api put-object --bucket case-management-uploads --key "temp/" --content-length 0
awslocal s3api put-object --bucket case-management-uploads --key "processed/" --content-length 0

echo "Created directory structure in buckets"

# Create a test file
echo "This is a test file for Case Management System" > /tmp/test-file.txt
awslocal s3 cp /tmp/test-file.txt s3://case-management-dev/test-file.txt
echo "Uploaded test file"

echo "LocalStack S3 initialization completed successfully!"
echo ""
echo "Available buckets:"
echo "- case-management-dev (main application bucket)"
echo "- case-management-documents (case documents and files)"
echo "- case-management-uploads (temporary uploads)"
echo "- case-management-exports (report exports)"
echo "- case-management-backups (system backups)"
echo ""
echo "S3 endpoint: http://localhost:4566"
echo "Access Key: test"
echo "Secret Key: test"
echo "Region: us-east-1"