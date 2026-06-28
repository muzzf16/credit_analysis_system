require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY || '00000000000000000000000000000000',
  ocrEngine: process.env.OCR_ENGINE || 'tesseract',
  lfmApiUrl: process.env.LFM_API_URL || 'http://localhost:1976',
  llmProvider: process.env.LLM_PROVIDER || 'openai',
  llmApiUrl: process.env.LLM_API_URL || 'http://localhost:1978/v1',
  llmApiKey: process.env.LLM_API_KEY || 'no-key',
  llmModelName: process.env.LLM_MODEL_NAME || 'qwen3.5',
  glmApiUrl: process.env.GLM_API_URL || 'https://api.llamamind.com/v1',
  glmApiKey: process.env.GLM_API_KEY || process.env.LLM_API_KEY || 'no-key',
  glmOcrServiceUrl: process.env.GLM_OCR_SERVICE_URL || 'http://localhost:8000',
};
