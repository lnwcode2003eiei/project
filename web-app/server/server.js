
import express from "express";
import cors from "cors";
import db from "./db.js";
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

const facultyPageDefaults = [
  ["history", "ประวัติคณะฯ", "คณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏอุตรดิตถ์ มุ่งผลิตบัณฑิตที่มีความรู้ ความสามารถ และทักษะวิชาชีพ เพื่อตอบสนองความต้องการของภาคอุตสาหกรรมและสังคม"],
  ["vision", "วิสัยทัศน์ พันธกิจ กลยุทธ์", "มุ่งสู่การเป็นองค์กรชั้นนำด้านเทคโนโลยีอุตสาหกรรม ผลิตบัณฑิตที่มีคุณภาพ พร้อมสร้างงานวิจัยและนวัตกรรมที่เป็นประโยชน์ต่อสังคม"],
  ["structure", "โครงสร้างการบริหาร", "โครงสร้างการบริหารของคณะประกอบด้วยผู้บริหาร สาขาวิชา และหน่วยงานต่าง ๆ ที่ทำงานร่วมกันเพื่อสนับสนุนการเรียนการสอน การวิจัย และการบริการวิชาการ"],
  ["executive", "ผู้บริหาร", "ข้อมูลผู้บริหารของคณะ ผู้ทำหน้าที่กำหนดนโยบาย วางแผนการดำเนินงาน และบริหารจัดการคณะเพื่อให้บรรลุเป้าหมายและพันธกิจที่กำหนดไว้"],
  ["teacher", "คณาจารย์ / นักวิจัย", "คณาจารย์และนักวิจัยของคณะมีความเชี่ยวชาญในหลากหลายสาขาด้านเทคโนโลยีอุตสาหกรรม พร้อมสร้างผลงานวิจัยและนวัตกรรมเพื่อการพัฒนาสังคม"],
  ["department", "หน่วยงาน", "คณะประกอบด้วยหน่วยงานและส่วนงานต่าง ๆ ที่ทำหน้าที่สนับสนุนการเรียนการสอน การวิจัย การบริการวิชาการ และการบริหารงานภายในคณะ"],
];

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
      ensureFacultyPagesTable();
      return;
    }

    if (columns.length > 0) {
      ensureFacultyPagesTable();
      return;
    }

    db.query("ALTER TABLE news ADD COLUMN created_by_admin_id INT NULL AFTER image", (alterError) => {
      if (alterError) {
        console.error("❌ เพิ่มข้อมูลผู้โพสต์ข่าวไม่สำเร็จ:", alterError.message);
      }
      ensureFacultyPagesTable();
    });
  });
};

const ensureFacultyPagesTable = () => {
  db.query(
    `CREATE TABLE IF NOT EXISTS faculty_pages (
      slug VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    (tableError) => {
      if (tableError) {
        console.error("❌ สร้างตารางแนะนำคณะไม่สำเร็จ:", tableError.message);
        ensureFacultyHistoryTables();
        return;
      }

      const sql = "INSERT IGNORE INTO faculty_pages (slug, title, content) VALUES ?";
      db.query(sql, [facultyPageDefaults], (seedError) => {
        if (seedError) {
          console.error("❌ เพิ่มข้อมูลเริ่มต้นแนะนำคณะไม่สำเร็จ:", seedError.message);
        }
        ensureFacultyHistoryTables();
      });
    },
  );
};

const ensureFacultyHistoryTables = () => {
  db.query(
    `CREATE TABLE IF NOT EXISTS faculty_history (
      id TINYINT PRIMARY KEY,
      hero_title VARCHAR(255) NOT NULL,
      hero_subtitle VARCHAR(500) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    (historyError) => {
      if (historyError) { ensureFacultyTeachersTable(); return; }
      db.query(
        `CREATE TABLE IF NOT EXISTS faculty_history_events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          date_label VARCHAR(100) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          side ENUM('left', 'right') NOT NULL DEFAULT 'left',
          icon VARCHAR(50) NOT NULL DEFAULT 'lucide:building-2',
          display_order INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        (eventsError) => {
          if (eventsError) { ensureFacultyTeachersTable(); return; }
          db.query("INSERT IGNORE INTO faculty_history (id, hero_title, hero_subtitle) VALUES (1, ?, ?)", ["ประวัติและความเป็นมา", "ต้นกำเนิดและก้าวสำคัญในการขยายรากฐานทางการเรียนรู้ วิชาชีพทางวิศวกรรมและเทคโนโลยี"], () => {
            db.query("SELECT COUNT(*) AS total FROM faculty_history_events", (countError, rows) => {
              if (countError || rows[0].total > 0) { ensureFacultyTeachersTable(); return; }
              db.query("INSERT INTO faculty_history_events (date_label, title, description, side, icon, display_order) VALUES ?", [[
                ["จุดเริ่มต้นความสำเร็จ", "จุดเริ่มต้นความสำเร็จ", "คณะมุ่งเน้นการผลิตบัณฑิตที่มีความรู้ ความสามารถ และทักษะวิชาชีพ เพื่อตอบสนองความต้องการของภาคอุตสาหกรรมและสังคม", "left", "lucide:building-2", 0],
                ["ปีการศึกษา 2542", "มุ่งพัฒนาขยายโอกาสทางการศึกษา", "เริ่มเปิดโอกาสทางการศึกษาเพื่อสร้างบุคลากรที่มีความรู้และทักษะด้านเทคโนโลยี", "right", "lucide:hourglass", 1],
                ["วันที่ 10 กันยายน 2544", "จุดเปลี่ยนครั้งยิ่ง: ตั้งเป็นคณะ", "พัฒนาการครั้งสำคัญเพื่อขับเคลื่อนการศึกษาและเทคโนโลยีอุตสาหกรรม", "left", "lucide:award", 2],
              ]], () => ensureFacultyTeachersTable());
            });
          });
        },
      );
    },
  );
};

const ensureFacultyTeachersTable = () => {
  db.query(`CREATE TABLE IF NOT EXISTS faculty_teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    image_filename VARCHAR(255) NULL,
    profile_link VARCHAR(1000) NULL,
    display_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, () => ensureFacultyTeacherProfileLinkColumn());
};

const ensureFacultyTeacherProfileLinkColumn = () => {
  db.query("SHOW COLUMNS FROM faculty_teachers LIKE 'profile_link'", (error, columns) => {
    if (error || columns.length > 0) return ensureFacultyProfilesTable();
    db.query("ALTER TABLE faculty_teachers ADD COLUMN profile_link VARCHAR(1000) NULL AFTER image_filename", () => ensureFacultyProfilesTable());
  });
};

const ensureFacultyProfilesTable = () => db.query(`CREATE TABLE IF NOT EXISTS faculty_profiles (id INT AUTO_INCREMENT PRIMARY KEY, profile_type VARCHAR(20) NOT NULL, group_name VARCHAR(255) NOT NULL, full_name VARCHAR(255) NOT NULL, position VARCHAR(255) NOT NULL, image_filename VARCHAR(255) NULL, display_order INT NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, () => ensureFacultyStructureImageTable());

const ensureFacultyStructureImageTable = () => {
  db.query(`CREATE TABLE IF NOT EXISTS faculty_structure_image (
    id TINYINT PRIMARY KEY,
    image_filename VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, () => {
    db.query("INSERT IGNORE INTO faculty_structure_image (id, image_filename) VALUES (1, NULL)", () => ensureFacultyStructureImagesTable());
  });
};

const ensureFacultyStructureImagesTable = () => {
  db.query(`CREATE TABLE IF NOT EXISTS faculty_structure_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_filename VARCHAR(255) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, () => {
    db.query("INSERT IGNORE INTO faculty_structure_images (image_filename, display_order) SELECT image_filename, 0 FROM faculty_structure_image WHERE id = 1 AND image_filename IS NOT NULL AND image_filename <> ''", () => ensureFacultyVisionTables());
  });
};

const ensureFacultyVisionTables = () => {
  db.query(`CREATE TABLE IF NOT EXISTS faculty_vision (
    id TINYINT PRIMARY KEY,
    philosophy_title VARCHAR(255) NOT NULL,
    philosophy_text TEXT NOT NULL,
    ambition_title VARCHAR(255) NOT NULL,
    ambition_text TEXT NOT NULL,
    goal_title VARCHAR(255) NOT NULL,
    goal_subtitle VARCHAR(500) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, () => {
    db.query(`CREATE TABLE IF NOT EXISTS faculty_vision_cards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      icon VARCHAR(50) NOT NULL DEFAULT 'lucide:circle',
      display_order INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, () => {
      db.query("INSERT IGNORE INTO faculty_vision (id, philosophy_title, philosophy_text, ambition_title, ambition_text, goal_title, goal_subtitle) VALUES (1, ?, ?, ?, ?, ?, ?)", ["ปรัชญา", "มุ่งสร้างบัณฑิตด้านเทคโนโลยีที่มีความรู้ ความสามารถ คุณธรรม และทักษะวิชาชีพเพื่อพัฒนาสังคม", "ปณิธาน", "สร้างนวัตกรรมและผลิตบัณฑิตที่มีคุณภาพ เพื่อตอบสนองความต้องการของท้องถิ่นและประเทศ", "เป้าหมายและการพัฒนาอย่างต่อเนื่อง", "พัฒนาคณะให้ก้าวทันเทคโนโลยีและความต้องการของสังคม"], () => {
        db.query("SELECT COUNT(*) AS total FROM faculty_vision_cards", (error, rows) => {
          if (error || Number(rows[0].total) > 0) { ensureBootstrapAdmin(); return; }
          db.query("INSERT INTO faculty_vision_cards (title, description, icon, display_order) VALUES ?", [[
            ["วิสัยทัศน์", "คณะเทคโนโลยีอุตสาหกรรมเป็นองค์กรแห่งการเรียนรู้ ผลิตบัณฑิตที่มีคุณภาพและเป็นที่ยอมรับ", "lucide:eye", 0],
            ["กลยุทธ์", "พัฒนาหลักสูตร บุคลากร งานวิจัย และเครือข่ายความร่วมมือให้สอดคล้องกับการเปลี่ยนแปลง", "lucide:route", 1],
            ["อัตลักษณ์", "นักเทคโนโลยี มีทักษะวิชาชีพ มีจิตบริการ และพร้อมทำงานร่วมกับผู้อื่น", "lucide:user-check", 2],
            ["ผลการบริหาร", "ดำเนินงานอย่างมีประสิทธิภาพ โปร่งใส และมุ่งผลสัมฤทธิ์ของผู้เรียน", "lucide:users", 3],
          ]], () => ensureBootstrapAdmin());
        });
      });
    });
  });
};

const ensureFacultyStructureTable = () => {
  db.query(`CREATE TABLE IF NOT EXISTS faculty_structure_nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500) NULL,
    section VARCHAR(20) NULL,
    theme VARCHAR(20) NOT NULL DEFAULT 'blue',
    display_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, (error) => {
    if (error) {
      console.error("❌ สร้างตารางโครงสร้างการบริหารไม่สำเร็จ:", error.message);
      ensureBootstrapAdmin();
      return;
    }
    db.query("SELECT COUNT(*) AS total FROM faculty_structure_nodes", (countError, rows) => {
      if (countError || Number(rows[0].total) > 0) { ensureFacultyStructureSectionColumn(); return; }
      db.query("INSERT INTO faculty_structure_nodes (id, parent_id, title, subtitle, section, theme, display_order) VALUES ?", [[
        [1, null, "คณบดี", "", "dean", "navy", 0],
        [2, 1, "คณะกรรมการประจำคณะ", "", "committee", "purple", 0],
        [3, 1, "รองคณบดีฝ่ายบริหาร", "", "vice", "blue", 0],
        [4, 1, "รองคณบดีฝ่ายวิชาการ", "", "vice", "blue", 1],
        [5, 1, "รองคณบดีฝ่ายกิจการนักศึกษา", "", "vice", "blue", 2],
        [6, 1, "ผู้ช่วยคณบดีฝ่ายบริหาร", "", "assistant", "green", 0],
        [7, 1, "ผู้ช่วยคณบดีฝ่ายวิชาการ", "", "assistant", "green", 1],
        [8, 1, "ผู้ช่วยคณบดีฝ่ายกิจการนักศึกษา", "", "assistant", "green", 2],
        [9, 1, "หัวหน้างานบริหาร", "", "head", "orange", 0],
        [10, 1, "หัวหน้างานวิชาการ", "", "head", "orange", 1],
        [11, 1, "หัวหน้างานกิจการนักศึกษา", "", "head", "orange", 2],
        [12, 1, "หัวหน้างานบริหารวิชาการ", "", "head", "orange", 3],
      ]], () => ensureFacultyStructureSectionColumn());
    });
  });
};

const ensureFacultyStructureSectionColumn = () => {
  db.query("SHOW COLUMNS FROM faculty_structure_nodes LIKE 'section'", (error, columns) => {
    if (error) { ensureBootstrapAdmin(); return; }
    if (columns.length > 0) { ensureFacultyStructureRows(); return; }
    db.query("ALTER TABLE faculty_structure_nodes ADD COLUMN section VARCHAR(20) NULL AFTER subtitle", () => {
      db.query("UPDATE faculty_structure_nodes SET section = CASE id WHEN 1 THEN 'dean' WHEN 2 THEN 'vice' WHEN 3 THEN 'vice' WHEN 4 THEN 'vice' WHEN 5 THEN 'assistant' ELSE 'head' END WHERE section IS NULL", () => ensureFacultyStructureRows());
    });
  });
};

const ensureFacultyStructureRows = () => {
  const defaults = [
    ["คณะกรรมการประจำคณะ", "", "committee", "purple", 0],
    ["ผู้ช่วยคณบดีฝ่ายวิชาการ", "", "assistant", "green", 1],
    ["ผู้ช่วยคณบดีฝ่ายกิจการนักศึกษา", "", "assistant", "green", 2],
    ["หัวหน้างานบริหารวิชาการ", "", "head", "orange", 3],
  ];
  let index = 0;
  const addNext = () => {
    if (index >= defaults.length) { ensureBootstrapAdmin(); return; }
    const [title, subtitle, section, theme, displayOrder] = defaults[index++];
    db.query("SELECT id FROM faculty_structure_nodes WHERE title = ? LIMIT 1", [title], (error, rows) => {
      if (error || rows.length > 0) { addNext(); return; }
      db.query("INSERT INTO faculty_structure_nodes (title, subtitle, section, theme, display_order) VALUES (?, ?, ?, ?, ?)", [title, subtitle, section, theme, displayOrder], addNext);
    });
  };
  addNext();
};

void ensureFacultyStructureTable;

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

// ==========================================
// Static Uploads
// ==========================================

const uploadDir = "./uploads/news";
const teacherUploadDir = "./uploads/teachers";
const structureUploadDir = "./uploads/structure";
const visionUploadDir = "./uploads/vision";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(teacherUploadDir)) {
  fs.mkdirSync(teacherUploadDir, { recursive: true });
}

if (!fs.existsSync(structureUploadDir)) {
  fs.mkdirSync(structureUploadDir, { recursive: true });
}
if (!fs.existsSync(visionUploadDir)) fs.mkdirSync(visionUploadDir, { recursive: true });

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
  const { name, status } = req.body;

  if (!name || !status) {
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
  const sql = `
    SELECT
      id,
      name,
      status,
      created_at
    FROM visitors
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
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
  const sql = `
    SELECT
      id,
      fullname AS name,
      old_school AS school,
      major_name AS major,
      second_major_name AS second_major,
      education AS status,
      created_at
    FROM applications
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
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
    GROUP BY major_name
    ORDER BY count DESC
  `;

  db.query(sql, (err, results) => {
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
    (err, result) => {
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

      res.status(201).json({
        success: true,
        message: "เพิ่มข่าวสำเร็จ",
        id: result.insertId,
        image: imagePath,
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
          "❌ บันทึกข้อมูลการสมัครไม่สำเร็จ",
        );

        console.error(err);

        return res.status(500).json({
          success: false,
          message:
            "ไม่สามารถบันทึกข้อมูลการสมัครได้",
          error: err.message,
        });
      }

      console.log(
        "✅ บันทึกข้อมูลการสมัครเรียนเรียบร้อย ID:",
        result.insertId,
      );

      res.status(201).json({
        success: true,
        message: "ส่งใบสมัครเรียบร้อยแล้ว",
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
        "❌ ดึงข้อมูลการสมัครไม่สำเร็จ",
      );

      console.error(err);

      return res.status(500).json({
        success: false,
        message:
          "ไม่สามารถดึงข้อมูลการสมัครได้",
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

app.get("/api/faculty-pages/:slug", (req, res) => {
  const slug = String(req.params.slug || "").trim();
  if (!facultyPageDefaults.some(([pageSlug]) => pageSlug === slug)) {
    return res.status(404).json({ success: false, message: "ไม่พบหัวข้อแนะนำคณะ" });
  }

  db.query("SELECT slug, title, content, updated_at FROM faculty_pages WHERE slug = ?", [slug], (err, pages) => {
    if (err) {
      console.error("❌ ดึงข้อมูลแนะนำคณะไม่สำเร็จ:", err.message);
      return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลได้" });
    }
    if (pages.length === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลหัวข้อนี้" });
    }
    return res.json({ success: true, page: pages[0] });
  });
});

app.get("/api/faculty-structure", (req, res) => {
  db.query("SELECT id, parent_id, title, subtitle, section, theme, display_order FROM faculty_structure_nodes ORDER BY section, display_order, id", (err, nodes) => {
    if (err) return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลโครงสร้างการบริหารได้" });
    return res.json({ success: true, nodes });
  });
});

app.get("/api/faculty-structure-image", (req, res) => {
  db.query("SELECT image_filename, updated_at FROM faculty_structure_image WHERE id = 1", (err, rows) => {
    if (err || rows.length === 0) return res.status(500).json({ success: false, message: "ไม่สามารถดึงรูปผังองค์กรได้" });
    return res.json({ success: true, image: rows[0] });
  });
});

app.get("/api/faculty-structure-images", (req, res) => {
  db.query("SELECT id, image_filename, display_order, created_at FROM faculty_structure_images ORDER BY display_order, id", (err, images) => {
    if (err) return res.status(500).json({ success: false, message: "ไม่สามารถดึงรูปผังองค์กรได้" });
    return res.json({ success: true, images });
  });
});

app.get("/api/faculty-vision", (req, res) => {
  db.query("SELECT philosophy_title, philosophy_text, ambition_title, ambition_text, goal_title, goal_subtitle FROM faculty_vision WHERE id = 1", (visionError, visions) => {
    if (visionError || visions.length === 0) return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลวิสัยทัศน์ได้" });
    db.query("SELECT id, title, description, icon, display_order FROM faculty_vision_cards ORDER BY display_order, id", (cardsError, cards) => {
      if (cardsError) return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลวิสัยทัศน์ได้" });
      return res.json({ success: true, vision: visions[0], cards });
    });
  });
});

app.get("/api/faculty-vision-image", (req, res) => {
  db.query("CREATE TABLE IF NOT EXISTS faculty_vision_image (id TINYINT PRIMARY KEY, image_filename VARCHAR(255) NULL)", () => {
    db.query("INSERT IGNORE INTO faculty_vision_image (id, image_filename) VALUES (1, NULL)", () => {
      db.query("SELECT image_filename FROM faculty_vision_image WHERE id = 1", (err, rows) => res.json({ success: !err, image_filename: rows?.[0]?.image_filename || "" }));
    });
  });
});

app.put("/api/admin/faculty-vision", requireAdmin, requireSuperAdmin, (req, res) => {
  const vision = req.body.vision || {}; const cards = Array.isArray(req.body.cards) ? req.body.cards : [];
  const fields = ["philosophy_title", "philosophy_text", "ambition_title", "ambition_text", "goal_title", "goal_subtitle"];
  if (fields.some((field) => !String(vision[field] || "").trim()) || cards.length === 0 || cards.length > 8 || cards.some((card) => !String(card.title || "").trim() || !String(card.description || "").trim())) return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบ" });
  db.getConnection((connectionError, connection) => {
    if (connectionError) return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกข้อมูลได้" });
    connection.beginTransaction((transactionError) => {
      if (transactionError) { connection.release(); return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกข้อมูลได้" }); }
      connection.query("UPDATE faculty_vision SET philosophy_title = ?, philosophy_text = ?, ambition_title = ?, ambition_text = ?, goal_title = ?, goal_subtitle = ? WHERE id = 1", fields.map((field) => String(vision[field]).trim()), (visionError) => {
        if (visionError) return connection.rollback(() => connection.release());
        connection.query("DELETE FROM faculty_vision_cards", (deleteError) => {
          if (deleteError) return connection.rollback(() => connection.release());
          const values = cards.map((card, index) => [String(card.title).trim(), String(card.description).trim(), ["lucide:eye", "lucide:route", "lucide:user-check", "lucide:users", "lucide:target"].includes(card.icon) ? card.icon : "lucide:target", index]);
          connection.query("INSERT INTO faculty_vision_cards (title, description, icon, display_order) VALUES ?", [values], (insertError) => {
            if (insertError) return connection.rollback(() => connection.release());
            connection.commit((commitError) => { connection.release(); if (commitError) return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกข้อมูลได้" }); return res.json({ success: true, message: "บันทึกวิสัยทัศน์ พันธกิจ และกลยุทธ์แล้ว" }); });
          });
        });
      });
    });
  });
});

app.post("/api/admin/faculty-structure", requireAdmin, requireSuperAdmin, (req, res) => {
  const title = String(req.body.title || "").trim();
  const subtitle = String(req.body.subtitle || "").trim();
  const section = ["dean", "committee", "vice", "assistant", "head"].includes(req.body.section) ? req.body.section : "vice";
  const theme = ["navy", "blue", "green", "orange", "purple"].includes(req.body.theme) ? req.body.theme : "blue";
  if (!title) return res.status(400).json({ success: false, message: "กรุณากรอกชื่อหน่วยงานให้ครบ" });
  db.query("INSERT INTO faculty_structure_nodes (parent_id, title, subtitle, section, theme, display_order) VALUES (NULL, ?, ?, ?, ?, ?)", [title, subtitle, section, theme, Number(req.body.display_order) || 0], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "ไม่สามารถเพิ่มรายการได้" });
    return res.status(201).json({ success: true, node: { id: result.insertId, title, subtitle, section, theme, display_order: Number(req.body.display_order) || 0 } });
  });
});

app.patch("/api/admin/faculty-structure/:id", requireAdmin, requireSuperAdmin, (req, res) => {
  const id = Number(req.params.id);
  const title = String(req.body.title || "").trim(); const subtitle = String(req.body.subtitle || "").trim();
  const section = ["dean", "committee", "vice", "assistant", "head"].includes(req.body.section) ? req.body.section : "vice";
  const theme = ["navy", "blue", "green", "orange", "purple"].includes(req.body.theme) ? req.body.theme : "blue";
  if (!Number.isInteger(id) || !title) return res.status(400).json({ success: false, message: "ข้อมูลโครงสร้างไม่ถูกต้อง" });
  db.query("UPDATE faculty_structure_nodes SET title = ?, subtitle = ?, section = ?, theme = ?, display_order = ? WHERE id = ?", [title, subtitle, section, theme, Number(req.body.display_order) || 0, id], (err, result) => {
    if (err || result.affectedRows === 0) return res.status(err ? 500 : 404).json({ success: false, message: "ไม่สามารถแก้ไขรายการได้" });
    return res.json({ success: true, message: "แก้ไขรายการแล้ว" });
  });
});

app.delete("/api/admin/faculty-structure/:id", requireAdmin, requireSuperAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.query("DELETE FROM faculty_structure_nodes WHERE id = ?", [id], (err, result) => {
    if (err || result.affectedRows === 0) return res.status(err ? 500 : 404).json({ success: false, message: "ไม่สามารถลบรายการได้" });
    return res.json({ success: true, message: "ลบรายการแล้ว" });
  });
});

const teacherStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, teacherUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `teacher-${Date.now()}${ext}`);
  },
});

const teacherUpload = multer({
  storage: teacherStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) return cb(null, true);
    return cb(new Error("รองรับเฉพาะ JPG, PNG และ WebP"));
  },
});

const structureStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, structureUploadDir),
  filename: (req, file, cb) => cb(null, `structure-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`),
});

const structureUpload = multer({
  storage: structureStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.mimetype)) return cb(null, true);
    return cb(new Error("รองรับเฉพาะ JPG, PNG และ WebP"));
  },
});

const visionUpload = multer({ storage: multer.diskStorage({ destination: (req, file, cb) => cb(null, visionUploadDir), filename: (req, file, cb) => cb(null, `vision-${Date.now()}${path.extname(file.originalname).toLowerCase()}`) }), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype) ? cb(null, true) : cb(new Error("รองรับเฉพาะ JPG, PNG และ WebP")) });

app.put("/api/admin/faculty-vision-image", requireAdmin, requireSuperAdmin, visionUpload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "กรุณาเลือกรูปภาพ" });
  db.query("CREATE TABLE IF NOT EXISTS faculty_vision_image (id TINYINT PRIMARY KEY, image_filename VARCHAR(255) NULL)", () => db.query("INSERT IGNORE INTO faculty_vision_image (id, image_filename) VALUES (1, NULL)", () => db.query("SELECT image_filename FROM faculty_vision_image WHERE id = 1", (findError, rows) => {
    if (findError) return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกรูปได้" });
    db.query("UPDATE faculty_vision_image SET image_filename = ? WHERE id = 1", [req.file.filename], (err) => { if (err) return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกรูปได้" }); if (rows[0]?.image_filename) safeDeleteFile(path.join(visionUploadDir, rows[0].image_filename)); return res.json({ success: true, image_filename: req.file.filename, message: "อัปโหลดรูปแล้ว" }); });
  })));
});

app.put("/api/admin/faculty-structure-image", requireAdmin, requireSuperAdmin, structureUpload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "กรุณาเลือกรูปผังองค์กร" });
  db.query("SELECT image_filename FROM faculty_structure_image WHERE id = 1", (findError, rows) => {
    if (findError) { safeDeleteFile(req.file.path); return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกรูปภาพได้" }); }
    db.query("UPDATE faculty_structure_image SET image_filename = ? WHERE id = 1", [req.file.filename], (updateError) => {
      if (updateError) { safeDeleteFile(req.file.path); return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกรูปภาพได้" }); }
      if (rows[0]?.image_filename) safeDeleteFile(path.join(structureUploadDir, rows[0].image_filename));
      return res.json({ success: true, message: "อัปโหลดรูปผังองค์กรแล้ว", image_filename: req.file.filename });
    });
  });
});

app.post("/api/admin/faculty-structure-images", requireAdmin, requireSuperAdmin, structureUpload.array("images", 10), (req, res) => {
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ success: false, message: "กรุณาเลือกรูปผังองค์กร" });
  db.query("SELECT COALESCE(MAX(display_order), -1) AS last_order FROM faculty_structure_images", (findError, rows) => {
    if (findError) { files.forEach((file) => safeDeleteFile(file.path)); return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกรูปภาพได้" }); }
    const startOrder = Number(rows[0].last_order) + 1;
    db.query("INSERT INTO faculty_structure_images (image_filename, display_order) VALUES ?", [files.map((file, index) => [file.filename, startOrder + index])], (insertError, result) => {
      if (insertError) { files.forEach((file) => safeDeleteFile(file.path)); return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกรูปภาพได้" }); }
      return res.status(201).json({ success: true, message: `อัปโหลดรูปผังองค์กร ${files.length} รูปแล้ว`, inserted: result.affectedRows });
    });
  });
});

app.delete("/api/admin/faculty-structure-images/:id", requireAdmin, requireSuperAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "ข้อมูลรูปภาพไม่ถูกต้อง" });
  db.query("SELECT image_filename FROM faculty_structure_images WHERE id = ?", [id], (findError, rows) => {
    if (findError || !rows.length) return res.status(findError ? 500 : 404).json({ success: false, message: "ไม่พบรูปภาพ" });
    db.query("DELETE FROM faculty_structure_images WHERE id = ?", [id], (deleteError) => {
      if (deleteError) return res.status(500).json({ success: false, message: "ไม่สามารถลบรูปภาพได้" });
      safeDeleteFile(path.join(structureUploadDir, rows[0].image_filename));
      return res.json({ success: true, message: "ลบรูปภาพแล้ว" });
    });
  });
});

app.put("/api/faculty-pages/:slug", requireAdmin, requireSuperAdmin, (req, res) => {
  const slug = String(req.params.slug || "").trim();
  const title = String(req.body.title || "").trim();
  const content = String(req.body.content || "").trim();
  if (!facultyPageDefaults.some(([pageSlug]) => pageSlug === slug) || !title || !content) {
    return res.status(400).json({ success: false, message: "กรุณากรอกหัวข้อและเนื้อหาให้ครบ" });
  }
  if (title.length > 255 || content.length > 10000) {
    return res.status(400).json({ success: false, message: "ข้อมูลยาวเกินกำหนด" });
  }

  db.query("UPDATE faculty_pages SET title = ?, content = ? WHERE slug = ?", [title, content, slug], (err, result) => {
    if (err) {
      console.error("❌ บันทึกข้อมูลแนะนำคณะไม่สำเร็จ:", err.message);
      return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกข้อมูลได้" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบหัวข้อที่ต้องการแก้ไข" });
    }
    return res.json({ success: true, message: "บันทึกข้อมูลแล้ว", page: { slug, title, content } });
  });
});

app.get("/api/faculty-history", (req, res) => {
  db.query("SELECT hero_title, hero_subtitle FROM faculty_history WHERE id = 1", (historyError, histories) => {
    if (historyError || histories.length === 0) {
      if (historyError) console.error("❌ ดึงประวัติคณะไม่สำเร็จ:", historyError.message);
      return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลประวัติคณะได้" });
    }
    db.query("SELECT id, date_label, title, description, side, icon FROM faculty_history_events ORDER BY display_order, id", (eventsError, events) => {
      if (eventsError) {
        console.error("❌ ดึงไทม์ไลน์ไม่สำเร็็จ:", eventsError.message);
        return res.status(500).json({ success: false, message: "ไม่สามารถดึงไทม์ไลน์ได้" });
      }
      return res.json({ success: true, history: histories[0], events });
    });
  });
});

app.put("/api/admin/faculty-history", requireAdmin, requireSuperAdmin, (req, res) => {
  const heroTitle = String(req.body.hero_title || "").trim();
  const heroSubtitle = String(req.body.hero_subtitle || "").trim();
  const events = Array.isArray(req.body.events) ? req.body.events : [];
  if (!heroTitle || !heroSubtitle || events.length === 0 || events.length > 20) {
    return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลหัวข้อและไทม์ไลน์ให้ครบ" });
  }
  const normalizedEvents = events.map((event, index) => ({
    date_label: String(event.date_label || "").trim(),
    title: String(event.title || "").trim(),
    description: String(event.description || "").trim(),
    side: event.side === "right" ? "right" : "left",
    icon: ["lucide:building-2", "lucide:hourglass", "lucide:award"].includes(event.icon) ? event.icon : "lucide:building-2",
    display_order: index,
  }));
  if (normalizedEvents.some((event) => !event.date_label || !event.title || !event.description)) {
    return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลของทุกเหตุการณ์ให้ครบ" });
  }

  db.getConnection((connectionError, connection) => {
    if (connectionError) return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกข้อมูลได้" });
    connection.beginTransaction((transactionError) => {
      if (transactionError) { connection.release(); return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกข้อมูลได้" }); }
      connection.query("UPDATE faculty_history SET hero_title = ?, hero_subtitle = ? WHERE id = 1", [heroTitle, heroSubtitle], (historyError) => {
        if (historyError) { connection.rollback(() => connection.release()); return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกข้อมูลได้" }); }
        connection.query("DELETE FROM faculty_history_events", (deleteError) => {
          if (deleteError) { connection.rollback(() => connection.release()); return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกไทม์ไลน์ได้" }); }
          connection.query("INSERT INTO faculty_history_events (date_label, title, description, side, icon, display_order) VALUES ?", [normalizedEvents.map((event) => [event.date_label, event.title, event.description, event.side, event.icon, event.display_order])], (insertError) => {
            if (insertError) { connection.rollback(() => connection.release()); return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกไทม์ไลน์ได้" }); }
            connection.commit((commitError) => {
              if (commitError) { connection.rollback(() => connection.release()); return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกข้อมูลได้" }); }
              connection.release();
              return res.json({ success: true, message: "บันทึกประวัติคณะแล้ว" });
            });
          });
        });
      });
    });
  });
});

app.get("/api/faculty-teachers", (req, res) => {
  db.query("SELECT id, group_name, full_name, position, image_filename, profile_link, display_order FROM faculty_teachers ORDER BY group_name, display_order, id", (err, teachers) => {
    if (err) return res.status(500).json({ success: false, message: "ไม่สามารถดึงรายชื่อคณาจารย์ได้" });
    return res.json({ success: true, teachers });
  });
});

app.post("/api/admin/faculty-teachers", requireAdmin, requireSuperAdmin, teacherUpload.single("image"), (req, res) => {
  const groupName = String(req.body.group_name || "").trim(); const fullName = String(req.body.full_name || "").trim(); const position = String(req.body.position || "").trim(); const profileLink = String(req.body.profile_link || "").trim(); const imageFilename = req.file ? req.file.filename : "";
  if (!groupName || !fullName || !position || (profileLink && !/^https?:\/\/\S+$/i.test(profileLink))) {
    safeDeleteFile(req.file?.path);
    return res.status(400).json({ success: false, message: "กรุณากรอกกลุ่ม ชื่อ และตำแหน่งให้ครบ และใช้ลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://" });
  }
  db.query("INSERT INTO faculty_teachers (group_name, full_name, position, image_filename, profile_link, display_order) VALUES (?, ?, ?, ?, ?, ?)", [groupName, fullName, position, imageFilename, profileLink || null, Number(req.body.display_order) || 0], (err, result) => {
    if (err) {
      safeDeleteFile(req.file?.path);
      return res.status(500).json({ success: false, message: "ไม่สามารถเพิ่มรายชื่อได้" });
    }
    return res.status(201).json({ success: true, teacher: { id: result.insertId, group_name: groupName, full_name: fullName, position, image_filename: imageFilename, profile_link: profileLink, display_order: Number(req.body.display_order) || 0 } });
  });
});

app.patch("/api/admin/faculty-teachers/:id", requireAdmin, requireSuperAdmin, teacherUpload.single("image"), (req, res) => {
  const id = Number(req.params.id); const groupName = String(req.body.group_name || "").trim(); const fullName = String(req.body.full_name || "").trim(); const position = String(req.body.position || "").trim(); const profileLink = String(req.body.profile_link || "").trim();
  if (!Number.isInteger(id) || !groupName || !fullName || !position || (profileLink && !/^https?:\/\/\S+$/i.test(profileLink))) {
    safeDeleteFile(req.file?.path);
    return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบ และใช้ลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://" });
  }
  const displayOrder = Number(req.body.display_order) || 0;
  db.query("SELECT image_filename FROM faculty_teachers WHERE id = ?", [id], (findError, rows) => {
    if (findError || rows.length === 0) {
      safeDeleteFile(req.file?.path);
      return res.status(findError ? 500 : 404).json({ success: false, message: "ไม่พบรายชื่อที่ต้องการแก้ไข" });
    }
    const imageFilename = req.file ? req.file.filename : rows[0].image_filename;
    db.query("UPDATE faculty_teachers SET group_name = ?, full_name = ?, position = ?, image_filename = ?, profile_link = ?, display_order = ? WHERE id = ?", [groupName, fullName, position, imageFilename, profileLink || null, displayOrder, id], (err) => {
      if (err) {
        safeDeleteFile(req.file?.path);
        return res.status(500).json({ success: false, message: "ไม่สามารถแก้ไขรายชื่อได้" });
      }
      if (req.file && rows[0].image_filename) safeDeleteFile(path.join(teacherUploadDir, rows[0].image_filename));
      return res.json({ success: true, teacher: { id, group_name: groupName, full_name: fullName, position, image_filename: imageFilename, profile_link: profileLink, display_order: displayOrder } });
    });
  });
});

app.delete("/api/admin/faculty-teachers/:id", requireAdmin, requireSuperAdmin, (req, res) => {
  db.query("DELETE FROM faculty_teachers WHERE id = ?", [Number(req.params.id)], (err, result) => {
    if (err || result.affectedRows === 0) return res.status(err ? 500 : 404).json({ success: false, message: "ไม่สามารถลบรายชื่อได้" });
    return res.json({ success: true, message: "ลบรายชื่อแล้ว" });
  });
});

app.get("/api/faculty-profiles/:type", (req,res) => {
  db.query("SELECT id, group_name, full_name, position, image_filename, display_order FROM faculty_profiles WHERE profile_type=? ORDER BY group_name, display_order, id", [req.params.type], (err, profiles) => {
    res.json({ success: !err, profiles: profiles || [] });
  });
});
app.post("/api/admin/faculty-profiles/:type",requireAdmin,requireSuperAdmin,teacherUpload.single("image"),(req,res)=>{const {group_name,full_name,position}=req.body;if(!group_name||!full_name||!position)return res.status(400).json({success:false,message:"กรุณากรอกข้อมูลให้ครบ"});db.query("INSERT INTO faculty_profiles (profile_type,group_name,full_name,position,image_filename,display_order) VALUES (?,?,?,?,?,?)",[req.params.type,group_name,full_name,position,req.file?.filename||"",Number(req.body.display_order)||0],(err)=>res.json({success:!err,message:err?"ไม่สามารถบันทึกได้":"เพิ่มข้อมูลแล้ว"}))});
app.patch("/api/admin/faculty-profiles/:id",requireAdmin,requireSuperAdmin,teacherUpload.single("image"),(req,res)=>{const {group_name,full_name,position}=req.body;db.query("SELECT image_filename FROM faculty_profiles WHERE id=?",[req.params.id],(e,rows)=>{if(e||!rows.length)return res.status(404).json({success:false,message:"ไม่พบข้อมูล"});const image=req.file?.filename||rows[0].image_filename;db.query("UPDATE faculty_profiles SET group_name=?,full_name=?,position=?,image_filename=? WHERE id=?",[group_name,full_name,position,image,req.params.id],err=>res.json({success:!err,message:err?"แก้ไขไม่สำเร็จ":"แก้ไขข้อมูลแล้ว"}))})});
app.delete("/api/admin/faculty-profiles/:id", requireAdmin, requireSuperAdmin, (req, res) => {
  db.query("SELECT image_filename FROM faculty_profiles WHERE id=?", [req.params.id], (findError, rows) => {
    if (findError || !rows.length) return res.status(404).json({ success: false, message: "ไม่พบข้อมูล" });
    db.query("DELETE FROM faculty_profiles WHERE id=?", [req.params.id], (error) => {
      if (!error && rows[0].image_filename) safeDeleteFile(path.join(teacherUploadDir, rows[0].image_filename));
      res.json({ success: !error, message: error ? "ไม่สามารถลบได้" : "ลบข้อมูลแล้ว" });
    });
  });
});

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
        (updateError) => {
          if (updateError) {
            if (req.file) safeDeleteFile(req.file.path);
            console.error("❌ แก้ไขข่าวไม่สำเร็จ:", updateError.message);
            return res.status(500).json({ success: false, message: "ไม่สามารถแก้ไขข่าวได้" });
          }

          if (req.file && article.image?.startsWith("/uploads/news/")) {
            safeDeleteFile(`.${article.image}`);
          }

          return res.json({ success: true, message: "แก้ไขข่าวแล้ว", image: imagePath });
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
