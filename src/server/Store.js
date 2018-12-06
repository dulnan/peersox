import { buildRandomCode, buildRandomHex, codeIsValid, pairingIsValid } from './utils/index.js'
import { Pairing, Validation } from './../common/classes'

import stringHash from 'string-hash'
import { promisify } from 'util'

const EXPIRE_CODE = 130 // 130 seconds
const EXPIRE_PAIRED = 60 * 60 * 24 * 7 // 7 days

/**
 * Handles all things related to generating pairing codes and hashes
 * and validating them.
 *
 * @class
 */
class Store {
  /**
   * @param {RedisClient} redisClient
   */
  constructor (redisClient) {
    this.redisGet = promisify(redisClient.get).bind(redisClient)
    this.redisSet = promisify(redisClient.set).bind(redisClient)
    this.redisExists = promisify(redisClient.exists).bind(redisClient)
    this.redisDel = promisify(redisClient.del).bind(redisClient)
    this.redisExpire = promisify(redisClient.expire).bind(redisClient)

    this._redisReady = false

    redisClient.on('ready', () => {
      this._redisReady = true
      console.log('Redis is ready.')
    })

    redisClient.on('error', () => {
      this._redisReady = false
      console.log('Redis has errored.')
    })
  }

  /**
   * Checks if the given hash exists.
   *
   * @param {String} hash
   */
  async keyExists (hash) {
    const res = await this.redisExists(hash)
    return res === 1
  }

  /**
   * Generates a random hash and checks that it's unique.
   *
   * @returns {String} The generated hash.
   */
  async generateHash () {
    let alreadyUsed = false
    let hash = ''

    do {
      hash = buildRandomHex()
      alreadyUsed = await this.keyExists(hash)
    } while (alreadyUsed)

    return hash
  }

  /**
   * Generates a random code and checks that it's unique.
   *
   * @returns {String} The generated code.
   */
  async generateCode (hash) {
    const numericHash = stringHash(hash)
    let alreadyUsed = false
    let code = '000000'

    do {
      code = buildRandomCode(numericHash)
      alreadyUsed = await this.keyExists(code)
    } while (alreadyUsed)

    return code
  }

  /**
   * Generate a pairing combination of hash and code.
   * Both are stored in redis with a short expire time.
   *
   * @returns {Pairing} The generated pairing.
   */
  async generatePairing () {
    const hash = await this.generateHash()
    const code = await this.generateCode(hash)

    const hashIsSet = await this.redisSet(hash, code, 'EX', EXPIRE_CODE) === 'OK'
    const codeIsSet = await this.redisSet(code, hash, 'EX', EXPIRE_CODE) === 'OK'

    if (hashIsSet && codeIsSet) {
      return new Pairing({ code, hash })
    } else {
      throw new Error('PairingGenerateFailed')
    }
  }

  /**
   * Gets the pairing from a code. If it exists, the code is deleted
   * and the expire time of the hash increased.
   *
   * @param {String} code The code to get the pairing from.
   * @returns {(Pairing|Object)} A pairing or an empty object if no pairing was found.
   */
  async getPairingFromCode (code) {
    if (codeIsValid(code)) {
      const exists = await this.keyExists(code)

      if (exists) {
        const hash = await this.redisGet(code)
        await this.redisDel(code)
        await this.redisExpire(hash, EXPIRE_PAIRED)

        return new Pairing({ code, hash })
      }
    }
    return {}
  }

  /**
   * Check if the given pairing is valid, both as values and as
   * stored keys in redis.
   *
   * @param {Pairing} pairing
   * @returns {boolean} Object with isValid property.
   */
  async validatePairing (pairing) {
    let isValid = false

    if (pairingIsValid(pairing)) {
      const hashExists = await this.keyExists(pairing.hash)

      if (hashExists) {
        const code = await this.redisGet(pairing.hash)

        if (pairing.code === code) {
          isValid = true
        }
      }
    }
    return new Validation(isValid)
  }
}

export default Store
