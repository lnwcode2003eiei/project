// Explicit local maintenance only. No HTTP route and never invoked at startup.
import mysql from 'mysql2/promise';
import { open, readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const expectedHost = process.env.LOCAL_MYSQL_HOSTNAME;
if (process.env.CONFIRM_LOCAL_KNOWLEDGE_RESET !== 'DELETE_LOCAL_QA' || process.env.DB_HOST !== 'mysql' || !expectedHost) throw new Error('Local-only confirmation and inspected MySQL hostname are required');
const pool = mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, charset: 'utf8mb4' });
const tables = ['knowledge_events', 'knowledge_questions', 'knowledge_history', 'knowledge_answers'];
const apply = process.argv.includes('--apply');
const connection = await pool.getConnection();
try {
  const [[target]] = await connection.query('SELECT @@hostname AS hostname, DATABASE() AS db');
  if (target.hostname !== expectedHost || target.db !== process.env.DB_NAME) throw new Error('Database target does not match the inspected local container');
  await connection.beginTransaction();
  const backup = { format: 'knowledge-local-backup-v1', createdAt: new Date().toISOString(), target, tables: {} };
  for (const table of tables) {
    const [rows] = await connection.query(`SELECT * FROM \`${table}\` FOR UPDATE`);
    const [[schema]] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
    backup.tables[table] = { schema: schema['Create Table'], rows };
  }
  const counts = Object.fromEntries(tables.map(table => [table, backup.tables[table].rows.length]));
  if (!apply) { await connection.rollback(); console.log(JSON.stringify({ mode: 'preview', target, counts })); }
  else {
    await mkdir('/backup', { recursive: true, mode: 0o700 });
    const path = '/backup/knowledge-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    const serialized = JSON.stringify(backup, null, 2), checksum = createHash('sha256').update(serialized).digest('hex');
    const file = await open(path, 'wx', 0o600);
    try { await file.writeFile(serialized, 'utf8'); await file.sync(); } finally { await file.close(); }
    const reread = await readFile(path, 'utf8');
    if (createHash('sha256').update(reread).digest('hex') !== checksum || JSON.parse(reread).format !== backup.format) throw new Error('Backup verification failed; data was not cleared');
    for (const table of tables) await connection.query(`DELETE FROM \`${table}\``);
    const remaining = {};
    for (const table of tables) {
      const [[row]] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
      remaining[table] = row.count;
      if (row.count !== 0) throw new Error('Reset verification failed');
    }
    await connection.commit();
    console.log(JSON.stringify({ mode: 'cleared', target, backup: path, checksum, removed: counts, remaining }));
  }
} catch (error) { await connection.rollback(); console.error('Local reset aborted:', error.code || error.message); process.exitCode = 1; }
finally { connection.release(); await pool.end(); }
