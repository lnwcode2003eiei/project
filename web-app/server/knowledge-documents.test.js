import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { rankDocuments, registerKnowledgeDocuments } from './knowledge-documents.js';

test('document search ranks matching text and never exposes document bytes', () => {
  const rows = [{ id: 'a', branch: 'electrical', type: 'หลักสูตร', title: 'หลักสูตรไฟฟ้า', filename: 'ไฟฟ้า.pdf', extracted_text: 'เรียนระบบไฟฟ้ากำลัง วงจรไฟฟ้า และการติดตั้งไฟฟ้า', updated_at: '2026-10-05' }, { id: 'b', branch: 'all', type: 'การรับสมัคร', title: 'การสมัคร', filename: 'apply.pdf', extracted_text: 'วันสมัครเรียนและค่าเทอม', updated_at: '2026-10-05' }];
  const results = rankDocuments(rows, 'ระบบไฟฟ้า');
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'a');
  assert.match(results[0].excerpt, /ระบบไฟฟ้า/);
  assert.equal(Object.hasOwn(results[0], 'data'), false);
});

test('document search returns passages around terms found later in a long PDF', () => {
  const longText = `${'หน้าแรก '.repeat(500)}คุณสมบัติผู้สมัครต้องสำเร็จการศึกษาระดับมัธยมศึกษาตอนปลาย ${'รายละเอียด '.repeat(500)}วันสมัครเรียนอยู่ในช่วงเดือนมกราคม`;
  const [result] = rankDocuments([{ id: 'late', branch: 'computer', type: 'การรับสมัคร', title: 'ประกาศรับสมัคร', filename: 'apply.pdf', extracted_text: longText, updated_at: '2026-10-05' }], 'คุณสมบัติผู้สมัคร สมัครเรียน');
  assert.match(result.excerpt, /คุณสมบัติผู้สมัคร/);
  assert.match(result.excerpt, /วันสมัครเรียน/);
});

test('document search segments a Thai question written without spaces', () => {
  const results = rankDocuments([{ id: 'apply', branch: 'all', type: 'การรับสมัคร', title: 'ประกาศเปิดรับสมัคร', filename: 'apply.pdf', extracted_text: 'คณะเปิดรับสมัครสาขาวิศวกรรมคอมพิวเตอร์และเทคโนโลยีไฟฟ้า', updated_at: '2026-10-05' }], 'มีสาขาอะไรเปิดบ้าง');
  assert.equal(results.length, 1);
  assert.match(results[0].excerpt, /วิศวกรรมคอมพิวเตอร์/);
});

test('document search can use a matching title for a broad question', () => {
  const [result] = rankDocuments([{ id: 'computer', branch: 'computer', type: 'หลักสูตร', title: 'หลักสูตรวิศวกรรมคอมพิวเตอร์', filename: 'computer.pdf', extracted_text: 'เนื้อหาหลักสูตรและรายวิชา', updated_at: '2026-10-05' }], 'ถ้าชอบคอมพิวเตอร์');
  assert.equal(result.id, 'computer');
  assert.match(result.excerpt, /เนื้อหาหลักสูตร/);
});

test('document search can return more than the focused default result set', () => {
  const rows = Array.from({ length: 12 }, (_, index) => ({
    id: String(index), branch: 'all', type: 'หลักสูตร', title: `หลักสูตร ${index}`,
    filename: `${index}.pdf`, extracted_text: 'หลักสูตรที่เปิดสอน', updated_at: '2026-10-05',
  }));
  assert.equal(rankDocuments(rows, 'หลักสูตรที่เปิดสอน').length, 10);
  assert.equal(rankDocuments(rows, 'หลักสูตรที่เปิดสอน', 50).length, 12);
});

test('document preview requires authentication and respects branch scope', async () => {
  const documents = new Map([
    ['own', { branch: 'computer', filename: 'หลักสูตร.pdf', data: Buffer.from('%PDF-own') }],
    ['shared', { branch: 'all', filename: 'ส่วนกลาง.pdf', data: Buffer.from('%PDF-shared') }],
    ['other', { branch: 'electrical', filename: 'ไฟฟ้า.pdf', data: Buffer.from('%PDF-other') }],
  ]);
  const pool = { async query(sql, args = []) {
    if (sql.startsWith('SELECT branch,filename,data')) return [[documents.get(args[0])].filter(Boolean)];
    throw new Error('Unexpected SQL: ' + sql);
  } };
  const app = express();
  const requireAdmin = (req, res, next) => req.get('Authorization') ? next() : res.sendStatus(401);
  const route = handler => async (req, res) => { try { await handler(req, res); } catch (error) { res.status(error.status || 500).json({ success: false, message: error.message }); } };
  const admin = async () => ({ id: 1, saka_path: 'computer', can_edit: 1 });
  const allowed = (user, branch) => { if (user.saka_path !== 'all' && user.saka_path !== branch) throw Object.assign(new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลสาขานี้'), { status: 403 }); };
  registerKnowledgeDocuments(app, { pool, route, admin, allowed, branches: { all: 'ส่วนกลาง', computer: 'คอมพิวเตอร์', electrical: 'ไฟฟ้า' }, requireAdmin });
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/admin/knowledge/documents/`;
  const get = id => fetch(base + id + '/file', { headers: { Authorization: 'test' } });
  try {
    assert.equal((await fetch(base + 'own/file')).status, 401);
    const own = await get('own');
    assert.equal(own.status, 200);
    assert.equal(own.headers.get('content-type'), 'application/pdf');
    assert.match(own.headers.get('content-disposition'), /^inline;/);
    assert.equal(own.headers.get('cache-control'), 'no-store');
    assert.equal(Buffer.from(await own.arrayBuffer()).toString(), '%PDF-own');
    assert.equal((await get('shared')).status, 200);
    assert.equal((await get('other')).status, 403);
    assert.equal((await get('missing')).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
