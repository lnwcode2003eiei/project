import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUploadFilename } from './upload-filename.js';
test('repairs Thai multipart filenames and preserves original names', () => {
  for (const name of ['รายชื่อผู้สอบผ่าน-55-67.pdf', 'ทดสอบ.pdf', 'file.pdf', 'café.pdf']) {
    assert.equal(normalizeUploadFilename(name), name);
    assert.equal(normalizeUploadFilename(Buffer.from(name, 'utf8').toString('latin1')), name);
  }
  assert.equal(normalizeUploadFilename('broken-ÿ.pdf'), 'broken-ÿ.pdf');
});
