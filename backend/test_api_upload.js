const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Set environment variables for config loading
process.env.JWT_SECRET = 'p9S2f7G5j8K2m1N4b3V6x8C0zQ1w4E7rT9yU2iO5p8A3s6D9f0g1h4j7k0l2m5n';
process.env.PORT = '5000';

const config = {
  jwtSecret: process.env.JWT_SECRET,
};

async function test() {
  try {
    console.log('Generating JWT token...');
    // Create token for user 'ba30f97b-682d-455d-8814-faffd3bcc469' with role 'ADMIN'
    const payload = {
      id: 'ba30f97b-682d-455d-8814-faffd3bcc469',
      username: 'admin',
      role: 'ADMIN'
    };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
    console.log('Token generated:', token.substring(0, 20) + '...');

    const agunanId = '9b560887-b380-47b0-af44-332f4327864d';
    const filePath = path.join(__dirname, 'test_image.png');
    if (!fs.existsSync(filePath)) {
      console.log('test_image.png not found, creating dummy file...');
      fs.writeFileSync(filePath, 'dummy image content');
    }

    console.log('Reading file...');
    const fileBuffer = fs.readFileSync(filePath);
    const filename = 'test_image.png';

    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    // Construct raw multipart form-data body
    const bodyParts = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`,
      `Content-Type: image/png\r\n\r\n`,
      fileBuffer,
      `\r\n--${boundary}\r\n`,
      `Content-Disposition: form-data; name="keterangan"\r\n\r\n`,
      `Foto jaminan dari API test\r\n`,
      `--${boundary}--\r\n`
    ];

    // Calculate total content length
    let totalLength = 0;
    for (const part of bodyParts) {
      totalLength += typeof part === 'string' ? Buffer.byteLength(part) : part.length;
    }

    const bodyBuffer = Buffer.concat(
      bodyParts.map(part => typeof part === 'string' ? Buffer.from(part) : part)
    );

    console.log('Sending POST request to Nginx proxy...');
    const response = await fetch(`http://localhost:8085/api/agunan/${agunanId}/foto`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': totalLength.toString()
      },
      body: bodyBuffer
    });

    console.log('Response Status:', response.status);
    const responseBody = await response.text();
    console.log('Response Body:', responseBody);
  } catch (err) {
    console.error('API Test failed:', err);
  }
}

test();
