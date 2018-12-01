import { encode, decode } from '../common/dataparser'
import { INTERNAL_MESSAGE_PREFIX, HANDSHAKE_SUCCESS, HANDSHAKE_FAILED } from '../common/settings'

import { Server as WebSocketServer } from 'ws'

require('util').inspect.defaultOptions.depth = 0

export default class Socket {
  constructor ({ server, store }) {
    this.store = store

    this.socketserver = new WebSocketServer({
      server: server,
      path: '/ws'
    })

    this.messageHandlers = {
      'client.register': this.onMessageRegister.bind(this),
      data: this.onMessageData.bind(this)
    }

    this.socketserver.on('connection', this.onConnection.bind(this))

    this.connections = {}
  }

  onMessageClose (client) {
    let hash = ''
    if (client._pairing && typeof client._pairing === 'object') {
      hash = client._pairing.hash
    }

    if (client._peer && client._peer._pairing && typeof client._peer._pairing === 'object') {
      hash = client._peer._pairing.hash
    }

    this.connections[hash] = null

    if (client._peer) {
      if (client._peer.readyState === 1) {
        client._peer.close()
      }
    }

    if (client.readyState === 1) {
      client.close()
    }
  }

  async onMessageRegister (client, pairing) {
    const isValid = await this.store.validatePairing(pairing)

    if (!isValid) {
      client.send(HANDSHAKE_FAILED)
      client.close()
      return
    }

    client.send(HANDSHAKE_SUCCESS)

    if (this.connections[pairing.hash]) {
      const peer = this.connections[pairing.hash]
      peer._pairing = pairing
      peer._peer = client
      client._peer = peer

      this.sendInternalEvent(client, 'peer.connected', { isInitiator: false, pairing })
      this.sendInternalEvent(peer, 'peer.connected', { isInitiator: true, pairing })
    } else {
      client._pairing = pairing
      this.connections[pairing.hash] = client
    }
  }

  sendInternalEvent (client, eventName, data = {}) {
    if (client.readyState === 1) {
      client.send(INTERNAL_MESSAGE_PREFIX + encode(eventName, data))
    }
  }

  onMessageData (client, data) {
    client._peer.send(data)
  }

  onConnection (client) {
    client.on('close', (closed) => {
      this.onMessageClose(client)
    })
    client.on('message', messageRaw => {
      // Close the connection if the peer connection has closed.
      if (client._peer && client._peer.readyState === 3) {
        client.close()
        return
      }

      if (typeof messageRaw === 'string' && messageRaw.charAt(0) === INTERNAL_MESSAGE_PREFIX) {
        // Handle the case when it's an internal string message.
        const message = decode(messageRaw.substring(1))

        if (message && this.messageHandlers[message.name]) {
          this.messageHandlers[message.name].call(this, client, message.data)
          return
        }
      }

      // Directly send the message to the peer if its connected.
      if (client._peer && client._peer.readyState === 1) {
        client._peer.send(messageRaw)
      }
    })
  }
}
