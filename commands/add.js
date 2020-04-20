var path = require('path');
var parseArgs = require('../lib/parseArgs');
var configFiles = require('../lib/configFiles');
var defaults = require('../lib/defaults');

module.exports = function add(context, args) {
  args = parseArgs(args);
  if (!args.length) {
    throw new Error('`add` takes at least one argument');
  }
  if (!args[0].flag) args[0].flag = '-c';

  var configPath = path.join(context.dirname, defaults.DEFAULT_JOBS_CONFG_PATH);
  var jobEntry = {};
  args.forEach(function (arg) {
    switch (arg.flag) {
      case '-c':
      case '--commmand':
        jobEntry.command = arg.value;
        break;
      case '-n':
      case '--name':
        jobEntry.name = arg.value;
        break;
      case '-t':
      case '--idletime':
        jobEntry.idleTime = arg.value;
        break;
      case '-d':
      case '--workdir':
        jobEntry.workDir = path.resolve(context.dirname, arg.value);
        break;
      case '-e':
      case '--env':
        jobEntry.env = JSON.parse(arg.value);
        break;
      case '-f':
      case '--config-file':
        configFile = path.resolve(context.dirname, arg.value);
        break;
      default:
        throw new Error(
          'Unrecognized argument to `add`: ' + JSON.stringify(arg)
        );
    }
  });
  if (!jobEntry.command) {
    throw new Error('A command must be provided');
  }
  if (!jobEntry.idleTime) {
    jobEntry.idleTime = defaults.DEFAULT_JOB_IDLETIME;
  }
  configFiles.updateConfig(configPath, function (configObject) {
    if (!configObject.jobs) configObject.jobs = [];
    configObject.jobs.push(jobEntry);
  });
};
