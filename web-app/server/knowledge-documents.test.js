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
