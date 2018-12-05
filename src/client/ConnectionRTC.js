import SimplePeer from 'simple-peer'
import Connection from './Connection'

/**
 * Default options for SimplePeer.
 *
 * @type {object}
 */
const SIMPLE_PEER_OPTIONS = {
  reconnectTimer: 200,
  iceTransportPolicy: 'relay',
  trickle: true,
  allowHalfTrickle: true,
  iceCompleteTimeout: 10000,
  config: {
    iceServers: []
  }
}

/**
 * A WebRTC/WebSocket peer connection.
 *
 * @extends Connection
 */
class ConnectionRTC extends Connection {
  /**
   * @param {object} settings
   * @param {boolean} settings.debug
   * @param {object} settings.simplePeerOptions Options passed to SimplePeer.
   */
  constructor ({
    debug = false,
    simplePeerOptions = {}
  } = {}) {
    super(debug, 'WebRTC')

    this.peer = null

    this._simplePeerOptions = { ...SIMPLE_PEER_OPTIONS, ...simplePeerOptions }
  }

  /**
   * Get the current status of the WebRTC connection.
   *
   * @returns {object}
   */
  get status () {
    return {
      peer: this.peer,
      simplePeerOptions: this._simplePeerOptions,
      isConnected: this.isConnected()
    }
  }

  /**
   * Return whether WebRTC is supported by the browser.
   *
   * @returns {Boolean} WebRTC is supported.
   */
  isSupported () {
    return SimplePeer.WEBRTC_SUPPORT
  }

  /**
   * Initiate a WebRTC connection.
   *
   * The isInitiator flag decides if this client will gather signaling data and
   * send it via WebSockets to the peer.
   *
   * @param {boolean} isInitiator Whether this should be the initiating client.
   */
  connect (isInitiator) {
    // Prevent connecting a second time.
    if (this.isConnected()) {
      this._handleAlreadyConnected()
      return
    }

    // Initialize SimplePeer for WebRTC connections.
    const options = {
      ...this._simplePeerOptions,
      initiator: isInitiator,
      objectMode: true
    }
    this.peer = new SimplePeer(options)

    // Add event listeners for the WebRTC connection.
    this.peer.on('connect', this._handleConnected.bind(this))
    this.peer.on('error', this.onError.bind(this))
    this.peer.on('signal', this.onSignal.bind(this))
    this.peer.on('data', this._handleIncomingMessage.bind(this))
    this.peer.on('close', this._handleClose.bind(this))
  }

  /**
   * Handle errors thrown by SimplePeer.
   *
   * @param {error} error The error.
   */
  onError (error) {
    this._handleError(error)
  }

  /**
   * Handle signaling data emitted from SimplePeer.
   *
   * @param {object} signal The signaling data.
   */
  onSignal (signal) {
    this._debug('Signal - Sending', signal)
    this.emit('rtc.signal', signal)
  }

  /**
   * Send data to the connected peer.
   *
   * @param {String|ArrayBuffer} data The data to send to the connected peer.
   */
  send (data) {
    this.peer.send(data)
  }

  /**
   * Pass the given signaling data from the peer to this instance so that a
   * connection can be established.
   *
   * @param {object} signal The signaling data from the peer.
   */
  signal (signal) {
    this.peer.signal(signal)
    this._debug('Signal - Receiving', signal)
  }

  /**
   * Close the connection to the peer.
   */
  close () {
    if (!this.isConnected()) {
      this._debug('Info', 'Not connected, can not close connection')
      return
    }

    this.peer.destroy()
  }

  /**
   * Set the list of ICE servers for WebRTC.
   *
   * @param {array} servers The list of ICE servers.
   */
  updateIceServers (servers) {
    this._simplePeerOptions.config.iceServers = servers
  }
}

ConnectionRTC.EVENT_RTC_SIGNAL = 'rtc.signal'

export default ConnectionRTC
