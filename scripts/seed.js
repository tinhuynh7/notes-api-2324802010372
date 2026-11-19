require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Note = require('../src/models/note');

const TAGS = ['cloud', 'docker', 'nosql', 'security', 'devops', 'java', 'web'];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const docs = Array.from({ length: 2000 }, (_, i) => ({
    title: `Ghi chú mẫu ${i + 1}`,
    content: 'Dữ liệu thử nghiệm',
    tags: [TAGS[i % 7], TAGS[(i * 3) % 7]],
    owner: 'seed'
  }));
  assert.equal(docs.length, 2000);
  assert.ok(docs.every(doc => doc.tags.every(tag => TAGS.includes(tag))));
  await Note.deleteMany({ owner: 'seed' });
  await Note.insertMany(docs);
  assert.equal(await Note.countDocuments({ owner: 'seed' }), 2000);
  console.log(`Đã chèn ${docs.length} ghi chú (owner: seed)`);
}

main().catch(err => {
  console.error(`Không tạo được dữ liệu: ${err.name}. Kiểm tra cấu hình và kết nối MongoDB.`);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
