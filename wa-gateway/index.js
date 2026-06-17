require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.WA_PORT || 3001;
const AUTH_DIR = './auth_info';

let sock = null;
let isConnected = false;
let qrCode = null;

// ─── CONNECT TO WHATSAPP ──────────────────────────────────────────────────
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['BPR BAPERA', 'Chrome', '120.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      qrcode.generate(qr, { small: true });
      console.log('📱 Scan QR Code di atas untuk menghubungkan WhatsApp');
    }

    if (connection === 'open') {
      isConnected = true;
      qrCode = null;
      console.log('✅ WhatsApp terhubung!');
    }

    if (connection === 'close') {
      isConnected = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log('🔄 Reconnecting...');
        setTimeout(connectToWhatsApp, 5000);
      } else {
        console.log('❌ Logged out. Delete auth_info and restart.');
      }
    }
  });
}

// ─── ROUTES ──────────────────────────────────────────────────────────────
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', connected: isConnected, timestamp: new Date().toISOString() });
});

// Get QR code for pairing
app.get('/qr', (req, res) => {
  if (isConnected) return res.json({ status: 'connected', message: 'WhatsApp sudah terhubung' });
  if (qrCode) return res.json({ status: 'waiting', qr: qrCode });
  res.json({ status: 'initializing', message: 'Menunggu QR code...' });
});

// Send message
app.post('/send-message', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'phone dan message wajib diisi.' });
    }

    if (!isConnected || !sock) {
      return res.status(503).json({ success: false, message: 'WhatsApp belum terhubung.' });
    }

    // Format phone: remove +, add @s.whatsapp.net
    let jid = phone.replace(/[^0-9]/g, '');
    if (jid.startsWith('0')) jid = '62' + jid.substring(1);
    jid = jid + '@s.whatsapp.net';

    // Check if number exists on WhatsApp
    const [result] = await sock.onWhatsApp(jid);
    if (!result?.exists) {
      return res.status(404).json({ success: false, message: `Nomor ${phone} tidak terdaftar di WhatsApp.` });
    }

    // Send message
    await sock.sendMessage(result.jid, { text: message });

    console.log(`📤 Pesan terkirim ke ${phone}`);
    res.json({ success: true, message: `Pesan berhasil dikirim ke ${phone}` });

  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ success: false, message: 'Gagal mengirim pesan: ' + err.message });
  }
});

// Send message with template
app.post('/send-template', async (req, res) => {
  try {
    const { phone, template, data } = req.body;

    if (!phone || !template) {
      return res.status(400).json({ success: false, message: 'phone dan template wajib diisi.' });
    }

    if (!isConnected || !sock) {
      return res.status(503).json({ success: false, message: 'WhatsApp belum terhubung.' });
    }

    // Templates
    const templates = {
      PENGAJUAN_BARU: (d) =>
        `🏦 *BPR BAPERA BATANG*\n\n` +
        `Halo ${d.aoNama},\n\n` +
        `Pengajuan kredit baru telah diterima:\n` +
        `📋 No: ${d.nomorPengajuan}\n` +
        `👤 Debitur: ${d.debiturNama}\n` +
        `💰 Plafon: ${d.plafon}\n` +
        `📝 Jenis: ${d.jenisKredit}\n\n` +
        `Silakan lakukan survey lapangan.\n` +
        `_Sistem Analisa Kredit BPR BAPERA_`,

      SURVEY_SELESAI: (d) =>
        `🏦 *BPR BAPERA BATANG*\n\n` +
        `Survey telah selesai:\n` +
        `📋 No: ${d.nomorPengajuan}\n` +
        `👤 Debitur: ${d.debiturNama}\n\n` +
        `Pengajuan siap untuk dianalisa.\n` +
        `_Sistem Analisa Kredit BPR BAPERA_`,

      APPROVAL_APPROVED: (d) =>
        `🏦 *BPR BAPERA BATANG*\n\n` +
        `✅ Pengajuan DISETUJUI:\n` +
        `📋 No: ${d.nomorPengajuan}\n` +
        `👤 Debitur: ${d.debiturNama}\n` +
        `💰 Plafon Disetujui: ${d.plafonDisetujui}\n\n` +
        `Silakan proses pencairan.\n` +
        `_Sistem Analisa Kredit BPR BAPERA_`,

      APPROVAL_REJECTED: (d) =>
        `🏦 *BPR BAPERA BATANG*\n\n` +
        `❌ Pengajuan DITOLAK:\n` +
        `📋 No: ${d.nomorPengajuan}\n` +
        `👤 Debitur: ${d.debiturNama}\n` +
        `📝 Alasan: ${d.catatan || '-'}\n\n` +
        `_Sistem Analisa Kredit BPR BAPERA_`,

      JATUH_TEMPO: (d) =>
        `🏦 *BPR BAPERA BATANG*\n\n` +
        `⚠️ Reminder Angsuran:\n` +
        `👤 Debitur: ${d.debiturNama}\n` +
        `💰 Angsuran: ${d.angsuran}\n` +
        `📅 Jatuh Tempo: ${d.tanggalJatuhTempo}\n\n` +
        `Mohon segera lakukan pembayaran.\n` +
        `_Sistem Analisa Kredit BPR BAPERA_`,
    };

    const templateFn = templates[template];
    if (!templateFn) {
      return res.status(400).json({ success: false, message: `Template "${template}" tidak ditemukan.` });
    }

    const message = templateFn(data || {});

    let jid = phone.replace(/[^0-9]/g, '');
    if (jid.startsWith('0')) jid = '62' + jid.substring(1);
    jid = jid + '@s.whatsapp.net';

    const [check] = await sock.onWhatsApp(jid);
    if (!check?.exists) {
      return res.status(404).json({ success: false, message: `Nomor ${phone} tidak terdaftar di WhatsApp.` });
    }

    await sock.sendMessage(check.jid, { text: message });

    console.log(`📤 Template "${template}" terkirim ke ${phone}`);
    res.json({ success: true, message: `Pesan template berhasil dikirim ke ${phone}` });

  } catch (err) {
    console.error('Error sending template:', err);
    res.status(500).json({ success: false, message: 'Gagal mengirim pesan: ' + err.message });
  }
});

// Disconnect
app.post('/disconnect', async (req, res) => {
  if (sock) {
    await sock.logout();
    isConnected = false;
    res.json({ success: true, message: 'Disconnected from WhatsApp.' });
  } else {
    res.json({ success: false, message: 'No active connection.' });
  }
});

// ─── START ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║  BPR BAPERA - WhatsApp Gateway                  ║
║  Port: ${PORT}                                      ║
║  Scan QR Code untuk menghubungkan                ║
╚══════════════════════════════════════════════════╝
  `);
  connectToWhatsApp();
});
