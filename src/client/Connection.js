import EventEmitter from 'eventemitter3'
import getDebugger from './../common/debug'
import { encode, decode } from './../common/dataparser'
import { INTERNAL_MESSAGE_PREFIX, PING } from './../common/settings'

/**
 * The base Connection class.
 *
 * @extends EventEmitter
 */
class Connection extends EventEmitter {
  /**
   *
   * @param {boolean} debug Enable debug logging.
   * @param {string} context The context for use in debugging.
   */
  constructor (debug, context) {
    super()

    this._isConnected = false
    this._debug = getDebugger(debug, context)
    this._context = context

    this._pingInterval = null

    // Attach debug logging function to onBinary and onString. They must be
    // overwritten by the consumer of this library.
    this._onBinary = () => {
      this._debug('Connection', 'No handler for onBinary event defined.')
    }
    this._onString = () => {
      this._debug('Connection', 'No handler for onString event defined.')
    }
  }

  /**
   * Build and send an event used for SimplePeer internally.
   *
   * @param {string} eventName The name of the event.
   * @param {object|string|array|number} data The data of the event.
   * @param {WebSocket|SimplePeer} connection The connection to send the event on.
   */
  sendInternalEvent (eventName, data, connection) {
    const message = encode(eventName, data)
    connection.send(INTERNAL_MESSAGE_PREFIX + message)
  }

  /**
   * Returns whether the connection is established or not.
   *
   * @returns {Boolean}
   */
  isConnected () {
    return this._isConnected
  }

  /**
   * Handles an incoming message from either WebSocket or WebRTC.
   *
   * Messages containing internal events are emitted from this instance. If the
   * message is binary (an ArrayBuffer), it is directly passed to the onBinary
   * handler.
   *
   * @param {string|ArrayBuffer} data The data from the message.
   */
  _handleIncomingMessage (data) {
    if (typeof data === 'string') {
      if (data.charAt(0) === INTERNAL_MESSAGE_PREFIX) {
        const message = decode(data.substring(1))
        this.emit(message.name, message.data)
      } else if (data === PING) {
        this.emit('peer.ping', Date.now())
      } else {
        this._onString(data)
      }
    } else {
      if (data instanceof ArrayBuffer) {
        this._onBinary(data)
      } else if (data.buffer) {
        this._onBinary(data.buffer)
      }
    }
  }

  /**
   * Handles errors thrown by the connections.
   *
   * @param {Error} error The thrown error.
   */
  _handleError (error) {
    this.emit('connection.error', error)
    this._debug('error', error)
  }

  /**
   * Handle the establishing of a connection.
   */
  _handleConnected () {
    window.clearInterval(this._pingInterval)

    this._isConnected = true
    this.emit('connection.established')
    this._debug('info', 'Connection established')

    this._pingInterval = window.setInterval(() => {
      this.send(PING)
    }, 20000)
  }

  /**
   * Handle the closing of a connection.
   */
  _handleClose () {
    this._isConnected = false
    this.emit('connection.closed', this._context)
    this._debug('info', 'Connection closed')

    window.clearInterval(this._pingInterval)
  }

  /**
   * Handle the case when the connection is already established.
   */
  _handleAlreadyConnected () {
    this._debug('info', 'Connection already established')
  }
}

Connection.EVENT_ESTABLISHED = 'connection.established'
Connection.EVENT_CLOSED = 'connection.closed'
Connection.EVENT_PEER_CONNECTED = 'peer.connected'
Connection.EVENT_PEER_SIGNAL = 'peer.signal'
Connection.EVENT_PEER_PING = 'peer.ping'

export default Connection
