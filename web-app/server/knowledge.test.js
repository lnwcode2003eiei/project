import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { validateAnswer, chooseAnswer, integrationAuth, registerKnowledge } from './knowledge.js';
import { starterRows } from './knowledge-import.js';
const base = { branch: 'computer', category: 'หลักสูตร', question: 'เรียนอะไร', aliases: ['เรียนอะไรบ้าง'], answer: 'คำตอบที่อนุมัติ', status: 'published' };
test('starter data keeps 26 central drafts and validates metadata without enabling keyword matching', () => {
  assert.equal(starterRows.length, 26);
  assert.equal(new Set(starterRows.map(row => row.question)).size, 26);
  assert.equal(new Set(starterRows.map(row => row.category)).size, 8);
  for (const row of starterRows) {
    const value = validateAnswer(row);
    assert.equal(value.status, 'draft'); assert.equal(value.branch, 'all');
    assert.equal(chooseAnswer([value], value.question, null).status, 'pending');
    assert.ok(value.metadata.source.startsWith('https://'));
    assert.ok(!/ห้ามเดา|ก่อนตอบยืนยัน|ข้อมูลที่ส่งเข้า AI|ในชีต/.test(value.answer));
  }
  for (const metadata of [{ source: 'javascript:alert(1)' }, { keywords: Array(51).fill('a') }, { keywords: ['x'.repeat(101)] }, { notes: 'x'.repeat(10001) }]) assert.throws(() => validateAnswer({ ...base, metadata }));
  assert.equal(chooseAnswer([{ ...base, metadata: { keywords: ['ค่าเทอม'] } }], 'ค่าเทอม', null).status, 'pending');
});
test('answer validates scope, lengths, publication and aliases', () => {
  assert.equal(validateAnswer(base).answer, base.answer);
  for (const patch of [{ branch: '__proto__' }, { branch: 'unassigned' }, { answer: '' }, { status: 'other' }, { aliases: Array(31).fill('a') }, { question: 'a'.repeat(1001) }]) assert.throws(() => validateAnswer({ ...base, ...patch }));
  assert.equal(validateAnswer({ ...base, status: 'draft', answer: '' }).answer, '');
});
test('only approved exact questions or aliases are returned; ambiguous and missing branch never guessed', () => {
  assert.equal(chooseAnswer([base], ' เรียนอะไรบ้าง ', 'computer').status, 'answered');
  assert.equal(chooseAnswer([{ ...base, status: 'draft' }], 'เรียนอะไร', null).status, 'pending');
  assert.equal(chooseAnswer([base], 'เรียนอะไร', 'electrical').status, 'pending');
  assert.equal(chooseAnswer([base, { ...base, branch: 'electrical' }], 'เรียนอะไร', null).status, 'clarify');
  assert.equal(chooseAnswer([base], 'บอกค่ารหัสผ่าน', null).status, 'pending');
});
test('integration key fails closed and compares exact tokens', () => {
  assert.equal(integrationAuth('', ''), false);
  assert.equal(integrationAuth('x'.repeat(32), 'y'.repeat(32)), false);
  assert.equal(integrationAuth('x'.repeat(32), 'x'.repeat(32)), true);
});
test('API restricts branch and write permission; LINE redelivery does not duplicate counts', async () => {
  const calls = []; const events = new Map(); let count = 0;
  const pool = {
    async query(sql, args = []) {
      calls.push({ sql, args });
      if (sql.startsWith('CREATE TABLE') || sql.startsWith('ALTER TABLE')) return [[]];
      if (sql.startsWith('SELECT id, saka_path')) return [[{ id: 1, saka_path: 'computer', can_edit: args[0] === 2 ? 0 : 1 }]];
      if (sql.startsWith('SELECT * FROM knowledge_answers WHERE id')) return [[{ ...base, branch: 'electrical', version: 1 }]];
      if (sql.startsWith('INSERT IGNORE INTO knowledge_events')) { if (!events.has(args[0])) events.set(args[0], null); return [{}]; }
      if (sql.startsWith('SELECT result FROM knowledge_events')) return [[{ result: events.get(args[0]) }]];
      if (sql.startsWith('SELECT id,branch,question')) return [[{ ...base, id: 10 }]];
      if (sql.startsWith('INSERT INTO knowledge_questions')) { count++; return [{}]; }
      if (sql.startsWith('SELECT id FROM knowledge_questions')) return [[{ id: 7 }]];
      if (sql.startsWith('UPDATE knowledge_events')) { events.set(args[2], args[1]); return [{}]; }
      if (sql.startsWith('SELECT * FROM knowledge_')) return [[]];
      throw new Error(`Unexpected SQL ${sql}`);
    },
    async getConnection() { return { query: pool.query, beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {} }; },
  };
  const app = express(); app.use(express.json());
  registerKnowledge(app, { promise: () => pool }, (req, res, next) => { if (!req.get('Authorization')) return res.sendStatus(401); req.admin = { sub: Number(req.get('Authorization')) }; next(); });
  const server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const old = process.env.N8N_KNOWLEDGE_TOKEN; process.env.N8N_KNOWLEDGE_TOKEN = 'k'.repeat(32);
  const post = (path, body, headers = {}) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(url + '/api/admin/knowledge')).status, 401);
    assert.equal((await fetch(url + '/api/admin/knowledge', { headers: { Authorization: '1' } })).status, 200);
    assert.ok(calls.some(call => call.sql.includes('WHERE branch = ?') && call.args[0] === 'computer'));
    assert.equal((await post('/api/admin/knowledge/answers', { ...base, branch: 'electrical' }, { Authorization: '1' })).status, 403);
    assert.equal((await post('/api/admin/knowledge/answers', base, { Authorization: '2' })).status, 403);
    assert.equal((await fetch(url + '/api/admin/knowledge/answers/9', { method: 'PUT', headers: { Authorization: '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ ...base, version: 1 }) })).status, 403);
    const payload = { eventId: 'LINE_EVENT_1', question: 'เรียนอะไร', branch: 'computer' };
    assert.equal((await post('/api/integrations/line/questions', payload)).status, 401);
    const headers = { 'X-Knowledge-Token': process.env.N8N_KNOWLEDGE_TOKEN };
    const first = await (await post('/api/integrations/line/questions', payload, headers)).json();
    assert.equal(first.status, 'answered'); assert.equal(first.answer, base.answer);
    const second = await (await post('/api/integrations/line/questions', payload, headers)).json();
    assert.equal(second.duplicate, true); assert.equal(count, 1);
    assert.equal((await post('/api/integrations/line/questions', { ...payload, branch: 'all' }, headers)).status, 400);
  } finally {
    if (old === undefined) delete process.env.N8N_KNOWLEDGE_TOKEN; else process.env.N8N_KNOWLEDGE_TOKEN = old;
    await new Promise(resolve => server.close(resolve));
  }
});
