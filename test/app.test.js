const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');

test('GET / returns the Hello Cloud machine information', async (t) => {
  const app = require('../src/app');
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');

  const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);

  const body = await response.json();
  assert.equal(body.message, 'Xin chào từ đám mây!');
  assert.ok(typeof body.host === 'string' && body.host.length > 0);
  assert.ok(typeof body.platform === 'string' && body.platform.length > 0);
  assert.ok(Number.isInteger(body.cpus) && body.cpus > 0);
  assert.ok(Number.isFinite(body.memoryGB) && body.memoryGB > 0);
  assert.ok(Number.isInteger(body.uptimeSec) && body.uptimeSec >= 0);
  assert.equal(new Date(body.time).toISOString(), body.time);
});
