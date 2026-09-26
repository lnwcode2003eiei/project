import { createHash, timingSafeEqual } from 'node:crypto';
import { registerKnowledgeTriage, reviewReasons, suggestQuestions } from './knowledge-triage.js';

export const branches = { all: 'ข้อมูลส่วนกลาง', unassigned: 'ยังไม่ระบุสาขา', computer: 'วิศวกรรมคอมพิวเตอร์', 'computer-ai': 'วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์', construction: 'วิศวกรรมบริหารงานก่อสร้าง', digital: 'เทคโนโลยีดิจิทัลเพื่อการออกแบบ', electrical: 'เทคโนโลยีไฟฟ้า', energy: 'วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม', industrial: 'เทคโนโลยีอุตสาหการ', logistics: 'วิศวกรรมโลจิสติกส์', management: 'การจัดการงานวิศวกรรม', survey: 'เทคโนโลยีสำรวจและภูมิสารสนเทศ' };
export const categories = ['ทั่วไป', 'หลักสูตร', 'คุณสมบัติผู้เรียน', 'ค่าใช้จ่าย', 'อาชีพหลังเรียนจบ', 'การติดต่อ', 'ข่าวสาร', 'การรับสมัคร', 'สาขาวิชา', 'ติดต่อ', 'ข้อมูลคณะ', 'คุณสมบัติ', 'เอกสาร'];
export const normalize = value => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
const hash = value => createHash('sha256').update(value).digest('hex');
const parse = value => typeof value === 'string' ? JSON.parse(value) : value;
const fail = (status, message) => Object.assign(new Error(message), { status });
const text = (value, max, required = true) => {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw fail(400, 'ข้อมูลข้อความไม่ถูกต้องหรือยาวเกินกำหนด');
  return value.trim();
};
export function validateAnswer(input) {
  const { branch, category, status } = input;
  if (!Object.hasOwn(branches, branch) || branch === 'unassigned' || !categories.includes(category) || !['draft', 'published', 'disabled'].includes(status)) throw fail(400, 'สาขา ประเภท หรือสถานะไม่ถูกต้อง');
  if (!Array.isArray(input.aliases) || input.aliases.length > 30) throw fail(400, 'คำถามใกล้เคียงได้ไม่เกิน 30 ข้อ');
  const metadata = input.metadata || {};
  if (!Array.isArray(metadata.keywords ?? []) || (metadata.keywords?.length || 0) > 50) throw fail(400, 'คีย์เวิร์ดได้ไม่เกิน 50 คำ');
  const source = text(metadata.source ?? '', 2000, false);
  if (source) { try { if (!['http:', 'https:'].includes(new URL(source).protocol)) throw new Error(); } catch { throw fail(400, 'แหล่งอ้างอิงต้องเป็น URL http หรือ https'); } }
  return { branch, category, status, question: text(input.question, 1000), answer: text(input.answer, 10000, status === 'published'), aliases: [...new Set(input.aliases.map(item => text(item, 1000)))], metadata: { keywords: [...new Set((metadata.keywords ?? []).map(item => text(item, 100)))], academicYear: text(metadata.academicYear ?? '', 20, false), source, notes: text(metadata.notes ?? '', 10000, false) } };
}
export function chooseAnswer(rows, question, branch) {
  const matches = rows.filter(row => row.status === 'published' && (!branch || row.branch === branch || row.branch === 'all') && [row.question, ...parse(row.aliases)].some(value => normalize(value) === normalize(question)));
  // Never guess between conflicting answers or multiple branches.
  if (matches.length === 1) return { status: 'answered', answer: matches[0] };
  return { status: matches.length ? 'clarify' : 'pending', answer: null };
}
export function integrationAuth(expected, supplied) {
  if (!expected || expected.length < 32 || typeof supplied !== 'string') return false;
  const a = Buffer.from(expected), b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function ensureKnowledgeSchema(pool) {
    for (const sql of [
      `CREATE TABLE IF NOT EXISTS knowledge_answers (id INT AUTO_INCREMENT PRIMARY KEY, branch VARCHAR(50) NOT NULL, category VARCHAR(80) NOT NULL, question VARCHAR(1000) NOT NULL, aliases JSON NOT NULL, answer TEXT NOT NULL, status VARCHAR(20) NOT NULL, version INT NOT NULL DEFAULT 1, updated_by INT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX(status,branch)) ENGINE=InnoDB CHARACTER SET utf8mb4`,
      `CREATE TABLE IF NOT EXISTS knowledge_history (id INT AUTO_INCREMENT PRIMARY KEY, answer_id INT NOT NULL, snapshot JSON NOT NULL, changed_by INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(answer_id)) ENGINE=InnoDB CHARACTER SET utf8mb4`,
      `CREATE TABLE IF NOT EXISTS knowledge_questions (id INT AUTO_INCREMENT PRIMARY KEY, fingerprint CHAR(64) NOT NULL UNIQUE, question VARCHAR(1000) NOT NULL, branch VARCHAR(50) NOT NULL, category VARCHAR(80) NOT NULL DEFAULT 'ทั่วไป', status VARCHAR(20) NOT NULL DEFAULT 'pending', answer_id INT NULL, occurrences INT NOT NULL DEFAULT 1, version INT NOT NULL DEFAULT 1, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(branch,status)) ENGINE=InnoDB CHARACTER SET utf8mb4`,
      `CREATE TABLE IF NOT EXISTS knowledge_events (event_hash CHAR(64) PRIMARY KEY, question_id INT NULL, result JSON NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB CHARACTER SET utf8mb4`,
    ]) await pool.query(sql);
    try { await pool.query('ALTER TABLE knowledge_answers ADD COLUMN metadata JSON NULL'); }
    catch (error) { if (error.code !== 'ER_DUP_FIELDNAME') throw error; }
    try { await pool.query('ALTER TABLE knowledge_questions ADD COLUMN triage JSON NULL'); }
    catch (error) { if (error.code !== 'ER_DUP_FIELDNAME') throw error; }
}
export function registerKnowledge(app, db, requireAdmin) {
  const pool = db.promise();
  let ready;
  const ensure = () => ready ??= ensureKnowledgeSchema(pool).catch(error => { ready = undefined; throw error; });
  const route = handler => async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try { await handler(req, res); } catch (error) { if (!error.status) console.error('Knowledge request failed:', error.code || 'internal'); res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'ระบบคลังคำตอบขัดข้อง กรุณาลองใหม่' }); }
  };
  const admin = async (req, write = false) => {
    const [[user]] = await pool.query('SELECT id, saka_path, can_edit FROM users WHERE id = ?', [req.admin.sub]);
    if (!user || !Object.hasOwn(branches, user.saka_path) || user.saka_path === 'unassigned' || (write && Number(user.can_edit) !== 1)) throw fail(403, 'ไม่มีสิทธิ์จัดการข้อมูลนี้');
    await ensure(); return user;
  };
  const allowed = (user, branch) => { if (user.saka_path !== 'all' && user.saka_path !== branch) throw fail(403, 'ไม่มีสิทธิ์เข้าถึงข้อมูลสาขานี้'); };
  const tx = async fn => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const value = await fn(connection); await connection.commit(); return value; }
      catch (error) {
        await connection.rollback();
        if (error.code !== 'ER_LOCK_DEADLOCK' || attempt === 2) throw error;
      } finally { connection.release(); }
    }
  };
  registerKnowledgeTriage(app, { pool, ensure, route, tx, integrationAuth, branches, categories });
  app.get('/api/admin/knowledge', requireAdmin, route(async (req, res) => {
    const user = await admin(req);
    const scope = user.saka_path === 'all' ? '' : ' WHERE branch = ?';
    const args = scope ? [user.saka_path] : [];
    const [answers] = await pool.query(`SELECT * FROM knowledge_answers${scope} ORDER BY updated_at DESC LIMIT 1000`, args);
    const [questions] = await pool.query(`SELECT * FROM knowledge_questions${scope} ORDER BY last_seen DESC LIMIT 1000`, args);
    res.json({ success: true, answers: answers.map(row => ({ ...row, aliases: parse(row.aliases), metadata: parse(row.metadata) || {} })), questions: questions.map(row => ({ ...row, triage: parse(row.triage) || null })), branches, categories, reviewReasons, scope: user.saka_path, canEdit: Number(user.can_edit) === 1, limit: 1000 });
  }));
  app.post('/api/admin/knowledge/answers', requireAdmin, route(async (req, res) => {
    const user = await admin(req, true), value = validateAnswer(req.body); allowed(user, value.branch);
    const id = await tx(async c => {
      const [created] = await c.query('INSERT INTO knowledge_answers (branch,category,question,aliases,answer,metadata,status,updated_by) VALUES (?,?,?,?,?,?,?,?)', [value.branch, value.category, value.question, JSON.stringify(value.aliases), value.answer, JSON.stringify(value.metadata), value.status, user.id]);
      await c.query('INSERT INTO knowledge_history (answer_id,snapshot,changed_by) VALUES (?,?,?)', [created.insertId, JSON.stringify({ ...value, version: 1 }), user.id]); return created.insertId;
    }); res.status(201).json({ success: true, id });
  }));
  app.get('/api/admin/knowledge/questions/:id/similar', requireAdmin, route(async (req, res) => {
    const user = await admin(req);
    const [[question]] = await pool.query('SELECT * FROM knowledge_questions WHERE id=?', [req.params.id]);
    if (!question) throw fail(404, 'ไม่พบคำถาม'); allowed(user, question.branch);
    const [others] = await pool.query("SELECT id,question,branch,status,triage FROM knowledge_questions WHERE branch=? AND status='pending' ORDER BY last_seen DESC LIMIT 1000", [question.branch]);
    res.json({ success: true, data: suggestQuestions(question, others) });
  }));
  app.put('/api/admin/knowledge/answers/:id', requireAdmin, route(async (req, res) => {
    const user = await admin(req, true), value = validateAnswer(req.body); allowed(user, value.branch);
    await tx(async c => {
      const [[old]] = await c.query('SELECT * FROM knowledge_answers WHERE id = ? FOR UPDATE', [req.params.id]);
      if (!old) throw fail(404, 'ไม่พบคำตอบ'); allowed(user, old.branch);
      if (old.version !== req.body.version) throw fail(409, 'มีผู้แก้ไขข้อมูลแล้ว กรุณาโหลดใหม่');
      if (old.branch !== value.branch) throw fail(400, 'เปลี่ยนสาขาคำตอบเดิมไม่ได้ กรุณาสร้างรายการใหม่');
      await c.query('UPDATE knowledge_answers SET category=?,question=?,aliases=?,answer=?,metadata=?,status=?,version=version+1,updated_by=? WHERE id=?', [value.category, value.question, JSON.stringify(value.aliases), value.answer, JSON.stringify(value.metadata), value.status, user.id, old.id]);
      await c.query('INSERT INTO knowledge_history (answer_id,snapshot,changed_by) VALUES (?,?,?)', [old.id, JSON.stringify({ ...value, version: old.version + 1 }), user.id]);
      if (value.status !== 'published') await c.query("UPDATE knowledge_questions SET status='pending',answer_id=NULL,version=version+1 WHERE answer_id=?", [old.id]);
    }); res.json({ success: true });
  }));
  app.get('/api/admin/knowledge/answers/:id/history', requireAdmin, route(async (req, res) => {
    const user = await admin(req);
    const [[answer]] = await pool.query('SELECT branch FROM knowledge_answers WHERE id=?', [req.params.id]);
    if (!answer) throw fail(404, 'ไม่พบคำตอบ'); allowed(user, answer.branch);
    const [rows] = await pool.query('SELECT h.*, u.username AS editor FROM knowledge_history h LEFT JOIN users u ON u.id=h.changed_by WHERE answer_id=? ORDER BY h.id DESC LIMIT 100', [req.params.id]);
    res.json({ success: true, data: rows.map(row => ({ ...row, snapshot: parse(row.snapshot) })) });
  }));
  app.patch('/api/admin/knowledge/questions/:id', requireAdmin, route(async (req, res) => {
    const user = await admin(req, true), { branch, category, status, answerId, version } = req.body;
    if (!Object.hasOwn(branches, branch) || !categories.includes(category) || !['pending', 'resolved', 'ignored'].includes(status)) throw fail(400, 'ข้อมูลคำถามไม่ถูกต้อง');
    allowed(user, branch);
    await tx(async c => {
      const [[old]] = await c.query('SELECT * FROM knowledge_questions WHERE id=? FOR UPDATE', [req.params.id]);
      if (!old) throw fail(404, 'ไม่พบคำถาม'); allowed(user, old.branch);
      if (old.version !== version) throw fail(409, 'รายการถูกแก้ไขแล้ว กรุณาโหลดใหม่');
      if (status === 'resolved') {
        const [[answer]] = await c.query("SELECT * FROM knowledge_answers WHERE id=? AND status='published' FOR UPDATE", [answerId || 0]);
        if (!answer || (answer.branch !== 'all' && answer.branch !== branch)) throw fail(400, 'เลือกคำตอบที่เผยแพร่และตรงกับสาขา');
        allowed(user, answer.branch);
        const aliases = parse(answer.aliases);
        if (![answer.question, ...aliases].some(q => normalize(q) === normalize(old.question))) {
          if (aliases.length >= 30) throw fail(400, 'คำตอบนี้มีคำถามใกล้เคียงครบ 30 ข้อแล้ว');
          aliases.push(old.question);
          await c.query('UPDATE knowledge_answers SET aliases=?,version=version+1,updated_by=? WHERE id=?', [JSON.stringify(aliases), user.id, answer.id]);
          await c.query('INSERT INTO knowledge_history (answer_id,snapshot,changed_by) VALUES (?,?,?)', [answer.id, JSON.stringify({ ...answer, aliases, metadata: parse(answer.metadata) || {}, version: answer.version + 1 }), user.id]);
        }
      }
      const triage = parse(old.triage);
      const fingerprint = hash(triage ? `triage\n${branch}\n${normalize(old.question)}\n${normalize(triage.summary)}` : `${branch}\n${normalize(old.question)}`);
      try {
        await c.query('UPDATE knowledge_questions SET branch=?,category=?,status=?,answer_id=?,fingerprint=?,version=version+1 WHERE id=?', [branch, category, status, status === 'resolved' ? answerId : null, fingerprint, old.id]);
      } catch (error) { if (error.code === 'ER_DUP_ENTRY') throw fail(409, 'มีคำถามนี้ในสาขาปลายทางแล้ว กรุณาตรวจรายการก่อนจัดสาขา'); throw error; }
    }); res.json({ success: true });
  }));
  app.post('/api/integrations/line/questions', route(async (req, res) => {
    if (!integrationAuth(process.env.N8N_KNOWLEDGE_TOKEN, req.get('X-Knowledge-Token'))) throw fail(401, 'ไม่ได้รับอนุญาต');
    const question = text(req.body.question, 1000), eventId = text(req.body.eventId, 200);
    const branch = req.body.branch || null;
    if (branch && (!Object.hasOwn(branches, branch) || ['all', 'unassigned'].includes(branch))) throw fail(400, 'รหัสสาขาไม่ถูกต้อง');
    await ensure();
    const result = await tx(async c => {
      const eventHash = hash(eventId);
      await c.query('INSERT IGNORE INTO knowledge_events (event_hash) VALUES (?)', [eventHash]);
      const [[event]] = await c.query('SELECT result FROM knowledge_events WHERE event_hash=? FOR UPDATE', [eventHash]);
      if (event.result) return { ...parse(event.result), duplicate: true };
      const [rows] = await c.query("SELECT id,branch,question,aliases,answer,status FROM knowledge_answers WHERE status='published'");
      const match = chooseAnswer(rows, question, branch);
      const fingerprint = hash(`${branch || 'unassigned'}\n${normalize(question)}`);
      await c.query(`INSERT INTO knowledge_questions (fingerprint,question,branch,status,answer_id) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE occurrences=occurrences+1,last_seen=CURRENT_TIMESTAMP`, [fingerprint, question, branch || 'unassigned', match.answer ? 'resolved' : 'pending', match.answer?.id || null]);
      const [[inbox]] = await c.query('SELECT id FROM knowledge_questions WHERE fingerprint=?', [fingerprint]);
      const response = { status: match.status, answerId: match.answer?.id || null, answer: match.answer?.answer || null, message: match.status === 'clarify' ? 'ขอทราบสาขาหรือรายละเอียดเพิ่มเติมครับ' : match.status === 'pending' ? 'ตอนนี้ยังไม่พบข้อมูลส่วนนี้ครับ' : null, questionId: inbox.id, duplicate: false };
      await c.query('UPDATE knowledge_events SET question_id=?,result=? WHERE event_hash=?', [inbox.id, JSON.stringify(response), eventHash]); return response;
    }); res.json({ success: true, ...result });
  }));
}
