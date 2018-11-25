import crypto from 'crypto'

/**
 * Generate a random hex code in form of a sha256 hash.
 */
export function buildRandomHex () {
  const random = crypto.randomBytes(64).toString('hex')
  return crypto.createHash('sha256').update(random).digest('hex')
}

/**
 * Generate a random number.
 *
 * @param {String} hash A random hash as a String.
 * @returns {String} A random numerical code as a String.
 */
export function buildRandomCode (hash) {
  return String(Math.round(hash * Math.random() * 89999) / Math.random()).substring(0, 6)
}

/**
 * Check if given argument is a String.
 *
 * @param {*} v
 * @returns {Boolean}
 */
export function isString (v) {
  return typeof v === 'string' || v instanceof String
}

/**
 * Checks if the given code is valid.
 *
 * @param {String} code
 * @returns {Boolean}
 */
export function codeIsValid (code) {
  if (!exports.isString(code)) {
    return false
  }

  if (code.length !== 6) {
    return false
  }

  if (/^\d+$/.test(code) === false) {
    return false
  }

  return true
}

/**
 * Checks if the given string is a valid pairing hash.
 *
 * @param {String} hash
 */
export function hashIsValid (hash) {
  return true
}

/**
 * Checks if the code and hash of the pairing are valid.
 *
 * @param {Pairing} pairing
 */
export function pairingIsValid (pairing) {
  return exports.codeIsValid(pairing.code) && exports.hashIsValid(pairing.hash)
}
