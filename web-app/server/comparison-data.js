// Exact-name matching only. Counts are name groups, not verified identities.
const title = /^(?:นางสาว|นาย|นาง|เด็กชาย|เด็กหญิง|ด\.?ช\.?|ด\.?ญ\.?|Mr\.?|Mrs\.?|Ms\.?)\s*/iu;
export function normalizeName(value) {
  const name = String(value || '').normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(title, '').replace(/\s+/g, ' ');
  if (/^(?:ไม่ระบุ(?:ชื่อ)?|anonymous|unknown|-)?$/iu.test(name)) return null;
  const parts = name.split(' ');
  if (parts.length < 2 || parts.length > 5 || parts.some(p => !/^[\p{L}\p{M}'’-]{2,}$/u.test(p))) return null;
  return name.toLocaleLowerCase('th-TH');
}

export function extractNames(pages) {
  const rows = []; const unresolved = [];
  for (const page of pages) {
    for (const raw of page.text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      // Only explicit title-led or numbered table rows qualify as candidates.
      const titled = /(?:^|\s)(?:นางสาว|นาย|นาง|เด็กชาย|เด็กหญิง|ด\.?ช\.?|ด\.?ญ\.?|Mr\.?|Mrs\.?|Ms\.?)\s*[\p{L}\p{M}]/iu.exec(line);
      const numbered = /^\d+[.)]?\s+/.test(line);
      if (!titled && !numbered) continue;
      let candidate = titled ? line.slice(titled.index).trim() : line.replace(/^\d+[.)]?\s+(?:\d{4,}\s+)?/, '');
      // pdftotext -layout keeps column gaps; don't treat school/branch columns as names.
      candidate = candidate.replace(title, '');
      const cells = candidate.split(/\s{2,}|\t|\s\d/).filter(Boolean);
      candidate = cells[0]?.trim() || '';
      if (!candidate.includes(' ') && cells[1] && /^[\p{L}\p{M}'’-]+$/u.test(cells[1].trim())) candidate += ` ${cells[1].trim()}`;
      const key = normalizeName(candidate);
      const reason = !key ? 'รูปแบบชื่อไม่ชัดเจน' : page.ocr ? 'อ่านด้วย OCR ยังไม่ยืนยันชื่อ' : null;
      if (reason) unresolved.push({ page: page.number, text: line.slice(0, 180), reason });
      else rows.push({ name: candidate, key, page: page.number });
    }
  }
  return { rows, unresolved };
}

function groups(rows, nameField) {
  const map = new Map(); let excluded = 0;
  for (const row of rows) {
    const key = normalizeName(row[nameField]);
    if (!key) { excluded++; continue; }
    const group = map.get(key) || { name: row[nameField], records: 0 };
    group.records++; map.set(key, group);
  }
  return { map, excluded, records: rows.length };
}

function similar(a, b) {
  // Conservative typo flag, never automatically merge fuzzy names.
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

export function compareNames(visitors, interested, extracted) {
  const v = groups(visitors, 'name'); const i = groups(interested, 'name');
  const passed = groups(extracted.rows, 'name');
  const systemKeys = [...new Set([...v.map.keys(), ...i.map.keys()])];
  const byFirst = new Map();
  for (const key of systemKeys) { const group = byFirst.get(key[0]) || []; group.push(key); byFirst.set(key[0], group); }
  let inSystem = 0, notFound = 0, uncertain = 0, interestedPassed = 0, visitorPassed = 0, fullPath = 0;
  const people = [...passed.map.entries()].map(([key, group]) => {
    const visitor = v.map.has(key), interest = i.map.has(key);
    const possible = !visitor && !interest && (byFirst.get(key[0]) || []).some(other => similar(key, other));
    const state = visitor || interest ? 'matched' : possible ? 'uncertain' : 'notFound';
    if (state === 'matched') inSystem++; else if (state === 'uncertain') uncertain++; else notFound++;
    if (interest) interestedPassed++; if (visitor) visitorPassed++; if (visitor && interest) fullPath++;
    return { name: group.name, visitor, interested: interest, state, sourceRows: group.records };
  });
  const visitorInterested = [...v.map.keys()].filter(key => i.map.has(key)).length;
  const metric = (numerator, denominator) => ({ numerator, denominator, percent: denominator ? Number((numerator / denominator * 100).toFixed(1)) : null });
  return {
    counts: { visitors: v.map.size, interested: i.map.size, passed: passed.map.size, inSystem, notFound, uncertain, visitorInterested, visitorPassed, interestedPassed, fullPath },
    excluded: { visitors: v.excluded, interested: i.excluded, pdf: extracted.unresolved.length },
    records: { visitors: v.records, interested: i.records, pdf: extracted.rows.length },
    metrics: { visitorToInterest: metric(visitorInterested, v.map.size), interestToPass: metric(interestedPassed, i.map.size), visitorToPass: metric(fullPath, v.map.size), outside: metric(notFound, passed.map.size) },
    people, unresolved: extracted.unresolved,
  };
}
