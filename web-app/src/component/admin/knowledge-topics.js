// Conservative display grouping only; all original rows remain intact.
// Do not collapse on AI summaries alone, which may omit a year, branch or qualification.
export function topicKey(value) {
  return value.normalize('NFC').toLowerCase().trim()
    .replace(/^(สวัสดี(?:ครับ|ค่ะ|คะ)?\s*)/, '')
    .replace(/(?:ครับ|ค่ะ|คะ|นะครับ|นะคะ)[\s!?ๆ]*$/u, '')
    .replace(/^(?:อยากทราบ|ขอทราบ|สอบถาม|อยากรู้)\s*/u, '')
    .replace(/หลักฐาน/g, 'เอกสาร')
    .replace(/ต้องเตรียม/g, 'ต้องใช้')
    .replace(/อะไรบ้าง/g, 'อะไร')
    .replace(/[\s!?ๆ]/g, '');
}

export function groupQuestions(rows) {
  const groups = new Map();
  for (const row of rows.filter(row => row.status === 'pending')) {
    const original = topicKey(row.question);
    // Short contextual follow-ups must keep their full summary context.
    const context = row.triage?.summary ? topicKey(row.triage.summary) : '';
    const key = JSON.stringify([row.branch, row.category, original, context]);
    let group = groups.get(key);
    if (!group) {
      group = { key, branch: row.branch, category: row.category, title: row.triage?.summary || row.question, rows: [], occurrences: 0 };
      groups.set(key, group);
    }
    group.rows.push(row);
    group.occurrences += Number(row.occurrences) || 1;
  }
  return [...groups.values()];
}
