/**
 * The client pairs another client via the server.
 *
 * A running PeerSox server is required for pairing – two clients can't pair
 * with eachother without a server.
 *
 * Usage is different between the initiator (the one to request a pairing code)
 * and the joiner (the one to validate a pairing code).
 *
 * ### The initiator
 * ```javascript
 * // Create a new client.
 * let peersox = new PeerSoxClient({
 *   url: 'http://localhost:3000',
 *   debug: true
 * })
 *
 * // Request a new Pairing.
 * // If successful, the client is now connected to the PeerSox server and
 * // waiting for the joiner to connet to the server.
 * peersox.initiate().then(pairing => {
 *   // The pairing code the joiner will need to use.
 *   console.log(pairing.code) // => "123456"
 * })
 *
 * // Once the joiner (the peer of this client) is connected, we can start
 * // listening for incoming messages.
 * peersox.on('peer.connected', () => {
 *   // Receive binary data (e.g. ArrayBuffer).
 *   peersox.onBinary = (data) => {
 *     const buffer = new Uint8Array(data);
 *     console.log(buffer)
 *   }
 *
 *   // Receive string data.
 *   peersox.onString = (data) => {
 *     console.log(data)
 *   }
 * })
 * ```
 *
 * ### The joiner
 * ```javascript
 * // Create a new client.
 * let peersox = new PeerSoxClient({
 *   url: 'http://localhost:3000',
 *   debug: true
 * })
 *
 * // Start pairing with the initiator.
 * peersox.join('123456').then(status => {
 *   // The client is now connected with the server.
 *
 *   // The pairing succeeded when the following event is emitted.
 *   peersox.on('peer.connected', () => {
 *     // The client is now connected to its peer.
 *     // Let's send a message every second.
 *     interval = window.setInterval(() => {
 *       const numbers = [
 *         Math.round(Math.random() * 100),
 *         Math.round(Math.random() * 100),
 *         Math.round(Math.random() * 100)
 *       ]
 *
 *       const byteArray = new Uint8Array(numbers)
 *
 *       // Send an ArrayBuffer.
 *       peersox.send(byteArray.buffer)
 *
 *       // Send a string.
 *       peersox.send(numbers.join(';'))
 *     }, 1000)
 *   })
 * })
 * ```
 *
 * @module client
 */

export { PeerSoxClient as default } from './client/PeerSoxClient'
