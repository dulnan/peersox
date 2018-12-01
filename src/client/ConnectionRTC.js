import SimplePeer from 'simple-peer'
import Connection from './Connection'

/**
 * A WebRTC/WebSocket peer connection.
 *
 * @extends Connection
 */
class ConnectionRTC extends Connection {
  constructor ({
    debug = false
  } = {}) {
    super(debug, 'WebRTC')

    this.peer = null
  }

  get status () {
    return {
      peer: this.peer
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
    this.peer = new SimplePeer({
      initiator: isInitiator,
      objectMode: true
    })

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
    if (this.isConnected()) {
      return
    }

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
  }

  close () {
    if (!this.isConnected()) {
      this._debug('Info', 'Not connected, can not close connection')
      return
    }

    this.peer.destroy()
  }
}

export default ConnectionRTC
