export function rowType(row) {
  if (['category', 'item', 'total'].includes(row.type)) return row.type;
  if (/^(?:รวม|จำนวนหน่วยกิตรวม|หน่วยกิตรวม)/.test(row.name.trim())) return 'total';
  return /^(?:[0-9๐-๙]+[.)]?\s*)?หมวดวิชา/.test(row.name.trim()) ? 'category' : 'item';
}
export function curriculumTotal(rows) {
  const totals = rows.filter(row => rowType(row) === 'total');
  if (totals.length) return totals.length === 1 ? totals[0].credits || '—' : 'ตรวจสอบยอดรวม';
  // Do not sum both category totals and their children, or partial course lists.
  const categories = rows.filter(row => rowType(row) === 'category');
  if (!categories.length || categories.some(row => !/^\d+$/.test(row.credits))) return '—';
  return String(categories.reduce((sum, row) => sum + Number(row.credits), 0));
}
