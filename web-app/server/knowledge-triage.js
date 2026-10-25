import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { rankDocuments } from './knowledge-documents.js';

const MAX_DOCUMENT_REFERENCES = 50;
const MAX_CURRICULUM_CONTEXT = 15000;
const curriculumIdPattern = /^curriculum:([a-z0-9-]{1,50}):([1-9]\d*)$/;
const curriculumSlugs = {
  computer: ['computer'],
  'computer-ai': ['computer-ai', 'computerAI'],
  construction: ['construction'],
  digital: ['digital'],
  electrical: ['electrical'],
  energy: ['energy'],
  industrial: ['industrial'],
  logistics: ['logistics'],
  management: ['management'],
  survey: ['survey'],
};
const curriculumPagePaths = { 'computer-ai': 'computerAI' };

export const isStudyPlanQuestion = query =>
  /(?:เรียน(?:วิชา)?อะไร|มีวิชาอะไร|วิชาอะไรบ้าง|รายวิชา|แผนการเรียน|โครงสร้างหลักสูตร|รหัสวิชา|หน่วยกิต)/i.test(norm(query));

export function curriculumDocumentId(branch, version) {
  if (!Object.hasOwn(curriculumSlugs, branch) || !Number.isSafeInteger(Number(version)) || Number(version) < 1) return null;
  return `curriculum:${branch}:${Number(version)}`;
}

export function parseCurriculumDocumentId(id) {
  if (typeof id !== 'string') return null;
  const match = curriculumIdPattern.exec(id);
  if (!match || !Object.hasOwn(curriculumSlugs, match[1])) return null;
  const version = Number(match[2]);
  return Number.isSafeInteger(version) ? { branch: match[1], version } : null;
}

const publicCourseUrl = branch => {
  const base = String(process.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
  return base ? `${base}/${curriculumPagePaths[branch] || branch}#course-curriculum` : '';
};

export function curriculumDocument(row, branch, branchName) {
  const content = parse(row?.content) || {};
  const courses = Array.isArray(content.rows)
    ? content.rows.filter(item => item && /^\d{6,8}$/.test(String(item.code || '')) && typeof item.name === 'string' && item.name.trim() && typeof item.credits === 'string' && item.credits.trim())
    : [];
  const id = curriculumDocumentId(branch, Number(row?.version));
  if (!id || !courses.length) return null;
  const source = publicCourseUrl(branch);
  const heading = [
    `COURSE_PLAN_ID: ${id}`,
    `หลักสูตร: ${String(content.title || branchName || '').trim()}`,
    content.year ? `ปีหลักสูตร: ${String(content.year).trim()}` : '',
    'รายการรายวิชาที่เผยแพร่บนเว็บไซต์ (รหัสวิชา | ชื่อวิชา | หน่วยกิต)',
  ].filter(Boolean);
  const lines = courses.map(item => `${item.code} | ${item.name.trim()} | ${item.credits.trim()} หน่วยกิต`);
  if (source) lines.push(`ดูแผนการเรียนบนเว็บไซต์: ${source}`);
  const fullExcerpt = [...heading, ...lines].join('\n');
  const excerpt = fullExcerpt.length <= MAX_CURRICULUM_CONTEXT
    ? fullExcerpt
    : `${fullExcerpt.slice(0, MAX_CURRICULUM_CONTEXT - 120)}\n[รายการยาวเกินบริบท โปรดดูรายการต่อในหน้าเว็บไซต์]${source ? `\n${source}` : ''}`;
  return {
    id,
    branch,
    type: 'แผนการเรียน',
    title: String(content.title || `แผนการเรียน${branchName || branch}`).trim(),
    filename: 'ข้อมูลแผนการเรียนที่เผยแพร่บนเว็บไซต์',
    excerpt,
    source,
    version: Number(row.version),
    courseCount: courses.length,
    truncated: excerpt.length < fullExcerpt.length,
  };
}

export function validDocumentIds(ids) {
  return Array.isArray(ids) && ids.length <= MAX_DOCUMENT_REFERENCES
    && ids.every(id => typeof id === 'string' && (/^[0-9a-f-]{36}$/i.test(id) || parseCurriculumDocumentId(id)))
    && new Set(ids).size === ids.length;
}

export const reviewReasons = { not_found: 'ไม่พบข้อมูล', incomplete: 'ข้อมูลไม่ครบ', conflicting: 'ข้อมูลขัดแย้ง', invalid_reference: 'คำตอบอ้างอิงตรวจสอบไม่ผ่าน' };
const parse = value => typeof value === 'string' ? JSON.parse(value) : value;
const norm = value => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
const hash = value => createHash('sha256').update(value).digest('hex');
const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
const stopWords = new Set(['ครับ', 'ค่ะ', 'คะ', 'ไหม', 'อะไร', 'ที่', 'ของ', 'มี', 'เป็น', 'ได้', 'อยาก', 'ทราบ', 'ขอ', 'ให้', 'และ']);
const words = value => new Set([...segmenter.segment(norm(value))].filter(v => v.isWordLike && v.segment.length > 1 && !stopWords.has(v.segment)).map(v => v.segment));
const isCatalogQuestion = query => /(?:มี.*(?:สาขา|หลักสูตร)|(?:สาขา|หลักสูตร).*อะไร|(?:สาขา|หลักสูตร).*เปิดสอน|เปิดสอน.*(?:สาขา|หลักสูตร))/.test(norm(query));
export const replyForEvent = (systemMessage, proposedReply) => proposedReply || systemMessage || null;

// Keep the existing n8n mapping (approvedAnswers[].answer) compatible.
export function approvedReply(row) {
  const metadata = parse(row.metadata) || {};
  let source = typeof metadata.source === 'string' ? metadata.source.trim() : '';
  try {
    const url = new URL(source);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) source = '';
  } catch { source = ''; }
  const answer = source && !row.answer.includes(source)
    ? `${row.answer}\n\nข้อมูลเพิ่มเติม: ${source}` : row.answer;
  return { id: row.id, answer, source };
}

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
    if (payload.eventHash !== eventHash || payload.branch !== branch || !Number.isFinite(payload.expires) || payload.expires < now || !Array.isArray(payload.candidates) || (payload.documents !== undefined && !Array.isArray(payload.documents))) return null;
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
  const publishedCurriculum = async (db, branch) => {
    if (!branch || !Object.hasOwn(curriculumSlugs, branch)) return null;
    const slugs = curriculumSlugs[branch];
    try {
      const [rows] = await db.query(
        `SELECT slug,file_id,content,version FROM curriculum_pdf_publications WHERE slug IN (${slugs.map(() => '?').join(',')})`,
        slugs,
      );
      const row = slugs.map(slug => rows.find(item => item.slug === slug)).find(Boolean);
      return row ? curriculumDocument(row, branch, branches[branch]) : null;
    } catch (error) {
      // A fresh installation may not have published a curriculum yet.
      if (error?.code === 'ER_NO_SUCH_TABLE') return null;
      throw error;
    }
  };
  app.post('/api/integrations/knowledge/search', route(async (req, res) => {
    authorize(req);
    const query = field(req.body.query, 1000), eventId = field(req.body.eventId, 200), branch = branchValue(req.body.branch);
    await ensure();
    const rows = await publishedRows(pool, branch), truncated = rows.length > 2000;
    const candidates = rankAnswers(rows.slice(0, 2000), query, branch);
    const [documents] = await pool.query(
      branch
        ? `SELECT id,branch,type,title,filename,extracted_text,updated_at FROM knowledge_documents WHERE branch IN (?,?) ORDER BY updated_at DESC LIMIT 250`
        : `SELECT id,branch,type,title,filename,extracted_text,updated_at FROM knowledge_documents WHERE branch <> 'unassigned' ORDER BY updated_at DESC LIMIT 250`,
      branch ? [branch, 'all'] : [],
    );
    const [documentedBranchRows] = await pool.query("SELECT DISTINCT branch FROM knowledge_documents WHERE branch NOT IN ('all','unassigned') ORDER BY branch");
    const documentedBranches = documentedBranchRows
      .filter(row => Object.hasOwn(branches, row.branch))
      .map(row => ({ code: row.branch, name: branches[row.branch] }));
    // A catalogue question needs enough results to enumerate the available
    // documents. Specific questions stay small so the AI receives focused text.
    const catalogue = isCatalogQuestion(query);
    const rankedDocuments = rankDocuments(documents, query, catalogue ? MAX_DOCUMENT_REFERENCES : 10);
    const studyPlanDocument = isStudyPlanQuestion(query) ? await publishedCurriculum(pool, branch) : null;
    const documentCandidates = studyPlanDocument
      ? [studyPlanDocument, ...rankedDocuments.filter(row => row.id !== studyPlanDocument.id)].slice(0, MAX_DOCUMENT_REFERENCES)
      : rankedDocuments;
    const searchToken = signSearch({ eventHash: hash(eventId), branch, expires: Date.now() + 10 * 60 * 1000, candidates: candidates.map(({ id, version }) => ({ id, version })), documents: documentCandidates.map(({ id }) => id) }, process.env.N8N_KNOWLEDGE_TOKEN);
    const aiContext = [
      ...candidates.slice(0, 3).map(row => `คำตอบที่เผยแพร่แล้ว: ${row.answer}`),
      ...documentCandidates.slice(0, catalogue ? 20 : 5).map(row => row.type === 'แผนการเรียน'
        ? `แผนการเรียนที่เผยแพร่บนเว็บไซต์: ${row.title} (${row.branch})\n${row.excerpt}`
        : `เอกสาร: ${row.title} (${row.type}, ${row.branch})\n${row.excerpt.slice(0, catalogue ? 900 : 2500)}`),
    ].join('\n\n---\n\n');
    res.json({
      success: true,
      organization: { faculty: 'คณะเทคโนโลยีอุตสาหกรรม', university: 'มหาวิทยาลัยราชภัฏอุตรดิตถ์' },
      documentedBranches,
      candidates,
      documents: documentCandidates,
      catalogue,
      studyPlan: Boolean(studyPlanDocument),
      aiContext,
      searchToken,
      truncated,
      requiresEvaluation: true,
    });
  }));

  app.post('/api/integrations/line/triage', route(async (req, res) => {
    authorize(req);
    const eventId = field(req.body.eventId, 200), question = field(req.body.question, 1000), branch = branchValue(req.body.branch);
    const decision = req.body.decision;
    if (!['smalltalk', 'clarify', 'answered', 'review', 'service_error'].includes(decision)) throw fail('ผลการคัดกรองไม่ถูกต้อง');
    const category = req.body.category ?? 'ทั่วไป';
    if (!categories.includes(category)) throw fail('ประเภทคำถามไม่ถูกต้อง');
    const summary = field(req.body.summary ?? question, 1000), detail = field(req.body.detail ?? '', 2000, false);
    const proposedReply = field(req.body.reply ?? '', 4000, false);
    if (decision === 'review' && !['not_found', 'incomplete', 'conflicting'].includes(req.body.reason)) throw fail('เหตุผลส่งต่อไม่ถูกต้อง');
    const ids = req.body.answerIds ?? [], documentIds = req.body.documentIds ?? [];
    if (!Array.isArray(ids) || ids.length > 5 || ids.some(id => !Number.isSafeInteger(id) || id < 1) || new Set(ids).size !== ids.length) throw fail('รหัสคำตอบไม่ถูกต้อง');
    if (!validDocumentIds(documentIds)) throw fail('รหัสเอกสารไม่ถูกต้อง: ต้องเป็น array ของรหัสเอกสาร ไม่ซ้ำ และไม่เกิน 50 รายการ');
    await ensure();
    const result = await tx(async c => {
      const eventHash = hash(eventId);
      await c.query('INSERT IGNORE INTO knowledge_events (event_hash) VALUES (?)', [eventHash]);
      const [[event]] = await c.query('SELECT result FROM knowledge_events WHERE event_hash=? FOR UPDATE', [eventHash]);
      if (event.result) return { ...parse(event.result), duplicate: true };
      let status = decision, reason = req.body.reason || null, approvedAnswers = [], approvedDocuments = [];
      if (decision === 'answered') {
        const proof = verifySearch(req.body.searchToken, process.env.N8N_KNOWLEDGE_TOKEN, eventHash, branch);
        if (proof && ids.length && ids.every(id => proof.candidates.some(candidate => candidate.id === id))) {
          const [current] = await c.query(`SELECT id,version,branch,answer,metadata FROM knowledge_answers WHERE status='published' AND id IN (${ids.map(() => '?').join(',')}) FOR SHARE`, ids);
          approvedAnswers = current.filter(row => (!branch || row.branch === branch || row.branch === 'all') && proof.candidates.some(ref => ref.id === row.id && ref.version === row.version)).map(approvedReply);
        }
        if (proof && documentIds.length && documentIds.every(id => proof.documents?.includes(id))) {
          const pdfIds = documentIds.filter(id => !parseCurriculumDocumentId(id));
          if (pdfIds.length) {
            const [current] = await c.query(`SELECT id,branch,type,title,filename,updated_at FROM knowledge_documents WHERE id IN (${pdfIds.map(() => '?').join(',')}) FOR SHARE`, pdfIds);
            approvedDocuments = current.filter(row => (!branch || row.branch === branch || row.branch === 'all') && proof.documents.includes(row.id)).map(({ id, branch: documentBranch, type, title, filename, updated_at: updatedAt }) => ({ id, branch: documentBranch, type, title, filename, updatedAt }));
          }
          for (const id of documentIds.filter(value => parseCurriculumDocumentId(value))) {
            const ref = parseCurriculumDocumentId(id);
            if (!ref || ref.branch !== branch) continue;
            const current = await publishedCurriculum(c, ref.branch);
            if (!current || current.id !== id || current.version !== ref.version) continue;
            approvedDocuments.push({
              id: current.id,
              branch: current.branch,
              type: current.type,
              title: current.title,
              filename: current.filename,
              updatedAt: null,
              source: current.source,
              version: current.version,
              courseCount: current.courseCount,
            });
          }
        }
        const answerProof = ids.length > 0 && approvedAnswers.length === ids.length;
        const documentProof = documentIds.length > 0 && approvedDocuments.length === documentIds.length;
        if (!answerProof && !documentProof) { status = 'review'; reason = 'invalid_reference'; approvedAnswers = []; approvedDocuments = []; }
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
      const response = { status, queued: status === 'review', questionId, duplicate: false, reason: status === 'review' ? reason : null, approvedAnswers, approvedDocuments, message: status === 'review' ? 'ตอนนี้ยังไม่พบข้อมูลที่เพียงพอสำหรับตอบคำถามนี้ครับ' : status === 'service_error' ? 'ระบบค้นหาข้อมูลขัดข้องชั่วคราว กรุณาลองใหม่ภายหลังครับ' : null };
      response.reply = replyForEvent(response.message, proposedReply);
      // Store message text for the private Admin dashboard only; never store LINE user/reply identifiers.
      await c.query('INSERT IGNORE INTO knowledge_line_messages (event_hash,message,branch,category,decision,summary) VALUES (?,?,?,?,?,?)', [eventHash, question, branch || 'unassigned', category, status, summary]);
      // Never store LINE user identity, reply token, or any other LINE event metadata.
      await c.query('UPDATE knowledge_events SET question_id=?,result=? WHERE event_hash=?', [questionId, JSON.stringify(response), eventHash]);
      return response;
    });
    res.json({ success: true, ...result });
  }));
}
