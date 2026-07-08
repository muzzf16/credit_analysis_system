const path = require('path');
const TesseractEngine = require('./src/modules/ocr/engines/TesseractEngine');
const fs = require('fs');

async function runBenchmark() {
    const engine = new TesseractEngine();
    const imagePath = '/app/test_image.png';
    
    console.log("Warming up...");
    await engine.runTesseractOcrAsync(imagePath, 'ktp');

    const startTime = Date.now();
    console.log("Running benchmark...");
    const result = await engine.runTesseractOcrAsync(imagePath, 'ktp');
    const endTime = Date.now();
    
    console.log(`Execution Time: ${endTime - startTime}ms`);
    console.log(`Overall Confidence: ${result.confidences._overall}`);
    console.log(`Extracted Text Length: ${result.text.length}`);
}

runBenchmark().catch(console.error);
