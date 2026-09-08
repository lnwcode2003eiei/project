import mysql from "mysql2";

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "university_web",
  port: process.env.DB_PORT || 3306,

  charset: "utf8mb4", // 📌 เพิ่มตรงนี้เพื่อรองรับภาษาไทย ป้องกันตัวอักษรหลุด/ต่างดาว

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ เชื่อมต่อ MySQL ไม่สำเร็จ");
    console.error(err.message);
    return;
  }

  console.log("✅ เชื่อมต่อ MySQL สำเร็จ (utf8mb4)");
  connection.release();
});

export default db;