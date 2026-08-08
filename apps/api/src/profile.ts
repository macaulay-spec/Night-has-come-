import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '@night-has-come/database';
import { users, playerStatistics } from '@night-has-come/database/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from './auth.js';

export function registerProfileRoutes(app: FastifyInstance) {
  app.get('/v1/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = await authCheck(request, reply);
    if (!auth) return;

    const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!user) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found' } });

    const [stats] = await db.select().from(playerStatistics).where(eq(playerStatistics.userId, auth.userId)).limit(1);

    return {
      data: {
        userId: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl,
        bio: user.bio, xp: user.xp, level: user.level, fairPlayScore: user.fairPlayScore,
        stats: stats ?? null, createdAt: user.createdAt,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  app.patch('/v1/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = await authCheck(request, reply);
    if (!auth) return;

    const schema = z.object({
      displayName: z.string().min(1).max(32).optional(),
      avatarUrl: z.string().url().optional(),
      bio: z.string().max(200).optional(),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: { code: 'INVALID_INPUT', message: parsed.error.message } });

    await db.update(users).set({ ...parsed.data, updatedAt: new Date() }).where(eq(users.id, auth.userId));
    return { data: { success: true }, meta: { timestamp: new Date().toISOString() } };
  });
}

async function authCheck(request: FastifyRequest, reply: FastifyReply): Promise<{ userId: string } | null> {
  const ah = request.headers['authorization'];
  if (!ah?.startsWith('Bearer ')) {
    reply.status(401).send({ error: { code: 'AUTH_REQUIRED', message: 'Missing token' } });
    return null;
  }
  try {
    const p = verifyToken(ah.slice(7));
    return { userId: p.sub };
  } catch {
    reply.status(401).send({ error: { code: 'AUTH_REQUIRED', message: 'Invalid token' } });
    return null;
  }
}
