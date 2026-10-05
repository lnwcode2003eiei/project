import multer from 'multer';
import { normalizeUploadFilename } from './upload-filename.js';
import { readComparisonPdf } from './comparison-pdf.js';
import { extractNames, compareNames } from './comparison-data.js';

export function registerComparison(app, db, requireAdmin, readPdf = readComparisonPdf) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 1, parts: 3 } }).single('pdf');
  const query = (sql, params = []) => new Promise((resolve, reject) => db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
  let ready;
  const ensure = () => ready ??= query('CREATE TABLE IF NOT EXISTS comparison_reports (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, academic_year SMALLINT NOT NULL, filename VARCHAR(250) NOT NULL, content JSON NOT NULL, uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)').catch(e => { ready = null; throw e; });
  app.get('/api/admin/comparison/reports', requireAdmin, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try { await ensure(); const reports = await query('SELECT id,academic_year,filename,uploaded_at FROM comparison_reports ORDER BY academic_year DESC,id DESC'); res.json({ success: true, reports: reports.map(row => ({ ...row, filename: normalizeUploadFilename(row.filename) })) }); }
    catch { res.status(500).json({ success: false, message: 'โหลดประวัติไม่สำเร็จ' }); }
  });
  app.get('/api/admin/comparison/reports/:id', requireAdmin, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ success: false });
    try {
      await ensure(); const [row] = await query('SELECT content FROM comparison_reports WHERE id=?', [req.params.id]);
      if (!row) return res.status(404).json({ success: false });
      const data = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
      res.json({ success: true, data: { ...data, filename: normalizeUploadFilename(data.filename) } });
    } catch { res.status(500).json({ success: false, message: 'โหลดผลเปรียบเทียบไม่สำเร็จ' }); }
  });
  app.delete('/api/admin/comparison/reports/:id', requireAdmin, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (req.admin.saka_path !== 'all' || Number(req.admin.can_edit) !== 1) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ลบชุดอัปโหลด' });
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ success: false });
    try {
      await ensure();
      const result = await query('DELETE FROM comparison_reports WHERE id=?', [req.params.id]);
      if (!result.affectedRows) return res.status(404).json({ success: false, message: 'ไม่พบชุดอัปโหลด' });
      res.json({ success: true });
    } catch { res.status(500).json({ success: false, message: 'ลบไม่สำเร็จ กรุณาลองใหม่' }); }
  });
  let busy = false;
  app.post('/api/admin/comparison', requireAdmin, (req, res) => {
    res.set('Cache-Control', 'no-store');
    // Full cross-system matching must not widen branch-restricted access.
    if (req.admin.saka_path !== 'all') return res.status(403).json({ success: false, message: 'เฉพาะผู้ดูแลที่มีสิทธิ์ทุกสาขาเท่านั้น' });
    if (busy) return res.status(429).json({ success: false, message: 'กำลังประมวลผลเอกสารอื่น กรุณาลองใหม่ภายหลัง' });
    busy = true;
    upload(req, res, async error => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 150000);
      const disconnected = () => { if (!res.writableEnded) controller.abort(); };
      res.on('close', disconnected);
      try {
        if (error) return res.status(400).json({ success: false, message: 'อัปโหลด PDF ครั้งละ 1 ไฟล์ ขนาดไม่เกิน 10 MB' });
        const suppliedYear = req.body?.academicYear;
        if (suppliedYear !== undefined && (!/^\d{4}$/.test(suppliedYear) || Number(suppliedYear) < 2500 || Number(suppliedYear) > 2700)) return res.status(400).json({ success: false, message: 'ปีการศึกษาไม่ถูกต้อง' });
        if (req.admin.can_edit !== undefined && Number(req.admin.can_edit) !== 1) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์บันทึกผลอัปโหลด' });
        const year = suppliedYear === undefined ? new Date().getFullYear() + 543 : Number(suppliedYear);
        if (!req.file || req.file.mimetype !== 'application/pdf' || req.file.buffer.subarray(0, 5).toString() !== '%PDF-') return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์ PDF ที่ถูกต้อง' });
        const pages = await readPdf(req.file.buffer, controller.signal);
        const extracted = extractNames(pages);
        if (extracted.rows.length + extracted.unresolved.length > 5000) return res.status(422).json({ success: false, message: 'รองรับไม่เกิน 5,000 รายการต่อไฟล์ กรุณาแบ่งไฟล์' });
        const readRows = sql => new Promise((resolve, reject) => db.query(sql, (err, rows) => err ? reject(err) : resolve(rows)));
        const [visitors, interested] = await Promise.all([readRows('SELECT name FROM visitors'), readRows('SELECT fullname AS name FROM applications')]);
        if (controller.signal.aborted) throw new Error('timeout');
        const data = { ...compareNames(visitors, interested, extracted), pages: pages.length, ocrPages: pages.filter(p => p.ocr).length, emptyPages: pages.filter(p => !p.text.trim()).length, generatedAt: new Date().toISOString(), filename: normalizeUploadFilename(req.file.originalname).slice(0, 250), academicYear: year };
        try { await ensure(); await query('INSERT INTO comparison_reports (academic_year,filename,content) VALUES (?,?,?)', [year, data.filename, JSON.stringify(data)]); }
        catch { return res.status(500).json({ success: false, message: 'อ่านไฟล์แล้วแต่บันทึกผลไม่สำเร็จ กรุณาลองใหม่' }); }
        res.json({ success: true, data });
      } catch (err) {
        const known = ['รองรับ PDF ไม่เกิน 30 หน้า', 'กรุณาใช้ PDF ที่ไม่มีรหัสผ่าน', 'รองรับหน้าสแกนไม่เกิน 10 หน้า กรุณาแบ่งไฟล์'];
        if (!res.destroyed) res.status(422).json({ success: false, message: known.includes(err.message) ? err.message : 'ไม่สามารถอ่าน PDF ได้ ไฟล์อาจเสียหาย มีรหัสผ่าน หรือใช้เวลานานเกินกำหนด กรุณาลองไฟล์เล็กลง' });
      } finally {
        clearTimeout(timer); res.off('close', disconnected); busy = false;
        if (req.file) req.file.buffer = null;
      }
    });
  });
}
