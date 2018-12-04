# PeerSox
### Simple, high performance client and server for P2P WebRTC and WebSocket data connections.

* Ready to use client library and server
* WebRTC data channels and WebSockets fallback
* Generate and validate pairing codes and hashes
* Focus on low latency and minimal overhead
* Send strings or binary data (e.g. ArrayBuffer)

**[Documentation / API](https://peersox.netlify.com)**


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
const PeerSoxServer = require('peersox')
new PeerSoxServer()
```

### Client
The client is designed to be as simple and performant as possible.

#### Initiator
```javascript
let peersox = new PeerSoxClient('http://localhost:3000')

peersox.createPairing().then(pairing => {
  console.log(pairing.code)
  // => "123456"
})
peersox.onBinary = (data) => {
  const buffer = new Uint8Array(data);
  console.log(buffer)
}

peersox.onString = (data) => {
  console.log(data)
}
```

#### Joiner
```javascript
let peersox = new PeerSoxClient('http://localhost:3000')

peersox.joinPairing('123456')

peersox.on('peer.connected', () => {
  const byteArray = new Uint8Array([17, 21, 35])

  peersox.send(byteArray.buffer)
  peersox.send(numbers.join(';'))
})
```

## Acknowledgement
Originally I forked [SocketPeer](https://github.com/cvan/socketpeer) due to
outdated dependencies. Updating them broke the tests and introduced a strange
bug in the library itself. I tried to rewrite everything from scratch and in the
process added some more features. The only thing left from the original is the
concept, so I decided not to release this as a fork, but its own library.
