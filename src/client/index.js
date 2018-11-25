import EventEmitter from 'eventemitter3'
import http from 'axios'
import API from './classes/API'
import ConnectionRTC from './classes/ConnectionRTC'
import ConnectionSocket from './classes/ConnectionSocket'
import getDebugger from '../utils/debug'

/**
 * A WebRTC/WebSocket peer connection.
 */
export default class PeerSoxClient extends EventEmitter {
  constructor ({
    url = 'http://localhost:3000',
    debug = false
  } = {}) {
    super()

    this.api = new API({
      debug,
      http,
      url: url + '/api'
    })

    this.socket = new ConnectionSocket({
      url: url.replace(/^http/, 'ws') + '/ws',
      debug
    })

    this.rtc = new ConnectionRTC({ debug })
    this.debug = getDebugger(debug, 'PeerSoxClient')

    this._addEventListeners()
  }

  /**
   * Set the handler function for incoming binary data.
   *
   * @param {function}
   */
  set onBinary (fn) {
    this.socket._onBinary = fn
    this.rtc._onBinary = fn
  }

  /**
   * Set the handler function for incoming string data.
   *
   * @param {function}
   */
  set onString (fn) {
    this.socket._onString = fn
    this.rtc._onString = fn
  }

  /**
   * Initialize pairing.
   *
   * The method will call the API to fetch a new Pairing, consisting of the code
   * and hash. If this is successful, it will try to establish a WebSocket
   * connection with this pairing. If this is successful, the promise is
   * resolved with this Pairing.
   *
   * The promise can be rejected when the API and/or WebSocket server is not
   * available, when too many requests are made or when the WebSocket server
   * refuses the handshake with the fetched pairing.
   *
   * @returns {Promise<Pairing>} The pairing used for connecting.
   */
  initPairing () {
    if (this.socket.isConnected()) {
      this.socket._handleAlreadyConnected()
      return new Error('Socket already connected')
    }

    return this.api.requestPairing()
      .then(this._connectSocket.bind(this))
      .catch(error => {
        return error
      })
  }

  /**
   * Pair this client with a peer.
   *
   * The given code is from a Pairing. It is first validated via the API and if
   * this is successful, a WebSocket connection is attempted.
   *
   * @param {number|string} code The code to validate.
   * @returns {Promise<Pairing>} The pairing to be used for connecting.
   */
  pair (code) {
    if (this.socket.isConnected()) {
      return new Error('Socket already connected')
    }

    return this.api.getHash(code)
      .then(this._connectSocket.bind(this))
      .catch((error) => {
        return error
      })
  }

  _connectSocket (pairing) {
    return this.socket.connect(pairing).then(pairing => {
      return pairing
    }).catch(error => {
      return error
    })
  }

  /**
   * Send data to the peer.
   *
   * @param {string|ArrayBuffer} data The data to send to the peer.
   */
  send (data) {
    if (this.rtc.isConnected()) {
      this.rtc.send(data)
    } else {
      this.socket.send(data)
    }
  }

  /**
   * Upgrade the connection to WebRTC.
   *
   * @param {boolean} isInitiator Whether this client is initiating.
   */
  upgrade (isInitiator) {
    this.rtc.connect(isInitiator)
  }

  /**
   * Close all connections.
   */
  close () {
    this.rtc.close()
    this.socket.close()
  }

  /**
   * Add event listeners to both Connection instances.
   */
  _addEventListeners () {
    // Pass the events to the parent.
    this.socket.on('connection.established', (data) => {
      this.emit('connection.established', data)
    })

    this.socket.on('connection.closed', () => {
      this.emit('connection.closed')
    })

    // If this client is connected to a peer, try to upgrade the connection.
    this.socket.on('peer.connected', (data) => {
      this.emit('peer.connected', data)
      this.upgrade(data.isInitiator)
    })

    // Pass the signaling data from the peer to this client.
    this.socket.on('peer.signal', (signal) => {
      this.rtc.signal(signal)
    })

    // Send the signaling data from this client to the peer.
    this.rtc.on('rtc.signal', (signal) => {
      this.socket.sendSignal(signal)
    })
  }
}
