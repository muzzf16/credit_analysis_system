const db = require('../src/config/database');
const { minioClient, initBucket, BUCKET_NAME } = require('../src/config/minio');
const agunanService = require('../src/modules/agunan/agunan.service');

async function run() {
  try {
    console.log('Testing DB connection inside container...');
    const dbRes = await db.query('SELECT id FROM agunan LIMIT 1');
    console.log('DB Res count:', dbRes.rows.length);
    if (dbRes.rows.length === 0) {
      console.log('No agunan found in DB.');
      return;
    }
    const agunanId = dbRes.rows[0].id;
    console.log('Using agunanId:', agunanId);

    console.log('Initializing MinIO bucket...');
    await initBucket();

    console.log('Attempting upload to MinIO directly...');
    const testBuffer = Buffer.from('hello world collateral photo test');
    const objectName = `agunan/foto/${agunanId}/test-file.txt`;
    
    await minioClient.putObject(BUCKET_NAME, objectName, testBuffer, testBuffer.length, {
      'Content-Type': 'text/plain',
    });
    console.log('Direct MinIO upload success!');

    console.log('Testing addFoto service...');
    const fakeFile = {
      originalname: 'test_foto.jpg',
      buffer: testBuffer,
      size: testBuffer.length,
      mimetype: 'image/jpeg'
    };
    const fakeData = {
      keterangan: 'Test foto dari script inside',
      latitude: '-6.12345',
      longitude: '106.12345'
    };
    
    const userRes = await db.query('SELECT id FROM users LIMIT 1');
    const activeUserId = userRes.rows.length > 0 ? userRes.rows[0].id : null;

    const result = await agunanService.addFoto(agunanId, fakeFile, fakeData, activeUserId);
    console.log('addFoto success! Result:', result);
  } catch (err) {
    console.error('Inside container test failed with error:', err);
  } finally {
    process.exit(0);
  }
}

run();
