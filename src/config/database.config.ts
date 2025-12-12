import { registerAs } from '@nestjs/config';
import { validateEnv } from './env.config';

export default registerAs('database', () => {
  const env = validateEnv();
  return {
    type: env.DB_TYPE,
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    synchronize: env.DB_SYNCHRONIZE,
  };
});
