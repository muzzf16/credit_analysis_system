/**
 * db-helpers.js
 * Utility functions for safe type conversion before inserting to PostgreSQL.
 * Converts empty strings and undefined to null for typed columns.
 */

/**
 * Convert value to null if empty/undefined, otherwise return as-is (for DATE columns)
 * @param {*} v
 * @returns {string|null}
 */
const toDate = (v) => (v !== null && v !== undefined && String(v).trim() !== '' ? String(v).trim() : null);

/**
 * Convert value to float or null (for NUMERIC/DECIMAL columns)
 * @param {*} v
 * @returns {number|null}
 */
const toNum = (v) => {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const parsed = parseFloat(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'));
  return isNaN(parsed) ? null : parsed;
};

/**
 * Convert value to integer or null (for INTEGER columns)
 * @param {*} v
 * @returns {number|null}
 */
const toInt = (v) => {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const parsed = parseInt(String(v), 10);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Convert value to string or null (for VARCHAR/TEXT columns to avoid empty strings)
 * @param {*} v
 * @returns {string|null}
 */
const toStr = (v) => (v !== null && v !== undefined && String(v).trim() !== '' ? String(v).trim() : null);

/**
 * Convert value to boolean or null
 * @param {*} v
 * @returns {boolean|null}
 */
const toBool = (v) => {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return null;
};

module.exports = { toDate, toNum, toInt, toStr, toBool };
