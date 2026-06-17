export function formatRupiah(num) {
  if (num === null || num === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}

export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatPercent(num, decimals = 2) {
  if (num === null || num === undefined) return '0%';
  return `${parseFloat(num).toFixed(decimals)}%`;
}

export function maskNik(nik) {
  if (!nik) return '-';
  return nik.replace(/(\d{6})\d{6}(\d{4})/, '$1******$2');
}
