import test from 'node:test';
import assert from 'node:assert/strict';
import { rankAnswers, signSearch, verifySearch, suggestQuestions } from './knowledge-triage.js';

const answer = { id: 1, version: 2, branch: 'all', category: 'การรับสมัคร', question: 'สมัครที่ไหน', aliases: ['สมัครตรงไหน'], answer: 'สมัครผ่านเว็บมหาวิทยาลัย', status: 'published', metadata: { keywords: ['สมัคร', 'เว็บไซต์สมัคร'], notes: 'PRIVATE', source: 'https://example.com/', academicYear: '2570' } };
test('retrieval ranks aliases/keywords, excludes drafts/wrong branch, never exports internal notes', () => {
  assert.equal(rankAnswers([answer], 'สมัครตรงไหน')[0].score, 100);
  assert.equal(rankAnswers([answer], 'อยากสมัครเรียนครับ')[0].id, 1);
  assert.equal(rankAnswers([answer], 'สวัสดีครับ').length, 0);
  assert.equal(rankAnswers([{ ...answer, status: 'draft' }], 'สมัครที่ไหน').length, 0);
  assert.equal(rankAnswers([{ ...answer, branch: 'computer' }], 'สมัครที่ไหน', 'electrical').length, 0);
  assert.ok(!JSON.stringify(rankAnswers([answer], 'สมัคร')).includes('PRIVATE'));
  assert.equal(rankAnswers(Array.from({ length: 10 }, (_, i) => ({ ...answer, id: i + 1 })), 'สมัคร').length, 5);
});
test('search proof is event/branch/expiry bound and rejects forged tokens', () => {
  const secret = 'x'.repeat(32), payload = { eventHash: 'event1', branch: 'computer', expires: 2000, candidates: [{ id: 1, version: 2 }] };
  const token = signSearch(payload, secret);
  assert.deepEqual(verifySearch(token, secret, 'event1', 'computer', 1000), payload);
  assert.equal(verifySearch(token, secret, 'event2', 'computer', 1000), null);
  assert.equal(verifySearch(token, secret, 'event1', 'electrical', 1000), null);
  assert.equal(verifySearch(token, secret, 'event1', 'computer', 3000), null);
  assert.equal(verifySearch(token + 'x', secret, 'event1', 'computer', 1000), null);
  assert.equal(verifySearch('broken', secret, 'event1', 'computer', 1000), null);
});
test('duplicate suggestions stay in branch and only suggest pending items', () => {
  const q = { id: 1, branch: 'computer', question: 'ค่าเทอมคอมพิวเตอร์', status: 'pending', triage: null };
  assert.deepEqual(suggestQuestions(q, [q, { ...q, id: 2 }, { ...q, id: 3, branch: 'electrical' }, { ...q, id: 4, status: 'resolved' }]).map(r => r.id), [2]);
});
