import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.coerce.number().int().positive().default(3600),
  API_PORT: z.coerce.number().int().positive().default(3001),
  REALTIME_PORT: z.coerce.number().int().positive().default(3002),
  WEB_URL: z.string().url().default('http://localhost:5173'),
  SENTRY_DSN: z.string().url().optional(),
  ENABLE_RANKED: z.coerce.boolean().default(false),
  ENABLE_VOICE: z.coerce.boolean().default(false),
  ENABLE_ADVANCED_ROLES: z.coerce.boolean().default(false),
  ENABLE_COSMETICS: z.coerce.boolean().default(false),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const envVars = {
    NODE_ENV: process.env['NODE_ENV'],
    DATABASE_URL: process.env['DATABASE_URL'],
    SUPABASE_URL: process.env['SUPABASE_URL'],
    SUPABASE_ANON_KEY: process.env['SUPABASE_ANON_KEY'],
    SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY'],
    REDIS_URL: process.env['REDIS_URL'],
    JWT_SECRET: process.env['JWT_SECRET'],
    JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'],
    API_PORT: process.env['API_PORT'],
    REALTIME_PORT: process.env['REALTIME_PORT'],
    WEB_URL: process.env['WEB_URL'],
    SENTRY_DSN: process.env['SENTRY_DSN'],
    ENABLE_RANKED: process.env['ENABLE_RANKED'],
    ENABLE_VOICE: process.env['ENABLE_VOICE'],
    ENABLE_ADVANCED_ROLES: process.env['ENABLE_ADVANCED_ROLES'],
    ENABLE_COSMETICS: process.env['ENABLE_COSMETICS'],
  };
  const result = envSchema.safeParse(envVars);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Environment validation failed:\n${missing.join('\n')}`);
  }
  return result.data;
}

/**
 * Lazily validated environment.
 */
export const env = (() => {
  try {
    return validateEnv();
  } catch (e) {
    // In non-production contexts, provide safe development defaults
    if (process.env['NODE_ENV'] !== 'production') {
      return {
        NODE_ENV: (process.env['NODE_ENV'] as 'development' | 'test') ?? 'development',
        DATABASE_URL: process.env['DATABASE_URL'] ?? 'postgresql://localhost:5432/night_has_come',
        SUPABASE_URL: process.env['SUPABASE_URL'] ?? 'http://localhost:54321',
        SUPABASE_ANON_KEY: process.env['SUPABASE_ANON_KEY'] ?? 'dev-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? 'dev-service-role-key',
        REDIS_URL: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
        JWT_SECRET: process.env['JWT_SECRET'] ?? 'dev-secret-that-is-at-least-32-characters-long',
        JWT_EXPIRES_IN: Number(process.env['JWT_EXPIRES_IN']) || 3600,
        API_PORT: Number(process.env['API_PORT']) || 3001,
        REALTIME_PORT: Number(process.env['REALTIME_PORT']) || 3002,
        WEB_URL: process.env['WEB_URL'] ?? 'http://localhost:5173',
        ENABLE_RANKED: false,
        ENABLE_VOICE: false,
        ENABLE_ADVANCED_ROLES: false,
        ENABLE_COSMETICS: false,
      } as EnvConfig;
    }
    throw e;
  }
})();
