const Minio = require('minio');
const minioPublicClient = new Minio.Client({
  endPoint: '192.168.0.210',
  port: 9000,
  useSSL: false,
  accessKey: 'bpr_bapera_admin',
  secretKey: 'd8F3g6H9k2M5n8P1s4V7w0C3zQ6w9E2r',
});
minioPublicClient.presignedGetObject('bpr-bapera', 'agunan/foto/9b560887-b380-47b0-af44-332f4327864d/dummy.gif', 3600)
  .then(url => console.log(url))
  .catch(err => console.error(err));
