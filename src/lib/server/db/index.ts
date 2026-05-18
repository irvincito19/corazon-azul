import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const dbPath = process.env.DATABASE_URL || 'local.db';
const sqlite = new Database(dbPath);

sqlite.pragma('foreign_keys = ON');
sqlite.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY,
		username TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS recurring_expenses (
		id INTEGER PRIMARY KEY,
		amount REAL NOT NULL,
		name TEXT NOT NULL,
		category_id TEXT NOT NULL,
		payer_id INTEGER NOT NULL REFERENCES users(id),
		day_of_month INTEGER NOT NULL,
		color TEXT NOT NULL DEFAULT '#3b82f6'
	);

	CREATE TABLE IF NOT EXISTS expenses (
		id INTEGER PRIMARY KEY,
		amount REAL NOT NULL,
		category_id TEXT NOT NULL,
		date TEXT NOT NULL,
		payer_id INTEGER NOT NULL REFERENCES users(id),
		recurring_expense_id INTEGER REFERENCES recurring_expenses(id),
		note TEXT,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP
	);
`);

function ensureColumn(table: string, column: string, definition: string) {
	const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
	if (columns.length === 0) return;
	if (!columns.some((item) => item.name === column)) {
		sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
	}
}

function tableExists(table: string) {
	const result = sqlite
		.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
		.get(table);
	return Boolean(result);
}

ensureColumn('expenses', 'recurring_expense_id', 'INTEGER REFERENCES recurring_expenses(id)');
ensureColumn('recurring_expenses', 'color', "TEXT NOT NULL DEFAULT '#3b82f6'");

sqlite.exec(`
	CREATE TABLE IF NOT EXISTS app_settings (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL
	);
	INSERT OR IGNORE INTO app_settings (key, value)
	VALUES ('monthly_budget', '17400');
`);

// Migrate old quincena_budget to monthly_budget (×2)
const oldBudget = sqlite.prepare("SELECT value FROM app_settings WHERE key = 'quincena_budget'").get() as { value: string } | undefined;
if (oldBudget) {
	const monthlyValue = (parseFloat(oldBudget.value) * 2).toString();
	sqlite.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('monthly_budget', ?)").run(monthlyValue);
	sqlite.prepare("DELETE FROM app_settings WHERE key = 'quincena_budget'").run();
}

sqlite.exec(`
	CREATE TABLE IF NOT EXISTS grocery_items (
		id INTEGER PRIMARY KEY,
		name TEXT NOT NULL,
		purchased INTEGER NOT NULL DEFAULT 0,
		created_by INTEGER NOT NULL REFERENCES users(id),
		created_at TEXT DEFAULT CURRENT_TIMESTAMP
	);
`);

if (tableExists('expenses') && tableExists('recurring_expenses')) {
	sqlite.exec(`
		UPDATE expenses
		SET recurring_expense_id = (
			SELECT recurring_expenses.id
			FROM recurring_expenses
			WHERE recurring_expenses.name = expenses.note
				AND recurring_expenses.amount = expenses.amount
				AND recurring_expenses.category_id = expenses.category_id
			LIMIT 1
		)
		WHERE recurring_expense_id IS NULL
			AND note IS NOT NULL
			AND EXISTS (
				SELECT 1
				FROM recurring_expenses
				WHERE recurring_expenses.name = expenses.note
					AND recurring_expenses.amount = expenses.amount
					AND recurring_expenses.category_id = expenses.category_id
			)
	`);
}

export const db = drizzle(sqlite, { schema });
