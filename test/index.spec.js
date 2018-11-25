/* global describe, it, before */

import chai from 'chai'
import PeerSoxClient from '../lib/peersox.client.js'

chai.expect()

const expect = chai.expect

let lib

describe('Given an instance of my peer-sox library', () => {
  before(() => {
    lib = new PeerSoxClient()
  })
  describe('when I need the connection status', () => {
    it('should return the connection status', () => {
      expect(lib.url).to.be.equal('http://localhost')
    })
  })
})
