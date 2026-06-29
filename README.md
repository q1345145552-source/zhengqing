# 正清系统 - 物流清关管理平台

服务从中国到泰国的散货清关业务。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Element Plus + Pinia + Vue Router |
| 后端 | Express.js (Node.js) |
| 数据库 | PostgreSQL |
| 认证 | JWT (JSON Web Token) |

## 项目结构

```
正清系统/
├── backend/          # 后端代码
│   └── src/
│       ├── config/   # 配置
│       ├── db/       # 数据库连接
│       ├── middleware/# 中间件
│       ├── models/   # 数据模型
│       ├── routes/   # 路由
│       ├── controllers/ # 控制器
│       └── migrations/  # 数据库迁移
├── frontend/         # 前端代码
│   └── src/
│       ├── api/      # API 请求层
│       ├── layouts/  # 三套布局
│       ├── router/   # 路由配置
│       ├── stores/   # Pinia 状态
│       ├── views/    # 页面组件
│       └── utils/    # 工具函数
```

## 快速开始

### 1. 初始化数据库

```bash
cd backend
npm run db:seed
```

### 2. 启动后端

```bash
cd backend
npm run dev
```

后端运行在 http://localhost:3001

### 3. 启动前端

```bash
cd frontend
npm run dev
```

前端运行在 http://localhost:5173

### 4. 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 员工 | employee | employee123 |
| 客户 | client | client123 |

## API 接口

### 认证

- `POST /api/auth/login` - 用户登录
  - Body: `{ "username": "admin", "password": "admin123" }`
- `GET /api/auth/me` - 获取当前用户信息
  - Header: `Authorization: Bearer <token>`

### 健康检查

- `GET /api/health` - 服务健康检查
