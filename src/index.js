import EventEmitter from 'eventemitter3'
import ClientAPI from './client/ClientAPI'
import ConnectionRTC from './client/ConnectionRTC'
import ConnectionSocket from './client/ConnectionSocket'
import getDebugger from './common/debug'
import Cookies from 'universal-cookie'

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
 * await peersox.init()
 *
 * // Request a new Pairing.
 * // If successful, the client is now connected to the PeerSox server and
 * // waiting for the joiner to connet to the server.
 * const pairing = await peersox.createPairing()
 *
 * // The pairing code the joiner will need to use.
 * console.log(pairing.code) // => "123456"
 *
 * await peersox.connect(pairing)
 * // You are now connected to the server.
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
 * await peersox.init()
 *
 * // Start pairing with the initiator.
 * const pairing = await peersox.joinPairing('123456')
 *
 * // You can now connect with the pairing.
 * await peersox.connect(pairing)
 *
 * // The pairing with the peer succeeded when the following event is emitted.
 * peersox.on('peerConnected', () => {
 *   // The client is now connected to its peer.
 *   // Let's send a message every second.
 *   interval = window.setInterval(() => {
 *     const numbers = [
 *       Math.round(Math.random() * 100),
 *       Math.round(Math.random() * 100),
 *       Math.round(Math.random() * 100)
 *     ]
 *
 *     const byteArray = new Uint8Array(numbers)
 *
 *     // Send an ArrayBuffer.
 *     peersox.send(byteArray.buffer)
 *
 *     // Send a string.
 *     peersox.send(numbers.join(';'))
 *   }, 1000)
 * })
 *
 * @class
 * @extends {external:EventEmitter}
 * @fires PeerSoxClient#connectionEstablished
 * @fires PeerSoxClient#connectionClosed
 * @fires PeerSoxClient#peerConnected
 * @fires PeerSoxClient#peerTimeout
 * @fires PeerSoxClient#peerRtcClosed
 */
class PeerSoxClient extends EventEmitter {
  /**
   * Create a new PeerSox client.
   *
   * @param {string} url The URL where the PeerSox server is reachable.
   * @param {object} options The options for the client.
   * @param {boolean} options.autoUpgrade Automatically upgrade to a WebRTC
   * connection.
   * @param {boolean} options.debug When enabled, debugging info is logged.
   * @param {object} options.simplePeerOptions Options passed to SimplePeer.
   * @param {number} options.peerTimeout How long in seconds before closing peer
   * connection.
   */
  constructor (url = 'http://localhost:3000', {
    autoUpgrade = true,
    debug = false,
    simplePeerOptions = {},
    peerTimeout = 30,
    socketServerUrl
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
      url: url + '/api'
    })

    /**
     * Manage WebSocket connection to the server.
     *
     * @member {ConnectionSocket}
     * @private
     */
    this._socket = new ConnectionSocket({
      url: socketServerUrl || url.replace(/^http/, 'ws') + '/ws',
      debug
    })

    /**
     * Manage WebRTC connection to the peer.
     *
     * @member {ConnectionRTC}
     * @private
     */
    this._rtc = new ConnectionRTC({ debug, simplePeerOptions })

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

    /**
     * Timeout timer for the WebRTC upgrade attempt.
     *
     * @member {object}
     * @private
     */
    this._upgradeTimeout = null

    /**
     * The configuration object fetched from the server.
     *
     * @member {object}
     * @private
     */
    this._config = {}

    /**
     * Duration in seconds of how long a peer connection can remain silent
     * before it is closed.
     *
     * @member {number}
     * @private
     */
    this._peerTimeout = peerTimeout

    /**
     * The cookie context of universal-cookie.
     *
     * @member {Cookies}
     * @private
     */
    this._cookies = new Cookies()

    /**
     * Store the timeout for the ping timeout.
     *
     * @member {object}
     * @private
     */
    this._pingTimeout = null

    this._addEventListeners()

    // Add a function to the global scope to retrive the client status.
    if (debug) {
      window.__PEERSOX_GET_STATUS = () => {
        return this.status
      }
    }
  }

  /**
   * Get the current status of the client.
   *
   * @returns {object}
   */
  get status () {
    return {
      isConnected: this.isConnected(),
      config: this._config,
      webSocket: this._socket.status,
      webRTC: this._rtc.status
    }
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
   * Initialize peersox by getting the config.
   *
   * @returns {Promise<object>} The config requested from the server.
   */
  init () {
    return this._requestConfig()
  }

  /**
   * Get information about the browser support of WebSocket and WebRTC.
   *
   * @returns {object}
   */
  getDeviceSupport () {
    return PeerSoxClient.SUPPORTS
  }

  /**
   * Return the current connection state.
   *
   * @returns {boolean}
   */
  isConnected () {
    return this._socket.isConnected() || this._rtc.isConnected()
  }

  /**
   * Initiate a pairing.
   *
   * The method will call the API to fetch a new Pairing, consisting of the code
   * and hash. The pairing is valid for a limited amount of time, depending on
   * the configuration done on the server side.
   *
   * The promise can be rejected when the API is not available or when too many
   * requests are made.
   *
   * @example
   * peersox.createPairing().then(pairing => {
   *   // The pairing code the joiner will need to use.
   *   // => { hash: 'xyzxyzxyz', code: '123456' }
   *   console.log(pairing)
   * })
   *
   * @returns {Promise<Pairing>} The pairing used for connecting.
   */
  createPairing () {
    return this._api.requestPairing()
  }

  /**
   * Join an initiated pairing.
   *
   * The given code is from a Pairing. It is first validated via the API and if
   * this is successful, a WebSocket connection to the server is attempted.
   *
   * @example
   * peersox.joinPairing('123456').then(pairing => {
   *   if (pairing) {
   *     // You can now connect to the server.
   *   }
   * })
   *
   * @param {number|string} code The code to validate.
   * @returns {Promise<Pairing>} The pairing to be used for connecting.
   */
  joinPairing (code) {
    return this._api.getHash(code)
  }

  /**
   * Validate a pairing.
   *
   * @example
   * peersox.validate({ code: 123456, hash: 'xyz' }).then(isValid => {
   *   // The pairing is valid.
   * })
   *
   * @param {pairing} pairing The pairing to validate.
   * @returns {Promise<boolean>} True if the pairing is valid.
   */
  validate (pairing) {
    return this._api.validate(pairing)
  }

  /**
   * Connect to the WebSocket server with the given pairing.
   *
   * This will directly attempt a connection to the WebSocket server, without
   * prior validation of the pairing. The client and server will first perform a
   * handshake, where the pairing is validated. The connection will be closed
   * immediately if the handshake fails, without emitting any of the events.
   *
   * The server will decide the role (initiator or joiner) of this client
   * depending on who was first.
   *
   * The promise can be rejected when the WebSocket server is not available,
   * when too many requests are made or when the WebSocket server refuses the
   * handshake with the fetched pairing.
   *
   * @example
   * peersox.connect({ code: 123456, hash: 'xyz' }).then(({ pairing, isInitiator }) => {
   *   // You are now connected to the server.
   *
   *   peersox.on('peerConnnected', () => {
   *     // You can now send messages to the other client.
   *   })
   * })
   *
   * @param {Pairing} pairing
   * @returns {Promise<{pairing:Pairing, isInitiator:boolean }>}
   */
  connect (pairing) {
    return this._api.getToken().then(token => this._socket.connect(pairing, token))
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
    if (!this.isConnected()) {
      return
    }

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
    return this._socket.close()
  }

  /**
   * Return the connected WebSocket socket.
   *
   * @throws Will throw an error if no WebSocket connection is made.
   * @returns {WebSocket}
   */
  getSocket () {
    if (!this._socket.isConnected()) {
      throw new Error('Socket is not connected')
    }
    return this._socket.getSocket()
  }

  /**
   * Restore a pairing.
   *
   * @returns {Promise<Pairing|null>} The restorable pairing if it exists.
   */
  restorePairing () {
    const cookie = this._cookies.get('pairing')

    if (!cookie) {
      return Promise.resolve(null)
    }

    const [code, hash] = cookie.split('_')

    if (!code || !hash) {
      this.deletePairing()
      return Promise.resolve(null)
    }

    const pairing = { code, hash }

    return this.validate(pairing).then((isValid) => {
      if (!isValid) {
        this.deletePairing()
      }
      return isValid ? pairing : null
    })
  }

  /**
   * Save the given pairing in a cookie.
   *
   * @param {Pairing} pairing The pairing to save.
   */
  storePairing (pairing) {
    this._cookies.set('pairing', `${pairing.code}_${pairing.hash}`, { path: '/' })
  }

  /**
   * Delete all pairing cookies.
   */
  deletePairing () {
    this._cookies.remove('pairing')
  }

  /**
   * Delete the PeerSox instance.
   *
   * Closes all open connections and removes event listeners.
   */
  destroy () {
    this._socket.close()
    this._rtc.close()
    this._removeEventListeners()
  }

  /**
   * Handle when a connection to the WebSocket server is established.
   *
   * @private
   * @param {any} data
   */
  _handleConnectionEstablished (data) {
    this.emit(PeerSoxClient.EVENT_CONNECTION_ESTABLISHED, data)
  }

  /**
   * Handle the closing of a connection.
   *
   * @private
   * @param {string} connection The context name of the connection.
   */
  _handleConnnectionClosed (connection) {
    if (connection === 'WebRTC') {
      this.emit(PeerSoxClient.EVENT_PEER_WEBRTC_CLOSED)
    }

    if (!this._rtc.isConnected() && !this._socket.isConnected()) {
      this.emit(PeerSoxClient.EVENT_CONNECTION_CLOSED)
      window.clearTimeout(this._pingTimeout)
    }
  }

  /**
   * Handle the establishment of a peer connection.
   *
   * @private
   * @param {object} data
   */
  _handlePeerConnected (data) {
    const isInitiator = data.isInitiator === true
    this.emit(PeerSoxClient.EVENT_PEER_CONNECTED, data)

    if (this._autoUpgrade) {
      // Wait a second before initializing WebRTC.
      window.clearTimeout(this._upgradeTimeout)

      this._upgradeTimeout = window.setTimeout(() => {
        this.upgrade(isInitiator)
      }, 1000)
    }
  }

  /**
   * Add event listeners to both Connection instances.
   *
   * @private
   */
  _addEventListeners () {
    this._socket.on(ConnectionSocket.EVENT_ESTABLISHED, this._handleConnectionEstablished.bind(this))
    this._socket.on(ConnectionSocket.EVENT_CLOSED, this._handleConnnectionClosed.bind(this))
    this._socket.on(ConnectionSocket.EVENT_PEER_CONNECTED, this._handlePeerConnected.bind(this))
    this._socket.on(ConnectionSocket.EVENT_PEER_PING, this._handlePingMessage.bind(this))
    this._socket.on(ConnectionSocket.EVENT_PEER_SIGNAL, (signal) => this._rtc.signal(signal))
    this._rtc.on(ConnectionRTC.EVENT_RTC_SIGNAL, (signal) => this._socket.sendSignal(signal))
    this._rtc.on(ConnectionRTC.EVENT_PEER_PING, this._handlePingMessage.bind(this))
    this._rtc.on(ConnectionRTC.EVENT_CLOSED, this._handleConnnectionClosed.bind(this))
  }

  /**
   * Remove all attached event listeners from the connection instances.
   *
   * @private
   */
  _removeEventListeners () {
    this._socket.removeAllListeners(ConnectionSocket.EVENT_ESTABLISHED)
    this._socket.removeAllListeners(ConnectionSocket.EVENT_CLOSED)
    this._socket.removeAllListeners(ConnectionSocket.EVENT_PEER_CONNECTED)
    this._socket.removeAllListeners(ConnectionSocket.EVENT_PEER_PING)
    this._socket.removeAllListeners(ConnectionSocket.EVENT_PEER_SIGNAL)
    this._rtc.removeAllListeners(ConnectionRTC.EVENT_RTC_SIGNAL)
    this._rtc.removeAllListeners(ConnectionRTC.EVENT_PEER_PING)
    this._rtc.removeAllListeners(ConnectionRTC.EVENT_CLOSED)
  }

  /**
   * Request the config from the server.
   *
   * @private
   */
  _requestConfig () {
    return this._api.requestConfig().then(config => {
      this._config = config
      this._rtc.updateIceServers(config.iceServers)
      this.emit(PeerSoxClient.EVENT_SERVER_READY)
    })
  }

  /**
   * Handle incomming ping messages via WebSocket or WebRTC.
   *
   * @private
   */
  _handlePingMessage () {
    window.clearTimeout(this._pingTimeout)

    if (this.isConnected()) {
      this._pingTimeout = window.setTimeout(() => {
        this.emit(PeerSoxClient.EVENT_PEER_TIMEOUT)
        this._rtc.close()
        this._socket.close()
      }, this._peerTimeout * 1000)
    }
  }
}

/**
 * Config was requested from the server and a connection can be established.
 *
 * @event PeerSoxClient#serverReady
 */

/**
 * @member
 * @type {string}
 */
PeerSoxClient.EVENT_SERVER_READY = 'serverReady'

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

/**
 * The peer connection has timed out.
 *
 * @member
 * @event PeerSoxClient#peerTimeout
 * @type {number}
 */

/**
 * @member
 * @type {string}
 */
PeerSoxClient.EVENT_PEER_TIMEOUT = 'peerTimeout'

/**
 * The WebRTC connection to the peer closed.
 *
 * @member
 * @event PeerSoxClient#peerRtcClosed
 * @type {Pairing}
 */

/**
 * The peer connection via WebRTC has closed.
 *
 * The connection might still be available via WebSocket.
 * @member
 * @type {string}
 */
PeerSoxClient.EVENT_PEER_WEBRTC_CLOSED = 'peerRtcClosed'

/**
 * An object containing
 * @member
 * @type {object} SUPPORTS
 * @property {boolean} SUPPORTS.WEBSOCKET
 * @property {boolean} SUPPORTS.WEBRTC
 */
PeerSoxClient.SUPPORTS = {
  WEBSOCKET: ConnectionSocket.IS_SUPPORTED,
  WEBRTC: ConnectionRTC.IS_SUPPORTED
}

export default PeerSoxClient
