_ = require "underscore"
expect = require('chai').expect
ChildProcess = require './ChildProcess'
EventEmitter = require('events').EventEmitter
path = require 'path'
phantomjs = require 'phantomjs'
process.env.PATH = path.dirname(phantomjs.path) + ':' + process.env.PATH
isCoffee = __filename.indexOf('.coffee') > 0


class Phantomjs extends EventEmitter

  childProcess: null

  run: (url, options = '--load-images=no --ssl-protocol=TLSv1', script = "phantomjs-test-in-console")=>
    log.debug "Phantomjs.run()", arguments
    expect(url, "Invalid url").to.be.a 'string'
    expect(options, "Invalid options").to.be.a 'string'
    expect(script, "Invalid script").to.be.a 'string'
    expect(@childProcess,"ChildProcess is already running").to.be.null

    env = _.extend process.env, {ROOT_URL: url}

    script += if isCoffee then '.coffee' else '.js'
    log.debug("script=#{__dirname}/#{script}")
    spawnArgs = options.split(' ')
    spawnArgs.push(script)
    spawnOptions = {
      cwd: __dirname,
      detached: false
      env: env
    }

    @childProcess = new ChildProcess()
    @childProcess.spawn("phantomjs", spawnArgs, spawnOptions)

    @childProcess.child.on "exit", (code, signal) =>
      @emit "exit", code, signal

  kill: (signal = "SIGTERM")->
    log.debug "Phantomjs.kill()"
    @childProcess?.kill(signal)


module.exports = Phantomjs

