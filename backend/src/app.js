require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');

const app = express();

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────
app.use('/auth', require('./modules/auth/auth.routes'));
app.use('/users', require('./modules/users/users.routes'));
app.use('/debitur', require('./modules/debitur/debitur.routes'));
app.use('/pengajuan', require('./modules/pengajuan/pengajuan.routes'));
app.use('/survey', require('./modules/survey/survey.routes'));
app.use('/agunan', require('./modules/agunan/agunan.routes'));
app.use('/slik', require('./modules/slik/slik.routes'));
app.use('/analisa', require('./modules/analisa/analisa.routes'));
app.use('/scoring', require('./modules/scoring/scoring.routes'));
app.use('/approval', require('./modules/approval/approval.routes'));
app.use('/dokumen', require('./modules/dokumen/dokumen.routes'));
app.use('/dashboard', require('./modules/dashboard/dashboard.routes'));
app.use('/mak', require('./modules/mak/mak.routes'));
app.use('/ai', require('./modules/ai/ai.routes'));
app.use('/notifikasi', require('./modules/notifikasi/notifikasi.routes'));
app.use('/monitoring', require('./modules/monitoring/monitoring.routes'));
app.use('/ews', require('./modules/ews/ews.routes'));
app.use('/audit', require('./modules/audit/audit.routes'));
app.use('/ocr', require('./modules/ocr/routes/ocr.routes'));
app.use('/ocr', require('./modules/ocr/learning/feedback.routes'));
app.use('/intelligence', require('./modules/document-intelligence/routes/document-intelligence.routes'));
app.use('/document', require('./modules/document/document.routes'));

// ─── 404 HANDLER ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} tidak ditemukan.` });
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'File terlalu besar. Maksimal 10MB.' });
  }
  if (err.message && err.message.includes('Tipe file')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server.' });
});

// ─── START SERVER ─────────────────────────────────────────────────────────
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║  BPR BAPERA BATANG — Sistem Analisa Kredit      ║
║  Backend API v1.0.0                              ║
║  Port: ${PORT}                                      ║
║  Environment: ${config.nodeEnv}                     ║
╚══════════════════════════════════════════════════╝
  `);
});

// Set timeout to 5 minutes (300000 ms) for long-running OCR tasks
server.setTimeout(300000);

module.exports = app;
