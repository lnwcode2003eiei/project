export const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const iso = (date) => date.toISOString().slice(0, 10);
export function visitBarLink(key) {
  const start = key.length === 7 ? `${key}-01` : key;
  const end = new Date(`${start}T00:00:00Z`);
  if (key.length === 7) end.setUTCMonth(end.getUTCMonth() + 1);
  else end.setUTCDate(end.getUTCDate() + 1);
  return `/admin/visitors?start=${start}&end=${iso(end)}`;
}
export function visitRange(mode, selected) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selected)) return null;
  const start = new Date(`${selected}T00:00:00Z`);
  if (!Number.isFinite(start.getTime()) || iso(start) !== selected || start.getUTCFullYear() < 1900 || start.getUTCFullYear() > 9998) return null;
  if (mode === 'year') start.setUTCMonth(0, 1);
  else if (mode === 'month') start.setUTCDate(1);
  else start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  const end = new Date(start);
  if (mode === 'year') end.setUTCFullYear(end.getUTCFullYear() + 1);
  else if (mode === 'month') end.setUTCMonth(end.getUTCMonth() + 1);
  else end.setUTCDate(end.getUTCDate() + 7);
  return { start: iso(start), end: iso(end), last: iso(new Date(end.getTime() - 86400000)) };
}
export function visitBars(mode, range, rows) {
  if (!range) return [];
  const buckets = new Map();
  for (const row of rows) {
    if (row.day < range.start || row.day >= range.end) continue;
    const key = mode === 'year' ? row.day.slice(0, 7) : row.day;
    buckets.set(key, (buckets.get(key) || 0) + Number(row.total || 0));
  }
  const bars = [];
  for (const day = new Date(`${range.start}T00:00:00Z`); iso(day) < range.end;) {
    const key = mode === 'year' ? iso(day).slice(0, 7) : iso(day);
    bars.push({ key, label: mode === 'year' ? monthNames[day.getUTCMonth()] : mode === 'week' ? ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'][day.getUTCDay()] : String(day.getUTCDate()), value: buckets.get(key) || 0 });
    if (mode === 'year') day.setUTCMonth(day.getUTCMonth() + 1);
    else day.setUTCDate(day.getUTCDate() + 1);
  }
  return bars;
}
