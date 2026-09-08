# Deploy บน Hostinger VPS

โดเมนที่ใช้: `technologyfaculty.tech`

## 1. สร้างไฟล์ตั้งค่า

ไฟล์ `.env` จะไม่ถูกอัปขึ้น Git เพื่อป้องกันรหัสผ่านรั่ว หลัง `git pull` ให้สร้างจากตัวอย่าง:

```bash
cp .env.example .env
nano .env
```

เปลี่ยนค่าที่ขึ้นต้นด้วย `replace-with-` เป็นรหัสผ่านจริง ห้ามใช้ค่าตัวอย่างบนระบบจริง

หากฐานข้อมูล Docker เดิมมีข้อมูลอยู่แล้ว ค่า `DB_USER` และ `DB_PASSWORD` ต้องตรงกับบัญชี MySQL เดิม เพราะการแก้ environment จะไม่เปลี่ยนบัญชีใน volume ที่สร้างไว้แล้ว

## 2. เปิดระบบ

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Caddy จะขอและต่ออายุ HTTPS ให้ `technologyfaculty.tech` และ `www.technologyfaculty.tech` อัตโนมัติ

## 3. ตรวจสอบ

```bash
docker compose logs --tail=100 backend
docker compose logs --tail=100 caddy
```

บริการที่เปิดสู่สาธารณะมีเฉพาะพอร์ต 80 และ 443 ส่วน MySQL, phpMyAdmin และ n8n ผูกกับ `127.0.0.1` เท่านั้น
