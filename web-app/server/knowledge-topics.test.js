import test from 'node:test';
import assert from 'node:assert/strict';
import { groupQuestions, topicKey } from '../src/component/admin/knowledge-topics.js';
import { validateAnswer } from './knowledge.js';

test('saving without a status enables an answer immediately, but existing explicit drafts remain drafts', () => {
  const input = { branch: 'computer', question: 'สมัครที่ไหน', answer: 'ข้อมูลสำหรับทดสอบ', aliases: [] };
  assert.equal(validateAnswer(input).status, 'published');
  assert.equal(validateAnswer({ ...input, status: 'draft' }).status, 'draft');
  assert.throws(() => validateAnswer({ ...input, answer: '' }));
});
test('question display groups polite variants, retains all originals and separates context', () => {
  assert.equal(topicKey('สมัครต้องเตรียมหลักฐานอะไรบ้างครับ'), topicKey('สมัครต้องใช้เอกสารอะไรค่ะ'));
  const base = { status: 'pending', branch: 'computer', category: 'ทั่วไป', occurrences: 2, question: 'สมัครต้องเตรียมหลักฐานอะไรบ้างครับ' };
  const rows = [base, { ...base, question: 'สมัครต้องใช้เอกสารอะไรค่ะ' }];
  assert.equal(groupQuestions(rows).length, 1);
  assert.equal(groupQuestions(rows)[0].occurrences, 4);
  assert.equal(groupQuestions(rows)[0].rows.length, 2);
  assert.equal(groupQuestions([base, { ...base, branch: 'electrical' }]).length, 2);
  assert.equal(groupQuestions([{ ...base, question: 'ค่าเทอมปี 2570' }, { ...base, question: 'ค่าเทอมปี 2571' }]).length, 2);
  assert.equal(groupQuestions([{ ...base, question: 'ปวช สมัครได้ไหม' }, { ...base, question: 'ปวส สมัครได้ไหม' }]).length, 2);
  assert.equal(groupQuestions([{ ...base, question: 'เท่าไหร่', triage: { summary: 'ค่าเทอมปี 2570' } }, { ...base, question: 'เท่าไหร่', triage: { summary: 'ค่าเทอมปี 2571' } }]).length, 2);
  assert.equal(groupQuestions([{ ...base, status: 'resolved' }]).length, 0);
});
