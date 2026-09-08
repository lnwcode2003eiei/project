import db from "./db.js";
import { hashAdminPassword } from "./auth.js";

db.query(
  "SELECT id, password FROM users",
  (selectError, users) => {
    if (selectError) {
      console.error("ไม่สามารถอ่านบัญชีผู้ดูแลได้:", selectError.message);
      process.exitCode = 1;
      db.end();
      return;
    }

    const legacyUsers = users.filter(
      (user) => !user.password.startsWith("scrypt$"),
    );

    if (legacyUsers.length === 0) {
      console.log("รหัสผ่านผู้ดูแลทั้งหมดถูกเข้ารหัสแล้ว");
      db.end();
      return;
    }

    const updates = legacyUsers.map(
      (user) => new Promise((resolve, reject) => {
        db.query(
          "UPDATE users SET password = ? WHERE id = ?",
          [hashAdminPassword(user.password), user.id],
          (updateError) => {
            if (updateError) reject(updateError);
            else resolve();
          },
        );
      }),
    );

    Promise.all(updates)
      .then(() => console.log(`เข้ารหัสรหัสผ่านผู้ดูแลแล้ว ${legacyUsers.length} บัญชี`))
      .catch((error) => {
        console.error("เข้ารหัสรหัสผ่านไม่สำเร็จ:", error.message);
        process.exitCode = 1;
      })
      .finally(() => db.end());
  },
);
