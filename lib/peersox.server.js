(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("ws"));
	else if(typeof define === 'function' && define.amd)
		define("peersox", ["ws"], factory);
	else if(typeof exports === 'object')
		exports["peersox"] = factory(require("ws"));
	else
		root["peersox"] = factory(root["ws"]);
})(global, function(__WEBPACK_EXTERNAL_MODULE__4__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("body-parser");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("string-hash");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__4__;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(6);


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: external "crypto"
var external_crypto_ = __webpack_require__(1);
var external_crypto_default = /*#__PURE__*/__webpack_require__.n(external_crypto_);

// CONCATENATED MODULE: ./src/server/utils/index.js

/**
 * Generate a random hex code in form of a sha256 hash.
 */

function buildRandomHex() {
  const random = external_crypto_default.a.randomBytes(64).toString('hex');
  return external_crypto_default.a.createHash('sha256').update(random).digest('hex');
}
/**
 * Generate a random number.
 *
 * @param {String} hash A random hash as a String.
 * @returns {String} A random numerical code as a String.
 */

function buildRandomCode(hash) {
  return String(Math.round(hash * Math.random() * 89999) / Math.random()).substring(0, 6);
}
/**
 * Check if given argument is a String.
 *
 * @param {*} v
 * @returns {Boolean}
 */

function isString(v) {
  return typeof v === 'string' || v instanceof String;
}
/**
 * Checks if the given code is valid.
 *
 * @param {String} code
 * @returns {Boolean}
 */

function codeIsValid(code) {
  if (!isString(code)) {
    return false;
  }

  if (code.length !== 6) {
    return false;
  }

  if (/^\d+$/.test(code) === false) {
    return false;
  }

  return true;
}
/**
 * Checks if the given string is a valid pairing hash.
 *
 * @param {String} hash
 */

function hashIsValid(hash) {
  return true;
}
/**
 * Checks if the code and hash of the pairing are valid.
 *
 * @param {Pairing} pairing
 */

function pairingIsValid(pairing) {
  return codeIsValid(pairing.code) && hashIsValid(pairing.hash);
}
// CONCATENATED MODULE: ./src/common/classes.js
/**
 * A pairing.
 *
 * @param {String} code The pairing code.
 * @param {String} hash The pairing hash.
 */
class Pairing {
  constructor({
    code,
    hash
  }) {
    this.code = code;
    this.hash = hash;
  }

}
/**
 * A validation.
 *
 * @param {Boolean} isValid
 */

class Validation {
  constructor(isValid) {
    this.isValid = isValid;
  }

}
// EXTERNAL MODULE: external "string-hash"
var external_string_hash_ = __webpack_require__(3);
var external_string_hash_default = /*#__PURE__*/__webpack_require__.n(external_string_hash_);

// EXTERNAL MODULE: external "util"
var external_util_ = __webpack_require__(0);

// CONCATENATED MODULE: ./src/server/Store.js




const EXPIRE_CODE = 130; // 130 seconds

const EXPIRE_PAIRED = 60 * 60 * 24 * 7; // 7 days

/**
 * Handles all things related to generating pairing codes and hashes
 * and validating them.
 *
 * @class
 */

class Store_Store {
  /**
   * @param {RedisClient} redisClient
   */
  constructor(redisClient) {
    this.redisGet = Object(external_util_["promisify"])(redisClient.get).bind(redisClient);
    this.redisSet = Object(external_util_["promisify"])(redisClient.set).bind(redisClient);
    this.redisExists = Object(external_util_["promisify"])(redisClient.exists).bind(redisClient);
    this.redisDel = Object(external_util_["promisify"])(redisClient.del).bind(redisClient);
    this.redisExpire = Object(external_util_["promisify"])(redisClient.expire).bind(redisClient);
    this._redisReady = false;
    redisClient.on('ready', () => {
      this._redisReady = true;
      console.log('Redis is ready.');
    });
    redisClient.on('error', () => {
      this._redisReady = false;
      console.log('Redis has errored.');
    });
  }
  /**
   * Checks if the given hash exists.
   *
   * @param {String} hash
   */


  async keyExists(hash) {
    const res = await this.redisExists(hash);
    return res === 1;
  }
  /**
   * Generates a random hash and checks that it's unique.
   *
   * @returns {String} The generated hash.
   */


  async generateHash() {
    let alreadyUsed = false;
    let hash = '';

    do {
      hash = buildRandomHex();
      alreadyUsed = await this.keyExists(hash);
    } while (alreadyUsed);

    return hash;
  }
  /**
   * Generates a random code and checks that it's unique.
   *
   * @returns {String} The generated code.
   */


  async generateCode(hash) {
    const numericHash = external_string_hash_default()(hash);
    let alreadyUsed = false;
    let code = '000000';

    do {
      code = buildRandomCode(numericHash);
      alreadyUsed = await this.keyExists(code);
    } while (alreadyUsed);

    return code;
  }
  /**
   * Generate a pairing combination of hash and code.
   * Both are stored in redis with a short expire time.
   *
   * @returns {Pairing} The generated pairing.
   */


  async generatePairing() {
    const hash = await this.generateHash();
    const code = await this.generateCode(hash);
    const hashIsSet = (await this.redisSet(hash, code, 'EX', EXPIRE_CODE)) === 'OK';
    const codeIsSet = (await this.redisSet(code, hash, 'EX', EXPIRE_CODE)) === 'OK';

    if (hashIsSet && codeIsSet) {
      return new Pairing({
        code,
        hash
      });
    } else {
      throw new Error('PairingGenerateFailed');
    }
  }
  /**
   * Gets the pairing from a code. If it exists, the code is deleted
   * and the expire time of the hash increased.
   *
   * @param {String} code The code to get the pairing from.
   * @returns {(Pairing|Object)} A pairing or an empty object if no pairing was found.
   */


  async getPairingFromCode(code) {
    if (codeIsValid(code)) {
      const exists = await this.keyExists(code);

      if (exists) {
        const hash = await this.redisGet(code);
        await this.redisDel(code);
        await this.redisExpire(hash, EXPIRE_PAIRED);
        return new Pairing({
          code,
          hash
        });
      }
    }

    return {};
  }
  /**
   * Check if the given pairing is valid, both as values and as
   * stored keys in redis.
   *
   * @param {Pairing} pairing
   * @returns {boolean} Object with isValid property.
   */


  async validatePairing(pairing) {
    let isValid = false;

    if (pairingIsValid(pairing)) {
      const hashExists = await this.keyExists(pairing.hash);

      if (hashExists) {
        const code = await this.redisGet(pairing.hash);

        if (pairing.code === code) {
          isValid = true;
        }
      }
    }

    return new Validation(isValid);
  }

}

/* harmony default export */ var server_Store = (Store_Store);
// EXTERNAL MODULE: external "body-parser"
var external_body_parser_ = __webpack_require__(2);
var external_body_parser_default = /*#__PURE__*/__webpack_require__.n(external_body_parser_);

// CONCATENATED MODULE: ./src/server/API.js
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

class API_API {
  constructor({
    app,
    server,
    store,
    middleware,
    config
  } = {}) {
    this.store = store;
    this.middleware = middleware;
    this.app = app;
    this.server = server;
    this.app.use(external_body_parser_default.a.urlencoded({
      extended: true
    }));
    this.app.use(external_body_parser_default.a.json());
    this.app.get('/api/config', this.middleware, this.routeConfig.bind(this));
    this.app.get('/api/code/get', this.middleware, this.routeCodeGet.bind(this));
    this.app.post('/api/code/validate', this.middleware, this.routeCodeValidate.bind(this));
    this.app.post('/api/pairing/validate', this.middleware, this.routePairingValidate.bind(this));
    this.getConfig = config;
  }

  routeConfig(req, res) {
    try {
      const config = this.getConfig();
      return res.json(config);
    } catch (e) {
      console.log(e);
      return res.status(503).send('Error getting config.');
    }
  }

  routeCodeGet(req, res) {
    this.store.generatePairing().then(pairing => {
      return res.json(pairing);
    }).catch(err => {
      console.log(err);
      return res.status(503);
    });
  } // Return a pairing or an empty object if the given code is valid.


  routeCodeValidate(req, res) {
    if (!req.body.code) {
      return res.status(400).send('Did not specify code to validate.');
    }

    this.store.getPairingFromCode(req.body.code).then(pairing => {
      return res.json(pairing);
    }).catch(err => {
      console.log(err);
      return res.status(503);
    });
  } // Return a Validation if the given pairing is valid.


  routePairingValidate(req, res) {
    if (!req.body.pairing) {
      return res.status(400).send('Did not specify pairing to validate.');
    }

    this.store.validatePairing(req.body.pairing).then(validation => {
      return res.json(validation);
    }).catch(err => {
      console.log(err);
      return res.status(503);
    });
  }

}
// CONCATENATED MODULE: ./src/common/dataparser.js
function decode(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}
function encode(name, data = {}) {
  return JSON.stringify({
    name,
    data
  });
}
// CONCATENATED MODULE: ./src/common/settings.js
const INTERNAL_MESSAGE_PREFIX = '§';
const HANDSHAKE_SUCCESS = 'HANDSHAKE_SUCCESS';
const HANDSHAKE_FAILED = 'HANDSHAKE_FAILED';
const PING = 'PING';
// EXTERNAL MODULE: external "ws"
var external_ws_ = __webpack_require__(4);

// CONCATENATED MODULE: ./src/server/Socket.js



__webpack_require__(0).inspect.defaultOptions.depth = 0;
class Socket_Socket {
  constructor({
    server,
    store
  }) {
    this.store = store;
    this.socketserver = new external_ws_["Server"]({
      server: server,
      path: '/ws'
    });
    this.messageHandlers = {
      'client.register': this.onMessageRegister.bind(this),
      data: this.onMessageData.bind(this)
    };
    this.socketserver.on('connection', this.onConnection.bind(this));
    this.connections = {};
  }

  onMessageClose(client) {
    let hash = '';

    if (client._pairing && typeof client._pairing === 'object') {
      hash = client._pairing.hash;
    }

    if (client._peer && client._peer._pairing && typeof client._peer._pairing === 'object') {
      hash = client._peer._pairing.hash;
    }

    this.connections[hash] = null;

    if (client._peer) {
      if (client._peer.readyState === 1) {
        client._peer.close();
      }
    }

    if (client.readyState === 1) {
      client.close();
    }
  }

  async onMessageRegister(client, pairing) {
    const isValid = await this.store.validatePairing(pairing);

    if (!isValid) {
      client.send(HANDSHAKE_FAILED);
      client.close();
      return;
    }

    client.send(HANDSHAKE_SUCCESS);
    client.binaryType = 'arraybuffer';

    if (this.connections[pairing.hash]) {
      const peer = this.connections[pairing.hash];
      peer._pairing = pairing;
      peer._peer = client;
      client._peer = peer;
      this.sendInternalEvent(client, 'peer.connected', {
        isInitiator: false,
        pairing
      });
      this.sendInternalEvent(peer, 'peer.connected', {
        isInitiator: true,
        pairing
      });
    } else {
      client._pairing = pairing;
      this.connections[pairing.hash] = client;
    }
  }

  sendInternalEvent(client, eventName, data = {}) {
    if (client && client.readyState === 1) {
      client.send(INTERNAL_MESSAGE_PREFIX + encode(eventName, data));
    }
  }

  onMessageData(client, data) {
    if (client && client._peer && client._peer.readyState === 1) {
      client._peer.send(data);
    }
  }

  onConnection(client) {
    client.on('close', closed => {
      this.onMessageClose(client);
    });
    client.on('message', messageRaw => {
      // Close the connection if the peer connection has closed.
      if (client && client._peer && client._peer.readyState === 3) {
        client.close();
        return;
      }

      if (typeof messageRaw === 'string' && messageRaw.charAt(0) === INTERNAL_MESSAGE_PREFIX) {
        // Handle the case when it's an internal string message.
        const message = decode(messageRaw.substring(1));

        if (message && this.messageHandlers[message.name]) {
          this.messageHandlers[message.name].call(this, client, message.data);
          return;
        }
      } // Directly send the message to the peer if its connected.


      if (client._peer && client._peer.readyState === 1) {
        client._peer.send(messageRaw);
      }
    });
  }

}
// CONCATENATED MODULE: ./src/server.js
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PeerSoxServer", function() { return server_PeerSoxServer; });



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
 *     ]
 *   })
 * })
 *
 * @class
 */

class server_PeerSoxServer {
  /**
   * @param {RedisClient} redisClient The redis client to use for the store.
   * @param {object} options
   * @param {object} options.app An existing express app.
   * @param {object} options.server An existing http server.
   * @param {number} options.port The port on which the server should run.
   * @param {array} options.middleware Additional middleware for use in express.
   */
  constructor(redisClient, {
    app,
    server,
    middleware = [],
    config
  } = {}) {
    this.store = new server_Store(redisClient);
    this.socket = new Socket_Socket({
      store: this.store,
      server
    });
    this.api = new API_API({
      store: this.store,
      app,
      server,
      config,
      middleware
    });
  }

}
/* harmony default export */ var src_server = __webpack_exports__["default"] = (server_PeerSoxServer);

/***/ })
/******/ ]);
});
//# sourceMappingURL=peersox.server.js.map