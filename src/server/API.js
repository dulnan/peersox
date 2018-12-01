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
import bodyParser from 'body-parser'
import cors from 'cors'

export default class API {
  constructor ({
    app,
    server,
    store,
    port,
    middleware
  } = {}) {
    this.store = store

    this.middleware = middleware

    this.app = app
    this.server = server

    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(bodyParser.json())
    this.app.use(cors())

    this.app.get('/api/code/get', this.middleware, this.routeCodeGet.bind(this))
    this.app.post('/api/code/validate', this.middleware, this.routeCodeValidate.bind(this))
    this.app.post('/api/pairing/validate', this.middleware, this.routePairingValidate.bind(this))

    this.server.listen(port)

    console.log(`Listening on port ${port}`)
  }

  routeCodeGet (req, res) {
    this.store.generatePairing().then(pairing => {
      res.json(pairing)
    })
  }

  // Return a pairing or an empty object if the given code is valid.
  routeCodeValidate (req, res) {
    this.store.getPairingFromCode(req.body.code).then(pairing => {
      res.json(pairing)
    })
  }

  // Return a Validation if the given pairing is valid.
  routePairingValidate (req, res) {
    if (!req.body.pairing) {
      res.status(400)
      return res.json({})
    }
    this.store.validatePairing(req.body.pairing).then(validation => {
      res.json(validation)
    })
  }
}
