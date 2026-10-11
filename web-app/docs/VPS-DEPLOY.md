# ย้ายโปรเจกต์ไป VPS ใหม่

## เตรียมก่อนย้าย

- ติดตั้ง Docker Engine และ Compose plugin บนเครื่องใหม่ ตรวจ RAM/disk/CPU ให้พอกับ PDF และ OCR
- ใช้ Git commit ที่ทดสอบแล้ว รวมภาพ WebP ใหม่
- สำรองและทดสอบกู้คืน MySQL, uploads/, n8n_data และ .env ไม่ใช่ clone Git อย่างเดียว
- ห้ามใช้ docker compose down -v กับข้อมูลจริง
- ห้ามคัดลอกไฟล์ MySQL ขณะทำงาน ใช้ logical dump พร้อม --single-transaction --hex-blob --routines --triggers --events --no-tablespaces ตามสิทธิ์บัญชี แล้วทดสอบ restore บนฐานข้อมูลแยก
- หยุด n8n ก่อน snapshot volume เพื่อให้ฐานข้อมูลและไฟล์สอดคล้องกัน

## ตั้งค่าเครื่องใหม่

สร้าง .env จาก .env.example เฉพาะเมื่อยังไม่มีไฟล์ ห้ามเขียนทับค่าจริง:

```bash
cd /home/project/web-app
cp .env.example .env
chmod 600 .env
nano .env
```

เปลี่ยนค่าทุกตัวที่ขึ้นต้น replace-with- ห้ามส่ง .env เข้า Git หรือแชต
ตรวจ MYSQL_ROOT_PASSWORD, DB_NAME, DB_USER, DB_PASSWORD, ADMIN_TOKEN_SECRET และ ADMIN_BOOTSTRAP_* ให้ครบ
การเปลี่ยน environment ไม่เปลี่ยนรหัส MySQL หรือบัญชีผู้ใช้ที่มีอยู่แล้ว

SQL เริ่มต้นใช้ฐานข้อมูลที่ MySQL entrypoint เลือกจาก MYSQL_DATABASE จึงใช้ DB_NAME อื่นได้ ไม่ล้าง course_info และไม่สร้างแอดมินรหัสตายตัว
Backend เพิ่ม learning_environment เมื่อยังไม่มี และสร้าง bootstrap admin เฉพาะเมื่อไม่พบ username นั้น
ฐานข้อมูลเก่าอาจยังมี admintechno จาก seed เก่า: ตรวจเจ้าของ/เปลี่ยนรหัสก่อนเปิดสาธารณะ โค้ดนี้ไม่ลบบัญชีจริงอัตโนมัติ

## โดเมนและ n8n

ตั้ง SITE_DOMAIN, SITE_WWW_DOMAIN, N8N_DOMAIN เป็นชื่อโดเมนไม่ใส่ https://
ตั้ง ALLOWED_ORIGINS และ PUBLIC_SITE_URL เป็น URL เต็มให้ตรงกับโดเมน
หากเปลี่ยนโดเมน แก้ Open Graph ใน index.html, URL ใน workflows และ LINE webhook ด้วย
กรอก N8N_NEWS_WEBHOOK_URL, N8N_NEWS_WEBHOOK_TOKEN, N8N_KNOWLEDGE_TOKEN ให้ตรง workflow/credentials

N8N_IMAGE ต้องตรงรุ่นบนเครื่องเก่าระหว่างย้าย อย่าอัปเกรดพร้อมย้าย ค่าตั้งต้น 2.36.8 ตรวจจากเครื่องพัฒนา ไม่ใช่ VPS เดิม
สำรอง n8n_data ทั้งชุด รวมฐานข้อมูลและ config ที่มี encryption key
หากเครื่องเดิมใช้ N8N_ENCRYPTION_KEY จาก environment ต้องส่งค่าเดิมเข้า container ใหม่อย่างปลอดภัยด้วย ห้ามสร้างคีย์ใหม่ทับ
ทดสอบ credentials ถอดรหัสได้ก่อนเปิด workflow และอย่ารัน schedule/ส่ง LINE ซ้ำจากเครื่องทดสอบ

## เปิดบริการ

เปิด firewall 80/443 และ SSH ตามที่จำเป็น ไม่เปิด 3306/8080/5678 สาธารณะ
restore MySQL และ uploads/n8n_data ก่อนเปิดบริการที่เขียนข้อมูล:

```bash
docker compose config --quiet
docker compose up -d mysql
# restore dump และไฟล์สำรองที่ตรวจสอบแล้ว ณ จุดนี้
docker compose up -d --build backend frontend
docker compose logs --tail=100 backend
```

เมื่อทดสอบข้อมูลแล้วและ DNS ทั้งเว็บ/www/n8n ชี้ถูก (ตรวจ A และ AAAA):

```bash
docker compose up -d caddy n8n
docker compose ps
docker compose logs --tail=100 caddy
```

บน VPS **ไม่ใช้ compose.local.yml** เพราะ frontend จะชนพอร์ต 80 กับ Caddy
ในเครื่องพัฒนาใช้ docker compose -f docker-compose.yml -f compose.local.yml up -d --build backend frontend และไม่เปิด Caddy พร้อม override นี้

## สิ่งที่ต้องทดสอบ

- หน้าแรก ภาพ ข่าว และไฟล์ uploads เดิมเปิดครบ
- ล็อกอินและสิทธิ์แอดมินแต่ละสาขา
- บันทึกหลักสูตร/บรรยากาศการเรียน
- PDF ทั้งสามส่วน: หลักสูตร คลัง AI และเปรียบเทียบรายชื่อ
- LINE webhook, Search Knowledge และ n8n credentials
- เทียบจำนวนข้อมูลต้นทาง/ปลายทาง และ restart แล้วข้อมูลยังอยู่

## PDF และทรัพยากร

แม้ไม่มีเพดาน upload ที่ตั้งเอง ปัจจุบันยังใช้ memoryStorage, LONGBLOB, MEDIUMTEXT และ processing timeout
ตรวจ RAM, disk, max_allowed_packet และทดสอบไฟล์จริงก่อนเปิดระบบ
การเปลี่ยนเป็น disk streaming/คิวประมวลผลยังเป็นงานถัดไป ไม่ได้รวมใน deployment patch นี้

## Cutover/ย้อนกลับ

หยุดรับข้อมูลที่เครื่องเดิมชั่วคราว ทำสำรองรอบสุดท้ายแล้ว restore ก่อนสลับ DNS ให้มีระบบรับ webhook จริงเพียงเครื่องเดียว
เก็บเครื่องเดิมและสำรองไว้นอกเครื่องจนตรวจครบ หากมีข้อมูลใหม่บนเครื่องใหม่แล้ว ห้ามย้อน DNS อย่างเดียวโดยไม่จัดการข้อมูลที่ต่างกัน
