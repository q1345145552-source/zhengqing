require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'liuxiong',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'zhengqing',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'zhengqing-system-jwt-secret-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};
