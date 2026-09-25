import { randomUUID } from 'node:crypto';

export async function notifyNewsLine(requested, article, { env = process.env, fetcher = fetch } = {}) {
  if (requested !== 'true') return { status: 'not_requested', message: 'ไม่ได้เลือกส่ง LINE' };
  if (!env.N8N_NEWS_WEBHOOK_URL || !env.N8N_NEWS_WEBHOOK_TOKEN || !env.PUBLIC_SITE_URL) {
    return { status: 'not_configured', message: 'ข่าวบันทึกแล้ว แต่ยังไม่ได้ตั้งค่าการส่งข่าวไป n8n' };
  }
  let webhook, site;
  try {
    webhook = new URL(env.N8N_NEWS_WEBHOOK_URL);
    site = new URL(env.PUBLIC_SITE_URL);
    if (!['http:', 'https:'].includes(webhook.protocol) || site.protocol !== 'https:' || webhook.username || webhook.password || site.username || site.password) throw new Error();
  } catch { return { status: 'not_configured', message: 'ข่าวบันทึกแล้ว แต่ค่าการเชื่อมต่อ n8n หรือ URL เว็บไซต์ไม่ถูกต้อง' }; }
  try {
    const response = await fetcher(webhook, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(12000),
      headers: { 'Content-Type': 'application/json', 'X-News-Webhook-Token': env.N8N_NEWS_WEBHOOK_TOKEN },
      body: JSON.stringify({ event: 'news.published', deliveryId: randomUUID(), news: {
        id: article.id, title: article.title, category: article.category,
        description: article.description, url: new URL(`/news/${article.id}`, site).href,
        imageUrl: article.image ? new URL(article.image, site).href : null,
      } }),
    });
    if (!response.ok) return { status: 'failed', message: 'ข่าวบันทึกแล้ว แต่ n8n ตอบกลับข้อผิดพลาด กรุณาตรวจ workflow ก่อนส่งซ้ำ' };
    const body = await response.json().catch(() => ({}));
    if (body.lineStatus === 'sent') return { status: 'sent', message: 'n8n ยืนยันส่ง LINE สำเร็จ' };
    if (body.lineStatus === 'failed') return { status: 'failed', message: 'ข่าวบันทึกแล้ว แต่ n8n แจ้งว่าส่ง LINE ไม่สำเร็จ' };
    return { status: 'accepted', message: 'n8n รับคำขอแล้ว ยังไม่มีผลยืนยันการส่ง LINE' };
  } catch {
    return { status: 'unknown', message: 'ข่าวบันทึกแล้ว แต่ยืนยันผลส่ง LINE ไม่ได้ กรุณาตรวจ n8n ก่อนส่งซ้ำเพื่อป้องกันข้อความซ้ำ' };
  }
}
