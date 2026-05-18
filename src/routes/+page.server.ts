import { db } from '$lib/server/db';
import { appSettings, expenses, users, recurringExpenses } from '$lib/server/db/schema';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { format } from 'date-fns';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

/** Devuelve el rango del mes */
function getMonthRange(year: number, month: number): { start: string; end: string } {
	const start = new Date(year, month, 1);
	const end = new Date(year, month + 1, 0);
	return {
		start: format(start, 'yyyy-MM-dd'),
		end: format(end, 'yyyy-MM-dd')
	};
}

const MONTHLY_BUDGET_KEY = 'monthly_budget';
const DEFAULT_MONTHLY_BUDGET = 17400;

async function getMonthlyBudget() {
	const [setting] = await db
		.select({ value: appSettings.value })
		.from(appSettings)
		.where(eq(appSettings.key, MONTHLY_BUDGET_KEY));
	const budget = Number(setting?.value);
	return Number.isFinite(budget) && budget > 0 ? budget : DEFAULT_MONTHLY_BUDGET;
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

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = locals.user!;

	const now = new Date();
	const paramYear = parseInt(url.searchParams.get('year') || '');
	const paramMonth = parseInt(url.searchParams.get('month') || '');
	const year = !isNaN(paramYear) ? paramYear : now.getFullYear();
	const month = !isNaN(paramMonth) ? paramMonth : now.getMonth();

	const { start, end } = getMonthRange(year, month);
	const monthlyBudget = await getMonthlyBudget();
	const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

	// Total gasto este mes
	const [monthTotal] = await db
		.select({ value: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
		.from(expenses)
		.where(and(gte(expenses.date, start), lte(expenses.date, end)));

	// Gastos por usuario este mes
	const userTotals = await db
		.select({
			username: users.username,
			total: sql<number>`coalesce(sum(${expenses.amount}), 0)`
		})
		.from(expenses)
		.innerJoin(users, eq(expenses.payerId, users.id))
		.where(and(gte(expenses.date, start), lte(expenses.date, end)))
		.groupBy(users.username);

	// Gastos del mes
	const recentExpenses = await db
		.select({
			id: expenses.id,
			amount: expenses.amount,
			category: expenses.categoryId,
			date: expenses.date,
			note: expenses.note,
			payer: users.username,
			color: recurringExpenses.color
		})
		.from(expenses)
		.innerJoin(users, eq(expenses.payerId, users.id))
		.leftJoin(recurringExpenses, eq(expenses.recurringExpenseId, recurringExpenses.id))
		.where(and(gte(expenses.date, start), lte(expenses.date, end)))
		.orderBy(desc(expenses.createdAt));

	// Desglose por categoría
	const categoryBreakdown = await db
		.select({
			category: expenses.categoryId,
			total: sql<number>`coalesce(sum(${expenses.amount}), 0)`
		})
		.from(expenses)
		.where(and(gte(expenses.date, start), lte(expenses.date, end)))
		.groupBy(expenses.categoryId)
		.orderBy(desc(sql`sum(${expenses.amount})`));

	// Gastos recurrentes (solo mostrar no aplicados si es el mes actual)
	const recurring = await db
		.select({
			id: recurringExpenses.id,
			name: recurringExpenses.name,
			amount: recurringExpenses.amount,
			category: recurringExpenses.categoryId,
			day: recurringExpenses.dayOfMonth,
			color: recurringExpenses.color
		})
		.from(recurringExpenses);

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
		user,
		monthTotal: monthTotal?.value || 0,
		monthlyBudget,
		monthRange: { start, end },
		year,
		month,
		isCurrentMonth,
		userTotals,
		recentExpenses,
		categoryBreakdown,
		recurring: isCurrentMonth
			? recurring.filter(
					(item) => !appliedRecurringIds.has(item.id) && !appliedRecurringKeys.has(`${item.name}|${item.amount}|${item.category}`)
				)
			: []
	};
};

export const actions: Actions = {
	addExpense: async ({ request, locals }) => {
		const user = locals.user!;
		const data = await request.formData();

		const amount = parseFloat(data.get('amount') as string);
		const category = data.get('category') as string;
		const note = data.get('note') as string;
		const date = (data.get('date') as string) || format(new Date(), 'yyyy-MM-dd');

		if (isNaN(amount) || !category) {
			return fail(400, { message: 'Monto y categoría son obligatorios' });
		}

		await db.insert(expenses).values({
			amount,
			categoryId: category,
			note: note || null,
			date,
			payerId: user.id
		});

		return { success: true };
	},

	updateBudget: async ({ request }) => {
		const data = await request.formData();
		const budget = parseFloat(data.get('budget') as string);

		if (!Number.isFinite(budget) || budget <= 0) {
			return fail(400, { message: 'Presupuesto inválido' });
		}

		await db
			.insert(appSettings)
			.values({ key: MONTHLY_BUDGET_KEY, value: String(budget) })
			.onConflictDoUpdate({
				target: appSettings.key,
				set: { value: String(budget) }
			});

		return { success: true };
	},

	editExpense: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id') as string);
		const amount = parseFloat(data.get('amount') as string);
		const category = data.get('category') as string;
		const note = data.get('note') as string;
		const date = data.get('date') as string;

		if (isNaN(id) || isNaN(amount) || !category || !date) {
			return fail(400, { message: 'Datos inválidos' });
		}

		await db
			.update(expenses)
			.set({ amount, categoryId: category, note: note || null, date })
			.where(eq(expenses.id, id));

		return { success: true };
	},

	deleteExpense: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id') as string);
		if (!isNaN(id)) {
			await db.delete(expenses).where(eq(expenses.id, id));
		}
		return { success: true };
	},

	applyRecurring: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id') as string);
		if (isNaN(id)) return fail(400, { message: 'ID inválido' });

		const now = new Date();
		const { start, end } = getMonthRange(now.getFullYear(), now.getMonth());

		const [item] = await db
			.select()
			.from(recurringExpenses)
			.where(eq(recurringExpenses.id, id));

		if (!item) return fail(404, { message: 'No encontrado' });

		if (await hasRecurringBeenApplied(item, start, end)) {
			return fail(409, { message: 'Este recurrente ya fue registrado este mes' });
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

	logout: async ({ cookies }) => {
		cookies.delete('session', { path: '/' });
		throw redirect(303, '/login');
	}
};
