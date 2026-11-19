require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Note = require('../src/models/note');

const pick = r => (Array.isArray(r) ? r[0] : r).executionStats;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  // Tạo chỉ mục của model mà không xóa các chỉ mục khác đã có trên database.
  await Note.createIndexes();
  const scan = pick(await Note.find({ tags: 'docker' }).hint({ $natural: 1 }).explain('executionStats'));
  const idx = pick(await Note.find({ tags: 'docker' }).hint({ tags: 1 }).explain('executionStats'));
  assert.equal(scan.nReturned, idx.nReturned, 'Hai truy vấn phải trả cùng số tài liệu');
  assert.ok(idx.nReturned > 0, 'Chạy seed.js trước khi đo');
  assert.ok(scan.totalDocsExamined >= idx.totalDocsExamined);
  console.table({
    'Quét toàn bộ': { docsExamined: scan.totalDocsExamined, returned: scan.nReturned, ms: scan.executionTimeMillis },
    'Dùng chỉ mục': { docsExamined: idx.totalDocsExamined, returned: idx.nReturned, ms: idx.executionTimeMillis }
  });
  const ratio = scan.totalDocsExamined / idx.totalDocsExamined;
  console.log(`Giảm số tài liệu quét: ${scan.totalDocsExamined} / ${idx.totalDocsExamined} = ${ratio.toFixed(2)} lần`);
  console.log(`Ước lượng ở 2 triệu tài liệu, cùng phân bố tag: quét toàn bộ 2.000.000; dùng chỉ mục khoảng ${Math.round(2000000 / ratio).toLocaleString('vi-VN')} tài liệu.`);
  console.log('Giới hạn 100 thao tác/giây không phải 100 tài liệu quét/giây; không dùng để suy ra thời gian truy vấn.');
}

main().catch(err => {
  console.error(`Không đo được chỉ mục: ${err.name}. Kiểm tra MongoDB và chạy seed.js trước.`);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
