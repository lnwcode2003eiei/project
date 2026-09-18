// Additional course sections are kept separate from the legacy course editor.
export const emptyDetails = () => ({ philosophy: "", objectives: [], standardsIntro: "", standards: [], plos: [], documents: [], supports: [], contact: { name: "", phone: "", email: "", url: "", address: "" } });
const icons = new Set(["book", "target", "code", "people", "award", "wallet", "home", "building"]);
export function validateDetails(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("ข้อมูลต้องเป็น object");
  const string = (value, max = 5000) => {
    if (value === undefined) return "";
    if (typeof value !== "string" || value.length > max) throw new Error(`ข้อความต้องยาวไม่เกิน ${max} ตัวอักษร`);
    return value.trim();
  };
  const url = value => {
    const result = string(value, 1000);
    if (result) {
      try { if (!["http:", "https:"].includes(new URL(result).protocol)) throw new Error(); }
      catch { throw new Error("ลิงก์ต้องเป็น http:// หรือ https:// ที่ถูกต้อง"); }
    }
    return result;
  };
  const list = key => {
    const rows = input[key] ?? [];
    if (!Array.isArray(rows) || rows.length > 40) throw new Error("แต่ละหมวดเพิ่มได้ไม่เกิน 40 รายการ");
    return rows.map(row => {
      if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("รูปแบบรายการไม่ถูกต้อง");
      const title = string(row.title, 250);
      if (!title) throw new Error("กรุณากรอกชื่อทุกรายการ หรือลบรายการที่ไม่ใช้");
      return { title, description: string(row.description), url: url(row.url), icon: icons.has(row.icon) ? row.icon : "book" };
    });
  };
  const contact = input.contact ?? {};
  if (!contact || typeof contact !== "object" || Array.isArray(contact)) throw new Error("รูปแบบข้อมูลติดต่อไม่ถูกต้อง");
  const email = string(contact.email, 250);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("อีเมลไม่ถูกต้อง");
  return { philosophy: string(input.philosophy, 10000), standardsIntro: string(input.standardsIntro, 10000),
    objectives: list("objectives"), standards: list("standards"), plos: list("plos"), documents: list("documents"), supports: list("supports"),
    contact: { name: string(contact.name, 250), phone: string(contact.phone, 100), email, url: url(contact.url), address: string(contact.address, 2000) } };
}

export function registerCourseDetails(app, db, requireAdmin, checkPermission) {
  const query = (sql, params = []) => new Promise((resolve, reject) => db.query(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));
  // Lazily initialize so an unavailable database can recover on the next request.
  let ready;
  const ensureTable = () => ready ??= query(`CREATE TABLE IF NOT EXISTS course_details (
    saka_path VARCHAR(50) PRIMARY KEY, content JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).catch(error => { ready = undefined; throw error; });
  const exists = async slug => (await query("SELECT id FROM course_info WHERE saka_path = ? LIMIT 1", [slug])).length > 0;
  const failed = (res, error) => { console.error("Course details:", error.message); return res.status(500).json({ success: false, message: "ไม่สามารถอ่านหรือบันทึกข้อมูลเพิ่มเติมได้ กรุณาลองใหม่" }); };
  app.get("/api/course-details/:slug", async (req, res) => {
    try {
      if (!await exists(req.params.slug)) return res.status(404).json({ success: false, message: "ไม่พบสาขา" });
      await ensureTable();
      const rows = await query("SELECT content FROM course_details WHERE saka_path = ?", [req.params.slug]);
      const content = rows[0]?.content;
      res.json({ success: true, data: content ? (typeof content === "string" ? JSON.parse(content) : content) : emptyDetails() });
    } catch (error) { failed(res, error); }
  });
  app.put("/api/course-details/:slug", requireAdmin, (req, res) => {
    checkPermission(req, req.params.slug, async error => {
      if (error) return res.status(error.status || 403).json({ success: false, message: error.message });
      let content;
      try { content = validateDetails(req.body); }
      catch (error) { return res.status(400).json({ success: false, message: error.message }); }
      try {
        if (!await exists(req.params.slug)) return res.status(404).json({ success: false, message: "ไม่พบสาขา" });
        await ensureTable();
        await query("INSERT INTO course_details (saka_path, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)", [req.params.slug, JSON.stringify(content)]);
        res.json({ success: true, data: content, message: "บันทึกข้อมูลเพิ่มเติมแล้ว" });
      } catch (error) { failed(res, error); }
    });
  });
}
