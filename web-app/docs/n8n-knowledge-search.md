# N8N: ค้นข้อมูล PDF แยกตามสาขา

ใช้ HTTP Request เดิม `POST /api/integrations/knowledge/search` พร้อม `X-Knowledge-Token` และส่ง JSON:

```json
{ "eventId": "LINE event id", "query": "ข้อความผู้ใช้", "branch": "electrical" }
```

ก่อนเรียก Search Knowledge ให้ AI ระบุ `branch` หนึ่งค่า: `computer`, `computer-ai`, `construction`, `digital`, `electrical`, `energy`, `industrial`, `logistics`, `management`, หรือ `survey`.

- คำถามสาขาไฟฟ้าใช้ `electrical` แล้วผลค้นจะมีเอกสารไฟฟ้าและข้อมูลส่วนกลางเท่านั้น
- คำถามเรื่องวันสมัคร ค่าเทอม หรือประกาศกลาง ให้ AI เลือกสาขาที่ผู้ใช้กล่าวถึง หากไม่ระบุ ให้ถามสาขาเพิ่มก่อน ไม่ต้องเดา
- อย่าส่ง `all` หรือ `unassigned` เป็น `branch` ให้ endpoint นี้

ผลลัพธ์มี `candidates` (ข้อมูลคำตอบแบบเดิม) และ `documents` (ข้อความที่อ่านได้จาก PDF):

```json
{ "documents": [{ "id": "uuid", "branch": "electrical", "type": "หลักสูตร", "title": "หลักสูตรไฟฟ้า", "filename": "...pdf", "excerpt": "ข้อความจาก PDF", "score": 100 }] }
```

ผลลัพธ์ยังมี `organization` สำหรับจำกัดขอบเขตคำตอบไว้ที่คณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏอุตรดิตถ์ และ `documentedBranches` ซึ่งเป็นรายชื่อสาขาที่มีเอกสารอยู่จริงในฐานข้อมูล ใช้ตอบคำถามว่าในระบบมีข้อมูลสาขาใดได้ แต่ห้ามตีความว่าเปิดรับสมัครในปีปัจจุบัน หากไม่มีเอกสารประเภทการรับสมัครยืนยัน

ให้ AI ตอบได้เฉพาะเมื่อ `candidates` หรือ `documents` มีข้อมูลที่เพียงพอ ห้ามแต่งข้อเท็จจริงจากความจำ หากใช้ `candidates` ให้ส่ง `answerIds` และ `searchToken` ตามกติกาเดิม ส่วน `documents` เป็นข้อมูลประกอบการตอบจาก PDF และไม่ต้องเปิดเผย id หรือ token ต่อผู้ใช้.
