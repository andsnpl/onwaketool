var path = require('path');
var desktopIdle = require('desktop-idle');
var notificationState = require('@meetfranz/electron-notification-state');
var notifier = require('node-notifier');
var winston = require('winston');
require('winston-daily-rotate-file');
var runJobs = require('./lib/runJobs');
var logger = require('./lib/logger');

logger.add(
  new winston.transports.DailyRotateFile({
    dirname: process.env.ONWAKED_LOGDIR,
    filename: 'onwaked.log.%DATE%',
    createSymlink: true,
    symlinkName: 'onwaked.log',
    maxFiles: '14d',
  })
);

var debugFlag = process.env.ONWAKED_DEBUG || '';
if (parseInt(debugFlag) || debugFlag.toLowerCase() === 'true')
  logger.add(
    new winston.transports.DailyRotateFile({
      level: 'debug',
      dirname: process.env.ONWAKED_LOGDIR,
      filename: 'onwaked.debug.log.%DATE%',
      createSymlink: true,
      symlinkName: 'onwaked.debug.log',
      maxFiles: '14d',
    })
  );

var configImportPath =
  './' + path.relative(__dirname, process.env.ONWAKED_JOBS);

var checkForWakeInterval = 1000 * 10;
var lastActive = null;

var isDesktopUnlocked = function isDesktopUnlocked() {
  switch (notificationState.getSessionState()) {
    case 'SESSION_SCREEN_IS_LOCKED':
    case 'QUNS_NOT_PRESENT':
      logger.debug({ message: 'screen is locked' });
      return false;
    default:
      logger.debug({ message: 'screen is not locked' });
      return true;
  }
};

var checkForWake = function checkForWake(callback) {
  try {
    var newestActivity = Date.now() - desktopIdle.getIdleTime();
    logger.debug({
      message: 'Checking for wake',
      newestActivity: newestActivity,
      lastActive: lastActive,
    });

    var activityInterval = newestActivity - lastActive;
    var didWakeFromIdle =
      !lastActive || activityInterval >= 2 * checkForWakeInterval;
    var isUnlocked = isDesktopUnlocked();

    if (isUnlocked) {
      // We want to ignore activity that happens while we are locked,
      // but otherwise lastActive should be updated every iteration.
      lastActive = newestActivity;
    }

    if (didWakeFromIdle && isUnlocked) {
      logger.debug({
        message: 'Woke up after idle',
        checkInterval: checkForWakeInterval,
        idleTime: activityInterval,
      });

      var config = require(configImportPath);
      runJobs(config, activityInterval, function (results) {
        var totalJobs = results.successes + results.failures;
        if (totalJobs) {
          notify({
            title: 'onwaked: finished',
            message: 'ran ' + totalJobs + ' jobs',
          });
        }
        if (results.failures) {
          notify({
            title: 'onwaked: jobs failed',
            message: results.failures + ' jobs failed',
          });
        }
        callback();
      });
    } else {
      callback();
    }
  } catch (e) {
    logger.error({
      message: 'checkForWake failed to run',
      error: e.toString(),
    });
    callback();
  }
};

var notify = function notify(notification) {
  var notifState = notificationState.getSessionState();
  if (
    notifState === 'SESSION_ON_CONSOLE_KEY' ||
    notifState === 'QUNS_ACCEPTS_NOTIFICATIONS'
  ) {
    notifier.notify(notification);
  }
};

setTimeout(function callee() {
  checkForWake(function () {
    setTimeout(callee, checkForWakeInterval);
  });
}, checkForWakeInterval);
