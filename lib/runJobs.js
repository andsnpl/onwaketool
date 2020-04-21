var shell = require('shelljs');
var logger = require('../lib/logger');

var pushEnv = function pushEnv(env) {
  var oldEnv = JSON.parse(JSON.stringify(process.env));
  Object.keys(env).forEach(function (key) {
    process.env[key] = env[key];
  });
  return function popEnv() {
    process.env = oldEnv;
  };
};

var runJobEntry = function runJobEntry(jobEntry) {
  shell.pushd(jobEntry.workingDirectory || process.cwd());
  var popEnv = pushEnv(jobEntry.env || {});
  try {
    logger.info({
      message: 'Running comand',
      name: jobEntry.name,
      command: jobEntry.command,
    });
    return shell.exec(jobEntry.command);
  } finally {
    shell.popd();
    popEnv();
  }
};

var runJobsOnce = function runJobsOnce(jobEntries, idleTime) {
  var results = { done: [], retry: [] };
  state.pending.forEach(function (jobEntry) {
    if (idleTime >= jobEntry.idleTime) {
      shellResult = runJobEntry(jobEntry);
      if (shellResult.code === 0) {
        results.done.push(jobEntry);
      } else {
        logger.error({
          message: 'Error running comand',
          jobEntry: jobEntry,
          error: e,
          stdout: shellResult.stdout,
          stderr: shellResult.stderr,
        });
        results.retry.push(jobEntry);
      }
    }
  });
  return results;
};

module.exports = function runJobs(config, idleTime, callback) {
  var state = {
    retries: 0,
    pending: config.jobs || [],
    done: [],
  };
  (function callee() {
    var results = runJobsOnce(state.pending, idleTime);
    state.pending = results.retry;
    Array.prototype.push.apply(state.done, results.done);

    if (state.pending.length && state.retries < 2) {
      setTimeout(callee, 1000 * Math.pow(2, state.retries));
      state.retries++;
    } else {
      callback({
        successes: state.done.length,
        failures: state.pending.length,
      });
    }
  })();
  return results;
};
