# N8N: ค้นข้อมูล PDF แยกตามสาขา

ใช้ HTTP Request เดิม `POST /api/integrations/knowledge/search` พร้อม `X-Knowledge-Token` และส่ง JSON:

```json
{ "eventId": "LINE event id", "query": "ข้อความผู้ใช้", "branch": "electrical" }
```

ก่อนเรียก Search Knowledge ให้ AI ระบุ `branch` หนึ่งค่า: `computer`, `computer-ai`, `construction`, `digital`, `electrical`, `energy`, `industrial`, `logistics`, `management`, หรือ `survey`.

- คำถามสาขาไฟฟ้าใช้ `electrical` แล้วผลค้นจะมีเอกสารไฟฟ้าและข้อมูลส่วนกลางเท่านั้น
- คำถามเรื่องวันสมัคร ค่าเทอม หรือประกาศกลาง ให้ AI เลือกสาขาที่ผู้ใช้กล่าวถึง หากไม่ระบุ ให้ถามสาขาเพิ่มก่อน ไม่ต้องเดา
- คำถามกว้าง เช่น “ถ้าชอบคอมพิวเตอร์” ส่ง `branch: null` ได้ ระบบจะค้นเอกสารทุกสาขาและคืนเฉพาะเอกสารที่ชื่อหรือเนื้อหาตรงคำถาม ห้ามสรุปว่าสาขาใดเปิดรับสมัครจากรายชื่อเอกสารเพียงอย่างเดียว
- อย่าส่ง `all` หรือ `unassigned` เป็น `branch` ให้ endpoint นี้

ผลลัพธ์มี `candidates` (ข้อมูลคำตอบแบบเดิม) และ `documents` (ข้อความที่อ่านได้จาก PDF):

```json
{ "documents": [{ "id": "uuid", "branch": "electrical", "type": "หลักสูตร", "title": "หลักสูตรไฟฟ้า", "filename": "...pdf", "excerpt": "ข้อความจาก PDF", "score": 100 }] }
```

ผลลัพธ์มี `aiContext` ซึ่งรวมคำตอบเผยแพร่และ excerpt จาก PDF ที่ค้นเจอในข้อความพร้อมส่งให้ AI ใช้ตอบ ห้ามใช้ `documentedBranches` เป็นคำตอบหลัก เพราะเป็นเพียงรายชื่อสาขาที่มีเอกสาร

ให้ AI ตอบได้เฉพาะเมื่อ `candidates` หรือ `documents` มีข้อมูลที่เพียงพอ ห้ามแต่งข้อเท็จจริงจากความจำ หากใช้ `candidates` ให้ส่ง `answerIds` และ `searchToken` ตามกติกาเดิม

หากใช้ PDF ตอบ ให้ส่ง `documentIds` ที่เลือกจาก `documents[].id` พร้อม `searchToken` ไป Triage API เช่น `{ "decision": "answered", "answerIds": [], "documentIds": ["uuid"], "searchToken": "..." }` แล้วส่งคำตอบ AI ได้ก็ต่อเมื่อ Triage คืน `status: "answered"`.
