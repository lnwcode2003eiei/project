# การส่งข่าวไป LINE ผ่าน n8n

หน้า Admin มีสวิตช์ส่ง LINE ค่าเริ่มต้นปิด ทั้งเพิ่มและแก้ไขข่าว
บันทึกข่าวก่อนเรียก n8n เสมอ หาก n8n ล้มเหลวจะไม่ย้อนการเผยแพร่เว็บ
ไม่มีการส่งซ้ำอัตโนมัติ และสถานะครั้งนี้แสดงหลังบันทึกเท่านั้น ยังไม่มีประวัติสถานะถาวร

## ตั้งค่าฝั่ง Server

ตั้งใน .env (ห้าม commit หรือใส่ใน VITE_*):

```
N8N_NEWS_WEBHOOK_URL=<Production Webhook ของ workflow ข่าว>
N8N_NEWS_WEBHOOK_TOKEN=<ค่าลับสำหรับ Header Auth>
PUBLIC_SITE_URL=https://<โดเมนเว็บจริง>
```

ใช้ HTTPS สำหรับ webhook ภายนอก; HTTP ใช้เฉพาะเครือข่าย Docker ภายในที่เชื่อถือได้
กำหนด Webhook เป็น POST และ Header Auth ชื่อ X-News-Webhook-Token ให้ตรงกับค่าลับ
ห้ามใช้ webhook chatbot เดิมโดยไม่ตรวจว่า workflow รองรับ payload ข่าวนี้
Backend ส่ง JSON { event: "news.published", deliveryId, news: { id, title, category, description, url, imageUrl } }
ไม่ส่ง token ของ LINE หรือข้อมูลผู้ดูแลใน payload; ใช้ LINE credential เดิมภายใน n8n

## ผลตอบกลับจาก workflow

ต่อ Webhook → จัดข้อความจาก news → node ส่ง LINE เดิม → Respond to Webhook
ตั้งให้ตอบหลัง LINE API สำเร็จด้วย JSON { "lineStatus": "sent" }
เส้นทางข้อผิดพลาดตอบ { "lineStatus": "failed" }
หาก workflow ตอบทันทีหรือไม่มี lineStatus เว็บแสดงเพียง n8n รับคำขอแล้ว ไม่ใช่ส่งสำเร็จ
Backend รอไม่เกิน 12 วินาที หากหมดเวลาถือว่ายังยืนยันไม่ได้และไม่ส่งซ้ำอัตโนมัติ
ตรวจ execution ของ n8n ก่อนเลือกส่งใหม่ เพราะคำขอเดิมอาจส่งถึง LINE แล้ว
news.url และ imageUrl ต้องเข้าถึงได้จากอินเทอร์เน็ต ใช้รูปที่รองรับกับ node LINE เดิม
การตอบ sent หมายถึงบริการรับคำขอส่งสำเร็จ ไม่ใช่หลักฐานว่าผู้รับอ่านแล้ว

หลังตั้งค่า rebuild/recreate backend ด้วย compose เดิม ทดสอบกับปลายทางทดสอบที่อนุญาตก่อนใช้งานจริง
การพัฒนาครั้งนี้ทดสอบด้วย fetch จำลอง ไม่ได้เรียก webhook หรือส่งข้อความจริง
