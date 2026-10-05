import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { extractRows, validateCurriculum, registerCurriculumPdf } from './curriculum-pdf.js';
import { rowType, curriculumTotal } from '../src/config/curriculumTable.js';

test('category table preserves types and does not double count children', () => {
  const rows = extractRows('1. หมวดวิชาศึกษาทั่วไป  30 หน่วยกิต\nกลุ่มวิชาภาษา  12\n2. หมวดวิชาเฉพาะ  102\n3. หมวดวิชาเลือกเสรี  6');
  assert.equal(rows.length, 4);
  assert.equal(rowType(rows[0]), 'category');
  assert.equal(rowType(rows[1]), 'item');
  assert.equal(curriculumTotal(rows), '138');
  assert.equal(curriculumTotal([{ name: 'วิชาเดียว', credits: '3' }]), '—');
  assert.equal(curriculumTotal([...rows, { name: 'รวมทั้งหมด', credits: '140' }]), '140');
  const value = { title: '', year: '', rows: rows.map(row => ({ ...row, type: rowType(row) })) };
  assert.deepEqual(validateCurriculum(value), value);
  assert.throws(() => validateCurriculum({ ...value, rows: [{ ...rows[0], type: 'bad' }] }));
});

test('PDF rows are conservative candidates and manual fields are bounded', () => {
  assert.deepEqual(extractRows('1234567  การเขียนโปรแกรม  3(2-2-5)\nหมวดวิชาศึกษาทั่วไป  30\nข้อความธรรมดา\n123'), [{ code: '1234567', name: 'การเขียนโปรแกรม', credits: '3(2-2-5)' }, { code: '', name: 'หมวดวิชาศึกษาทั่วไป', credits: '30' }]);
  assert.deepEqual(extractRows(''), []);
  const value = { title: 'หลักสูตร', year: '2570', rows: [{ code: '', name: 'หมวดวิชา', credits: '30' }] };
  assert.deepEqual(validateCurriculum(value), value);
  assert.equal(validateCurriculum({ ...value, rows: Array(501).fill(value.rows[0]) }).rows.length, 501);
  assert.equal(extractRows(Array(601).fill('หมวดวิชา  30').join('\n')).length, 601);
  for (const data of [null, {}, { ...value, rows: [{ code: '', name: '', credits: '' }] }, { ...value, rows: [{ code: '', name: 'test', credits: 'javascript:bad' }] }]) assert.throws(() => validateCurriculum(data));
});

test('upload is private until reviewed publication; auth, branch scope, signature and version enforced', async () => {
  const files = new Map(), publications = new Map(); let calls = 0;
  const db = { query(sql, args, cb) {
    if (sql.startsWith('CREATE')) return cb(null, {});
    if (sql.startsWith('SELECT id FROM course_info')) return cb(null, ['computer', 'electrical'].includes(args[0]) ? [{ id: 1 }] : []);
    if (sql.startsWith('INSERT INTO curriculum_pdf_files')) { files.set(args[0], { slug: args[1], data: args[3] }); return cb(null, {}); }
    if (sql.startsWith('SELECT file_id')) return cb(null, publications.has(args[0]) ? [publications.get(args[0])] : []);
    if (sql.startsWith('SELECT id FROM curriculum_pdf_files')) return cb(null, files.get(args[0])?.slug === args[1] ? [{ id: args[0] }] : []);
    if (sql.startsWith('INSERT IGNORE')) { if (publications.has(args[0])) return cb(null, { affectedRows: 0 }); publications.set(args[0], { file_id: args[1], content: args[2], version: 1 }); return cb(null, { affectedRows: 1 }); }
    if (sql.startsWith('UPDATE curriculum_pdf_publications')) { const row = publications.get(args[2]); if (!row || row.version !== args[3]) return cb(null, { affectedRows: 0 }); publications.set(args[2], { file_id: args[0], content: args[1], version: row.version + 1 }); return cb(null, { affectedRows: 1 }); }
    if (sql.startsWith('SELECT data') || sql.startsWith('SELECT f.data')) { const file = files.get(args[1]); const publicOk = !sql.startsWith('SELECT f.data') || publications.get(args[0])?.file_id === args[1]; return cb(null, file?.slug === args[0] && publicOk ? [{ data: file.data }] : []); }
    cb(new Error('Unexpected SQL: ' + sql));
  } };
  const app = express(); app.use(express.json());
  const auth = (req, res, next) => req.headers.authorization ? next() : res.sendStatus(401);
  const permission = (req, slug, cb) => cb(req.headers.authorization === slug ? null : { status: 403 });
  registerCurriculumPdf(app, db, auth, permission, async () => { calls++; return { rows: [], text: '', pages: 1 }; });
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}/api/curriculum-pdf/`;
  const upload = (slug, token, text = '%PDF-1.4\n') => { const body = new FormData(); body.append('pdf', new Blob([text]), 'test.pdf'); return fetch(base + slug + '/upload', { method: 'POST', body, headers: token ? { Authorization: token } : {} }); };
  const save = (slug, body) => fetch(base + slug, { method: 'PUT', headers: { Authorization: slug, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal((await upload('computer')).status, 401);
    assert.equal((await upload('electrical', 'computer')).status, 403);
    assert.equal((await upload('computer', 'computer', 'not pdf')).status, 400); assert.equal(calls, 0);
    const draft = await (await upload('computer', 'computer')).json(); assert.equal(draft.success, true);
    assert.equal((await (await fetch(base + 'computer')).json()).data, null);
    assert.equal((await fetch(base + `computer/files/${draft.fileId}`)).status, 404);
    assert.equal((await fetch(base + `computer/drafts/${draft.fileId}`)).status, 401);
    assert.equal((await fetch(base + `computer/drafts/${draft.fileId}`, { headers: { Authorization: 'computer' } })).status, 200);
    const body = { fileId: draft.fileId, title: 'ทดสอบ', year: '', rows: [], version: 0, reviewed: true };
    assert.equal((await save('computer', { ...body, reviewed: false })).status, 400);
    assert.equal((await save('electrical', body)).status, 400);
    assert.equal((await save('computer', body)).status, 200);
    assert.equal((await save('computer', body)).status, 409);
    assert.equal((await fetch(base + `computer/files/${draft.fileId}`)).headers.get('content-type'), 'application/pdf');
    const next = await (await upload('computer', 'computer')).json();
    assert.equal((await (await fetch(base + 'computer')).json()).data.fileId, draft.fileId);
    assert.equal((await save('computer', { ...body, fileId: next.fileId, version: 1 })).status, 200);
    assert.equal((await fetch(base + `computer/files/${draft.fileId}`)).status, 404);
  } finally { await new Promise(r => server.close(r)); }
});
