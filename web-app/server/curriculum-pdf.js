import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const exec = promisify(execFile);

export function extractRows(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.trim().match(/^(?:(\d{6,8})\s+)?(.+?)\s{2,}(\d{1,3}(?:\s*\(\s*\d+\s*-\s*\d+\s*-\s*\d+\s*\))?)\s*(?:หน่วยกิต)?\s*$/u);
    if (!match || !/[\p{L}]/u.test(match[2]) || match[2].length > 500) continue;
    rows.push({ code: match[1] || '', name: match[2].trim(), credits: match[3].replace(/\s/g, '') });
    if (rows.length === 500) break;
  }
  return rows;
}
export function validateCurriculum(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.rows) || value.rows.length > 500) throw new Error('รูปแบบตารางไม่ถูกต้อง (สูงสุด 500 แถว)');
  const string = (v, max) => { if (typeof v !== 'string' || v.length > max) throw new Error('ข้อความไม่ถูกต้องหรือยาวเกินกำหนด'); return v.trim(); };
  return { title: string(value.title, 250), year: string(value.year, 30), rows: value.rows.map(row => {
    const name = string(row?.name, 500); if (!name) throw new Error('กรุณากรอกชื่อวิชา / หมวดวิชาให้ครบ');
    const credits = string(row.credits, 40);
    if (credits && !/^\d{1,3}(?:\(\d+-\d+-\d+\))?$/.test(credits)) throw new Error('หน่วยกิตต้องเป็นตัวเลข เช่น 3 หรือ 3(2-2-5)');
    if (row.type !== undefined && !['category', 'item', 'total'].includes(row.type)) throw new Error('ประเภทแถวไม่ถูกต้อง');
    return { code: string(row.code, 50), name, credits, ...(row.type ? { type: row.type } : {}) };
  }) };
}
export async function readCurriculumPdf(buffer) {
  const dir = await mkdtemp(path.join(tmpdir(), 'curriculum-'));
  try {
    const file = path.join(dir, 'source.pdf'); await writeFile(file, buffer, { mode: 0o600 });
    const options = { timeout: 30000, maxBuffer: 8 * 1024 * 1024, env: { ...process.env, LC_ALL: 'C' } };
    const { stdout: info } = await exec('pdfinfo', [file], options);
    const pages = Number(/^Pages:\s+(\d+)/m.exec(info)?.[1]);
    if (!pages || pages > 300 || /^Encrypted:\s+yes/m.test(info)) throw new Error('รองรับ PDF ไม่เข้ารหัส ไม่เกิน 300 หน้า');
    const { stdout } = await exec('pdftotext', ['-layout', '-enc', 'UTF-8', file, '-'], options);
    // Keep substantially more text for the private knowledge library.  The old
    // 100k-character cut-off routinely discarded the later sections of long
    // curriculum PDFs (qualifications, careers, and admission details).
    const textLimit = 2_000_000;
    return { rows: extractRows(stdout), text: stdout.slice(0, textLimit), pages, truncated: stdout.length > textLimit };
  } finally { await rm(dir, { recursive: true, force: true }); }
}

export function registerCurriculumPdf(app, db, auth, permission, reader = readCurriculumPdf) {
  const query = (sql, params = []) => new Promise((resolve, reject) => db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
  let ready, busy = false;
  const ensure = () => ready ??= (async () => {
    await query('CREATE TABLE IF NOT EXISTS curriculum_pdf_files (id CHAR(36) PRIMARY KEY, slug VARCHAR(50) NOT NULL, filename VARCHAR(250) NOT NULL, data LONGBLOB NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    await query('CREATE TABLE IF NOT EXISTS curriculum_pdf_publications (slug VARCHAR(50) PRIMARY KEY, file_id CHAR(36) NOT NULL, content JSON NOT NULL, version INT NOT NULL DEFAULT 1)');
  })().catch(e => { ready = null; throw e; });
  const allowed = (req, res, next) => permission(req, req.params.slug, err => err ? res.status(err.status || 403).json({ success: false, message: err.message }) : next());
  const route = fn => async (req, res) => { try {
    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(req.params.slug)) return res.status(400).json({ success: false, message: 'สาขาไม่ถูกต้อง' });
    if (!(await query('SELECT id FROM course_info WHERE saka_path = ? LIMIT 1', [req.params.slug])).length) return res.status(404).json({ success: false, message: 'ไม่พบสาขา' });
    await ensure(); await fn(req, res);
  } catch (e) { console.error('Curriculum PDF:', e.message); res.status(500).json({ success: false, message: 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่' }); } };
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 2 } }).single('pdf');
  app.get('/api/curriculum-pdf/:slug', route(async (req, res) => {
    const [row] = await query('SELECT file_id,content,version FROM curriculum_pdf_publications WHERE slug=?', [req.params.slug]);
    res.json({ success: true, data: row ? { ...(typeof row.content === 'string' ? JSON.parse(row.content) : row.content), fileId: row.file_id, version: row.version } : null });
  }));
  app.post('/api/curriculum-pdf/:slug/upload', auth, allowed, route(async (req, res) => {
    if (busy) return res.status(429).json({ success: false, message: 'กำลังอ่าน PDF อื่น กรุณาลองใหม่ภายหลัง' });
    busy = true;
    try {
      await new Promise((resolve, reject) => upload(req, res, err => err ? reject(err) : resolve()));
      if (!req.file || req.file.buffer.subarray(0, 5).toString() !== '%PDF-') throw new Error('กรุณาเลือกไฟล์ PDF จริง ขนาดไม่เกิน 10 MB');
      const parsed = await reader(req.file.buffer), id = randomUUID();
      const filename = path.basename(req.file.originalname).slice(0, 250);
      await query('INSERT INTO curriculum_pdf_files (id,slug,filename,data) VALUES (?,?,?,?)', [id, req.params.slug, filename, req.file.buffer]);
      res.json({ success: true, fileId: id, filename, ...parsed, warning: 'ข้อมูลที่อ่านได้เป็นร่าง ต้องตรวจเทียบ PDF ทุกแถวก่อนบันทึก ไฟล์สแกน/ตารางซับซ้อนอาจอ่านไม่ครบ สามารถกรอกเองหรือแสดงเฉพาะ PDF ได้' });
    } catch (e) { res.status(400).json({ success: false, message: e.code === 'LIMIT_FILE_SIZE' ? 'ไฟล์ต้องไม่เกิน 10 MB' : 'อ่าน PDF ไม่สำเร็จ: กรุณาใช้ PDF ที่ไม่เข้ารหัส ไม่เกิน 300 หน้า และลองใหม่' }); }
    finally { busy = false; }
  }));
  app.put('/api/curriculum-pdf/:slug', auth, allowed, route(async (req, res) => {
    let content;
    try { content = validateCurriculum(req.body); } catch (e) { return res.status(400).json({ success: false, message: e.message }); }
    if (req.body.reviewed !== true || !Number.isSafeInteger(req.body.version) || req.body.version < 0 || typeof req.body.fileId !== 'string') return res.status(400).json({ success: false, message: 'กรุณาตรวจข้อมูลและยืนยันก่อนบันทึก' });
    const files = await query('SELECT id FROM curriculum_pdf_files WHERE id=? AND slug=?', [req.body.fileId, req.params.slug]);
    if (!files.length) return res.status(400).json({ success: false, message: 'ไฟล์ไม่ตรงกับสาขา' });
    if (req.body.version === 0) {
      const result = await query('INSERT IGNORE INTO curriculum_pdf_publications (slug,file_id,content) VALUES (?,?,?)', [req.params.slug, req.body.fileId, JSON.stringify(content)]);
      if (!result.affectedRows) return res.status(409).json({ success: false, message: 'มีข้อมูลใหม่แล้ว กรุณาโหลดหน้าใหม่' });
    } else {
      const result = await query('UPDATE curriculum_pdf_publications SET file_id=?,content=?,version=version+1 WHERE slug=? AND version=?', [req.body.fileId, JSON.stringify(content), req.params.slug, req.body.version]);
      if (!result.affectedRows) return res.status(409).json({ success: false, message: 'ข้อมูลถูกแก้ไขแล้ว กรุณาโหลดหน้าใหม่' });
    }
    res.json({ success: true, data: { ...content, fileId: req.body.fileId, version: req.body.version + 1 } });
  }));
  const sendPdf = async (req, res, draft) => {
    const rows = await query(draft ? 'SELECT data FROM curriculum_pdf_files WHERE slug=? AND id=?' : 'SELECT f.data FROM curriculum_pdf_files f JOIN curriculum_pdf_publications p ON p.file_id=f.id AND p.slug=f.slug WHERE p.slug=? AND f.id=?', [req.params.slug, req.params.id]);
    if (!rows.length) return res.status(404).end();
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="curriculum.pdf"', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', 'Content-Security-Policy': "sandbox" }).send(rows[0].data);
  };
  app.get('/api/curriculum-pdf/:slug/files/:id', route((req, res) => sendPdf(req, res, false)));
  app.get('/api/curriculum-pdf/:slug/drafts/:id', auth, allowed, route((req, res) => sendPdf(req, res, true)));
}
