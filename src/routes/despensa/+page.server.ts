import { db } from '$lib/server/db';
import { groceryItems } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const items = await db
		.select()
		.from(groceryItems)
		.orderBy(desc(groceryItems.purchased), desc(groceryItems.createdAt));

	return { items };
};

export const actions: Actions = {
	addItem: async ({ request, locals }) => {
		const user = locals.user!;
		const data = await request.formData();
		const name = (data.get('name') as string).trim();

		if (!name) {
			return fail(400, { message: 'El nombre es obligatorio' });
		}

		await db.insert(groceryItems).values({
			name,
			createdBy: user.id
		});

		return { success: true };
	},

	togglePurchased: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id') as string);
		const purchased = parseInt(data.get('purchased') as string);

		if (isNaN(id)) {
			return fail(400, { message: 'ID inválido' });
		}

		await db
			.update(groceryItems)
			.set({ purchased: purchased ? 1 : 0 })
			.where(eq(groceryItems.id, id));

		return { success: true };
	},

	deleteItem: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id') as string);

		if (!isNaN(id)) {
			await db.delete(groceryItems).where(eq(groceryItems.id, id));
		}

		return { success: true };
	},

	clearPurchased: async () => {
		await db.delete(groceryItems).where(eq(groceryItems.purchased, 1));
		return { success: true };
	},

	logout: async ({ cookies }) => {
		cookies.delete('session', { path: '/' });
		throw redirect(303, '/login');
	}
};
