import bcrypt from 'bcryptjs';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const ALLOWED_USERS = new Set(['irving', 'viridiana']);

export async function createSession(cookies: any, userId: number) {
	cookies.set('session', userId.toString(), {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 30 // 30 days
	});
}

export async function getUser(cookies: any) {
	const session = cookies.get('session');
	if (!session) return null;
	
	const userId = parseInt(session);
	if (isNaN(userId)) return null;

	const [user] = await db.select().from(users).where(eq(users.id, userId));
	if (user && !ALLOWED_USERS.has(user.username.toLowerCase())) return null;
	return user || null;
}

export function logout(cookies: any) {
	cookies.delete('session', { path: '/' });
}
