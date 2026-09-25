import test from 'node:test';
import assert from 'node:assert/strict';
import { notifyNewsLine } from './news-line.js';
const article = { id: 12, title: 'ข่าวทดสอบ', category: 'กิจกรรม', description: 'รายละเอียด', image: '/uploads/news/test.png' };
const env = { N8N_NEWS_WEBHOOK_URL: 'https://n8n.example/webhook/news', N8N_NEWS_WEBHOOK_TOKEN: 'test-only', PUBLIC_SITE_URL: 'https://faculty.example' };
test('opt out and missing config never call webhook', async () => {
  const fetcher = () => { throw new Error('must not call'); };
  assert.equal((await notifyNewsLine('false', article, { env, fetcher })).status, 'not_requested');
  assert.equal((await notifyNewsLine('true', article, { env: {}, fetcher })).status, 'not_configured');
});
test('sends article and authenticates webhook; only explicit confirmation means sent', async () => {
  const fetcher = async (url, options) => {
    assert.equal(url.href, env.N8N_NEWS_WEBHOOK_URL);
    assert.equal(options.headers['X-News-Webhook-Token'], 'test-only');
    const body = JSON.parse(options.body);
    assert.equal(body.news.url, 'https://faculty.example/news/12');
    assert.equal(body.news.imageUrl, 'https://faculty.example/uploads/news/test.png');
    assert.ok(body.deliveryId);
    return { ok: true, json: async () => ({ lineStatus: 'sent' }) };
  };
  assert.equal((await notifyNewsLine('true', article, { env, fetcher })).status, 'sent');
});
test('accepted, failed and ambiguous outcomes stay distinct without retries', async () => {
  for (const [response, expected] of [[{ ok: true, json: async () => ({}) }, 'accepted'], [{ ok: false }, 'failed'], [{ ok: true, json: async () => ({ lineStatus: 'failed' }) }, 'failed']]) {
    assert.equal((await notifyNewsLine('true', article, { env, fetcher: async () => response })).status, expected);
  }
  let calls = 0;
  assert.equal((await notifyNewsLine('true', article, { env, fetcher: async () => { calls++; throw new Error('timeout'); } })).status, 'unknown');
  assert.equal(calls, 1);
});
