# n8n: AI คัดกรองก่อนส่งคิว Admin (API รุ่นใหม่)

เอกสารนี้เป็นสัญญา API ของโปรเจกต์ ไม่ได้แก้ workflow n8n หรือส่ง LINE จริง
ต้อง deploy backend/frontend รุ่นนี้ก่อนใช้ URL production ตัวอย่าง การค้นใช้คำและคีย์เวิร์ด ไม่ใช่ embedding/semantic search เต็มรูปแบบ

## เปลี่ยนสายแชตเท่านั้น

1. ตรวจลายเซ็น LINE, แยก events ทีละรายการ, กรองข้อความ text ที่มี replyToken ตามคู่มือเดิม
2. Edit Fields เก็บ `event_id`, `message`, `send_id`, `user_id` ใน n8n ส่วน API เว็บรับเฉพาะ eventId และข้อความ ไม่รับตัวตนหรือ replyToken
3. ให้ AI Student อ่านข้อความต้นฉบับและบริบท จำบริบทแยกผู้ใช้ ห้ามใช้ผลตอบกลับ API เป็นคำถามของผู้ใช้
4. ใต้ Tool ของ AI ใช้ Search API ด้านล่างแทน Sheets หรือ SQL tool ที่เข้าถึงทุกตาราง
5. หลัง AI วิเคราะห์แล้ว ใช้ HTTP Request ขั้นตอนปกติเรียก Triage API หนึ่งครั้งต่อ event ไม่ให้ AI เลือกข้ามการบันทึกเอง
6. ตรวจผล Triage API ก่อนส่ง LINE: duplicate=true ให้หยุด; answered ใช้เฉพาะคำตอบอ้างอิงที่ผ่านตรวจ; review/service_error ใช้ข้อความจาก API; smalltalk/clarify ใช้ข้อความทักทายหรือถามเพิ่มจาก AI ที่ไม่มีข้อเท็จจริงแต่งขึ้น

**ถอดสายเดิมที่เรียก `/api/integrations/line/questions` ออกจากสายแชตใหม่** ห้ามเรียก endpoint เก่าและ triage ด้วย event เดียวกัน เพราะใช้ระบบป้องกัน event ซ้ำร่วมกัน API เก่ายังอยู่เพื่อให้ workflow เดิมไม่พัง แต่ยังบันทึกทุกคำถามเหมือนเดิม จึงไม่ช่วยลดคิวจนกว่าจะสลับ workflow

ไม่แตะ workflow ส่งข่าว ไม่ broadcast ไม่ส่งตอบย้อนหลัง และไม่เผยแพร่ร่างอัตโนมัติ

## Authentication ทั้งสอง API

POST + Content-Type: application/json
Header Auth: `X-Knowledge-Token` = ค่า `N8N_KNOWLEDGE_TOKEN` ของ backend (ขั้นต่ำ 32 ตัวอักษร ไม่มี Bearer)
ใช้ HTTPS บน server เก็บ secret ใน credential ห้ามใส่ prompt หรือ body ของ AI

## 1. Tool ค้นคำตอบ

`POST /api/integrations/knowledge/search`

```json
{
  "eventId": "LINE_webhookEventId",
  "query": "สมัครเรียนที่ไหน",
  "branch": null
}
```

- eventId ต้องมาจาก workflow ไม่ให้ AI สร้างใหม่
- query คือคำถามที่เติมบริบทแล้ว ไม่เกิน 1,000 ตัวอักษร AI สามารถลองปรับคำค้นได้
- branch คือ slug ที่ทราบหรือยืนยันแล้ว เช่น computer; ไม่ทราบใช้ null ห้ามเดาจาก userId (ไม่รับ all/unassigned)
- ไม่เขียนคิวหรือเพิ่มจำนวนคำถามจากการค้น
- ค้นเฉพาะ published: คำถามหลัก/aliases แบบตรงตัวอันดับแรก แล้วคีย์เวิร์ดและคำที่ซ้อนกัน; ไม่ใช้ answer หรือหมายเหตุภายในเป็นข้อความค้น
- ผลลัพธ์สูงสุด 5 candidates: id, version, branch, category, question, answer, source, academicYear, score, match
- score เป็นคะแนนจัดอันดับ ไม่ใช่ความน่าจะเป็นหรือการรับรองว่าคำตอบถูกต้อง AI ต้องตรวจความเกี่ยวข้อง สาขา ปีการศึกษา และความครบถ้วนก่อนใช้
- ไม่คืนฉบับร่าง หมายเหตุภายใน หรือคำถามของผู้ใช้คนอื่น
- สแกน published ไม่เกิน 2,000 รายการ; `truncated: true` หมายถึงไม่ครบ ให้ระบุสาขาให้ชัด/ปรับระบบค้นก่อนสรุปว่าไม่มีข้อมูล
- `requiresEvaluation: true` หมายถึง AI ยังต้องประเมิน ไม่ได้หมายความว่าส่ง Admin แล้ว

ผลตอบกลับมี `searchToken` อายุ 10 นาที ผูกกับ event/branch และ id+version ที่ค้นได้ ให้ workflow เก็บแล้วส่งคืนตอน answered ไม่ส่งไป LINE หากค้นหลายครั้งให้ใช้ token ของชุดผลลัพธ์ที่อ้างอิง และ answerIds ต้องอยู่ในชุดนั้นทั้งหมด

## 2. ส่งผลคัดกรอง (HTTP Request หลัง AI ไม่ใช่ Tool ที่ AI เลือกข้ามได้)

`POST /api/integrations/line/triage`

ตัวอย่างไม่มีข้อมูล:

```json
{
  "eventId": "LINE_webhookEventId",
  "question": "ค่าเทอมเท่าไหร่ครับ",
  "summary": "ค่าเทอมวิศวกรรมคอมพิวเตอร์ ปี 2571",
  "branch": "computer",
  "category": "ค่าใช้จ่าย",
  "decision": "review",
  "reason": "not_found",
  "detail": "ผู้ใช้ยืนยันสาขาและปีแล้ว แต่ไม่พบคำตอบที่เผยแพร่",
  "answerIds": []
}
```

`question` คือข้อความต้นฉบับจาก event โดย workflow เป็นผู้ใส่; summary สรุปพร้อมบริบทไม่เกิน 1,000 ตัวอักษร ห้ามเติมสาขา/ปีที่ผู้ใช้ไม่ได้ระบุหรือยืนยัน; detail ไม่เกิน 2,000 ตัวอักษร คำอธิบายสั้น ไม่ส่ง chain-of-thought หรือบทสนทนายาว

| decision | การใช้งาน | คิว Admin |
|---|---|---|
| smalltalk | ทักทาย/ขอบคุณ ไม่ใช่คำถามข้อเท็จจริง | ไม่เพิ่ม |
| clarify | ยังต้องถามสาขา/ปี/รายละเอียด | ไม่เพิ่ม |
| answered | ข้อมูลอ้างอิงเพียงพอ | ไม่เพิ่มเมื่อรหัสตรวจผ่าน |
| review | ไม่พบ/ไม่ครบ/ขัดแย้ง | เพิ่มหรือเพิ่มจำนวนรายการซ้ำ |
| service_error | Tool หรือบริการขัดข้อง | ไม่เพิ่มคิวความรู้ เก็บสถานะ error ใน event แทน |

review ต้องมี reason: `not_found`, `incomplete`, `conflicting` เท่านั้น ห้ามส่ง error เครือข่ายเป็น not_found
category รับค่าประเภทที่เว็บรองรับ (ดู `/api/admin/knowledge` ด้วยบัญชี Admin); ถ้าไม่ทราบใช้ `ทั่วไป`

ตัวอย่างตอบได้:

```json
{
  "eventId": "LINE_webhookEventId",
  "question": "สมัครที่ไหนครับ",
  "branch": null,
  "decision": "answered",
  "answerIds": [123],
  "searchToken": "ค่าจาก_Search_API_ของ_event_นี้"
}
```

ให้ workflow ส่ง token จากผลค้นจริง ไม่ให้ AI ประดิษฐ์ token หากอ้างรหัสที่ไม่อยู่ในผลค้น เป็นคนละ event/branch หมดอายุ ถูกแก้เวอร์ชัน หรือปิดเผยแพร่แล้ว ระบบเปลี่ยนผลเป็น review + invalid_reference และไม่คืนคำตอบที่ผ่านตรวจ

ผลสำคัญ: success, status, queued, questionId, duplicate, reason, approvedAnswers, message
ตรวจ `status` ที่ backend คืน ไม่ใช้ decision จาก AI โดยไม่ตรวจผล
`approvedAnswers` เป็นข้อความต้นฉบับที่เผยแพร่และตรวจผ่านแล้ว ไม่มีการรับรองความหมายของข้อความที่ AI แต่ง: เลือกส่งต้นฉบับเพื่อความเข้มงวดที่สุด หรือเรียบเรียงเฉพาะข้อมูลนี้โดยห้ามเพิ่มข้อเท็จจริง

smalltalk/clarify เป็นการตัดสินใจของ AI ที่ backend ตรวจความหมายไม่ได้ ยังมีโอกาสคัดกรองพลาด ต้องประเมินตัวอย่างจริงและตรวจ execution ที่ผิดปกติ ไม่รับประกันว่าไม่มีคำถามตกหล่น

## การลดรายการซ้ำ/หน้า Admin

- event เดิมประมวลผลครั้งเดียวใน transaction (รวมคำขอพร้อมกัน)
- review รวมเมื่อข้อความต้นฉบับ+สรุปพร้อมบริบท+สาขาตรงกันหลังปรับช่องว่าง/ตัวพิมพ์เท่านั้น ไม่รวมจาก AI summary เพียงอย่างเดียว
- ข้อความคล้ายแต่ไม่เหมือนเก็บแยก ปุ่ม “ดูคำถามที่อาจซ้ำ” ให้ Admin เปรียบเทียบ ไม่รวมเอง ไม่มีปุ่ม merge ในรุ่นนี้
- ข้อความเดิมที่ปิด resolved แล้วถูกส่ง review อีกครั้งจะกลับเป็น pending; ignored ยังคง ignored แต่เพิ่มจำนวนครั้ง
- คิวค่าเริ่มต้นกรอง pending มีสรุป เหตุผล ข้อความต้นฉบับ จำนวนครั้ง และเวลาล่าสุด ไม่ลบรายการเก่าอัตโนมัติ
- Admin สาขาเห็นเฉพาะสาขาตน; supadmin ดูได้ทั้งหมดรวม unassigned

## ความผิดพลาด/ความเป็นส่วนตัว

HTTP non-2xx ต้องเข้าทาง error ของ workflow ไม่ส่งคำตอบ AI ที่ยังไม่ผ่านการตรวจ ไม่ retry การส่ง LINE แบบสุ่ม
หาก search ขัดข้อง ให้แจ้งผู้ใช้ว่าระบบขัดข้องและส่ง service_error เมื่อ triage ยังใช้งานได้ หาก backend ล่มทั้งชุดให้เก็บใน execution log ของ n8n และแจ้งผู้ดูแล ไม่ตีความว่าไม่มีข้อมูล
duplicate=true เป็นการป้องกันการประมวลผลซ้ำ ไม่ใช่หลักฐานว่า LINE ส่งสำเร็จ หากตอบ LINE ล้มเหลวหลัง triage ต้องตรวจ execution แยก ไม่ล้าง event เพื่อส่งซ้ำอัตโนมัติ
เก็บเฉพาะ event hash/ผลคัดกรองสำหรับข้อความที่ไม่เข้าคิว ไม่เก็บ raw question ในเว็บ; review เก็บข้อความต้นฉบับ/สรุปซึ่งอาจมี PII ต้องแจ้งการเก็บข้อมูลและกำหนดอายุเก็บ ส่วน n8n memory/execution logs มีนโยบายแยก ยังไม่ได้เพิ่ม PII scrub/retention อัตโนมัติ

## ทดสอบก่อนเปิดใช้

1. ทักทาย → smalltalk ไม่มีคิวใหม่
2. คำถามมีคำตอบเผยแพร่ → search + answered พร้อม token → ไม่มีคิว
3. คำถามยังขาดสาขา → clarify ไม่มีคิวจนได้รายละเอียด
4. ไม่พบ/ไม่ครบ/ขัดแย้ง → review หนึ่งรายการพร้อมต้นฉบับ
5. ส่ง event ซ้ำ → duplicate=true จำนวนไม่เพิ่ม
6. คนละ event ข้อความ+บริบทเหมือนเดิม → รายการเดิม จำนวนเพิ่ม
7. เปลี่ยนเป็นฉบับร่าง/แก้คำตอบหลังค้น → invalid_reference ไม่ตอบข้อมูลเก่า
8. Token API ผิด/Tool ล่ม → error ไม่บันทึกเป็น not_found
9. ตรวจ Admin คนละสาขาไม่เห็นคำถามกัน และข้อมูลหมายเหตุไม่หลุดไป Tool
