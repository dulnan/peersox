/**
 * Keep track of connections.
 */
export default class Connections {
  constructor () {
    this._success = 0
    this._error = 0
    this._attempt = 0
  }

  attempt () {
    this._attempt = this._attempt + 1
  }

  error () {
    this._error = this._error + 1
  }

  success () {
    this._success = this._success + 1
  }
}
