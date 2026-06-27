/**
 * Deep freeze utility - makes objects immutable
 * @param {*} obj - Object to freeze
 * @returns {*} Frozen object
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

module.exports = deepFreeze;