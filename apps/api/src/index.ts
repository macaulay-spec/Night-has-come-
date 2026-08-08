import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from '@night-has-come/config';
import { registerAuthRoutes } from './auth.js';
import { registerProfileRoutes } from './profile.js';

async function main() {
  const app = Fastify({
    logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
  });

  await app.register(cors, { origin: env.WEB_URL, credentials: true });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  app.get('/v1/health', async () => ({
    status: 'ok', version: '0.2.0', timestamp: new Date().toISOString(), environment: env.NODE_ENV,
  }));

  registerAuthRoutes(app);
  registerProfileRoutes(app);

  try {
    await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
    console.info(`API server listening on port ${env.API_PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
