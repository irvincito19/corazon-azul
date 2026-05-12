import Database from 'better-sqlite3';
const db = new Database('local.db');
try {
    const users = db.prepare("SELECT username FROM users").all();
    console.log('Usuarios encontrados:', users);
    console.log('Conexión exitosa.');
} catch (e) {
    console.error('Error conectando a la DB:', e.message);
} finally {
    db.close();
}
