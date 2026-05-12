import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createSession } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

const ALLOWED_USERS = new Set(['irving', 'viridiana']);

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = (data.get('username') as string).trim().toLowerCase();
		const password = data.get('password') as string;

		if (!username || !password) {
			return fail(400, { message: 'Faltan campos' });
		}

		if (!ALLOWED_USERS.has(username)) {
			return fail(400, { message: 'Solo pueden entrar irving y viridiana' });
		}

		const [user] = await db.select().from(users).where(eq(users.username, username));

		if (!user) {
			return fail(400, { message: 'Usuario no encontrado' });
		}

		const valid = await bcrypt.compare(password, user.passwordHash);

		if (!valid) {
			return fail(400, { message: 'Contraseña incorrecta' });
		}

		await createSession(cookies, user.id);

		throw redirect(303, '/');
	}
};
