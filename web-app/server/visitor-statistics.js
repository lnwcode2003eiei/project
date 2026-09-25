export function validRange(start, end) {
  const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  return validDate(start) && validDate(end) && end > start && (Date.parse(end) - Date.parse(start)) / 86400000 <= 366;
}

export function registerVisitorStatistics(app, db, requireAdmin) {
  app.get('/api/admin/dashboard/visits', requireAdmin, (req, res) => {
    const { start, end } = req.query;
    if (!validRange(start, end)) return res.status(400).json({ success: false, message: 'ช่วงวันที่ไม่ถูกต้อง' });
    // Same database calendar and COUNT(*) semantics as the existing dashboard.
    db.query(`SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS total
      FROM visitors WHERE created_at >= ? AND created_at < ?
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') ORDER BY day`, [start, end], (error, rows) => {
      if (error) return res.status(500).json({ success: false, message: 'ไม่สามารถโหลดสถิติผู้เข้าชมได้' });
      res.json({ success: true, data: rows });
    });
  });
}
