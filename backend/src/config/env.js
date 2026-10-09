require('dotenv').config();
module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  dbFile: process.env.DB_FILE || './data/app.db',
};
