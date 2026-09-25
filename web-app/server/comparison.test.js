import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { normalizeName, extractNames, compareNames } from './comparison-data.js';
import { registerComparison } from './comparison.js';

test('normalizes prefixes, extra whitespace and excludes anonymous/partial names', () => {
  assert.equal(normalizeName(' นายสมชาย   ใจดี '), 'สมชาย ใจดี');
  assert.equal(normalizeName('นางสาว สมหญิง ใจดี'), 'สมหญิง ใจดี');
  for (const name of ['ไม่ระบุ', 'ไม่ระบุชื่อ', '', 'สมชาย', '123 456']) assert.equal(normalizeName(name), null);
});
test('extracts explicit roster rows, separate surname columns and isolates OCR', () => {
  const parsed = extractNames([{ number: 1, text: 'รายชื่อผู้สอบผ่าน\n1 123456 นายสมชาย ใจดี    วิศวกรรมคอมพิวเตอร์\n2 นางสาว สมหญิง    ใจดี    ผ่าน\n3 นายชื่อเดียว', ocr: false }, { number: 2, text: 'นายสมคิด ใจดี', ocr: true }]);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[1].key, 'สมหญิง ใจดี');
  assert.equal(parsed.unresolved.length, 2);
});
test('name sets, duplicates, fuzzy uncertainty and all four percentage denominators', () => {
  const v = [{ name: 'นายสมชาย ใจดี' }, { name: 'สมชาย ใจดี' }, { name: 'สมหญิง รักเรียน' }, { name: 'ไม่ระบุชื่อ' }];
  const i = [{ name: 'สมชาย ใจดี' }, { name: 'สมคิด ตั้งใจ' }];
  const extracted = { rows: [{ name: 'สมชาย ใจดี' }, { name: 'นายสมชาย ใจดี' }, { name: 'สมคิด ตั้งใจ' }, { name: 'นอกระบบ ทดสอบ' }, { name: 'สมชาย ใจด' }], unresolved: [{ text: 'OCR', reason: 'unclear', page: 2 }] };
  const result = compareNames(v, i, extracted);
  assert.equal(result.counts.passed, 4);
  assert.equal(result.counts.fullPath, 1);
  assert.equal(result.counts.uncertain, 1);
  assert.equal(result.metrics.visitorToInterest.percent, 50);
  assert.equal(result.metrics.interestToPass.percent, 100);
  assert.equal(result.metrics.visitorToPass.percent, 50);
  assert.equal(result.metrics.outside.percent, 25);
  assert.equal(result.excluded.visitors, 1);
  assert.equal(result.excluded.pdf, 1);
  assert.equal(compareNames([], [], { rows: [], unresolved: [] }).metrics.outside.percent, null);
});
test('upload API auth, scope, invalid PDFs, exact calculations, parser failure and cleanup of busy flag', async () => {
  const app = express(); let reads = 0;
  const db = { query(sql, callback) { callback(null, sql.includes('visitors') ? [{ name: 'สมชาย ใจดี' }] : [{ name: 'สมชาย ใจดี' }]); } };
  registerComparison(app, db, (req, res, next) => {
    if (!req.headers.authorization) return res.sendStatus(401);
    req.admin = { saka_path: req.headers.authorization }; next();
  }, async () => { reads++; if (reads === 2) throw new Error('parser failure'); return [{ number: 1, ocr: false, text: '1 นายสมชาย ใจดี' }]; });
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const request = async (auth, content = '%PDF-1.7 test') => {
    const body = new FormData(); body.append('pdf', new Blob([content], { type: 'application/pdf' }), 'roster.pdf');
    return fetch(`http://127.0.0.1:${server.address().port}/api/admin/comparison`, { method: 'POST', headers: auth ? { Authorization: auth } : {}, body });
  };
  try {
    assert.equal((await request()).status, 401);
    assert.equal((await request('computer')).status, 403);
    assert.equal((await request('all', 'bad')).status, 400);
    const valid = await request('all'); assert.equal(valid.status, 200);
    assert.equal((await valid.json()).data.metrics.visitorToPass.percent, 100);
    assert.equal((await request('all')).status, 422);
    assert.equal((await request('all')).status, 200);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
