import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
  getRoles: () => api.get('/users/roles'),
};

export const debiturService = {
  getAll: (params) => api.get('/debitur', { params }),
  getById: (id) => api.get(`/debitur/${id}`),
  create: (data) => api.post('/debitur', data),
  update: (id, data) => api.put(`/debitur/${id}`, data),
  delete: (id) => api.delete(`/debitur/${id}`),
};

export const pengajuanService = {
  getAll: (params) => api.get('/pengajuan', { params }),
  getById: (id) => api.get(`/pengajuan/${id}`),
  create: (data) => api.post('/pengajuan', data),
  updateStatus: (id, status) => api.put(`/pengajuan/${id}/status`, { status }),
  assignAnalis: (id, analisId) => api.put(`/pengajuan/${id}/assign-analis`, { analisId }),
};

export const surveyService = {
  getByPengajuanId: (id) => api.get(`/survey/pengajuan/${id}`),
  create: (data) => api.post('/survey', data),
};

export const agunanService = {
  getByPengajuanId: (id) => api.get(`/agunan/pengajuan/${id}`),
  getById: (id) => api.get(`/agunan/${id}`),
  create: (data) => api.post('/agunan', data),
  update: (id, data) => api.put(`/agunan/${id}`, data),
  addFoto: (agunanId, data) => api.post(`/agunan/${agunanId}/foto`, data),
};

export const slikService = {
  getByPengajuanId: (id) => api.get(`/slik/pengajuan/${id}`),
  create: (data) => api.post('/slik', data),
};

export const analisaService = {
  getKonsumtif: (pengajuanId) => api.get(`/analisa/konsumtif/${pengajuanId}`),
  saveKonsumtif: (data) => api.post('/analisa/konsumtif', data),
  getProduktif: (pengajuanId) => api.get(`/analisa/produktif/${pengajuanId}`),
  saveProduktif: (data) => api.post('/analisa/produktif', data),
};

export const scoringService = {
  getByPengajuanId: (pengajuanId) => api.get(`/scoring/${pengajuanId}`),
  save: (data) => api.post('/scoring', data),
};

export const approvalService = {
  getByPengajuanId: (pengajuanId) => api.get(`/approval/pengajuan/${pengajuanId}`),
  getPending: () => api.get('/approval/pending'),
  submit: (data) => api.post('/approval', data),
};

export const dashboardService = {
  get: () => api.get('/dashboard'),
};

export const dokumenService = {
  upload: (formData) => api.post('/dokumen', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getByReferensi: (id, tipe) => api.get(`/dokumen/referensi/${id}`, { params: { tipe } }),
  download: (id) => api.get(`/dokumen/${id}/download`),
};

export const makService = {
  getData: (pengajuanId) => api.get(`/mak/pengajuan/${pengajuanId}`),
  generate: (pengajuanId) => api.post(`/mak/generate/${pengajuanId}`),
};

export const notifikasiService = {
  getAll: (params) => api.get('/notifikasi', { params }),
  getUnreadCount: () => api.get('/notifikasi/unread-count'),
  markAsRead: (id) => api.put(`/notifikasi/${id}/read`),
};

export const monitoringService = {
  getAll: (params) => api.get('/monitoring', { params }),
  getById: (id) => api.get(`/monitoring/${id}`),
  create: (data) => api.post('/monitoring', data),
  recordPayment: (id, data) => api.post(`/monitoring/${id}/pembayaran`, data),
  getSummary: () => api.get('/monitoring/summary'),
};

export const ewsService = {
  getAll: (params) => api.get('/ews', { params }),
  getById: (id) => api.get(`/ews/${id}`),
  resolve: (id, data) => api.post(`/ews/${id}/resolve`, data),
  logAoVisit: (data) => api.post('/ews/visit', data),
  getSummary: () => api.get('/ews/summary'),
  scan: () => api.post('/ews/scan'),
};

export const auditService = {
  getAll: (params) => api.get('/audit', { params }),
  getSummary: () => api.get('/audit/summary'),
};

export const ocrService = {
  process: (formData) => api.post('/ocr', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000 // 5 minutes timeout for heavy OCR tasks like PDFs
  }),
};

// Document AI — VLM LFM2.5-VL (engine aktif di backend, lihat document-ai.service.js)
// Timeout 120 detik karena model butuh ~20-25 detik inference di CPU
export const documentService = {
  extractKtp:    (formData) => api.post('/document/ktp',    formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
  extractSuratNikah: (formData) => api.post('/document/surat_nikah', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
  extractKk:     (formData) => api.post('/document/kk',     formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
  extractNpwp:   (formData) => api.post('/document/npwp',   formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
  extractShm:    (formData) => api.post('/document/shm',      formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
  extractShmPage:(formData) => api.post('/document/shm/page', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
  extractBpkb:   (formData) => api.post('/document/bpkb',     formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),

  extractSurvey: (formData) => api.post('/document/survey', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
};

export const aiService = {
  getNarrative: (pengajuanId) => api.get(`/ai/narrative/${pengajuanId}`),
  generateNarrative: (pengajuanId) => api.post(`/ai/narrative/${pengajuanId}`),
};

