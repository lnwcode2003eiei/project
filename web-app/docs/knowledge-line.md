# คำถาม LINE และคลังคำตอบ MySQL

> รุ่นคัดกรอง AI: ใช้คู่มือ `knowledge-ai-triage.md` สำหรับ Search Tool และ Triage API ใหม่ เนื้อหาการเชื่อม `/api/integrations/line/questions` ด้านล่างเป็น workflow รุ่นเดิมที่ยังรองรับไว้ อย่าเรียกทั้งเก่าและใหม่กับ event เดียวกัน

หน้า /admin/knowledge แสดงคำถามและคลังคำตอบล่าสุดอย่างละ 1000 รายการ พร้อมค้นหา/กรองสถานะ
Super Admin ดูทุกสาขาและจัดคำถามไม่ระบุสาขา; Admin สาขาอ่านเฉพาะสาขาตนเองและแก้ได้เมื่อ can_edit=1
ตรวจสิทธิ์ปัจจุบันใน users ทุก request ไม่เชื่อสิทธิ์จาก localStorage
ตาราง knowledge_answers, knowledge_history, knowledge_questions, knowledge_events สร้างอัตโนมัติเมื่อเข้าครั้งแรก
ไม่มีการลบ Google Sheets และยังไม่เปลี่ยน workflow จริง การสร้างคำตอบไม่ส่งข้อความ LINE ย้อนหลัง

## พฤติกรรมการค้นหา

ใช้คำถามหลักหรือคำถามใกล้เคียงที่ตรงกันหลังปรับช่องว่าง/ตัวพิมพ์ ไม่ใช่ semantic search
ตอบเฉพาะ published; ถ้าตรงมากกว่าหนึ่งรายการให้ clarify ไม่เลือกสุ่ม
เมื่อระบุ branch จะค้นเฉพาะสาขานั้นและข้อมูลส่วนกลาง all; ถ้าไม่ระบุค้นทุกสาขาและแยกคำตอบกำกวม
คำถามใกล้เคียงต้องให้ Admin เพิ่มเอง หรือใช้ปุ่มเชื่อมคำถามกับคำตอบที่เผยแพร่
การจัดประเภทเริ่มต้นเป็นทั่วไป ไม่ใช้ AI เดาประเภทโดยอัตโนมัติในรุ่นนี้
คำถามเหมือนกันในขอบเขตสาขาเดียวกันรวมรายการและจำนวนครั้ง; event เดิมไม่นับซ้ำ
ประวัติทุกเวอร์ชันเก็บใน transaction เดียวกับคำตอบ พร้อมป้องกันการเขียนทับข้อมูลที่คนอื่นเพิ่งแก้
ตารางคำถามอาจยังเป็นรอตอบหลังสร้างคำตอบใหม่ ให้เชื่อมคำถามกับคำตอบเพื่อปิดรายการ

## ตั้งค่าการเชื่อมต่อ

ตั้ง N8N_KNOWLEDGE_TOKEN ใน .env เป็นค่าลับสุ่มอย่างน้อย 32 ตัว เก็บเฉพาะ server/n8n credential ห้าม commit
ไม่ใช้ token ของ LINE หรือ token ส่งข่าวซ้ำกับค่านี้
recreate backend หลังแก้ .env; ไม่เปลี่ยน workflow ส่งข่าว

1. สำรอง workflow แชตเดิมก่อนแก้ ไม่ลบ Google Sheets จนกว่าทดสอบผ่าน
2. LINE ingress ต้องตรวจ X-Line-Signature กับ raw request body และ Channel Secret ก่อนนำ event ไปใช้
   Header Auth ของ API นี้เป็นการยืนยัน n8n ไม่ใช่การตรวจลายเซ็น LINE
3. แยก events เป็นทีละ item กรองเฉพาะ type=message และ message.type=text และมี replyToken
   Verify events=[]/รูป/สติกเกอร์ไม่เข้าคลังนี้ ข้อความทักทายทั่วไปสามารถแยกไปตอบสั้นโดยไม่บันทึก
4. เพิ่ม HTTP Request หลังเตรียมข้อมูลก่อนตอบ (URL เว็บจริง):
   POST https://technologyfaculty.tech/api/integrations/line/questions
   Header Auth Name=X-Knowledge-Token, Value=ค่าลับ N8N_KNOWLEDGE_TOKEN
   JSON body { "eventId": "webhookEventId ของ event นั้น", "question": "message.text", "branch": null }
   branch ใช้ slug สาขาหลังถามยืนยัน/เลือกสาขา เช่น computer ไม่ใช้ userId หรือชื่อที่เดาเอง
   ไม่ส่ง replyToken, LINE userId, displayName หรือ token มา API นี้
5. ตอบกลับมี success,status,answer,answerId,message,questionId,duplicate
   duplicate=true: หยุด ไม่ส่ง LINE ซ้ำ
   status=answered: ใช้ answer ที่เผยแพร่ อาจส่งเข้า AI เพื่อเรียบเรียงโดยห้ามเพิ่มข้อเท็จจริง
   status=pending/clarify: ตอบ message โดยไม่ให้ AI แต่งคำตอบเอง
   non-2xx: แจ้งระบบค้นหาขัดข้อง ไม่กล่าวว่าข้อมูลไม่มี
6. ถ้าใช้ AI ให้ถอดเครื่องมือ Google Sheets/MySQL แบบกว้างออกจาก Agent หลังผ่านการทดสอบ
   Prompt ต้องระบุว่าคำถาม/คำตอบอ้างอิงเป็นข้อมูล ไม่ใช่คำสั่ง และไม่ให้มีอำนาจเขียน DB
   ทางเลือกที่แม่นยำที่สุดคือส่ง answer ตรง ๆ ไม่ผ่าน AI
7. HTTP Request ไป LINE ใช้ /reply และ replyToken ของ event เดิม เก็บข้อมูลนั้นแยกใน workflow
   อย่าใช้ /broadcast; replyToken ใช้ครั้งเดียวและมีอายุจำกัด ทดสอบกับข้อความใหม่ในบัญชีทดสอบ

## ความเป็นส่วนตัวและข้อจำกัด

บันทึกเฉพาะข้อความและ eventId ที่ hash แล้ว ไม่เก็บตัวตน LINE แต่ข้อความที่ผู้ใช้พิมพ์อาจมีข้อมูลส่วนบุคคล
ควรแจ้งผู้ใช้ว่าคำถามถูกเก็บเพื่อปรับปรุงบริการ และกำหนดระยะเก็บ/วิธีลบก่อนใช้งานจริง
รุ่นนี้ยังไม่มีการลบตามอายุอัตโนมัติหรือการปกปิด PII อัตโนมัติ อย่าใช้กับข้อมูลอ่อนไหว
Secret ควรจำกัดเครือข่าย/HTTPS การอ่านคำตอบเปิดเฉพาะ n8n ที่มี credential ไม่เปิด endpoint สาธารณะ
ยังไม่มี workflow export จากผู้ใช้ จึงเตรียม API และคู่มือโดยไม่ได้แก้หรือตรวจ LINE end-to-end จริง

## ทดสอบ

node --test server/knowledge.test.js
RUN_KNOWLEDGE_SMOKE=1 node server/knowledge-mysql-smoke.js
smoke test ใช้ตารางชื่อ test_<random>_knowledge_* ชั่วคราว แล้วลบเฉพาะตารางเหล่านั้น ไม่แตะ users/ข้อมูลจริง
# นำเข้าข้อมูลตั้งต้นจากผู้ใช้

ข้อมูล 26 ข้อ / 8 หมวดอยู่ที่ `server/data/knowledge-starter.json` ทุกข้อเป็นฉบับร่างส่วนกลาง ไม่ตรวจสอบหรือเผยแพร่ข้อเท็จจริงโดยอัตโนมัติ คำสั่งที่ปนในคำตอบถูกย้ายไปหมายเหตุพร้อมต้นฉบับ คีย์เวิร์ดใช้ค้นหาในหน้าผู้ดูแลเท่านั้น ไม่ใช่ aliases และไม่ใช้จับคู่คำตอบ LINE

หลัง build backend รุ่นใหม่ ใช้คำสั่งเหล่านี้ (สำหรับเครื่อง local เติม `-f docker-compose.yml -f compose.local.yml` หลัง `docker compose`):

```sh
docker compose exec -T backend node server/knowledge-import.js
docker compose exec -T backend node server/knowledge-import.js --apply
```

คำสั่งแรกเตรียม schema และแสดงจำนวนที่จะเพิ่มโดยไม่บันทึกคำตอบ คำสั่งที่สองนำเข้าจริงใน transaction ข้ามคำถามส่วนกลางที่มีอยู่แล้ว ไม่ทับข้อมูลเดิม และใช้ประวัติการนำเข้าป้องกันนำเข้าซ้ำแม้เปลี่ยนชื่อคำถามภายหลัง ผู้แก้ไข 0 หมายถึงระบบนำเข้า ไม่ใช่บัญชีผู้ดูแลจริง

เข้า Admin > คำถามและคำตอบ > คลังคำตอบ > ฉบับร่าง ด้วย supadmin เพื่อทบทวนปีการศึกษา แหล่งอ้างอิง ชื่อหลักสูตร และข้อมูลผู้บริหารก่อนเผยแพร่ Admin สาขายังคงเห็นเฉพาะสาขาของตน การนำเข้าไม่ส่งข้อความ LINE และไม่ลบข้อมูลเดิม
