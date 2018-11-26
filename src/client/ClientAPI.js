import getDebugger from './../common/debug'
import Cookies from 'js-cookie'
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
   * Check for pairings stored in a cookie, validate them and return them.
   *
   * @param {Function} cb The callback, which will receive the pairing.
   */
  getStoredPairing (cb) {
    const cookie = Cookies.get('pairing')

    if (cookie) {
      try {
        const pairing = JSON.parse(cookie)

        window.fetch(this.url + '/pairing/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pairing)
        }).then((response) => {
          return response.json()
        }).then((response) => {
          const isValid = response.data.isValid
          if (isValid) {
            cb(new Pairing(pairing))
          } else {
            this.deletePairing(pairing)
            cb()
          }
        })
      } catch (e) {
        this.deletePairing()
      }
    }
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
        return new Pairing(pairing)
      }

      return new Error('Could not request pairing.')
    }).catch(error => {
      return error
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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    }).then(response => {
      return response.json()
    }).then(pairing => {
      if (pairing.code && pairing.hash) {
        return new Pairing(pairing)
      }

      return new Error('Code is not valid')
    }).catch(error => {
      return error
    })
  }

  /**
   * Save the given pairing in a cookie.
   *
   * @param {Pairing} pairing The pairing to save.
   */
  savePairing (pairing) {
    Cookies.set('pairing', pairing.toString())
  }

  /**
   * Delete all pairing cookies.
   */
  deletePairing () {
    Cookies.remove('pairing')
  }
}

export default ClientAPI
