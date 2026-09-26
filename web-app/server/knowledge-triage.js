import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const reviewReasons = { not_found: 'ไม่พบข้อมูล', incomplete: 'ข้อมูลไม่ครบ', conflicting: 'ข้อมูลขัดแย้ง', invalid_reference: 'คำตอบอ้างอิงตรวจสอบไม่ผ่าน' };
const parse = value => typeof value === 'string' ? JSON.parse(value) : value;
const norm = value => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
const hash = value => createHash('sha256').update(value).digest('hex');
const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
const stopWords = new Set(['ครับ', 'ค่ะ', 'คะ', 'ไหม', 'อะไร', 'ที่', 'ของ', 'มี', 'เป็น', 'ได้', 'อยาก', 'ทราบ', 'ขอ', 'ให้', 'และ']);
const words = value => new Set([...segmenter.segment(norm(value))].filter(v => v.isWordLike && v.segment.length > 1 && !stopWords.has(v.segment)).map(v => v.segment));

// Lexical retrieval only: scores rank candidates, never certify factual relevance.
export function rankAnswers(rows, query, branch = null) {
  const q = norm(query), queryWords = words(q);
  return rows.filter(row => row.status === 'published' && (!branch || row.branch === branch || row.branch === 'all')).map(row => {
    const metadata = parse(row.metadata) || {}, phrases = [row.question, ...(parse(row.aliases) || [])].map(norm);
    const exact = phrases.includes(q);
    const keywordHits = (metadata.keywords || []).filter(k => k.trim().length > 1 && q.includes(norm(k))).length;
    const overlap = Math.max(0, ...phrases.map(p => { const ws = words(p); return [...queryWords].filter(w => ws.has(w)).length / Math.max(queryWords.size, ws.size, 1); }));
    const score = exact ? 100 : Math.min(95, keywordHits * 20 + Math.round(overlap * 60));
    return { id: row.id, version: row.version, branch: row.branch, category: row.category, question: row.question, answer: row.answer, source: metadata.source || '', academicYear: metadata.academicYear || '', score, match: exact ? 'exact' : 'related' };
  }).filter(row => row.score >= 20).sort((a, b) => b.score - a.score || a.id - b.id).slice(0, 5);
}

export function suggestQuestions(question, others) {
  const a = words(parse(question.triage)?.summary || question.question);
  return others.filter(row => row.id !== question.id && row.branch === question.branch && row.status === 'pending').map(row => {
    const summary = parse(row.triage)?.summary || row.question, b = words(summary);
    return { id: row.id, summary, score: [...a].filter(w => b.has(w)).length / Math.max(a.size, b.size, 1) };
  }).filter(row => row.score >= 0.6).sort((a, b) => b.score - a.score).slice(0, 3);
}

export function signSearch(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}
export function verifySearch(token, secret, eventHash, branch, now = Date.now()) {
  try {
    if (typeof token !== 'string' || token.length > 4000) return null;
    const parts = token.split('.'); if (parts.length !== 2) return null;
    const expected = createHmac('sha256', secret).update(parts[0]).digest();
    const supplied = Buffer.from(parts[1], 'base64url');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    if (payload.eventHash !== eventHash || payload.branch !== branch || !Number.isFinite(payload.expires) || payload.expires < now || !Array.isArray(payload.candidates)) return null;
    return payload;
  } catch { return null; }
}

export function registerKnowledgeTriage(app, { pool, ensure, route, tx, integrationAuth, branches, categories }) {
  const fail = (message, status = 400) => Object.assign(new Error(message), { status });
  const field = (value, max, required = true) => {
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw fail('ข้อมูลข้อความไม่ถูกต้องหรือยาวเกินกำหนด');
    return value.trim();
  };
  const branchValue = value => {
    if (value == null) return null;
    if (typeof value !== 'string' || !Object.hasOwn(branches, value) || ['all', 'unassigned'].includes(value)) throw fail('รหัสสาขาไม่ถูกต้อง');
    return value;
  };
  const authorize = req => {
    if (!integrationAuth(process.env.N8N_KNOWLEDGE_TOKEN, req.get('X-Knowledge-Token'))) throw fail('ไม่ได้รับอนุญาต', 401);
    if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object') throw fail('ต้องส่ง JSON object');
  };
  const publishedRows = async (db, branch) => {
    const [rows] = await db.query(`SELECT id,version,branch,category,question,aliases,answer,metadata,status FROM knowledge_answers WHERE status='published'${branch ? ' AND branch IN (?,?)' : ''} ORDER BY id LIMIT 2001`, branch ? [branch, 'all'] : []);
    return rows;
  };
  app.post('/api/integrations/knowledge/search', route(async (req, res) => {
    authorize(req);
    const query = field(req.body.query, 1000), eventId = field(req.body.eventId, 200), branch = branchValue(req.body.branch);
    await ensure();
    const rows = await publishedRows(pool, branch), truncated = rows.length > 2000;
    const candidates = rankAnswers(rows.slice(0, 2000), query, branch);
    const searchToken = signSearch({ eventHash: hash(eventId), branch, expires: Date.now() + 10 * 60 * 1000, candidates: candidates.map(({ id, version }) => ({ id, version })) }, process.env.N8N_KNOWLEDGE_TOKEN);
    res.json({ success: true, candidates, searchToken, truncated, requiresEvaluation: true });
  }));

  app.post('/api/integrations/line/triage', route(async (req, res) => {
    authorize(req);
    const eventId = field(req.body.eventId, 200), question = field(req.body.question, 1000), branch = branchValue(req.body.branch);
    const decision = req.body.decision;
    if (!['smalltalk', 'clarify', 'answered', 'review', 'service_error'].includes(decision)) throw fail('ผลการคัดกรองไม่ถูกต้อง');
    const category = req.body.category ?? 'ทั่วไป';
    if (!categories.includes(category)) throw fail('ประเภทคำถามไม่ถูกต้อง');
    const summary = field(req.body.summary ?? question, 1000), detail = field(req.body.detail ?? '', 2000, false);
    if (decision === 'review' && !['not_found', 'incomplete', 'conflicting'].includes(req.body.reason)) throw fail('เหตุผลส่งต่อไม่ถูกต้อง');
    const ids = req.body.answerIds ?? [];
    if (!Array.isArray(ids) || ids.length > 5 || ids.some(id => !Number.isSafeInteger(id) || id < 1) || new Set(ids).size !== ids.length) throw fail('รหัสคำตอบไม่ถูกต้อง');
    await ensure();
    const result = await tx(async c => {
      const eventHash = hash(eventId);
      await c.query('INSERT IGNORE INTO knowledge_events (event_hash) VALUES (?)', [eventHash]);
      const [[event]] = await c.query('SELECT result FROM knowledge_events WHERE event_hash=? FOR UPDATE', [eventHash]);
      if (event.result) return { ...parse(event.result), duplicate: true };
      let status = decision, reason = req.body.reason || null, approvedAnswers = [];
      if (decision === 'answered') {
        const proof = verifySearch(req.body.searchToken, process.env.N8N_KNOWLEDGE_TOKEN, eventHash, branch);
        if (proof && ids.length && ids.every(id => proof.candidates.some(candidate => candidate.id === id))) {
          const [current] = await c.query(`SELECT id,version,branch,answer FROM knowledge_answers WHERE status='published' AND id IN (${ids.map(() => '?').join(',')}) FOR SHARE`, ids);
          approvedAnswers = current.filter(row => (!branch || row.branch === branch || row.branch === 'all') && proof.candidates.some(ref => ref.id === row.id && ref.version === row.version)).map(row => ({ id: row.id, answer: row.answer }));
        }
        if (approvedAnswers.length !== ids.length || !ids.length) { status = 'review'; reason = 'invalid_reference'; approvedAnswers = []; }
      }
      let questionId = null;
      if (status === 'review') {
        // Never group on AI summary alone: retain original and context to avoid conflating questions.
        const fingerprint = hash(`triage\n${branch || 'unassigned'}\n${norm(question)}\n${norm(summary)}`);
        const triage = { summary, reason, detail, origin: 'ai_triage' };
        await c.query(`INSERT INTO knowledge_questions (fingerprint,question,branch,category,triage) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE occurrences=occurrences+1,last_seen=CURRENT_TIMESTAMP,version=version+1,answer_id=IF(status='resolved',NULL,answer_id),status=IF(status='resolved','pending',status)`, [fingerprint, question, branch || 'unassigned', category, JSON.stringify(triage)]);
        const [[inbox]] = await c.query('SELECT id FROM knowledge_questions WHERE fingerprint=?', [fingerprint]);
        questionId = inbox.id;
      }
      const response = { status, queued: status === 'review', questionId, duplicate: false, reason: status === 'review' ? reason : null, approvedAnswers, message: status === 'review' ? 'ตอนนี้ยังไม่พบข้อมูลที่เพียงพอสำหรับตอบคำถามนี้ครับ' : status === 'service_error' ? 'ระบบค้นหาข้อมูลขัดข้องชั่วคราว กรุณาลองใหม่ภายหลังครับ' : null };
      // No raw question/user identity/reply token stored for smalltalk, answered, clarify or service_error.
      await c.query('UPDATE knowledge_events SET question_id=?,result=? WHERE event_hash=?', [questionId, JSON.stringify(response), eventHash]);
      return response;
    });
    res.json({ success: true, ...result });
  }));
}
