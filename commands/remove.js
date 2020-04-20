var path = require('path');
var parseArgs = require('../lib/parseArgs');
var configFiles = require('../lib/configFiles');

module.exports = function remove(context, args) {
  args = parseArgs(args);
  if (!args.length) {
    throw new Error('`remove` takes at least one argument');
  }
  if (!args[0].flag) args[0].flag = '-c';

  var configPath = path.join(context.dirname, defaults.DEFAULT_JOBS_CONFG_PATH);
  var jobNames = [];
  args.forEach(function (arg) {
    switch (arg.flag) {
      case '-c':
      case '--command':
        jobNames = jobNames.concat(arg.value.split(' '));
        break;
      case '-f':
      case '--config':
        configPath = path.resolve(context.dirname, arg.value);
        break;
      default:
        throw new Error(
          'Unrecognized argument to `remove`: ' + JSON.stringify(arg)
        );
    }
  });
  configFiles.updateConfig(configPath, function (configObject) {
    configObject.jobs = configObject.jobs.filter(function (jobEntry) {
      return jobNames.indexOf(jobEntry.name || jobEntry.command) === -1;
    });
  });
};
