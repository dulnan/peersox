import { encode, decode } from '../common/dataparser'
import { INTERNAL_MESSAGE_PREFIX, HANDSHAKE_SUCCESS, HANDSHAKE_FAILED } from '../common/settings'

import { Server as WebSocketServer } from 'ws'

// const nodeEnv = process.env.NODE_ENV || 'development'

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

  async onMessageRegister (client, pairing) {
    const { isValid } = await this.store.validatePairing(pairing)

    if (!isValid) {
      client.send(HANDSHAKE_FAILED)
      client.close()
      return
    }

    client.send(HANDSHAKE_SUCCESS)

    if (this.connections[pairing.hash]) {
      const peer = this.connections[pairing.hash]

      client._peer = peer
      peer._peer = client

      this.sendInternalEvent(client, 'peer.connected', { isInitiator: false })
      this.sendInternalEvent(peer, 'peer.connected', { isInitiator: true })
    } else {
      this.connections[pairing.hash] = client
    }
  }

  sendInternalEvent (client, eventName, data = {}) {
    client.send(INTERNAL_MESSAGE_PREFIX + encode(eventName, data))
  }

  onMessageData (client, data) {
    client._peer.send(data)
  }

  onConnection (client) {
    client.on('message', (messageRaw) => {
      // Close the connection if the peer connection has closed.
      if (client._peer && client._peer.readyState === 3) {
        client.close()
        return
      }

      // Directly send the message to the peer if its connected when:
      // - the message is binary
      // - it's not an internal message
      if (client._peer && (typeof messageRaw !== 'string' || messageRaw.charAt(0) !== INTERNAL_MESSAGE_PREFIX)) {
        client._peer.send(messageRaw)
        return
      }

      // Handle the case when it's an internal string message.
      const message = decode(messageRaw.substring(1))

      if (this.messageHandlers[message.name]) {
        this.messageHandlers[message.name].call(this, client, message.data)
        return
      }

      client._peer.send(messageRaw)
    })
  }
}
