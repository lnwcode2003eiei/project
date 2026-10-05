import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { readCurriculumPdf } from './curriculum-pdf.js';
import { normalizeUploadFilename } from './upload-filename.js';

export const documentTypes = ['หลักสูตร', 'การรับสมัคร', 'ค่าใช้จ่าย', 'ข่าวสาร', 'เอกสารอื่น'];

export function rankDocuments(rows, query) {
  const terms = String(query || '').normalize('NFC').toLocaleLowerCase('th-TH').split(/\s+/).filter(term => term.length > 1);
  return rows.map(row => {
    const haystack = `${row.title}\n${row.filename}\n${row.extracted_text}`.normalize('NFC').toLocaleLowerCase('th-TH');
    const hits = terms.filter(term => haystack.includes(term)).length;
    const at = terms.length ? Math.min(...terms.map(term => haystack.indexOf(term)).filter(index => index >= 0)) : -1;
    const excerpt = at >= 0 ? row.extracted_text.slice(Math.max(0, at - 350), at + 1250) : row.extracted_text.slice(0, 1200);
    return { id: row.id, branch: row.branch, type: row.type, title: row.title, filename: row.filename, updatedAt: row.updated_at, score: terms.length ? Math.round(hits / terms.length * 100) : 0, excerpt: excerpt.replace(/\s+/g, ' ').trim() };
  }).filter(row => row.score >= 20 && row.excerpt).sort((a, b) => b.score - a.score || b.id - a.id).slice(0, 5);
}

export function registerKnowledgeDocuments(app, { pool, ensure, route, admin, allowed, branches, requireAdmin }) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 3, parts: 5 } }).single('pdf');
  const documentBranch = (user, requested) => {
    const branch = user.saka_path === 'all' ? requested : user.saka_path;
    if (!Object.hasOwn(branches, branch) || branch === 'unassigned') { const error = new Error('สาขาไม่ถูกต้อง'); error.status = 400; throw error; }
    allowed(user, branch); return branch;
  };
  app.get('/api/admin/knowledge/documents', requireAdmin, route(async (req, res) => {
    const user = await admin(req);
    const args = user.saka_path === 'all' ? [] : [user.saka_path, 'all'];
    const where = user.saka_path === 'all' ? '' : ' WHERE branch IN (?,?)';
    const [rows] = await pool.query(`SELECT id,branch,type,title,filename,pages,text_truncated,created_at,updated_at FROM knowledge_documents${where} ORDER BY updated_at DESC,id DESC`, args);
    res.json({ success: true, documents: rows, branches, types: documentTypes, scope: user.saka_path, canEdit: Number(user.can_edit) === 1 });
  }));
  app.post('/api/admin/knowledge/documents', requireAdmin, route(async (req, res) => {
    const user = await admin(req, true);
    await new Promise((resolve, reject) => upload(req, res, error => error ? reject(error) : resolve()));
    const branch = documentBranch(user, req.body.branch);
    const type = req.body.type;
    if (!documentTypes.includes(type) || typeof req.body.title !== 'string' || !req.body.title.trim() || req.body.title.trim().length > 250) { const error = new Error('กรอกชื่อเอกสารและประเภทให้ถูกต้อง'); error.status = 400; throw error; }
    if (!req.file || req.file.mimetype !== 'application/pdf' || req.file.buffer.subarray(0, 5).toString() !== '%PDF-') { const error = new Error('กรุณาเลือกไฟล์ PDF ขนาดไม่เกิน 10 MB'); error.status = 400; throw error; }
    let parsed;
    try { parsed = await readCurriculumPdf(req.file.buffer); }
    catch { const error = new Error('อ่าน PDF ไม่สำเร็จ: ต้องเป็นไฟล์ไม่เข้ารหัส ไม่เกิน 300 หน้า และมีข้อความที่อ่านได้'); error.status = 400; throw error; }
    const text = parsed.text.trim();
    if (!text) { const error = new Error('ไม่พบข้อความใน PDF กรุณาใช้ไฟล์ที่เลือกอ่านข้อความได้'); error.status = 400; throw error; }
    const id = randomUUID(), filename = normalizeUploadFilename(req.file.originalname).slice(0, 250);
    await pool.query('INSERT INTO knowledge_documents (id,branch,type,title,filename,data,extracted_text,pages,text_truncated,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?)', [id, branch, type, req.body.title.trim(), filename, req.file.buffer, text, parsed.pages, parsed.truncated ? 1 : 0, user.id]);
    res.status(201).json({ success: true, document: { id, branch, type, title: req.body.title.trim(), filename, pages: parsed.pages, textTruncated: parsed.truncated } });
  }));
  app.delete('/api/admin/knowledge/documents/:id', requireAdmin, route(async (req, res) => {
    const user = await admin(req, true);
    const [[row]] = await pool.query('SELECT branch FROM knowledge_documents WHERE id=?', [req.params.id]);
    if (!row) { const error = new Error('ไม่พบเอกสาร'); error.status = 404; throw error; }
    allowed(user, row.branch);
    await pool.query('DELETE FROM knowledge_documents WHERE id=?', [req.params.id]);
    res.json({ success: true });
  }));
}
