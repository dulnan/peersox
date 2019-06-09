![Logo](misc/peersox-header.png)
## Low latency client and server for P2P WebRTC and WebSocket data connections.

* **Ready to use client library and server**
* **WebRTC data channels and WebSockets fallback**
* **Generate and validate pairing codes and hashes**
* **Focus on low latency and minimal overhead**
* **Send strings or binary data (e.g. ArrayBuffer)**

<hr>

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

await peersox.init()

const pairing = await peersox.createPairing()
console.log(pairing.code) // => "123456"

peersox.on('peerConnected', () => {
  // Receive binary data (e.g. ArrayBuffer).
  peersox.onBinary = (data) => {
    const buffer = new Uint8Array(data);
    console.log(buffer)
  }

  // Receive string data.
  peersox.onString = (data) => {
    console.log(data)
  }
})

peersox.connect(pairing)
```

#### Joiner
```javascript
let peersox = new PeerSoxClient('http://localhost:3000')

await peersox.init()

peersox.on('peerConnected', () => {
  const byteArray = new Uint8Array([17, 21, 42])

  peersox.send(byteArray.buffer)
  peersox.send('This is my message')
})

const pairing = await peersox.joinPairing('123456')
await peersox.connect(pairing)
```

## Acknowledgement
Originally I forked [SocketPeer](https://github.com/cvan/socketpeer) due to
outdated dependencies. Updating them broke the tests and introduced a strange
bug in the library itself. I tried to rewrite everything from scratch and in the
process added some more features. The only thing left from the original is the
concept, so I decided not to release this as a fork, but its own library.
