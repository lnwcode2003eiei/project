
import express from "express";
import cors from "cors";
import db from "./db.js";
import { registerKnowledge } from './knowledge.js';
import { notifyNewsLine } from './news-line.js';
import { interestScope } from './interest-scope.js';
import { registerVisitorStatistics, validRange } from "./visitor-statistics.js";
import { registerComparison } from "./comparison.js";
import { registerCourseDetails } from "./course-details.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createAdminToken,
  hashAdminPassword,
  requireAdmin,
  verifyAdminPassword,
} from "./auth.js";

const app = express();
const PORT = 5000;
registerVisitorStatistics(app, db, requireAdmin);
registerComparison(app, db, requireAdmin);

const adminBranches = new Set([
  "computer",
  "computer-ai",
  "construction",
  "digital",
  "electrical",
  "energy",
  "industrial",
  "logistics",
  "management",
  "survey",
]);

const normalizeCurriculum = (value) => {
  const parse = (item, fallback) => {
    if (!item) return fallback;
    if (typeof item === "object") return item;
    try { return JSON.parse(item); } catch { return fallback; }
  };
  const rows = parse(value, []);
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((item) => {
    const parsedItem = parse(item, {});
    const groups = Array.isArray(parsedItem) ? parsedItem : [parsedItem];
    return groups.map((group) => {
    if (!group || typeof group !== "object") return null;
    const subCategories = parse(group.subCategories, []);
    return { ...group, subCategories: Array.isArray(subCategories) ? subCategories.map((sub) => parse(sub, sub)).filter(Boolean) : [] };
    }).filter(Boolean);
  });
};

const startServer = () => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Express Server ทำงานที่ http://localhost:${PORT}`);
  });
};

const ensureApplicationSecondMajorColumn = () => {
  db.query("SHOW COLUMNS FROM applications LIKE 'second_major_name'", (error, columns) => {
    if (error || columns.length > 0) {
      if (error) console.error("❌ ตรวจสอบสาขาอันดับสองของใบสมัครไม่สำเร็จ:", error.message);
      ensureCourseCurriculumTransferColumn();
      return;
    }
    db.query("ALTER TABLE applications ADD COLUMN second_major_name VARCHAR(255) NULL AFTER education", (alterError) => {
      if (alterError) console.error("❌ เพิ่มข้อมูลสาขาอันดับสองของใบสมัครไม่สำเร็จ:", alterError.message);
      ensureCourseCurriculumTransferColumn();
    });
  });
};

const ensureCourseCurriculumTransferColumn = () => {
  db.query("SHOW COLUMNS FROM course_info LIKE 'curriculum_transfer'", (error, columns) => {
    if (error || columns.length > 0) {
      if (error) console.error("❌ ตรวจสอบโครงสร้างหลักสูตรเทียบโอนไม่สำเร็จ:", error.message);
      ensureApprovedAdminsTable();
      return;
    }
    db.query("ALTER TABLE course_info ADD COLUMN curriculum_transfer JSON NULL AFTER curriculum", (alterError) => {
      if (alterError) console.error("❌ เพิ่มโครงสร้างหลักสูตรเทียบโอนไม่สำเร็จ:", alterError.message);
      ensureApprovedAdminsTable();
    });
  });
};

const ensureApprovedAdminsTable = () => {
  db.query(
    `CREATE TABLE IF NOT EXISTS approved_admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      saka_path VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_approved_admin_name (first_name, last_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    (error) => {
      if (error) {
        console.error("❌ สร้างตารางรายชื่อผู้ได้รับอนุญาตไม่สำเร็จ:", error.message);
      }

      db.query(
        "SHOW COLUMNS FROM approved_admins LIKE 'saka_path'",
        (columnError, columns) => {
          if (columnError) {
            console.error("❌ ตรวจสอบข้อมูลสาขาในรายชื่อผู้ได้รับอนุญาตไม่สำเร็จ:", columnError.message);
            ensureNewsAuthorColumn();
            return;
          }

          if (columns.length > 0) {
            ensureNewsAuthorColumn();
            return;
          }

          db.query(
            "ALTER TABLE approved_admins ADD COLUMN saka_path VARCHAR(50) NOT NULL DEFAULT 'all' AFTER last_name",
            (alterError) => {
              if (alterError) {
                console.error("❌ เพิ่มข้อมูลสาขาในรายชื่อผู้ได้รับอนุญาตไม่สำเร็จ:", alterError.message);
              }
              ensureNewsAuthorColumn();
            },
          );
        },
      );
    },
  );
};

const ensureNewsAuthorColumn = () => {
  db.query("SHOW COLUMNS FROM news LIKE 'created_by_admin_id'", (columnError, columns) => {
    if (columnError) {
      console.error("❌ ตรวจสอบผู้โพสต์ข่าวไม่สำเร็จ:", columnError.message);
      ensureBootstrapAdmin();
      return;
    }

    if (columns.length > 0) {
      ensureBootstrapAdmin();
      return;
    }

    db.query("ALTER TABLE news ADD COLUMN created_by_admin_id INT NULL AFTER image", (alterError) => {
      if (alterError) {
        console.error("❌ เพิ่มข้อมูลผู้โพสต์ข่าวไม่สำเร็จ:", alterError.message);
      }
      ensureBootstrapAdmin();
    });
  });
};

const ensureBootstrapAdmin = () => {
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!username || !password) {
    console.warn("⚠️ ไม่ได้ตั้งค่า ADMIN_BOOTSTRAP_USERNAME และ ADMIN_BOOTSTRAP_PASSWORD");
    startServer();
    return;
  }

  db.query("SELECT COUNT(*) AS total FROM users WHERE username = ?", [username], (countError, results) => {
    if (countError) {
      console.error("❌ ตรวจสอบบัญชีผู้ดูแลไม่สำเร็จ:", countError.message);
      startServer();
      return;
    }

    if (Number(results[0].total) > 0) {
      startServer();
      return;
    }

    db.query(
      "INSERT INTO users (username, password, first_name, last_name, saka_path, can_edit) VALUES (?, ?, ?, ?, 'all', 1)",
      [
        username,
        hashAdminPassword(password),
        process.env.ADMIN_BOOTSTRAP_FIRST_NAME || "ผู้ดูแล",
        process.env.ADMIN_BOOTSTRAP_LAST_NAME || "ระบบ",
      ],
      (insertError) => {
        if (insertError) {
          console.error("❌ สร้างบัญชีผู้ดูแลเริ่มต้นไม่สำเร็จ:", insertError.message);
        } else {
          console.log("✅ สร้างบัญชีผู้ดูแลเริ่มต้นแล้ว");
        }

        startServer();
      },
    );
  });
};

// ==========================================
// Middleware
// ==========================================

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost,http://127.0.0.1")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
);

app.use(express.json());
registerKnowledge(app, db, requireAdmin);

// ==========================================
// Static Uploads
// ==========================================

const uploadDir = "./uploads/news";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static("uploads"));

// ==========================================
// Helper สำหรับลบไฟล์
// ==========================================

const safeDeleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("❌ ลบไฟล์ไม่สำเร็จ:", err);
    }
  }
};

// ==========================================
// Helper ตรวจ Admin
// ==========================================

const checkAdminEditPermission = (req, sakaPath, callback) => {
  const admin = req.admin;

    // ไม่มีสิทธิ์แก้ไข
    if (Number(admin.can_edit) !== 1) {
      return callback({
        status: 403,
        message: "บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูล",
      });
    }

    // Admin แบบแก้เฉพาะสาขา
    if (
      admin.saka_path !== "all" &&
      admin.saka_path !== sakaPath
    ) {
      return callback({
        status: 403,
        message: "ไม่มีสิทธิ์แก้ไขสาขานี้",
      });
    }

  callback(null, admin);
};

// ==========================================
// Multer Upload รูปข่าว
// ==========================================

registerCourseDetails(app, db, requireAdmin, checkAdminEditPermission);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const fileName = `news-${Date.now()}${ext}`;

    cb(null, fileName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("รองรับเฉพาะ JPG, PNG และ WebP"));
    }
  },
});

// ==========================================
// ทดสอบ Server
// ==========================================

app.get("/", (req, res) => {
  res.send("Express Server ทำงานแล้ว");
});

// ==========================================
// 📌 บันทึกข้อมูลผู้เข้าชม
// ==========================================

app.post("/api/visitors", (req, res) => {
  const { status, anonymous } = req.body;
  const name = anonymous === true ? "ไม่ระบุชื่อ" :
    (typeof req.body.name === "string" ? req.body.name.trim() : "");

  if (!name || !["นักเรียน", "นักศึกษา", "ครู", "ผู้ปกครอง"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "กรุณากรอกข้อมูลให้ครบ",
    });
  }

  const sql = `
    INSERT INTO visitors
    (name, status)
    VALUES (?, ?)
  `;

  db.query(sql, [name, status], (err, result) => {
    if (err) {
      console.error("❌ บันทึกข้อมูลไม่สำเร็จ");
      console.error(err);

      return res.status(500).json({
        success: false,
        message: "ไม่สามารถบันทึกข้อมูลได้",
        error: err.message,
      });
    }

    console.log("✅ บันทึกข้อมูลแล้ว ID:", result.insertId);

    res.status(201).json({
      success: true,
      message: "บันทึกข้อมูลสำเร็จ",
      id: result.insertId,
    });
  });
});

// ==========================================
// 📌 ดึงข้อมูลผู้เข้าชมทั้งหมด
// ==========================================

app.get("/api/admin/visitors", requireAdmin, (req, res) => {
  const { start, end } = req.query;
  const hasRange = start !== undefined || end !== undefined;
  if (hasRange && !validRange(start, end)) return res.status(400).json({ success: false, message: "ช่วงวันที่ไม่ถูกต้อง" });
  const sql = `
    SELECT
      id,
      name,
      status,
      created_at
    FROM visitors
    ${hasRange ? 'WHERE created_at >= ? AND created_at < ?' : ''}
    ORDER BY created_at DESC
  `;

  db.query(sql, hasRange ? [start, end] : [], (err, results) => {
    if (err) {
      console.error("❌ ดึงข้อมูลผู้เข้าชมไม่สำเร็จ");
      console.error(err);

      return res.status(500).json({
        success: false,
        message: "ไม่สามารถดึงข้อมูลผู้เข้าชมได้",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      visitors: results,
    });
  });
});

// ==========================================
// 📌 ดึงข้อมูลผู้สนใจเรียน
// ==========================================

app.get("/api/admin/interested-students", requireAdmin, (req, res) => {
  const scope = interestScope(req.admin);
  if (!scope) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ดูข้อมูลสาขา' });
  const sql = `
    SELECT
      id,
      fullname AS name,
      old_school AS school,
      major_name AS major,
      second_major_name AS second_major,
      education,
      education AS status,
      created_at
    FROM applications
    ${scope.where}
    ORDER BY created_at DESC
  `;

  db.query(sql, scope.values, (err, results) => {
    if (err) {
      console.error("❌ ดึงข้อมูลผู้สนใจเรียนไม่สำเร็จ");
      console.error(err);

      return res.status(500).json({
        success: false,
        message: "ไม่สามารถดึงข้อมูลผู้สนใจเรียนได้",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      interested: results,
      scope: { all: req.admin.saka_path === 'all', branchName: scope.values[0] || null },
    });
  });
});

// ==========================================
// 📌 Dashboard สถิติผู้เข้าชม
// ==========================================

app.get("/api/admin/dashboard", requireAdmin, (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS totalVisitors,

      SUM(status = 'นักเรียน')
        AS students,

      SUM(status = 'นักศึกษา')
        AS universityStudents,

      SUM(status = 'ครู')
        AS teachers,

      SUM(status = 'บุคลากร')
        AS staff,
      SUM(status = 'ผู้ปกครอง') AS parents,

      SUM(
        DATE(created_at) = CURDATE()
      ) AS todayVisitors

    FROM visitors
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ ดึงข้อมูล Dashboard ไม่สำเร็จ");
      console.error(err);

      return res.status(500).json({
        success: false,
        message: "ไม่สามารถดึงข้อมูล Dashboard ได้",
        error: err.message,
      });
    }

    const data = results[0] || {};

    res.status(200).json({
      success: true,

      data: {
        totalVisitors: Number(data.totalVisitors || 0),
        students: Number(data.students || 0),
        universityStudents: Number(
          data.universityStudents || 0,
        ),
        teachers: Number(data.teachers || 0),
        parents: Number(data.parents || 0),
        staff: Number(data.staff || 0),
        todayVisitors: Number(data.todayVisitors || 0),
      },
    });
  });
});

// ==========================================
// 📌 Dashboard - สถิติผู้เข้าชมรายเดือน
// ==========================================

app.get("/api/admin/dashboard/monthly", requireAdmin, (req, res) => {
  const sql = `
    SELECT
      MONTH(created_at) AS month,
      COUNT(*) AS total
    FROM visitors
    WHERE YEAR(created_at) = YEAR(CURDATE())
    GROUP BY MONTH(created_at)
    ORDER BY MONTH(created_at)
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ ดึงสถิติรายเดือนไม่สำเร็จ");
      console.error(err);

      return res.status(500).json({
        success: false,
        message: "ไม่สามารถดึงสถิติรายเดือนได้",
        error: err.message,
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
});

// ==========================================
// 📌 Dashboard - สถิติความสนใจรายสาขา
// ==========================================

app.get("/api/admin/dashboard/majors", requireAdmin, (req, res) => {
  const scope = interestScope(req.admin);
  if (!scope) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ดูข้อมูลสาขา' });
  const colors = [
    "#7A0019",
    "#5B00FF",
    "#29C8BC",
    "#FF8A3D",
    "#EC4899",
    "#3B82F6",
    "#10B981",
    "#6366F1",
    "#F59E0B",
  ];

  const sql = `
    SELECT
      major_name AS name,
      COUNT(*) AS count
    FROM applications
    ${scope.where}
    GROUP BY major_name
    ORDER BY count DESC
  `;

  db.query(sql, scope.values, (err, results) => {
    if (err) {
      console.error(
        "❌ ดึงสถิติความสนใจรายสาขาไม่สำเร็จ",
      );

      console.error(err);

      return res.status(500).json({
        success: false,
        message: "ไม่สามารถดึงสถิติความสนใจรายสาขาได้",
        error: err.message,
      });
    }

    const dataWithColors = results.map((item, index) => ({
      name: item.name || "ไม่ระบุสาขา",
      count: Number(item.count || 0),
      color: colors[index % colors.length],
    }));

    res.status(200).json({
      success: true,
      data: dataWithColors,
    });
  });
});

// ==========================================
// 📌 ดึงข่าวทั้งหมด
// ==========================================

app.get("/api/news", (req, res) => {
  const sql = `
    SELECT
      id,
      title,
      category,
      description,
      image,
      created_by_admin_id,
      created_at
    FROM news
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ ดึงข่าวไม่สำเร็จ");
      console.error(err);

      return res.status(500).json({
        success: false,
        message: "ไม่สามารถดึงข่าวได้",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      news: results,
    });
  });
});

// ==========================================
// 📌 เพิ่มข่าว + Upload รูป
// ==========================================

app.post("/api/news", requireAdmin, upload.single("image"), (req, res) => {
  const {
    title,
    category,
    description,
  } = req.body;

  if (!title || !category || !description) {
    if (req.file) {
      safeDeleteFile(req.file.path);
    }

    return res.status(400).json({
      success: false,
      message: "กรุณากรอกข้อมูลข่าวให้ครบ",
    });
  }

  const imagePath = req.file
    ? `/uploads/news/${req.file.filename}`
    : null;

  const sql = `
    INSERT INTO news
    (title, category, description, image, created_by_admin_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      title,
      category,
      description,
      imagePath,
      req.admin.sub,
    ],
    async (err, result) => {
      if (err) {
        console.error("❌ เพิ่มข่าวไม่สำเร็จ");
        console.error(err);

        if (req.file) {
          safeDeleteFile(req.file.path);
        }

        return res.status(500).json({
          success: false,
          message: "ไม่สามารถเพิ่มข่าวได้",
          error: err.message,
        });
      }

      console.log(
        "✅ เพิ่มข่าวสำเร็จ ID:",
        result.insertId,
      );

      const line = await notifyNewsLine(req.body.send_line, { id: result.insertId, title, category, description, image: imagePath });
      res.status(201).json({
        success: true,
        message: "เพิ่มข่าวสำเร็จ",
        id: result.insertId,
        image: imagePath,
        line,
      });
    },
  );
});

// ==========================================
// 📌 บันทึกข้อมูลสมัครเรียน
// ==========================================

app.post("/api/applications", (req, res) => {
  const {
    major_name,
    fullname,
    old_school,
    education,
    second_major_name,
  } = req.body;

  if (
    !major_name ||
    !fullname ||
    !old_school ||
    !education
  ) {
    return res.status(400).json({
      success: false,
      message: "กรุณากรอกข้อมูลให้ครบถ้วน",
    });
  }

  const sql = `
    INSERT INTO applications
    (
      major_name,
      fullname,
      old_school,
      education,
      second_major_name
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      major_name,
      fullname,
      old_school,
      education,
      String(second_major_name || "").trim() || null,
    ],
    (err, result) => {
      if (err) {
        console.error(
          "❌ บันทึกข้อมูลความสนใจไม่สำเร็จ",
        );

        console.error(err);

        return res.status(500).json({
          success: false,
          message:
            "ไม่สามารถบันทึกข้อมูลความสนใจได้",
          error: err.message,
        });
      }

      console.log(
        "✅ บันทึกข้อมูลความสนใจเรียบร้อย ID:",
        result.insertId,
      );

      res.status(201).json({
        success: true,
        message: "บันทึกความสนใจเรียบร้อยแล้ว",
        id: result.insertId,
      });
    },
  );
});

// ==========================================
// 📌 ดึงข้อมูลการสมัครเรียนทั้งหมด
// ==========================================

app.get("/api/admin/applications", requireAdmin, (req, res) => {
  const sql = `
    SELECT
      id,
      major_name,
      fullname,
      old_school,
      education,
      second_major_name,
      created_at
    FROM applications
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "❌ ดึงข้อมูลความสนใจไม่สำเร็จ",
      );

      console.error(err);

      return res.status(500).json({
        success: false,
        message:
          "ไม่สามารถดึงข้อมูลความสนใจได้",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      applications: results,
    });
  });
});

// ==========================================
// 📌 Admin Login
// ==========================================

const requireSuperAdmin = (req, res, next) => {
  if (req.admin.saka_path !== "all") {
    return res.status(403).json({
      success: false,
      message: "เฉพาะ Super Admin เท่านั้นที่จัดการบัญชีผู้ใช้ได้",
    });
  }

  return next();
};

app.get("/api/admin/users", requireAdmin, requireSuperAdmin, (req, res) => {
  db.query(
    `SELECT id, username, first_name, last_name, saka_path, can_edit
     FROM users ORDER BY first_name, last_name, username`,
    (err, users) => {
      if (err) {
        console.error("❌ ดึงรายชื่อผู้ดูแลไม่สำเร็จ:", err.message);
        return res.status(500).json({ success: false, message: "ไม่สามารถดึงรายชื่อผู้ใช้ได้" });
      }

      return res.json({ success: true, users });
    },
  );
});

app.delete("/api/news/:id", requireAdmin, (req, res) => {
  const newsId = Number(req.params.id);
  if (!Number.isInteger(newsId) || newsId < 1) {
    return res.status(400).json({ success: false, message: "รหัสข่าวไม่ถูกต้อง" });
  }

  db.query(
    "SELECT id, image, created_by_admin_id FROM news WHERE id = ?",
    [newsId],
    (lookupError, articles) => {
      if (lookupError) {
        console.error("❌ ตรวจสอบข่าวไม่สำเร็จ:", lookupError.message);
        return res.status(500).json({ success: false, message: "ไม่สามารถลบข่าวได้" });
      }

      if (articles.length === 0) {
        return res.status(404).json({ success: false, message: "ไม่พบข่าวที่ต้องการลบ" });
      }

      const article = articles[0];
      const isSuperAdmin = req.admin.saka_path === "all";
      const isOwner = Number(article.created_by_admin_id) === Number(req.admin.sub);

      if (!isSuperAdmin && !isOwner) {
        return res.status(403).json({ success: false, message: "คุณลบได้เฉพาะข่าวที่คุณโพสต์" });
      }

      db.query("DELETE FROM news WHERE id = ?", [newsId], (deleteError, result) => {
        if (deleteError) {
          console.error("❌ ลบข่าวไม่สำเร็จ:", deleteError.message);
          return res.status(500).json({ success: false, message: "ไม่สามารถลบข่าวได้" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: "ไม่พบข่าวที่ต้องการลบ" });
        }

        if (article.image?.startsWith("/uploads/news/")) {
          safeDeleteFile(`.${article.image}`);
        }

        return res.json({ success: true, message: "ลบข่าวแล้ว" });
      });
    },
  );
});

app.delete("/api/admin/users/:id", requireAdmin, requireSuperAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: "รหัสผู้ใช้ไม่ถูกต้อง" });
  }

  if (id === Number(req.admin.sub)) {
    return res.status(400).json({ success: false, message: "ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้" });
  }

  db.query("SELECT saka_path FROM users WHERE id = ?", [id], (lookupError, users) => {
    if (lookupError) {
      console.error("❌ ตรวจสอบบัญชีผู้ดูแลไม่สำเร็จ:", lookupError.message);
      return res.status(500).json({ success: false, message: "ไม่สามารถตรวจสอบบัญชีผู้ดูแลได้" });
    }

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบบัญชีผู้ดูแลที่ต้องการลบ" });
    }

    if (users[0].saka_path === "all") {
      return res.status(403).json({ success: false, message: "ไม่สามารถลบบัญชี Super Admin ได้" });
    }

    db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("❌ ลบบัญชีผู้ดูแลไม่สำเร็จ:", err.message);
      return res.status(500).json({ success: false, message: "ไม่สามารถลบบัญชีผู้ดูแลได้" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบบัญชีผู้ดูแลที่ต้องการลบ" });
    }

    return res.json({ success: true, message: "ลบบัญชีผู้ดูแลแล้ว" });
    });
  });
});

app.post("/api/admin/approved-users/lookup", (req, res) => {
  const firstName = String(req.body.first_name || "").trim();
  const lastName = String(req.body.last_name || "").trim();

  if (!firstName || !lastName) {
    return res.status(400).json({ success: false, message: "กรุณากรอกชื่อและนามสกุลให้ครบ" });
  }

  db.query(
    "SELECT saka_path FROM approved_admins WHERE first_name = ? AND last_name = ? LIMIT 1",
    [firstName, lastName],
    (err, users) => {
      if (err) {
        console.error("❌ ตรวจสอบสาขาของผู้สมัคไม่สำเร็จ:", err.message);
        return res.status(500).json({ success: false, message: "ไม่สามารถตรวจสอบสาขาได้" });
      }

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: "ไม่พบชื่อ–นามสกุลในรายชื่อที่ได้รับอนุญาต" });
      }

      return res.json({ success: true, saka_path: users[0].saka_path });
    },
  );
});

app.get("/api/admin/approved-users", requireAdmin, requireSuperAdmin, (req, res) => {
  db.query(
    "SELECT id, first_name, last_name, saka_path, created_at FROM approved_admins ORDER BY first_name, last_name",
    (err, users) => {
      if (err) {
        console.error("❌ ดึงรายชื่อผู้ได้รับอนุญาตไม่สำเร็จ:", err.message);
        return res.status(500).json({ success: false, message: "ไม่สามารถดึงรายชื่อผู้ได้รับอนุญาตได้" });
      }
      return res.json({ success: true, users });
    },
  );
});

app.post("/api/admin/approved-users", requireAdmin, requireSuperAdmin, (req, res) => {
  const firstName = String(req.body.first_name || "").trim();
  const lastName = String(req.body.last_name || "").trim();
  const branch = String(req.body.saka_path || "").trim();

  if (!firstName || !lastName || !branch) {
    return res.status(400).json({ success: false, message: "กรุณากรอกชื่อ นามสกุล และสาขาให้ครบ" });
  }

  if (firstName.length > 100 || lastName.length > 100) {
    return res.status(400).json({ success: false, message: "ชื่อหรือนามสกุลยาวเกินกำหนด" });
  }

  if (!adminBranches.has(branch)) {
    return res.status(400).json({ success: false, message: "สาขาที่เลือกไม่ถูกต้อง" });
  }

  db.query(
    "INSERT INTO approved_admins (first_name, last_name, saka_path) VALUES (?, ?, ?)",
    [firstName, lastName, branch],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ success: false, message: "มีรายชื่อนี้อยู่แล้ว" });
        }
        console.error("❌ บันทึกรายชื่อผู้ได้รับอนุญาตไม่สำเร็จ:", err.message);
        return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกรายชื่อได้" });
      }

      return res.status(201).json({
        success: true,
        user: { id: result.insertId, first_name: firstName, last_name: lastName, saka_path: branch },
      });
    },
  );
});

app.patch("/api/admin/approved-users/:id", requireAdmin, requireSuperAdmin, (req, res) => {
  const id = Number(req.params.id);
  const firstName = String(req.body.first_name || "").trim();
  const lastName = String(req.body.last_name || "").trim();
  const branch = String(req.body.saka_path || "").trim();

  if (!Number.isInteger(id) || id < 1 || !firstName || !lastName || !branch) {
    return res.status(400).json({ success: false, message: "กรุณากรอกชื่อ นามสกุล และสาขาให้ครบ" });
  }

  if (firstName.length > 100 || lastName.length > 100 || !adminBranches.has(branch)) {
    return res.status(400).json({ success: false, message: "ข้อมูลที่กรอกไม่ถูกต้อง" });
  }

  db.query(
    "UPDATE approved_admins SET first_name = ?, last_name = ?, saka_path = ? WHERE id = ?",
    [firstName, lastName, branch, id],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ success: false, message: "มีรายชื่อนี้อยู่แล้ว" });
        }
        console.error("❌ แก้ไขรายชื่อผู้ได้รับอนุญาตไม่สำเร็จ:", err.message);
        return res.status(500).json({ success: false, message: "ไม่สามารถแก้ไขรายชื่อได้" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "ไม่พบรายชื่อที่ต้องการแก้ไข" });
      }

      return res.json({ success: true, user: { id, first_name: firstName, last_name: lastName, saka_path: branch } });
    },
  );
});

app.delete("/api/admin/approved-users/:id", requireAdmin, requireSuperAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: "รหัสรายชื่อไม่ถูกต้อง" });
  }

  db.getConnection((connectionError, connection) => {
    if (connectionError) {
      console.error("❌ เชื่อมต่อฐานข้อมูลเพื่อลบบัญชีไม่สำเร็จ:", connectionError.message);
      return res.status(500).json({ success: false, message: "ไม่สามารถลบรายชื่อได้" });
    }

    connection.beginTransaction((transactionError) => {
      if (transactionError) {
        connection.release();
        return res.status(500).json({ success: false, message: "ไม่สามารถเริ่มการลบข้อมูลได้" });
      }

      connection.query(
        "SELECT first_name, last_name, saka_path FROM approved_admins WHERE id = ? FOR UPDATE",
        [id],
        (selectError, approvedUsers) => {
          if (selectError || approvedUsers.length === 0) {
            connection.rollback(() => connection.release());
            if (selectError) {
              console.error("❌ ตรวจสอบรายชื่อก่อนลบไม่สำเร็จ:", selectError.message);
              return res.status(500).json({ success: false, message: "ไม่สามารถลบรายชื่อได้" });
            }
            return res.status(404).json({ success: false, message: "ไม่พบรายชื่อที่ต้องการลบ" });
          }

          const approvedUser = approvedUsers[0];
          connection.query(
            "DELETE FROM users WHERE first_name = ? AND last_name = ? AND saka_path = ? AND saka_path <> 'all'",
            [approvedUser.first_name, approvedUser.last_name, approvedUser.saka_path],
            (deleteUserError, deletedUsers) => {
              if (deleteUserError) {
                connection.rollback(() => connection.release());
                console.error("❌ ลบบัญชีผู้ดูแลไม่สำเร็จ:", deleteUserError.message);
                return res.status(500).json({ success: false, message: "ไม่สามารถลบบัญชีผู้ดูแลได้" });
              }

              connection.query("DELETE FROM approved_admins WHERE id = ?", [id], (deleteApprovedError) => {
                if (deleteApprovedError) {
                  connection.rollback(() => connection.release());
                  console.error("❌ ลบรายชื่อผู้ได้รับอนุญาตไม่สำเร็จ:", deleteApprovedError.message);
                  return res.status(500).json({ success: false, message: "ไม่สามารถลบรายชื่อได้" });
                }

                connection.commit((commitError) => {
                  if (commitError) {
                    connection.rollback(() => connection.release());
                    return res.status(500).json({ success: false, message: "ไม่สามารถยืนยันการลบข้อมูลได้" });
                  }

                  connection.release();
                  return res.json({
                    success: true,
                    message: "ลบรายชื่อและบัญชีผู้ดูแลแล้ว",
                    deletedUsers: deletedUsers.affectedRows,
                  });
                });
              });
            },
          );
        },
      );
    });
  });
});

app.post("/api/admin/users", requireAdmin, requireSuperAdmin, (req, res) => {
  const { username, password, first_name, last_name, saka_path } = req.body;
  const normalizedUsername = String(username || "").trim();
  const normalizedFirstName = String(first_name || "").trim();
  const normalizedLastName = String(last_name || "").trim();
  const normalizedBranch = String(saka_path || "").trim();

  if (!normalizedUsername || !password || !normalizedFirstName || !normalizedLastName || !normalizedBranch) {
    return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
  }

  if (normalizedUsername.length > 255 || normalizedFirstName.length > 100 || normalizedLastName.length > 100) {
    return res.status(400).json({ success: false, message: "ข้อมูลที่กรอกยาวเกินกำหนด" });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" });
  }

  if (!adminBranches.has(normalizedBranch)) {
    return res.status(400).json({ success: false, message: "สาขาที่เลือกไม่ถูกต้อง" });
  }

  db.query(
    `INSERT INTO users (username, password, first_name, last_name, saka_path, can_edit)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [
      normalizedUsername,
      hashAdminPassword(String(password)),
      normalizedFirstName,
      normalizedLastName,
      normalizedBranch,
    ],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ success: false, message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" });
        }

        console.error("❌ สร้างบัญชีผู้ดูแลไม่สำเร็จ:", err.message);
        return res.status(500).json({ success: false, message: "ไม่สามารถสร้างบัญชีผู้ใช้ได้" });
      }

      return res.status(201).json({
        success: true,
        message: "สร้างบัญชีผู้ดูแลสำเร็จ",
        user: {
          id: result.insertId,
          username: normalizedUsername,
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          saka_path: normalizedBranch,
          can_edit: 1,
        },
      });
    },
  );
});

app.patch("/api/news/:id", requireAdmin, upload.single("image"), (req, res) => {
  const newsId = Number(req.params.id);
  const title = String(req.body.title || "").trim();
  const category = String(req.body.category || "").trim();
  const description = String(req.body.description || "").trim();

  if (!Number.isInteger(newsId) || newsId < 1 || !title || !category || !description) {
    if (req.file) safeDeleteFile(req.file.path);
    return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลข่าวให้ครบ" });
  }

  db.query(
    "SELECT image, created_by_admin_id FROM news WHERE id = ?",
    [newsId],
    (lookupError, articles) => {
      if (lookupError || articles.length === 0) {
        if (req.file) safeDeleteFile(req.file.path);
        if (lookupError) console.error("❌ ตรวจสอบข่าวเพื่อแก้ไขไม่สำเร็จ:", lookupError.message);
        return res.status(lookupError ? 500 : 404).json({ success: false, message: lookupError ? "ไม่สามารถแก้ไขข่าวได้" : "ไม่พบข่าวที่ต้องการแก้ไข" });
      }

      const article = articles[0];
      const isSuperAdmin = req.admin.saka_path === "all";
      const isOwner = Number(article.created_by_admin_id) === Number(req.admin.sub);
      if (!isSuperAdmin && !isOwner) {
        if (req.file) safeDeleteFile(req.file.path);
        return res.status(403).json({ success: false, message: "คุณแก้ไขได้เฉพาะข่าวที่คุณโพสต์" });
      }

      const imagePath = req.file ? `/uploads/news/${req.file.filename}` : article.image;
      db.query(
        "UPDATE news SET title = ?, category = ?, description = ?, image = ? WHERE id = ?",
        [title, category, description, imagePath, newsId],
        async (updateError) => {
          if (updateError) {
            if (req.file) safeDeleteFile(req.file.path);
            console.error("❌ แก้ไขข่าวไม่สำเร็จ:", updateError.message);
            return res.status(500).json({ success: false, message: "ไม่สามารถแก้ไขข่าวได้" });
          }

          if (req.file && article.image?.startsWith("/uploads/news/")) {
            safeDeleteFile(`.${article.image}`);
          }

          const line = await notifyNewsLine(req.body.send_line, { id: newsId, title, category, description, image: imagePath });
          return res.json({ success: true, message: "แก้ไขข่าวแล้ว", image: imagePath, line });
        },
      );
    },
  );
});

// ==========================================
// 📌 สมัครบัญชีผู้ดูแลจากหน้า Login
// ==========================================
app.post("/api/admin/register", (req, res) => {
  const { username, password, first_name, last_name, saka_path } = req.body;
  const normalizedUsername = String(username || "").trim();
  const normalizedFirstName = String(first_name || "").trim();
  const normalizedLastName = String(last_name || "").trim();
  const normalizedBranch = String(saka_path || "").trim();

  if (!normalizedUsername || !password || !normalizedFirstName || !normalizedLastName || !normalizedBranch) {
    return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
  }

  if (normalizedUsername.length > 255 || normalizedFirstName.length > 100 || normalizedLastName.length > 100) {
    return res.status(400).json({ success: false, message: "ข้อมูลที่กรอกยาวเกินกำหนด" });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" });
  }

  if (!adminBranches.has(normalizedBranch)) {
    return res.status(400).json({ success: false, message: "สาขาที่เลือกไม่ถูกต้อง" });
  }

  db.query(
    "SELECT id FROM approved_admins WHERE first_name = ? AND last_name = ? AND saka_path = ? LIMIT 1",
    [normalizedFirstName, normalizedLastName, normalizedBranch],
    (approvedError, approvedUsers) => {
      if (approvedError) {
        console.error("❌ ตรวจสอบรายชื่อผู้ได้รับอนุญาตไม่สำเร็จ:", approvedError.message);
        return res.status(500).json({ success: false, message: "ไม่สามารถตรวจสอบสิทธิ์การสร้างบัญชีได้" });
      }

      if (approvedUsers.length === 0) {
        return res.status(403).json({ success: false, message: "ไม่พบชื่อ–นามสกุลในรายชื่อที่ได้รับอนุญาต" });
      }

      db.query(
        `INSERT INTO users (username, password, first_name, last_name, saka_path, can_edit)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [
          normalizedUsername,
          hashAdminPassword(String(password)),
          normalizedFirstName,
          normalizedLastName,
          normalizedBranch,
        ],
        (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ success: false, message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" });
        }

        console.error("❌ สมัครบัญชีผู้ดูแลไม่สำเร็จ:", err.message);
        return res.status(500).json({ success: false, message: "ไม่สามารถสร้างบัญชีผู้ใช้ได้" });
      }

      return res.status(201).json({
        success: true,
        message: "สร้างบัญชีสำเร็จ กรุณาเข้าสู่ระบบ",
      });
        },
      );
    },
  );
});

app.post("/api/admin/login", (req, res) => {
  const {
    username,
    password,
  } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message:
        "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
    });
  }

  const sql = `
    SELECT
      id,
      username,
      first_name,
      last_name,
      saka_path,
      can_edit,
      password
    FROM users
    WHERE username = ?
    LIMIT 1
  `;

  db.query(
    sql,
    [username],
    (err, results) => {
      if (err) {
        console.error(
          "❌ ตรวจสอบข้อมูลไม่สำเร็จ",
        );

        console.error(err);

        return res.status(500).json({
          success: false,
          message:
            "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล",
          error: err.message,
        });
      }

      if (results.length > 0 && verifyAdminPassword(password, results[0].password)) {
        const user = results[0];

        console.log(
          "✅ Admin เข้าสู่ระบบสำเร็จ:",
          user.username,
          "| saka:",
          user.saka_path,
          "| can_edit:",
          user.can_edit,
        );

        return res.status(200).json({
          success: true,

          message: "เข้าสู่ระบบสำเร็จ",

          token: createAdminToken(user),

          user: {
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            saka_path:
              user.saka_path || "all",
            can_edit:
              Number(user.can_edit || 0),
          },
        });
      }

      return res.status(401).json({
        success: false,
        message:
          "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
      });
    },
  );
});

// ==========================================
// 📌 ดึงข้อมูลทุกสาขา
// สำหรับ admin11 / admin12
// ==========================================

app.get("/api/courses", (req, res) => {
  const sql = `
    SELECT
      id,
      saka_path,
      faculty_name,
      title,
      english_title,
      hero_description,
      about_title,
      about_description_1,
      about_description_2,
      image,
      highlights,
      curriculum,
      curriculum_transfer,
      skills,
      careers,
      learning_environment,
      updated_at
    FROM course_info
    ORDER BY id ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "❌ ดึงข้อมูลทุกสาขาไม่สำเร็จ:",
        err,
      );

      return res.status(500).json({
        success: false,
        message:
          "ไม่สามารถดึงข้อมูลทุกสาขาได้",
        error: err.message,
      });
    }

    const parseJSON = (
      value,
      fallback = [],
    ) => {
      if (!value) {
        return fallback;
      }

      if (typeof value === "object") {
        return value;
      }

      try {
        return JSON.parse(value);
      } catch (error) {
        console.error(
          "❌ JSON Parse Error:",
          error,
        );

        return fallback;
      }
    };

    const courses = results.map(
      (course) => ({
        ...course,
        highlights: parseJSON(
          course.highlights,
        ),
        curriculum: normalizeCurriculum(course.curriculum),
        curriculum_transfer: normalizeCurriculum(course.curriculum_transfer),
        skills: parseJSON(
          course.skills,
        ),
        careers: parseJSON(
          course.careers,
        ),
        learning_environment: parseJSON(
          course.learning_environment,
        ),
      }),
    );

    return res.status(200).json({
      success: true,
      data: courses,
    });
  });
});

// ==========================================
// 📌 ดึงข้อมูลรายละเอียดสาขาวิชา
// ==========================================

app.get(
  "/api/courses/:saka_path",
  (req, res) => {
    const {
      saka_path,
    } = req.params;

    const sql = `
      SELECT
        id,
        saka_path,
        faculty_name,
        title,
        english_title,
        hero_description,
        about_title,
        about_description_1,
        about_description_2,
        image,
        highlights,
        curriculum,
        curriculum_transfer,
        skills,
        careers,
        learning_environment,
        updated_at
      FROM course_info
      WHERE saka_path = ?
      LIMIT 1
    `;

    db.query(
      sql,
      [saka_path],
      (err, results) => {
        if (err) {
          console.error(
            "❌ ดึงข้อมูลสาขาไม่สำเร็จ:",
            err,
          );

          return res.status(500).json({
            success: false,
            message:
              "ไม่สามารถดึงข้อมูลสาขาได้",
            error: err.message,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message:
              "ไม่พบข้อมูลสาขานี้",
          });
        }

        const course = results[0];

        const parseJSON = (
          value,
          fallback = [],
        ) => {
          if (!value) {
            return fallback;
          }

          if (typeof value === "object") {
            return value;
          }

          try {
            return JSON.parse(value);
          } catch (error) {
            console.error(
              "❌ JSON Parse Error:",
              error,
            );

            return fallback;
          }
        };

        return res.status(200).json({
          success: true,

          data: {
            ...course,

            highlights:
              parseJSON(
                course.highlights,
              ),

            curriculum: normalizeCurriculum(course.curriculum),
            curriculum_transfer: normalizeCurriculum(course.curriculum_transfer),

            skills:
              parseJSON(
                course.skills,
              ),

            careers:
              parseJSON(
                course.careers,
              ),
            learning_environment:
              parseJSON(
                course.learning_environment,
              ),
          },
        });
      },
    );
  },
);

// ==========================================
// 📌 แก้ไขข้อมูลรายละเอียดสาขาวิชา
// ตรวจสิทธิ์จาก Database ก่อนแก้
// ==========================================

app.put(
  "/api/courses/:saka_path",
  requireAdmin,
  (req, res) => {
    const {
      saka_path,
    } = req.params;

    // ตรวจสิทธิ์ก่อน
    checkAdminEditPermission(
      req,
      saka_path,
      (permissionError) => {
        if (permissionError) {
          return res.status(
            permissionError.status,
          ).json({
            success: false,
            message:
              permissionError.message,
            ...(permissionError.error
              ? {
                  error:
                    permissionError.error,
                }
              : {}),
          });
        }

        const {
          faculty_name,
          title,
          english_title,
          hero_description,
          about_title,
          about_description_1,
          about_description_2,
          image,
          highlights,
          curriculum,
          curriculum_transfer,
          skills,
          careers,
          learning_environment,
        } = req.body;

        if (!title) {
          return res.status(400).json({
            success: false,
            message:
              "กรุณากรอกชื่อสาขาวิชา",
          });
        }

        const sql = `
          UPDATE course_info

          SET
            faculty_name = ?,
            title = ?,
            english_title = ?,
            hero_description = ?,
            about_title = ?,
            about_description_1 = ?,
            about_description_2 = ?,
            image = ?,
            highlights = ?,
            curriculum = ?,
            curriculum_transfer = ?,
            skills = ?,
            careers = ?,
            learning_environment = ?

          WHERE saka_path = ?
        `;

        const values = [
          faculty_name || null,
          title,
          english_title || null,
          hero_description || null,
          about_title || null,
          about_description_1 ||
            null,
          about_description_2 ||
            null,
          image || null,
          JSON.stringify(
            highlights || [],
          ),
          JSON.stringify(
            curriculum || [],
          ),
          JSON.stringify(curriculum_transfer || []),
          JSON.stringify(
            skills || [],
          ),
          JSON.stringify(
            careers || [],
          ),
          JSON.stringify(
            learning_environment || [],
          ),
          saka_path,
        ];

        db.query(
          sql,
          values,
          (err, result) => {
            if (err) {
              console.error(
                "❌ แก้ไขข้อมูลสาขาไม่สำเร็จ:",
                err,
              );

              return res.status(500).json({
                success: false,
                message:
                  "ไม่สามารถบันทึกข้อมูลสาขาได้",
                error:
                  err.message,
              });
            }

            if (
              result.affectedRows === 0
            ) {
              return res.status(404).json({
                success: false,
                message:
                  "ไม่พบสาขาที่ต้องการแก้ไข",
              });
            }

            console.log(
              `✅ อัปเดตข้อมูลสาขา [${saka_path}] สำเร็จ`,
            );

            return res.status(200).json({
              success: true,
              message:
                "บันทึกข้อมูลสาขาสำเร็จ",
            });
          },
        );
      },
    );
  },
);

// ==========================================
// Error Handler สำหรับ Multer
// ==========================================

app.use(
  (err, req, res, next) => {
    if (
      err instanceof multer.MulterError
    ) {
      if (
        err.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "ขนาดรูปภาพต้องไม่เกิน 5MB",
        });
      }
    }

    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    next();
  },
);

// ==========================================
// Upload รูปภาพสาขา
// ==========================================

const courseUploadDir =
  "./uploads/courses";

if (
  !fs.existsSync(courseUploadDir)
) {
  fs.mkdirSync(
    courseUploadDir,
    { recursive: true },
  );
}

const courseStorage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb,
    ) => {
      cb(
        null,
        courseUploadDir,
      );
    },

    filename: (
      req,
      file,
      cb,
    ) => {
      const ext =
        path
          .extname(
            file.originalname,
          )
          .toLowerCase();

      const sakaPath =
        req.params.saka_path ||
        "course";

      const fileName =
        `${sakaPath}-${Date.now()}${ext}`;

      cb(
        null,
        fileName,
      );
    },
  });

const courseUpload =
  multer({
    storage:
      courseStorage,

    limits: {
      fileSize:
        5 * 1024 * 1024,
    },

    fileFilter: (
      req,
      file,
      cb,
    ) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
      ];

      if (
        allowedTypes.includes(
          file.mimetype,
        )
      ) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "รองรับเฉพาะ JPG, PNG และ WebP",
          ),
        );
      }
    },
  });

// ==========================================
// 📌 Upload รูปภาพสาขา
// ตรวจสิทธิ์ก่อน Upload
// ==========================================

app.post(
  "/api/courses/:saka_path/image",
  requireAdmin,
  (req, res, next) => {
    const {
      saka_path,
    } = req.params;

    checkAdminEditPermission(
      req,
      saka_path,
      (permissionError) => {
        if (permissionError) {
          return res
            .status(
              permissionError.status,
            )
            .json({
              success: false,
              message:
                permissionError.message,
              ...(permissionError.error
                ? {
                    error:
                      permissionError.error,
                  }
                : {}),
            });
        }

        next();
      },
    );
  },
  courseUpload.single("image"),
  (req, res) => {
    const {
      saka_path,
    } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "กรุณาเลือกรูปภาพ",
      });
    }

    const imagePath =
      `/uploads/courses/${req.file.filename}`;

    const sql = `
      UPDATE course_info
      SET image = ?
      WHERE saka_path = ?
    `;

    db.query(
      sql,
      [
        imagePath,
        saka_path,
      ],
      (err, result) => {
        if (err) {
          console.error(
            "❌ บันทึกรูปภาพสาขาไม่สำเร็จ:",
            err,
          );

          safeDeleteFile(
            req.file.path,
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                "ไม่สามารถบันทึกรูปภาพได้",
              error:
                err.message,
            });
        }

        if (
          result.affectedRows === 0
        ) {
          safeDeleteFile(
            req.file.path,
          );

          return res
            .status(404)
            .json({
              success: false,
              message:
                "ไม่พบข้อมูลสาขา",
            });
        }

        console.log(
          `✅ อัปโหลดรูปสาขา [${saka_path}] สำเร็จ`,
        );

        res
          .status(200)
          .json({
            success: true,
            message:
              "อัปโหลดรูปภาพสำเร็จ",
            image:
              imagePath,
          });
      },
    );
  },
);

// ==========================================
// 📌 Upload รูป Highlight
// ตรวจสิทธิ์ก่อน Upload
// ==========================================

app.post(
  "/api/courses/:saka_path/highlight-image",
  requireAdmin,
  (req, res, next) => {
    const {
      saka_path,
    } = req.params;

    checkAdminEditPermission(
      req,
      saka_path,
      (permissionError) => {
        if (permissionError) {
          return res
            .status(
              permissionError.status,
            )
            .json({
              success: false,
              message:
                permissionError.message,
              ...(permissionError.error
                ? {
                    error:
                      permissionError.error,
                  }
                : {}),
            });
        }

        next();
      },
    );
  },
  courseUpload.single("image"),
  (req, res) => {
    const {
      saka_path,
    } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "กรุณาเลือกรูปภาพ",
      });
    }

    const imagePath =
      `/uploads/courses/${req.file.filename}`;

    console.log(
      `✅ อัปโหลดรูป Highlight [${saka_path}] สำเร็จ`,
    );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "อัปโหลดรูป Highlight สำเร็จ",
        image:
          imagePath,
      });
  },
);

// ==========================================
// Start Server
// ==========================================

ensureApplicationSecondMajorColumn();
