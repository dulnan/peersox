/**
 * The server manages the generation and validation of pairing codes and hashes.
 * They are stored in redis, for local development redis-mock is used.
 *
 * Generated Pairings are only valid for a short amount of time. If they are not
 * validated in that time slot, they are deleted. If they are validated, the code
 * is removed from redis, while the hash's expire time is increased.
 */
import bodyParser from 'body-parser'
import { check, validationResult } from 'express-validator/check'

export default class API {
  constructor ({
    app,
    server,
    store,
    middleware,
    config
  } = {}) {
    this.store = store

    this.middleware = middleware

    this.app = app
    this.server = server

    this.middleware.push(bodyParser.urlencoded({ extended: true }))
    this.middleware.push(bodyParser.json())

    this.app.get('/api/config', this.middleware, this.routeConfig.bind(this))
    this.app.get('/api/code/get', this.middleware, this.routeCodeGet.bind(this))
    this.app.get('/api/token/get', this.middleware, this.routeTokenGet.bind(this))

    this.app.post('/api/code/validate', [
      ...this.middleware,
      check('code').isLength({ min: 6, max: 6 })
    ], this.routeCodeValidate.bind(this))

    this.app.post('/api/pairing/validate', [
      ...this.middleware,
      check('pairing.code').isLength({ min: 6, max: 6 }),
      check('pairing.hash').isLength({ min: 64, max: 64 })
    ], this.routePairingValidate.bind(this))

    this.app.options('/api/code/validate', this.middleware, this.routeOptions.bind(this))
    this.app.options('/api/pairing/validate', this.middleware, this.routeOptions.bind(this))

    this.getConfig = config
  }

  routeOptions (req, res) {
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Content-Length, X-Requested-With')
    res.send(200)
  }

  routeConfig (req, res) {
    try {
      const config = this.getConfig()
      return res.json(config)
    } catch (e) {
      console.log(e)
      return res.status(503).send('Error getting config.')
    }
  }

  routeTokenGet (req, res) {
    this.store.getToken().then(token => {
      if (token) {
        return res.json({ token })
      }

      return res.status(503)
    }).catch(err => {
      console.log(err)
      return res.status(503)
    })
  }

  routeCodeGet (req, res) {
    this.store.generatePairing().then(pairing => {
      return res.json(pairing)
    }).catch(err => {
      console.log(err)
      return res.status(503)
    })
  }

  // Return a pairing or an empty object if the given code is valid.
  routeCodeValidate (req, res) {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }

    this.store.getPairingFromCode(req.body.code).then(pairing => {
      return res.json(pairing)
    }).catch(err => {
      console.log(err)
      return res.status(503)
    })
  }

  // Return a Validation if the given pairing is valid.
  routePairingValidate (req, res) {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }

    this.store.validatePairing(req.body.pairing).then(validation => {
      return res.json(validation)
    }).catch(err => {
      console.log(err)
      return res.status(503)
    })
  }
}
