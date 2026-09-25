import multer from 'multer';
import { readComparisonPdf } from './comparison-pdf.js';
import { extractNames, compareNames } from './comparison-data.js';

export function registerComparison(app, db, requireAdmin, readPdf = readComparisonPdf) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 2 } }).single('pdf');
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
        if (!req.file || req.file.mimetype !== 'application/pdf' || req.file.buffer.subarray(0, 5).toString() !== '%PDF-') return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์ PDF ที่ถูกต้อง' });
        const pages = await readPdf(req.file.buffer, controller.signal);
        const extracted = extractNames(pages);
        if (extracted.rows.length + extracted.unresolved.length > 5000) return res.status(422).json({ success: false, message: 'รองรับไม่เกิน 5,000 รายการต่อไฟล์ กรุณาแบ่งไฟล์' });
        const query = sql => new Promise((resolve, reject) => db.query(sql, (err, rows) => err ? reject(err) : resolve(rows)));
        const [visitors, interested] = await Promise.all([query('SELECT name FROM visitors'), query('SELECT fullname AS name FROM applications')]);
        if (controller.signal.aborted) throw new Error('timeout');
        res.json({ success: true, data: { ...compareNames(visitors, interested, extracted), pages: pages.length, ocrPages: pages.filter(p => p.ocr).length, emptyPages: pages.filter(p => !p.text.trim()).length, generatedAt: new Date().toISOString() } });
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
