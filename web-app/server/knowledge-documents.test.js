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
