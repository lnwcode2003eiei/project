import test from 'node:test';
import assert from 'node:assert/strict';
import { validRange, registerVisitorStatistics } from './visitor-statistics.js';
import { visitRange, visitBars, visitBarLink } from '../src/component/admin/visitChart.js';

test('bar links use exact exclusive month/day boundaries including leap day and year rollover', () => {
  assert.equal(visitBarLink('2026-09'), '/admin/visitors?start=2026-09-01&end=2026-10-01');
  assert.equal(visitBarLink('2026-12'), '/admin/visitors?start=2026-12-01&end=2027-01-01');
  assert.equal(visitBarLink('2024-02-29'), '/admin/visitors?start=2024-02-29&end=2024-03-01');
  assert.equal(visitBarLink('2026-12-31'), '/admin/visitors?start=2026-12-31&end=2027-01-01');
});

test('calendar ranges: leap month, year and Monday week crossing years', () => {
  assert.deepEqual(visitRange('month', '2024-02-18'), { start: '2024-02-01', end: '2024-03-01', last: '2024-02-29' });
  assert.deepEqual(visitRange('week', '2025-01-01'), { start: '2024-12-30', end: '2025-01-06', last: '2025-01-05' });
  assert.equal(visitRange('year', '2024-09-24').end, '2025-01-01');
  assert.equal(visitRange('year', '2024-02-31'), null);
});
test('zero fill, period sums and exclusion of next boundary', () => {
  const range = visitRange('year', '2024-01-01');
  const rows = [{ day: '2024-02-01', total: 2 }, { day: '2024-02-29', total: 3 }, { day: '2025-01-01', total: 8 }];
  const bars = visitBars('year', range, rows);
  assert.equal(bars.length, 12);
  assert.equal(bars[1].value, 5);
  assert.equal(bars[0].value, 0);
  assert.equal(visitBars('month', visitRange('month', '2024-02-01'), rows).length, 29);
  assert.equal(visitBars('week', visitRange('week', '2025-01-01'), []).length, 7);
});
test('validates date input and limits range', () => {
  assert.equal(validRange('2024-01-01', '2025-01-01'), true);
  for (const [start, end] of [['2024-02-31', '2024-03-04'], ['2024-01-01', '2026-01-01'], ['2024-01-01', '2024-01-01'], ["' OR 1=1", '2025-01-01'], [[], '2025-01-01']]) assert.equal(validRange(start, end), false);
});
test('endpoint requires admin and uses bounded parameterized query', () => {
  let handler;
  const auth = () => {};
  const app = { get(path, middleware, fn) { assert.equal(path, '/api/admin/dashboard/visits'); assert.equal(middleware, auth); handler = fn; } };
  let calls = 0;
  const db = { query(sql, params, cb) { calls++; assert.match(sql, /created_at >= \? AND created_at < \?/); assert.deepEqual(params, ['2024-01-01', '2025-01-01']); cb(null, [{ day: '2024-02-01', total: 2 }]); } };
  registerVisitorStatistics(app, db, auth);
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  handler({ query: { start: 'invalid', end: '2025-01-01' } }, res);
  assert.equal(res.code, 400); assert.equal(calls, 0);
  handler({ query: { start: '2024-01-01', end: '2025-01-01' } }, res);
  assert.equal(res.body.data[0].total, 2); assert.equal(calls, 1);
});
