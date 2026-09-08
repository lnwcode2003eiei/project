import db from "./db.js";

db.query("SHOW COLUMNS FROM course_info LIKE 'learning_environment'", (error, columns) => {
  if (error) throw error;
  if (columns.length) {
    console.log("✅ คอลัมน์ learning_environment มีอยู่แล้ว");
    process.exit(0);
  }
  db.query("ALTER TABLE course_info ADD COLUMN learning_environment JSON NULL AFTER careers", (alterError) => {
    if (alterError) throw alterError;
    console.log("✅ เพิ่มคอลัมน์ learning_environment สำเร็จ");
    process.exit(0);
  });
});
