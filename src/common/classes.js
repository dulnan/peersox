/**
 * A pairing.
 *
 * @param {String} code The pairing code.
 * @param {String} hash The pairing hash.
 */
export class Pairing {
  constructor ({ code, hash }) {
    this.code = code
    this.hash = hash
  }
}
