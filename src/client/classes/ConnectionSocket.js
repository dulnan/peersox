import WebSocket from 'isomorphic-ws'
import { HANDSHAKE_SUCCESS, HANDSHAKE_FAILED } from '../../settings'

import Connection from './Connection'

/**
 * A WebRTC/WebSocket peer connection.
 *
 * @extends Connection
 */
class ConnectionSocket extends Connection {
  constructor ({
    url = 'http://localhost:3000/peersox/',
    timeout = 10000,
    debug = false
  } = {}) {
    super(debug, 'WebSocket')

    this.socket = null
    this.url = url
    this.timeoutDuration = timeout
    this.timeout = null
  }

  /**
   * Connect to the WebSocket server and perform a handshake with the given
   * pairing.
   *
   * This method will attach temporary listeners on the WebSocket instance.
   * These are used for the handshake with the server and to resolve or reject
   * the promise. If the handshake is successful, the WebSocket instance is
   * passed to a method where the permanent listeners are attached.
   *
   * The server will automatically close the connection when the handshake
   * fails.
   *
   * @param {Pairing} pairing The pairing to use for the WebSocket connection.
   * @returns {Promise}
   */
  connect (pairing) {
    return new Promise((resolve, reject) => {
      // Initialize a new WebSocket connection.
      let socket = new WebSocket(this.url)
      socket.binaryType = 'arraybuffer'

      // Add event listener for when socket connection is opened.
      socket.onopen = () => {
        this.sendInternalEvent('client.register', pairing, socket)
      }

      // Add a temporary error handler to reject the promise when the connection
      // failed.
      socket.onerror = (error) => {
        window.clearTimeout(this.timeout)
        this._handleError()
        reject(error)
      }

      // Add a temporary message handler to listen for the handshake response
      // from the server and resolve or reject the promise.
      socket.onmessage = (message) => {
        window.clearTimeout(this.timeout)

        if (message.data === HANDSHAKE_SUCCESS) {
          this.initSocket(socket)
          resolve(pairing)
        } else if (message.data === HANDSHAKE_FAILED) {
          reject(new Error('Invalid pairing'))
        } else {
          reject(new Error('Connection failed'))
        }
      }

      // If for whatever reason everything fails, set up a timeout that will
      // still reject the promise and clean up.
      this.timeout = window.setTimeout(() => {
        if (!this.isConnected()) {
          reject(new Error('Connection timed out'))
        }
      }, this.timeoutDuration)
    })
  }

  /**
   * Initialize the WebSocket connection after the handshake was successful.
   *
   * @param {WebSocket} socket The WebSocket instance.
   * handshake.
   */
  initSocket (socket) {
    this._handleConnected()

    socket.onerror = this._handleSocketError.bind(this)
    socket.onclose = this.close.bind(this)
    socket.onmessage = (e) => {
      this._handleIncomingMessage(e.data)
    }

    this.socket = socket
  }

  /**
   * Send data to the WebSocket server.
   *
   * @param {String|ArrayBuffer} data The data to send to the server.
   */
  send (data) {
    this.socket.send(data)
  }

  /**
   * Send the signaling data from the RTC connection to the server. It will
   * directly pass it to the peer.
   *
   * @param {object} signal The signaling data.
   */
  sendSignal (signal) {
    this.sendInternalEvent('peer.signal', signal, this.socket)
  }

  /**
   * Handle the error event of the WebSocket connection.
   *
   * @param {Error} error The error.
   */
  _handleSocketError (error) {
    this._handleError(error)
  }

  /**
   * Close the WebSocket connection.
   */
  close () {
    if (this.socket) {
      this.socket.close()
    }

    window.clearTimeout(this.timeout)
    this._handleClose()
  }
}

export default ConnectionSocket
