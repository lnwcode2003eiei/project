import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import mysql from 'mysql2/promise';
import { ensureKnowledgeSchema, normalize, validateAnswer } from './knowledge.js';

export const importBatch = 'user-faq-2570-v1';
export const starterRows = JSON.parse(await readFile(new URL('./data/knowledge-starter.json', import.meta.url), 'utf8'));
export async function importStarter(pool, apply = false) {
  const rows = starterRows.map(row => ({ sourceId: row.sourceId, value: validateAnswer({ ...row, branch: 'all', status: 'draft' }) }));
  await ensureKnowledgeSchema(pool);
  const c = await pool.getConnection();
  let locked = false;
  try {
    const [[lock]] = await c.query("SELECT GET_LOCK('knowledge-starter-import', 10) AS acquired");
    if (Number(lock.acquired) !== 1) throw new Error('Another import is running');
    locked = true;
    await c.beginTransaction();
    const [existing] = await c.query("SELECT question FROM knowledge_answers WHERE branch='all' FOR UPDATE");
    const questions = new Set(existing.map(row => normalize(row.question)));
    const [history] = await c.query("SELECT snapshot FROM knowledge_history WHERE JSON_UNQUOTE(JSON_EXTRACT(snapshot, '$.importBatch'))=?", [importBatch]);
    const imported = new Set(history.map(row => (typeof row.snapshot === 'string' ? JSON.parse(row.snapshot) : row.snapshot).sourceId));
    let added = 0, skipped = 0;
    for (const { sourceId, value } of rows) {
      if (imported.has(sourceId) || questions.has(normalize(value.question))) { skipped++; continue; }
      if (apply) {
        const [result] = await c.query('INSERT INTO knowledge_answers (branch,category,question,aliases,answer,metadata,status,updated_by) VALUES (?,?,?,?,?,?,?,?)', [value.branch, value.category, value.question, JSON.stringify(value.aliases), value.answer, JSON.stringify(value.metadata), 'draft', 0]);
        await c.query('INSERT INTO knowledge_history (answer_id,snapshot,changed_by) VALUES (?,?,?)', [result.insertId, JSON.stringify({ ...value, version: 1, importBatch, sourceId }), 0]);
      }
      questions.add(normalize(value.question)); added++;
    }
    if (apply) await c.commit(); else await c.rollback();
    return { mode: apply ? 'applied' : 'preview', added, skipped, total: rows.length };
  } catch (error) { await c.rollback(); throw error; }
  finally {
    try { if (locked) await c.query("SELECT RELEASE_LOCK('knowledge-starter-import')"); }
    finally { c.release(); }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pool = mysql.createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, charset: 'utf8mb4' });
  try { console.log(JSON.stringify(await importStarter(pool, process.argv.includes('--apply')))); }
  catch (error) { console.error('Import failed:', error.code || error.message); process.exitCode = 1; }
  finally { await pool.end(); }
}
