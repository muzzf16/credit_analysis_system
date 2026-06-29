'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const { parseKTP, parseDocumentText } = require('../../../src/modules/ocr/utils/parsers');

describe('OCR KTP parser', () => {
  test('parses single-line labels and values', () => {
    const rawText = `
NIK : 3302241010690005
Nama : SAPTO NUGROHO
Tempat/Tgl Lahir : KEBUMEN,10-10-1969
Jenis Kelamin : LAKI-LAKI
Alamat : PONDOK INDAH
RT/RW : 005/006
Kel/Desa : KARANGSARI
Kecamatan : KEBUMEN
Agama : ISLAM
Status Perkawinan : KAWIN
Pekerjaan : WIRASWASTA
Kewarganegaraan : WNI
    `;

    const parsed = parseKTP(rawText);

    assert.strictEqual(parsed.nik, '3302241010690005');
    assert.strictEqual(parsed.nama, 'SAPTO NUGROHO');
    assert.strictEqual(parsed.tempat_tgl_lahir, 'KEBUMEN, 1969-10-10');
    assert.strictEqual(parsed.jenis_kelamin, 'LAKI-LAKI');
    assert.strictEqual(parsed.alamat, 'PONDOK INDAH');
    assert.strictEqual(parsed.rt_rw, '005/006');
    assert.strictEqual(parsed.kel_desa, 'KARANGSARI');
    assert.strictEqual(parsed.kecamatan, 'KEBUMEN');
    assert.strictEqual(parsed.agama, 'ISLAM');
    assert.strictEqual(parsed.status_perkawinan, 'KAWIN');
    assert.strictEqual(parsed.pekerjaan, 'WIRASWASTA');
    assert.strictEqual(parsed.kewarganegaraan, 'WNI');
  });

  test('parses multi-line labels and OCR digit confusions', () => {
    const rawText = `
NIK
33O224IOIO69OOO5
Nama
SAPTO NUGROHO
Tempat/Tgl Lahir
KEBUMEN,10-10-1969
Jenis Kelamin
P
Alamat
PONDOK INDAH
005/006
Kel/Desa
KARANGSARI
Kecamatan
KEBUMEN
Agama
ISLAM
Status Perkawinan
KAWIN
Pekerjaan
WIRASWASTA
Kewarganegaraan
WNI
    `;

    const parsed = parseKTP(rawText);

    assert.strictEqual(parsed.nik, '3302241010690005');
    assert.strictEqual(parsed.nama, 'SAPTO NUGROHO');
    assert.strictEqual(parsed.tempat_tgl_lahir, 'KEBUMEN, 1969-10-10');
    assert.strictEqual(parsed.jenis_kelamin, 'PEREMPUAN');
    assert.strictEqual(parsed.alamat, 'PONDOK INDAH');
    assert.strictEqual(parsed.rt_rw, '005/006');
    assert.strictEqual(parsed.kel_desa, 'KARANGSARI');
    assert.strictEqual(parsed.kecamatan, 'KEBUMEN');
    assert.strictEqual(parsed.agama, 'ISLAM');
    assert.strictEqual(parsed.status_perkawinan, 'KAWIN');
    assert.strictEqual(parsed.pekerjaan, 'WIRASWASTA');
    assert.strictEqual(parsed.kewarganegaraan, 'WNI');
  });

  test('keeps kel_desa empty when next line is another label', () => {
    const rawText = `
NIK : 3302241010690005
Nama : SAPTO NUGROHO
Kel/Desa :
Kecamatan : KEBUMEN
    `;

    const parsed = parseKTP(rawText);

    assert.strictEqual(parsed.kel_desa, '');
    assert.strictEqual(parsed.kecamatan, 'KEBUMEN');
  });

  test('parses real tesseract-style ktp output into populated fields', () => {
    const rawText = `
PROVINSI JAWA TENGAH
KABUPATEN BANYUMAS
NIK : 33000241010690005 BER
Nama : SAPTO NUGROHO An
Tempat/Tgl Lahir : KEBUMEN, 10-10-1969 i
Jenis Kelamin : LAKI-LAKI Gol. Darah : A | "
Alamat : PONDOK INDAH BLOK D.30/31 - 1
RT/RW :005 / 006 4 |
Kel/Desa : PURWOKERTO KULON
Kecamatan : PURWOKERTO SELATAN
Agama : ISLAM
Status Perkawinan : KAWIN .
Pekerjaan : KARYAWAN SWASTA BANYUMAS
Kewarganegaraan: WNI 26-08-2012
Beriaku Hingga ”— : 10-10-2017 5
    `;

    const parsed = parseKTP(rawText);

    assert.ok(parsed.nik.length === 16);
    assert.strictEqual(parsed.nama, 'SAPTO NUGROHO');
    assert.strictEqual(parsed.tempat_tgl_lahir, 'KEBUMEN, 1969-10-10');
    assert.strictEqual(parsed.jenis_kelamin, 'LAKI-LAKI');
    assert.strictEqual(parsed.alamat, 'PONDOK INDAH BLOK D.30/31 - 1');
    assert.strictEqual(parsed.rt_rw, '005/006');
    assert.strictEqual(parsed.kel_desa, 'PURWOKERTO KULON');
    assert.strictEqual(parsed.kecamatan, 'PURWOKERTO SELATAN');
    assert.strictEqual(parsed.agama, 'ISLAM');
    assert.strictEqual(parsed.status_perkawinan, 'KAWIN');
    assert.strictEqual(parsed.pekerjaan, 'KARYAWAN SWASTA BANYUMAS');
    assert.strictEqual(parsed.kewarganegaraan, 'WNI');
  });

  test('parseDocumentText routes ktp documents to parseKTP', () => {
    const rawText = `
NIK : 3302241010690005
Nama : SAPTO NUGROHO
    `;

    const parsed = parseDocumentText(rawText, 'ktp');
    assert.strictEqual(parsed.nik, '3302241010690005');
    assert.strictEqual(parsed.nama, 'SAPTO NUGROHO');
  });
});
