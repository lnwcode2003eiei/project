import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('fresh database seed uses the selected database and preserves existing data', () => {
  const sql = read('docker/mysql/init.sql');
  assert.doesNotMatch(sql, /DROP\s+TABLE|CREATE\s+DATABASE|^USE\s+/im);
  assert.doesNotMatch(sql, /INSERT\s+(?:IGNORE\s+)?INTO\s+users|scrypt\$/i);
  assert.match(sql, /learning_environment JSON/);
  assert.equal((sql.match(/INSERT IGNORE INTO course_info/g) || []).length, 10);
});

test('deployment supports configurable domains and pinned n8n', () => {
  const compose = read('docker-compose.yml');
  assert.doesNotMatch(compose, /n8nio\/n8n:latest/);
  for (const key of ['SITE_DOMAIN', 'SITE_WWW_DOMAIN', 'N8N_DOMAIN']) {
    assert.ok(compose.includes(key));
    assert.ok(read('Caddyfile').includes(`{$${key}}`));
    assert.ok(read('.env.example').includes(`${key}=`));
  }
});

test('home and faculty recommendation image references exist', () => {
  for (const component of ['Hero.jsx', 'Nextrecommend/Recommendpage.jsx']) {
    for (const match of read(`src/component/${component}`).matchAll(/\/image\/[\w.-]+/g)) {
      assert.ok(existsSync(new URL(`../public${match[0]}`, import.meta.url)), match[0]);
    }
  }
});
