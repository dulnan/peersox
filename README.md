# PeerSox
### Simple, high performance client and server for P2P WebRTC and WebSocket data connections.

* Ready to use client library and server
* WebRTC data channels and WebSockets fallback
* Generate and validate pairing codes and hashes
* Focus on low latency and minimal overhead
* Send strings or binary data (e.g. ArrayBuffer)

Originally I forked [SocketPeer](https://github.com/cvan/socketpeer) due to
outdated dependencies. Updating them broke the tests and introduced a strange
bug in the library itself. I decided to rewrite everything from scratch and
added some more features. The only thing left from the original is the concept,
so I decided not to release this as a fork, but its own library.

## Usage
PeerSox consists of a client (for use in the browser) and a server (in a node
environment) library. It is not possible to use only the clients.

### Server
The PeerSoxServer consists of two parts:
* REST API for fetching and validating pairing codes
* WebSocket service for initiating WebRTC connections or relaying messages if
  WebRTC is not supported

To make the server app scalable, both parts can run independently of each other.
In addition it's possible to use persistent storage (Redis connector is
provided) for storing pairing codes and hashes.

Example:
```javascript
import { PeerSoxServer, getRedisClient } from 'peersox'

// To prevent brute force attacks on pairing generation and validation, the
// express-brute middleware is passed to the PeerSoxServer.
import ExpressBrute from 'express-brute'
import BruteRedis from 'express-brute-redis'

function main () {
  // This will return a redis client, either with a real connection to a redis
  // server or a "fake" one using redis-mock.
  getRedisClient().then(redisClient => {
    // Initialize the express-brute redis adapter.
    const bruteStore = new BruteRedis({
      client: redisClient
    })

    // Initialize express-brute itself.
    const bruteforce = new ExpressBrute(bruteStore, {
      freeRetries: 20
    })

    // Initialize the PeerSoxServer.
    const socketpeer = new PeerSoxServer({
      storage: redisClient,
      middleware: [
        bruteforce.prevent
      ]
    })
  })
}

main()
```

### Client
The client is designed to be as simple and performant as possible.

```javascript
// Create a new client.
let peersox = new PeerSoxClient({
  url: 'http://localhost:3000',
  debug: true
})

// Start pairing with the initiator.
peersox.pair('123456').then(status => {
  // The client is now connected with the server.

  // The pairing succeeded when the following event is emitted.
  peersox.on('peer.connected', () => {
    // The client is now connected to its peer.
    // Let's send a message every second.
    interval = window.setInterval(() => {
      const numbers = [
        Math.round(Math.random() * 100),
        Math.round(Math.random() * 100),
        Math.round(Math.random() * 100)
      ]

      const byteArray = new Uint8Array(numbers)

      // Send an ArrayBuffer.
      peersox.send(byteArray.buffer)

      // Send a string.
      peersox.send(numbers.join(';'))
    }, 1000)
  })
})
```

```javascript
let peersox = new PeerSoxClient({
  url: 'http://localhost:3000',
  debug: true
})

peersox.initPairing().then(pairing => {
  console.log(pairing.code) // => "123456"
})

// Receive binary data (e.g. ArrayBuffer).
peersox.onBinary = function (data) {
  const buffer = new Uint8Array(data);
  console.log(buffer)
}

// Receive string data.
peersox.onString = function (data) {
  console.log(data)
}
```
