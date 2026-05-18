import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const expenses = sqliteTable('expenses', {
	id: integer('id').primaryKey(),
	amount: real('amount').notNull(),
	categoryId: text('category_id').notNull(),
	date: text('date').notNull(), // YYYY-MM-DD
	payerId: integer('payer_id').notNull().references(() => users.id),
	recurringExpenseId: integer('recurring_expense_id').references(() => recurringExpenses.id),
	note: text('note'),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const recurringExpenses = sqliteTable('recurring_expenses', {
	id: integer('id').primaryKey(),
	amount: real('amount').notNull(),
	name: text('name').notNull(),
	categoryId: text('category_id').notNull(),
	payerId: integer('payer_id').notNull().references(() => users.id),
	dayOfMonth: integer('day_of_month').notNull(),
	color: text('color').notNull().default('#3b82f6')
});

export const appSettings = sqliteTable('app_settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

export const groceryItems = sqliteTable('grocery_items', {
	id: integer('id').primaryKey(),
	name: text('name').notNull(),
	price: real('price'),
	purchased: integer('purchased').notNull().default(0),
	createdBy: integer('created_by').notNull().references(() => users.id),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});
