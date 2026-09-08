import db from "./db.js";

const addColumnIfMissing = (name, definition) => new Promise((resolve, reject) => {
  db.query("SHOW COLUMNS FROM users LIKE ?", [name], (checkError, columns) => {
    if (checkError) return reject(checkError);
    if (columns.length > 0) return resolve();

    return db.query(`ALTER TABLE users ADD COLUMN ${definition}`, (alterError) => (
      alterError ? reject(alterError) : resolve()
    ));
  });
});

addColumnIfMissing("first_name", "first_name VARCHAR(100) NOT NULL DEFAULT 'ผู้ดูแล' AFTER password")
  .then(() => addColumnIfMissing("last_name", "last_name VARCHAR(100) NOT NULL DEFAULT 'ระบบ' AFTER first_name"))
  .then(() => {
    console.log("เพิ่มข้อมูลชื่อและนามสกุลสำหรับบัญชีผู้ดูแลแล้ว");
    db.end();
  })
  .catch((error) => {
    console.error("ไม่สามารถปรับโครงสร้างบัญชีผู้ดูแลได้:", error.message);
    db.end();
    process.exitCode = 1;
  });
