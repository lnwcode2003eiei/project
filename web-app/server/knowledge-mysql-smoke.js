// Isolated integration test: creates only temporary-named tables, no real user data.
import mysql from 'mysql2/promise';
import express from 'express';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { registerKnowledge } from './knowledge.js';
import { importStarter, starterRows } from './knowledge-import.js';
if (process.env.RUN_KNOWLEDGE_SMOKE !== '1') throw new Error('Set RUN_KNOWLEDGE_SMOKE=1 to run');
const suffix = randomBytes(6).toString('hex');
const tables = ['knowledge_answers', 'knowledge_history', 'knowledge_questions', 'knowledge_events'];
const pool = mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, charset: 'utf8mb4' });
const wrap = connection => ({
  query(sql, values) {
    if (sql.startsWith('SELECT id, saka_path, can_edit FROM users')) return Promise.resolve([[{ id: Number(values[0]), saka_path: Number(values[0]) === 1 ? 'all' : 'computer', can_edit: Number(values[0]) === 3 ? 0 : 1 }]]);
    sql = sql.replace(/LEFT JOIN users u ON u.id=h.changed_by/, "LEFT JOIN (SELECT 1 AS id, 'test-admin' AS username) u ON u.id=h.changed_by");
    for (const table of tables) sql = sql.replaceAll(table, `test_${suffix}_${table}`);
    return connection.query(sql, values);
  },
  beginTransaction: () => connection.beginTransaction(), commit: () => connection.commit(), rollback: () => connection.rollback(), release: () => connection.release(),
});
const adapter = { ...wrap(pool), getConnection: async () => wrap(await pool.getConnection()) };
const app = express(); app.use(express.json());
registerKnowledge(app, { promise: () => adapter }, (req, res, next) => { req.admin = { sub: Number(req.get('Authorization')) }; next(); });
const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
process.env.N8N_KNOWLEDGE_TOKEN = randomBytes(32).toString('hex');
const call = async (path, method = 'GET', body, user = 1) => {
  const response = await fetch(origin + path, { method, headers: { Authorization: String(user), 'Content-Type': 'application/json', 'X-Knowledge-Token': process.env.N8N_KNOWLEDGE_TOKEN }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { code: response.status, ...await response.json() };
};
try {
  const base = { question: 'คำถามทดสอบ', aliases: [], answer: 'คำตอบทดสอบ', category: 'ทั่วไป', branch: 'computer', status: 'draft', metadata: { keywords: ['ทดสอบ'], academicYear: '2570', source: 'https://example.com/', notes: 'หมายเหตุภายใน' } };
  assert.equal((await call('/api/admin/knowledge')).code, 200);
  const created = await call('/api/admin/knowledge/answers', 'POST', base);
  assert.equal(created.code, 201);
  let inbox = await call('/api/integrations/line/questions', 'POST', { eventId: 'test-event', question: base.question, branch: 'computer' });
  assert.equal(inbox.status, 'pending');
  assert.equal((await call('/api/integrations/line/questions', 'POST', { eventId: 'test-event', question: base.question, branch: 'computer' })).duplicate, true);
  assert.equal((await call(`/api/admin/knowledge/answers/${created.id}`, 'PUT', { ...base, status: 'published', version: 1 }, 2)).code, 200);
  assert.equal((await call(`/api/admin/knowledge/answers/${created.id}`, 'PUT', { ...base, version: 1 })).code, 409);
  inbox = await call('/api/integrations/line/questions', 'POST', { eventId: 'test-event-2', question: base.question, branch: 'computer' });
  assert.equal(inbox.status, 'answered');
  const unknown = await call('/api/integrations/line/questions', 'POST', { eventId: 'test-event-3', question: 'คำถามใกล้เคียง', branch: 'computer' });
  assert.equal((await call(`/api/admin/knowledge/questions/${unknown.questionId}`, 'PATCH', { branch: 'computer', category: 'ทั่วไป', status: 'resolved', answerId: created.id, version: 1 }, 2)).code, 200);
  assert.equal((await call('/api/integrations/line/questions', 'POST', { eventId: 'test-event-4', question: 'คำถามใกล้เคียง', branch: 'computer' })).status, 'answered');
  assert.equal((await call(`/api/admin/knowledge/answers/${created.id}/history`)).data.length, 3);
  assert.equal((await call('/api/admin/knowledge/answers', 'POST', { ...base, branch: 'electrical' }, 2)).code, 403);
  assert.equal((await call('/api/admin/knowledge/answers', 'POST', base, 3)).code, 403);
  const result = await call('/api/admin/knowledge');
  assert.equal(result.questions.find(q => q.id === inbox.questionId).occurrences, 2);
  assert.deepEqual(result.answers.find(a => a.id === created.id).metadata, base.metadata);
  assert.equal((await importStarter(adapter)).added, 26);
  const duplicate = await call('/api/admin/knowledge/answers', 'POST', { ...starterRows[0], answer: 'Existing answer must remain', status: 'draft' });
  assert.equal(duplicate.code, 201);
  assert.deepEqual(await importStarter(adapter, true), { mode: 'applied', added: 25, skipped: 1, total: 26 });
  const after = await call('/api/admin/knowledge');
  assert.equal(after.answers.find(a => a.id === duplicate.id).answer, 'Existing answer must remain');
  assert.equal(after.answers.filter(a => a.branch === 'all' && a.status === 'draft').length, 26);
  const imported = after.answers.find(a => a.question === starterRows[1].question);
  assert.equal((await call(`/api/admin/knowledge/answers/${imported.id}`, 'PUT', { ...imported, question: 'Renamed imported question' })).code, 200);
  assert.deepEqual(await importStarter(adapter, true), { mode: 'applied', added: 0, skipped: 26, total: 26 });
  assert.equal((await call('/api/integrations/line/questions', 'POST', { eventId: 'draft-import-check', question: starterRows[2].question })).status, 'pending');
  assert.equal((await call('/api/admin/knowledge', 'GET', undefined, 2)).answers.some(a => a.branch === 'all'), false);
  assert.equal((await call(`/api/admin/knowledge/answers/${imported.id}/history`)).data.length, 2);
  console.log('PASS: metadata round-trip, draft import, no overwrite, repeat/rename idempotency and branch isolation');
  console.log('PASS: real MySQL create/publish/history/optimistic locking/alias linking/deduplication/branch restrictions');
  const triagePath = '/api/integrations/line/triage', searchPath = '/api/integrations/knowledge/search';
  const beforeTriage = (await call('/api/admin/knowledge')).questions.length;
  for (const decision of ['smalltalk', 'clarify', 'service_error']) {
    const res = await call(triagePath, 'POST', { eventId: decision, question: 'สวัสดีครับ', decision });
    assert.equal(res.code, 200); assert.equal(res.queued, false); assert.equal(res.questionId, null);
  }
  assert.equal((await call('/api/admin/knowledge')).questions.length, beforeTriage);
  const search = await call(searchPath, 'POST', { eventId: 'answered-event', query: base.question, branch: 'computer' });
  assert.equal(search.code, 200); assert.ok(search.candidates.some(a => a.id === created.id));
  assert.ok(!JSON.stringify(search).includes(base.metadata.notes));
  assert.equal((await call('/api/admin/knowledge')).questions.length, beforeTriage);
  const answeredBody = { eventId: 'answered-event', question: base.question, branch: 'computer', decision: 'answered', answerIds: [created.id], searchToken: search.searchToken };
  const approved = await call(triagePath, 'POST', answeredBody);
  assert.equal(approved.status, 'answered'); assert.equal(approved.queued, false); assert.equal(approved.approvedAnswers[0].answer, base.answer);
  assert.equal((await call(triagePath, 'POST', answeredBody)).duplicate, true);
  assert.equal((await call(triagePath, 'POST', { ...answeredBody, eventId: 'forged-event' })).reason, 'invalid_reference');
  const outdated = await call(searchPath, 'POST', { eventId: 'outdated-event', query: base.question, branch: 'computer' });
  const currentAnswer = (await call('/api/admin/knowledge')).answers.find(a => a.id === created.id);
  assert.equal((await call(`/api/admin/knowledge/answers/${created.id}`, 'PUT', { ...currentAnswer, status: 'disabled' })).code, 200);
  assert.equal((await call(triagePath, 'POST', { ...answeredBody, eventId: 'outdated-event', searchToken: outdated.searchToken })).reason, 'invalid_reference');
  const review = { eventId: 'review-1', question: 'ค่าเทอมคอมพิวเตอร์ปีหน้า', summary: 'ค่าเทอมคอมพิวเตอร์ ปี 2571', branch: 'computer', category: 'ค่าใช้จ่าย', decision: 'review', reason: 'not_found', detail: 'ไม่พบปีการศึกษาที่ถาม' };
  const queued = await call(triagePath, 'POST', review);
  assert.equal(queued.queued, true);
  const concurrent = await Promise.all(Array.from({ length: 3 }, () => call(triagePath, 'POST', { ...review, eventId: 'review-concurrent' })));
  assert.ok(concurrent.every(r => r.code === 200), JSON.stringify(concurrent));
  assert.equal(concurrent.filter(r => !r.duplicate).length, 1);
  const repeated = await call(triagePath, 'POST', { ...review, eventId: 'review-2' });
  assert.equal(repeated.questionId, queued.questionId);
  const adminQueue = await call('/api/admin/knowledge', 'GET', undefined, 2);
  const item = adminQueue.questions.find(q => q.id === queued.questionId);
  assert.equal(item.occurrences, 3); assert.equal(item.triage.summary, review.summary); assert.equal(item.question, review.question);
  const similarReview = await call(triagePath, 'POST', { ...review, eventId: 'review-3', question: 'อยากทราบค่าเทอมคอมพิวเตอร์ปีหน้า' });
  assert.notEqual(similarReview.questionId, queued.questionId);
  assert.ok((await call(`/api/admin/knowledge/questions/${queued.questionId}/similar`)).data.some(row => row.id === similarReview.questionId));
  const central = await call(triagePath, 'POST', { ...review, eventId: 'unassigned-review', branch: null });
  assert.equal((await call(`/api/admin/knowledge/questions/${central.questionId}/similar`, 'GET', undefined, 2)).code, 403);
  assert.equal((await call('/api/admin/knowledge', 'GET', undefined, 2)).questions.some(q => q.id === central.questionId), false);
  assert.equal((await call(triagePath, 'POST', { ...review, eventId: 'invalid-reason', reason: 'made-up' })).code, 400);
  assert.equal((await call(searchPath, 'POST', { query: 'test', eventId: 'test', branch: 'all' })).code, 400);
  for (const path of [searchPath, triagePath]) {
    assert.equal((await fetch(origin + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
  }
  console.log('PASS: search privacy, triage decisions, proof validation, revoked answers, concurrent redelivery, exact grouping and scoped suggestions');
} finally {
  await new Promise(resolve => server.close(resolve));
  for (const table of tables) {
    const target = `test_${suffix}_${table}`;
    if (!/^test_[a-f0-9]{12}_knowledge_(answers|history|questions|events)$/.test(target)) throw new Error('Unsafe cleanup name');
    await pool.query(`DROP TABLE IF EXISTS \`${target}\``);
  }
  await pool.end();
}
