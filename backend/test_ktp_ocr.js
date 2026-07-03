const fs = require('fs');
const OCRPipeline = require('./src/modules/ocr/pipeline/OCRPipeline');
const path = require('path');

async function test() {
  try {
    const buffer = fs.readFileSync(path.join(__dirname, 'test_data', 'sample.jpg'));
    const pipeline = new OCRPipeline(buffer, 'ktp', 'image/jpeg');
    const result = await pipeline.execute();
    console.log(JSON.stringify(result.data, null, 2));
    console.log('\nRAW TEXT:\n', pipeline.context.rawText);
  } catch(e) {
    console.error(e);
  }
}
test();
