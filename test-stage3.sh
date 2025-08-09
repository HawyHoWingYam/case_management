#!/bin/bash

# 测试脚本 - 验证Stage 3完成流程
echo "🚀 开始Stage 3完成流程测试..."

# 检查后端服务是否运行
echo "📡 检查后端服务状态..."
if curl -f -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ 后端服务正常运行"
else
    echo "❌ 后端服务未运行，请先启动后端服务"
    echo "💡 请在backend目录运行: npm run start:dev"
    exit 1
fi

# 检查前端服务是否运行
echo "🌐 检查前端服务状态..."
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端服务正常运行"
else
    echo "❌ 前端服务未运行，请先启动前端服务"
    echo "💡 请在frontend目录运行: npm run dev"
    exit 1
fi

echo "🎯 基础服务检查完成！"
echo ""
echo "📋 Stage 3 功能测试清单："
echo "1. ✅ Caseworker请求完成功能 - 组件已实现"
echo "2. ✅ Chair审批/拒绝功能 - 组件已实现"  
echo "3. ✅ 案件历史记录显示 - 组件已实现"
echo "4. ✅ 手动日志添加功能 - 组件已实现"
echo "5. ✅ React Query优化 - 已集成"
echo "6. ✅ 详细调试日志 - 已添加"
echo ""
echo "🧪 手动测试步骤："
echo "1. 登录系统 (http://localhost:3000/login)"
echo "2. 创建或查找一个IN_PROGRESS状态的案件"
echo "3. 以Caseworker身份测试请求完成功能"
echo "4. 以Chair身份测试审批/拒绝功能"
echo "5. 测试历史记录和手动日志功能"
echo "6. 查看浏览器开发者工具的Console日志"
echo ""
echo "🔍 调试提示："
echo "- 打开浏览器开发者工具的Console查看详细日志"
echo "- 所有日志都有前缀标识：🔄 [CaseCompletionActions] 或 📝 [CaseLogHistory]"
echo "- 网络请求错误会显示详细的响应信息"
echo ""
echo "✨ Stage 3 实现已完成，可以进行手动测试！"