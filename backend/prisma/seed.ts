import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  console.log('🌱 开始创建种子数据...');

  // 清理现有数据（可选）
  await prisma.caseLog.deleteMany();
  await prisma.case.deleteMany();
  await prisma.user.deleteMany();

  // 创建测试用户
  const users = [
    {
      username: 'admin',
      email: 'admin@example.com',
      password: await hashPassword('admin123'),
      role: UserRole.ADMIN,
      is_active: true,
    },
    {
      username: 'manager',
      email: 'manager@example.com',
      password: await hashPassword('manager123'),
      role: UserRole.MANAGER,
      is_active: true,
    },
    {
      username: 'user1',
      email: 'user1@example.com',
      password: await hashPassword('user123'),
      role: UserRole.USER,
      is_active: true,
    },
    {
      username: 'user2',
      email: 'user2@example.com',
      password: await hashPassword('user123'),
      role: UserRole.USER,
      is_active: true,
    },
    {
      username: 'clerk',
      email: 'clerk@example.com',
      password: await hashPassword('clerk123'),
      role: UserRole.USER, // 假设 Clerk 使用 USER 角色，您可能需要添加 CLERK 角色
      is_active: true,
    },
  ];

  console.log('👥 创建用户...');
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData,
    });
    console.log(`   ✅ 创建用户: ${user.username} (${user.email}) - 角色: ${user.role}`);
  }

  // 创建一些示例案例
  console.log('📄 创建示例案例...');
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  const managerUser = await prisma.user.findUnique({ where: { email: 'manager@example.com' } });

  if (adminUser && managerUser) {
    const cases = [
      {
        title: '系统登录问题排查',
        description: '用户反馈无法正常登录系统，需要排查原因并修复',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        created_by: adminUser.user_id,
        assigned_to: managerUser.user_id,
      },
      {
        title: '数据库性能优化',
        description: '数据库查询速度较慢，需要进行性能优化',
        status: 'PENDING' as const,
        priority: 'MEDIUM' as const,
        created_by: managerUser.user_id,
        assigned_to: adminUser.user_id,
      },
      {
        title: '用户权限配置',
        description: '新用户权限配置和角色分配',
        status: 'RESOLVED' as const,
        priority: 'LOW' as const,
        created_by: adminUser.user_id,
        assigned_to: managerUser.user_id,
      },
    ];

    for (const caseData of cases) {
      const case_ = await prisma.case.create({
        data: caseData,
      });
      console.log(`   ✅ 创建案例: ${case_.title} - 状态: ${case_.status}`);

      // 为每个案例创建日志
      await prisma.caseLog.create({
        data: {
          case_id: case_.case_id,
          user_id: caseData.created_by,
          action: 'CREATED',
          details: `案例 "${case_.title}" 已创建`,
        },
      });
    }
  }

  console.log('✨ 种子数据创建完成！');
  console.log('\n📋 测试账户信息:');
  console.log('管理员: admin@example.com / admin123');
  console.log('经理: manager@example.com / manager123');
  console.log('用户1: user1@example.com / user123');
  console.log('用户2: user2@example.com / user123');
  console.log('文员: clerk@example.com / clerk123');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });