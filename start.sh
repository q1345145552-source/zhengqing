#!/bin/sh
# 正清系统启动脚本

echo [启动] 后端服务...
cd /app/backend
nohup node src/app.js > /app/backend/app.log 2>&1 &
echo [启动] 后端 PID: 

echo [启动] 前端预览服务...
cd /app/frontend
nohup npx vite preview --host 0.0.0.0 --port 5173 > /app/frontend/preview.log 2>&1 &
echo [启动] 前端 PID: 

echo [完成] 正清系统已启动
echo  后端: http://localhost:3001
echo  前端: http://localhost:5173

# Keep container alive
tail -f /dev/null
