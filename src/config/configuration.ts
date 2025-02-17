import * as process from 'node:process';

export default () => ({
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  ACCESS_KEY: process.env.ACCESS_KEY,
  SECRET_KEY: process.env.SECRET_KEY,
  VENDOR_ID: process.env.VENDOR_ID,
  BASE_URL: process.env.BASE_URL,
});