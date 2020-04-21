var path = require('path');
var desktopIdle = require('desktop-idle');
var notifier = require('node-notifier');
var winston = require('winston');
require('winston-daily-rotate-file');
var runJobs = require('./lib/runJobs');
var logger = require('./lib/logger');

logger.add(
  new winston.transports.DailyRotateFile({
    dirname: process.env.ONWAKED_LOGDIR,
    fileName: 'onwaked-%DATE%.log',
    createSymlink: true,
    symlinkName: 'onwaked.log',
    maxFiles: '14d',
  })
);

var configImportPath =
  './' + path.relative(__dirname, process.env.ONWAKED_JOBS);

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
    logger.error({ message: 'checkForWake failed to run', error: e });
    callback();
  }
};

setTimeout(function callee() {
  checkForWake(function () {
    setTimeout(callee, intervalTime);
  });
}, intervalTime);
