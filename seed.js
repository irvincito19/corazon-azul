import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database(process.env.DATABASE_URL || 'local.db');

function tableExists(name) {
	return Boolean(
		db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name)
	);
}

async function seed() {
	const passwordHash = await bcrypt.hash('familia123', 10);
	
	// Create table if not exists (in case push hasn't run or something)
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL
		);
	`);

	const insert = db.prepare('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)');
	insert.run('irving', passwordHash);
	const existingViridiana = db.prepare("SELECT id FROM users WHERE username = 'viridiana'").get();
	if (!existingViridiana) {
		db.prepare("UPDATE users SET username = 'viridiana' WHERE username = 'esposa'").run();
	}
	insert.run('viridiana', passwordHash);
	db.prepare("UPDATE users SET password_hash = ? WHERE username IN ('irving', 'viridiana')").run(passwordHash);
	if (tableExists('expenses')) {
		db.prepare('UPDATE expenses SET payer_id = (SELECT id FROM users WHERE username = ?) WHERE payer_id NOT IN (SELECT id FROM users WHERE username IN (?, ?))').run('irving', 'irving', 'viridiana');
	}
	if (tableExists('recurring_expenses')) {
		db.prepare('UPDATE recurring_expenses SET payer_id = (SELECT id FROM users WHERE username = ?) WHERE payer_id NOT IN (SELECT id FROM users WHERE username IN (?, ?))').run('irving', 'irving', 'viridiana');
	}
	db.prepare("DELETE FROM users WHERE username NOT IN ('irving', 'viridiana')").run();

	console.log('Seeded 2 users: irving and viridiana (password: familia123)');
}

seed();
