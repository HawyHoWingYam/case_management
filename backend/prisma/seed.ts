import { PrismaClient, UserRole, CaseStatus, Priority } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create demo users for each role
  const clerk = await prisma.user.upsert({
    where: { email: 'clerk@example.com' },
    update: {},
    create: {
      email: 'clerk@example.com',
      firstName: 'John',
      lastName: 'Clerk',
      role: UserRole.CLERK,
      password: hashedPassword,
      isActive: true,
    },
  });

  const chair = await prisma.user.upsert({
    where: { email: 'chair@example.com' },
    update: {},
    create: {
      email: 'chair@example.com',
      firstName: 'Jane',
      lastName: 'Chair',
      role: UserRole.CHAIR,
      password: hashedPassword,
      isActive: true,
    },
  });

  const caseworker1 = await prisma.user.upsert({
    where: { email: 'caseworker1@example.com' },
    update: {},
    create: {
      email: 'caseworker1@example.com',
      firstName: 'Bob',
      lastName: 'Caseworker',
      role: UserRole.CASEWORKER,
      password: hashedPassword,
      isActive: true,
    },
  });

  const caseworker2 = await prisma.user.upsert({
    where: { email: 'caseworker2@example.com' },
    update: {},
    create: {
      email: 'caseworker2@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      role: UserRole.CASEWORKER,
      password: hashedPassword,
      isActive: true,
    },
  });

  console.log('✅ Demo users created:');
  console.log(`   Clerk: ${clerk.email} (${clerk.firstName} ${clerk.lastName})`);
  console.log(`   Chair: ${chair.email} (${chair.firstName} ${chair.lastName})`);
  console.log(`   Caseworker 1: ${caseworker1.email} (${caseworker1.firstName} ${caseworker1.lastName})`);
  console.log(`   Caseworker 2: ${caseworker2.email} (${caseworker2.firstName} ${caseworker2.lastName})`);
  console.log('   Password for all: password123');

  // Create sample cases in different workflow stages
  const cases = [
    {
      title: 'New Employee Onboarding Issue',
      description: 'New employee needs help with system access and orientation materials.',
      status: CaseStatus.NEW,
      priority: Priority.MEDIUM,
      createdBy: clerk.id,
    },
    {
      title: 'Urgent IT Equipment Request',
      description: 'Department manager needs replacement laptop for critical project deadline.',
      status: CaseStatus.PENDING_REVIEW,
      priority: Priority.URGENT,
      createdBy: clerk.id,
    },
    {
      title: 'Office Space Allocation',
      description: 'Team expansion requires additional workspace configuration.',
      status: CaseStatus.ASSIGNED,
      priority: Priority.HIGH,
      createdBy: clerk.id,
      assignedTo: caseworker1.id,
    },
    {
      title: 'Software License Renewal',
      description: 'Annual software licenses need renewal for compliance.',
      status: CaseStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      createdBy: clerk.id,
      assignedTo: caseworker2.id,
    },
    {
      title: 'Training Program Setup',
      description: 'New employee training program implementation.',
      status: CaseStatus.PENDING_COMPLETION,
      priority: Priority.LOW,
      createdBy: clerk.id,
      assignedTo: caseworker1.id,
    },
    {
      title: 'Completed Security Audit',
      description: 'Quarterly security audit and compliance review.',
      status: CaseStatus.COMPLETED,
      priority: Priority.HIGH,
      createdBy: clerk.id,
      assignedTo: caseworker2.id,
    },
  ];

  console.log('🔄 Creating sample cases...');
  const createdCases = [];
  
  for (const caseData of cases) {
    const createdCase = await prisma.case.create({
      data: caseData,
    });
    createdCases.push(createdCase);

    // Create initial audit log entry for case creation
    await prisma.case_Log.create({
      data: {
        caseId: createdCase.id,
        userId: caseData.createdBy,
        action: 'created',
        details: {
          message: 'Case created during Phase 0 seed data generation',
          initialStatus: caseData.status,
          priority: caseData.priority,
        },
      },
    });

    // Add assignment log if case is assigned
    if (caseData.assignedTo) {
      await prisma.case_Log.create({
        data: {
          caseId: createdCase.id,
          userId: chair.id, // Chair would typically assign cases
          action: 'assigned',
          details: {
            message: 'Case assigned during Phase 0 seed data generation',
            assignedTo: caseData.assignedTo,
            previousStatus: 'PENDING_REVIEW',
            newStatus: caseData.status,
          },
        },
      });
    }

    // Add status change logs for advanced workflow states
    if (caseData.status === CaseStatus.IN_PROGRESS) {
      await prisma.case_Log.create({
        data: {
          caseId: createdCase.id,
          userId: caseData.assignedTo!,
          action: 'status_changed',
          details: {
            message: 'Caseworker started working on case',
            previousStatus: 'ASSIGNED',
            newStatus: 'IN_PROGRESS',
          },
        },
      });
    }

    if (caseData.status === CaseStatus.PENDING_COMPLETION) {
      await prisma.case_Log.create({
        data: {
          caseId: createdCase.id,
          userId: caseData.assignedTo!,
          action: 'status_changed',
          details: {
            message: 'Caseworker requested completion review',
            previousStatus: 'IN_PROGRESS',
            newStatus: 'PENDING_COMPLETION',
          },
        },
      });
    }

    if (caseData.status === CaseStatus.COMPLETED) {
      await prisma.case_Log.create({
        data: {
          caseId: createdCase.id,
          userId: chair.id,
          action: 'status_changed',
          details: {
            message: 'Chair approved case completion',
            previousStatus: 'PENDING_COMPLETION',
            newStatus: 'COMPLETED',
          },
        },
      });
    }
  }

  // Create sample documents for some cases
  console.log('📄 Creating sample case documents...');
  const sampleDocuments = [
    {
      caseId: createdCases[2].id, // Office Space Allocation case
      filename: 'floor_plan_v2.pdf',
      s3Key: 'case-documents/floor_plan_v2_abc123.pdf',
      mimeType: 'application/pdf',
      fileSize: 2048576, // 2MB
      uploadedBy: caseworker1.id,
    },
    {
      caseId: createdCases[3].id, // Software License Renewal case
      filename: 'license_agreement.docx',
      s3Key: 'case-documents/license_agreement_def456.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 512000, // 500KB
      uploadedBy: caseworker2.id,
    },
    {
      caseId: createdCases[5].id, // Completed Security Audit case
      filename: 'security_audit_report.pdf',
      s3Key: 'case-documents/security_audit_report_ghi789.pdf',
      mimeType: 'application/pdf',
      fileSize: 4194304, // 4MB
      uploadedBy: caseworker2.id,
    },
  ];

  for (const docData of sampleDocuments) {
    await prisma.case_Document.create({
      data: docData,
    });

    // Log document upload activity
    await prisma.case_Log.create({
      data: {
        caseId: docData.caseId,
        userId: docData.uploadedBy,
        action: 'document_uploaded',
        details: {
          message: 'Document uploaded to case',
          filename: docData.filename,
          fileSize: docData.fileSize,
          mimeType: docData.mimeType,
        },
      },
    });
  }

  console.log('✅ Sample cases created:');
  createdCases.forEach((case_item, index) => {
    console.log(`   ${index + 1}. ${case_item.title} (${case_item.status})`);
  });

  console.log('✅ Sample documents created:');
  sampleDocuments.forEach((doc, index) => {
    console.log(`   ${index + 1}. ${doc.filename} (${doc.mimeType})`);
  });

  // Display summary statistics
  const totalUsers = await prisma.user.count();
  const totalCases = await prisma.case.count();
  const totalLogs = await prisma.case_Log.count();
  const totalDocuments = await prisma.case_Document.count();

  console.log('\n📊 Database Summary:');
  console.log(`   Users: ${totalUsers}`);
  console.log(`   Cases: ${totalCases}`);
  console.log(`   Audit Logs: ${totalLogs}`);
  console.log(`   Documents: ${totalDocuments}`);

  console.log('\n🌱 Database seeding completed successfully!');
  console.log('🔗 You can now test the complete case management workflow with realistic data.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });