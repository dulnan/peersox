import EventEmitter from 'eventemitter3'
import getDebugger from './../common/debug'
import { encode, decode } from './../common/dataparser'
import { INTERNAL_MESSAGE_PREFIX } from './../common/settings'

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
    connection.send(INTERNAL_MESSAGE_PREFIX + encode(eventName, data))
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
      } else {
        this._onString(data)
      }
    } else {
      this._onBinary(data)
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
    this._isConnected = true
    this.emit('connection.established')
    this._debug('info', 'Connection established')
  }

  /**
   * Handle the closing of a connection.
   */
  _handleClose () {
    this._isConnected = false
    this.emit('connection.closed')
    this._debug('info', 'Connection closed')
  }

  /**
   * Handle the case when the connection is already established.
   */
  _handleAlreadyConnected () {
    this._debug('info', 'Connection already established')
  }
}

export default Connection
