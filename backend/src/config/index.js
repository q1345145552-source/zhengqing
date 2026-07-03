require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_DATABASE || 'zhengqing',
  },

  jwt: {
    secret: process.env.JWT_SECRET || undefined,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cors: {
    origins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
      : ['http://localhost:5173', 'http://localhost:4173'],
  },
};
