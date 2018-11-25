/**
 * drawmote server
 *
 * The server manages the generation and validation of pairing codes and hashes.
 * They are stored in redis, for local development redis-mock is used.
 *
 * Generated Pairings are only valid for a short amount of time. If they are not
 * validated in that time slot, they are deleted. If they are validated, the code
 * is removed from redis, while the hash's expire time is increased.
 */
import express from 'express'
import http from 'http'
import getRedisClient from './utils/storage'
import Store from './classes/Store.js'
import API from './classes/API.js'
import Socket from './classes/Socket.js'

class PeerSoxServer {
  constructor ({
    app = express(),
    server,
    storage,
    port = process.env.PORT || 3000,
    middleware = []
  } = {}) {
    this.store = new Store(storage)
    this.server = server || http.createServer(app)

    this.api = new API({
      store: this.store,
      app,
      server: this.server,
      port,
      middleware
    })

    this.socket = new Socket({
      store: this.store,
      port,
      server: this.server
    })
  }
}

export {
  getRedisClient,
  PeerSoxServer
}
