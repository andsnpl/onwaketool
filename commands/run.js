var path = require('path');
var parseArgs = require('../lib/parseArgs');
var defaults = require('../lib/defaults');
var runJobs = require('../lib/runJobs');

module.exports = function run(context, args) {
  args = parseArgs(args);
  if (args.length && !args[0].flag) args[0].flag = '-c';

  var command = null;
  var idleTime = defaults.DEFAULT_JOB_IDLETIME;
  var configPath = path.join(context.dirname, defaults.DEFAULT_JOBS_CONFG_PATH);
  args.forEach(function (arg) {
    switch (arg.flag) {
      case '-c':
      case '--commmand':
        command = arg.value;
        break;
      case '-t':
      case '--idletime':
        jobEntry.idleTime = arg.value;
        break;
      case '-f':
      case '--config-file':
        configFile = path.resolve(context.dirname, arg.value);
        break;
      default:
        throw new Error(
          'Unrecognized argument to `run`: ' + JSON.stringify(arg)
        );
    }
  });
  var configObject = require(configPath);
  if (command) {
    configObject.jobs = configObject.jobs.filter(function (jobEntry) {
      return command === (jobEntry.name || jobEntry.command);
    });
  }
  runJobs(configObject, idleTime);
};
