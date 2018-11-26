/**
 * The server manages the generation and validation of pairing codes and hashes.
 * They are stored in redis, for local development redis-mock is used.
 *
 * Generated Pairings are only valid for a short amount of time. If they are not
 * validated in that time slot, they are deleted. If they are validated, the
 * code is removed from redis, while the hash's expire time is increased.
 *
 * ### Minimal example
 * This will start a server on port 3000, using redis-mock for storage.
 * It is not meant for production use.
 *
 * ```javascript
 * var PeerSoxServer = require('peersox/lib/peersox.server.js').default
 * new PeerSoxServer()
 * ```
 *
 * ### Advanced example
 * Connect and use a redis server for storage and provide an express middleware
 * that prevents brute force attacks on the server.
 *
 * ```javascript
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
 *     ]
 *   })
 * })
 * ```
 *
 * @module server
 */

export { PeerSoxServer as default } from './server/PeerSoxServer'
