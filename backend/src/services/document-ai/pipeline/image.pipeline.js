const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

/**
 * ImagePipeline handles document image preprocessing via OpenCV (Python)
 */
class ImagePipeline {
  constructor() {
    this.pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python');
    this.scriptPath = path.join(__dirname, '..', 'python', 'preprocess.py');
    
    // Fallback to global python if venv python doesn't exist
    if (!fs.existsSync(this.pythonPath)) {
      this.pythonPath = 'python3'; 
    }
  }

  /**
   * Process an image buffer using OpenCV Python pipeline
   * @param {Buffer} imageBuffer 
   * @param {string} type 
   * @returns {Promise<Buffer>}
   */
  async process(imageBuffer, type) {
    const tmpId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const tmpDir = path.join(os.tmpdir(), `img_prep_cv_${tmpId}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const tmpIn = path.join(tmpDir, 'input.img');
    const tmpOut = path.join(tmpDir, 'output.png');
    fs.writeFileSync(tmpIn, imageBuffer);

    try {
      // Execute the python preprocessor
      const args = [
        this.scriptPath,
        '--input', tmpIn,
        '--output', tmpOut,
        '--type', type
      ];

      await execFileAsync(this.pythonPath, args);
      
      if (fs.existsSync(tmpOut)) {
        const processedBuffer = fs.readFileSync(tmpOut);
        return processedBuffer;
      } else {
        console.warn(`[ImagePipeline] Python preprocessing failed to generate output, returning original.`);
        return imageBuffer;
      }
    } catch (err) {
      console.error(`[ImagePipeline] Error during Python OpenCV preprocessing:`, err.message);
      return imageBuffer; // Fallback to original image
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (e) {
        console.error(`[ImagePipeline] Failed to clean up temp dir: ${tmpDir}`, e.message);
      }
    }
  }
}

module.exports = new ImagePipeline();
