import test from 'node:test';
import assert from 'node:assert/strict';
import { rankDocuments } from './knowledge-documents.js';

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
