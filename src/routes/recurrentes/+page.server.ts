import { db } from '$lib/server/db';
import { expenses, recurringExpenses, users } from '$lib/server/db/schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { format } from 'date-fns';
import type { PageServerLoad, Actions } from './$types';

const DEFAULT_COLOR = '#3b82f6';
const ALLOWED_COLORS = new Set([
	'#3b82f6',
	'#22c55e',
	'#f97316',
	'#eab308',
	'#ec4899',
	'#a855f7',
	'#14b8a6',
	'#ef4444'
]);

function getQuincenaRange(): { start: string; end: string } {
	const now = new Date();
	const day = now.getDate();
	const year = now.getFullYear();
	const month = now.getMonth();

	const start = day <= 15 ? new Date(year, month, 1) : new Date(year, month, 16);
	const end = day <= 15 ? new Date(year, month, 15) : new Date(year, month + 1, 0);

	return {
		start: format(start, 'yyyy-MM-dd'),
		end: format(end, 'yyyy-MM-dd')
	};
}

function normalizeColor(color: string | null) {
	return color && ALLOWED_COLORS.has(color) ? color : DEFAULT_COLOR;
}

async function hasRecurringBeenApplied(
	item: { id: number; name: string; amount: number; categoryId: string },
	start: string,
	end: string
) {
	const [existing] = await db
		.select({ id: expenses.id })
		.from(expenses)
		.where(
			and(
				sql`(${expenses.recurringExpenseId} = ${item.id} OR (${expenses.note} = ${item.name} AND ${expenses.amount} = ${item.amount} AND ${expenses.categoryId} = ${item.categoryId}))`,
				gte(expenses.date, start),
				lte(expenses.date, end)
			)
		)
		.limit(1);

	return Boolean(existing);
}

export const load: PageServerLoad = async () => {
	const { start, end } = getQuincenaRange();
	const items = await db
		.select({
			id: recurringExpenses.id,
			name: recurringExpenses.name,
			amount: recurringExpenses.amount,
			category: recurringExpenses.categoryId,
			day: recurringExpenses.dayOfMonth,
			payer: users.username,
			color: recurringExpenses.color
		})
		.from(recurringExpenses)
		.innerJoin(users, eq(recurringExpenses.payerId, users.id));

	const appliedRecurring = await db
		.select({
			id: expenses.recurringExpenseId,
			note: expenses.note,
			amount: expenses.amount,
			category: expenses.categoryId
		})
		.from(expenses)
		.where(and(gte(expenses.date, start), lte(expenses.date, end)));
	const appliedRecurringIds = new Set(
		appliedRecurring
			.map((item) => item.id)
			.filter((id): id is number => typeof id === 'number')
	);
	const appliedRecurringKeys = new Set(
		appliedRecurring
			.filter((item) => item.note)
			.map((item) => `${item.note}|${item.amount}|${item.category}`)
	);

	return {
		items: items.map((item) => ({
			...item,
			appliedThisQuincena:
				appliedRecurringIds.has(item.id) ||
				appliedRecurringKeys.has(`${item.name}|${item.amount}|${item.category}`)
		}))
	};
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		const user = locals.user!;
		const data = await request.formData();

		const name = data.get('name') as string;
		const amount = parseFloat(data.get('amount') as string);
		const category = data.get('category') as string;
		const day = parseInt(data.get('day') as string);
		const color = normalizeColor(data.get('color') as string | null);

		if (!name || isNaN(amount) || !category || isNaN(day)) {
			return fail(400, { message: 'Todos los campos son obligatorios' });
		}

		try {
			await db.insert(recurringExpenses).values({
				name,
				amount,
				categoryId: category,
				dayOfMonth: day,
				payerId: user.id,
				color
			});
			return { success: true };
		} catch (e: any) {
			return fail(500, { message: 'Error al guardar en la base de datos: ' + e.message });
		}
	},
	edit: async ({ request }) => {
		const data = await request.formData();

		const id = parseInt(data.get('id') as string);
		const name = data.get('name') as string;
		const amount = parseFloat(data.get('amount') as string);
		const category = data.get('category') as string;
		const day = parseInt(data.get('day') as string);
		const color = normalizeColor(data.get('color') as string | null);

		if (isNaN(id) || !name || isNaN(amount) || !category || isNaN(day) || day < 1 || day > 31) {
			return fail(400, { message: 'Datos inválidos' });
		}

		await db
			.update(recurringExpenses)
			.set({
				name,
				amount,
				categoryId: category,
				dayOfMonth: day,
				color
			})
			.where(eq(recurringExpenses.id, id));

		return { success: true };
	},
	applyRecurring: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id') as string);
		if (isNaN(id)) return fail(400, { message: 'ID inválido' });
		const { start, end } = getQuincenaRange();

		const [item] = await db
			.select()
			.from(recurringExpenses)
			.where(eq(recurringExpenses.id, id));

		if (!item) return fail(404, { message: 'No encontrado' });

		if (await hasRecurringBeenApplied(item, start, end)) {
			return fail(409, { message: 'Este recurrente ya fue registrado esta quincena' });
		}

		await db.insert(expenses).values({
			amount: item.amount,
			categoryId: item.categoryId,
			note: item.name,
			date: format(new Date(), 'yyyy-MM-dd'),
			payerId: item.payerId,
			recurringExpenseId: item.id
		});

		return { success: true };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id') as string);
		if (!isNaN(id)) {
			await db.delete(recurringExpenses).where(eq(recurringExpenses.id, id));
		}
		return { success: true };
	},
	logout: async ({ cookies }) => {
		cookies.delete('session', { path: '/' });
		throw redirect(303, '/login');
	}
};
