/**
 * 数据库初始化脚本
 * 1. 创建数据库（如不存在）
 * 2. 创建 users 表
 * 3. 插入默认测试用户（使用 bcrypt 加密密码）
 *
 * 运行: node src/db/seed.js
 */
require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const config = require('../config');

async function seed() {
  // Step 1: 连接到 postgres 默认数据库，创建 zhengqing 数据库
  const adminClient = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    const exists = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.db.database]
    );
    if (exists.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${config.db.database}"`);
      console.log(`[Seed] 数据库 ${config.db.database} 创建成功`);
    } else {
      console.log(`[Seed] 数据库 ${config.db.database} 已存在`);
    }
    await adminClient.end();
  } catch (err) {
    console.error('[Seed] 创建数据库失败:', err.message);
    await adminClient.end();
    process.exit(1);
  }

  // Step 2: 连接到 zhengqing 数据库，创建表
  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  try {
    await client.connect();
    console.log('[Seed] 已连接到 zhengqing 数据库');

    // 创建 users 表
    const createTableSQL = `
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
    `;
    await client.query(createTableSQL);
    console.log('[Seed] users 表创建成功');

    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
    console.log('[Seed] 索引创建成功');

    // Step 3: 检查是否已有数据，没有则插入测试用户
    const count = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(count.rows[0].count) === 0) {
      // 生成 bcrypt 密码 hash
      const salt = await bcrypt.genSalt(10);
      const adminHash = await bcrypt.hash('admin123', salt);
      const employeeHash = await bcrypt.hash('employee123', salt);
      const clientHash = await bcrypt.hash('client123', salt);

      await client.query(
        `INSERT INTO users (username, password, role, email, status) VALUES
         ($1, $2, 'admin',    'admin@zhengqing.com',    'active'),
         ($3, $4, 'employee', 'employee@zhengqing.com', 'active'),
         ($5, $6, 'client',   'client@zhengqing.com',   'active')`,
        ['admin', adminHash, 'employee', employeeHash, 'client', clientHash]
      );
      console.log('[Seed] 测试用户插入成功');
      console.log('  - admin    / admin123    (管理员)');
      console.log('  - employee / employee123 (员工)');
      console.log('  - client   / client123   (客户)');
    } else {
      console.log('[Seed] 用户数据已存在，跳过插入');
    }

    console.log('[Seed] 数据库初始化完成!');
    await client.end();
  } catch (err) {
    console.error('[Seed] 初始化失败:', err.message);
    await client.end();
    process.exit(1);
  }
}

seed();
