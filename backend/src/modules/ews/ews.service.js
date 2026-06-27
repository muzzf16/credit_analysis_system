const db = require('../../config/database');
const notifikasiService = require('../notifikasi/notifikasi.service');

// ─── SCAN ENGINE ────────────────────────────────────────────────────────────

async function scanEws() {
  const stats = { scanned: 0, alertsCreated: 0, alertsUpdated: 0, resolved: 0 };

  // 1. Fetch all active monitoring accounts
  const activeLoans = await db.query(
    `SELECT m.id as monitoring_id, m.pengajuan_id, m.debitur_id, m.kolektibilitas,
            p.nomor_pengajuan, d.nama as debitur_nama, d.no_hp as debitur_hp,
            u.id as ao_id, u.phone as ao_phone, u.full_name as ao_nama
     FROM monitoring m
     LEFT JOIN pengajuan p ON m.pengajuan_id = p.id
     LEFT JOIN debitur d ON m.debitur_id = d.id
     LEFT JOIN users u ON p.ao_id = u.id
     WHERE m.status = 'AKTIF'`
  );

  stats.scanned = activeLoans.rows.length;

  for (const loan of activeLoans.rows) {
    const { monitoring_id, pengajuan_id, debitur_nama, debitur_hp, ao_id, ao_phone, ao_nama, nomor_pengajuan } = loan;

    // 2. Fetch unpaid and past due installments to calculate DPD & tunggakan
    const paymentsRes = await db.query(
      `SELECT * FROM pembayaran
       WHERE monitoring_id = $1 AND status IN ('BELUM', 'TUNGGAK')
       ORDER BY tanggal_jatuh_tempo ASC`,
      [monitoring_id]
    );

    let maxDpd = 0;
    let totalTunggakan = 0.0;
    let oldestDueDate = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const pm of paymentsRes.rows) {
      const dueDate = new Date(pm.tanggal_jatuh_tempo);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        const diffTime = Math.abs(today - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > maxDpd) {
          maxDpd = diffDays;
        }
        totalTunggakan += parseFloat(pm.jumlah_angsuran);
        if (!oldestDueDate) {
          oldestDueDate = pm.tanggal_jatuh_tempo;
        }
      }
    }

    // 3. Fetch current qualitative inputs (if any exist in active alerts)
    const existingAlertRes = await db.query(
      `SELECT * FROM ews WHERE pengajuan_id = $1 AND status_alert = 'AKTIF' LIMIT 1`,
      [pengajuan_id]
    );
    const activeAlert = existingAlertRes.rows[0];

    const penurunanOmzet = activeAlert ? activeAlert.penurunan_omzet : false;
    const penurunanCashflow = activeAlert ? activeAlert.penurunan_cashflow : false;
    const kondisiAgunan = activeAlert ? activeAlert.kondisi_agunan : null;
    const kunjunganAoTerakhir = activeAlert ? activeAlert.kunjungan_ao_terakhir : null;

    // 4. Calculate Risk Score and Kolektibilitas
    let kolektibilitas = 1;
    if (maxDpd > 180) kolektibilitas = 5;
    else if (maxDpd > 120) kolektibilitas = 4;
    else if (maxDpd > 90) kolektibilitas = 3;
    else if (maxDpd > 0) kolektibilitas = 2;

    let riskScore = 'LOW';
    if (maxDpd > 30 || penurunanOmzet || penurunanCashflow || (kondisiAgunan && kondisiAgunan.toLowerCase().includes('rusak'))) {
      riskScore = 'HIGH';
    } else if (maxDpd > 0 || (kunjunganAoTerakhir && (new Date() - new Date(kunjunganAoTerakhir)) / (1000*60*60*24) > 90)) {
      riskScore = 'MEDIUM';
    }

    const needsAlert = maxDpd > 0 || totalTunggakan > 0 || penurunanOmzet || penurunanCashflow;

    if (activeAlert) {
      if (!needsAlert) {
        // Resolve alert since it's no longer past due and has no qualitative flags
        await db.query(
          `UPDATE ews SET
             status_alert = 'RESOLVED',
             resolved_at = NOW(),
             dpd = 0,
             jumlah_tunggakan = 0,
             kolektibilitas = 1,
             risk_score = 'LOW',
             updated_at = NOW()
           WHERE id = $1`,
          [activeAlert.id]
        );
        stats.resolved++;
      } else {
        // Update existing alert with latest quantitative details
        await db.query(
          `UPDATE ews SET
             dpd = $1,
             jumlah_tunggakan = $2,
             kolektibilitas = $3,
             risk_score = $4,
             updated_at = NOW()
           WHERE id = $5`,
          [maxDpd, totalTunggakan, kolektibilitas, riskScore, activeAlert.id]
        );
        stats.alertsUpdated++;
      }
    } else if (needsAlert) {
      // Create new active alert
      const triggerType = maxDpd > 0 ? 'TUNGGAKAN' : 'RISK_KUALITATIF';
      const insertRes = await db.query(
        `INSERT INTO ews (
           pengajuan_id, monitoring_id, trigger_type, tanggal_jatuh_tempo,
           jumlah_tunggakan, status_alert, alert_sent_at, dpd, kolektibilitas,
           penurunan_omzet, penurunan_cashflow, kondisi_agunan, kunjungan_ao_terakhir,
           risk_score, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, 'AKTIF', NOW(), $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
         RETURNING *`,
        [
          pengajuan_id, monitoring_id, triggerType, oldestDueDate,
          totalTunggakan, maxDpd, kolektibilitas,
          penurunanOmzet, penurunanCashflow, kondisiAgunan, kunjunganAoTerakhir,
          riskScore
        ]
      );
      stats.alertsCreated++;

      // Trigger Notifications
      const alert = insertRes.rows[0];
      const severityText = riskScore === 'HIGH' ? '🚨 CRITICAL' : '⚠️ WARNING';
      const notificationMsg = `${severityText} EWS Alert: Kredit ${nomor_pengajuan} atas nama ${debitur_nama} terdeteksi memiliki ${triggerType.toLowerCase()}. DPD: ${maxDpd} hari, Tunggakan: Rp ${parseFloat(totalTunggakan).toLocaleString('id-ID')}.`;

      // 1. Notify assigned AO
      if (ao_id) {
        await notifikasiService.createNotification({
          userId: ao_id,
          title: `EWS Alert - ${nomor_pengajuan}`,
          message: notificationMsg,
          type: 'MONITORING',
          referenceId: alert.id,
          referenceType: 'EWS'
        });
        if (ao_phone) {
          await notifikasiService.sendWhatsApp(ao_phone, notificationMsg);
        }
      }

      // 2. Notify SPI and KABID for HIGH risk alerts
      if (riskScore === 'HIGH') {
        const supervisors = await db.query(
          `SELECT u.id, u.phone FROM users u
           JOIN roles r ON u.role_id = r.id
           WHERE r.name IN ('SPI', 'KABID')`
        );
        for (const sup of supervisors.rows) {
          await notifikasiService.createNotification({
            userId: sup.id,
            title: `EWS CRITICAL Alert - ${nomor_pengajuan}`,
            message: notificationMsg,
            type: 'MONITORING',
            referenceId: alert.id,
            referenceType: 'EWS'
          });
          if (sup.phone) {
            await notifikasiService.sendWhatsApp(sup.phone, notificationMsg);
          }
        }
      }
    }
  }

  // 5. Look for upcoming due dates (Jatuh Tempo H-3 reminder)
  const upcomingPayments = await db.query(
    `SELECT p.id as pembayaran_id, p.tanggal_jatuh_tempo, p.jumlah_angsuran,
            m.id as monitoring_id, m.pengajuan_id,
            pj.nomor_pengajuan, d.nama as debitur_nama, d.no_hp as debitur_hp,
            u.id as ao_id, u.phone as ao_phone
     FROM pembayaran p
     JOIN monitoring m ON p.monitoring_id = m.id
     JOIN pengajuan pj ON m.pengajuan_id = pj.id
     JOIN debitur d ON m.debitur_id = d.id
     LEFT JOIN users u ON pj.ao_id = u.id
     WHERE p.status = 'BELUM'
       AND p.tanggal_jatuh_tempo = CURRENT_DATE + INTERVAL '3 days'
       AND m.status = 'AKTIF'`
  );

  for (const pay of upcomingPayments.rows) {
    const { nomor_pengajuan, debitur_nama, debitur_hp, jumlah_angsuran, tanggal_jatuh_tempo } = pay;

    // Send pre-due WhatsApp reminder to debitur
    if (debitur_hp) {
      const debiturMsg = `Yth. Bpk/Ibu ${debitur_nama}, menginfokan bahwa angsuran kredit Anda (${nomor_pengajuan}) sebesar Rp ${parseFloat(jumlah_angsuran).toLocaleString('id-ID')} akan jatuh tempo pada tanggal ${tanggal_jatuh_tempo}. Mohon pastikan saldo tersedia. Terima kasih. — BPR BAPERA BATANG`;
      await notifikasiService.sendWhatsApp(debitur_hp, debiturMsg);
    }

    // Send WhatsApp notification to AO as well
    if (pay.ao_phone) {
      const aoMsg = `Reminder Jatuh Tempo H-3: Debitur ${debitur_nama} (${nomor_pengajuan}) akan jatuh tempo pada ${tanggal_jatuh_tempo} senilai Rp ${parseFloat(jumlah_angsuran).toLocaleString('id-ID')}.`;
      await notifikasiService.sendWhatsApp(pay.ao_phone, aoMsg);
    }
  }

  return stats;
}

// ─── FETCH LIST & DETAILS ──────────────────────────────────────────────────

async function getAll(filters = {}) {
  const { statusAlert = 'AKTIF', riskScore, search, page = 1, limit = 20 } = filters;
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (statusAlert) {
    conditions.push(`e.status_alert = $${paramIdx++}`);
    params.push(statusAlert);
  }
  if (riskScore) {
    conditions.push(`e.risk_score = $${paramIdx++}`);
    params.push(riskScore);
  }
  if (search) {
    conditions.push(`(d.nama ILIKE $${paramIdx} OR p.nomor_pengajuan ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRes = await db.query(
    `SELECT COUNT(*) FROM ews e
     LEFT JOIN pengajuan p ON e.pengajuan_id = p.id
     LEFT JOIN debitur d ON p.debitur_id = d.id
     ${whereClause}`, params
  );
  const total = parseInt(countRes.rows[0].count);

  const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const safePage = Math.max(1, parseInt(page));
  const offset = (safePage - 1) * safeLimit;

  const result = await db.query(
    `SELECT e.*, p.nomor_pengajuan, p.jenis_kredit, d.nama as debitur_nama, d.no_hp as debitur_hp,
            u.full_name as ao_nama, r.full_name as resolved_by_nama
     FROM ews e
     LEFT JOIN pengajuan p ON e.pengajuan_id = p.id
     LEFT JOIN debitur d ON p.debitur_id = d.id
     LEFT JOIN users u ON p.ao_id = u.id
     LEFT JOIN users r ON e.resolved_by = r.id
     ${whereClause}
     ORDER BY e.risk_score = 'HIGH' DESC, e.dpd DESC, e.created_at DESC
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, safeLimit, offset]
  );

  return {
    data: result.rows,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

async function getById(id) {
  const ewsRes = await db.query(
    `SELECT e.*, p.nomor_pengajuan, p.jenis_kredit, p.tujuan_kredit, p.plafon_diajukan,
            d.nama as debitur_nama, d.nik, d.no_hp as debitur_hp, d.alamat,
            u.full_name as ao_nama, u.phone as ao_phone,
            r.full_name as resolved_by_nama
     FROM ews e
     LEFT JOIN pengajuan p ON e.pengajuan_id = p.id
     LEFT JOIN debitur d ON p.debitur_id = d.id
     LEFT JOIN users u ON p.ao_id = u.id
     LEFT JOIN users r ON e.resolved_by = r.id
     WHERE e.id = $1`, [id]
  );
  if (!ewsRes.rows[0]) {
    const err = new Error('Data alert EWS tidak ditemukan.'); err.status = 404; throw err;
  }

  const alert = ewsRes.rows[0];

  // Include payment history for this loan
  const paymentsRes = await db.query(
    `SELECT * FROM pembayaran WHERE monitoring_id = $1 ORDER BY angsuran_ke ASC`,
    [alert.monitoring_id]
  );

  return {
    ...alert,
    pembayaran: paymentsRes.rows,
  };
}

// ─── ACTIONS ────────────────────────────────────────────────────────────────

async function resolveAlert(id, data, userId) {
  const { statusAlert, catatan, rekomendasi } = data; // statusAlert can be RESOLVED or DISMISSED

  const existing = await db.query('SELECT * FROM ews WHERE id = $1 AND status_alert = \'AKTIF\'', [id]);
  if (!existing.rows[0]) {
    const err = new Error('Alert EWS aktif tidak ditemukan.'); err.status = 404; throw err;
  }

  const result = await db.query(
    `UPDATE ews SET
       status_alert = $1,
       catatan = COALESCE($2, catatan),
       rekomendasi = COALESCE($3, rekomendasi),
       resolved_at = NOW(),
       resolved_by = $4,
       updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [statusAlert || 'RESOLVED', catatan, rekomendasi, userId, id]
  );

  return result.rows[0];
}

async function logAoVisit(monitoringId, visitData, userId) {
  const { penurunanOmzet, penurunanCashflow, kondisiAgunan, catatan } = visitData;

  const monRes = await db.query('SELECT * FROM monitoring WHERE id = $1', [monitoringId]);
  if (!monRes.rows[0]) {
    const err = new Error('Data monitoring tidak ditemukan.'); err.status = 404; throw err;
  }
  const loan = monRes.rows[0];

  // 1. Get or create active alert for this loan
  const existingAlertRes = await db.query(
    `SELECT * FROM ews WHERE monitoring_id = $1 AND status_alert = 'AKTIF' LIMIT 1`,
    [monitoringId]
  );
  let alert = existingAlertRes.rows[0];

  // Calculate risk score based on inputs
  const isQualitativeRisk = penurunanOmzet || penurunanCashflow || (kondisiAgunan && kondisiAgunan.toLowerCase().includes('rusak'));
  const riskScore = isQualitativeRisk ? 'HIGH' : (loan.kolektibilitas > 1 ? 'MEDIUM' : 'LOW');

  if (alert) {
    // Update existing active alert
    const result = await db.query(
      `UPDATE ews SET
         penurunan_omzet = $1,
         penurunan_cashflow = $2,
         kondisi_agunan = $3,
         kunjungan_ao_terakhir = CURRENT_DATE,
         catatan = COALESCE($4, catatan),
         risk_score = $5,
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [penurunanOmzet, penurunanCashflow, kondisiAgunan, catatan, riskScore, alert.id]
    );
    alert = result.rows[0];
  } else {
    // Create new active alert for qualitative risk
    const result = await db.query(
      `INSERT INTO ews (
         pengajuan_id, monitoring_id, trigger_type, status_alert, dpd, kolektibilitas,
         penurunan_omzet, penurunan_cashflow, kondisi_agunan, kunjungan_ao_terakhir,
         risk_score, catatan, created_at, updated_at
       )
       VALUES ($1, $2, 'RISK_KUALITATIF', 'AKTIF', 0, $3, $4, $5, $6, CURRENT_DATE, $7, $8, NOW(), NOW())
       RETURNING *`,
      [loan.pengajuan_id, monitoringId, loan.kolektibilitas, penurunanOmzet, penurunanCashflow, kondisiAgunan, riskScore, catatan]
    );
    alert = result.rows[0];

    // Dispatch WhatsApp & In-App alert
    const debiturRes = await db.query('SELECT nama FROM debitur WHERE id = $1', [loan.debitur_id]);
    const debiturNama = debiturRes.rows[0]?.nama || '';
    const severityText = riskScore === 'HIGH' ? '🚨 CRITICAL' : '⚠️ WARNING';
    const notificationMsg = `${severityText} EWS Qualitative Alert: Kredit ${loan.pengajuan_id} (${debiturNama}) terdeteksi memiliki risiko kualitatif. Omzet turun: ${penurunanOmzet ? 'YA' : 'TIDAK'}, Cashflow turun: ${penurunanCashflow ? 'YA' : 'TIDAK'}, Agunan: ${kondisiAgunan || 'Normal'}.`;

    // Notify AO
    const aoRes = await db.query(
      `SELECT u.id, u.phone FROM users u
       JOIN pengajuan p ON p.ao_id = u.id
       WHERE p.id = $1`,
      [loan.pengajuan_id]
    );
    const ao = aoRes.rows[0];
    if (ao) {
      await notifikasiService.createNotification({
        userId: ao.id, title: `EWS Alert Kualitatif`, message: notificationMsg,
        type: 'MONITORING', referenceId: alert.id, referenceType: 'EWS'
      });
      if (ao.phone) await notifikasiService.sendWhatsApp(ao.phone, notificationMsg);
    }
  }

  // Update monitoring notes
  await db.query(
    `UPDATE monitoring SET
       catatan = COALESCE($1, catatan),
       updated_at = NOW()
     WHERE id = $2`,
    [`Kunjungan AO terakhir: ${new Date().toISOString().split('T')[0]}. Catatan: ${catatan || ''}`, monitoringId]
  );

  return alert;
}

// ─── DASHBOARD SUMMARY ──────────────────────────────────────────────────────

async function getSummary() {
  const totalRes = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE status_alert = 'AKTIF') as active,
       COUNT(*) FILTER (WHERE status_alert = 'RESOLVED') as resolved,
       COUNT(*) FILTER (WHERE status_alert = 'DISMISSED') as dismissed
     FROM ews`
  );

  const riskRes = await db.query(
    `SELECT risk_score, COUNT(*) as count
     FROM ews WHERE status_alert = 'AKTIF'
     GROUP BY risk_score`
  );

  const triggerRes = await db.query(
    `SELECT trigger_type, COUNT(*) as count
     FROM ews WHERE status_alert = 'AKTIF'
     GROUP BY trigger_type`
  );

  return {
    totals: {
      active: parseInt(totalRes.rows[0].active) || 0,
      resolved: parseInt(totalRes.rows[0].resolved) || 0,
      dismissed: parseInt(totalRes.rows[0].dismissed) || 0,
    },
    byRisk: riskRes.rows,
    byTrigger: triggerRes.rows,
  };
}

module.exports = {
  scanEws,
  getAll,
  getById,
  resolveAlert,
  logAoVisit,
  getSummary,
};
