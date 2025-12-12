import { registerAs } from '@nestjs/config';
import { validateEnv } from './env.config';

export default registerAs('app', () => {
  const env = validateEnv();
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
  };
});
