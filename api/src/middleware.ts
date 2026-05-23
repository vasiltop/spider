import { createMiddleware } from 'hono/factory';
import { getCookie, deleteCookie } from 'hono/cookie';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { sessions_table, users_table } from './db/schema.js';

export type Env = {
  Variables: {
    user: typeof users_table.$inferSelect;
    session: typeof sessions_table.$inferSelect;
  };
};

export const auth_middleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, 'session_token');
	console.log(token);
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const hash = createHash('sha256').update(token).digest('hex');
    
  const res = await db
    .select({ user: users_table, session: sessions_table })
    .from(sessions_table)
    .innerJoin(users_table, eq(sessions_table.user_id, users_table.id))
    .where(eq(sessions_table.id, hash));

  if (res.length === 0) {
    deleteCookie(c, 'session_token', { path: '/' });
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { user, session } = res[0];

  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessions_table).where(eq(sessions_table.id, hash));
    deleteCookie(c, 'session_token', { path: '/' });
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db
      .update(sessions_table)
      .set({ expiresAt: session.expiresAt })
      .where(eq(sessions_table.id, hash));
  }

  c.set('user', user);
  c.set('session', session);

  await next();
});

export const admin_middleware = createMiddleware(async (c, next) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (user.role !== 'admin') {
    return c.json({ error: 'Forbidden - Admin access required' }, 403);
  }

  await next();
});
