global.log = require('loglevel')
expect = require('chai').expect
spawn = require('child_process').spawn
Meteor = require("./Meteor")
Phantomjs = require("./Phantomjs")

class TestRunner
  meteor: null
  phantomjs: null

  @ERR_CODE:
    TEST_SUCCESS: 0
    TEST_FAILED: 2
    METEOR_ERROR: 3
    TEST_TIMEOUT: 4

  constructor: ->
    @rc = require('rc')("mctr", {
      help:null
      log_level:"info"
      port:4096
      root_url:null
      app:null
      settings:null
      timeout:120000 # 2 minutes
      packages:null,
      meteor_ready_text: "=> App running at:",
      meteor_error_text: "Waiting for file change."
    })
    log.setLevel(@rc.log_level)
    @handleArgs()


  run: ->
    log.debug "TestRunner.run()",arguments
    log.info "Running mctr"
    expect(@meteor).to.be.null

    setTimeout(
      =>
        log.error "Tests timed out after #{@rc.timeout} milliseconds."
        @killAllChilds( TestRunner.ERR_CODE.TEST_TIMEOUT )
      ,@rc.timeout
    )

    @meteor = new Meteor(@rc)
    @meteor.on "ready", =>
      log.info "Meteor is ready"
      @runPhantom() if not @phantomjs

    @meteor.on "error", =>
      log.error "Meteor has errors, exiting"
      @killAllChilds TestRunner.ERR_CODE.METEOR_ERROR

    @meteor.run()


  runPhantom: ->
    log.debug "TestRunner.runPhantom()",arguments
    @phantomjs = new Phantomjs(@rc)

    @phantomjs.on "exit", (code,signal)=>
      @meteor.kill()
      if code?
        process.exit code
      else if signal?
        process.exit TestRunner.ERR_CODE.PHANTOM_ERROR
      else
        process.exit TestRunner.ERR_CODE.PHANTOM_ERROR

    @phantomjs.run()

  killAllChilds: (code = 1)->
    log.debug "TestRunner.killAllChilds()",arguments
    @meteor?.kill()
    @phantomjs?.kill()
    process.exit code


  handleArgs: ->
    log.debug "TestRunner.handleArgs()",arguments
    if @rc.help?
      @printUsage()
      process.exit 0

    if @rc.root_url is null
      @rc.root_url = "http://localhost:#{@rc.port}/"


  printUsage : ->
    log.debug "TestRunner.printUsage()",arguments
    process.stdout.write("Usage: mctr <command>\n
    --app directory             The Meteor app directory.\n
    --help                      Display a list of all arguments.\n
    --log_level <level>         Sets the log level for the tests. TRACE|DEBUG|INFO|WARN|ERROR\n
    --port <port>               Port in which tets should be run.\n
    --meteor_ready_text <text>  Optional. Meteor ready message to listen.\n
    --meteor_error_text <text>  Optional. Meteor error message to listen.\n
    --packages <directory>      The meteor packages to test (glob style wildcards can be specified).\n
    --root_url address          Optional. Url to use as Meteor ROOT_URL. Default is http://localhost:3000\n
    --settings <file>           Optional. The Meteor settings file path.\n
    --timeout  <milliseconds>   Optional. Total timeout for all tests. Default is 120000\n")

module.exports = new TestRunner()