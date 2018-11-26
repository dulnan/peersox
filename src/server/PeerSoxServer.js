import express from 'express'
import http from 'http'
import redisMock from 'redis-mock'
import Store from './Store.js'
import API from './API.js'
import Socket from './Socket.js'

/**
 * The PeerSox server class.
 *
 * @class
 * @module server
 */
export class PeerSoxServer {
  /**
   * @param {object} options
   * @param {object} options.app An existing express app.
   * @param {object} options.server An existing http server.
   * @param {object} options.redisClient The redis client to use for the store.
   * @param {number} options.port The port on which the server should run.
   * @param {array} options.middleware Additional middleware for use in express.
   */
  constructor ({
    app = express(),
    server,
    redisClient = redisMock.createClient(),
    port = process.env.PORT || 3000,
    middleware = []
  } = {}) {
    this.store = new Store(redisClient)
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
