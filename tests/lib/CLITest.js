// Generated by CoffeeScript 1.8.0
(function() {
  var CLI, ChildProcess, Spacejam, chai, expect, fs, isCoffee, path, sinon, sinonChai;

  fs = require('fs');

  path = require('path');

  chai = require("chai");

  expect = chai.expect;

  sinon = require("sinon");

  sinonChai = require("sinon-chai");

  chai.use(sinonChai);

  isCoffee = require('./isCoffee');

  if (isCoffee) {
    require('../../src/log');
    CLI = require('../../src/CLI');
    Spacejam = require('../../src/Spacejam');
    ChildProcess = require('../../src/ChildProcess');
  } else {
    require('../../lib/log');
    CLI = require('../../lib/CLI');
    Spacejam = require('../../lib/Spacejam');
    ChildProcess = require('../../lib/ChildProcess');
  }

  describe("CLI", function() {
    var cli, exitStub, phantomjsScript, processArgv, spacejam, spawnSpy, testPackagesStub;
    this.timeout(30000);
    processArgv = null;
    cli = null;
    spacejam = null;
    exitStub = null;
    testPackagesStub = null;
    spawnSpy = null;
    phantomjsScript = null;
    before(function() {
      return processArgv = process.argv;
    });
    after(function() {
      return process.argv = processArgv;
    });
    beforeEach(function() {
      process.chdir(__dirname + "/../apps/leaderboard");
      delete process.env.PORT;
      delete process.env.ROOT_URL;
      delete process.env.MONGO_URL;
      delete process.env.PACKAGE_DIRS;
      process.argv = ['coffee', path.normalize(__dirname + "/../bin/spacejam")];
      cli = new CLI();
      spacejam = cli.spacejam;
      exitStub = sinon.stub(process, 'exit');
      testPackagesStub = sinon.stub(spacejam, 'testPackages');
      return phantomjsScript = 'phantomjs-test-in-console.' + (isCoffee ? 'coffee' : 'js');
    });
    afterEach(function() {
      if (exitStub != null) {
        if (typeof exitStub.restore === "function") {
          exitStub.restore();
        }
      }
      exitStub = null;
      if (testPackagesStub != null) {
        if (typeof testPackagesStub.restore === "function") {
          testPackagesStub.restore();
        }
      }
      testPackagesStub = null;
      if (spawnSpy != null) {
        if (typeof spawnSpy.restore === "function") {
          spawnSpy.restore();
        }
      }
      spawnSpy = null;
      return spacejam = null;
    });
    it("should call Spacejam.testPackages() with an empty options.packages array, if no packages where provided on the command line", function() {
      process.argv.push("test-packages");
      cli.exec();
      return expect(testPackagesStub).to.have.been.calledWith({
        packages: []
      });
    });
    it("should call Spacejam.testPackages() with options.packages set to the packages provided on the command line", function() {
      process.argv.push('test-packages', '--settings', 'settings.json', 'package1', 'package2');
      cli.exec();
      return expect(testPackagesStub).to.have.been.calledWith({
        settings: 'settings.json',
        packages: ['package1', 'package2']
      });
    });
    it("should spawn phantomjs with the value of --phantomjs-options", function(done) {
      log.setLevel('debug');
      testPackagesStub.restore();
      spawnSpy = sinon.spy(ChildProcess, '_spawn');
      process.chdir(__dirname + "/../apps/leaderboard/packages/success");
      process.argv.push('test-packages', '--mongo-url', 'mongodb://', '--phantomjs-options=--ignore-ssl-errors=true --load-images=false', './');
      cli.exec();
      return spacejam.on('done', (function(_this) {
        return function(code) {
          var err;
          try {
            if (code === 0) {
              done();
            } else {
              done("spacejam.done=" + code);
            }
            expect(spawnSpy).to.have.been.calledTwice;
            return expect(spawnSpy.secondCall.args[1]).to.deep.equal(['--ignore-ssl-errors=true', '--load-images=false', phantomjsScript]);
          } catch (_error) {
            err = _error;
            return done(err);
          }
        };
      })(this));
    });
    return describe('pidFileInit', function() {
      var pidFile, pidPath;
      pidFile = pidPath = null;
      beforeEach(function() {
        process.chdir(__dirname);
        pidFile = 'test.pid';
        pidPath = path.resolve('test.pid');
        if (fs.existsSync(pidFile)) {
          return fs.unlinkSync(pidPath);
        }
      });
      afterEach(function() {
        if (cli != null) {
          return process.removeListener('exit', cli.onProcessExit);
        }
      });
      it('should create a pid file and delete it on exit', function() {
        var pid;
        cli.pidFileInit(pidFile);
        expect(fs.existsSync(pidFile)).to.be["true"];
        pid = +fs.readFileSync(pidFile);
        expect(pid).to.equal(process.pid);
        cli.onProcessExit(0);
        return expect(fs.existsSync(pidFile)).to.be["false"];
      });
      it('should exit, if the pid file exists and the pid is alive', function() {
        fs.writeFileSync(pidPath, "" + process.pid);
        cli.pidFileInit(pidFile);
        return expect(exitStub).to.have.been.calledWith(Spacejam.DONE.ALREADY_RUNNING);
      });
      return it('should not exit, if the pid file exists but the pid is dead', function() {
        var pid;
        fs.writeFileSync(pidPath, "50000");
        cli.pidFileInit(pidFile);
        expect(exitStub).to.have.not.been.called;
        pid = +fs.readFileSync(pidFile);
        expect(pid).to.equal(process.pid);
        return cli.onProcessExit(0);
      });
    });
  });

}).call(this);
