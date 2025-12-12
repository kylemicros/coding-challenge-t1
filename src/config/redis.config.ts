import { registerAs } from '@nestjs/config';
import { validateEnv } from './env.config';

export default registerAs('redis', () => {
  const env = validateEnv();
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    ttl: env.CACHE_TTL,
  };
});
