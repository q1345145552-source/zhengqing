-- 正清系统 - 用户表迁移脚本
-- 运行方式: psql -U liuxiong -d zhengqing -f src/migrations/001_create_users.sql

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'employee', 'admin')),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disabled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 插入默认测试用户（密码均为对应用户名+123，使用 bcrypt 加密）
-- 注意：密码 hash 由后端 bcryptjs 生成，这里先用占位符
-- admin/admin123, employee/employee123, client/client123
-- 实际 hash 将在 seed 脚本中通过 Node.js 插入

-- 仅在表为空时插入
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        -- 以下密码 hash 对应: admin123, employee123, client123
        -- 由 bcryptjs 生成（salt rounds = 10）
        INSERT INTO users (username, password, role, email, status) VALUES
        ('admin',    '$2a$10$dummy_hash_will_be_replaced_by_seed', 'admin',    'admin@zhengqing.com',    'active'),
        ('employee', '$2a$10$dummy_hash_will_be_replaced_by_seed', 'employee', 'employee@zhengqing.com', 'active'),
        ('client',   '$2a$10$dummy_hash_will_be_replaced_by_seed', 'client',   'client@zhengqing.com',   'active');
    END IF;
END $$;
