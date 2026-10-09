import 'dotenv/config';

export const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'Cesar cambia esto dsp',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '8h'
};