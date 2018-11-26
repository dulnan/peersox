import express from 'express'
import http from 'http'
import Store from './Store.js'
import API from './API.js'
import Socket from './Socket.js'

/**
 * The PeerSox server class.
 *
 * The server manages the generation and validation of pairing codes and hashes.
 * They are stored in redis, for local development redis-mock is used.
 *
 * Generated Pairings are only valid for a short amount of time. If they are not
 * validated in that time slot, they are deleted. If they are validated, the
 * code is removed from redis, while the hash's expire time is increased.
 *
 * @class
 * @module server
 */
export class PeerSoxServer {
  /**
   * @param {object} options
   * @param {object} options.app An existing express app.
   * @param {object} options.server An existing http server.
   * @param {object} options.storage The storage client to use for the store.
   * @param {number} options.port The port on which the server should run.
   * @param {array} options.middleware Additional middleware for use in express.
   */
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
