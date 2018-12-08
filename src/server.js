import Store from './server/Store.js'
import API from './server/API.js'
import Socket from './server/Socket.js'

/**
 * The server manages the generation and validation of pairing codes and hashes.
 * They are stored in redis, for local development redis-mock is used.
 *
 * Generated Pairings are only valid for a short amount of time. If they are not
 * validated in that time slot, they are deleted. If they are validated, the
 * code is removed from redis, while the hash's expire time is increased.
 *
 * @example <caption>Minimal</caption>
 * // Start a server on port 3000, using redis-mock for storage.
 * // This is not meant for production use.
 *
 * const PeerSoxServer = require('peersox/lib/peersox.server.js').default
 * new PeerSoxServer()
 *
 * @example <caption>Redis server with express-bruteforce</caption>
 * // Connect and use a redis server for storage and provide an express
 * // middleware that prevents brute force attacks on the server.
 *
 * const PeerSoxServer = require('peersox/lib/peersox.server.js').default
 * const ExpressBrute = require('express-brute')
 * const redis = require('redis')
 * const BruteRedis = require('express-brute-redis')
 *
 * // Create a new redis client.
 * const redisClient = redis.createClient('//localhost:6379')
 *
 * // Init the PeerSox server when the redis client is ready.
 * redisClient.on('ready', function () {
 *   console.log('Connected to Redis at')
 *
 *   // Use the redis client as the store for express-brute.
 *   const bruteStore = new BruteRedis({
 *     client: redisClient
 *   })
 *
 *   // Instantiate the express-brute middleware.
 *   const bruteforce = new ExpressBrute(bruteStore, {
 *     freeRetries: 20
 *   })
 *
 *   // Instantiate the PeerSox server.
 *   new PeerSoxServer({
 *     storage: redisClient,
 *     middleware: [
 *       bruteforce.prevent
 *     ],
 *     allowOrigins: [
 *       'http://localhost:8080',
 *       'https://example.com'
 *     ]
 *   })
 * })
 *
 * @class
 */
export class PeerSoxServer {
  /**
   * @param {RedisClient} redisClient The redis client to use for the store.
   * @param {object} options
   * @param {object} options.app An existing express app.
   * @param {object} options.server An existing http server.
   * @param {number} options.port The port on which the server should run.
   * @param {array} options.middleware Additional middleware for use in express.
   * @param {array} options.allowOrigins List of origins for which a connection
   * is allowed.
   */
  constructor (redisClient, {
    app,
    server,
    middleware = [],
    config,
    allowOrigins = []
  } = {}) {
    if (allowOrigins.length === 0) {
      console.warn('allowOrigins is empty. WebSocket connections will be allowed from any origin.')
    }

    this.store = new Store(redisClient)

    this.socket = new Socket({
      store: this.store,
      server,
      allowOrigins
    })

    this.api = new API({
      store: this.store,
      app,
      server,
      config,
      middleware
    })
  }
}

export default PeerSoxServer
