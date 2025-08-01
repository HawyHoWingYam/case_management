// compatibility-check.js
// 运行此脚本检查数据模型兼容性

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseSchema() {
  try {
    console.log('🔍 检查数据库模式...\n');

    // 检查用户表
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
      }
    });
    console.log('✅ 用户表结构:', Object.keys(users[0] || {}));

    // 检查案件表
    const cases = await prisma.case.findMany({
      take: 1,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        created_by_id: true,
        created_at: true,
      }
    });
    console.log('✅ 案件表结构:', Object.keys(cases[0] || {}));

    // 检查案件日志表
    const logs = await prisma.caseLog.findMany({
      take: 1,
      select: {
        id: true,
        case_id: true,
        user_id: true,
        action: true,
        created_at: true,
      }
    });
    console.log('✅ 案件日志表结构:', Object.keys(logs[0] || {}));

    console.log('\n📊 数据统计:');
    console.log(`- 用户数量: ${await prisma.user.count()}`);
    console.log(`- 案件数量: ${await prisma.case.count()}`);
    console.log(`- 日志数量: ${await prisma.caseLog.count()}`);

  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error.message);
    
    if (error.message.includes('Unknown arg')) {
      console.log('\n⚠️  可能的问题: API代码与数据库模式不匹配');
      console.log('请检查以下内容:');
      console.log('1. Prisma schema 定义');
      console.log('2. API 中使用的字段名');
      console.log('3. 数据类型匹配');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseSchema();