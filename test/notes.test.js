const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const test = require('node:test');

test('notes API rejects invalid IDs and missing attachments without cloud credentials', async (t) => {
  process.env.JWT_SECRET = require('node:crypto').randomBytes(32).toString('hex');
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ sub: '507f1f77bcf86cd799439012' }, process.env.JWT_SECRET);
  const app = require('../src/app');
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await once(server, 'listening');

  async function request(method, path, authenticated = true) {
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port: server.address().port, method, path, headers: authenticated ? { Authorization: 'Bearer ' + token } : {} }, res => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', reject);
      req.end();
    });
  }

  assert.equal((await request('GET', '/notes', false)).status, 401);
  const invalid = await request('GET', '/notes/invalid-id');
  assert.equal(invalid.status, 400);
  assert.match(JSON.parse(invalid.body).error, /ObjectId/);
  for (let i = 1; i <= 21; i++) {
    assert.equal((await request('POST', '/auth/login', false)).status, i === 21 ? 429 : 401);
  }
  const missing = await request('POST', '/notes/507f1f77bcf86cd799439011/attachment');
  assert.equal(missing.status, 400);
  assert.match(JSON.parse(missing.body).error, /file/);
});
