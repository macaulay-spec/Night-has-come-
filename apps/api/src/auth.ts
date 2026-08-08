import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '@night-has-come/config';
import { db } from '@night-has-come/database';
import { users, sessions } from '@night-has-come/database/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

// ─── JWT Helpers ────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string; // userId
  email: string | null;
  sessionId: string;
  iat: number;
  exp: number;
}

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

// ─── Auth Schemas ───────────────────────────────────────────────────

const SignUpSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().min(1).max(32),
  password: z.string().min(8).max(128).optional(),
});

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Auth Routes ────────────────────────────────────────────────────

export async function registerAuthRoutes(app: FastifyInstance) {
  // Sign up
  app.post('/v1/auth/signup', async (request, reply) => {
    const parseResult = SignUpSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: parseResult.error.message },
      });
    }

    const { email, displayName, password } = parseResult.data;

    // Check if user exists
    if (email) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing.length > 0) {
        return reply.status(409).send({
          error: { code: 'EMAIL_TAKEN', message: 'Email already registered' },
        });
      }
    }

    // Hash password
    const passwordHash = password ? hashPassword(password) : null;

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email: email ?? null,
        displayName,
        settings: passwordHash ? { passwordHash } : {},
      })
      .returning();

    if (!user) {
      return reply.status(500).send({
        error: { code: 'SERVER_ERROR', message: 'Failed to create user' },
      });
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const token = signToken({
      sub: user.id,
      email: user.email,
      sessionId,
    });

    const expiresAt = new Date(Date.now() + env.JWT_EXPIRES_IN * 1000);
    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
      ipAddress: request.ip,
    });

    return reply.status(201).send({
      data: {
        userId: user.id,
        displayName: user.displayName,
        email: user.email,
        token,
        expiresAt: expiresAt.toISOString(),
      },
      meta: { timestamp: new Date().toISOString() },
    });
  });

  // Sign in
  app.post('/v1/auth/signin', async (request, reply) => {
    const parseResult = SignInSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: parseResult.error.message },
      });
    }

    const { email, password } = parseResult.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return reply.status(401).send({
        error: { code: 'AUTH_REQUIRED', message: 'Invalid credentials' },
      });
    }

    // Check password
    const userSettings = user.settings as Record<string, unknown> | null;
    const storedHash = (userSettings?.['passwordHash'] as string) ?? null;
    if (!storedHash || !verifyPassword(password, storedHash)) {
      return reply.status(401).send({
        error: { code: 'AUTH_REQUIRED', message: 'Invalid credentials' },
      });
    }

    // Check ban status
    if (user.status === 'banned') {
      return reply.status(403).send({
        error: { code: 'MODERATION_BLOCKED', message: 'Account is banned' },
      });
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const token = signToken({
      sub: user.id,
      email: user.email,
      sessionId,
    });

    const expiresAt = new Date(Date.now() + env.JWT_EXPIRES_IN * 1000);
    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
      ipAddress: request.ip,
    });

    return {
      data: {
        userId: user.id,
        displayName: user.displayName,
        email: user.email,
        token,
        expiresAt: expiresAt.toISOString(),
      },
      meta: { timestamp: new Date().toISOString() },
    };
  });

  // Get session
  app.get('/v1/auth/session', async (request, reply) => {
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: { code: 'AUTH_REQUIRED', message: 'Missing token' },
      });
    }

    try {
      const token = authHeader.slice(7);
      const payload = verifyToken(token);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      if (!user) {
        return reply.status(401).send({
          error: { code: 'AUTH_REQUIRED', message: 'User not found' },
        });
      }

      return {
        data: {
          userId: user.id,
          email: user.email,
          displayName: user.displayName,
          isBanned: user.status === 'banned',
          createdAt: user.createdAt,
        },
        meta: { timestamp: new Date().toISOString() },
      };
    } catch {
      return reply.status(401).send({
        error: { code: 'AUTH_REQUIRED', message: 'Invalid token' },
      });
    }
  });

  // Sign out
  app.post('/v1/auth/signout', async (request, reply) => {
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = verifyToken(authHeader.slice(7));
        await db
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(eq(sessions.token, authHeader.slice(7)));
      } catch {
        // Token already expired, fine
      }
    }

    return { data: { success: true }, meta: { timestamp: new Date().toISOString() } };
  });
}

// ─── Auth Middleware ─────────────────────────────────────────────────

export async function authMiddleware(
  request: { headers: Record<string, string | undefined> },
  reply: { status: (code: number) => { send: (body: unknown) => void } },
) {
  const authHeader = request.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
    });
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    // Check session not revoked
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), eq(sessions.userId, payload.sub)))
      .limit(1);

    if (!session || session.revokedAt) {
      return reply.status(401).send({
        error: { code: 'AUTH_REQUIRED', message: 'Session revoked' },
      });
    }

    // Check user not banned
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || user.status === 'banned') {
      return reply.status(403).send({
        error: { code: 'MODERATION_BLOCKED', message: 'Account banned' },
      });
    }

    return { userId: payload.sub, sessionId: payload.sessionId };
  } catch {
    return reply.status(401).send({
      error: { code: 'AUTH_REQUIRED', message: 'Invalid or expired token' },
    });
  }
}

// ─── Password Hashing ───────────────────────────────────────────────

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const computed = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  return hash === computed;
}
