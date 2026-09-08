# เว็บไซต์คณะ

## เปิดใช้งานด้วย Docker

คัดลอก `.env.example` เป็น `.env` แล้วกำหนดค่า `ADMIN_TOKEN_SECRET` และ
`ADMIN_BOOTSTRAP_PASSWORD` ให้ปลอดภัย จากนั้นรัน:

```bash
docker compose up --build
```

เปิดเว็บไซต์ที่ `http://localhost` ระบบจะส่งคำขอ `/api` และ `/uploads` ไปยัง
Backend ภายใน Docker โดยอัตโนมัติ ไม่ต้องเปิด Vite เพิ่ม

- เว็บไซต์: `http://localhost`
- Backend: `http://localhost:5000`
- phpMyAdmin: `http://localhost:8080`
- MySQL: `localhost:3306`

## การตั้งค่าความปลอดภัย

ก่อนเริ่ม backend ให้คัดลอก `.env.example` เป็น `.env` และกำหนด `ADMIN_TOKEN_SECRET` เป็นค่าสุ่มยาว ๆ

สำหรับฐานข้อมูลใหม่ ให้กำหนด `ADMIN_BOOTSTRAP_USERNAME` และ `ADMIN_BOOTSTRAP_PASSWORD` ด้วย ระบบจะสร้างบัญชีผู้ดูแลที่แก้ไขได้ให้เพียงครั้งเดียวเมื่อยังไม่มีผู้ใช้งาน

หากฐานข้อมูลถูกสร้างก่อนการปรับปรุงนี้ ให้รัน `npm run migrate:passwords` หนึ่งครั้งเพื่อเข้ารหัสรหัสผ่านผู้ดูแลเดิม โดยควรสำรองฐานข้อมูลก่อนดำเนินการ

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
