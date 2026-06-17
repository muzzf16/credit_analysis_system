const Minio = require('minio');
require('dotenv').config();

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'bpr-bapera';

/**
 * Initialize MinIO bucket
 */
const initBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`[MinIO] Bucket '${BUCKET_NAME}' created`);

      // Set bucket policy to allow authenticated reads
      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/public/*`],
          },
        ],
      });
      await minioClient.setBucketPolicy(BUCKET_NAME, policy);
    } else {
      console.log(`[MinIO] Bucket '${BUCKET_NAME}' already exists`);
    }
  } catch (err) {
    console.error('[MinIO] Initialization error:', err.message);
    // Don't crash the app if MinIO is unavailable
  }
};

/**
 * Upload a file buffer to MinIO
 * @param {string} objectName - path/filename in bucket
 * @param {Buffer} buffer - file buffer
 * @param {string} mimeType - content-type
 * @returns {Promise<string>} objectName
 */
const uploadFile = async (objectName, buffer, mimeType) => {
  const metaData = {
    'Content-Type': mimeType,
    'X-Uploaded-By': 'bpr-bapera-system',
  };
  await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, metaData);
  return objectName;
};

/**
 * Generate a pre-signed URL for downloading
 * @param {string} objectName
 * @param {number} expiry - seconds (default: 1 hour)
 * @returns {Promise<string>} signed URL
 */
const getPresignedUrl = async (objectName, expiry = 3600) => {
  return await minioClient.presignedGetObject(BUCKET_NAME, objectName, expiry);
};

/**
 * Delete an object from MinIO
 * @param {string} objectName
 */
const deleteFile = async (objectName) => {
  await minioClient.removeObject(BUCKET_NAME, objectName);
};

/**
 * Get object metadata
 * @param {string} objectName
 */
const statFile = async (objectName) => {
  return await minioClient.statObject(BUCKET_NAME, objectName);
};

module.exports = {
  minioClient,
  BUCKET_NAME,
  initBucket,
  uploadFile,
  getPresignedUrl,
  deleteFile,
  statFile,
};
