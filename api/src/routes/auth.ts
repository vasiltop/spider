import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { setCookie } from 'hono/cookie';
import { sessions_table, users_table } from '../db/schema.js';
import { json_content, json_error } from './index.js';
import { createHash, scryptSync, randomBytes } from 'node:crypto';
import { auth_middleware, type Env } from '../middleware.js';

function generate_session_token() {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return Buffer.from(bytes).toString('base64url');
}

async function create_session(token: string, user_id: string) {
	const hash = createHash('sha256').update(token).digest('hex');

	const session = {
		id: hash,
		user_id,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
	};

	await db.insert(sessions_table).values(session);
	return session;
}

async function invalidate_session(token: string) {
	const hash = createHash('sha256').update(token).digest('hex');
	await db.delete(sessions_table).where(eq(sessions_table.id, hash));
}

const COOKIE_OPTS = {
	httpOnly: true,
	sameSite: 'Lax' as const,
	secure: process.env.NODE_ENV === 'production',
	path: '/',
	maxAge: 60 * 60 * 24 * 30,
};

const app = new OpenAPIHono<Env>();

export const register_route = createRoute({
	method: 'post',
	path: '/register',
	summary: 'Create a new user account and initialize a session',
	request: {
		body: {
			content: {
				'application/json': {
					schema: z.object({
						username: z.string().min(3).max(31).regex(/^[a-zA-Z0-9_]+$/, {
							message: 'Username can only contain letters, numbers, and underscores',
						}),
						password: z.string().min(8).max(255),
					}),
				},
			},
		},
	},
	responses: {
		201: json_content(
			z.object({
				message: z.string(),
				id: z.string(),
				username: z.string(),
				role: z.string()
			}),
			'Account created successfully and session cookie dropped'
		),
		400: json_error('Username already taken or invalid requirements'),
		500: json_error('Internal server error'),
	},
});

app.openapi(register_route, async (c) => {
	try {
		const { username, password } = c.req.valid('json');
		const salt = randomBytes(16).toString('hex');
		const derived_key = scryptSync(password, salt, 64).toString('hex');
		const password_hash = `${salt}:${derived_key}`;

		const [new_user] = await db
			.insert(users_table)
			.values({
				username,
				password_hash
			})
			.returning({
				id: users_table.id,
				username: users_table.username,
				role: users_table.role
			});

		const token = generate_session_token();
		await create_session(token, new_user.id);
		setCookie(c, 'session_token', token, COOKIE_OPTS);
		return c.json({
			message: 'Registration successful',
			id: new_user.id,
			username: new_user.username,
			role: new_user.role
		}, 201);
	} catch (e: any) {
		if (e.code === '23505') {
			return c.json({ error: 'Username is already taken' }, 400);
		}

		return c.json({ error: 'Internal server error' }, 500);
	}
});

export const login_route = createRoute({
	method: 'post',
	path: '/login',
	summary: 'Authenticate user credentials and initialize a session',
	request: {
		body: {
			content: {
				'application/json': {
					schema: z.object({
						username: z.string().min(1),
						password: z.string().min(1),
					}),
				},
			},
		},
	},
	responses: {
		200: json_content(
			z.object({
				message: z.string(),
				id: z.string(),
				username: z.string(),
				role: z.string()
			}),
			'Successfully authenticated and session cookie dropped'
		),
		401: json_error('Invalid username or password'),
		500: json_error('Internal server error'),
	},
});

app.openapi(login_route, async (c) => {
	try {
		const { username, password } = c.req.valid('json');

		const [user] = await db
			.select()
			.from(users_table)
			.where(eq(users_table.username, username));

		if (!user) {
			return c.json({ error: 'Invalid username or password' }, 401);
		}

		const [salt, stored_key] = user.password_hash.split(':');
		const verify_key = scryptSync(password, salt, 64).toString('hex');

		if (verify_key !== stored_key) {
			return c.json({ error: 'Invalid username or password' }, 401);
		}

		const token = generate_session_token();
		await create_session(token, user.id);
		setCookie(c, 'session_token', token, COOKIE_OPTS);

		return c.json({
			message: 'Logged in successfully',
			id: user.id,
			username: user.username,
			role: user.role
		}, 200);
	} catch (e) {
		return c.json({ error: 'Internal server error' }, 500);
	}
});

export const me_route = createRoute({
	method: 'get',
	path: '/me',
	summary: 'Fetch the authenticated user metadata from the current session context',
	middleware: [auth_middleware] as const,
	responses: {
		200: json_content(
			z.object({
				id: z.string(),
				username: z.string(),
				role: z.string(),
			}),
			'Active user metadata retrieved successfully'
		),
		401: json_error('Unauthorized - Missing, invalid, or expired session token'),
		500: json_error('Internal server error'),
	},
});

app.openapi(me_route, async (c) => {
	try {
		const user = c.get('user');

		return c.json({
			id: user.id,
			username: user.username,
			role: user.role,
		}, 200);
	} catch (e) {
		return c.json({ error: 'Internal server error' }, 500);
	}
});

export const logout_route = createRoute({
	method: 'post',
	path: '/logout',
	summary: 'Terminate active session and clear client cookie',
	responses: {
		200: json_content(
			z.object({ message: z.string() }),
			'Session successfully invalidated'
		),
		500: json_error('Internal server error'),
	},
});

app.openapi(logout_route, async (c) => {
	try {
		const token = c.req.header('cookie')?.split('session_token=')[1]?.split(';')[0];

		if (token) {
			await invalidate_session(token);
		}

		setCookie(c, 'session_token', '', { ...COOKIE_OPTS, maxAge: 0 });

		return c.json({ message: 'Logged out successfully' }, 200);
	} catch (e) {
		return c.json({ error: 'Internal server error' }, 500);
	}
});

export default app;
