const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const test = require('node:test');

test('notes API rejects invalid IDs and missing attachments without cloud credentials', async (t) => {
  const app = require('../src/app');
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await once(server, 'listening');

  async function request(method, path) {
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port: server.address().port, method, path }, res => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', reject);
      req.end();
    });
  }

  const invalid = await request('GET', '/notes/invalid-id');
  assert.equal(invalid.status, 400);
  assert.match(JSON.parse(invalid.body).error, /ObjectId/);
  const missing = await request('POST', '/notes/507f1f77bcf86cd799439011/attachment');
  assert.equal(missing.status, 400);
  assert.match(JSON.parse(missing.body).error, /file/);
});
