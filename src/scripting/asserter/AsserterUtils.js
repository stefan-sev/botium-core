const debug = require('debug')('botium-asserterUtils')
const ButtonsAsserter = require('./ButtonsAsserter')
const MediaAsserter = require('./MediaAsserter')
const Capabilities = require('../../Capabilities')
const util = require('util')
const _ = require('lodash')

module.exports = class AsserterUtils {
  constructor ({buildScriptContext, caps}) {
    this.asserters = {}
    this.buildScriptContext = buildScriptContext
    this.caps = caps
    this._setDefaultAsserters()
    this._fetchAsserters()
  }

  _setDefaultAsserters () {
    this.asserters['BUTTONS'] = new ButtonsAsserter(this.buildScriptContext, this.caps)
    this.asserters['MEDIA'] = new MediaAsserter(this.buildScriptContext, this.caps)
    debug(`Loaded Default asserter - ${util.inspect(this.asserters)}`)
  }

  _fetchAsserters () {
    this.caps[Capabilities.ASSERTERS]
      .map(asserter => {
        if (this.asserters[asserter.ref]) {
          throw new Error(`${asserter.ref} asserter already exists.`)
        }
        this.asserters[asserter.ref] = this._loadAsserterClass(asserter)
        debug(`Loaded ${asserter.ref} SUCCESSFULLY - ${util.inspect(asserter)}`)
      })
  }

  _loadAsserterClass ({src, ref}) {
    if (!src) {
      let packageName = `botium-asserter-${ref}`
      try {
        const Asserter = require(packageName)
        return new Asserter(this.buildScriptContext, this.caps)
      } catch (err) {
        throw new Error(`Failed to fetch package ${packageName} - ${util.inspect(err)}`)
      }
    }
    if (_.isFunction(src)) {
      try {
        const Asserter = src()
        return new Asserter(this.buildScriptContext, this.caps)
      } catch (err) {
        throw new Error(`Failed to load package ${ref} from provided function - ${util.inspect(err)}`)
      }
    }
    try {
      const Asserter = require(src)
      debug(`Loaded ${ref} asserter successfully`)
      return new Asserter(this.buildScriptContext, this.caps)
    } catch (err) {
      throw new Error(`Failed to fetch ${ref} asserter from ${src} - ${util.inspect(err)} `)
    }
  }
}
