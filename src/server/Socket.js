import { encode, decode } from '../common/dataparser'
import { INTERNAL_MESSAGE_PREFIX, HANDSHAKE_SUCCESS, HANDSHAKE_FAILED } from '../common/settings'

import WebSocket, { Server as WebSocketServer } from 'ws'

require('util').inspect.defaultOptions.depth = 0

export default class Socket {
  constructor ({ server, store, allowOrigins } = {}) {
    this.store = store

    this.allowOrigins = {}
    allowOrigins.forEach(v => {
      this.allowOrigins[v] = true
    })

    this.socketserver = new WebSocketServer({
      server: server,
      path: '/ws',
      verifyClient: async ({ origin, req }) => {
        if (this.allowOrigins.length > 0 && !this.allowOrigins.hasOwnProperty(origin)) {
          return false
        }

        const token = req.headers['sec-websocket-protocol']
        const isValid = await this.store.validateToken(token)

        return isValid
      }
    })

    this.messageHandlers = {
      'client.register': this.onMessageRegister.bind(this),
      data: this.onMessageData.bind(this)
    }

    this.socketserver.on('connection', this.onConnection.bind(this))

    this.connections = {}
    this.lobby = {}

    setInterval(() => {
      this.garbageCollector(this.connections)
      this.garbageCollector(this.lobby)
    }, 60 * 1000)
  }

  garbageCollector (hashMap) {
    Object.keys(hashMap).forEach(key => {
      if (hashMap[key] === null) {
        delete hashMap[key]
      }
    })
  }

  onMessageClose (client) {
    this.cleanup(client)
  }

  closeClient (client) {
    if (client && client.readyState === WebSocket.OPEN) {
      client.close()
    }
  }

  getHashFromClient (client, secondTry) {
    if (client && client._pairing && client._pairing.hash) {
      return client._pairing.hash
    }

    if (client && client._peer && !secondTry) {
      return this.getHashFromClient(client._peer, true)
    }
  }

  cleanup (client, hashStr) {
    let hash = this.getHashFromClient(client) || hashStr

    if (hash) {
      if (this.connections[hash]) {
        this.connections[hash] = null
      }
      if (this.lobby[hash]) {
        this.lobby[hash] = null
      }
    }

    if (client && client._peer) {
      this.closeClient(client._peer)
    }

    this.closeClient(client)
  }

  async onMessageRegister (client, pairing) {
    const isValid = await this.store.validatePairing(pairing)
    const hash = pairing && typeof pairing === 'object' ? pairing.hash : null

    if (!isValid) {
      client.send(HANDSHAKE_FAILED)
      this.cleanup(client, hash)
      return
    }

    client.send(HANDSHAKE_SUCCESS)

    client.binaryType = 'arraybuffer'

    if (this.lobby[hash]) {
      const peer = this.lobby[hash]
      this.lobby[hash] = null

      peer._pairing = pairing
      peer._peer = client
      client._peer = peer

      this.connections[hash] = {
        initiator: peer,
        joiner: client
      }

      this.sendInternalEvent(client, 'peer.connected', { isInitiator: false, pairing })
      this.sendInternalEvent(peer, 'peer.connected', { isInitiator: true, pairing })
    } else {
      client._pairing = pairing
      this.lobby[hash] = client
    }
  }

  sendInternalEvent (client, eventName, data = {}) {
    if (client && client.readyState === 1) {
      client.send(INTERNAL_MESSAGE_PREFIX + encode(eventName, data))
    }
  }

  onMessageData (client, data) {
    if (client && client._peer && client._peer.readyState === 1) {
      client._peer.send(data)
    }
  }

  /**
   * @param {WebSocket} client The WebSocket client.
   */
  onConnection (client) {
    client.on('close', () => {
      this.onMessageClose(client)
    })
    client.on('message', messageRaw => {
      // Close the connection if the peer connection has closed.
      if (client && client._peer && client._peer.readyState === 3) {
        this.cleanup(client)
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
