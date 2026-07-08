// Override environment variables first
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5435';
process.env.DB_NAME = 'bpr_bapera';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'k9vR2mZ8xP5qW4tY7sB1cE3n';

process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_ACCESS_KEY = 'bpr_bapera_admin';
process.env.MINIO_SECRET_KEY = 'd8F3g6H9k2M5n8P1s4V7w0C3zQ6w9E2r';
process.env.MINIO_BUCKET = 'bpr-bapera';
process.env.MINIO_USE_SSL = 'false';

const db = require('./src/config/database');
const { minioClient, initBucket, BUCKET_NAME } = require('./src/config/minio');
const agunanService = require('./src/modules/agunan/agunan.service');

async function run() {
  try {
    console.log('Testing DB connection...');
    const dbRes = await db.query('SELECT id FROM agunan LIMIT 1');
    console.log('DB Res count:', dbRes.rows.length);
    if (dbRes.rows.length === 0) {
      console.log('No agunan found in DB, please seed or create one first.');
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
      keterangan: 'Test foto dari script',
      latitude: '-6.12345',
      longitude: '106.12345'
    };
    const userId = '123e4567-e89b-12d3-a456-426614174000'; // dummy UUID
    
    // Get actual user ID
    const userRes = await db.query('SELECT id FROM users LIMIT 1');
    const activeUserId = userRes.rows.length > 0 ? userRes.rows[0].id : userId;

    const result = await agunanService.addFoto(agunanId, fakeFile, fakeData, activeUserId);
    console.log('addFoto success! Result:', result);
  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    process.exit(0);
  }
}

run();
