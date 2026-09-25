import test from 'node:test';
import assert from 'node:assert/strict';
import { interestScope } from './interest-scope.js';

test('super admin has full interest scope', () => {
  assert.deepEqual(interestScope({ saka_path: 'all' }), { where: '', values: [] });
});
test('branch admins are restricted by primary major using bound parameters', () => {
  const computer = interestScope({ saka_path: 'computer' });
  assert.deepEqual(computer, { where: 'WHERE major_name = ?', values: ['วิศวกรรมคอมพิวเตอร์'] });
  assert.notDeepEqual(computer, interestScope({ saka_path: 'electrical' }));
  assert.equal(interestScope({ saka_path: 'computer-ai' }).values[0], 'วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์');
});
test('missing, unknown and malicious branch claims cannot see all branches', () => {
  for (const saka_path of [undefined, '', 'ALL', 'unknown', "computer' OR 1=1 --", '__proto__']) {
    assert.equal(interestScope({ saka_path }), null);
  }
  assert.equal(interestScope(null), null);
});
