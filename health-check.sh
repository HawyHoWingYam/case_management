#!/bin/bash

# Frontend and Backend Health Check Script
# 用于验证系统是否正常运行

echo "🚀 案例管理系统健康检查..."
echo "================================"

# 检查后端端口
echo "📡 检查后端服务 (端口 3001)..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ 后端服务正常运行"
    
    # 获取详细健康信息
    HEALTH_INFO=$(curl -s http://localhost:3001/api/health)
    echo "   状态: $(echo $HEALTH_INFO | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
    echo "   数据库: $(echo $HEALTH_INFO | grep -o '"database":{"status":"[^"]*"' | cut -d'"' -f6)"
    echo "   运行时间: $(echo $HEALTH_INFO | grep -o '"uptime":[0-9.]*' | cut -d':' -f2) 秒"
else
    echo "❌ 后端服务无法访问"
fi

echo ""

# 检查前端端口
echo "🎨 检查前端服务 (端口 3000 或 3002)..."
FRONTEND_PORT=""
if curl -s http://localhost:3000 > /dev/null; then
    FRONTEND_PORT="3000"
elif curl -s http://localhost:3002 > /dev/null; then
    FRONTEND_PORT="3002"
fi

if [ ! -z "$FRONTEND_PORT" ]; then
    echo "✅ 前端服务正常运行 (端口 $FRONTEND_PORT)"
else
    echo "❌ 前端服务无法访问"
fi

echo ""

# 检查 API 文档
echo "📚 检查 API 文档..."
if curl -s http://localhost:3001/api/docs > /dev/null; then
    echo "✅ API 文档可访问: http://localhost:3001/api/docs"
else
    echo "❌ API 文档无法访问"
fi

echo ""

# 显示服务地址
echo "🌐 服务地址:"
echo "   前端: http://localhost:${FRONTEND_PORT:-'未运行'}"
echo "   后端: http://localhost:3001"
echo "   API文档: http://localhost:3001/api/docs"

echo ""
echo "✨ 健康检查完成!"

# 添加调试信息提示
echo ""
echo "🔧 调试信息:"
echo "   查看后端日志: npm run start:dev (在 backend 目录)"
echo "   查看前端日志: npm run dev (在 frontend 目录)"
echo "   前端页面调试: 打开浏览器开发者工具查看控制台"
echo "   后端API测试: 使用 http://localhost:3001/api/docs"