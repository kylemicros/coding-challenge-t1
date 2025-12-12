import { z } from 'zod';

export const EnvSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DB_TYPE: z.string().default('mysql'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USERNAME: z.string().default('root'),
  DB_PASSWORD: z.string().default('root'),
  DB_DATABASE: z.string().default('user_management'),
  DB_SYNCHRONIZE: z.coerce.boolean().default(false),

  // Redis Cache
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  CACHE_TTL: z.coerce.number().int().positive().default(300000), // 5 minutes in ms
});

export type EnvConfig = z.infer<typeof EnvSchema>;

/**
 * Validates environment variables at startup
 * @throws ZodError if validation fails
 */
export function validateEnv(): EnvConfig {
  return EnvSchema.parse(process.env);
}
