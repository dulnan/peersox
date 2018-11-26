import EventEmitter from 'eventemitter3'
import http from 'axios'
import ClientAPI from './client/ClientAPI'
import ConnectionRTC from './client/ConnectionRTC'
import ConnectionSocket from './client/ConnectionSocket'
import getDebugger from './common/debug'

/**
 * @external EventEmitter
 * @see {@link https://github.com/primus/eventemitter3 EventEmitter}
 */

/**
 * The client pairs another client via the server.
 *
 * A running PeerSox server is required for pairing – two clients can't pair
 * with eachother without a server.
 *
 * Usage is different between the initiator (the one to request a pairing code)
 * and the joiner (the one to validate a pairing code).
 *
 * @example <caption>The initiator</caption>
 * // Create a new client.
 * let peersox = new PeerSoxClient({
 *   url: 'http://localhost:3000',
 *   debug: true
 * })
 *
 * // Request a new Pairing.
 * // If successful, the client is now connected to the PeerSox server and
 * // waiting for the joiner to connet to the server.
 * peersox.initiate().then(pairing => {
 *   // The pairing code the joiner will need to use.
 *   console.log(pairing.code) // => "123456"
 * })
 *
 * // Once the joiner (the peer of this client) is connected, we can start
 * // listening for incoming messages.
 * peersox.on('peerConnected', () => {
 *   // Receive binary data (e.g. ArrayBuffer).
 *   peersox.onBinary = (data) => {
 *     const buffer = new Uint8Array(data);
 *     console.log(buffer)
 *   }
 *
 *   // Receive string data.
 *   peersox.onString = (data) => {
 *     console.log(data)
 *   }
 * })
 *
 * @example <caption>The joiner</caption>
 * // Create a new client.
 * let peersox = new PeerSoxClient({
 *   url: 'http://localhost:3000',
 *   debug: true
 * })
 *
 * // Start pairing with the initiator.
 * peersox.join('123456').then(status => {
 *   // The client is now connected with the server.
 *
 *   // The pairing succeeded when the following event is emitted.
 *   peersox.on('peerConnected', () => {
 *     // The client is now connected to its peer.
 *     // Let's send a message every second.
 *     interval = window.setInterval(() => {
 *       const numbers = [
 *         Math.round(Math.random() * 100),
 *         Math.round(Math.random() * 100),
 *         Math.round(Math.random() * 100)
 *       ]
 *
 *       const byteArray = new Uint8Array(numbers)
 *
 *       // Send an ArrayBuffer.
 *       peersox.send(byteArray.buffer)
 *
 *       // Send a string.
 *       peersox.send(numbers.join(';'))
 *     }, 1000)
 *   })
 * })
 *
 * @class
 * @extends {external:EventEmitter}
 * @fires PeerSoxClient#connectionEstablished
 * @fires PeerSoxClient#connectionClosed
 * @fires PeerSoxClient#peerConnected
 */
class PeerSoxClient extends EventEmitter {
  /**
   * Create a new PeerSox client.
   *
   * @param {object} options The options for the client.
   * @param {string} options.url The URL where the PeerSox server is reachable.
   * @param {boolean} options.autoUpgrade Automatically upgrade to a WebRTC connection.
   * @param {boolean} options.debug When enabled, debugging info is logged.
   */
  constructor ({
    url = 'http://localhost:3000',
    autoUpgrade = true,
    debug = false
  } = {}) {
    super()

    /**
     * Makes requests to the PeerSox REST API server.
     *
     * @member {ClientAPI}
     * @private
     */
    this._api = new ClientAPI({
      debug,
      http,
      url: url + '/api'
    })

    /**
     * Manage WebSocket connection to the server.
     *
     * @member {ConnectionSocket}
     * @private
     */
    this._socket = new ConnectionSocket({
      url: url.replace(/^http/, 'ws') + '/ws',
      debug
    })

    /**
     * Manage WebRTC connection to the peer.
     *
     * @member {ConnectionRTC}
     * @private
     */
    this._rtc = new ConnectionRTC({ debug })

    /**
     * Logs debugging messages to the console.
     *
     * @member {function}
     * @private
     */
    this._debug = getDebugger(debug, 'PeerSoxClient')

    /**
     * @member {boolean}
     * @private
     */
    this._autoUpgrade = autoUpgrade

    this._addEventListeners()
  }

  /**
   * Set the handler function for incoming binary data.
   *
   * @param {function}
   */
  set onBinary (fn) {
    this._socket._onBinary = fn
    this._rtc._onBinary = fn
  }

  /**
   * Set the handler function for incoming string data.
   *
   * @param {function}
   */
  set onString (fn) {
    this._socket._onString = fn
    this._rtc._onString = fn
  }

  /**
   * Initiate a pairing.
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
   * @example
   * peersox.initiate().then(pairing => {
   *   // The pairing code the joiner will need to use.
   *   // => { hash: 'xyzxyzxyz', code: '123456' }
   *   console.log(pairing)
   * })
   *
   * @returns {Promise<Pairing>} The pairing used for connecting.
   */
  initiate () {
    if (this._socket.isConnected()) {
      return Promise.reject(new Error('Socket already connected'))
    }

    return this._api.requestPairing().then(this._connectSocket.bind(this))
  }

  /**
   * Join an initiated pairing.
   *
   * The given code is from a Pairing. It is first validated via the API and if
   * this is successful, a WebSocket connection to the server is attempted.
   *
   * @example
   * peersox.join('123456').then(status => {
   *   // The client is now connected with the server.
   *
   *   peersox.on('peerConnected', () => {
   *     // The peer is now connected.
   *   })
   * })
   *
   * @param {number|string} code The code to validate.
   * @returns {Promise<Pairing>} The pairing to be used for connecting.
   */
  join (code) {
    if (this._socket.isConnected()) {
      return Promise.reject(new Error('Socket already connected'))
    }

    return this._api.getHash(code).then(this._connectSocket.bind(this))
  }

  /**
   * Connect to the WebSocket server given the pairing.
   *
   * @param {Pairing} pairing
   * @private
   */
  _connectSocket (pairing) {
    return this._socket.connect(pairing)
  }

  /**
   * Send data to the peer.
   *
   * It's possible to send either string or binary data. Performance is likely
   * to be better when sending binary data, for example an ArrayBuffer.
   *
   * This method will not perform any checks on the validity or compatibility of
   * the given data's type with WebSocket or WebRTC.
   *
   * @example <caption>Sending binary data</caption>
   * const numbers = [
   *   Math.round(Math.random() * 100),
   *   Math.round(Math.random() * 100),
   *   Math.round(Math.random() * 100)
   * ]
   * const byteArray = new Uint8Array(numbers)
   * peersox.send(byteArray.buffer)
   *
   * @example <caption>Sending a string</caption>
   * peersox.send('This is my message.')
   *
   * @example <caption>Sending an object</caption>
   * // It's not possible to send objects directly. You need to stringify it and
   * // send it as a string.
   * const payload = {
   *   name: 'ping',
   *   data: Date.now()
   * }
   * const message = JSON.stringify(payload)
   * peersox.send(message)
   *
   * @param {string|ArrayBuffer} data The data to send to the peer.
   */
  send (data) {
    if (this._rtc.isConnected()) {
      this._rtc.send(data)
    } else {
      this._socket.send(data)
    }
  }

  /**
   * Upgrade the connection to WebRTC.
   *
   * Call this method when you disabled automatic upgrading.
   *
   * @param {boolean} isInitiator Whether this client is initiating.
   */
  upgrade (isInitiator) {
    this._rtc.connect(isInitiator)
  }

  /**
   * Close all connections and attempt to disconnect the peer.
   */
  close () {
    this._rtc.close()
    this._socket.close()
  }

  /**
   * Add event listeners to both Connection instances.
   *
   * @private
   */
  _addEventListeners () {
    // Pass the events to the parent.
    this._socket.on('connection.established', (data) => {
      this.emit(PeerSoxClient.EVENT_CONNECTION_ESTABLISHED, data)
    })

    this._socket.on('connection.closed', () => {
      this._rtc.close()
      this.emit(PeerSoxClient.EVENT_CONNECTION_CLOSED)
    })

    // If this client is connected to a peer, try to upgrade the connection.
    this._socket.on('peer.connected', (data) => {
      this.emit(PeerSoxClient.EVENT_PEER_CONNECTED, data)

      if (this._autoUpgrade) {
        this.upgrade(data.isInitiator)
      }
    })

    // Pass the signaling data from the peer to this client.
    this._socket.on('peer.signal', (signal) => {
      this._rtc.signal(signal)
    })

    // Send the signaling data from this client to the peer.
    this._rtc.on('rtc.signal', (signal) => {
      this._socket.sendSignal(signal)
    })

    this._rtc.on('connection.closed', () => {
    })
  }
}

/**
 * A connection to the server has been established.
 *
 * @event PeerSoxClient#connectionEstablished
 * @type {Pairing}
 */

/**
 * @member
 * @type {string}
 */
PeerSoxClient.EVENT_CONNECTION_ESTABLISHED = 'connectionEstablished'

/**
 * The connection to the server has been closed.
 *
 * @event PeerSoxClient#connectionClosed
 */

/**
 * @member
 * @type {string}
 */
PeerSoxClient.EVENT_CONNECTION_CLOSED = 'connectionClosed'

/**
 * The peer is connected to this client.
 *
 * @member
 * @event PeerSoxClient#peerConnected
 * @type {Pairing}
 */

/**
 * @member
 * @type {string}
 */
PeerSoxClient.EVENT_PEER_CONNECTED = 'peerConnected'

export default PeerSoxClient
