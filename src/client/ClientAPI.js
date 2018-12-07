import getDebugger from './../common/debug'
import { Pairing } from './../common/classes'

/**
 * Manages the initialization, validation and storing of pairings.
 */
class ClientAPI {
  /**
   * @param {String} serverUrl The URL of the gymote server.
   */
  constructor ({ url, debug }) {
    this.url = url
    this.debug = getDebugger(debug, 'API')
  }

  /**
   * Request a new pairing from the server.
   *
   * @returns {Pairing}
   */
  requestPairing () {
    return window.fetch(this.url + '/code/get').then(response => {
      return response.json()
    }).then(pairing => {
      if (pairing) {
        return Promise.resolve(new Pairing(pairing))
      }

      return Promise.reject(new Error('Could not request pairing.'))
    }).catch(error => {
      return Promise.reject(error)
    })
  }

  /**
   * Get the config from the server.
   *
   * @returns {object}
   */
  requestConfig () {
    return window.fetch(this.url + '/config').then(response => {
      return response.json()
    }).then(config => {
      if (config) {
        return Promise.resolve(config)
      }

      return Promise.reject(new Error('Could not request config.'))
    })
  }

  /**
   * Given a code, get the corresponding pairing.
   *
   * @param {Number} code The code to get the pairing from.
   * @returns {Pairing}
   */
  getHash (code) {
    return window.fetch(this.url + '/code/validate', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ code })
    }).then(response => {
      return response.json()
    }).then(pairing => {
      if (pairing.code && pairing.hash) {
        return Promise.resolve(new Pairing(pairing))
      }

      return Promise.reject(new Error('Code is not valid.'))
    })
  }

  /**
   * Validate a pairing.
   *
   * @param {Pairing} pairing The pairing to validate.
   * @returns {boolean}
   */
  validate (pairing) {
    return window.fetch(this.url + '/pairing/validate', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ pairing: pairing })
    }).then(response => {
      return response.json()
    }).then((isValid) => {
      return Promise.resolve(isValid)
    })
  }
}

export default ClientAPI
