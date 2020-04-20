var path = require('path');
var desktopIdle = require('desktop-idle');
var notifier = require('node-notifier');
var runJobs = require('./lib/runJobs');

var configImportPath =
  './' + path.relative(__dirname, process.env.ONWAKETOOL_JOBS);

var intervalTime = 1000 * 10;
var lastIdleStart = Date.now();

var checkForWake = function checkForWake(callback) {
  try {
    var idleStart = Date.now() - desktopIdle.getIdleTime();

    if (idleStart > lastIdleStart) {
      // There has been activity. Now we compute how long we were idle
      var idleTime = idleStart - lastIdleStart;
      lastIdleStart = idleStart;

      var config = require(configImportPath);
      runJobs(config, idleTime, function (results) {
        var totalJobs = results.successes + results.failures;
        if (totalJobs) {
          notifier.notify({
            title: 'onwaked: finished',
            message: 'ran ' + totalJobs + ' jobs',
          });
        }
        if (results.failures) {
          notifier.notify({
            title: 'onwaked: jobs failed',
            message: results.failures + ' jobs failed',
          });
        }
        callback();
      });
    }
  } catch (e) {
    console.error('checkForWake failed to run', e);
    callback();
  }
};

setTimeout(function callee() {
  checkForWake(function () {
    setTimeout(callee, intervalTime);
  });
}, intervalTime);
